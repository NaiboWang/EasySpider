rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico --add-data "/home/naibo/miniconda3/lib/python3.8/site-packages/onnxruntime/capi/onnxruntime_pybind11_state.cpython-38-x86_64-linux-gnu.so:onnxruntime/capi"  --add-data "/home/naibo/miniconda3/lib/python3.8/site-packages/ddddocr/common_old.onnx:ddddocr" easyspider_executestage.py
rm ../ElectronJS/chrome_linux64/easyspider_executestage
cp dist/easyspider_executestage ../ElectronJS/chrome_linux64/easyspider_executestage
