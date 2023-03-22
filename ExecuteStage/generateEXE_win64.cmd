rmdir /s /q build
rmdir /s /q dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py
del ..\ElectronJS\chrome_win64\easyspider_executestage.exe
move dist\easyspider_executestage.exe ..\ElectronJS\chrome_win64\easyspider_executestage.exe