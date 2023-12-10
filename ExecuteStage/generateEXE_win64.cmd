rmdir /s /Q build
rmdir /s /Q dist
@REM --add-data "C:\Python311\Lib\site-packages\ddddocr\common.onnx;ddddocr"
@REM pyinstaller -F --icon=favicon.ico easyspider_executestage.py
pyinstaller -F --icon=favicon.ico --add-data "C:\Python311\Lib\site-packages\onnxruntime\capi\onnxruntime_providers_shared.dll;onnxruntime\capi"  --add-data "C:\Python311\Lib\site-packages\ddddocr\common_old.onnx;ddddocr" easyspider_executestage.py
del ..\ElectronJS\chrome_win64\easyspider_executestage.exe
copy dist\easyspider_executestage.exe ..\ElectronJS\chrome_win64\easyspider_executestage.exe