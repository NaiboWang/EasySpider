# 环境编译说明|Environment Compilation Instruction

EasySpider分三部分：

1. 主程序：在`ElectronJS`文件夹下。
2. 浏览器扩展：在`Extension`文件夹下，为浏览器的“操作台”的代码，打包后的扩展在`ElectronJS`目录下的`EasySpider_zh.crx`文件。
3. 执行阶段程序：在`ExecuteStage`文件夹下。

此部分为`浏览器扩展`的编译说明，**本节的所有命令都在`manifest_v3`文件夹内执行**，即你需要先`cd manifest_v3`。

-----

EasySpider is divided into three parts:

1. Main program: Located in the ElectronJS folder.
2. Browser extension: Located in the Extension folder, i.e., the `EasySpider_en.crx` file in the `ElectronJS` folder.
3. Execution stage program: Located in the ExecuteStage folder.

This section covers the compilation instructions for the `Browser extension`, **all commands in this section are executed in the `manifest_v3` folder**, i.e., you need to `cd manifest_v3` first.

## 建议编译顺序|Suggested Compilation Order

1. 编译浏览器扩展，否则在主程序执行时会提示找不到`EasySpider_zh.crx`的错误。
2. 编译主程序，此时主程序可以正常运行，但无法执行任务，只能设计任务。
3. 编译执行阶段程序，否则无法执行程序，只能设计程序。

-----

1. Compile the browser extension, otherwise an error will be prompted when the main program is executed that `EasySpider_en.crx` cannot be found.
2. Compile the main program, at this time the main program can run normally, but can not execute the task, can only design the task.
3. Compile the execution stage program, otherwise the program cannot be executed, can only design the program.


## 环境构建|Environment Setup

1. 安装`NodeJS`：[https://nodejs.org/zh-cn/download/](https://nodejs.org/zh-cn/download/)。
2. 运行下面的命令来安装依赖：

```
npm install
```

-----

1. Install `NodeJS`: [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
2. Run the following command to install dependencies:

```
npm install
```

## 热加载扩展|Hot reload the extension

执行下面的命令来热加载扩展：

```
npm run dev
```

打开一个Chrome浏览器窗口，然后在浏览器地址栏输入`chrome://extensions/`，在打开的页面中，打开右上角的`开发者模式`，点击`加载已解压的扩展程序`，选择`manifest_v3/dist`文件夹，即可加载扩展。

-----

Run the following command to hot reload the extension:

```
npm run dev
```

Open a Chrome browser window, then enter `chrome://extensions/` in the browser address bar. On the opened page, open the `Developer mode` in the upper right corner, click `Load unpacked` and select the `manifest_v3/dist` folder to load the extension.

## 打包扩展|Package the extension

执行下面的命令来打包扩展：

```
npm run package
```

打包后会自动更新`ElectronJS`目录下的`EasySpider_zh.crx`文件，命令运行过程中的报错信息可以忽略。

-----

Run the following command to package the extension:

```
npm run package
```

After packaging, the `EasySpider_en.crx` file in the `ElectronJS` folder will be automatically updated, and the error messages during the command running can be ignored.

