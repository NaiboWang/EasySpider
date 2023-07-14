#!/bin/bash

# This script is used to build.md the package for MacOS.
cd ../Extension/manifest_v3/
node package.js
cd ../../ElectronJS
rm -rf out
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app
npm run make
unzip out/make/zip/darwin/x64/EasySpider-darwin-x64* -d ../.temp_to_pub/EasySpider_MacOS_all_arch/
# mv out/EasySpider-darwin-x64/EasySpider.app ../.temp_to_pub/EasySpider_MacOS_all_arch/
rm ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/VS_BuildTools.exe
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/chrome_win64
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/chromedrivers
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/Data
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/.idea
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/tasks
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/execution_instances
rm -r ../.temp_to_pub/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/user_data
rm -rf ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
mkdir ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp ../ExecuteStage/easyspider_executestage.py ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp ../ExecuteStage/myChrome.py ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp ../ExecuteStage/utils.py ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp ../ExecuteStage/requirements.txt ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp -Rf ../ExecuteStage/undetected_chromedriver_ES ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
cp -Rf ../ExecuteStage/.vscode ../.temp_to_pub/EasySpider_MacOS_all_arch/Code
