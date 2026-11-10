@echo off
title SubControl - Live Public URL Generator
echo =================================================================
echo SubControl - Exposing Localhost to Live Public Internet
echo =================================================================
echo.
echo Make sure SubControl is running on port 8000 (via run_app.bat).
echo This script generates a public HTTPS URL for assignment reviewers.
echo.
echo =================================================================
echo.
npx localtunnel --port 8000
pause
