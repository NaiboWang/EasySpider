#!/bin/bash

# This script is used to build.md the package for MacOS.
cd ../Extension/manifest_v3/
node package.js
cd ../../ElectronJS
rm -rf out
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app
npm run make
unzip out/make/zip/darwin/*64/EasySpider-darwin* -d ../.temp_to_pub/EasySpider_MacOS/
# mv out/EasySpider-darwin-*64/EasySpider.app ../.temp_to_pub/EasySpider_MacOS/
rm ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/VS_BuildTools.exe
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/chrome_win64
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/chromedrivers
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/Data
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/.idea
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/tasks
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/execution_instances
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/user_data
rm -r ../.temp_to_pub/EasySpider_MacOS/EasySpider.app/Contents/Resources/app/TempUserDataFolder
rm -rf ../.temp_to_pub/EasySpider_MacOS/Code
mkdir ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/easyspider_executestage.py ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/myChrome.py ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/utils.py ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/requirements.txt ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/Readme.md ../.temp_to_pub/EasySpider_MacOS/Code
cp ../ExecuteStage/myCode.py ../.temp_to_pub/EasySpider_MacOS
cp -Rf ../ExecuteStage/undetected_chromedriver_ES ../.temp_to_pub/EasySpider_MacOS/Code
cp -Rf ../ExecuteStage/.vscode ../.temp_to_pub/EasySpider_MacOS/Code
cp -Rf ./tasks/* "../.temp_to_pub/EasySpider_MacOS/Sample Tasks"
