@echo off
chcp 65001 >nul
title Puente Impresora DINON 9390 — Sanguchería San Martín
cd /d "%~dp0"

echo ====================================================================
echo   Sanguchería San Martín — Puente Local DINON 9390
echo ====================================================================
echo.
echo Iniciando servicio local...
echo Si cierras esta ventana, se detendrá la conexión con la impresora.
echo Para que inicie solo con el PC, usa: instalar_inicio_automatico.bat
echo.

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontró Python instalado en este computador.
    echo Por favor instala Python desde https://www.python.org/downloads/
    echo y asegúrate de marcar la casilla "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

python dinon_bridge.py
pause
