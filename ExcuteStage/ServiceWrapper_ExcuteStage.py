# -*- coding: utf-8 -*-
import atexit  # 遇到错误退出时应执行的代码
import json
import re
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
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import random
import numpy
import csv
import os
from selenium.webdriver.common.by import By


saveName, log, OUTPUT, browser, SAVED = None, "", "", None, False

desired_capabilities = DesiredCapabilities.CHROME
desired_capabilities["pageLoadStrategy"] = "none"


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


def scrollDown(para, rt=""):
    try:
        if para["scrollType"] != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
            for i in range(para["scrollCount"]):
                time.sleep(1)  # 下拉完等1秒
                Log("下拉完等待1秒")
                body = browser.find_element_by_css_selector("body")
                if para["scrollType"] == 1:
                    body.send_keys(Keys.PGDN)
                else:
                    body.send_keys(Keys.END)
    except TimeoutException:
        Log('time out after 10 seconds when scrolling. ')
        recordLog('time out after 10 seconds when scrolling')
        browser.execute_script('window.stop()')
        if para["scrollType"] != 0 and para["scrollCount"] > 0:  # 控制屏幕向下滚动
            for i in range(para["scrollCount"]):
                time.sleep(1)  # 下拉完等1秒
                Log("下拉完等待1秒")
                body = browser.find_element_by_css_selector("body")
                if para["scrollType"] == 1:
                    body.send_keys(Keys.PGDN)
                else:
                    body.send_keys(Keys.END)
        if rt != "":
            rt.end()


# 执行节点关键函数部分
def excuteNode(nodeId, loopValue="", clickPath="", index=0):
    node = procedure[nodeId]
    WebDriverWait(browser, 10).until
    # 等待元素出现才进行操作，10秒内未出现则报错
    (EC.visibility_of_element_located((By.XPATH, node["parameters"]["xpath"])))

    # 根据不同选项执行不同操作
    if node["option"] == 0 or node["option"] == 10:  # root操作,条件分支操作
        for i in node["sequence"]:  # 从根节点开始向下读取
            excuteNode(i, loopValue, clickPath, index)
    elif node["option"] == 1:  # 打开网页操作
        recordLog("openPage")
        openPage(node["parameters"], loopValue)
    elif node["option"] == 2:  # 点击元素
        recordLog("Click")
        clickElement(node["parameters"], loopValue, clickPath, index)
    elif node["option"] == 3:  # 提取数据
        recordLog("getData")
        getData(node["parameters"], loopValue, node["isInLoop"])
    elif node["option"] == 4:  # 输入文字
        inputInfo(node["parameters"], loopValue)
    elif node["option"] == 8:  # 循环
        recordLog("loop")
        loopExcute(node, loopValue, clickPath, index)  # 执行循环
    elif node["option"] == 9:  # 条件分支
        recordLog("judge")
        judgeExcute(node, loopValue, clickPath, index)

    # 执行完之后进行等待
    if node["option"] != 0:
        waitTime = 0.01  # 默认等待0.01秒
        if node["parameters"]["wait"] > 1:
            waitTime = node["parameters"]["wait"]
        time.sleep(waitTime)
        Log("Node执行完后等待：", waitTime)


# 对判断条件的处理
def judgeExcute(node, loopElement, clickPath="", index=0):
    rt = Time("条件判断")
    global bodyText  # 引入bodyText
    excuteBranchId = 0  # 要执行的BranchId
    for i in node["sequence"]:
        cnode = procedure[i]  # 获得条件分支
        tType = int(cnode["parameters"]["class"])  # 获得判断条件类型
        if tType == 0:  # 什么条件都没有
            excuteBranchId = i
            break
        elif tType == 1:  # 当前页面包含文本
            try:
                if bodyText.find(cnode["parameters"]["value"]) >= 0:
                    excuteBranchId = i
                    break
            except:  # 找不到元素下一个条件
                continue
        elif tType == 2:  # 当前页面包含元素
            try:
                if browser.find_element(By.XPATH, cnode["parameters"]["value"]):
                    excuteBranchId = i
                    break
            except:  # 找不到元素或者xpath写错了，下一个条件
                continue
        elif tType == 3:  # 当前循环元素包括文本
            try:
                if loopElement.text.find(cnode["parameters"]["value"]) >= 0:
                    excuteBranchId = i
                    break
            except:  # 找不到元素或者xpath写错了，下一个条件
                continue
        elif tType == 4:  # 当前循环元素包括元素
            try:
                if loopElement.find_element(By.XPATH, cnode["parameters"]["value"][1:]):
                    excuteBranchId = i
                    break
            except:  # 找不到元素或者xpath写错了，下一个条件
                continue
    rt.end()
    excuteNode(excuteBranchId, loopElement, clickPath, index)


# 对循环的处理
def loopExcute(node, loopValue, clickPath="", index=0):
    time.sleep(0.1)  # 第一次执行循环的时候强制等待1秒
    Log("循环执行前等待0.1秒")
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
                element = browser.find_element(By.XPATH,
                                               node["parameters"]["xpath"])
                for i in node["sequence"]:  # 挨个执行操作
                    excuteNode(i, element, node["parameters"]["xpath"], 0)
                Log("click: ", node["parameters"]["xpath"])
                recordLog("click:" + node["parameters"]["xpath"])
            except NoSuchElementException:
                Log("clickNotFound: ", node["parameters"]["xpath"])
                recordLog("clickNotFound:" + node["parameters"]["xpath"])
                break  # 如果找不到元素，退出循环
            except Exception as e:
                raise
            count = count + 1
            Log("页数：", count)
            recordLog("页数：" + str(count))
            # print(node["parameters"]["exitCount"], "-------")
            if node["parameters"]["exitCount"] == count:  # 如果达到设置的退出循环条件的话
                break
    elif int(node["parameters"]["loopType"]) == 1:  # 不固定元素列表
        try:
            elements = browser.find_elements(By.XPATH,
                                             node["parameters"]["xpath"])
            for index in range(len(elements)):
                for i in node["sequence"]:  # 挨个执行操作
                    excuteNode(i, elements[index],
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
                    Log("切换历史记录等待2秒或者：", node["parameters"]["historyWait"])
                    browser.execute_script('window.stop()')
        except NoSuchElementException:
            Log("pathNotFound: ", node["parameters"]["xpath"])
            recordLog("pathNotFound: " + node["parameters"]["xpath"])
            pass  # 循环中找不到元素就略过操作
        except Exception as e:
            raise
    elif int(node["parameters"]["loopType"]) == 2:  # 固定元素列表
        for path in node["parameters"]["pathList"].split("\n"):  # 千万不要忘了分割！！
            try:
                element = browser.find_element(By.XPATH, path)
                for i in node["sequence"]:  # 挨个执行操作
                    excuteNode(i, element, path, 0)
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
                    Log("切换历史记录等待2秒或者：", node["parameters"]["historyWait"])
                    browser.execute_script('window.stop()')
            except NoSuchElementException:
                Log("pathNotFound: ", path)
                recordLog("pathNotFound: " + path)
                continue  # 循环中找不到元素就略过操作
            except Exception as e:
                raise
    elif int(node["parameters"]["loopType"]) == 3:  # 固定文本列表
        textList = node["parameters"]["textList"].split("\n")
        for text in textList:
            recordLog("input: " + text)
            for i in node["sequence"]:  # 挨个执行操作
                excuteNode(i, text, "", 0)
    elif int(node["parameters"]["loopType"]) == 4:  # 固定网址列表
        pass  # 以后再做
    history["index"] = thisHistoryLength
    history["handle"] = browser.current_window_handle
    scrollDown(node["parameters"])


# 打开网页事件
def openPage(para, loopValue):
    rt = Time("打开网页")
    time.sleep(2)  # 打开网页后强行等待至少2秒
    global links
    global urlId
    global history
    browser.switch_to.window(browser.window_handles[0])  # 打开网页操作从第1个页面开始
    history["handle"] = browser.current_window_handle
    if para["useLoop"]:
        url = loopValue
    else:
        url = links[urlId]
    try:
        browser.get(url)
    except TimeoutException:
        Log('time out after 10 seconds when loading page: ' + url)
        recordLog('time out after 10 seconds when loading page: ' + url)
        browser.execute_script('window.stop()')
        rt.end()
    try:
        history["index"] = browser.execute_script("return history.length")
    except TimeoutException:
        browser.execute_script('window.stop()')
        history["index"] = browser.execute_script("return history.length")
        rt.end()
    scrollDown(para, rt)  # 控制屏幕向下滚动
    if containJudge:
        global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
        try:
            bodyText = browser.find_element_by_css_selector("body").text
        except TimeoutException:
            Log('time out after 10 seconds when getting body text: ' + url)
            recordLog('time out after 10 seconds when getting body text:: ' + url)
            browser.execute_script('window.stop()')
            time.sleep(1)
            Log("获得bodytext等待1秒")
            # 再执行一遍
            bodyText = browser.find_element_by_css_selector("body").text
            rt.end()
        except Exception as e:
            Log(e)
            recordLog(str(e))
    rt.end()


# 键盘输入事件
def inputInfo(para, loopValue):
    time.sleep(1)  # 输入之前等待1秒
    Log("输入前等待1秒")
    rt = Time("输入文字")
    try:
        textbox = browser.find_element(By.XPATH, para["xpath"])
    except:
        Log("找不到输入框元素：" + para["xpath"] + "请尝试执行前等待")
        recordLog("找不到输入框元素：" + para["xpath"] + "请尝试执行前等待")
        exit()
    textbox.send_keys(Keys.CONTROL, 'a')
    textbox.send_keys(Keys.BACKSPACE)
    if para["useLoop"]:
        textbox.send_keys(loopValue)
    else:
        textbox.send_keys(para["value"])
    global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
    bodyText = browser.find_element_by_css_selector("body").text
    rt.end()


# 点击元素事件
def clickElement(para, loopElement=None, clickPath="", index=0):
    global history
    time.sleep(0.1)  # 点击之前等待1秒
    rt = Time("点击元素")
    Log("点击之前等待1秒")
    if para["useLoop"]:  # 使用循环的情况下，传入的clickPath就是实际的xpath
        path = clickPath
    else:
        path = para["xpath"]  # 不然使用元素定义的xpath
    tempHandleNum = len(browser.window_handles)  # 记录之前的窗口位置
    try:
        script = 'var result = document.evaluate(`' + path + \
            '`, document, null, XPathResult.ANY_TYPE, null);for(let i=0;i<arguments[0];i++){result.iterateNext();} result.iterateNext().click();'
        browser.execute_script(script, str(index))  # 用js的点击方法

    except TimeoutException:
        Log('time out after 10 seconds when loading clicked page')
        recordLog('time out after 10 seconds when loading clicked page')
        browser.execute_script('window.stop()')
        rt.end()
    except Exception as e:
        Log(e)
        recordLog(str(e))
    time.sleep(0.5)  # 点击之后等半秒
    Log("点击之后等待0.5秒")
    if tempHandleNum != len(browser.window_handles):  # 如果有新标签页的行为发生
        browser.switch_to.window(browser.window_handles[-1])  # 跳转到新的标签页
        history["handle"] = browser.current_window_handle
        try:
            history["index"] = browser.execute_script("return history.length")
        except TimeoutException:
            browser.execute_script('window.stop()')
            history["index"] = browser.execute_script("return history.length")
            rt.end()
    else:
        try:
            history["index"] = browser.execute_script("return history.length")
        except TimeoutException:
            browser.execute_script('window.stop()')
            history["index"] = browser.execute_script("return history.length")
            rt.end()
        # 如果打开了新窗口，切换到新窗口
    scrollDown(para, rt)  # 根据参数配置向下滚动
    if containJudge:  # 有判断语句才执行以下操作
        global bodyText  # 每次执行点击，输入元素和打开网页操作后，需要更新bodyText
        try:
            bodyText = browser.find_element_by_css_selector("body").text
        except TimeoutException:
            Log('time out after 10 seconds when getting body text')
            recordLog('time out after 10 seconds when getting body text')
            browser.execute_script('window.stop()')
            time.sleep(1)
            Log("bodytext等待1秒")
            # 再执行一遍
            bodyText = browser.find_element_by_css_selector("body").text
            rt.end()
        except Exception as e:
            Log(e)
            recordLog(str(e))
    rt.end()


# 提取数据事件
def getData(para, loopElement, isInLoop=True):
    if not isInLoop and para["wait"] == 0:
        time.sleep(1)  # 如果提取数据字段不在循环内而且设置的等待时间为0，默认等待1秒
        Log("提取数据等待1秒")
    rt = Time("提取数据")
    for p in para["paras"]:
        content = ""
        try:
            if p["relative"]:  # 是否相对xpath
                if p["relativeXpath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                    element = loopElement
                else:
                    element = loopElement.find_element(By.XPATH,
                                                       p["relativeXpath"][1:])
            else:
                element = browser.find_element(By.XPATH, p["relativeXpath"])
        except NoSuchElementException:  # 找不到元素的时候，使用默认值
            # print(p)
            try:
                content = p["default"]
            except Exception as e:
                content = ""
            outputParameters[p["name"]] = content
            Log('Element %s not found,use default' % p["relativeXpath"])
            recordLog('Element %s not found, use default' % p["relativeXpath"])
            continue
        except TimeoutException:  # 超时的时候设置超时值
            Log('time out after 10 seconds when getting data')
            recordLog('time out after 10 seconds when getting data')
            browser.execute_script('window.stop()')
            if p["relative"]:  # 是否相对xpath
                if p["relativeXpath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                    element = loopElement
                else:
                    element = loopElement.find_element(By.XPATH,
                                                       p["relativeXpath"][1:])
            else:
                element = browser.find_element(By.XPATH, p["relativeXpath"])
            rt.end()
        try:
            if p["contentType"] == 2:
                content = element.get_attribute('innerHTML')
            elif p["contentType"] == 3:
                content = element.get_attribute('outerHTML')
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
            elif p["contentType"] == 0:
                content = element.text
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
        except StaleElementReferenceException:  # 发生找不到元素的异常后，等待几秒重新查找
            recordLog('StaleElementReferenceException：'+p["relativeXpath"])
            time.sleep(3)
            try:
                if p["relative"]:  # 是否相对xpath
                    if p["relativeXpath"] == "":  # 相对xpath有时候就是元素本身，不需要二次查找
                        element = loopElement
                        recordLog('StaleElementReferenceException：loopElement')
                    else:
                        element = loopElement.find_element(By.XPATH,
                                                           p["relativeXpath"][1:])
                        recordLog(
                            'StaleElementReferenceException：loopElement+relativeXPath')
                else:
                    element = browser.find_element(
                        By.XPATH, p["relativeXpath"])
                    recordLog('StaleElementReferenceException：relativeXpath')
                if p["contentType"] == 2:
                    content = element.get_attribute('innerHTML')
                elif p["contentType"] == 3:
                    content = element.get_attribute('outerHTML')
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
                elif p["contentType"] == 0:
                    content = element.text
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
            except StaleElementReferenceException:
                recordLog('StaleElementReferenceException：'+p["relativeXpath"])
                continue  # 再出现类似问题直接跳过
        outputParameters[p["name"]] = content
    global OUTPUT
    line = []
    for value in outputParameters.values():
        line.append(value)
        print(value[:15], " ", end="")
    print("")
    OUTPUT.append(line)
    rt.end()


# 判断字段是否为空
def isnull(s):
    return len(s) != 0


@atexit.register
def clean():
    global saveName, log, OUTPUT, browser, SAVED
    if not SAVED:
        print('清理环境保存数据')
        with open("Data/"+saveName + '_log.txt', 'w', encoding='utf-8-sig') as file_obj:
            file_obj.write(log)
            file_obj.close()
        with open("Data/"+saveName + '.csv', 'w', encoding='utf-8-sig', newline="") as f:
            f_csv = csv.writer(f)
            for line in OUTPUT:
                f_csv.writerow(line)
            f.close()
        browser.quit()


if __name__ == '__main__':
    options = Options()
    exe_path = "chromedriver.exe"
    if os.path.exists(os.getcwd()+"/ServiceWrapper"):
        options.binary_location = "ServiceWrapper/Chrome/chrome.exe"  # 指定chrome位置
        exe_path = "ServiceWrapper/Chrome/chromedriver.exe"
    elif os.path.exists(os.getcwd()+"/Debug"):
        options.binary_location = "Debug/Chrome/chrome.exe"  # 指定chrome位置
        exe_path = "Debug/Chrome/chromedriver.exe"
    elif os.getcwd().find("ExcuteStage") >= 0:  # 如果直接执行
        options.binary_location = "./Chrome/chrome.exe"  # 指定chrome位置
        exe_path = "./Chrome/chromedriver.exe"
    else:
        options.binary_location = "chrome.exe"  # 指定chrome位置
    browser = webdriver.Chrome(options=options, executable_path=exe_path)
    browser.get('about:blank')
    browser.set_page_load_timeout(10)  # 加载页面最大超时时间
    browser.set_script_timeout(10)
    if len(sys.argv) > 1:
        id = int(sys.argv[1])  # taskId这里修改
    else:
        id = 7  # 设置默认值
    print("id：", id)
    if len(sys.argv) > 2:
        backEndAddress = sys.argv[2]
    else:
        backEndAddress = "http://servicewrapper.naibo.wang"
    if len(sys.argv) > 3:
        saveName = "task_" + str(id) + "_" + sys.argv[3]  # 保存文件的名字
    else:
        saveName = "task_" + str(id) + "_" + \
            str(random.randint(0, 999999999))  # 保存文件的名字
    content = requests.get(backEndAddress + "/backEnd/queryTask?id=" + str(id))
    service = json.loads(content.text)  # 加载服务信息
    print("name：", service["name"])
    procedure = service["graph"]  # 程序执行流程
    links = list(filter(isnull, service["links"].split("\n")))  # 要执行的link的列表
    OUTPUT = []  # 采集的数据
    OUTPUT.append([])  # 添加表头
    containJudge = service["containJudge"]  # 是否含有判断语句
    bodyText = ""  # 记录bodyText
    tOut = service["outputParameters"]  # 生成输出参数对象
    outputParameters = {}
    log = ""  # 记下现在总共开了多少个标签页
    history = {"index": 0, "handle": None}  # 记录页面现在所以在的历史记录的位置
    SAVED = False  # 记录是否已经存储了
    for para in tOut:
        outputParameters[para["name"]] = ""
        OUTPUT[0].append(para["name"])
    # 挨个执行程序
    urlId = 0  # 全局记录变量
    for i in range(len(links)):
        excuteNode(0)
        urlId = urlId + 1
    print("执行完成！")
    recordLog("Done!")
    # dataPath = os.path.abspath(os.path.join(os.getcwd(), "../Data"))
    with open("Data/"+saveName + '_log.txt', 'w', encoding='utf-8-sig') as file_obj:
        file_obj.write(log)
        file_obj.close()
    with open("Data/"+saveName + '.csv', 'w', encoding='utf-8-sig', newline="") as f:
        f_csv = csv.writer(f)
        for line in OUTPUT:
            f_csv.writerow(line)
        f.close()
    SAVED = True
    browser.quit()
    sys.exit(0)
