#!/bin/bash

# This script is used to build.md the package for MacOS.
rm -rf out
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app
npm run make
unzip out/make/zip/darwin/x64/EasySpider-darwin-x64* -d ../Releases/EasySpider_MacOS_all_arch/
# mv out/EasySpider-darwin-x64/EasySpider.app ../Releases/EasySpider_MacOS_all_arch/
rm ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/VS_BuildTools.exe
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/chrome_win64
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/Data
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/.idea
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/tasks
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/execution_instances
rm -r ../Releases/EasySpider_MacOS_all_arch/EasySpider.app/Contents/Resources/app/user_data
