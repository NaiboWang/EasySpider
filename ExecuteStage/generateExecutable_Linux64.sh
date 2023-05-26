rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py
rm ../ElectronJS/chrome_linux64/easyspider_executestage
cp dist/easyspider_executestage ../ElectronJS/chrome_linux64/easyspider_executestage
