# 环境编译说明|Environment Compilation Instruction

EasySpider分三部分：

1. 主程序：在`ElectronJS`文件夹下。
2. 浏览器扩展：在`Extension`文件夹下，为浏览器的“操作台”的代码。
3. 执行阶段程序：在`ExecuteStage`文件夹下。

此部分为`执行阶段程序`的编译说明。

-----

EasySpider is divided into three parts:

1. Main program: Located in the ElectronJS folder.
2. Browser extension: Located in the Extension folder.
3. Execution stage program: Located in the ExecuteStage folder.

This section covers the compilation instructions for the `Execution stage program`.

## 建议编译顺序|Suggested Compilation Order

1. 编译浏览器扩展，否则在主程序执行时会提示找不到`EasySpider_zh.crx`的错误。
2. 编译主程序，此时主程序可以正常运行，但无法执行任务，只能设计任务。
3. 编译执行阶段程序，否则无法执行程序，只能设计程序。

-----

1. Compile the browser extension, otherwise an error will be prompted when the main program is executed that `EasySpider_en.crx` cannot be found.
2. Compile the main program, at this time the main program can run normally, but can not execute the task, can only design the task.
3. Compile the execution stage program, otherwise the program cannot be executed, can only design the program.


## 环境构建|Environment Setup

1. 安装Python 3.7及以上版本并添加至系统环境变量：[https://www.python.org/downloads/](https://www.python.org/downloads/)。
2. 安装`pip3`并添加至系统环境变量（Windows安装python后会自带pip，Linux和MacOS安装方式请自行搜索）。
3. 安装执行阶段需要的依赖库：
   
   ```sh
    pip3 install -r requirements.txt
   ```

-----

1. Install Python 3.7 or higher version and add it to the system environment variables: [https://www.python.org/downloads/](https://www.python.org/downloads/).
2. Install pip3 and add it to the system environment variables. (On Windows, pip is automatically installed with Python. For Linux and macOS, please refer to the appropriate installation instructions).
3. Install the required dependencies for the execution stage by running:
   
    ```sh
    pip3 install -r requirements.txt
    ```

## 运行说明|Run Instruction

运行程序前，确保已经完成了`ElectronJS`文件夹下`主程序`的编译，保证`chrome`文件夹和`chromedriver`环境已经就绪，同时**EasySpider主程序已在运行中**。

在当前文件夹下直接运行程序：

```Python
python3 easyspider_executestage.py --ids [1]
```

以上是运行任务号为`1`的任务的示例命令，更多命令行参数使用说明请参考：[Argument Instruction](https://github.com/NaiboWang/EasySpider/wiki/Argument-Instruction)。

-----

Before running the program, make sure you have completed the compilation of the `main program` in the `ElectronJS` folder and ensure that the `chrome` folder and `chromedriver` environment are ready. Also, ensure that the **EasySpider main program is already running**.

To run the program directly in the current folder, use the following command:

```Python
python3 easyspider_executestage.py --ids [1]
```

The above is an example command to run a task with the ID of `1`. For more information on command-line parameters, please refer to: [Argument Instruction](https://github.com/NaiboWang/EasySpider/wiki/Argument-Instruction) on the project's GitHub Wiki.

### VS Code调试|VS Code Debug

可以用VS Code打开此文件夹即可调试程序，可修改`.vscode`下的`launch.json`文件中的调试参数，调试说明参考：[https://zhuanlan.zhihu.com/p/41189402](https://zhuanlan.zhihu.com/p/41189402)。

You can use VS Code to open this folder and debug the program. You can modify the debugging parameters in the launch.json file located under the .vscode folder. For instructions on debugging with VSCode, you can refer to this guide: [Debugging Python with Visual Studio Code](https://code.visualstudio.com/docs/python/debugging).

## 打包说明|Package Instruction

如果想要在主程序直接点击`本地直接运行`按钮即可执行程序，则需要打包程序为可执行程序。

Windows x64直接运行`generateEXE_win64.cmd`即可把执行阶段程序打包成`exe`文件并自动拷贝到`../ElectronJS/chrome_win64/`目录下，其他系统同理。

-----

To execute the program by simply clicking the `Directly Run Locally` button in the main program, you will need to package the program into an executable file.

For Windows x64, you can run the `generateEXE_win64.cmd` script. This script will package the execution stage program into an .exe file and automatically copy it to the `../ElectronJS/chrome_win64/` directory. The process for other systems is similar.