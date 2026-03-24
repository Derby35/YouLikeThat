@echo off
echo Starting You Like That...

echo Checking MongoDB...
net start MongoDB >nul 2>&1

echo Starting backend server...
start "You Like That - Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting frontend...
start "You Like That - Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting up.
echo Open http://localhost:5173 in your browser once they finish loading.
echo.
pause
