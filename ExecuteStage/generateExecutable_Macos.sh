rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py
rm ../.temp_to_pub/EasySpider_MacOS_all_arch/easyspider_executestage
rm ../ElectronJS/easyspider_executestage
cp dist/easyspider_executestage ../.temp_to_pub/EasySpider_MacOS_all_arch/easyspider_executestage
# mv dist/easyspider_executestage ../ElectronJS/easyspider_executestage
