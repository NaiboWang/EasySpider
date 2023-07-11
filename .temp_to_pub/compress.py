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
    # with py7zr.SevenZipFile(output_file, 'w') as archive:
    #     archive.writeall(folder_path, output_file)
    # 压缩文件夹
    try:
        subprocess.call(["7z", "a", output_file, folder_path])
    except:
        subprocess.call(["7za", "a", output_file, folder_path])

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
    try:
        subprocess.call(["7z", "a", "-v95m", output_file, folder_path])
    except:
        try:
            subprocess.call(["7za", "a", "-v95m", output_file, folder_path])
        except:
            subprocess.call(["7zz", "a", "-v95m", output_file, folder_path])

easyspider_version = "0.3.5"

if __name__ == "__main__":

    if sys.platform == "win32" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_windows_x64.7z"
        if os.path.exists("./EasySpider_windows_x64/user_data"):
            shutil.rmtree("./EasySpider_windows_x64/user_data")
        if os.path.exists("./EasySpider_windows_x64/Data"):
            shutil.rmtree("./EasySpider_windows_x64/Data")
        if os.path.exists("./EasySpider_windows_x64/execution_instances"):
            shutil.rmtree("./EasySpider_windows_x64/execution_instances")
        if os.path.exists("./EasySpider_windows_x64/config.json"):
            os.remove("./EasySpider_windows_x64/config.json")
        if os.path.exists("./EasySpider_windows_x64/mysql_config.json"):
            os.remove("./EasySpider_windows_x64/mysql_config.json")
        os.mkdir("./EasySpider_windows_x64/Data")
        os.mkdir("./EasySpider_windows_x64/execution_instances")
        compress_folder_to_7z_split("./EasySpider_windows_x64", file_name)
        print(f"Compress {file_name} Split successfully!")
        compress_folder_to_7z("./EasySpider_windows_x64", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "win32" and platform.architecture()[0] == "32bit":
        file_name = f"EasySpider_{easyspider_version}_windows_x32.7z"
        if os.path.exists("./EasySpider_windows_x32/user_data"):
            shutil.rmtree("./EasySpider_windows_x32/user_data")
        if os.path.exists("./EasySpider_windows_x32/Data"):
            shutil.rmtree("./EasySpider_windows_x32/Data")
        if os.path.exists("./EasySpider_windows_x32/execution_instances"):
            shutil.rmtree("./EasySpider_windows_x32/execution_instances")
        if os.path.exists("./EasySpider_windows_x32/config.json"):
            os.remove("./EasySpider_windows_x32/config.json")
        if os.path.exists("./EasySpider_windows_x32/mysql_config.json"):
            os.remove("./EasySpider_windows_x32/mysql_config.json")
        os.mkdir("./EasySpider_windows_x32/Data")
        os.mkdir("./EasySpider_windows_x32/execution_instances")
        compress_folder_to_7z_split("./EasySpider_windows_x32", file_name)
        print(f"Compress {file_name} Split successfully!")
        compress_folder_to_7z("./EasySpider_windows_x32", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "linux" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_Linux_x64.tar.xz"
        if os.path.exists("./EasySpider_Linux_x64/user_data"):
            shutil.rmtree("./EasySpider_Linux_x64/user_data")
        if os.path.exists("./EasySpider_Linux_x64/Data"):
            shutil.rmtree("./EasySpider_Linux_x64/Data")
        if os.path.exists("./EasySpider_Linux_x64/execution_instances"):
            shutil.rmtree("./EasySpider_Linux_x64/execution_instances")
        if os.path.exists("./EasySpider_Linux_x64/config.json"):
            os.remove("./EasySpider_Linux_x64/config.json")
        if os.path.exists("./EasySpider_Linux_x64/mysql_config.json"):
            os.remove("./EasySpider_Linux_x64/mysql_config.json")
        os.mkdir("./EasySpider_Linux_x64/Data")
        os.mkdir("./EasySpider_Linux_x64/execution_instances")
        subprocess.call(["tar", "-Jcvf", file_name, "./EasySpider_Linux_x64"])
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "darwin" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_MacOS_all_arch.tar.gz"
        if os.path.exists("./EasySpider_MacOS_all_arch/Data"):
            shutil.rmtree("./EasySpider_MacOS_all_arch/Data")
        os.mkdir("./EasySpider_MacOS_all_arch/Data")
        subprocess.call(["tar", "-zcvf", file_name, "./EasySpider_MacOS_all_arch"])
        subprocess.call(["7zz", "a", "-v95m", file_name.replace(".tar.gz", ".7z"), file_name, "请继续解压EasySpider_MacOS_all_arch.tar.gz使用.txt"])
        print(f"Compress {file_name} successfully!")

