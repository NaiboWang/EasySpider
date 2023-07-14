#!/bin/bash

# This script is used to build.md the package for Linux 64-bit.
rm -r out
cd ../Extension/manifest_v3
node package.js
cd ../../ElectronJS
npm run package
mv out/EasySpider-linux-x64 out/EasySpider
rm -rf out/EasySpider/resources/app/chrome_win64
rm -rf out/EasySpider/resources/app/chromedrivers
rm -rf out/EasySpider/resources/app/Data
rm -rf out/EasySpider/resources/app/.idea
rm -rf out/EasySpider/resources/app/tasks
rm -rf out/EasySpider/resources/app/execution_instances
rm -rf out/EasySpider/resources/app/user_data
rm -rf ../.temp_to_pub/EasySpider_Linux_x64/EasySpider
rm out/EasySpider/resources/app/vs_BuildTools.exe
mv out/EasySpider ../.temp_to_pub/EasySpider_Linux_x64/EasySpider
rm -rf ../.temp_to_pub/EasySpider_Linux_x64/Code
mkdir ../.temp_to_pub/EasySpider_Linux_x64/Code
cp ../ExecuteStage/easyspider_executestage.py ../.temp_to_pub/EasySpider_Linux_x64/Code
cp ../ExecuteStage/myChrome.py ../.temp_to_pub/EasySpider_Linux_x64/Code
cp ../ExecuteStage/utils.py ../.temp_to_pub/EasySpider_Linux_x64/Code
cp ../ExecuteStage/requirements.txt ../.temp_to_pub/EasySpider_Linux_x64/Code
cp -Rf ../ExecuteStage/undetected_chromedriver_ES ../.temp_to_pub/EasySpider_Linux_x64/Code
cp -Rf ../ExecuteStage/.vscode ../.temp_to_pub/EasySpider_Linux_x64/Code
chmod 777 ../.temp_to_pub/EasySpider_Linux_x64/easy-spider.sh

rm -rf ../.temp_to_pub/EasySpider_Linux_x64/user_data
rm -rf  ../.temp_to_pub/EasySpider_Linux_x64/execution_instances
mkdir ../.temp_to_pub/EasySpider_Linux_x64/execution_instances
rm -rf  ../.temp_to_pub/EasySpider_Linux_x64/Data
mkdir ../.temp_to_pub/EasySpider_Linux_x64/Data
rm EasySpider_zh.crx
rm EasySpider_en.crx
