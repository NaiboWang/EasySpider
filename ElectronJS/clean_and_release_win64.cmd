move out\EasySpider-win32-x64 out\EasySpider
rmdir /s /q out\EasySpider\resources\app\chrome_win32
rmdir /s /q out\EasySpider\resources\app\chromedrivers
rmdir /s /q out\EasySpider\resources\app\Data
rmdir /s /q out\EasySpider\resources\app\.idea
rmdir /s /q out\EasySpider\resources\app\tasks
rmdir /s /q out\EasySpider\resources\app\user_data
rmdir /s /q out\EasySpider\resources\app\execution_instances
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\EasySpider
del out\EasySpider\resources\app\vs_BuildTools.exe
move out\EasySpider ..\.temp_to_pub\EasySpider_windows_x64\EasySpider
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\user_data
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\execution_instances
mkdir ..\.temp_to_pub\EasySpider_windows_x64\execution_instances
rmdir /s /q ..\.temp_to_pub\EasySpider_windows_x64\Data
mkdir ..\.temp_to_pub\EasySpider_windows_x64\Data