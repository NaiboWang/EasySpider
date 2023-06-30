import glob
import json
import os
import re
import subprocess
import sys
import requests
import platform
import shutil
import zipfile
import urllib.request
import py7zr

def compress_folder_to_7z(folder_path, output_file):
    if os.path.exists(output_file):
        os.remove(output_file)
    with py7zr.SevenZipFile(output_file, 'w') as archive:
        archive.writeall(folder_path, output_file)

def compress_folder_to_7z_split(folder_path, output_file):
    if os.path.exists(output_file):
        os.remove(output_file)
    file_name = os.path.basename(output_file)
    file_dir = os.path.dirname(output_file)

    # 获取文件名的前缀
    file_prefix = os.path.splitext(file_name)[0]

    # 构建分卷文件的路径模式
    split_file_pattern = os.path.join(file_dir, file_prefix + ".7z.*")

    # 获取匹配的分卷文件列表
    split_files = glob.glob(split_file_pattern)

    # 删除分卷文件
    for split_file in split_files:
        os.remove(split_file)

    # 压缩文件夹
    subprocess.call(["7z", "a", "-v95m", output_file, folder_path])

easyspider_version = "0.3.3"

if __name__ == "__main__":

    if sys.platform == "win32" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_windows_x64.7z"
        if os.path.exists("./EasySpider_windows_x64/user_data"):
            shutil.rmtree("./EasySpider_windows_x64/user_data")
        shutil.rmtree("./EasySpider_windows_x64/Data")
        shutil.rmtree("./EasySpider_windows_x64/execution_instances")
        os.mkdir("./EasySpider_windows_x64/Data")
        os.mkdir("./EasySpider_windows_x64/execution_instances")
        compress_folder_to_7z_split("./EasySpider_windows_x64", file_name)
        print(f"Compress {file_name} Split successfully!")
        compress_folder_to_7z("./EasySpider_windows_x64", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "win32" and platform.architecture()[0] == "32bit":
        file_name = f"EasySpider_{easyspider_version}_windows_x86.7z"
        if os.path.exists("./EasySpider_windows_x86/user_data"):
            shutil.rmtree("./EasySpider_windows_x86/user_data")
        shutil.rmtree("./EasySpider_windows_x86/Data")
        shutil.rmtree("./EasySpider_windows_x86/execution_instances")
        os.mkdir("./EasySpider_windows_x86/Data")
        os.mkdir("./EasySpider_windows_x86/execution_instances")
        compress_folder_to_7z("./EasySpider_windows_x64", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "linux" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_Linux_x64.7z"
        if os.path.exists("./EasySpider_Linux_x64/user_data"):
            shutil.rmtree("./EasySpider_Linux_x64/user_data")
        shutil.rmtree("./EasySpider_Linux_x64/Data")
        shutil.rmtree("./EasySpider_Linux_x64/execution_instances")
        os.mkdir("./EasySpider_Linux_x64/Data")
        os.mkdir("./EasySpider_Linux_x64/execution_instances")
        # compress_folder_to_7z("./EasySpider_Linux_x64", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "darwin" and platform.architecture()[0] == "64bit":
        pass

