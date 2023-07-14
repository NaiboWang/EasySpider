move out\EasySpider-win32-x64 out\EasySpider
rmdir /s /q out\EasySpider\resources\app\chrome_win32
rmdir /s /q out\EasySpider\resources\app\chromedrivers
rmdir /s /q out\EasySpider\resources\app\Data
rmdir /s /q out\EasySpider\resources\app\.idea
rmdir /s /q out\EasySpider\resources\app\tasks
rmdir /s /q out\EasySpider\resources\app\execution_instances
rmdir /s /q out\EasySpider\resources\app\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\EasySpider
del out\EasySpider\resources\app\vs_BuildTools.exe
move out\EasySpider ..\.temp_to_pub\EasySpider_windows_x64\EasySpider
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\Code
mkdir ..\.temp_to_pub\EasySpider_windows_x64\Code
copy ..\ExecuteStage\easyspider_executestage.py ..\.temp_to_pub\EasySpider_windows_x64\Code
copy ..\ExecuteStage\myChrome.py ..\.temp_to_pub\EasySpider_windows_x64\Code
copy ..\ExecuteStage\utils.py ..\.temp_to_pub\EasySpider_windows_x64\Code
copy ..\ExecuteStage\requirements.txt ..\.temp_to_pub\EasySpider_windows_x64\Code
xcopy ..\ExecuteStage\undetected_chromedriver_ES ..\.temp_to_pub\EasySpider_windows_x64\Code\undetected_chromedriver_ES /E /I /Y
xcopy ..\ExecuteStage\.vscode ..\.temp_to_pub\EasySpider_windows_x64\Code\.vscode /E /I /Y
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\execution_instances
mkdir ..\.temp_to_pub\EasySpider_windows_x64\execution_instances
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\Data
mkdir ..\.temp_to_pub\EasySpider_windows_x64\Data