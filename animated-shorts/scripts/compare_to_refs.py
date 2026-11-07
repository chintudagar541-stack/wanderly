#!/usr/bin/env python3
"""Compare one of our renders against the reference shorts.

Runs scripts/analyze_video.py on the video (no caption mask by default) and prints our stats next to the
reference mean / range from writer/ref_stats/ref*.json, with PASS / WARN per metric.

Usage:
  python3 scripts/compare_to_refs.py out/diwali2/final.mp4
  python3 scripts/compare_to_refs.py out/x.mp4 --json /tmp/x.json      # reuse an existing analysis JSON
  python3 scripts/compare_to_refs.py out/x.mp4 --mask                   # video has burned-in captions
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REF_DIR = os.path.join(ROOT, "writer", "ref_stats")

# (label, getter, unit, mode, tolerance)
#   mode "range": PASS if inside [ref min - tol, ref max + tol]
#   mode "rel":   PASS if within +-tol (fraction) of the ref mean
METRICS = [
    ("camera moving (% frames)", lambda g: g["motion_frames_pct"], "%", "range", 3.0),
    ("segment length mean", lambda g: g["seg_len_mean_s"], "s", "range", 0.5),
    ("segment length max", lambda g: g["seg_len_max_s"], "s", "range", 2.0),
    ("transitions / min", lambda g: g["transitions_per_min"], "", "range", 3.0),
    ("hard cuts / min", lambda g: g["cuts_per_min"], "", "range", 0.6),
    ("dissolve length (median)", lambda g: g["dissolve_len_median_f"], "f", "range", 1.0),
    ("zoom speed mean", lambda g: g["zoom_speed_mean_pct_s"], "%/s", "range", 5.0),
    ("zoom speed peak (p99)", lambda g: g["zoom_speed_peak_pct_s"], "%/s", "range", 40.0),
    ("pan speed mean", lambda g: g["pan_speed_mean_pctW_s"], "%W/s", "range", 5.0),
    ("rotation speed mean", lambda g: g["rot_speed_mean_deg_s"], "deg/s", "range", 1.0),
    ("luma mean (0-255)", lambda g: g["colour"]["luma"], "", "range", 8.0),
    ("black point (pixel p2)", lambda g: g["colour"]["black"], "", "range", 6.0),
    ("white point (pixel p98)", lambda g: g["colour"]["white"], "", "range", 8.0),
    ("darkest shots (frame p05)", lambda g: g["colour"]["luma_p05"], "", "range", 8.0),
    ("contrast (luma std)", lambda g: g["colour"]["contrast"], "", "range", 4.0),
    ("saturation mean", lambda g: g["colour"]["sat"], "", "range", 0.04),
    ("saturation p90", lambda g: g["colour"]["sat_p90"], "", "range", 0.04),
    ("vignette (corner/centre)", lambda g: g["colour"]["vignette"], "", "range", 0.06),
]


def load_refs():
    refs = []
    for p in sorted(glob.glob(os.path.join(REF_DIR, "ref*.json"))):
        with open(p) as fh:
            refs.append(json.load(fh))
    if not refs:
        sys.exit(f"no reference stats in {REF_DIR}")
    return refs


def get(fn, g):
    try:
        v = fn(g)
        return None if v is None else float(v)
    except (KeyError, TypeError):
        return None


def fmt(v, unit=""):
    if v is None:
        return "-"
    s = f"{v:.3f}" if abs(v) < 2 else f"{v:.1f}"
    return s + (unit and f" {unit}" if unit not in ("%", "f", "s") else unit)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--json", help="existing analysis JSON for this video (skip the analysis)")
    ap.add_argument("--mask", action="store_true", help="mask the caption band (video has burned-in captions)")
    ap.add_argument("--out", help="output prefix for the analysis (default: a temp dir)")
    a = ap.parse_args()

    if a.json:
        with open(a.json) as fh:
            ours = json.load(fh)
    else:
        out = a.out or os.path.join(tempfile.mkdtemp(prefix="cmp_"), "ours")
        cmd = [sys.executable, os.path.join(HERE, "analyze_video.py"), a.video, "--out", out]
        if not a.mask:
            cmd.append("--no-mask")
        print("running:", " ".join(cmd), file=sys.stderr)
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
        with open(out + ".json") as fh:
            ours = json.load(fh)
        print(f"analysis: {out}.csv / {out}.json", file=sys.stderr)

    refs = load_refs()
    g = ours["global"]
    names = [r["label"] for r in refs]
    print(f"\nOUR VIDEO: {a.video}  ({g['duration_s']} s, {g['width']}x{g['height']}, "
          f"{g['n_cuts']} cuts, {g['n_dissolves']} dissolves, {g.get('n_whips', 0)} whips)")
    print(f"REFERENCES: {', '.join(names)}\n")
    head = f"{'metric':28s} {'ours':>10s} {'ref mean':>10s} {'ref range':>17s}  verdict"
    print(head)
    print("-" * len(head))
    n_warn = 0
    for label, fn, unit, mode, tol in METRICS:
        rv = [v for v in (get(fn, r["global"]) for r in refs) if v is not None]
        ov = get(fn, g)
        if not rv:
            continue
        mean, lo, hi = sum(rv) / len(rv), min(rv), max(rv)
        if ov is None:
            verdict = "WARN (none)" if "dissolve" in label else "n/a"
        elif mode == "range":
            if lo - tol <= ov <= hi + tol:
                verdict = "PASS"
            else:
                verdict = "WARN " + ("(too low)" if ov < lo - tol else "(too high)")
        else:
            verdict = "PASS" if abs(ov - mean) <= tol * abs(mean) else "WARN"
        if verdict.startswith("WARN"):
            n_warn += 1
        print(f"{label:28s} {fmt(ov):>10s} {fmt(mean):>10s} {fmt(lo) + ' .. ' + fmt(hi):>17s}  {verdict}")
    # motion type mix
    def mix(gg):
        c = gg.get("segment_motion_counts", {})
        t = sum(c.values()) or 1
        return {k: round(100 * v / t) for k, v in sorted(c.items(), key=lambda kv: -kv[1])}
    print("\nsegment move types (% of segments >= 12 frames)")
    print("  ours:", mix(g))
    agg = {}
    for r in refs:
        for k, v in r["global"].get("segment_motion_counts", {}).items():
            agg[k] = agg.get(k, 0) + v
    tot = sum(agg.values()) or 1
    print("  refs:", {k: round(100 * v / tot) for k, v in sorted(agg.items(), key=lambda kv: -kv[1])})
    print(f"\n{n_warn} WARN(s)")


if __name__ == "__main__":
    main()
