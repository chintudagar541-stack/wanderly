// Audio mixing with FFmpeg.  Cues come from scene.audio and from dialogue lines that name an
// audio file.  A cue whose file does not exist is reported and skipped - never replaced by
// anything invented.
//
// scene.audio: [{ src: "audio/ambient/rain.wav", t: 0, vol: 0.6, loop: true, dur: 8, fadeIn: 1, fadeOut: 1, kind: "ambient|music|sfx|voice" }]
// dialogue:    { who, t0, t1, text, audio: "audio/dialogue/ep1/adrian_001.wav", vol: 1 }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function collectCues(scene) {
  const cues = [...(scene.audio || [])];
  for (const sh of scene.shots || []) for (const d of sh.dialogue || []) if (d.audio) cues.push({ src: d.audio, t: d.t0, vol: d.vol ?? 1, kind: 'voice' });
  return cues;
}

export async function mixAudio(root, scene, videoIn, out, { from = 0, to = Infinity } = {}) {
  const used = [], missing = [];
  const dur = Math.min(to, scene.duration ?? to) - from;
  for (const c of collectCues(scene)) {
    const f = path.resolve(root, c.src);
    if (!fs.existsSync(f)) { missing.push(c.src); continue; }
    const end = c.t + (c.dur ?? 1e9);
    if (end <= from || c.t >= from + dur) continue;
    used.push({ ...c, file: f });
  }
  if (!used.length) { fs.copyFileSync(videoIn, out); return { used, missing }; }
  const inputs = ['-i', videoIn]; const parts = []; const labels = [];
  used.forEach((c, i) => {
    if (c.loop) inputs.push('-stream_loop', '-1');
    inputs.push('-i', c.file);
    const offset = c.t - from;                         // may be negative inside a chunk
    const trimStart = Math.max(0, -offset), delay = Math.max(0, offset);
    const len = Math.min((c.dur ?? 1e9) - trimStart, dur - delay);
    let f = `[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=start=${trimStart.toFixed(3)}:duration=${len.toFixed(3)},asetpts=PTS-STARTPTS`;
    if (c.fadeIn && trimStart === 0) f += `,afade=t=in:d=${c.fadeIn}`;
    if (c.fadeOut) f += `,afade=t=out:st=${Math.max(0, len - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`;
    f += `,volume=${c.vol ?? 1},adelay=${Math.round(delay * 1000)}|${Math.round(delay * 1000)}[a${i}]`;
    parts.push(f); labels.push(`[a${i}]`);
  });
  parts.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,apad,atrim=duration=${dur.toFixed(3)},alimiter=limit=0.95[aout]`);
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('audio mix failed');
  return { used, missing };
}
