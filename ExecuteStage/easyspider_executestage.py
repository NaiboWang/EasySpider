# -*- coding: utf-8 -*-
# import atexit
from datetime import datetime
import io  # 遇到错误退出时应执行的代码
import json
# from lib2to3.pgen2 import driver
import re
# import shutil
import subprocess
import sys
# from urllib import parse
# import base64
# import hashlib
import time
import requests
from urllib.parse import urljoin
from lxml import etree
# import undetected_chromedriver as uc
from pynput.keyboard import Key, Listener
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import StaleElementReferenceException, InvalidSelectorException
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.support.ui import Select
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
import random
# import pandas as pd
from openpyxl import load_workbook, Workbook
# import numpy
import csv
import os
from commandline_config import Config
import pytesseract
from PIL import Image
# import uuid
from threading import Thread, Event
from myChrome import MyChrome
if sys.platform != "darwin":
    from myChrome import MyUCChrome
from utils import download_image, get_output_code, isnull, lowercase_tags_in_xpath, myMySQL, new_line, on_press_creator, on_release_creator, write_to_csv, write_to_excel
desired_capabilities = DesiredCapabilities.CHROME
desired_capabilities["pageLoadStrategy"] = "none"

class BrowserThread(Thread):
    def __init__(self, browser_t, id, service, version, event, saveName, config):
        Thread.__init__(self)
        self.browser = browser_t
        self.config = config
        self.id = id
        self.event = event
        try:
            self.saveName = service["saveName"]  # 保存文件的名字
        except:
            now = datetime.now()
            # 将时间格式化为精确到秒的字符串
            self.saveName = now.strftime("%Y_%m_%d_%H_%M_%S")
        self.log = ""
        self.OUTPUT = ""
        self.SAVED = False
        self.BREAK = False
        # 名称设定
        if saveName != "": # 命令行覆盖保存名称
            self.saveName = saveName  # 保存文件的名字
        now = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
        self.saveName = self.saveName.replace("current_time", now)

        print("Save Name for task ID", i, "is:", self.saveName)
        print("任务ID", i, "的保存文件名为:", self.saveName)
        if not os.path.exists("Data/Task_" + str(i)):
            os.mkdir("Data/Task_" + str(i))
        if not os.path.exists("Data/Task_" + str(i) + "/" + self.saveName):
            os.mkdir("Data/Task_" + str(i) + "/" + self.saveName)  # 创建保存文件夹用来保存截图

        stealth_path = driver_path[:driver_path.find(
            "chromedriver")] + "stealth.min.js"
        with open(stealth_path, 'r') as f:
            js = f.read()
            print("Loading stealth.min.js")
        self.browser.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                                     'source': js})  # TMALL 反扒
        WebDriverWait(self.browser, 10)
        self.browser.get('about:blank')
        self.procedure = service["graph"]  # 程序执行流程
        try:
            self.maxViewLength = service["maxViewLength"]  # 最大显示长度
        except:
            self.maxViewLength = 15
        try:
            self.outputFormat = service["outputFormat"]  # 输出格式
        except:
            self.outputFormat = "csv"
        try:
            if service["version"] >= "0.3.1":  # 0.3.1及以上版本以上的EasySpider兼容从0.3.1版本开始的所有版本
                pass
            else:  # 0.3.1以下版本的EasySpider不兼容0.3.1及以上版本的EasySpider
                if service["version"] != version:
                    print("版本不一致，请使用" +
                          service["version"] + "版本的EasySpider运行该任务！")
                    print("Version not match, please use EasySpider " +
                          service["version"] + " to run this task!")
                    self.browser.quit()
                    sys.exit()
        except:  # 0.2.0版本没有version字段，所以直接退出
            print("版本不一致，请使用v0.2.0版本的EasySpider运行该任务！")
            print("Version not match, please use EasySpider v0.2.0 to run this task!")
            self.browser.quit()
            sys.exit()
        try:
            self.save_threshold = service["saveThreshold"]  # 保存最低阈值
        except:
            self.save_threshold = 10
        self.links = list(
            filter(isnull, service["links"].split("\n")))  # 要执行的link的列表
        self.OUTPUT = []  # 采集的数据
        self.writeMode = 1  # 写入模式，0为新建，1为追加
        if self.outputFormat == "csv" or self.outputFormat == "txt":
            if not os.path.exists("Data/Task_" + str(self.id) + "/" + self.saveName + '.' + self.outputFormat):
                self.OUTPUT.append([])  # 添加表头
                self.writeMode = 0
        elif self.outputFormat == "xlsx":
            if not os.path.exists("Data/Task_" + str(self.id) + "/" + self.saveName + '.xlsx'):
                self.OUTPUT.append([])  # 添加表头
                self.writeMode = 0
        elif self.outputFormat == "mysql":
            self.mysql = myMySQL(config["mysql_config_path"])
            self.mysql.create_table(self.saveName, service["outputParameters"])
            self.writeMode = 2
        if self.writeMode == 1:
            print("追加模式")
            print("Append Mode")
        elif self.writeMode == 0:
            print("新建模式")
            print("New Mode")
        elif self.writeMode == 2:
            print("MySQL模式")
            print("MySQL Mode")
        self.containJudge = service["containJudge"]  # 是否含有判断语句
        self.outputParameters = {}
        self.outputParametersTypes = []
        self.outputParametersRecord = [] # 字段是否被记录
        self.dataNotFoundKeys = {}  # 记录没有找到数据的key
        self.log = ""  # 记下现在总共开了多少个标签页
        self.history = {"index": 0, "handle": None}  # 记录页面现在所以在的历史记录的位置
        self.SAVED = False  # 记录是否已经存储了
        for para in service["outputParameters"]: # 初始化输出参数
            if para["name"] not in self.outputParameters.keys():
                self.outputParameters[para["name"]] = ""
                self.dataNotFoundKeys[para["name"]] = False
                try:
                    self.outputParametersTypes.append(para["type"])
                except:
                    self.outputParametersTypes.append("text")
                try:
                    self.outputParametersRecord.append(bool(para["recordASField"]))
                except:
                    self.outputParametersRecord.append(True)
                # 文件叠加的时候不添加表头
                if self.outputFormat == "csv" or self.outputFormat == "txt" or self.outputFormat == "xlsx":
                    if self.writeMode == 0:
                        self.OUTPUT[0].append(para["name"])
        self.urlId = 0  # 全局记录变量
        self.preprocess()  # 预处理，优化提取数据流程

    # 检测如果没有复杂的操作，优化提取数据流程
    def preprocess(self):
        for node in self.procedure:
            try:
                iframe = node["parameters"]["iframe"]
            except:
                node["parameters"]["iframe"] = False
            try:
                node["parameters"]["xpath"] = lowercase_tags_in_xpath(
                    node["parameters"]["xpath"])
            except:
                pass
            if node["option"] == 1:  # 打开网页操作
                try:
                    cookies = node["parameters"]["cookies"]
                except:
                    node["parameters"]["cookies"] = ""
            if node["option"] == 3:  # 提取数据操作
                paras = node["parameters"]["paras"]
                for para in paras:
                    try:
                        iframe = para["iframe"]
                    except:
                        para["iframe"] = False
                    try:
                        para["relativeXPath"] = lowercase_tags_in_xpath(para["relativeXPath"])
                    except:
                        pass
                    if para["beforeJS"] == "" and para["afterJS"] == "" and para["contentType"] <= 1 and para["nodeType"] <= 2:
                        para["optimizable"] = True
                    else:
                        para["optimizable"] = False

    def run(self):
        # 挨个执行程序
        for i in range(len(self.links)):
            print("正在执行第", i + 1, "/ ", len(self.links), "个链接")
            print("Executing link", i + 1, "/ ", len(self.links))
            self.executeNode(0)
            self.urlId = self.urlId + 1
        files = os.listdir("Data/Task_" + str(self.id) + "/" + self.saveName)
        # 如果目录为空，则删除该目录
        if not files:
            os.rmdir("Data/Task_" + str(self.id) + "/" + self.saveName)
        print("Done!")
        print("执行完成！")
        self.recordLog("Done!")
        self.saveData(exit=True)
        if self.outputFormat == "mysql":
            self.mysql.close()

    def recordLog(self, str=""):
        self.log = self.log + str + "\n"

    # 控制台打印log函数

    def Log(self, text, text2=""):
        switch = False
        if switch:
            print(text, text2)

    # @atexit.register
    # def clean(self):
    #     self.saveData(exit=True)
    #     self.browser.quit()
    #     sys.exit(0)

    def saveData(self, exit=False):
        # 每save_threshold条保存一次
        if exit == True or len(self.OUTPUT) >= self.save_threshold:
            # 写入日志
            with open("Data/Task_" + str(self.id) + "/" + self.saveName + '_log.txt', 'a', encoding='utf-8-sig') as file_obj:
                file_obj.write(self.log)
                file_obj.close()
            # 写入数据
            if self.outputFormat == "csv" or self.outputFormat == "txt":
                file_name = "Data/Task_" + \
                    str(self.id) + "/" + self.saveName + '.' + self.outputFormat
                write_to_csv(file_name, self.OUTPUT, self.outputParametersRecord)
            elif self.outputFormat == "xlsx":
                file_name = "Data/Task_" + \
                    str(self.id) + "/" + self.saveName + '.xlsx'
                write_to_excel(file_name, self.OUTPUT, self.outputParametersTypes, self.outputParametersRecord)
            elif self.outputFormat == "mysql":
                self.mysql.write_to_mysql(self.OUTPUT, self.outputParametersRecord, self.outputParametersTypes)
                
            self.OUTPUT = []
            self.log = ""

    def scrollDown(self, para, rt=""):
        try:
            time.sleep(para["scrollWaitTime"])  # 下拉前等待
        except:
            pass
        scrollType = int(para["scrollType"])
        try:
            if scrollType != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
                for i in range(para["scrollCount"]):
                    self.Log("Wait for set second after screen scrolling")
                    body = self.browser.find_element(
                        By.CSS_SELECTOR, "body", iframe=para["iframe"])
                    if scrollType == 1:
                        body.send_keys(Keys.PAGE_DOWN)
                    elif scrollType == 2:
                        body.send_keys(Keys.END)
                    try:
                        time.sleep(para["scrollWaitTime"])  # 下拉完等待
                    except:
                        pass
        except:
            self.Log('Time out after set seconds when scrolling. ')
            self.recordLog('Time out after set seconds when scrolling')
            try:
                self.browser.execute_script('window.stop()')
            except:
                pass
            if scrollType != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
                for i in range(para["scrollCount"]):
                    self.Log("Wait for set second after screen scrolling")
                    body = self.browser.find_element(
                        By.CSS_SELECTOR, "body", iframe=para["iframe"])
                    if scrollType == 1:
                        body.send_keys(Keys.PGDN)
                    elif scrollType == 2:
                        body.send_keys(Keys.END)
                    try:
                        time.sleep(para["scrollWaitTime"])  # 下拉完等待
                    except:
                        pass
            if rt != "":
                rt.end()

    def execute_code(self, codeMode, code, max_wait_time, element=None, iframe=False):
        output = ""
        if code == "":
            return ""
        if max_wait_time == 0:
            max_wait_time = 999999
        # print(codeMode, code)
        # 将value中的Field[""]替换为outputParameters中的键值
        pattern = r'Field\["([^"]+)"\]'
        try:
            replaced_text = re.sub(
                pattern, lambda match: self.outputParameters.get(match.group(1), ''), code)
        except:
            replaced_text = code
        code = replaced_text
        if iframe and self.browser.iframe_env == False:
            # 获取所有的 iframe
            self.browser.switch_to.default_content()
            iframes = self.browser.find_elements(
                By.CSS_SELECTOR, "iframe", iframe=False)
            # 遍历所有的 iframe 并点击里面的元素
            for iframe in iframes:
                # 切换到 iframe
                try:
                    self.browser.switch_to.default_content()
                    self.browser.switch_to.frame(iframe)
                    self.browser.iframe_env = True
                    break
                except:
                    print("Iframe switch failed")
        elif not iframe and self.browser.iframe_env == True:
            self.browser.switch_to.default_content()
            self.browser.iframe_env = False
        if int(codeMode) == 0:
            self.recordLog("Execute JavaScript:" + code)
            self.recordLog("执行JavaScript:" + code)
            self.browser.set_script_timeout(max_wait_time)
            try:
                output = self.browser.execute_script(code)
            except:
                output = ""
                self.recordLog("JavaScript execution failed")
        elif int(codeMode) == 2:
            self.recordLog("Execute JavaScript for element:" + code)
            self.recordLog("对元素执行JavaScript:" + code)
            self.browser.set_script_timeout(max_wait_time)
            try:
                output = self.browser.execute_script(code, element)
            except:
                output = ""
                self.recordLog("JavaScript execution failed")
        elif int(codeMode) == 1:
            self.recordLog("Execute System Call:" + code)
            self.recordLog("执行系统命令:" + code)
            # 执行系统命令
            try:
                # output = subprocess.run(code, capture_output=True, text=True, timeout=max_wait_time, encoding="utf-8", shell=True)
                output = subprocess.run(
                    code, capture_output=True, text=True, timeout=max_wait_time, shell=True)
                # 输出命令返回值
                output = output.stdout
                print(output)
            except subprocess.TimeoutExpired:
                # 命令执行时间超过指定值，抛出异常
                self.recordLog("Command timed out")
                self.recordLog("命令执行超时")
            except Exception as e:
                print(e)  # 打印异常信息
                self.recordLog("Command execution failed")
                self.recordLog("命令执行失败")
        return str(output)

    def customOperation(self, node, loopValue, loopPath, index):
        paras = node["parameters"]
        codeMode = int(paras["codeMode"])
        code = paras["code"]
        output = ""
        max_wait_time = int(paras["waitTime"])
        if codeMode == 2:  # 使用循环的情况下，传入的clickPath就是实际的xpath
            try:
                elements = self.browser.find_elements(
                    By.XPATH, loopPath, iframe=paras["iframe"])
                element = elements[index]
                output = self.execute_code(
                    codeMode, code, max_wait_time, element, iframe=paras["iframe"])
            except:
                output = ""
                print("JavaScript execution failed")
        elif codeMode == 3:
            self.BREAK = True
        else: # 0 1
            output = self.execute_code(
                codeMode, code, max_wait_time, iframe=paras["iframe"])
        recordASField = bool(paras["recordASField"])
        if recordASField:
            print("操作<" + node["title"] + ">的返回值为：" + output)
            print("The return value of operation <" + node["title"] + "> is: " + output)
        self.outputParameters[node["title"]] = output
        if recordASField:
            line = new_line(self.outputParameters, self.maxViewLength, self.outputParametersRecord)
            self.OUTPUT.append(line)

    def switchSelect(self, para, loopValue):
        optionMode = int(para["optionMode"])
        optionValue = para["optionValue"]
        try:
            dropdown = Select(self.browser.find_element(
                By.XPATH, para["xpath"], iframe=para["iframe"]))
            try:
                if optionMode == 0:
                    # 获取当前选中的选项索引
                    current_index = dropdown.options.index(
                        dropdown.first_selected_option)
                    # 计算下一个选项的索引
                    next_index = (current_index + 1) % len(dropdown.options)
                    # 选择下一个选项
                    dropdown.select_by_index(next_index)
                elif optionMode == 1:
                    dropdown.select_by_index(int(optionValue))
                elif optionMode == 2:
                    dropdown.select_by_value(optionValue)
                elif optionMode == 3:
                    dropdown.select_by_visible_text(optionValue)
            except:
                print("切换下拉框选项失败:", para["xpath"],
                      para["optionMode"], para["optionValue"])
                print("Failed to change drop-down box option:",
                      para["xpath"], para["optionMode"], para["optionValue"])
        except:
            print("找不到下拉框元素:", para["xpath"])
            print("Cannot find drop-down box element:", para["xpath"])

    def moveToElement(self, para, loopElement=None, loopPath="", index=0):
        time.sleep(0.1)  # 移动之前等待0.1秒
        if para["useLoop"]:  # 使用循环的情况下，传入的clickPath就是实际的xpath
            path = loopPath
            # element = loopElement
        else:
            index = 0
            path = para["xpath"]  # 不然使用元素定义的xpath
            # element = self.browser.find_element(
            # By.XPATH, path, iframe=para["iframe"])
        try:
            elements = self.browser.find_elements(
                By.XPATH, path, iframe=para["iframe"])
            element = elements[index]
            try:
                ActionChains(self.browser).move_to_element(element).perform()
            except:
                print("移动鼠标到元素失败:", para["xpath"])
                print("Failed to move mouse to element:", para["xpath"])
        except:
            print("找不到元素:", para["xpath"])
            print("Cannot find element:", para["xpath"])

    # 执行节点关键函数部分

    def executeNode(self, nodeId, loopValue="", loopPath="", index=0):
        node = self.procedure[nodeId]
        WebDriverWait(self.browser, 10).until
        # 等待元素出现才进行操作，10秒内未出现则报错
        (EC.visibility_of_element_located(
            (By.XPATH, node["parameters"]["xpath"])))

        # 根据不同选项执行不同操作
        if node["option"] == 0 or node["option"] == 10:  # root操作,条件分支操作
            for i in node["sequence"]:  # 从根节点开始向下读取
                self.executeNode(i, loopValue, loopPath, index)
        elif node["option"] == 1:  # 打开网页操作
            self.recordLog("openPage")
            self.openPage(node["parameters"], loopValue)
        elif node["option"] == 2:  # 点击元素
            self.recordLog("Click")
            self.clickElement(node["parameters"], loopValue, loopPath, index)
        elif node["option"] == 3:  # 提取数据
            self.recordLog("getData")
            self.getData(node["parameters"], loopValue, node["isInLoop"],
                         parentPath=loopPath, index=index)
            self.saveData()
        elif node["option"] == 4:  # 输入文字
            self.inputInfo(node["parameters"], loopValue)
        elif node["option"] == 5:  # 自定义操作
            self.customOperation(node, loopValue, loopPath, index)
            self.saveData()
        elif node["option"] == 6:  # 切换下拉框
            self.switchSelect(node["parameters"], loopValue)
        elif node["option"] == 7:  # 鼠标移动到元素上
            self.moveToElement(node["parameters"], loopValue, loopPath, index)
        elif node["option"] == 8:  # 循环
            self.recordLog("loop")
            self.loopExecute(node, loopValue, loopPath, index)  # 执行循环
        elif node["option"] == 9:  # 条件分支
            self.recordLog("judge")
            self.judgeExecute(node, loopValue, loopPath, index)

        # 执行完之后进行等待
        if node["option"] != 0 and node["option"] != 2:  # 点击元素操作单独定义等待时间操作
            waitTime = 0.01  # 默认等待0.01秒
            if node["parameters"]["wait"] >= 0:
                waitTime = node["parameters"]["wait"]
            try:
                waitType = int(node["parameters"]["waitType"])
            except:
                waitType = 0
            if waitType == 0:  # 固定等待时间
                time.sleep(waitTime)
            elif waitType == 1:  # 随机等待时间
                time.sleep(random.uniform(waitTime * 0.5, waitTime * 1.5))
            self.Log("Wait seconds after node executing: ", waitTime)
        self.event.wait()  # 等待事件结束

    # 对判断条件的处理

    def judgeExecute(self, node, loopElement, clickPath="", index=0):
        executeBranchId = 0  # 要执行的BranchId
        for i in node["sequence"]:
            cnode = self.procedure[i]  # 获得条件分支
            tType = int(cnode["parameters"]["class"])  # 获得判断条件类型
            if tType == 0:  # 什么条件都没有
                executeBranchId = i
                break
            elif tType == 1:  # 当前页面包含文本
                try:
                    bodyText = self.browser.find_element(
                        By.CSS_SELECTOR, "body", iframe=cnode["parameters"]["iframe"]).text
                    if bodyText.find(cnode["parameters"]["value"]) >= 0:
                        executeBranchId = i
                        break
                except:  # 找不到元素下一个条件
                    continue
            elif tType == 2:  # 当前页面包含元素
                try:
                    if self.browser.find_element(By.XPATH, cnode["parameters"]["value"], iframe=cnode["parameters"]["iframe"]):
                        executeBranchId = i
                        break
                except:  # 找不到元素或者xpath写错了，下一个条件
                    continue
            elif tType == 3:  # 当前循环元素包括文本
                try:
                    if loopElement.text.find(cnode["parameters"]["value"]) >= 0:
                        executeBranchId = i
                        break
                except:  # 找不到元素或者xpath写错了，下一个条件
                    continue
            elif tType == 4:  # 当前循环元素包括元素
                try:
                    if loopElement.find_element(By.XPATH, cnode["parameters"]["value"][1:]):
                        executeBranchId = i
                        break
                except:  # 找不到元素或者xpath写错了，下一个条件
                    continue
            elif tType <= 7:  # JS命令返回值
                if tType == 5:  # JS命令返回值等于
                    output = self.execute_code(
                        0, cnode["parameters"]["code"], cnode["parameters"]["waitTime"], iframe=cnode["parameters"]["iframe"])
                elif tType == 6:  # System
                    output = self.execute_code(
                        1, cnode["parameters"]["code"], cnode["parameters"]["waitTime"], iframe=cnode["parameters"]["iframe"])
                elif tType == 7:  # 针对当前循环项的JS命令返回值
                    output = self.execute_code(
                        2, cnode["parameters"]["code"], cnode["parameters"]["waitTime"], loopElement, iframe=cnode["parameters"]["iframe"])
                try:
                    if output.find("rue") != -1:  # 如果返回值中包含true
                        code = 1
                    else:
                        code = int(output)
                except:
                    code = 0
                if code > 0:
                    executeBranchId = i
                    break
        # rt.end()
        if executeBranchId != 0:
            self.executeNode(executeBranchId, loopElement, clickPath, index)

    # 对循环的处理
    def loopExecute(self, node, loopValue, clickPath="", index=0):
        time.sleep(0.1)  # 第一次执行循环的时候强制等待1秒
        # self.Log("循环执行前等待0.1秒")
        self.Log("Wait 0.1 second before loop")
        thisHandle = self.browser.current_window_handle  # 记录本次循环内的标签页的ID
        thisHistoryLength = self.browser.execute_script(
            'return history.length')  # 记录本次循环内的history的length
        self.history["index"] = thisHistoryLength
        self.history["handle"] = thisHandle
        if int(node["parameters"]["loopType"]) == 0:  # 单个元素循环
            # 无跳转标签页操作
            count = 0  # 执行次数
            while True:  # do while循环
                try:
                    finished = False
                    element = self.browser.find_element(
                        By.XPATH, node["parameters"]["xpath"], iframe=node["parameters"]["iframe"])
                    for i in node["sequence"]:  # 挨个执行操作
                        self.executeNode(
                            i, element, node["parameters"]["xpath"], 0)
                        if self.BREAK: # 如果有break操作，下面的操作不执行
                            break
                    if self.BREAK: # 如果有break操作，退出循环
                        self.BREAK = False
                        finished = True
                        break
                    finished = True
                    self.Log("Click: ", node["parameters"]["xpath"])
                    self.recordLog("Click:" + node["parameters"]["xpath"])
                except NoSuchElementException:
                    # except:
                    print("Single loop element not found: ",
                          node["parameters"]["xpath"])
                    print("找不到要循环的单个元素: ", node["parameters"]["xpath"])
                    self.recordLog(
                        "Single loop element not found: " + node["parameters"]["xpath"])
                    for i in node["sequence"]:  # 不带点击元素的把剩余的如提取数据的操作执行一遍
                        if node["option"] != 2:
                            self.executeNode(
                                i, None, node["parameters"]["xpath"], 0)
                    finished = True
                    break  # 如果找不到元素，退出循环
                finally:
                    if not finished:
                        print("\n\n-------Retrying-------\n\n")
                        self.Log("-------Retrying-------: ",
                                 node["parameters"]["xpath"])
                        self.recordLog("ClickNotFound:" +
                                       node["parameters"]["xpath"])
                        for i in node["sequence"]:  # 不带点击元素的把剩余的如提取数据的操作执行一遍
                            if node["option"] != 2:
                                self.executeNode(
                                    i, None, node["parameters"]["xpath"], 0)
                        break  # 如果找不到元素，退出循环
                count = count + 1
                self.Log("Page: ", count)
                self.recordLog("Page:" + str(count))
                # print(node["parameters"]["exitCount"], "-------")
                if node["parameters"]["exitCount"] == count:  # 如果达到设置的退出循环条件的话
                    break
                if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                    output = self.execute_code(int(
                        node["parameters"]["breakMode"]) - 1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"], iframe=node["parameters"]["iframe"])
                    code = get_output_code(output)
                    if code <= 0:
                        break
        elif int(node["parameters"]["loopType"]) == 1:  # 不固定元素列表
            try:
                elements = self.browser.find_elements(By.XPATH,
                                                      node["parameters"]["xpath"], iframe=node["parameters"]["iframe"])
                if len(elements) == 0:
                    print("Loop element not found: ",
                          node["parameters"]["xpath"])
                    print("找不到循环元素: ", node["parameters"]["xpath"])
                    self.recordLog("pathNotFound: " +
                                   node["parameters"]["xpath"])
                for index in range(len(elements)):
                    for i in node["sequence"]:  # 挨个顺序执行循环里所有的操作
                        self.executeNode(i, elements[index],
                                         node["parameters"]["xpath"], index)
                        if self.BREAK:
                            break
                    if self.BREAK:
                        self.BREAK = False
                        break
                    if self.browser.current_window_handle != thisHandle:  # 如果执行完一次循环之后标签页的位置发生了变化
                        while True:  # 一直关闭窗口直到当前标签页
                            self.browser.close()  # 关闭使用完的标签页
                            self.browser.switch_to.window(
                                self.browser.window_handles[-1])
                            if self.browser.current_window_handle == thisHandle:
                                break
                    if self.history["index"] != thisHistoryLength and self.history[
                            "handle"] == self.browser.current_window_handle:  # 如果执行完一次循环之后历史记录发生了变化，注意当前页面的判断
                        difference = thisHistoryLength - \
                            self.history["index"]  # 计算历史记录变化差值
                        self.browser.execute_script(
                            'history.go(' + str(difference) + ')')  # 回退历史记录
                        # if node["parameters"]["historyWait"] > 2:  # 回退后要等待的时间
                        time.sleep(node["parameters"]["historyWait"])
                        # else:
                        # time.sleep(2)
                        # 切换历史记录等待：
                        self.Log("Change history back time or:",
                                 node["parameters"]["historyWait"])
                        try:
                            self.browser.execute_script('window.stop()')
                        except:
                            pass
                    if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                        output = self.execute_code(int(
                            node["parameters"]["breakMode"]) - 1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"], iframe=node["parameters"]["iframe"])
                        code = get_output_code(output)
                        if code <= 0:
                            break
            except NoSuchElementException:
                print("Loop element not found: ", node["parameters"]["xpath"])
                print("找不到循环元素: ", node["parameters"]["xpath"])
                self.recordLog("pathNotFound: " + node["parameters"]["xpath"])
            except Exception as e:
                raise
        elif int(node["parameters"]["loopType"]) == 2:  # 固定元素列表
            # 千万不要忘了分割！！
            for path in node["parameters"]["pathList"].split("\n"):
                try:
                    element = self.browser.find_element(
                        By.XPATH, path, iframe=node["parameters"]["iframe"])
                    for i in node["sequence"]:  # 挨个执行操作
                        self.executeNode(i, element, path, 0)
                        if self.BREAK:
                            break
                    if self.BREAK:
                        self.BREAK = False
                        break
                    if self.browser.current_window_handle != thisHandle:  # 如果执行完一次循环之后标签页的位置发生了变化
                        while True:  # 一直关闭窗口直到当前标签页
                            self.browser.close()  # 关闭使用完的标签页
                            self.browser.switch_to.window(
                                self.browser.window_handles[-1])
                            if self.browser.current_window_handle == thisHandle:
                                break
                    if self.history["index"] != thisHistoryLength and self.history[
                            "handle"] == self.browser.current_window_handle:  # 如果执行完一次循环之后历史记录发生了变化，注意当前页面的判断
                        difference = thisHistoryLength - \
                            self.history["index"]  # 计算历史记录变化差值
                        self.browser.execute_script(
                            'history.go(' + str(difference) + ')')  # 回退历史记录
                        # if node["parameters"]["historyWait"] > 2:  # 回退后要等待的时间
                        time.sleep(node["parameters"]["historyWait"])
                        # else:
                        # time.sleep(2)
                        self.Log("Change history back time or:",
                                 node["parameters"]["historyWait"])
                        try:
                            self.browser.execute_script('window.stop()')
                        except:
                            pass
                except NoSuchElementException:
                    print("Loop element not found: ", path)
                    print("找不到循环元素: ", path)
                    self.recordLog("pathNotFound: " + path)
                    continue  # 循环中找不到元素就略过操作
                except Exception as e:
                    raise
                if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                    output = self.execute_code(int(
                        node["parameters"]["breakMode"]) - 1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"], iframe=node["parameters"]["iframe"])
                    code = get_output_code(output)
                    if code <= 0:
                        break
        elif int(node["parameters"]["loopType"]) == 3:  # 固定文本列表
            textList = node["parameters"]["textList"].split("\n")
            for text in textList:
                self.recordLog("input: " + text)
                for i in node["sequence"]:  # 挨个执行操作
                    self.executeNode(i, text, "", 0)
                    if self.BREAK:
                        break
                if self.BREAK:
                    self.BREAK = False
                    break
                if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                    output = self.execute_code(int(
                        node["parameters"]["breakMode"]) - 1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"], iframe=node["parameters"]["iframe"])
                    code = get_output_code(output)
                    if code <= 0:
                        break
        elif int(node["parameters"]["loopType"]) == 4:  # 固定网址列表
            # tempList = node["parameters"]["textList"].split("\r\n")
            urlList = list(
                filter(isnull, node["parameters"]["textList"].split("\n")))  # 去空行
            # urlList = []
            # for url in tempList:
            #     if url != "":
            #         urlList.append(url)
            for url in urlList:
                self.recordLog("input: " + url)
                for i in node["sequence"]:
                    self.executeNode(i, url, "", 0)
                    if self.BREAK:
                        break
                if self.BREAK:
                    self.BREAK = False
                    break
                if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                    output = self.execute_code(int(
                        node["parameters"]["breakMode"]) - 1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"], iframe=node["parameters"]["iframe"])
                    code = get_output_code(output)
                    if code <= 0:
                        break
        elif int(node["parameters"]["loopType"]) <= 6:  # 命令返回值
            while True:  # do while循环
                if int(node["parameters"]["loopType"]) == 5:  # JS
                    output = self.execute_code(
                        0, node["parameters"]["code"], node["parameters"]["waitTime"], iframe=node["parameters"]["iframe"])
                elif int(node["parameters"]["loopType"]) == 6:  # System
                    output = self.execute_code(
                        1, node["parameters"]["code"], node["parameters"]["waitTime"], iframe=node["parameters"]["iframe"])
                code = get_output_code(output)
                if code <= 0:
                    break
                for i in node["sequence"]:  # 挨个执行操作
                    self.executeNode(i, code, node["parameters"]["xpath"], 0)
                    if self.BREAK:
                        break
                if self.BREAK:
                    self.BREAK = False
                    break
        self.history["index"] = thisHistoryLength
        self.history["handle"] = self.browser.current_window_handle
        self.scrollDown(node["parameters"])

    # 打开网页事件
    def openPage(self, para, loopValue):
        time.sleep(1)  # 打开网页后强行等待至少1秒
        if len(self.browser.window_handles) > 1:
            self.browser.switch_to.window(
                self.browser.window_handles[-1])  # 打开网页操作从第1个页面开始
            self.browser.close()
        self.browser.switch_to.window(
            self.browser.window_handles[0])  # 打开网页操作从第1个页面开始
        self.history["handle"] = self.browser.current_window_handle
        if para["useLoop"]:
            url = loopValue
        elif para["url"] != "about:blank":
            url = self.links[self.urlId]
            # clear output parameters
            for key in self.outputParameters:
                self.outputParameters[key] = ""
        else:
            url = list(filter(isnull, para["links"].split("\n")))[0]
        # 将value中的Field[""]替换为outputParameters中的键值
        pattern = r'Field\["([^"]+)"\]'
        try:
            replaced_text = re.sub(
                pattern, lambda match: self.outputParameters.get(match.group(1), ''), url)
        except:
            replaced_text = url
        url = replaced_text
        try:
            maxWaitTime = int(para["maxWaitTime"])
        except:
            maxWaitTime = 10  # 默认最大等待时间为10秒
        try:
            self.browser.set_page_load_timeout(maxWaitTime)  # 加载页面最大超时时间
            self.browser.set_script_timeout(maxWaitTime)
            self.browser.get(url)
            if para["cookies"] != "":
                self.browser.delete_all_cookies()  # 清除所有已有cookie
                cookies = para["cookies"].split('\n')
                for cookie in cookies:
                    name, value = cookie.split('=', 1)
                    cookie_dict = {'name': name, 'value': value}
                    # 加载 cookie
                    self.browser.add_cookie(cookie_dict)
            self.Log('Loading page: ' + url)
            self.recordLog('Loading page: ' + url)
        except TimeoutException:
            self.Log('Time out after set seconds when loading page: ' + url)
            self.recordLog(
                'Time out after set seconds when loading page: ' + url)
            try:
                self.browser.execute_script('window.stop()')
            except:
                pass
        except Exception as e:
            print("Failed to load page: " + url)
            self.recordLog('Failed to load page: ' + url)
        try:
            self.history["index"] = self.browser.execute_script(
                "return history.length")
        except TimeoutException:
            try:
                self.browser.execute_script('window.stop()')
                self.history["index"] = self.browser.execute_script(
                    "return history.length")
            except:
                self.history["index"] = 0
        self.scrollDown(para)  # 控制屏幕向下滚动

    # 键盘输入事件
    def inputInfo(self, para, loopValue):
        time.sleep(0.1)  # 输入之前等待0.1秒
        self.Log("Wait 0.1 second before input")
        try:
            textbox = self.browser.find_element(
                By.XPATH, para["xpath"], iframe=para["iframe"])
            #     textbox.send_keys(Keys.CONTROL, 'a')
            #     textbox.send_keys(Keys.BACKSPACE)
            self.execute_code(
                2, para["beforeJS"], para["beforeJSWaitTime"], textbox, iframe=para["iframe"])  # 执行前置JS
            # Send the HOME key
            textbox.send_keys(Keys.HOME)
            # Send the SHIFT + END key combination
            textbox.send_keys(Keys.SHIFT, Keys.END)
            # Send the DELETE key
            textbox.send_keys(Keys.DELETE)
            value = ""
            if para["useLoop"]:
                value = loopValue
            else:
                value = para["value"]
            # 将value中的Field[""]替换为outputParameters中的键值
            pattern = r'Field\["([^"]+)"\]'
            try:
                replaced_text = re.sub(
                    pattern, lambda match: self.outputParameters.get(match.group(1), ''), value)
                replaced_text = re.sub(
                    '<enter>', '', replaced_text, flags=re.IGNORECASE)
            except:
                replaced_text = value
            textbox.send_keys(replaced_text)
            if value.lower().find("<enter>") >= 0:
                textbox.send_keys(Keys.ENTER)
            self.execute_code(
                2, para["afterJS"], para["afterJSWaitTime"], textbox, iframe=para["iframe"])  # 执行后置js
        except:
            print("Cannot find input box element:" +
                  para["xpath"] + ", please try to set the wait time before executing this operation")
            print("找不到输入框元素:" + para["xpath"] + "，请尝试在执行此操作前设置等待时间")
            self.recordLog("Cannot find input box element:" +
                           para["xpath"] + "Please try to set the wait time before executing this operation")

    # 点击元素事件

    def clickElement(self, para, loopElement=None, clickPath="", index=0):
        try:
            maxWaitTime = int(para["maxWaitTime"])
        except:
            maxWaitTime = 10
        self.browser.set_page_load_timeout(maxWaitTime)  # 加载页面最大超时时间
        self.browser.set_script_timeout(maxWaitTime)
        # 点击前对该元素执行一段JavaScript代码
        try:
            # element = self.browser.find_element(
            #     By.XPATH, path, iframe=para["iframe"])
            if para["useLoop"]:  # 使用循环的情况下，传入的clickPath就是实际的xpath
                path = clickPath
                # element = loopElement
            else:
                index = 0
                path = para["xpath"]  # 不然使用元素定义的xpath
                # element = self.browser.find_element(
                #     By.XPATH, path, iframe=para["iframe"])
            elements = self.browser.find_elements(
                By.XPATH, path, iframe=para["iframe"])
            element = elements[index]
            if para["beforeJS"] != "":
                self.execute_code(2, para["beforeJS"],
                                  para["beforeJSWaitTime"], element, iframe=para["iframe"])
        except:
            print("Cannot find element:" +
                  path + ", please try to set the wait time before executing this operation")
            print("找不到要点击的元素:" + path + "，请尝试在执行此操作前设置等待时间")
            self.recordLog("Cannot find element:" +
                           path + ", please try to set the wait time before executing this operation")
        tempHandleNum = len(self.browser.window_handles)  # 记录之前的窗口位置
        try:
            click_way = int(para["clickWay"])
        except:
            click_way = 0
        try:
            if click_way == 0:  # 用selenium的点击方法
                actions = ActionChains(self.browser)  # 实例化一个action对象
                actions.click(element).perform()
            elif click_way == 1:  # 用js的点击方法
                script = 'var result = document.evaluate(`' + path + \
                    '`, document, null, XPathResult.ANY_TYPE, null);for(let i=0;i<arguments[0];i++){result.iterateNext();} result.iterateNext().click();'
                self.browser.execute_script(script, str(index))  # 用js的点击方法
        except TimeoutException:
            self.Log('Time out after set seconds when loading clicked page')
            self.recordLog(
                'Time out after set seconds when loading clicked page')
            try:
                self.browser.execute_script('window.stop()')
            except:
                pass
        except Exception as e:
            self.Log(e)
            self.recordLog(str(e))
        # 点击后对该元素执行一段JavaScript代码
        try:
            if para["afterJS"] != "":
                element = self.browser.find_element(
                    By.XPATH, path, iframe=para["iframe"])
                self.execute_code(2, para["afterJS"],
                                  para["afterJSWaitTime"], element, iframe=para["iframe"])
        except:
            print("Cannot find element:" + path)
            self.recordLog("Cannot find element:" +
                           path + ", please try to set the wait time before executing this operation")
            print("找不到要点击的元素:" + path + "，请尝试在执行此操作前设置等待时间")
        waitTime = float(para["wait"]) + 0.01  # 点击之后等待
        try:
            waitType = int(para["waitType"])
        except:
            waitType = 0
        if waitType == 0:  # 固定等待时间
            time.sleep(waitTime)
        elif waitType == 1:  # 随机等待时间
            time.sleep(random.uniform(waitTime * 0.5, waitTime * 1.5))
        if tempHandleNum != len(self.browser.window_handles):  # 如果有新标签页的行为发生
            self.browser.switch_to.window(
                self.browser.window_handles[-1])  # 跳转到新的标签页
            self.history["handle"] = self.browser.current_window_handle
            try:
                self.history["index"] = self.browser.execute_script(
                    "return history.length")
            except TimeoutException:
                try:
                    self.browser.execute_script('window.stop()')
                except:
                    pass
                self.history["index"] = self.browser.execute_script(
                    "return history.length")
        else:
            try:
                self.history["index"] = self.browser.execute_script(
                    "return history.length")
            except TimeoutException:
                try:
                    self.browser.execute_script('window.stop()')
                except:
                    pass
                self.history["index"] = self.browser.execute_script(
                    "return history.length")
                # 如果打开了新窗口，切换到新窗口
        self.scrollDown(para)  # 根据参数配置向下滚动
        # rt.end()

    def get_content(self, p, element):
        content = ""
        if p["contentType"] == 0:
            # 先处理特殊节点类型
            if p["nodeType"] == 2:
                if element.get_attribute("href") != None:
                    content = element.get_attribute("href")
                else:
                    content = ""
            elif p["nodeType"] == 3:
                if element.get_attribute("value") != None:
                    content = element.get_attribute("value")
                else:
                    content = ""
            elif p["nodeType"] == 4:  # 图片
                if element.get_attribute("src") != None:
                    content = element.get_attribute("src")
                else:
                    content = ""
                try:
                    downloadPic = p["downloadPic"]
                except:
                    downloadPic = 0
                if downloadPic == 1:
                    download_image(content, "Data/Task_" +
                                   str(self.id) + "/" + self.saveName + "/")
            else:  # 普通节点
                content = element.text
        elif p["contentType"] == 1:  # 只采集当期元素下的文本，不包括子元素
            if p["nodeType"] == 2:
                if element.get_attribute("href") != None:
                    content = element.get_attribute("href")
                else:
                    content = ""
            elif p["nodeType"] == 3:
                if element.get_attribute("value") != None:
                    content = element.get_attribute("value")
                else:
                    content = ""
            elif p["nodeType"] == 4:  # 图片
                if element.get_attribute("src") != None:
                    content = element.get_attribute("src")
                else:
                    content = ""
                try:
                    downloadPic = p["downloadPic"]
                except:
                    downloadPic = 0
                if downloadPic == 1:
                    download_image(content, "Data/Task_" +
                                   str(self.id) + "/" + self.saveName + "/")
            else:
                command = 'var arr = [];\
                var content = arguments[0];\
                for(var i = 0, len = content.childNodes.length; i < len; i++) {\
                    if(content.childNodes[i].nodeType === 3){  \
                        arr.push(content.childNodes[i].nodeValue);\
                    }\
                }\
                var str = arr.join(" "); \
                return str;'
                content = self.browser.execute_script(command, element).replace(
                    "\n", "").replace("\\s+", " ")
        elif p["contentType"] == 2:
            content = element.get_attribute('innerHTML')
        elif p["contentType"] == 3:
            content = element.get_attribute('outerHTML')
        elif p["contentType"] == 4:
            # 获取元素的背景图片地址
            bg_url = element.value_of_css_property('background-image')
            # 清除背景图片地址中的多余字符
            bg_url = bg_url.replace('url("', '').replace('")', '')
            content = bg_url
        elif p["contentType"] == 5:
            content = self.browser.current_url
        elif p["contentType"] == 6:
            content = self.browser.title
        elif p["contentType"] == 7:
            # 获取整个网页的高度和宽度
            height = self.browser.execute_script(
                "return document.body.scrollHeight")
            width = self.browser.execute_script(
                "return document.body.scrollWidth")
            # 调整浏览器窗口的大小
            self.browser.set_window_size(width, height)
            element.screenshot("Data/Task_" + str(self.id) + "/" + self.saveName +
                               "/" + str(time.time()) + ".png")
        elif p["contentType"] == 8:
            try:
                screenshot = element.screenshot_as_png
                screenshot_stream = io.BytesIO(screenshot)
                # 使用Pillow库打开截图，并转换为灰度图像
                image = Image.open(screenshot_stream).convert('L')
                # 使用Tesseract OCR引擎识别图像中的文本
                text = pytesseract.image_to_string(image,  lang='chi_sim+eng')
                content = text
            except Exception as e:
                content = "OCR Error"
                print("To use OCR, You need to install Tesseract-OCR and add it to the environment variable PATH (need to restart EasySpider after you put in PATH): https://tesseract-ocr.github.io/tessdoc/Installation.html")
                if sys.platform == "win32":
                    print("要使用OCR识别功能，你需要安装Tesseract-OCR并将其添加到环境变量PATH中（添加后需重启EasySpider）：https://blog.csdn.net/u010454030/article/details/80515501\nhttps://www.bilibili.com/video/BV1xz4y1b72D/")
                elif sys.platform == "darwin":
                    print(e)
                    print(
                        "注意以上错误，要使用OCR识别功能，你需要安装Tesseract-OCR并将其添加到环境变量PATH中（添加后需重启EasySpider）：https://zhuanlan.zhihu.com/p/146044810")
                elif sys.platform == "linux":
                    print(e)
                    print(
                        "注意以上错误，要使用OCR识别功能，你需要安装Tesseract-OCR并将其添加到环境变量PATH中（添加后需重启EasySpider）：https://zhuanlan.zhihu.com/p/420259031")
                else:
                    print(e)
                    print("注意以上错误，要使用OCR识别功能，你需要安装Tesseract-OCR并将其添加到环境变量PATH中（添加后需重启EasySpider）：https://blog.csdn.net/u010454030/article/details/80515501\nhttps://www.bilibili.com/video/BV1xz4y1b72D/")
        elif p["contentType"] == 9:
            content = self.execute_code(
                2, p["JS"], p["JSWaitTime"], element, iframe=p["iframe"])
        elif p["contentType"] == 12: # 系统命令返回值
            content = self.execute_code(1, p["JS"], p["JSWaitTime"])
        elif p["contentType"] == 10:  # 下拉框选中的值
            try:
                select_element = Select(element)
                content = select_element.first_selected_option.get_attribute(
                    "value")
            except:
                content = ""
        elif p["contentType"] == 11:  # 下拉框选中的文本
            try:
                select_element = Select(element)
                content = select_element.first_selected_option.text
            except:
                content = ""
        return content

    # 提取数据事件
    def getData(self, para, loopElement, isInLoop=True, parentPath="", index=0):
        try:
            pageHTML = etree.HTML(self.browser.page_source)
        except:
            pageHTML = etree.HTML("")
        if loopElement != "":  # 只在数据在循环中提取时才需要获取循环元素
            try:
                loopElementOuterHTML = loopElement.get_attribute('outerHTML')
            except:
                try:  # 循环点击每个链接如果没有新标签页打开，loopElement会丢失，此时需要重新获取
                    elements = self.browser.find_elements(
                        By.XPATH, parentPath, iframe=para["paras"][0]["iframe"])
                    loopElement = elements[index]
                    loopElementOuterHTML = loopElement.get_attribute(
                        'outerHTML')
                except:
                    loopElementOuterHTML = ""
        else:
            loopElementOuterHTML = ""
        loopElementHTML = etree.HTML(loopElementOuterHTML)
        for p in para["paras"]:
            if p["optimizable"]:
                try:
                    # 只有当前环境不变变化才可以快速提取数据
                    if self.browser.iframe_env != p["iframe"]:
                        p["optimizable"] = False
                        continue
                    # p["relativeXPath"] = p["relativeXPath"].lower()
                    # p["relativeXPath"] = lowercase_tags_in_xpath(p["relativeXPath"])
                    # 已经有text()或@href了，不需要再加
                    if p["relativeXPath"].find("/@href") >= 0 or p["relativeXPath"].find("/text()") >= 0 or p["relativeXPath"].find("::text()") >= 0:
                        xpath = p["relativeXPath"]
                    elif p["nodeType"] == 2:
                        xpath = p["relativeXPath"] + "/@href"
                    elif p["contentType"] == 1:
                        xpath = p["relativeXPath"] + "/text()"
                    elif p["contentType"] == 0:
                        xpath = p["relativeXPath"] + "//text()"
                    if p["relative"]:
                        # if p["relativeXPath"] == "":
                        #     content = [loopElementHTML]
                        # else:
                        # 如果字串里有//即子孙查找，则不动语句
                        if p["relativeXPath"].find("//") >= 0:
                            full_path = "(" + parentPath + \
                                xpath + ")" + \
                                "[" + str(index + 1) + "]"
                            content = pageHTML.xpath(full_path)
                        else:
                            content = loopElementHTML.xpath(
                                "/html/body/" + loopElementHTML[0][0].tag + xpath)
                    else:
                        if xpath.find("/body") < 0:
                            xpath = "/html/body" + xpath
                        content = pageHTML.xpath(xpath)
                    if len(content) > 0:
                        # html = etree.tostring(content[0], encoding='utf-8').decode('utf-8')
                        # 拼接所有文本内容并去掉两边的空白
                        content = ' '.join(result.strip()
                                           for result in content if result.strip())
                        if p["nodeType"] == 2:
                            base_url = self.browser.current_url
                            content = urljoin(base_url, content) # 合并链接相对路径为绝对路径
                    else:
                        content = p["default"]
                        if not self.dataNotFoundKeys[p["name"]]:
                            print('Element %s not found with parameter name %s when extracting data, use default, this error will only show once' % (
                                p["relativeXPath"], p["name"]))
                            print("提取数据操作时，字段名 %s 对应XPath %s 未找到，使用默认值，本字段将不再重复报错" % (
                                p["name"], p["relativeXPath"]))
                            self.dataNotFoundKeys[p["name"]] = True
                            self.recordLog(
                                'Element %s not found, use default' % p["relativeXPath"])
                except Exception as e:
                    if not self.dataNotFoundKeys[p["name"]]:
                        print('Element %s not found with parameter name %s when extracting data, use default, this error will only show once' % (
                            p["relativeXPath"], p["name"]))
                        print("提取数据操作时，字段名 %s 对应XPath %s 未找到（请查看原因，如是否翻页太快页面元素未加载出来），使用默认值，本字段将不再重复报错" % (
                            p["name"], p["relativeXPath"]))
                        self.dataNotFoundKeys[p["name"]] = True
                        self.recordLog(
                            'Element %s not found, use default' % p["relativeXPath"])
                self.outputParameters[p["name"]] = content

        # 对于不能优化的操作，使用selenium执行
        for p in para["paras"]:
            if not p["optimizable"]:
                content = ""
                if not (p["contentType"] == 5 or p["contentType"] == 6):  # 如果不是页面标题或URL，去找元素
                    try:
                        # p["relativeXPath"] = p["relativeXPath"].lower()
                        # p["relativeXPath"] = lowercase_tags_in_xpath(p["relativeXPath"])
                        if p["relative"]:  # 是否相对xpath
                            if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                                element = loopElement
                            else:
                                # 如果字串里有//即子孙查找，则不动语句
                                if p["relativeXPath"].find("//") >= 0:
                                    full_path = "(" + parentPath + \
                                        p["relativeXPath"] + ")" + \
                                        "[" + str(index + 1) + "]"
                                    element = self.browser.find_element(
                                        By.XPATH, full_path, iframe=p["iframe"])
                                else:
                                    element = loopElement.find_element(By.XPATH,
                                                                       p["relativeXPath"][1:])
                        else:
                            element = self.browser.find_element(
                                By.XPATH, p["relativeXPath"], iframe=p["iframe"])
                    except (NoSuchElementException, InvalidSelectorException, StaleElementReferenceException):  # 找不到元素的时候，使用默认值
                        # print(p)
                        try:
                            content = p["default"]
                        except Exception as e:
                            content = ""
                        self.outputParameters[p["name"]] = content
                        try:
                            if not self.dataNotFoundKeys[p["name"]]:
                                print('Element %s not found with parameter name %s when extracting data, use default, this error will only show once' % (
                                    p["relativeXPath"], p["name"]))
                                print("提取数据操作时，字段名 %s 对应XPath %s 未找到，使用默认值，本字段将不再重复报错" % (
                                    p["name"], p["relativeXPath"]))
                                self.dataNotFoundKeys[p["name"]] = True
                                self.recordLog(
                                    'Element %s not found, use default' % p["relativeXPath"])
                        except:
                            pass
                        continue
                    except TimeoutException:  # 超时的时候设置超时值
                        self.Log('Time out after set seconds when getting data')
                        self.recordLog(
                            'Time out after set seconds when getting data')
                        try:
                            self.browser.execute_script('window.stop()')
                        except:
                            pass
                        if p["relative"]:  # 是否相对xpath
                            if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                                element = loopElement
                            else:
                                element = loopElement.find_element(By.XPATH,
                                                                   p["relativeXPath"][1:])
                        else:
                            element = self.browser.find_element(
                                By.XPATH, p["relativeXPath"], iframe=p["iframe"])
                        # rt.end()
                else:
                    element = self.browser.find_element(
                        By.XPATH, "//body", iframe=p["iframe"])
                try:
                    self.execute_code(
                        2, p["beforeJS"], p["beforeJSWaitTime"], element, iframe=p["iframe"])  # 执行前置js
                    content = self.get_content(p, element)
                except StaleElementReferenceException:  # 发生找不到元素的异常后，等待几秒重新查找
                    self.recordLog(
                        'StaleElementReferenceException: '+p["relativeXPath"])
                    time.sleep(3)
                    try:
                        if p["relative"]:  # 是否相对xpath
                            if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                                element = loopElement
                                self.recordLog(
                                    'StaleElementReferenceException: loopElement')
                            else:
                                element = loopElement.find_element(By.XPATH,
                                                                   p["relativeXPath"][1:])
                                self.recordLog(
                                    'StaleElementReferenceException: loopElement+relativeXPath')
                        else:
                            element = self.browser.find_element(
                                By.XPATH, p["relativeXPath"], iframe=p["iframe"])
                            self.recordLog(
                                'StaleElementReferenceException: relativeXPath')
                        content = self.get_content(p, element)
                    except StaleElementReferenceException:
                        self.recordLog(
                            'StaleElementReferenceException: '+p["relativeXPath"])
                        continue  # 再出现类似问题直接跳过
                self.outputParameters[p["name"]] = content
                self.execute_code(
                    2, p["afterJS"], p["afterJSWaitTime"], element, iframe=p["iframe"])  # 执行后置JS
        line = new_line(self.outputParameters, self.maxViewLength, self.outputParametersRecord)
        self.OUTPUT.append(line)
        # rt.end()


if __name__ == '__main__':
    # from multiprocessing import freeze_support
    # freeze_support() # 防止无限死循环多开
    config = {
        "id": [0],
        "saved_file_name": "",
        "user_data": False,
        "config_folder": "",
        "config_file_name": "config.json",
        "read_type": "remote",
        "headless": False,
        "server_address": "http://localhost:8074",
        "version": "0.3.5",
    }
    c = Config(config)
    print(c)
    options = Options()
    driver_path = "chromedriver.exe"
    import platform
    print(sys.platform, platform.architecture())
    option = webdriver.ChromeOptions()
    if not os.path.exists(os.getcwd()+"/Data"):
        os.mkdir(os.getcwd()+"/Data")
    if sys.platform == "darwin" and platform.architecture()[0] == "64bit":
        options.binary_location = "EasySpider.app/Contents/Resources/app/chrome_mac64.app/Contents/MacOS/Google Chrome"
        # MacOS需要用option而不是options！
        option.binary_location = "EasySpider.app/Contents/Resources/app/chrome_mac64.app/Contents/MacOS/Google Chrome"
        option.add_extension("EasySpider.app/Contents/Resources/app/XPathHelper.crx")
        options.add_extension("EasySpider.app/Contents/Resources/app/XPathHelper.crx")
        driver_path = "EasySpider.app/Contents/Resources/app/chromedriver_mac64"
        # options.binary_location = "chrome_mac64.app/Contents/MacOS/Google Chrome"
        # # MacOS需要用option而不是options！
        # option.binary_location = "chrome_mac64.app/Contents/MacOS/Google Chrome"
        # driver_path = os.getcwd()+ "/chromedriver_mac64"
        print(driver_path)
        if c.config_folder == "":
            c.config_folder = os.path.expanduser("~/Library/Application Support/EasySpider/")
        # print("Config folder for MacOS:", c.config_folder)
    elif os.path.exists(os.getcwd()+"/EasySpider/resources"):  # 打包后的路径
        print("Finding chromedriver in EasySpider",
              os.getcwd()+"/EasySpider")
        if sys.platform == "win32" and platform.architecture()[0] == "32bit":
            options.binary_location = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win32/chrome.exe")  # 指定chrome位置
            driver_path = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win32/chromedriver_win32.exe")
            option.add_extension("EasySpider/resources/app/XPathHelper.crx")
            options.add_extension("EasySpider/resources/app/XPathHelper.crx")
        elif sys.platform == "win32" and platform.architecture()[0] == "64bit":
            options.binary_location = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win64/chrome.exe")
            driver_path = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win64/chromedriver_win64.exe")
            option.add_extension("EasySpider/resources/app/XPathHelper.crx")
            options.add_extension("EasySpider/resources/app/XPathHelper.crx")
        elif sys.platform == "linux" and platform.architecture()[0] == "64bit":
            options.binary_location = "EasySpider/resources/app/chrome_linux64/chrome"
            driver_path = "EasySpider/resources/app/chrome_linux64/chromedriver_linux64"
            option.add_extension("EasySpider/resources/app/XPathHelper.crx")
            options.add_extension("EasySpider/resources/app/XPathHelper.crx")
        else:
            print("Unsupported platform")
            sys.exit()
        print("Chrome location:", options.binary_location)
        print("Chromedriver location:", driver_path)
    # elif os.getcwd().find("ExecuteStage") >= 0:  # 如果直接执行
    #     print("Finding chromedriver in ./Chrome",
    #           os.getcwd()+"/Chrome")
    #     options.binary_location = "./Chrome/chrome.exe"  # 指定chrome位置
    #     # option.binary_location = "C:\\Users\\q9823\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"
    #     driver_path = "./Chrome/chromedriver.exe"
    elif os.path.exists(os.getcwd()+"/../ElectronJS"):
        # 软件dev用
        print("Finding chromedriver in EasySpider",
               os.getcwd()+"/ElectronJS")
        option.binary_location = "../ElectronJS/chrome_win64/chrome.exe"  # 指定chrome位置
        driver_path = "../ElectronJS/chrome_win64/chromedriver_win64.exe"
        option.add_extension("../ElectronJS/XPathHelper.crx")
    else:
        options.binary_location = "./chrome.exe"  # 指定chrome位置
        driver_path = "./chromedriver.exe"
        option.add_extension("XPathHelper.crx")

    option.add_experimental_option(
        'excludeSwitches', ['enable-automation'])  # 以开发者模式
    options.add_argument('-ignore-certificate-errors')
    options.add_argument('-ignore -ssl-errors')
    option.add_argument('-ignore-certificate-errors')
    option.add_argument('-ignore -ssl-errors')
    # user_data_dir = r''  # 注意没有Default！

    # options.add_argument('--user-data-dir='+p)

    # 总结：
    # 0. 带Cookie需要用userdatadir
    # 1. chrome_options才是配置用户文件和chrome文件地址的正确选项
    # 2. User Profile文件夹的路径是：C:\Users\用户名\AppData\Local\Google\Chrome\User Data不要加Default
    # 3. 就算User Profile相同，chrome版本不同所存储的cookie信息也不同，也不能爬
    # 4. TMALL如果一直弹出验证码，而且无法通过验证，那么需要在其他浏览器上用
    try:
        with open(c.config_folder + c.config_file_name, "r", encoding='utf-8') as f:
            config = json.load(f)
            print("Config file path: " + c.config_folder + c.config_file_name)
            absolute_user_data_folder = config["absolute_user_data_folder"]
            print("\nAbsolute_user_data_folder:",
                  absolute_user_data_folder, "\n")
    except:
        pass
    if c.user_data:
        option.add_argument(
            f'--user-data-dir={absolute_user_data_folder}')  # TMALL 反扒
        option.add_argument("--profile-directory=Default")
        options.add_argument(
            f'--user-data-dir={absolute_user_data_folder}')  # TMALL 反扒
        options.add_argument("--profile-directory=Default")

    if c.headless:
        print("Headless mode")
        print("无头模式")
        option.add_argument("--headless")
        options.add_argument("--headless")

    # options.add_argument(
    #     '--user-data-dir=C:\\Users\\q9823\\AppData\\Local\\Google\\Chrome\\User Data')  # TMALL 反扒
    option.add_argument(
        "--disable-blink-features=AutomationControlled")  # TMALL 反扒
    options.add_argument(
        "--disable-blink-features=AutomationControlled")  # TMALL 反扒

    threads = []
    for i in c.id:
        # print(options)
        print("id: ", i)
        if c.read_type == "remote":
            print("remote")
            content = requests.get(
                c.server_address + "/queryExecutionInstance?id=" + str(i))
            service = json.loads(content.text)  # 加载服务信息
        else:
            print("local")
            with open("execution_instances/" + str(i) + ".json", 'r', encoding='utf-8') as f:
                content = f.read()
                service = json.loads(content)  # 加载服务信息
        print("Task Name:", service["name"])
        print("任务名称:", service["name"])
        try:
            cloudflare = service["cloudflare"]
        except:
            cloudflare = 0
        if cloudflare == 0:
            options.add_experimental_option("prefs", {
                # 设置文件下载路径
                "download.default_directory": "Data/Task_" + str(i),
                "download.prompt_for_download": False,  # 禁止下载提示框
                "plugins.plugins_list": [{"enabled": False, "name": "Chrome PDF Viewer"}],
                "download.directory_upgrade": True,
                "download.extensions_to_open": "applications/pdf",
                "plugins.always_open_pdf_externally": True  # 总是在外部程序中打开PDF
            })
            option.add_experimental_option("prefs", {
                # 设置文件下载路径
                "download.default_directory": "Data/Task_" + str(i),
                "download.prompt_for_download": False,  # 禁止下载提示框
                "plugins.plugins_list": [{"enabled": False, "name": "Chrome PDF Viewer"}],
                "download.directory_upgrade": True,
                "download.extensions_to_open": "applications/pdf",
                "plugins.always_open_pdf_externally": True  # 总是在外部程序中打开PDF
            })
            try:
                if service["environment"] == 1:
                    option.add_experimental_option(
                        'mobileEmulation', {'deviceName': 'iPhone X'})  # 模拟iPhone X浏览
                    options.add_experimental_option(
                        'mobileEmulation', {'deviceName': 'iPhone X'})  # 模拟iPhone X浏览
            except:
                pass
            browser_t = MyChrome(
                options=options, chrome_options=option, executable_path=driver_path)
        elif cloudflare == 1:
            if sys.platform != "darwin":
                browser_t = MyUCChrome(
                options=options, chrome_options=option, driver_executable_path=driver_path)
                print("Pass Cloudflare Mode")
                print("过Cloudflare验证模式")
            else:
                print("Not support Cloudflare Mode on MacOS")
                print("MacOS不支持Cloudflare验证模式")
                sys.exit()
        event = Event()
        event.set()
        thread = BrowserThread(browser_t, i, service,
                               c.version, event, c.saved_file_name, config=config)
        print("Thread with task id: ", i, " is created")
        threads.append(thread)
        thread.start()
        # Set the pause operation
        # if sys.platform != "linux": 
        #     time.sleep(3)
        #     print("\n\n----------------------------------")
        #     print("正在运行任务，长按键盘p键可暂停任务的执行以便手工操作浏览器如输入验证码；如果想恢复任务的执行，请再次长按p键。")
        #     print("Running task, long press 'p' to pause the task for manual operation of the browser such as entering the verification code; If you want to resume the execution of the task, please long press 'p' again.")
        #     print("----------------------------------\n\n")
        #     Thread(target=check_pause, args=("p", event)).start()
        # else:
        time.sleep(3)
        press_time = {"duration": 0, "is_pressed": False}
        print("\n\n----------------------------------")
        print("正在运行任务，长按键盘p键可暂停任务的执行以便手工操作浏览器如输入验证码；如果想恢复任务的执行，请再次长按p键。")
        print("Running task, long press 'p' to pause the task for manual operation of the browser such as entering the verification code; If you want to resume the execution of the task, please long press 'p' again.")
        print("----------------------------------\n\n")
        # 使用监听器监听键盘输入
        try:
            with Listener(on_press=on_press_creator(press_time, event), on_release=on_release_creator(event, press_time)) as listener:
                listener.join()
        except:
            pass
            # print("您的操作系统不支持暂停功能。")
            # print("Your operating system does not support the pause function.")
            
        
    # print("线程长度：", len(threads) )
	
    for thread in threads:
        print()
        thread.join()

    for thread in threads:
        thread.browser.quit()
        # print("Thread with task id: ", thread.id, " is closed")
        print("程序已运行完成，请手动关闭此窗口。")
        print("The program has finished running, please manually close this window.")
