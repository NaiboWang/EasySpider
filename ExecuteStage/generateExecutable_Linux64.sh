#!/bin/bash

rm -r build
rm -r dist
# 一定要先source一下，不然会出现找不到conda命令的错误！！！
source ~/miniconda3/etc/profile.d/conda.sh
conda activate easyspider
# Python一定要是3.11版本，不然会出现浏览器弹出崩溃的错误！！！原来使用的3.8，崩溃原因未知。
pyinstaller -F --add-data "/home/naibo/miniconda3/envs/easyspider/lib/python3.11/site-packages/onnxruntime/capi/onnxruntime_pybind11_state.cpython-311-x86_64-linux-gnu.so:onnxruntime/capi" --add-data "/home/naibo/miniconda3/envs/easyspider/lib/python3.11/site-packages/ddddocr/common_old.onnx:ddddocr" easyspider_executestage.py
rm ../ElectronJS/chrome_linux64/easyspider_executestage
cp dist/easyspider_executestage ../ElectronJS/chrome_linux64/easyspider_executestage
