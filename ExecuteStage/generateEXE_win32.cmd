rmdir /s /q build
rmdir /s /q dist
pyinstaller -F --icon=favicon.ico --add-data "C:\Users\Naibo\AppData\Local\Programs\Python\Python38-32\Lib\site-packages\onnxruntime\capi\onnxruntime_providers_shared.dll;onnxruntime\capi" --add-data "C:\Users\Naibo\AppData\Local\Programs\Python\Python38-32\Lib\site-packages\ddddocr\common.onnx;ddddocr" easyspider_executestage.py
del ..\ElectronJS\chrome_win32\easyspider_executestage.exe
copy dist\easyspider_executestage.exe ..\ElectronJS\chrome_win32\easyspider_executestage.exe