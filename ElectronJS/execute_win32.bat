@REM msg * %cd%
if exist EasySpider (
   start EasySpider/resources/app/chrome_win32/easyspider_executestage.exe %1 %2 %3 %4 %5 %6 %7 %8 %9
) else (
if exist resources (
   cd ../
   start EasySpider/resources/app/chrome_win32/easyspider_executestage.exe %1 %2 %3 %4 %5 %6 %7 %8 %9
  ) else (
   start chrome_win64/easyspider_executestage.exe %1 %2 %3 %4 %5 %6 %7 %8 %9
  )
)
