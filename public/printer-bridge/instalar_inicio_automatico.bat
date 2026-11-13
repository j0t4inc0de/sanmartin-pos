@echo off
chcp 65001 >nul
title Configurar Inicio Automático — Sanguchería San Martín
cd /d "%~dp0"

echo ====================================================================
echo   Configurar Puente DINON 9390 para iniciar con Windows
echo ====================================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontró Python en este equipo.
    echo Por favor instala Python desde https://www.python.org/downloads/
    echo y asegúrate de marcar la casilla "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_DIR=%~dp0"
set "TARGET_SCRIPT=%~dp0dinon_bridge.py"
set "VBS_LAUNCHER=%STARTUP_FOLDER%\SanMartin_DINON_Bridge.vbs"

:: Crear lanzador silencioso en la carpeta de inicio de Windows
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%TARGET_DIR:~0,-1%"
echo WshShell.Run "pythonw.exe """ ^& "%TARGET_SCRIPT%" ^& """", 0, False
) > "%VBS_LAUNCHER%"

echo [+] ¡Instalación exitosa!
echo El puente ha quedado registrado en el inicio de Windows:
echo %VBS_LAUNCHER%
echo.
echo Cada vez que enciendas este computador, el puente arrancará
echo en silencio y el POS web se conectará de inmediato a la DINON.
echo.
echo Iniciando el puente ahora mismo en segundo plano...
wscript.exe "%VBS_LAUNCHER%"
echo [OK] Servicio iniciado. Ya puedes volver a la pantalla del POS.
echo.
pause
