@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Расходы голосом — локальный сервер

echo.
echo  Запускаю "Расходы голосом"
echo.
echo  На компьютере:  http://localhost:8090
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo  С телефона (та же Wi-Fi):  http://%%b:8090
)
echo.
echo  Закрой это окно, когда закончишь — сервер остановится.
echo.

start "" cmd /c "timeout /t 2 >nul & start http://localhost:8090"
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8090
) else (
  py -m http.server 8090
)
pause
