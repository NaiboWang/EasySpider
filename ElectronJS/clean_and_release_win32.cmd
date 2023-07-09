move out\EasySpider-win32-ia32 out\EasySpider
rmdir /s /q out\EasySpider\resources\app\chrome_win64
rmdir /s /q out\EasySpider\resources\app\chromedrivers
rmdir /s /q out\EasySpider\resources\app\Data
rmdir /s /q out\EasySpider\resources\app\.idea
rmdir /s /q out\EasySpider\resources\app\tasks
rmdir /s /q out\EasySpider\resources\app\execution_instances
rmdir /s /q out\EasySpider\resources\app\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x86\EasySpider
del out\EasySpider\resources\app\vs_BuildTools.exe
move out\EasySpider ..\.temp_to_pub\EasySpider_windows_x86\EasySpider
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x86\Code
mkdir ..\.temp_to_pub\EasySpider_windows_x86\Code
copy ..\ExecuteStage\easyspider_executestage.py ..\.temp_to_pub\EasySpider_windows_x86\Code
copy ..\ExecuteStage\myChrome.py ..\.temp_to_pub\EasySpider_windows_x86\Code
copy ..\ExecuteStage\utils.py ..\.temp_to_pub\EasySpider_windows_x86\Code
copy ..\ExecuteStage\requirements.txt ..\.temp_to_pub\EasySpider_windows_x86\Code
xcopy ..\ExecuteStage\undetected_chromedriver_ES ..\.temp_to_pub\EasySpider_windows_x86\Code\undetected_chromedriver_ES /E /I /Y
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x86\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x86\execution_instances
mkdir ..\.temp_to_pub\EasySpider_windows_x86\execution_instances
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x86\Data
mkdir ..\.temp_to_pub\EasySpider_windows_x86\Data
del EasySpider_en.crx
del EasySpider_zh.crx