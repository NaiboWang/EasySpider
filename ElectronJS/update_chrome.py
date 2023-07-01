import json
import os
import re
import sys
import requests
import platform
import shutil
import zipfile
import urllib.request

def download_and_extract_zip(url, destination_folder):
    # 下载ZIP文件
    urllib.request.urlretrieve(url, "temp.zip")

    # 解压ZIP文件
    with zipfile.ZipFile("temp.zip", "r") as zip_ref:
        zip_ref.extractall(destination_folder)

    # 删除临时ZIP文件
    os.remove("temp.zip")

def copy_file(source_file, destination_file):
    # 使用copy2()函数复制文件
    shutil.copy2(source_file, destination_file)

def copy_folder(source_folder, destination_folder):
    # 使用copytree()函数复制文件夹及其内容
    shutil.copytree(source_folder, destination_folder)

update_version = "115" # 要更新的chromedriver版本

chrome_driver_url = "https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json"
win64_chrome_path = "C:\\Program Files\\Google\\Chrome\\Application"
win32_chrome_path = "C:\\Program Files\\Google\\Chrome\\Application"
mac_chrome_path = "/Applications/Google Chrome.app/Contents/MacOS"
linux_chrome_path = "/opt/google/chrome"

if __name__ == "__main__":
    driver_downloads = []
    response = requests.get(chrome_driver_url)
    if response.status_code == 200:
        versions = json.loads(response.content)["versions"]
        versions = versions[::-1] # 倒序排列数组
        for info in versions:
            version = info["version"]
            if version.find(update_version) >= 0:
                downloads = info["downloads"]
                if "chromedriver" in downloads:
                    print(info["version"])
                    driver_downloads = downloads["chromedriver"]
                    break
    else:
        print("Error: " + response.status_code)
        exit(1)
    if os.path.exists("./chromedrivers"):
        shutil.rmtree("./chromedrivers")
    os.mkdir("./chromedrivers")
    if sys.platform == "win32" and platform.architecture()[0] == "64bit":
        for download in driver_downloads:
            if download["platform"] == "win64":
                url = download["url"]
                print(url)
                break
        download_and_extract_zip(url, "./chromedrivers")
        if os.path.exists("./chrome_win64"):
            shutil.rmtree("./chrome_win64")
        copy_folder(win64_chrome_path, "./chrome_win64")
        for folder in os.listdir("./chrome_win64"):
            if folder[0].isdigit() and os.path.isdir("./chrome_win64/"+folder):
                shutil.rmtree("./chrome_win64/"+folder+"/Installer") # 删除Installer文件夹
        copy_file("./execute.bat", "./chrome_win64/execute.bat")
        copy_file("./stealth.min.js", "./chrome_win64/stealth.min.js")
        copy_file("./chromedrivers/chromedriver-win64/chromedriver.exe", "./chrome_win64/chromedriver_win64.exe")
    elif sys.platform == "win32" and platform.architecture()[0] == "32bit":
        for download in driver_downloads:
            if download["platform"] == "win32":
                url = download["url"]
                print(url)
                break
        download_and_extract_zip(url, "./chromedrivers")
        if os.path.exists("./chrome_win32"):
            shutil.rmtree("./chrome_win32")
        copy_folder(win64_chrome_path, "./chrome_win32")
        for folder in os.listdir("./chrome_win32"):
            if folder[0].isdigit() and os.path.isdir("./chrome_win32/"+folder):
                shutil.rmtree("./chrome_win32/"+folder+"/Installer") # 删除Installer文件夹
        copy_file("./execute.bat", "./chrome_win32/execute.bat")
        copy_file("./stealth.min.js", "./chrome_win32/stealth.min.js")
        copy_file("./chromedrivers/chromedriver-win32/chromedriver.exe", "./chrome_win32/chromedriver_win32.exe")
    elif sys.platform == "linux" and platform.architecture()[0] == "64bit":
        pass
    elif sys.platform == "darwin" and platform.architecture()[0] == "64bit":
        pass

    print("Done and don't forget to generate executestage EXEcutable program!")