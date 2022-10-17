# 请您Star Please Star

如果你觉得此工具不错，请轻轻点击此页面右上角**Star**按钮增加项目曝光度，谢谢！

If you think this tool is good, please gently click the **Star** button in the upper right corner at this page to increase the project exposure, thank you!

# 无代码服务可视化Web数据采集爬虫器 Code-Free Visual Web Data Crawler/Spider (Service Wrapper)

一个可以可视化无代码设计和执行的面向服务架构的爬虫软件（服务包装器）。
A service oriented architecture GUI visual code-free web crawler/spider (service wrapper).


# 发布版本
## Windows版本可执行程序：<https://github.com/NaiboWang/ServiceWrapper/releases/download/v0.5.0/ServiceWrapper.7z>
打开压缩包内的ServiceWrapper.exe即可在Windows10/11或以上系统执行，无需配置环境（其余Windows系统需手动安装.net Framework 4.5）。
数据存储后放在Data/文件夹内
## 中文视频教程：<https://github.com/NaiboWang/ServiceWrapper/releases/download/v0.5.0/tutorial_CN.mp4>



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# 目录
注：文档待完善
- [请您Star Please Star](#请您star-please-star)
- [无代码服务可视化Web数据采集爬虫器 Code-Free Visual Web Data Crawler/Spider (Service Wrapper)](#无代码服务可视化web数据采集爬虫器-code-free-visual-web-data-crawlerspider-service-wrapper)
- [发布版本](#发布版本)
  - [Windows版本可执行程序：<https://github.com/NaiboWang/ServiceWrapper/releases/download/v0.5.0/ServiceWrapper.7z>](#windows版本可执行程序httpsgithubcomnaibowangservicewrapperreleasesdownloadv050servicewrapper7z)
  - [中文视频教程：<https://github.com/NaiboWang/ServiceWrapper/releases/download/v0.5.0/tutorial_CN.mp4>](#中文视频教程httpsgithubcomnaibowangservicewrapperreleasesdownloadv050tutorial_cnmp4)
- [目录](#目录)
  - [界面截图](#界面截图)
      - [软件界面示例](#软件界面示例)
      - [块和子块及表单定义](#块和子块及表单定义)
      - [已选中和待选择示例](#已选中和待选择示例)
      - [京东商品块选择示例：](#京东商品块选择示例)
      - [京东商品标题自动匹配选择示例](#京东商品标题自动匹配选择示例)
      - [分块选择所有子元素示例](#分块选择所有子元素示例)
      - [同类型元素自动和手动匹配示例](#同类型元素自动和手动匹配示例)
      - [四种选择方式示例](#四种选择方式示例)
      - [输入文字示例](#输入文字示例)
      - [循环点击58同城房屋标题以进入详情页采集示例](#循环点击58同城房屋标题以进入详情页采集示例)
      - [采集元素文本示例](#采集元素文本示例)
      - [流程图界面介绍](#流程图界面介绍)
      - [循环选项示例](#循环选项示例)
      - [循环点击下一页示例](#循环点击下一页示例)
      - [条件分支示例](#条件分支示例)
      - [完整采集流程图示例](#完整采集流程图示例)
      - [完整采集流程图转换为常规流程图示例](#完整采集流程图转换为常规流程图示例)
      - [服务信息示例](#服务信息示例)
      - [服务调用示例](#服务调用示例)
      - [58 同城房源信息采集服务部分采集结果展示](#58-同城房源信息采集服务部分采集结果展示)
  - [服务包装手动版程序结构](#服务包装手动版程序结构)
    - [Chrome插件部分](#chrome插件部分)
    - [后台流程图部分](#后台流程图部分)
    - [服务展示部分](#服务展示部分)
    - [C#部分](#c部分)
    - [后台服务页面](#后台服务页面)
    - [服务执行](#服务执行)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 界面截图

#### 软件界面示例

![pic](media/Picture.png)
#### 块和子块及表单定义

![pic](media/Picture2.png)
#### 已选中和待选择示例

![pic](media/Picture7.png)
#### 京东商品块选择示例：

![pic](media/Picture1.png)


#### 京东商品标题自动匹配选择示例

![pic](media/Picture5.png)
#### 分块选择所有子元素示例

![pic](media/Picture6.png)

#### 同类型元素自动和手动匹配示例

![pic](media/Picture8.png)
#### 四种选择方式示例

![pic](media/Picture90.png)
#### 输入文字示例

![pic](media/Picture10.png)
#### 循环点击58同城房屋标题以进入详情页采集示例

![pic](media/Picture12.png)
#### 采集元素文本示例

![pic](media/Picture14.png)
#### 流程图界面介绍

![pic](media/Picture4.png)
#### 循环选项示例

![pic](media/Picture9.png)

#### 循环点击下一页示例

![pic](media/Picture11.png)

#### 条件分支示例

![pic](media/Picture13.png)
#### 完整采集流程图示例

![pic](media/Picture16.png)
#### 完整采集流程图转换为常规流程图示例

![pic](media/Picture91.png)
#### 服务信息示例

![pic](media/Picture15.png)

#### 服务调用示例

![pic](media/Picture17.png)


#### 58 同城房源信息采集服务部分采集结果展示
![pic](media/Picture18.png)

## 服务包装手动版程序结构
### Chrome插件部分
* Extension/app内的文件

### 后台流程图部分
* ServiceGrid/frontEnd/FlowChart.html
* ServiceGrid/frontEnd/FlowChart.js
* ServiceGrid/frontEnd/FlowChart.css
* ServiceGrid/frontEnd/logic.css

### 服务展示部分
* 服务列表：ServiceGrid/frontEnd/serviceList.html
* 服务信息：ServiceGrid/frontEnd/serviceInfo.html
* 新服务：ServiceGrid/frontEnd/newService.html
* 调用服务：ServiceGrid/frontEnd/invokeService.html

### C#部分
* C#/内的文件

### 后台服务页面
* Django后台：ServiceGrid/backEnd/*

### 服务执行
* ExcuteStage/ServiceWrapper_ExcuteStage.py
