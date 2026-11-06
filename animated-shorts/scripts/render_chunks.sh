#!/usr/bin/env bash
# Render a composition in chunks (resumable: finished chunks are skipped), then join them losslessly.
# usage: scripts/render_chunks.sh <CompId> <totalFrames> <outDir> [chunk=300]
set -u
COMP=$1; TOTAL=$2; OUT=$3; CH=${4:-300}
mkdir -p "$OUT"
for ((a=0; a<TOTAL; a+=CH)); do
  b=$((a+CH-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  f=$(printf "%s/c_%05d.mp4" "$OUT" "$a")
  [[ -s "$f" ]] && continue
  for try in 1 2 3; do
    npx remotion render src/index.ts "$COMP" "$f.tmp.mp4" --frames=$a-$b --codec h264 --crf 18 --concurrency=${CONC:-3} --timeout=180000 > "$OUT/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f" && break
    echo "chunk $a failed (try $try)"
  done
  [[ -s "$f" ]] || { echo "chunk $a FAILED"; exit 1; }
  echo "chunk $a-$b done $(date +%T)"
done
(cd "$OUT" && ls c_*.mp4 | sed "s#^#file '#; s#\$#'#" > list.txt)
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/joined.mp4" && echo "joined $OUT/joined.mp4"
