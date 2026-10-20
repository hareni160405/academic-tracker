@echo off
title Academic Tracker Server
echo ===================================================
echo Starting Academic Tracker Full-Stack PWA Server...
echo ===================================================
set PATH=C:\Users\Hareni\.gemini\antigravity\tools\nodejs;C:\Users\Hareni\.gemini\antigravity\tools\python;C:\Users\Hareni\.gemini\antigravity\tools\python\Scripts;%PATH%
cd /d "C:\Users\Hareni\.gemini\antigravity\scratch\academic-tracker\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
