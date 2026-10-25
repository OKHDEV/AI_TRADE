@echo off
chcp 65001 > nul
echo ========================================================
echo   메리츠 AI 자동 주식 트레이더 - 웹 로컬 서버 실행기
echo ========================================================
echo.
echo [1] 로컬 웹 서버를 시작합니다 (http://localhost:8080/index.html)
echo [2] 브라우저 창이 자동으로 열립니다.
echo.
echo 서버를 종료하시려면 이 명령창(CMD)을 닫아주세요.
echo.
start "" "http://localhost:8080/index.html"
python -m http.server 8080
if %errorlevel% neq 0 (
    echo.
    echo [안내] Python 서버 실행 불가 시 기본 브라우저로 직접 엽니다...
    start "" "index.html"
)
pause
