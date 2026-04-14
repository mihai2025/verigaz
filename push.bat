@echo off
REM ============================================================
REM   verigaz / verificari-gaze.ro — quick git push
REM ============================================================
REM   Usage:  push.bat                  (folosește mesaj default)
REM           push.bat "mesaj custom"   (mesajul devine titlul commit-ului)
REM ============================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

REM --- Verifică dacă există modificări ---
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo Eroare: nu pare sa fie un repo git valid in %CD%.
    pause
    exit /b 1
)

for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if "!CHANGES!"=="0" (
    echo Nimic de comis. Working tree e curat.
    pause
    exit /b 0
)

echo.
echo === Modificari detectate: !CHANGES! fisiere ===
git status --short
echo.

REM --- Commit message ---
set MSG=%~1
if "!MSG!"=="" (
    for /f "tokens=1-3 delims=/.- " %%a in ("%date%") do set TODAY=%%a-%%b-%%c
    for /f "tokens=1-2 delims=:." %%a in ("%time%") do set NOW=%%a:%%b
    set MSG=update !TODAY! !NOW!
)

echo === Commit message: "!MSG!" ===
echo.

REM --- Stage + commit + push ---
git add -A
if errorlevel 1 (
    echo Eroare la git add.
    pause
    exit /b 1
)

git commit -m "!MSG!"
if errorlevel 1 (
    echo Commit a esuat (poate hook fail sau nimic stage-uit).
    pause
    exit /b 1
)

echo.
echo === Push catre origin ===
git push
if errorlevel 1 (
    echo Push a esuat. Verifica conexiunea sau credentialele.
    pause
    exit /b 1
)

echo.
echo === Gata ===
git log -1 --oneline
echo.
pause
