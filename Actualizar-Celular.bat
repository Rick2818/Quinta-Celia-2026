@echo off
title Quinta Celia - Sincronizador Automatico para Celular
cd /d "%~dp0"
color 0A
echo ================================================================
echo   🌲 QUINTA CELIA - SINCRONIZADOR AUTOMATICO PARA CELULAR
echo ================================================================
echo.
echo 1. Compilando aplicacion y arquitectura multi-agente...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Hubo un problema al compilar la aplicacion.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Subiendo cambios a la nube (GitHub / Celular)...
git add .
git commit -m "auto-deploy: actualizacion automatica para celular"
git push origin main

echo.
echo ================================================================
echo   OK! ACTUALIZACION COMPLETADA EXITOSAMENTE
echo ================================================================
echo.
echo Los cambios ya se estan sincronizando en tu celular en:
echo https://rick2818.github.io/Quinta-Celia-2026/
echo.
echo (En tu celular solo debes deslizar hacia abajo para recargar la pagina)
echo.
timeout /t 5
