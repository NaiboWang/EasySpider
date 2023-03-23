rm -r build
rm -r dist
pyinstaller -F --icon=favicon.ico easyspider_executestage.py
rm ../ElectronJS/chrome_linux64/easyspider_executestage
mv dist/easyspider_executestage ../ElectronJS/chrome_linux64/easyspider_executestage
