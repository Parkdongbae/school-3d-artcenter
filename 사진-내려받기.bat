@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo 학생 작품 사진을 작게 줄여 내려받습니다...
echo.
node tools\fetch-images.mjs
echo.
pause
