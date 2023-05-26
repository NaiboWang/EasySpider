# -*- coding: utf-8 -*-

# 此脚本已停止维护，新版本已经使用easyspider_executestage.py替代，因为新版本的easyspider_executestage.py可以同时执行多个爬虫，而此脚本只能执行单个爬虫
# This script has been discontinued. The new version has used easyspider_executestage.py instead, because the new version of easyspider_executestage.py can execute multiple crawlers at the same time, while this script can only execute a single crawler

import atexit
import io  # 遇到错误退出时应执行的代码
import json
from lib2to3.pgen2 import driver
import re
import subprocess
import sys
from urllib import parse
import base64
import hashlib
import time
import requests
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
import random
# import numpy
import csv
import os
from selenium.webdriver.common.by import By
from commandline_config import Config
import pytesseract
from PIL import Image
import uuid

saveName, log, OUTPUT, browser, SAVED = None, "", "", None, False

desired_capabilities = DesiredCapabilities.CHROME
desired_capabilities["pageLoadStrategy"] = "none"
outputParameters = {}


class Time:
    def __init__(self, type1=""):
        self.t = int(round(time.time() * 1000))
        self.type = type1

    def end(self):
        at = int(round(time.time() * 1000))
        Log(str(self.type)+":"+str(at-self.t))

# 记录log


def recordLog(str=""):
    global log
    log = log + str + "\n"


# 控制台打印log函数
def Log(text, text2=""):
    switch = False
    if switch:
        print(text, text2)

# 屏幕滚动函数



def download_image(url, save_directory):
    # 定义浏览器头信息
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # 发送 GET 请求获取图片数据
    response = requests.get(url, headers=headers)

    # 检查响应状态码是否为成功状态
    if response.status_code == requests.codes.ok:
        # 提取文件名
        file_name = url.split('/')[-1]
        
        # 生成唯一的新文件名
        new_file_name = str(uuid.uuid4()) + '_' + file_name
        
        # 构建保存路径
        save_path = os.path.join(save_directory, new_file_name)
        
        # 保存图片到本地
        with open(save_path, 'wb') as file:
            file.write(response.content)
        
        print("图片已成功下载到:", save_path)
        print("The image has been successfully downloaded to:", save_path)
    else:
        print("下载图片失败，请检查此图片链接是否有效:", url)
        print("Failed to download image, please check if this image link is valid:", url)


def scrollDown(para, rt=""):
    scrollType = int(para["scrollType"])
    try:
        if scrollType != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
            for i in range(para["scrollCount"]):
                Log("Wait for set second after screen scrolling")
                body = browser.find_element(By.CSS_SELECTOR, "body")
                if scrollType == 1:
                    body.send_keys(Keys.PAGE_DOWN)
                elif scrollType == 2:
                    body.send_keys(Keys.END)
                time.sleep(para["scrollWaitTime"])  # 下拉完等待
    except TimeoutException:
        Log('time out after set seconds when scrolling. ')
        recordLog('time out after set seconds when scrolling')
        browser.execute_script('window.stop()')
        if scrollType != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
            for i in range(para["scrollCount"]):
                Log("Wait for set second after screen scrolling")
                body = browser.find_element(By.CSS_SELECTOR, "body")
                if scrollType == 1:
                    body.send_keys(Keys.PGDN)
                elif scrollType == 2:
                    body.send_keys(Keys.END)
                time.sleep(para["scrollWaitTime"])  # 下拉完等待
        if rt != "":
            rt.end()

def execute_code(codeMode, code, max_wait_time, element=None):
    output = ""
    if code == "":
        return ""
    if max_wait_time == 0:
        max_wait_time = 999999
    # print(codeMode, code)
    if int(codeMode) == 0:
        recordLog("Execute JavaScript:" + code)
        recordLog("执行JavaScript:" + code)
        browser.set_script_timeout(max_wait_time)
        try:
            output = browser.execute_script(code)
        except:
            output = ""
            recordLog("JavaScript execution failed")
    elif int(codeMode) == 2:
        recordLog("Execute JavaScript for element:" + code)
        recordLog("对元素执行JavaScript:" + code)
        browser.set_script_timeout(max_wait_time)
        try:
            output = browser.execute_script(code, element)
        except:
            output = ""
            recordLog("JavaScript execution failed")
    elif int(codeMode) == 1:
        recordLog("Execute System Call:" + code)
        recordLog("执行系统命令:" + code)
        # 执行系统命令，超时时间为5秒
        try:
            output = subprocess.run(code, capture_output=True, text=True, timeout=max_wait_time, encoding="utf-8")
            # 输出命令返回值
            output = output.stdout
            print(output)
        except subprocess.TimeoutExpired:
            # 命令执行时间超过5秒，抛出异常
            recordLog("Command timed out")
            recordLog("命令执行超时")
        except:
            recordLog("Command execution failed")
            recordLog("命令执行失败")
    return str(output)

def customOperation(node, loopValue, loopPath, index):
    paras = node["parameters"]
    codeMode = int(paras["codeMode"])
    code = paras["code"]
    max_wait_time = int(paras["waitTime"])
    if codeMode == 2:  # 使用循环的情况下，传入的clickPath就是实际的xpath
        try:
            elements = browser.find_elements(By.XPATH, loopPath)
            element = elements[index]
            output = execute_code(codeMode, code, max_wait_time, element)
        except:
            output = ""
            print("JavaScript execution failed")
    else:
        output = execute_code(codeMode, code, max_wait_time)
    recordASField = int(paras["recordASField"])
    if recordASField:
        global OUTPUT, outputParameters
        outputParameters[node["title"]] = output
        line = []
        for value in outputParameters.values():
            line.append(value)
            print(value[:15], " ", end="")
        print("")
        OUTPUT.append(line)

def switchSelect(para, loopValue):
    optionMode = int(para["optionMode"])
    optionValue = para["optionValue"]
    try:
        dropdown = Select(browser.find_element(By.XPATH, para["xpath"]))
        try:
            if optionMode == 0:
                # 获取当前选中的选项索引
                current_index = dropdown.options.index(dropdown.first_selected_option)
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
            print("切换下拉框选项失败:", para["xpath"], para["optionMode"], para["optionValue"])
            print("Failed to change drop-down box option:", para["xpath"], para["optionMode"], para["optionValue"])
    except:
        print("找不到下拉框元素:", para["xpath"])
        print("Cannot find drop-down box element:", para["xpath"])


def moveToElement(para, loopElement=None, loopPath="", index=0):
    time.sleep(0.1)  # 移动之前等待0.1秒
    if para["useLoop"]:  # 使用循环的情况下，传入的clickPath就是实际的xpath
        path = loopPath
    else:
        index = 0
        path = para["xpath"]  # 不然使用元素定义的xpath
    try:
        elements = browser.find_elements(By.XPATH, path)
        element = elements[index]
        try:
            ActionChains(browser).move_to_element(element).perform()
        except:
            print("移动鼠标到元素失败:", para["xpath"])
            print("Failed to move mouse to element:", para["xpath"])
    except:
        print("找不到元素:", para["xpath"])
        print("Cannot find element:", para["xpath"])


# 执行节点关键函数部分
def executeNode(nodeId, loopValue="", loopPath="", index=0):
    node = procedure[nodeId]
    WebDriverWait(browser, 10).until
    # 等待元素出现才进行操作，10秒内未出现则报错
    (EC.visibility_of_element_located((By.XPATH, node["parameters"]["xpath"])))

    # 根据不同选项执行不同操作
    if node["option"] == 0 or node["option"] == 10:  # root操作,条件分支操作
        for i in node["sequence"]:  # 从根节点开始向下读取
            executeNode(i, loopValue, loopPath, index)
    elif node["option"] == 1:  # 打开网页操作
        recordLog("openPage")
        openPage(node["parameters"], loopValue)
    elif node["option"] == 2:  # 点击元素
        recordLog("Click")
        clickElement(node["parameters"], loopValue, loopPath, index)
    elif node["option"] == 3:  # 提取数据
        recordLog("getData")
        getData(node["parameters"], loopValue, node["isInLoop"],
                parentPath=loopPath, index=index)
        saveData()
    elif node["option"] == 4:  # 输入文字
        inputInfo(node["parameters"], loopValue)
    elif node["option"] == 5:  # 自定义操作
        customOperation(node, loopValue, loopPath, index)
        saveData()
    elif node["option"] == 6:  # 切换下拉框
        switchSelect(node["parameters"], loopValue)
    elif node["option"] == 7:  # 鼠标移动到元素上
        moveToElement(node["parameters"], loopValue, loopPath, index)
    elif node["option"] == 8:  # 循环
        recordLog("loop")
        loopExecute(node, loopValue, loopPath, index)  # 执行循环
    elif node["option"] == 9:  # 条件分支
        recordLog("judge")
        judgeExecute(node, loopValue, loopPath, index)

    # 执行完之后进行等待
    if node["option"] != 0:
        waitTime = 0.01  # 默认等待0.01秒
        if node["parameters"]["wait"] > 1:
            waitTime = node["parameters"]["wait"]
        time.sleep(waitTime)
        Log("Wait seconds after node executing: ", waitTime)


# 对判断条件的处理
def judgeExecute(node, loopElement, clickPath="", index=0):
    # rt = Time("IF Condition")
    global bodyText  # 引入bodyText
    executeBranchId = 0  # 要执行的BranchId
    for i in node["sequence"]:
        cnode = procedure[i]  # 获得条件分支
        tType = int(cnode["parameters"]["class"])  # 获得判断条件类型
        if tType == 0:  # 什么条件都没有
            executeBranchId = i
            break
        elif tType == 1:  # 当前页面包含文本
            try:
                if bodyText.find(cnode["parameters"]["value"]) >= 0:
                    executeBranchId = i
                    break
            except:  # 找不到元素下一个条件
                continue
        elif tType == 2:  # 当前页面包含元素
            try:
                if browser.find_element(By.XPATH, cnode["parameters"]["value"]):
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
                output = execute_code(0, cnode["parameters"]["code"], cnode["parameters"]["waitTime"])
            elif tType == 6:  # System
                output = execute_code(1, cnode["parameters"]["code"], cnode["parameters"]["waitTime"])
            elif tType == 7:  # 针对当前循环项的JS命令返回值
                output = execute_code(2, cnode["parameters"]["code"], cnode["parameters"]["waitTime"], loopElement)
            try:
                if output.find("rue") != -1: # 如果返回值中包含true
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
        executeNode(executeBranchId, loopElement, clickPath, index)

def get_output_code(output):
    try:
        if output.find("rue") != -1: # 如果返回值中包含true
            code = 1
        else:
            code = int(output)
    except:
        code = 0
    return code

# 对循环的处理
def loopExecute(node, loopValue, clickPath="", index=0):
    time.sleep(0.1)  # 第一次执行循环的时候强制等待1秒
    # Log("循环执行前等待0.1秒")
    Log("Wait 0.1 second before loop")
    global history
    thisHandle = browser.current_window_handle  # 记录本次循环内的标签页的ID
    thisHistoryLength = browser.execute_script(
        'return history.length')  # 记录本次循环内的history的length
    history["index"] = thisHistoryLength
    history["handle"] = thisHandle

    if int(node["parameters"]["loopType"]) == 0:  # 单个元素循环
        # 无跳转标签页操作
        count = 0  # 执行次数
        while True:  # do while循环
            try:
                finished = False
                element = browser.find_element(
                    By.XPATH, node["parameters"]["xpath"])
                for i in node["sequence"]:  # 挨个执行操作
                    executeNode(i, element, node["parameters"]["xpath"], 0)
                finished = True
                Log("click: ", node["parameters"]["xpath"])
                recordLog("click:" + node["parameters"]["xpath"])
            except NoSuchElementException:
                # except:
                print("Single loop element not found: ", node["parameters"]["xpath"])
                print("找不到要循环的单个元素: ", node["parameters"]["xpath"])
                recordLog("Single loop element not found: " + node["parameters"]["xpath"])
                for i in node["sequence"]:  # 不带点击元素的把剩余的如提取数据的操作执行一遍
                    if node["option"] != 2:
                        executeNode(i, None, node["parameters"]["xpath"], 0)
                finished = True
                break  # 如果找不到元素，退出循环
            finally:
                if not finished:
                    print("\n\n-------Retrying-------\n\n")
                    Log("-------Retrying-------: ",
                        node["parameters"]["xpath"])
                    recordLog("clickNotFound:" + node["parameters"]["xpath"])
                    for i in node["sequence"]:  # 不带点击元素的把剩余的如提取数据的操作执行一遍
                        if node["option"] != 2:
                            executeNode(i, None, node["parameters"]["xpath"], 0)
                    break  # 如果找不到元素，退出循环
            count = count + 1
            Log("Page: ", count)
            recordLog("Page:" + str(count))
            # print(node["parameters"]["exitCount"], "-------")
            if node["parameters"]["exitCount"] == count:  # 如果达到设置的退出循环条件的话
                break
            if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                output = execute_code(int(node["parameters"]["breakMode"]) -1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"])
                code = get_output_code(output)
                if code <= 0:
                    break
    elif int(node["parameters"]["loopType"]) == 1:  # 不固定元素列表
        try:
            elements = browser.find_elements(By.XPATH,
                                             node["parameters"]["xpath"])
            if len(elements) == 0:
                print("Loop element not found: ", node["parameters"]["xpath"])
                print("找不到循环元素: ", node["parameters"]["xpath"])
                recordLog("pathNotFound: " + node["parameters"]["xpath"])
            for index in range(len(elements)):
                for i in node["sequence"]:  # 挨个顺序执行循环里所有的操作
                    executeNode(i, elements[index],
                               node["parameters"]["xpath"], index)
                if browser.current_window_handle != thisHandle:  # 如果执行完一次循环之后标签页的位置发生了变化
                    while True:  # 一直关闭窗口直到当前标签页
                        browser.close()  # 关闭使用完的标签页
                        browser.switch_to.window(browser.window_handles[-1])
                        if browser.current_window_handle == thisHandle:
                            break
                if history["index"] != thisHistoryLength and history[
                        "handle"] == browser.current_window_handle:  # 如果执行完一次循环之后历史记录发生了变化，注意当前页面的判断
                    difference = thisHistoryLength - \
                        history["index"]  # 计算历史记录变化差值
                    browser.execute_script(
                        'history.go(' + str(difference) + ')')  # 回退历史记录
                    if node["parameters"]["historyWait"] > 2:  # 回退后要等待的时间
                        time.sleep(node["parameters"]["historyWait"])
                    else:
                        time.sleep(2)
                    # 切换历史记录等待2秒或者：
                    Log("Change history back time or:",
                        node["parameters"]["historyWait"])
                    browser.execute_script('window.stop()')
                if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                    output = execute_code(int(node["parameters"]["breakMode"]) -1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"])
                    code = get_output_code(output)
                    if code <= 0:
                        break
        except NoSuchElementException:
            print("Loop element not found: ", node["parameters"]["xpath"])
            print("找不到循环元素: ", node["parameters"]["xpath"])
            recordLog("pathNotFound: " + node["parameters"]["xpath"])
        except Exception as e:
            raise
    elif int(node["parameters"]["loopType"]) == 2:  # 固定元素列表
        for path in node["parameters"]["pathList"].split("\n"):  # 千万不要忘了分割！！
            try:
                element = browser.find_element(By.XPATH, path)
                for i in node["sequence"]:  # 挨个执行操作
                    executeNode(i, element, path, 0)
                if browser.current_window_handle != thisHandle:  # 如果执行完一次循环之后标签页的位置发生了变化
                    while True:  # 一直关闭窗口直到当前标签页
                        browser.close()  # 关闭使用完的标签页
                        browser.switch_to.window(browser.window_handles[-1])
                        if browser.current_window_handle == thisHandle:
                            break
                if history["index"] != thisHistoryLength and history[
                        "handle"] == browser.current_window_handle:  # 如果执行完一次循环之后历史记录发生了变化，注意当前页面的判断
                    difference = thisHistoryLength - \
                        history["index"]  # 计算历史记录变化差值
                    browser.execute_script(
                        'history.go(' + str(difference) + ')')  # 回退历史记录
                    if node["parameters"]["historyWait"] > 2:  # 回退后要等待的时间
                        time.sleep(node["parameters"]["historyWait"])
                    else:
                        time.sleep(2)
                    Log("Change history back time or:",
                        node["parameters"]["historyWait"])
                    browser.execute_script('window.stop()')
            except NoSuchElementException:
                print("Loop element not found: ", path)
                print("找不到循环元素: ", path)
                recordLog("pathNotFound: " + path)
                continue  # 循环中找不到元素就略过操作
            except Exception as e:
                raise
            if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                output = execute_code(int(node["parameters"]["breakMode"]) -1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"])
                code = get_output_code(output)
                if code <= 0:
                    break
    elif int(node["parameters"]["loopType"]) == 3:  # 固定文本列表
        textList = node["parameters"]["textList"].split("\n")
        for text in textList:
            recordLog("input: " + text)
            for i in node["sequence"]:  # 挨个执行操作
                executeNode(i, text, "", 0)
            if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                output = execute_code(int(node["parameters"]["breakMode"]) -1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"])
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
            recordLog("input: " + url)
            for i in node["sequence"]:
                executeNode(i, url, "", 0)
            if int(node["parameters"]["breakMode"]) > 0:  # 如果设置了退出循环的脚本条件
                output = execute_code(int(node["parameters"]["breakMode"]) -1, node["parameters"]["breakCode"], node["parameters"]["breakCodeWaitTime"])
                code = get_output_code(output)
                if code <= 0:
                    break
    elif int(node["parameters"]["loopType"]) <= 6:  # 命令返回值
        while True:  # do while循环
            if int(node["parameters"]["loopType"]) == 5:  # JS
                output = execute_code(0, node["parameters"]["code"], node["parameters"]["waitTime"])
            elif int(node["parameters"]["loopType"]) == 6:  # System
                output = execute_code(1, node["parameters"]["code"], node["parameters"]["waitTime"])
            code = get_output_code(output)
            if code <= 0:
                break
            for i in node["sequence"]:  # 挨个执行操作
                executeNode(i, code, node["parameters"]["xpath"], 0)
    history["index"] = thisHistoryLength
    history["handle"] = browser.current_window_handle
    scrollDown(node["parameters"])


# 打开网页事件
def openPage(para, loopValue):
    # rt = Time("打开网页")
    time.sleep(2)  # 打开网页后强行等待至少2秒
    global links
    global urlId
    global history
    global outputParameters
    # try:
    #     firstTime = True
    #     for handle in browser.window_handles:
    #         browser.switch_to.window(handle)
    #         if (not firstTime):
    #             browser.close()
    #         firstTime = False
    # except:
    #     return
    if len(browser.window_handles) > 1:
        browser.switch_to.window(browser.window_handles[-1])  # 打开网页操作从第1个页面开始
        browser.close()
    browser.switch_to.window(browser.window_handles[0])  # 打开网页操作从第1个页面开始
    history["handle"] = browser.current_window_handle
    if para["useLoop"]:
        url = loopValue
    else:
        url = links[urlId]
    try:
        maxWaitTime = int(para["maxWaitTime"])
    except:
        maxWaitTime = 10 # 默认最大等待时间为10秒
    try:
        browser.set_page_load_timeout(maxWaitTime)  # 加载页面最大超时时间
        browser.set_script_timeout(maxWaitTime)
        browser.get(url)
        Log('Loading page: ' + url)
        recordLog('Loading page: ' + url)
    except TimeoutException:
        Log('time out after set seconds when loading page: ' + url)
        recordLog('time out after set seconds when loading page: ' + url)
        browser.execute_script('window.stop()')
        # rt.end()
    try:
        history["index"] = browser.execute_script("return history.length")
    except TimeoutException:
        browser.execute_script('window.stop()')
        history["index"] = browser.execute_script("return history.length")
        # rt.end()
    scrollDown(para)  # 控制屏幕向下滚动
    if containJudge:
        global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
        try:
            bodyText = browser.find_element(By.CSS_SELECTOR, "body").text
            Log('URL Page: ' + url)
            recordLog('URL Page: ' + url)
        except TimeoutException:
            Log('Time out after set seconds when getting body text: ' + url)
            recordLog('Time out after set seconds when getting body text:: ' + url)
            browser.execute_script('window.stop()')
            time.sleep(1)
            Log("Need to wait 1 second to get body text")
            # 再执行一遍
            bodyText = browser.find_element(By.CSS_SELECTOR, "body").text
            # rt.end()
        except Exception as e:
            Log(e)
            recordLog(str(e))

    # clear output parameters
    for key in outputParameters:
        outputParameters[key] = ""

    # rt.end()


# 键盘输入事件
def inputInfo(para, loopValue):
    time.sleep(0.1)  # 输入之前等待0.1秒
    Log("Wait 1 second before input")
    try:
        textbox = browser.find_element(By.XPATH, para["xpath"])
        #     textbox.send_keys(Keys.CONTROL, 'a')
        #     textbox.send_keys(Keys.BACKSPACE)
        execute_code(2, para["beforeJS"], para["beforeJSWaitTime"], textbox) # 执行前置JS
        # Send the HOME key
        textbox.send_keys(Keys.HOME)
        # Send the SHIFT + END key combination
        textbox.send_keys(Keys.SHIFT, Keys.END)
        # Send the DELETE key
        textbox.send_keys(Keys.DELETE)
        if para["useLoop"]:
            textbox.send_keys(loopValue)
        else:
            textbox.send_keys(para["value"])
        execute_code(2, para["afterJS"], para["afterJSWaitTime"], textbox) # 执行后置js
        global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
        bodyText = browser.find_element(By.CSS_SELECTOR, "body").text
    except:
        print("Cannot find input box element:" +
            para["xpath"] + ", please try to set the wait time before executing this operation")
        print("找不到输入框元素:" + para["xpath"] + "，请尝试在执行此操作前设置等待时间")
        recordLog("Cannot find input box element:" +
                  para["xpath"] + "Please try to set the wait time before executing this operation")


# 点击元素事件
def clickElement(para, loopElement=None, clickPath="", index=0):
    global history
    time.sleep(0.1)  # 点击之前等待0.1秒
    # rt = Time("Click Element")
    Log("Wait 0.1 second before clicking element")
    if para["useLoop"]:  # 使用循环的情况下，传入的clickPath就是实际的xpath
        path = clickPath
    else:
        path = para["xpath"]  # 不然使用元素定义的xpath
    try:
        maxWaitTime = int(para["maxWaitTime"])
    except:
        maxWaitTime = 10
    browser.set_page_load_timeout(maxWaitTime)  # 加载页面最大超时时间
    browser.set_script_timeout(maxWaitTime)
    # 点击前对该元素执行一段JavaScript代码
    try:
        element = browser.find_element(By.XPATH, path)
        if para["beforeJS"] != "":
            execute_code(2, para["beforeJS"], para["beforeJSWaitTime"], element)
    except:
        print("Cannot find element:" +
            path + ", please try to set the wait time before executing this operation")
        print("找不到要点击的元素:" + path + "，请尝试在执行此操作前设置等待时间")
        recordLog("Cannot find element:" +
                  path + ", please try to set the wait time before executing this operation")
    tempHandleNum = len(browser.window_handles)  # 记录之前的窗口位置
    try:
        script = 'var result = document.evaluate(`' + path + \
            '`, document, null, XPathResult.ANY_TYPE, null);for(let i=0;i<arguments[0];i++){result.iterateNext();} result.iterateNext().click();'
        browser.execute_script(script, str(index))  # 用js的点击方法
    except TimeoutException:
        Log('time out after set seconds when loading clicked page')
        recordLog('time out after set seconds when loading clicked page')
        browser.execute_script('window.stop()')
        # rt.end()
    except Exception as e:
        Log(e)
        recordLog(str(e))
    time.sleep(0.5)  # 点击之后等半秒
    Log("Wait 0.5 second after clicking element")
    time.sleep(random.uniform(1, 2))  # 生成一个a到b的小数等待时间
    # 点击前对该元素执行一段JavaScript代码
    try:
        if para["afterJS"] != "":
            element = browser.find_element(By.XPATH, path)
            execute_code(2, para["afterJS"], para["afterJSWaitTime"], element)
    except:
        print("Cannot find element:" + path)
        recordLog("Cannot find element:" +
                  path + ", please try to set the wait time before executing this operation")
        print("找不到要点击的元素:" + path + "，请尝试在执行此操作前设置等待时间")
    if tempHandleNum != len(browser.window_handles):  # 如果有新标签页的行为发生
        browser.switch_to.window(browser.window_handles[-1])  # 跳转到新的标签页
        history["handle"] = browser.current_window_handle
        try:
            history["index"] = browser.execute_script("return history.length")
        except TimeoutException:
            browser.execute_script('window.stop()')
            history["index"] = browser.execute_script("return history.length")
            # rt.end()
    else:
        try:
            history["index"] = browser.execute_script("return history.length")
        except TimeoutException:
            browser.execute_script('window.stop()')
            history["index"] = browser.execute_script("return history.length")
            # rt.end()
        # 如果打开了新窗口，切换到新窗口
    scrollDown(para)  # 根据参数配置向下滚动
    if containJudge:  # 有判断语句才执行以下操作
        global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
        try:
            bodyText = browser.find_element(By.CSS_SELECTOR, "body").text
        except TimeoutException:
            Log('time out after 10 seconds when getting body text')
            recordLog('time out after 10 seconds when getting body text')
            browser.execute_script('window.stop()')
            time.sleep(1)
            Log("wait one second after get body text")
            # 再执行一遍
            bodyText = browser.find_element(By.CSS_SELECTOR, "body").text
            # rt.end()
        except Exception as e:
            Log(e)
            recordLog(str(e))
    # rt.end()

def get_content(p, element):
    global saveName
    content = ""
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
            download_image(content, "Data/" +saveName + "/")
    else: # 普通节点
        if p["contentType"] == 0:
            content = element.text
        elif p["contentType"] == 1:  # 只采集当期元素下的文本，不包括子元素
            command = 'var arr = [];\
            var content = arguments[0];\
            for(var i = 0, len = content.childNodes.length; i < len; i++) {\
                if(content.childNodes[i].nodeType === 3){  \
                    arr.push(content.childNodes[i].nodeValue);\
                }\
            }\
            var str = arr.join(" "); \
            return str;'
            content = browser.execute_script(command, element).replace(
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
            content = browser.current_url
        elif p["contentType"] == 6:
            content = browser.title
        elif p["contentType"] == 7:
            # 获取整个网页的高度和宽度
            height = browser.execute_script("return document.body.scrollHeight");
            width = browser.execute_script("return document.body.scrollWidth");
            # 调整浏览器窗口的大小
            browser.set_window_size(width, height)
            element.screenshot("Data/" +saveName + "/"+ str(time.time()) + ".png")
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
                print("To use OCR, You need to install Tesseract-OCR and add it to the environment variable PATH: https://tesseract-ocr.github.io/tessdoc/Installation.html")
                print("要使用OCR识别功能，你需要安装Tesseract-OCR并将其添加到环境变量PATH中：https://blog.csdn.net/u010454030/article/details/80515501")
        elif p["contentType"] == 9:
            content = execute_code(2, p["JS"], p["JSWaitTime"], element)
        elif p["contentType"] == 10: # 下拉框选中的值
            try:
                select_element = Select(element)
                content = select_element.first_selected_option.get_attribute("value")
            except:
                content = ""
        elif p["contentType"] == 11: # 下拉框选中的文本
            try:
                select_element = Select(element)
                content = select_element.first_selected_option.text
            except:
                content = ""
    return content


# 提取数据事件
def getData(para, loopElement, isInLoop=True, parentPath="", index=0):
    if not isInLoop and para["wait"] == 0:
        time.sleep(1)  # 如果提取数据字段不在循环内而且设置的等待时间为0，默认等待1秒
        Log("Wait 1 second before extracting data")
    # rt = Time("Extract Data")
    for p in para["paras"]:
        content = ""
        if not (p["contentType"] == 5 or p["contentType"] == 6):  # 如果不是页面标题或URL，去找元素
            try:
                if p["relative"]:  # 是否相对xpath
                    if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                        element = loopElement
                    else:
                        if p["relativeXPath"].find("//") >= 0:  # 如果字串里有//即子孙查找，则不动语句
                            full_path = "(" + parentPath + \
                                p["relativeXPath"] + ")" + \
                                "[" + str(index + 1) + "]"
                            element = browser.find_element(By.XPATH, full_path)
                        else:
                            element = loopElement.find_element(By.XPATH,
                                                               p["relativeXPath"][1:])
                else:
                    element = browser.find_element(By.XPATH, p["relativeXPath"])
            except (NoSuchElementException, InvalidSelectorException):  # 找不到元素的时候，使用默认值
                # print(p)
                try:
                    content = p["default"]
                except Exception as e:
                    content = ""
                outputParameters[p["name"]] = content
                try:
                    if not dataNotFoundKeys[p["name"]]:
                        print('Element %s not found with parameter name %s when extracting data, use default, this error will only show once' % (p["relativeXPath"], p["name"]))
                        print("提取数据操作时，字段名 %s 对应XPath %s 未找到，使用默认值，本字段将不再重复报错" % (p["name"], p["relativeXPath"]))
                        dataNotFoundKeys[p["name"]] = True
                        recordLog('Element %s not found, use default' % p["relativeXPath"])
                except:
                    pass
                continue
            except TimeoutException:  # 超时的时候设置超时值
                Log('time out after set seconds when getting data')
                recordLog('time out after set seconds when getting data')
                browser.execute_script('window.stop()')
                if p["relative"]:  # 是否相对xpath
                    if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                        element = loopElement
                    else:
                        element = loopElement.find_element(By.XPATH,
                                                           p["relativeXPath"][1:])
                else:
                    element = browser.find_element(By.XPATH, p["relativeXPath"])
                # rt.end()
        else:
            element = browser.find_element(By.XPATH, "//body")
        try:
            execute_code(2, p["beforeJS"], p["beforeJSWaitTime"], element) # 执行前置js
            content = get_content(p, element)
        except StaleElementReferenceException:  # 发生找不到元素的异常后，等待几秒重新查找
            recordLog('StaleElementReferenceException：'+p["relativeXPath"])
            time.sleep(3)
            try:
                if p["relative"]:  # 是否相对xpath
                    if p["relativeXPath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                        element = loopElement
                        recordLog('StaleElementReferenceException：loopElement')
                    else:
                        element = loopElement.find_element(By.XPATH,
                                                           p["relativeXPath"][1:])
                        recordLog(
                            'StaleElementReferenceException：loopElement+relativeXPath')
                else:
                    element = browser.find_element(
                        By.XPATH, p["relativeXPath"])
                    recordLog('StaleElementReferenceException：relativeXPath')
                content = get_content(p, element)
            except StaleElementReferenceException:
                recordLog('StaleElementReferenceException：'+p["relativeXPath"])
                continue  # 再出现类似问题直接跳过
        outputParameters[p["name"]] = content
        execute_code(2, p["afterJS"], p["afterJSWaitTime"], element) # 执行后置JS
    global OUTPUT
    line = []
    for value in outputParameters.values():
        line.append(value)
        print(value[:15], " ", end="")
    print("")
    OUTPUT.append(line)
    # rt.end()


# 判断字段是否为空
def isnull(s):
    return len(s) != 0


def saveData(exit=False):
    global saveName, log, OUTPUT, browser
    if exit == True or len(OUTPUT) >= 100: # 每100条保存一次
        with open("Data/"+saveName + '_log.txt', 'a', encoding='utf-8-sig') as file_obj:
            file_obj.write(log)
            file_obj.close()
        with open("Data/"+saveName + '.csv', 'a', encoding='utf-8-sig', newline="") as f:
            f_csv = csv.writer(f)
            for line in OUTPUT:
                f_csv.writerow(line)
            f.close()
        OUTPUT = []
        log = ""
        

@atexit.register
def clean():
    global saveName, log, OUTPUT, browser, SAVED
    saveData(exit=True)
    browser.quit()
    sys.exit(0)


if __name__ == '__main__':
    config = {
        "id": 0,
        "server_address": "http://localhost:8074",
        "saved_file_name": "",
        "read_type": "remote",
        "user_data": False,
        "config_folder": "",
        "config_file_name": "config.json",
        "headless": False,
        "version": "0.3.1",
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
            driver_path = "EasySpider.app/Contents/Resources/app/chromedriver_mac64"
            # options.binary_location = "chrome_mac64.app/Contents/MacOS/Google Chrome"
            # # MacOS需要用option而不是options！
            # option.binary_location = "chrome_mac64.app/Contents/MacOS/Google Chrome"
            # driver_path = os.getcwd()+ "/chromedriver_mac64"
            print(driver_path)
    elif os.path.exists(os.getcwd()+"/EasySpider/resources"): # 打包后的路径
        print("Finding chromedriver in EasySpider",
              os.getcwd()+"/EasySpider")
        if sys.platform == "win32" and platform.architecture()[0] == "32bit":
            options.binary_location = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win32/chrome.exe")  # 指定chrome位置
            driver_path = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win32/chromedriver_win32.exe")
        elif sys.platform == "win32" and platform.architecture()[0] == "64bit":
            options.binary_location = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win64/chrome.exe")
            driver_path = os.path.join(
                os.getcwd(), "EasySpider/resources/app/chrome_win64/chromedriver_win64.exe")
        elif sys.platform == "linux" and platform.architecture()[0] == "64bit":
            options.binary_location = "EasySpider/resources/app/chrome_linux64/chrome"
            driver_path = "EasySpider/resources/app/chrome_linux64/chromedriver_linux64"
        else:
            print("Unsupported platform")
            sys.exit()
        print("Chrome location:", options.binary_location)
        print("Chromedriver location:", driver_path)
    elif os.path.exists(os.getcwd()+"/../ElectronJS"): 
        if os.getcwd().find("ElectronJS") >= 0:  # 软件dev用
            print("Finding chromedriver in EasySpider",
                os.getcwd())
            option.binary_location = "chrome_win64/chrome.exe"
            driver_path = "chrome_win64/chromedriver_win64.exe"
        else: # 直接在executeStage文件夹内使用python easyspider_executestage.py时的路径
            print("Finding chromedriver in EasySpider",
                os.getcwd()+"/ElectronJS")
            option.binary_location = "../ElectronJS/chrome_win64/chrome.exe"  # 指定chrome位置
            driver_path = "../ElectronJS/chrome_win64/chromedriver_win64.exe"
    elif os.getcwd().find("ExecuteStage") >= 0:  # 如果直接执行
        print("Finding chromedriver in ./Chrome",
              os.getcwd()+"/Chrome")
        options.binary_location = "./Chrome/chrome.exe"  # 指定chrome位置
        # option.binary_location = "C:\\Users\\q9823\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"
        driver_path = "./Chrome/chromedriver.exe"
    else:
        options.binary_location = "./chrome.exe"  # 指定chrome位置
        driver_path = "./chromedriver.exe"

    option.add_experimental_option(
        'excludeSwitches', ['enable-automation'])  # 以开发者模式

    # user_data_dir = r''  # 注意没有Default！

    # options.add_argument('--user-data-dir='+p)

    # 总结：
    # 0. 带Cookie需要用userdatadir
    # 1. chrome_options才是配置用户文件和chrome文件地址的正确选项
    # 2. User Profile文件夹的路径是：C:\Users\用户名\AppData\Local\Google\Chrome\User Data不要加Default
    # 3. 就算User Profile相同，chrome版本不同所存储的cookie信息也不同，也不能爬
    # 4. TMALL如果一直弹出验证码，而且无法通过验证，那么需要在其他浏览器上用
    if c.user_data:
        with open(c.config_folder + c.config_file_name,"r", encoding='utf-8') as f:
            config = json.load(f)
            absolute_user_data_folder = config["absolute_user_data_folder"]
            print("\nAbsolute_user_data_folder:",absolute_user_data_folder,"\n")
        option.add_argument(f'--user-data-dir={absolute_user_data_folder}')  # TMALL 反扒
        option.add_argument("--profile-directory=Default")
    if c.headless:
        print("Headless mode")
        print("无头模式")
        option.add_argument("--headless")
        options.add_argument("--headless")

    # options.add_argument(
    #     '--user-data-dir=C:\\Users\\q9823\\AppData\\Local\\Google\\Chrome\\User Data')  # TMALL 反扒
    option.add_argument(
        "--disable-blink-features=AutomationControlled")  # TMALL 反扒
    options.add_argument("--disable-blink-features=AutomationControlled")  # TMALL 反扒
    print(options)
    browser = webdriver.Chrome(
        options=options, chrome_options=option, executable_path=driver_path)
    stealth_path = driver_path[:driver_path.find("chromedriver")] + "stealth.min.js"
    with open(stealth_path, 'r') as f:
        js = f.read()
        print("Loading stealth.min.js")
    browser.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {'source': js}) # TMALL 反扒

    wait = WebDriverWait(browser, 10)
    browser.get('about:blank')
    id = c.id
    print("id: ", id)
    if c.saved_file_name != "":
        saveName = "task_" + str(id) + "_" + c.saved_file_name  # 保存文件的名字
    else:
        saveName = "task_" + str(id) + "_" + \
            str(random.randint(0, 999999999))  # 保存文件的名字
    print("saveName: ", saveName)
    os.mkdir("Data/" + saveName)  # 创建保存文件夹用来保存截图
    backEndAddress = c.server_address
    if c.read_type == "remote":
        print("remote")
        content = requests.get(backEndAddress + "/queryExecutionInstance?id=" + str(id))
        service = json.loads(content.text)  # 加载服务信息
    else:
        print("local")
        with open("execution_instances/" + str(id) + ".json", 'r', encoding='utf-8') as f:
            content = f.read()
            service = json.loads(content)  # 加载服务信息
    print("name: ", service["name"])
    procedure = service["graph"]  # 程序执行流程
    try:
        if service["version"] != c.version:
            print("版本不一致，请使用" + service["version"] + "版本的EasySpider运行该任务")
            print("Version not match, please use EasySpider " + service["version"] + " to run this task")
            browser.quit()
            sys.exit()
    except:
        print("版本不一致，请使用v0.2.0版本的EasySpider运行该任务")
        print("Version not match, please use EasySpider v0.2.0 to run this task")
        browser.quit()
        sys.exit()
    links = list(filter(isnull, service["links"].split("\n")))  # 要执行的link的列表
    OUTPUT = []  # 采集的数据
    OUTPUT.append([])  # 添加表头
    containJudge = service["containJudge"]  # 是否含有判断语句
    bodyText = ""  # 记录bodyText
    tOut = service["outputParameters"]  # 生成输出参数对象
    outputParameters = {}
    dataNotFoundKeys = {}  # 记录没有找到数据的key
    log = ""  # 记下现在总共开了多少个标签页
    history = {"index": 0, "handle": None}  # 记录页面现在所以在的历史记录的位置
    SAVED = False  # 记录是否已经存储了
    for para in tOut:
        outputParameters[para["name"]] = ""
        dataNotFoundKeys[para["name"]] = False
        OUTPUT[0].append(para["name"])
    # 挨个执行程序
    urlId = 0  # 全局记录变量
    for i in range(len(links)):
        executeNode(0)
        urlId = urlId + 1

    files = os.listdir("Data/" + saveName)

    # 如果目录为空，则删除该目录
    if not files:
        os.rmdir("Data/" + saveName)

    print("Done!")
    print("执行完成！")
    recordLog("Done!")
    # dataPath = os.path.abspath(os.path.join(os.getcwd(), "../Data"))
    # with open("Data/"+saveName + '_log.txt', 'a', encoding='utf-8-sig') as file_obj:
    #     file_obj.write(log)
    #     file_obj.close()
    # with open("Data/"+saveName + '.csv', 'a', encoding='utf-8-sig', newline="") as f:
    #     f_csv = csv.writer(f)
    #     for line in OUTPUT:
    #         f_csv.writerow(line)
    #     f.close()
    saveData()
    browser.quit()
