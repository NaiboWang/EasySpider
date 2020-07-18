
# 发布版本
## Windows版本可执行程序：<http://naibo.wang/exe/ServiceWrapper.7z>
打开压缩包内的ServiceWrapper.exe即可在Windows10系统执行，无需配置环境。
数据存储后放在Data/文件夹内
## 视频教程：<http://naibo.wang/exe/tutorial.mp4>

# 服务包装手动版程序结构
## Chrome插件部分
* Extension/app内的文件

## 后台流程图部分
* ServiceGrid/frontEnd/FlowChart.html
* ServiceGrid/frontEnd/FlowChart.js
* ServiceGrid/frontEnd/FlowChart.css
* ServiceGrid/frontEnd/logic.css

## 服务展示部分
* 服务列表：ServiceGrid/frontEnd/serviceList.html
* 服务信息：ServiceGrid/frontEnd/serviceInfo.html
* 新服务：ServiceGrid/frontEnd/newService.html
* 调用服务：ServiceGrid/frontEnd/invokeService.html

## C#部分
* C#/内的文件

## 后台服务页面
* Django后台：ServiceGrid/backEnd/*

## 服务执行
* ExcuteStage/ServiceWrapper_ExcuteStage.py
