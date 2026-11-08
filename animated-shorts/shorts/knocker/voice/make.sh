#!/usr/bin/env bash
# Voice: Kokoro am_michael, fast house pace. Run from animated-shorts/ (needs tts/models from tts/get_voices.sh).
python3 tts/lines.py shorts/knocker/voice/script.txt shorts/knocker/voice --speed 1.35 --pause 0.08 --lead 0.25
