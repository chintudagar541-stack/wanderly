---
name: story-script
description: Give the owner video ideas or write a script for an animated history/science story short in the 10M-view reference style. Use when the owner asks for "idea do", "topic do", "script likho", "next video kya banaye", or gives a topic to script.
---
# Story-script engine

1. Read `animated-shorts/writer/FORMULA.md` (the formula: why the references go viral, the beat sheet, and line rules) and `animated-shorts/STYLE.md`.
2. **Ideas**: pick 5 from `animated-shorts/writer/ideas.md`, preferring underdog + mockery + mechanism and some 🇮🇳 ones. You may also invent new ones of the same shape. Give each as: title, hook line, the twist in one line. Check facts; hedge legends.
3. **Script**: follow the beat sheet exactly:
   - hook (≤ 18 words)
   - "You see," context
   - the nobody vs the crowd, with quoted dialogue
   - escalation with time markers
   - a 1-line twist
   - the mechanism
   - a short ironic punchline, then stop
   Aim for 215–240 words.
4. Run `python3 animated-shorts/writer/check.py <script.txt>` and fix every WARN.
5. Show the script to the owner in a chat message with an estimated length. Use Hinglish for talk; the script itself is English.
6. Once the owner approves, save the script as `shorts/<name>/voice/script.txt` and mark the idea as used in ideas.md.
