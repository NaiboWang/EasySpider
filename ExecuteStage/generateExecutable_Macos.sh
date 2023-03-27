rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py
rm ../Releases/EasySpider_MacOS_all_arch/easyspider_executestage
rm ../ElectronJS/easyspider_executestage
mv dist/easyspider_executestage ../Releases/EasySpider_MacOS_all_arch/easyspider_executestage
# mv dist/easyspider_executestage ../ElectronJS/easyspider_executestage
