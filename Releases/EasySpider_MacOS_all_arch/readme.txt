由于MacOS复杂的安全性设置，初次打开软件会显示未验证开发者从而不允许打开的问题，请参考以下github文档来查看MacOS版本如何打开软件和执行任务：https://github.com/NaiboWang/EasySpider/wiki/MacOS-Guide

文件访问权限必须给，麦克风权限完全用不到，作者也不清楚为什么会需要麦克风，因此可以拒绝。

可以从其他机器导入任务，只需要打开此目录的EasySpider软件右键“显示包内容”，然后把其他机器的tasks文件夹里的.json文件放入Contents/Resources/app/tasks文件夹里即可。同理执行号文件可以通过复制execution_instances文件夹中的.json文件来导入。注意，两个文件夹里的.json文件只支持命名为大于0的数字。

MacOS版本的软件有一个问题可能存在,即软件所调用的Chrome软件会在打开后经常性自动更新,但软件所依赖的Chromedriver版本并不会随着chrome自动更新,从而导致软件打不开chrome的问题。注意此版本的EasySpider使用的Chrome为111.0版本，如果使用过程中发现Chrome无法打开，请到Github Issues页面提issue，作者将会更新最新版本的软件供大家使用。

检查Chrome版本的方式为：进入EasySpider软件内部，即右键软件“显示包内容”，然后进入Contents/Resources/app文件夹内,手动双击打开chrome_mac64软件打开chrome,然后打开设置->关于Chrome来查看chrome版本是否为111.0版本。

如果不是，除了提出issue外，也可以自行到以下网址下载对应自己当前chrome版本的macOS版本的chromedriver：https://chromedriver.chromium.org/downloads

并放在上面提到的Contents/Resources/app文件夹内，更名并替换掉“chromedriver_mac64”文件即可使软件恢复正常使用。

Due to the complex security settings of MacOS, the issue of being unable to open software due to the "unverified developer" message may occur upon the first attempt to open the software. Please refer to the following GitHub document to see how to open software and perform tasks on your MacOS version: 

https://github.com/NaiboWang/EasySpider/wiki/MacOS-Guide

File access permissions must be granted, microphone permissions are not necessary at all, and the author is not sure why microphone permissions are being requested, so they can be declined.


You can import tasks from other machines by simply opening the EasySpider software in this directory, right-clicking "Show Package Contents", and then placing the .json files from the tasks folder in the Contents/Resources/app/tasks folder of the other machine. Similarly, execution ID files can be imported by copying the .json files from the execution_instances folder. Please note that the .json files in both folders only support names greater than 0.

There is a potential issue with the software for MacOS, in that the Chrome software called by the software often updates automatically after opening, but the version of Chromedriver that the software relies on does not update automatically with Chrome, leading to the problem of being unable to open Chrome. Note that the EasySpider version used for Chrome is 111.0. If Chrome cannot be opened during use, please report the issue on the GitHub Issues page, and the author will update the latest version of the software for everyone to use.

To check the Chrome version, enter the EasySpider software and right-click to "Show Package Contents". Then go to Contents/Resources/app folder and double-click on the chrome_mac64 software to open Chrome. Then go to Settings -> About to check if the Chrome version is 111.0.

If it is not, besides reporting the issue, you can also download the corresponding macOS version of Chromedriver for your current Chrome version from the following website: https://chromedriver.chromium.org/downloads

Place the downloaded Chromedriver in the Contents/Resources/app folder mentioned above, rename it and replace the "chromedriver_mac64" file to restore normal use of the software.

