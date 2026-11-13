@echo off
chcp 65001 >nul
title Desinstalar Inicio Automático — Sanguchería San Martín

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_LAUNCHER=%STARTUP_FOLDER%\SanMartin_DINON_Bridge.vbs"

if exist "%VBS_LAUNCHER%" (
    del "%VBS_LAUNCHER%"
    echo [+] Se ha quitado el lanzador automático de Windows.
) else (
    echo [*] No se encontró ninguna entrada activa en el inicio de Windows.
)

echo.
echo Presiona cualquier tecla para cerrar.
pause >nul
