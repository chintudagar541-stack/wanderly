#!/usr/bin/env python3
"""Frame-by-frame look/camera/transition analysis for vertical shorts.

For every frame it measures colour (luma, saturation, hue, contrast, vignette), the difference to the previous
frame, and the global camera motion (dx, dy, zoom, rotation from LK optical flow + a RANSAC similarity fit on a
~240 px grey frame).  It then finds hard cuts and dissolves, splits the video into segments and classifies the
camera move of each segment.

Outputs:  <out_prefix>.csv   one row per frame
          <out_prefix>.json  summary: global stats + segments + transitions

Usage:
  python3 scripts/analyze_video.py ref.mp4 --out /tmp/x/ref1            # references (caption band masked)
  python3 scripts/analyze_video.py out/foo.mp4 --no-mask --out /tmp/x/foo  # our renders (no captions)

Reference captions sit at ~69-72 % of the height (word pops reach 64-78 %), so the default mask band is
0.64-0.78.  Change with --mask-band 0.40,0.52 (several bands: --mask-band 0.40,0.52 --mask-band 0.64,0.78).

Sign conventions (all "content" motion, i.e. how the picture moves on screen):
  dx > 0   picture moves right  (camera pans / trucks left)
  dy > 0   picture moves down   (camera tilts / cranes up)
  zoom > 1 picture grows        (push-in / dolly-in / zoom-in)
  rot      degrees, counter-clockwise positive
dx/dy are in fraction of frame WIDTH per frame, so numbers compare across resolutions.
"""
import argparse
import csv
import json
import math
import os
import sys

import cv2
import numpy as np

cv2.setNumThreads(2)

MOTION_W = 240          # width of the grey frame used for motion
COLOR_W = 180           # width used for colour stats
BLEND_W = 48            # tiny frame used for the dissolve blend test

# ---- thresholds (tuned on the 5 references, 2026-11-07) ---------------------------------------------------------
CUT_DIFF_MIN = 0.075     # min mean-abs-diff (0..1) of the blurred grey frame for a hard cut
CUT_SPIKE_RATIO = 2.4    # cut frame diff must be this many times the local median diff
CUT_HIST_MIN = 0.22      # min hue/lum histogram distance (Bhattacharyya) for a cut
DIS_MIN_LEN, DIS_MAX_LEN = 3, 16   # dissolve length in frames (frames strictly between the two clean frames)
DIS_END_MIN = 0.095      # min difference between the frame before and after a dissolve
DIS_BLEND_MAX = 0.42     # max (blend residual / endpoint difference) for the middle frames
DIS_WEAK, DIS_WEAK_ERR = 0.105, 0.30
DIS_CTX_MIN = 0.6        # endpoint diff / diff of equal windows just before and after (scene change vs. steady move)
DIS_MOTION_EXPLAINS = 0.55  # if the motion-compensated residual is below this * endpoint diff it is a move, not a dissolve
WHIP_T = 0.06            # translation >= 6 %W per frame (1.8 W/s) = whip-pan frame
WHIP_PEAK = 0.10         # a whip must peak at >= 10 %W per frame (3 W/s)
WHIP_MIN_LEN = 3
STATIC_ZOOM = 0.0008     # |log zoom| per frame below this = no zoom (0.08 %/frame = 2.4 %/s)
STATIC_T = 0.0012        # |translation| per frame (fraction of width) below this = no pan (3.6 %W/s)
STATIC_ROT = 0.03        # deg / frame


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--out", required=True, help="output prefix (writes <out>.csv and <out>.json)")
    ap.add_argument("--no-mask", action="store_true", help="do not mask a caption band (our own renders)")
    ap.add_argument("--mask-band", action="append", default=None,
                    help="caption band as top,bottom fractions of height (repeatable). Default 0.64,0.78")
    ap.add_argument("--label", default=None, help="name stored in the JSON")
    ap.add_argument("--max-frames", type=int, default=0)
    return ap.parse_args()


# ---------------------------------------------------------------------------------------------------------------
def band_mask(h, w, bands):
    m = np.full((h, w), 255, np.uint8)
    for a, b in bands:
        m[int(a * h):int(math.ceil(b * h)), :] = 0
    return m


def hist_lab(hsv, mask):
    h = cv2.calcHist([hsv], [0, 2], mask, [12, 8], [0, 180, 0, 256])
    cv2.normalize(h, h, 1, 0, cv2.NORM_L1)
    return h


def colour_stats(bgr_small, hsv, mask_bool, regions):
    f = bgr_small.astype(np.float32)
    y = 0.0722 * f[..., 0] + 0.7152 * f[..., 1] + 0.2126 * f[..., 2]
    yv = y[mask_bool]
    s = hsv[..., 1].astype(np.float32)[mask_bool] / 255.0
    hue = hsv[..., 0].astype(np.float32)[mask_bool] * 2.0  # degrees
    # saturation-weighted circular mean hue + hue histogram (6 bins of 60 deg, weighted by saturation)
    wts = s + 1e-6
    ang = np.deg2rad(hue)
    hx, hy = (wts * np.cos(ang)).sum(), (wts * np.sin(ang)).sum()
    hue_mean = (math.degrees(math.atan2(hy, hx)) + 360) % 360
    hue_conc = math.hypot(hx, hy) / wts.sum()
    bins = np.histogram((hue + 30) % 360, bins=6, range=(0, 360), weights=wts)[0]
    bins = bins / max(bins.sum(), 1e-9)
    # warm = red/orange/yellow (330..90), cool = cyan/blue/violet (150..300)
    warm = float(bins[0] + bins[1])
    cool = float(bins[3] + bins[4])
    cy0, cy1, cx0, cx1, corners = regions
    centre = float(y[cy0:cy1, cx0:cx1].mean())
    corner = float(np.mean([y[a:b, c:d].mean() for a, b, c, d in corners]))
    return {
        "luma": float(yv.mean()), "contrast": float(yv.std()), "sat": float(s.mean()),
        "black": float(np.percentile(yv, 2)), "white": float(np.percentile(yv, 98)),
        "sat_p90": float(np.percentile(s, 90)),
        "hue_mean": hue_mean, "hue_conc": hue_conc,
        "h_red": bins[0], "h_yel": bins[1], "h_grn": bins[2], "h_cyn": bins[3], "h_blu": bins[4], "h_mag": bins[5],
        "warm": warm, "cool": cool,
        "vig_centre": centre, "vig_corner": corner, "vignette": corner / max(centre, 1.0),
    }


def estimate_motion(prev_g, g, mask):
    """LK flow on corners + RANSAC similarity. Returns dict (dx,dy in px of the motion frame)."""
    res = {"dx": 0.0, "dy": 0.0, "zoom": 1.0, "rot": 0.0, "n_pts": 0, "inlier": 0.0, "resid": 0.0,
           "flow_mag": 0.0, "ok": 0}
    p0 = cv2.goodFeaturesToTrack(prev_g, maxCorners=220, qualityLevel=0.01, minDistance=6, mask=mask, blockSize=5)
    if p0 is None or len(p0) < 12:
        return res
    p1, st, err = cv2.calcOpticalFlowPyrLK(prev_g, g, p0, None, winSize=(21, 21), maxLevel=3,
                                           criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 20, 0.03))
    if p1 is None:
        return res
    st = st.reshape(-1).astype(bool)
    a, b = p0.reshape(-1, 2)[st], p1.reshape(-1, 2)[st]
    # forward-backward check
    if len(a) >= 12:
        pb, st2, _ = cv2.calcOpticalFlowPyrLK(g, prev_g, b.reshape(-1, 1, 2), None, winSize=(21, 21), maxLevel=3)
        fb = np.linalg.norm(pb.reshape(-1, 2) - a, axis=1)
        keep = (st2.reshape(-1).astype(bool)) & (fb < 1.0)
        a, b = a[keep], b[keep]
    res["n_pts"] = int(len(a))
    if len(a) < 10:
        return res
    M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=1.0, maxIters=500,
                                         confidence=0.98)
    if M is None:
        return res
    inl = inl.reshape(-1).astype(bool)
    s = math.hypot(M[0, 0], M[1, 0])
    rot = math.degrees(math.atan2(M[1, 0], M[0, 0]))
    h, w = g.shape
    cx, cy = w / 2.0, h / 2.0
    # translation of the frame centre
    ccx = M[0, 0] * cx + M[0, 1] * cy + M[0, 2]
    ccy = M[1, 0] * cx + M[1, 1] * cy + M[1, 2]
    pred = a @ M[:, :2].T + M[:, 2]
    resid = np.linalg.norm(pred - b, axis=1)
    flow = np.linalg.norm(b - a, axis=1)
    res.update(dx=float(ccx - cx), dy=float(ccy - cy), zoom=float(s), rot=float(rot),
               inlier=float(inl.mean()), resid=float(np.median(resid)),
               # parallax: spread of the residual among all tracked points (depth-dependent motion)
               flow_mag=float(np.median(flow)), ok=1)
    res["parallax"] = float(np.percentile(resid, 75))
    return res


def blur_small(g):
    return cv2.GaussianBlur(g, (5, 5), 0).astype(np.float32) / 255.0


# ---------------------------------------------------------------------------------------------------------------
def analyse(path, out, no_mask, bands, label, max_frames):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        sys.exit(f"cannot open {path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    W, H = int(cap.get(3)), int(cap.get(4))
    mw, mh = MOTION_W, int(round(MOTION_W * H / W / 2) * 2)
    cw, ch = COLOR_W, int(round(COLOR_W * H / W))
    bw, bh = BLEND_W, int(round(BLEND_W * H / W))
    bands = [] if no_mask else bands
    mmask = band_mask(mh, mw, bands)
    # keep features off the outer 3 % (letterbox / encoder edge junk)
    e = int(0.03 * mw)
    mmask[:e, :] = 0; mmask[-e:, :] = 0; mmask[:, :e] = 0; mmask[:, -e:] = 0
    cmask = band_mask(ch, cw, bands)
    cmask_b = cmask > 0
    bmask = band_mask(bh, bw, bands) > 0
    # vignette regions: centre 40 % box vs four corner boxes (15 % w x 9 % h)
    regions = (int(0.30 * ch), int(0.60 * ch), int(0.30 * cw), int(0.70 * cw),
               [(0, int(0.09 * ch), 0, int(0.15 * cw)), (0, int(0.09 * ch), int(0.85 * cw), cw),
                (int(0.91 * ch), ch, 0, int(0.15 * cw)), (int(0.91 * ch), ch, int(0.85 * cw), cw)])
    if any(a < 0.30 < b or a < 0.60 < b for a, b in bands):
        pass  # centre box may overlap the band; colour mask is not applied to the vignette boxes on purpose

    rows, smalls, hists = [], [], []
    prev_g = prev_b = None
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if max_frames and i >= max_frames:
            break
        g = cv2.cvtColor(cv2.resize(fr, (mw, mh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        c = cv2.resize(fr, (cw, ch), interpolation=cv2.INTER_AREA)
        hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)
        b = cv2.resize(fr, (bw, bh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        b = cv2.GaussianBlur(b, (3, 3), 0)
        row = {"frame": i, "t": i / fps}
        row.update(colour_stats(c, hsv, cmask_b, regions))
        hst = hist_lab(hsv, cmask)
        if prev_g is None:
            row.update(diff=0.0, hist_d=0.0, dx=0.0, dy=0.0, zoom=1.0, rot=0.0, n_pts=0, inlier=0.0, resid=0.0,
                       flow_mag=0.0, parallax=0.0, ok=0)
        else:
            d = np.abs(b - prev_b)[bmask].mean()
            row["diff"] = float(d)
            row["hist_d"] = float(cv2.compareHist(hists[-1], hst, cv2.HISTCMP_BHATTACHARYYA))
            m = estimate_motion(prev_g, g, mmask)
            m.setdefault("parallax", 0.0)
            m["dx"] /= mw; m["dy"] /= mw
            m["resid"] /= mw; m["parallax"] /= mw; m["flow_mag"] /= mw
            row.update(m)
        rows.append(row)
        smalls.append(b)
        hists.append(hst)
        prev_g, prev_b = g, b
        i += 1
    cap.release()
    n = len(rows)
    if n < 3:
        sys.exit("video too short")

    trans = detect_transitions(rows, smalls, bmask)
    mark_transition_frames(rows, trans)
    segs = build_segments(rows, trans, fps)
    summary = global_summary(rows, segs, trans, fps, W, H, path, label, bands)

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    keys = list(rows[0].keys())
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(out + ".csv", "w", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=keys)
        wr.writeheader()
        for r in rows:
            wr.writerow({k: (round(v, 6) if isinstance(v, float) else v) for k, v in r.items()})
    with open(out + ".json", "w") as fh:
        json.dump(summary, fh, indent=1)
    return summary


# ---------------------------------------------------------------------------------------------------------------
def local_median(x, i, r=6, exclude=1):
    lo, hi = max(0, i - r), min(len(x), i + r + 1)
    vals = [x[j] for j in range(lo, hi) if abs(j - i) > exclude]
    return float(np.median(vals)) if vals else 0.0


def masked_dist(a, b, m):
    return float(np.abs(a - b)[m].mean())


def blend_fit(fa, fb, fm, m):
    """Least-squares alpha with fm ~ (1-alpha) fa + alpha fb; returns (alpha, residual)."""
    da = (fb - fa)[m].ravel()
    dm = (fm - fa)[m].ravel()
    den = float(da @ da)
    if den < 1e-9:
        return 0.0, masked_dist(fm, fa, m)
    al = float(np.clip((da @ dm) / den, 0, 1))
    pred = fa + al * (fb - fa)
    return al, masked_dist(fm, pred, m)


def motion_comp_resid(rows, a, b, smalls, m):
    """Warp frame a by the chained similarity transforms a->b and measure the residual to frame b."""
    T = np.eye(3)
    for j in range(a + 1, b + 1):
        r = rows[j]
        if not r.get("ok"):
            return None
        s, th = r["zoom"], math.radians(r["rot"])
        bh, bw = smalls[0].shape[:2]
        # build transform about the centre in the blend-frame pixel units
        cx, cy = bw / 2, bh / 2
        c, si = s * math.cos(th), s * math.sin(th)
        A = np.array([[c, -si, 0], [si, c, 0], [0, 0, 1.0]])
        C = np.array([[1, 0, cx], [0, 1, cy], [0, 0, 1.0]])
        Ci = np.array([[1, 0, -cx], [0, 1, -cy], [0, 0, 1.0]])
        Tt = np.array([[1, 0, r["dx"] * bw], [0, 1, r["dy"] * bw], [0, 0, 1.0]])
        T = Tt @ C @ A @ Ci @ T
    bh, bw = smalls[a].shape[:2]
    wa = cv2.warpAffine(smalls[a], T[:2], (bw, bh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    valid = cv2.warpAffine(np.ones((bh, bw), np.float32), T[:2], (bw, bh)) > 0.99
    mm = m & valid
    if mm.sum() < 0.3 * m.sum():
        return None
    return masked_dist(wa, smalls[b], mm)


def detect_transitions(rows, smalls, m):
    n = len(rows)
    diff = [r["diff"] for r in rows]
    hd = [r["hist_d"] for r in rows]
    trans = []
    used = np.zeros(n, bool)
    # ---- hard cuts: single-frame spike ------------------------------------------------------------------------
    for i in range(1, n):
        med = local_median(diff, i, 6, 1)
        nb = max(diff[i - 1] if i > 1 else 0, diff[i + 1] if i + 1 < n else 0)
        r = rows[i]
        if diff[i] >= CUT_DIFF_MIN and diff[i] >= CUT_SPIKE_RATIO * max(med, 0.01) and diff[i] >= 1.8 * nb \
                and (hd[i] >= CUT_HIST_MIN or r["inlier"] < 0.5):
            # a cut is not a blend of its neighbours
            if 1 < i < n - 1:
                al, res = blend_fit(smalls[i - 1], smalls[i + 1], smalls[i], m)
                e = masked_dist(smalls[i - 1], smalls[i + 1], m)
                if 0.25 < al < 0.75 and res < 0.35 * e:
                    continue  # 1-frame blend = very short dissolve, handled below
            trans.append({"type": "cut", "start": i, "end": i, "frames": 0, "strength": round(diff[i], 4)})
            used[i] = True
    # ---- dissolves: ramp of 3-12 blended frames between two clean frames ----------------------------------------
    cands = []
    for a in range(0, n - DIS_MIN_LEN - 1):
        for L in range(DIS_MIN_LEN, DIS_MAX_LEN + 1):
            b = a + L + 1          # a and b are the clean frames; a+1..b-1 are blended
            if b >= n:
                break
            if used[a + 1:b + 1].any():
                break
            e = masked_dist(smalls[a], smalls[b], m)
            if e < DIS_END_MIN:
                continue
            # change must be spread: no single step carries most of it
            steps = diff[a + 1:b + 1]
            if max(steps) > 0.6 * sum(steps):
                continue
            alphas, worst = [], 0.0
            for j in range(a + 1, b):
                al, res = blend_fit(smalls[a], smalls[b], smalls[j], m)
                alphas.append(al)
                worst = max(worst, res / e)
            if worst > DIS_BLEND_MAX:
                continue
            if e < DIS_WEAK and worst > DIS_WEAK_ERR:
                continue  # weak change + poor blend fit = parallax / character motion, not a cross-fade
            # alphas must climb roughly monotonically from ~0 to ~1
            if alphas[-1] - alphas[0] < 0.35 or np.any(np.diff(alphas) < -0.12):
                continue
            if max(alphas) < 0.6 or min(alphas) > 0.4:
                continue
            mc = motion_comp_resid(rows, a, b, smalls, m)
            if mc is not None and mc < DIS_MOTION_EXPLAINS * e:
                continue
            # crossfade signature: the middle frame is closer to the blend than to either end
            mid = (a + b) // 2
            _, rmid = blend_fit(smalls[a], smalls[b], smalls[mid], m)
            dmid = min(masked_dist(smalls[mid], smalls[a], m), masked_dist(smalls[mid], smalls[b], m))
            if rmid > 0.6 * dmid:
                continue
            ctxv = []
            if a - (b - a) >= 0:
                ctxv.append(masked_dist(smalls[a - (b - a)], smalls[a], m))
            if b + (b - a) < n:
                ctxv.append(masked_dist(smalls[b], smalls[b + (b - a)], m))
            ctx = e / max(np.mean(ctxv), 0.005) if ctxv else 9.0
            if ctx < DIS_CTX_MIN:
                continue
            score = e * (1 - worst)
            cands.append((score, a, b, worst, e, ctx))
    cands.sort(reverse=True)
    for score, a, b, worst, e, ctx in cands:
        if used[a + 1:b].any() or used[a] and used[b]:
            continue
        # trim the window to the actual ramp: drop leading frames still ~= the old shot (alpha < 0.07)
        # and trailing frames already ~= the new shot (alpha > 0.93)
        s0, s1 = a + 1, b - 1
        al = {j: blend_fit(smalls[a], smalls[b], smalls[j], m)[0] for j in range(s0, s1 + 1)}
        while s0 < s1 and al[s0] < 0.07:
            s0 += 1
        while s1 > s0 and al[s1] > 0.93:
            s1 -= 1
        if s1 - s0 + 1 < 2:
            continue
        trans.append({"type": "dissolve", "start": s0, "end": s1, "frames": s1 - s0 + 1,
                      "strength": round(e, 4), "blend_err": round(worst, 3), "ctx": round(ctx, 2)})
        used[a + 1:b] = True
    # ---- whip pans: burst of very fast (motion-blurred) camera travel, used as a transition ------------------
    sp = np.array([math.hypot(r["dx"], r["dy"]) if r.get("ok") and r["inlier"] >= 0.15 else -1.0 for r in rows])
    fast = sp >= WHIP_T
    for _ in range(3):  # frames where tracking failed inside a fast run (pure blur) count as fast
        for i in range(1, n - 1):
            if sp[i] < 0 and diff[i] >= 0.10 and (fast[i - 1] or fast[i + 1]):
                fast[i] = True
    i = 1
    while i < n:
        if not fast[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and (fast[j + 1] or (j + 2 < n and fast[j + 2])):
            j += 1
        L = j - i + 1
        pk = float(sp[i:j + 1].max())
        if L >= WHIP_MIN_LEN and pk >= WHIP_PEAK and not used[i:j + 1].any():
            dxs = [rows[k]["dx"] for k in range(i, j + 1) if sp[k] > 0]
            dys = [rows[k]["dy"] for k in range(i, j + 1) if sp[k] > 0]
            ddx, ddy = float(np.sum(dxs)), float(np.sum(dys))
            dirn = ("left" if ddx > 0 else "right") if abs(ddx) >= abs(ddy) else ("up" if ddy > 0 else "down")
            a0, b0 = max(i - 1, 0), min(j + 1, n - 1)
            new_place = masked_dist(smalls[a0], smalls[b0], m) > 0.12
            trans.append({"type": "whip", "start": i, "end": j, "frames": L, "strength": round(pk, 4),
                          "peak_pctW_per_s": round(pk / rows[1]["t"] * 100, 0), "camera_dir": dirn,
                          "new_view": bool(new_place)})
            used[i:j + 1] = True
        i = j + 1
    trans.sort(key=lambda t: t["start"])
    # merge dissolves that touch (a long cross-fade under a fast move is sometimes found as two pieces)
    merged = []
    for t in trans:
        p = merged[-1] if merged else None
        if p and p["type"] == t["type"] == "dissolve" and t["start"] - p["end"] <= 3:
            p["end"] = t["end"]
            p["frames"] = p["end"] - p["start"] + 1
            p["strength"] = max(p["strength"], t["strength"])
            continue
        merged.append(t)
    return merged


def mark_transition_frames(rows, trans):
    for r in rows:
        r["trans"] = ""
    for t in trans:
        for j in range(t["start"], t["end"] + 1):
            rows[j]["trans"] = t["type"]


# ---------------------------------------------------------------------------------------------------------------
def smooth(x, k=5):
    if len(x) < k:
        return np.asarray(x, float)
    ker = np.ones(k) / k
    return np.convolve(np.pad(x, (k // 2, k // 2), mode="edge"), ker, mode="valid")


def speed_profile(sp):
    """sp: per-frame camera speed inside a segment."""
    n = len(sp)
    if n < 9 or np.mean(sp) < 1e-9:
        return "none"
    s = smooth(sp, 5)
    t = max(n // 3, 2)
    a, mid, c = s[:t].mean(), s[t:n - t].mean() if n - 2 * t > 0 else s.mean(), s[-t:].mean()
    pk = int(np.argmax(s)) / max(n - 1, 1)
    if mid > 1.35 * max(a, c):
        return "ease-in-out"
    if a > 1.5 * c:
        return "ease-out"
    if c > 1.5 * a:
        return "ease-in"
    return "constant"


def classify_segment(seg_rows, fps):
    ok = [r for r in seg_rows if r.get("ok") and r["inlier"] > 0.3]
    n = len(seg_rows)
    if n == 0:
        return {}
    cov = len(ok) / n
    if len(ok) < max(3, 0.3 * n):
        return {"motion": "unknown", "profile": "none", "tracked_frac": round(cov, 2)}
    lz = np.array([math.log(r["zoom"]) for r in ok])
    dx = np.array([r["dx"] for r in ok]); dy = np.array([r["dy"] for r in ok])
    rot = np.array([r["rot"] for r in ok])
    par = np.array([r.get("parallax", 0.0) for r in ok])
    tr = np.hypot(dx, dy)
    # zoom in "equivalent translation": |log s| * half diagonal-ish (0.5 of width)
    zt = np.abs(lz) * 0.5
    speed = tr + zt
    mz, mdx, mdy, mrot = lz.mean(), dx.mean(), dy.mean(), rot.mean()
    # jitter = high-freq part of the translation (frame-to-frame changes)
    jit = float(np.median(np.abs(np.diff(dx))) + np.median(np.abs(np.diff(dy)))) if len(ok) > 3 else 0.0
    sign_flip = float(np.mean(np.sign(dx[1:]) != np.sign(dx[:-1]))) if len(ok) > 3 else 0.0
    moving = (np.abs(lz) > STATIC_ZOOM) | (tr > STATIC_T) | (np.abs(rot) > STATIC_ROT)
    mov_frac = float(moving.mean())
    comp = {
        "push-in": max(mz, 0) * 0.5, "pull-out": max(-mz, 0) * 0.5,
        "pan": abs(mdx), "tilt": abs(mdy),
    }
    best = max(comp, key=comp.get)
    netmag = comp[best]
    mean_speed = float(speed.mean())
    if mov_frac < 0.3 or mean_speed < 0.6 * STATIC_T:
        motion = "static"
    elif jit > 0.0025 and sign_flip > 0.45 and netmag < 0.5 * mean_speed:
        motion = "shake"
    else:
        motion = best
        # orbit / parallax: strong lateral move with depth-dependent residual or steady rotation of the view
        if best in ("pan", "tilt") and np.median(par) > 0.35 * np.median(tr) and np.median(tr) > STATIC_T:
            motion = "orbit/parallax"
        if netmag < 0.35 * mean_speed:
            # motion that does not add up in one direction = drifting / handheld / mixed beats
            motion = "mixed" if jit < 0.0025 else "shake"
    beats = []
    return {
        "motion": motion, "profile": speed_profile(speed), "tracked_frac": round(cov, 2),
        "moving_frac": round(mov_frac, 2),
        "zoom_pct_per_s": round(mz * fps * 100, 2),
        "pan_pctW_per_s": round(mdx * fps * 100, 2), "tilt_pctW_per_s": round(mdy * fps * 100, 2),
        "rot_deg_per_s": round(mrot * fps, 2),
        "speed_pctW_per_s": round(mean_speed * fps * 100, 2),
        "peak_speed_pctW_per_s": round(float(np.percentile(speed, 95)) * fps * 100, 2),
        "total_zoom_pct": round((math.exp(lz.sum() * n / len(ok)) - 1) * 100, 1),
        "total_pan_pctW": round(dx.sum() * n / len(ok) * 100, 1),
        "total_tilt_pctW": round(dy.sum() * n / len(ok) * 100, 1),
        "jitter": round(jit * 1000, 2),
    }


COLOR_KEYS = ["luma", "black", "white", "contrast", "sat", "sat_p90", "warm", "cool", "vignette", "h_red", "h_yel", "h_grn", "h_cyn",
              "h_blu", "h_mag"]


def build_segments(rows, trans, fps):
    n = len(rows)
    bounds = []  # (seg_start, seg_end, in_type, out_type)
    cur, cur_in = 0, "start"
    for t in trans:
        end = t["start"] - 1
        if end >= cur:
            bounds.append((cur, end, cur_in, t["type"]))
        cur, cur_in = t["end"] + 1, t["type"]
        if t["type"] == "cut":
            cur = t["start"]
    if cur <= n - 1:
        bounds.append((cur, n - 1, cur_in, "end"))
    segs = []
    for a, b, tin, tout in bounds:
        sr = rows[a:b + 1]
        # motion frames inside the segment exclude its first frame (that diff spans the transition)
        mr = sr[1:] if tin == "cut" else sr
        seg = {"start": a, "end": b, "t0": round(a / fps, 2), "frames": b - a + 1, "dur_s": round((b - a + 1) / fps, 2),
               "in": tin, "out": tout}
        seg.update(classify_segment(mr, fps))
        seg["colour"] = {k: round(float(np.mean([r[k] for r in sr])), 4) for k in COLOR_KEYS}
        segs.append(seg)
    return segs


def global_summary(rows, segs, trans, fps, W, H, path, label, bands):
    n = len(rows)
    cuts = [t for t in trans if t["type"] == "cut"]
    dis = [t for t in trans if t["type"] == "dissolve"]
    whips = [t for t in trans if t["type"] == "whip"]
    ok = [r for r in rows if r.get("ok") and r["inlier"] > 0.3 and not r["trans"]]
    lz = np.array([math.log(r["zoom"]) for r in ok]) if ok else np.zeros(1)
    tr = np.array([math.hypot(r["dx"], r["dy"]) for r in ok]) if ok else np.zeros(1)
    rot = np.array([r["rot"] for r in ok]) if ok else np.zeros(1)
    moving = (np.abs(lz) > STATIC_ZOOM) | (tr > STATIC_T) | (np.abs(rot) > STATIC_ROT)
    zs = np.abs(lz)[np.abs(lz) > STATIC_ZOOM]
    durs = [s["dur_s"] for s in segs]
    long_segs = [s for s in segs if s["frames"] >= 12]
    motions = {}
    for s in long_segs:
        motions[s["motion"]] = motions.get(s["motion"], 0) + 1
    profiles = {}
    for s in long_segs:
        profiles[s["profile"]] = profiles.get(s["profile"], 0) + 1
    col = {k: round(float(np.mean([r[k] for r in rows])), 4) for k in COLOR_KEYS}
    col["luma_p05"] = round(float(np.percentile([r["luma"] for r in rows], 5)), 2)
    col["luma_p95"] = round(float(np.percentile([r["luma"] for r in rows], 95)), 2)
    col["hue_mean"] = round(float(np.degrees(np.angle(np.mean([np.exp(1j * np.radians(r["hue_mean"])) for r in rows])))) % 360, 1)
    dur = n / fps
    g = {
        "frames": n, "duration_s": round(dur, 2), "fps": fps, "width": W, "height": H,
        "n_cuts": len(cuts), "n_dissolves": len(dis), "n_whips": len(whips), "n_transitions": len(trans),
        "whips_per_min": round(len(whips) / dur * 60, 1),
        "whip_len_median_f": float(np.median([t["frames"] for t in whips])) if whips else None,
        "transitions_per_min": round(len(trans) / dur * 60, 1),
        "cuts_per_min": round(len(cuts) / dur * 60, 1), "dissolves_per_min": round(len(dis) / dur * 60, 1),
        "n_segments": len(segs),
        "seg_len_mean_s": round(float(np.mean(durs)), 2), "seg_len_median_s": round(float(np.median(durs)), 2),
        "seg_len_max_s": round(float(np.max(durs)), 2),
        "dissolve_len_median_f": float(np.median([t["frames"] for t in dis])) if dis else None,
        "dissolve_len_mean_f": round(float(np.mean([t["frames"] for t in dis])), 1) if dis else None,
        "motion_frames_pct": round(100 * float(moving.mean()), 1),
        "tracked_frames_pct": round(100 * len(ok) / n, 1),
        "zoom_speed_mean_pct_s": round(float(np.mean(np.abs(lz))) * fps * 100, 2),
        "zoom_speed_moving_mean_pct_s": round(float(zs.mean()) * fps * 100, 2) if len(zs) else 0.0,
        "zoom_speed_peak_pct_s": round(float(np.percentile(np.abs(lz), 99)) * fps * 100, 2),
        "pan_speed_mean_pctW_s": round(float(tr.mean()) * fps * 100, 2),
        "pan_speed_peak_pctW_s": round(float(np.percentile(tr, 99)) * fps * 100, 2),
        "rot_speed_mean_deg_s": round(float(np.mean(np.abs(rot))) * fps, 2),
        "segment_motion_counts": motions, "segment_profile_counts": profiles,
        "colour": col,
    }
    return {"label": label or os.path.basename(path), "source": os.path.basename(path),
            "mask_bands": bands, "global": g, "transitions": trans, "segments": segs}


def main():
    a = parse_args()
    bands = [(0.64, 0.78)]
    if a.mask_band:
        bands = [tuple(float(x) for x in s.split(",")) for s in a.mask_band]
    s = analyse(a.video, a.out, a.no_mask, bands, a.label, a.max_frames)
    g = s["global"]
    print(json.dumps({k: v for k, v in g.items() if k not in ("colour",)}, indent=None))
    print("colour:", json.dumps(g["colour"]))
    for t in s["transitions"]:
        print(f"  {t['type']:9s} f{t['start']:5d}-{t['end']:5d} ({t['start'] / g['fps']:6.2f}s) len={t['frames']}"
              f" strength={t['strength']} ctx={t.get('ctx', '')} err={t.get('blend_err', '')}")


if __name__ == "__main__":
    main()
