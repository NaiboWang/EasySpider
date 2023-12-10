cd ../Extension/manifest_v3/
node package.js
cd ../../ElectronJS
@echo off
REM >nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
REM if '%errorlevel%' NEQ '0' (
REM goto UACPrompt
REM ) else ( goto gotAdmin )
REM :UACPrompt
REM echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
REM echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
REM "%temp%\getadmin.vbs"
REM exit /B
REM :gotAdmin
REM if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
REM pushd "%CD%"
REM CD /D "%~dp0"
REM rmdir /s /q C:\Users\q9823\AppData\Local\Temp\electron-packager
rmdir /s /Q out
npm run package
