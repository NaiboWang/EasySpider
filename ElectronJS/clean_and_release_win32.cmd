move out\EasySpider-win32-ia32 out\EasySpider
rmdir /s /q out\EasySpider\resources\app\chrome_win64
rmdir /s /q out\EasySpider\resources\app\chromedrivers
rmdir /s /q out\EasySpider\resources\app\Data
rmdir /s /q out\EasySpider\resources\app\.idea
rmdir /s /q out\EasySpider\resources\app\tasks
rmdir /s /q out\EasySpider\resources\app\execution_instances
rmdir /s /q out\EasySpider\resources\app\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x32\EasySpider
del out\EasySpider\resources\app\vs_BuildTools.exe
move out\EasySpider ..\.temp_to_pub\EasySpider_windows_x32\EasySpider
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x32\Code
mkdir ..\.temp_to_pub\EasySpider_windows_x32\Code
@REM copy ..\ExecuteStage\easyspider_executestage.py ..\.temp_to_pub\EasySpider_windows_x32\Code
@REM copy ..\ExecuteStage\myChrome.py ..\.temp_to_pub\EasySpider_windows_x32\Code
@REM copy ..\ExecuteStage\utils.py ..\.temp_to_pub\EasySpider_windows_x32\Code
copy ..\ExecuteStage\*.py ..\.temp_to_pub\EasySpider_windows_x32\Code
copy ..\ExecuteStage\requirements.txt ..\.temp_to_pub\EasySpider_windows_x32\Code
copy ..\ExecuteStage\Readme.md ..\.temp_to_pub\EasySpider_windows_x32\Code
copy ..\ExecuteStage\myCode.py ..\.temp_to_pub\EasySpider_windows_x32
xcopy ..\ExecuteStage\undetected_chromedriver_ES ..\.temp_to_pub\EasySpider_windows_x32\Code\undetected_chromedriver_ES /E /I /Y
xcopy ..\ExecuteStage\.vscode ..\.temp_to_pub\EasySpider_windows_x32\Code\.vscode /E /I /Y
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x32\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x32\execution_instances
rmdir /s /Q ..\.temp_to_pub\EasySpider_windows_x32\TempUserDataFolder
mkdir ..\.temp_to_pub\EasySpider_windows_x32\execution_instances
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x32\Data
mkdir ..\.temp_to_pub\EasySpider_windows_x32\Data
del EasySpider_en.crx
del EasySpider_zh.crx
xcopy .\tasks\* ..\.temp_to_pub\EasySpider_windows_x32\tasks\ /E /I /Y
