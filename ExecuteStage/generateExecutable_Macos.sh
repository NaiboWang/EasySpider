# 先打包一个不带ddddocr和pandas的版本，然后再打包一个带的版本，不带ddddocr和pandas的版本运行速度会快很多
rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py --exclude-module ddddocr --exclude-module onnxruntime --exclude-module onnx --exclude-module onnxruntime_pybind11_state.so --exclude-module pillow --exclude-module pandas --exclude-module numpy --exclude-module scipy --exclude-module sklearn 

rm ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage
cp dist/easyspider_executestage ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage
# mv dist/easyspider_executestage ../ElectronJS/easyspider_executestage

echo "With ddddocr and pandas"

# # 打包带ddddocr和pandas的版本
rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico  --add-data "/Users/naibo/anaconda3/lib/python3.11/site-packages/onnxruntime/capi/onnxruntime_pybind11_state.so:onnxruntime/capi"  --add-data "/Users/naibo/anaconda3/lib/python3.11/site-packages/ddddocr/common_old.onnx:ddddocr" easyspider_executestage.py
rm ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage_full
cp dist/easyspider_executestage ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage_full