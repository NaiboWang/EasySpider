rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico  --add-data "/Users/naibo/anaconda3/lib/python3.11/site-packages/onnxruntime/capi/onnxruntime_pybind11_state.so:onnxruntime/capi"  --add-data "/Users/naibo/anaconda3/lib/python3.11/site-packages/ddddocr/common_old.onnx:ddddocr" easyspider_executestage.py
rm ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage
rm ../ElectronJS/easyspider_executestage
cp dist/easyspider_executestage ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage
# mv dist/easyspider_executestage ../ElectronJS/easyspider_executestage
