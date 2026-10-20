@echo off
title Academic Tracker — Student Academic Performance Tracking System
color 0b
echo ======================================================================
echo           ACADEMIC TRACKER — STUDENT ACADEMIC SYSTEM
echo ======================================================================
echo.
echo Starting application server...
echo.
set PATH=C:\Users\Hareni\.gemini\antigravity\tools\nodejs;C:\Users\Hareni\.gemini\antigravity\tools\python;C:\Users\Hareni\.gemini\antigravity\tools\python\Scripts;%PATH%
cd /d "C:\Users\Hareni\.gemini\antigravity\scratch\academic-tracker\backend"

:: Open browser automatically after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"

echo ----------------------------------------------------------------------
echo  * Local Desktop Link:   http://localhost:8000
echo  * Local Wi-Fi Link:     http://192.168.31.164:8000  (for phones on same Wi-Fi)
echo ----------------------------------------------------------------------
echo.
echo Server is running! Keep this window open while using Academic Tracker.
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
