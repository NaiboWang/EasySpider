# 环境编译说明|Environment Compilation Instruction

EasySpider分三部分：

1. 主程序：在`ElectronJS`文件夹下。
2. 浏览器扩展：在`Extension`文件夹下，为浏览器的“操作台”的代码，打包后的扩展在此目录下的`EasySpider_zh.crx`文件。
3. 执行阶段程序：在`ExecuteStage`文件夹下。

此部分为`主程序`的编译说明。

-----

EasySpider is divided into three parts:

1. Main program: Located in the ElectronJS folder.
2. Browser extension: Located in the Extension folder, i.e., the `EasySpider_en.crx` file in this folder.
3. Execution stage program: Located in the ExecuteStage folder.

This section covers the compilation instructions for the `main program`.


## 建议编译顺序|Suggested Compilation Order

1. 编译浏览器扩展，否则在主程序执行时会提示找不到`EasySpider_zh.crx`的错误。
2. 编译主程序，此时主程序可以正常运行，但无法执行任务，只能设计任务。
3. 编译执行阶段程序，否则无法执行程序，只能设计程序。

-----

1. Compile the browser extension, otherwise an error will be prompted when the main program is executed that `EasySpider_en.crx` cannot be found.
2. Compile the main program, at this time the main program can run normally, but can not execute the task, can only design the task.
3. Compile the execution stage program, otherwise the program cannot be executed, can only design the program.

## 注意事项|Note

请记住，每当EasySpider扩展程序和执行程序更新时，都要更新`EasySpider.crx`和`easyspider_executestage`文件。

Remember to update the `EasySpider.crx` and `easyspider_executestage` files whenever the EasySpider extension and execution program are updated.

## 环境构建|Environment Setup

以下以Windows x64版本为例。

Taking the example of Windows x64 version.

### 浏览器和驱动|Browser and Driver

实在搞不定本节的情况下，下载一个直接能用的EasySpider，并把文件夹内的`EasySpider\resources\app\chrome_win64`文件夹拷贝到此`ElectronJS`文件夹下即可。

If you're unable to handle the tasks in this section, you can download a ready-to-use EasySpider. Simply copy the `EasySpider\resources\app\chrome_win64` folder from the downloaded files and paste it into the ElectronJS folder.

------

在自己的机器环境已经安装了Chrome的情况下，直接执行`python3 update_chrome.py`也可以完成本节下面写的一系列的操作，注意设置文件中的Chrome大版本号为本机Chrome的版本号。

If you already have Chrome installed on your local machine, you can directly execute python3 update_chrome.py to perform the operations mentioned in the following section. Make sure to set the Chrome major version in the configuration file to match the version of Chrome installed on your machine.

------

下载一个Chrome：[https://www.google.com/chrome/](https://www.google.com/chrome/)，然后找到Chrome安装后的文件夹，如`C:\Program Files\Google\Chrome\Application`，把这个文件夹拷贝到此`ElectronJS`文件夹内，并按照以下格式更名：

```
chrome_win32/ # for windows x32
chrome_win64/ # for windows x64
chrome_linux64/ # for linux x64
chrome_mac64/ # for mac x64
```

然后，从下面的页面下载和**自己安装的Chrome版本一致**的Chromedriver：[https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)，把chromedriver放入刚刚的`chrome`文件夹内，并更名为下面的格式：

```
chromedriver_win32.exe # for windows x32
chromedriver_win64.exe # for windows x64
chromedriver_linux64 # for linux x64
chromedriver_mac64 # for mac x64
```

例如，如果您想在Windows x64平台上构建此软件，那么您首先需要下载适用于Windows x64的Chrome浏览器，并将整个`chrome`文件夹复制到`ElectronJS`文件夹中，然后将文件夹重命名为`chrome_win64`。假设您下载的Chrome版本是110。接下来，下载一个适用于Windows x64的110版本的ChromeDriver，并将其放入`chrome_win64`文件夹中，然后将其重命名为`chromedriver_win64.exe`。

最后，把此文件夹内的`stealth.min.js`和`execute.bat`文件拷贝入`chrome`文件夹内。 


Download a Chrome from the Internet: https://www.google.com/chrome/, and then put them into this folder, with name format of the following:

```
chrome_win32/ # for windows x32
chrome_win64/ # for windows x64
chrome_linux64/ # for linux x64
chrome_mac64/ # for mac x64
```

Then, download the corresponding chromedriver from the Internet on this page: https://chromedriver.chromium.org/downloads, note the **chromedriver version must match your chrome version!!!** And put them into corresponding chrome folder, with name format of the following:

```
chromedriver_win32.exe # for windows x32
chromedriver_win64.exe # for windows x64
chromedriver_linux64 # for linux x64
chromedriver_mac64 # for mac x64
```

For example, if you want to build this software on Windows x64 platform, then you should first download a Chrome for Windows x64, then copy the whole `chrome` folder to this `ElectronJS` folder and rename the folder to `chrome_win64`, assume the Chrome version you downloaded is 110; then, download a `chromedriver.exe` with version 110 for Windows x64, and put it into the `chrome_win64` folder, then rename it to `chromedriver_win64.exe`.

Finally, copy the `stealth.min.js` and `execute.bat` (for Windows x64) file in this folder to these `chrome` folders.

### NodeJS环境|NodeJS Environment

1. Windows环境下需要先安装`VS Build Tools 2017` （[https://aka.ms/vs/15/release/vs_buildtools.exe](https://aka.ms/vs/15/release/vs_buildtools.exe)）的`Visual C++ Build Tools`组件，不然下面的命令无法执行，其他系统不需要。
2. 安装`NodeJS`：[https://nodejs.org/zh-cn/download/](https://nodejs.org/zh-cn/download/)。
3. 运行下面的命令来安装依赖：

```
npm install
npm install @electron-forge/cli -g
```

如果上面的命令运行速度很慢可以参考NodeJS换源说明：[https://blog.csdn.net/qq_23211463/article/details/123769061](https://blog.csdn.net/qq_23211463/article/details/123769061)。

-----

1. On Windows, you need to install `VS Build Tools 2017` (https://aka.ms/vs/15/release/vs_buildtools.exe, select and install the `Visual C++ Build Tools` component) first for node-gyp to install `node-windows-manager` (No need for other OS).
2. Install `NodeJS`: [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
3. Run the following commands to install NodeJS packages:

```
npm install
npm install @electron-forge/cli -g
```

## 运行说明|Run Instruction

在当前文件夹执行以下命令即可在开发模式下运行程序：

```sh
npm run start_direct
```

但到此为止只能设计任务，不能执行任务，想要执行任务还需要完成`ExecuteStage`文件夹下的执行任务程序的编译说明才可以执行。

-----

Run the software in developing mode:

```sh
npm run start_direct
```

But so far can only design the task, can not execute the task, want to execute the task also need to complete the 'ExecuteStage' folder of the execution of the task program compilation instructions can be executed.

## 打包发布说明|Package Instruction

打包发布前，确保执行阶段程序`easyspider_executestage(.exe)`已放入`chrome(_win64)`文件夹内，且浏览器插件`EasySpider_zh.crx`已经是最新版本。

执行下面的命令即可打包：

```
npx electron-forge import
npm run package
```

-----

Before packaging and releasing, make sure that the task execution program `easyspider_executestage(.exe)` is placed inside the `chrome(_win64)` folder and that the browser extension `EasySpider_en.crx` is the latest version.

After finishing developing, package software by the following command:

```
npx electron-forge import
npm run package
```

### For windows x64

依次执行下面两个cmd即可打包并发布，无需执行上面的npm命令，其他系统同理。

```
package_win64.cmd
clean_and_release_win64.cmd
```

-----

Execute the following two CMD commands sequentially to package and publish the program. There is no need to execute the previous npm command. The process is similar for other systems.

```
package_win64.cmd
clean_and_release_win64.cmd
```

### （可选）编译成安装包|(Optional) Compile to an installation package

```
npm run make
```