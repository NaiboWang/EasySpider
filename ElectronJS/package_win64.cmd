@echo off
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
goto UACPrompt
) else ( goto gotAdmin )
:UACPrompt
echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
"%temp%\getadmin.vbs"
exit /B
:gotAdmin
if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
pushd "%CD%"
CD /D "%~dp0"

rmdir /s /q C:\Users\q9823\AppData\Local\Temp\electron-packager
rmdir /s /q out
npm run package
move out\EasySpider-win32-x64 out\EasySpider
rmdir /s /q out\EasySpider\resources\app\chrome_win32
rmdir /s /q out\EasySpider\resources\app\Data
rmdir /s /q out\EasySpider\resources\app\.idea
rmdir/s /q out\EasySpider\resources\app\tasks
rmdir /s /q out\EasySpider\resources\app\execution_instances