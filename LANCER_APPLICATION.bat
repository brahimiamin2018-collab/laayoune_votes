@echo off
chcp 65001 > nul
title Assemblage Totaux Votes Laâyoune 2026
echo ====================================================
echo   DÉMARRAGE DE L'APPLICATION DÉPOUILLEMENT LAÂYOUNE
echo ====================================================
echo.
echo [1/2] Démarrage du serveur web et de la base de données...
cd /d "%~dp0"

start "" http://localhost:4000

node server.js

pause
