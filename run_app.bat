@echo off
title SubControl - Production Spend Intelligence Platform
echo =================================================================
echo Starting SubControl Production Server (FastAPI + React Dashboard)
echo =================================================================
echo.
echo Database: PostgreSQL 15 (localhost:5432/subcontrol)
echo Web Dashboard URL: http://localhost:8000
echo REST API Docs:     http://localhost:8000/docs
echo MCP Server Path:   %~dp0backend\mcp_server.py
echo.
echo Press Ctrl+C anytime to stop the server.
echo =================================================================
echo.

cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

