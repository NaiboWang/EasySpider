# 控制流程的暂停和继续

import csv
import os
import time
import uuid
import keyboard
from openpyxl import Workbook, load_workbook
import requests
from urllib.parse import urlparse


def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False


def check_pause(key, event):
    while True:
        if keyboard.is_pressed(key):  # 按下p键，暂停程序
            if event._flag == False:
                print("任务执行中，长按p键暂停执行。")
                print("Task is running, long press 'p' to pause.")
                # 设置Event的值为True，使得线程b可以继续执行
                event.set()
            else:
                # 设置Event的值为False，使得线程b暂停执行
                print("任务已暂停，长按p键继续执行...")
                print("Task paused, press 'p' to continue...")
                event.clear()
        time.sleep(1)  # 每秒检查一次


def download_image(url, save_directory):
    # 定义浏览器头信息
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    if is_valid_url(url):
        # 发送 GET 请求获取图片数据
        response = requests.get(url, headers=headers)

        # 检查响应状态码是否为成功状态
        if response.status_code == requests.codes.ok:
            # 提取文件名
            file_name = url.split('/')[-1].split("?")[0]

            # 生成唯一的新文件名
            new_file_name = file_name + '_' + \
                str(uuid.uuid4()) + '_' + file_name

            # 构建保存路径
            save_path = os.path.join(save_directory, new_file_name)

            # 保存图片到本地
            with open(save_path, 'wb') as file:
                file.write(response.content)

            print("图片已成功下载到:", save_path)
            print("The image has been successfully downloaded to:", save_path)
        else:
            print("下载图片失败，请检查此图片链接是否有效:", url)
            print(
                "Failed to download image, please check if this image link is valid:", url)
    else:
        print("下载图片失败，请检查此图片链接是否有效:", url)
        print("Failed to download image, please check if this image link is valid:", url)


def get_output_code(output):
    try:
        if output.find("rue") != -1:  # 如果返回值中包含true
            code = 1
        else:
            code = int(output)
    except:
        code = 0
    return code

# 判断字段是否为空


def isnull(s):
    return len(s) != 0


def write_to_csv(file_name, data):
    with open(file_name, 'a', encoding='utf-8-sig', newline="") as f:
        f_csv = csv.writer(f)
        for line in data:
            f_csv.writerow(line)
        f.close()


def write_to_excel(file_name, data):
    if os.path.exists(file_name):
        # 加载现有的工作簿
        wb = load_workbook(file_name)
        ws = wb.active
    else:
        # 创建新的工作簿和工作表
        wb = Workbook()
        ws = wb.active
    # 追加数据到工作表
    for line in data:
        ws.append(line)
    # 保存工作簿
    wb.save(file_name)


class Time:
    def __init__(self, type1=""):
        self.t = int(round(time.time() * 1000))
        self.type = type1

    def end(self):
        at = int(round(time.time() * 1000))
        print("Time used for", self.type, ":", at - self.t, "ms")
