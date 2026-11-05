## 视频教程

[从源代码编译程序并设计运行和调试任务指南（基于Ubuntu24.04）](https://www.bilibili.com/video/BV1VE421P7yj/)

# 环境编译说明 | Environment Compilation Instruction

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

## 建议编译顺序 | Suggested Compilation Order

1. 编译浏览器扩展，否则在主程序执行时会提示找不到`EasySpider_zh.crx`的错误。
2. 编译主程序，此时主程序可以正常运行，但无法执行任务，只能设计任务。
3. 编译执行阶段程序，否则无法执行任务，只能设计任务。

-----

1. Compile the browser extension, otherwise an error will be prompted when the main program is executed that `EasySpider_en.crx` cannot be found.
2. Compile the main program, at this time the main program can run normally, but can not execute the task, can only design the task.
3. Compile the execution stage program, otherwise the task cannot be executed, can only design the task.


## 环境构建 | Environment Setup

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

## 运行说明 | Run Instruction

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

### 保存名称中的日期 | Dates in Export Names

保存任务时设置的“导出文件名/数据库表格名称”和命令行参数 `--saved_file_name` 支持以下占位符：

- `current_time`：任务开始时的本地时间，格式为 `YYYY_MM_DD_HH_MM_SS`。
- `current_date`：任务开始时的本地日期，格式为 `YYYY_MM_DD`。

例如，`reports_current_date` 在 2026 年 11 月 3 日执行时会生成 `reports_2026_11_03.csv`（CSV 格式）或使用 `reports_2026_11_03` 作为 MySQL 表名。选择“追加”写入模式并保持相同的任务执行 ID，可把当天多次执行的数据追加到同一文件或表；次日启动的任务使用新的日期。日期在任务开始时确定，跨午夜运行的任务仍使用原名称。命令行指定的名称优先于任务中保存的名称。

The export file/database table name saved in the task and the `--saved_file_name` command-line argument support these placeholders:

- `current_time`: local time at task start, formatted as `YYYY_MM_DD_HH_MM_SS`.
- `current_date`: local date at task start, formatted as `YYYY_MM_DD`.

For example, running `reports_current_date` on November 3, 2026 produces `reports_2026_11_03.csv` for CSV output, or uses `reports_2026_11_03` as the MySQL table name. Choose **Append** and keep the same execution ID to append repeated runs on the same day to one file or table. A task started the next day uses a new date; a task running across midnight keeps its original name. A command-line name overrides the name saved in the task.

### MySQL 配置 | MySQL Configuration

导出到 MySQL 时，请准备包含 `host`、`port`、`username`、`password` 和 `database` 的 `mysql_config.json`。若 `config.json` 未设置 `mysql_config_path`，执行器使用与图形界面相同的默认路径 `./mysql_config.json`；自定义配置文件请在 `config.json` 中设置 `"mysql_config_path": "path/to/mysql_config.json"`。

For MySQL output, provide a `mysql_config.json` containing `host`, `port`, `username`, `password`, and `database`. If `config.json` omits `mysql_config_path`, the executor uses the same default path as the GUI: `./mysql_config.json`. To select a custom file, set `"mysql_config_path": "path/to/mysql_config.json"` in `config.json`.

### VS Code调试 | VS Code Debug

可以用VS Code打开此文件夹即可调试程序，可修改`.vscode`下的`launch.json`文件中的调试参数，调试说明参考：[https://zhuanlan.zhihu.com/p/41189402](https://zhuanlan.zhihu.com/p/41189402)。

You can use VS Code to open this folder and debug the program. You can modify the debugging parameters in the launch.json file located under the .vscode folder. For instructions on debugging with VSCode, you can refer to this guide: [Debugging Python with Visual Studio Code](https://code.visualstudio.com/docs/python/debugging).

## 打包说明 | Package Instruction

如果想要在主程序直接点击`本地直接运行`按钮即可执行程序，则需要打包程序为可执行程序。

Windows x64直接运行`generateEXE_win64.cmd`即可把执行阶段程序打包成`exe`文件并自动拷贝到`../ElectronJS/chrome_win64/`目录下，其他系统同理。

-----

To execute the program by simply clicking the `Directly Run Locally` button in the main program, you will need to package the program into an executable file.

For Windows x64, you can run the `generateEXE_win64.cmd` script. This script will package the execution stage program into an .exe file and automatically copy it to the `../ElectronJS/chrome_win64/` directory. The process for other systems is similar.
