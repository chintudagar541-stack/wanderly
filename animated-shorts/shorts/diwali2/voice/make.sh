#!/usr/bin/env bash
# Voice: Kokoro am_michael, fast house pace, Indian pronunciations. Run from animated-shorts/.
python3 tts/lines.py shorts/diwali2/voice/script.txt shorts/diwali2/voice --speed 1.35 --pause 0.08 --lead 0.25 --fix \
  "Ayodhya=əjˈoʊdjɑː" "Ramayana=ɹɑːmˈɑːjʌn" "Rama=ɹˈɑːm" "Chhor=tʃˈɔːɹ" "Guru=ɡˈʊɹuː" "Hargobind=hˈʌɹɡoʊbˌɪnd" "Ji=dʒˈiː" \
  "Kolkata=koʊlkˈɑːtɑː" "Lakshmi=lˈʌkʃmiː" "Puja=pˈuːdʒɑː" "Narakasura=nˌʌɹəkˈɑːsʊɹɑː" "Varanasi=vɑːɹˈɑːnəsi" \
  "Deepawali=dˌiːpɑːvˈʌli" "Dev=dˈeɪv" "Bandi=bˈʌndiː" "Divas=dˈɪvʌs"
