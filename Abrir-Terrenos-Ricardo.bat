@echo off
title Modulo Administrativo Finca Celia Terrenos de Ricardo
cd /d "%~dp0"
echo =========================================================
echo   Modulo Administrativo Finca Celia Terrenos de Ricardo
echo   Finca Celia - Administracion 120 Meses y Mediciones
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

