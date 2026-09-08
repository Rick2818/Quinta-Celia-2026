@echo off
title Terrenos Ricardo - Quinta Celia Hipotecas
cd /d "%~dp0"
echo =========================================================
echo   Iniciando Simulador de Hipotecas Terrenos Ricardo
echo   Quinta Celia - Control Financiero y Mediciones
echo =========================================================
echo.

if exist "Terrenos Ricardo.html" (
    echo Abriendo Terrenos Ricardo.html en tu navegador...
    start "" "Terrenos Ricardo.html"
    exit
)

if exist "index.html" (
    echo Abriendo index.html en tu navegador...
    start "" "index.html"
    exit
)

echo [AVISO] No se encontro el archivo HTML en esta carpeta.
echo Por favor asegurate de descomprimir el archivo ZIP antes de abrirlo.
echo.
pause

