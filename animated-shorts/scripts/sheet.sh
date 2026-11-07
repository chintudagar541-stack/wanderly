#!/usr/bin/env bash
# Contact sheet from stills: scripts/sheet.sh <dir> <prefix> <out.jpg> f1 f2 ... (6 per row, 225x400 each)
set -e; D=$1; P=$2; O=$3; shift 3; n=$#; ins=""; fl=""; lay=""; i=0
for f in "$@"; do ins="$ins -i $D/$P$f.jpg"; fl="$fl[$i]scale=225:400[v$i];"; lay="$lay$((i%6*225))_$((i/6*400))|"; i=$((i+1)); done
st=""; for ((j=0;j<n;j++)); do st="$st[v$j]"; done
ffmpeg -v error -y $ins -filter_complex "$fl${st}xstack=inputs=$n:layout=${lay%|}:fill=black" "$O"
