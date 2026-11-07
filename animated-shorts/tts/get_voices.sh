#!/usr/bin/env bash
# Download the free TTS voices (models are not in git). Run from animated-shorts/.
#   Kokoro (am_eric, am_michael, am_fenrir, ...): kokoro-onnx, Apache-2.0
#   Piper en_US-ryan-high: piper-tts, MIT
set -e; cd "$(dirname "$0")/models"
pip install -q kokoro-onnx piper-tts soundfile
[ -f kokoro-v1.0.onnx ] || curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -f voices-v1.0.bin ]  || curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
if [ ! -f en_US-ryan-high.onnx ]; then
  curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-ryan-high.tar.bz2 | tar xj
  cp vits-piper-en_US-ryan-high/en_US-ryan-high.onnx* . && rm -rf vits-piper-en_US-ryan-high
fi
ls -la
