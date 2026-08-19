@echo off
setlocal

echo Generating Allure Report...

set "SCRIPT_DIR=%~dp0"

call npx allure generate "%SCRIPT_DIR%allure-results" --output "%SCRIPT_DIR%..\allure-report\allure-output"
if errorlevel 1 (
    echo Failed to generate Allure report.
    exit /b 1
)

call npx allure open "%SCRIPT_DIR%..\allure-report\allure-output"

endlocal
