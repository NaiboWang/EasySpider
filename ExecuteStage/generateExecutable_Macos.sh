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
# Get the site-packages path for ddddocr and onnxruntime
# 如果当前终端激活了 conda 环境，下方脚本应当可以正确的从 conda 环境安装的包中获得数据文件位置
ddddocr_path=$(python3 -c "import ddddocr; print(ddddocr.__path__[0])")
onnxruntime_path=$(python3 -c "import onnxruntime; print(onnxruntime.__path__[0])")

pyinstaller -F --icon=favicon.ico --add-data "$onnxruntime_path/capi/onnxruntime_pybind11_state.so:onnxruntime/capi" --add-data "$ddddocr_path/common_old.onnx:ddddocr" easyspider_executestage.py
rm ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage_full
cp dist/easyspider_executestage ../.temp_to_pub/EasySpider_MacOS/easyspider_executestage_full