@echo off
chcp 65001 > nul
title Déploiement Serveur - Assemblage Votes Laâyoune 2026
echo ========================================================
echo   LANCEMENT DU SERVEUR DE PRODUCTION (PORT 4000)
echo ========================================================
echo.
echo [1/2] Vérification des modules et build de production...
call npm run build
echo.
echo [2/2] Démarrage du serveur Node.js sur le réseau local...
echo.
echo IP Locale du serveur : http://192.168.100.5:4000
echo Accès local PC      : http://localhost:4000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur.
echo ========================================================
node server.js
pause
