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
# import py7zr

def get_processor_info():
    if os.uname().sysname == 'Darwin':
        processor_info = subprocess.check_output(['sysctl', '-n', 'machdep.cpu.brand_string']).strip()
        processor_info = str(processor_info)
        if 'Intel' in processor_info:
            return 'Intel'
        elif 'Apple' in processor_info:
            return 'Apple'
        else:
            return 'Unknown'
    else:
        return 'This method is only implemented for macOS.'

def compress_folder_to_7z(folder_path, output_file):
    if os.path.exists(output_file):
        os.remove(output_file)
    # with py7zr.SevenZipFile(output_file, 'w') as archive:
    #     archive.writeall(folder_path, output_file)
    # 压缩文件夹
    try:
        # "-mmt4"表示使用4个线程压缩
        subprocess.call(["7z", "a", "-mx=9", output_file, folder_path])
    except:
        subprocess.call(["7za", "a", "-mx=9", output_file, folder_path])

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

easyspider_version = "0.6.3"

if __name__ == "__main__":

    if sys.platform == "win32" and platform.architecture()[0] == "64bit":
        file_name = f"EasySpider_{easyspider_version}_Windows_x64.7z"
        if os.path.exists("./EasySpider_Windows_x64/user_data"):
            shutil.rmtree("./EasySpider_Windows_x64/user_data")
        if os.path.exists("./EasySpider_Windows_x64/Data"):
            shutil.rmtree("./EasySpider_Windows_x64/Data")
        if os.path.exists("./EasySpider_Windows_x64/execution_instances"):
            shutil.rmtree("./EasySpider_Windows_x64/execution_instances")
        if os.path.exists("./EasySpider_Windows_x64/config.json"):
            os.remove("./EasySpider_Windows_x64/config.json")
        if os.path.exists("./EasySpider_Windows_x64/mysql_config.json"):
            os.remove("./EasySpider_Windows_x64/mysql_config.json")
        if os.path.exists("./EasySpider_Windows_x64/TempUserDataFolder"):
            shutil.rmtree("./EasySpider_Windows_x64/TempUserDataFolder")
        os.mkdir("./EasySpider_Windows_x64/Data")
        os.mkdir("./EasySpider_Windows_x64/execution_instances")
        # compress_folder_to_7z_split("./EasySpider_Windows_x64", file_name)
        # print(f"Compress {file_name} Split successfully!")
        compress_folder_to_7z("./EasySpider_Windows_x64", file_name)
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "win32" and platform.architecture()[0] == "32bit":
        file_name = f"EasySpider_{easyspider_version}_Windows_x32.7z"
        if os.path.exists("./EasySpider_Windows_x32/user_data"):
            shutil.rmtree("./EasySpider_Windows_x32/user_data")
        if os.path.exists("./EasySpider_Windows_x32/Data"):
            shutil.rmtree("./EasySpider_Windows_x32/Data")
        if os.path.exists("./EasySpider_Windows_x32/execution_instances"):
            shutil.rmtree("./EasySpider_Windows_x32/execution_instances")
        if os.path.exists("./EasySpider_Windows_x32/config.json"):
            os.remove("./EasySpider_Windows_x32/config.json")
        if os.path.exists("./EasySpider_Windows_x32/mysql_config.json"):
            os.remove("./EasySpider_Windows_x32/mysql_config.json")
        if os.path.exists("./EasySpider_Windows_x32/TempUserDataFolder"):
            shutil.rmtree("./EasySpider_Windows_x32/TempUserDataFolder")
        os.mkdir("./EasySpider_Windows_x32/Data")
        os.mkdir("./EasySpider_Windows_x32/execution_instances")
        # compress_folder_to_7z_split("./EasySpider_Windows_x32", file_name)
        # print(f"Compress {file_name} Split successfully!")
        compress_folder_to_7z("./EasySpider_Windows_x32", file_name)
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
        if os.path.exists("./EasySpider_Linux_x64/TempUserDataFolder"):
            shutil.rmtree("./EasySpider_Linux_x64/TempUserDataFolder")
        os.mkdir("./EasySpider_Linux_x64/Data")
        os.mkdir("./EasySpider_Linux_x64/execution_instances")
        subprocess.call(["tar", "-Jcvf", file_name, "./EasySpider_Linux_x64"])
        print(f"Compress {file_name} successfully!")
    elif sys.platform == "darwin" and platform.architecture()[0] == "64bit":
        arch = get_processor_info()
        if arch == "Intel":
            file_name = f"EasySpider_{easyspider_version}_MacOS_Intel_Chip.7z"
        else:
            file_name = f"EasySpider_{easyspider_version}_MacOS_Apple_Arm_Chip.7z"
            if os.path.exists("./EasySpider_MacOS/Data"):
                shutil.rmtree("./EasySpider_MacOS/Data")
            os.mkdir("./EasySpider_MacOS/Data")
        if os.path.exists("./EasySpider_MacOS/TempUserDataFolder"):
            shutil.rmtree("./EasySpider_MacOS/TempUserDataFolder")
        # if os.path.exists(file_name):
        #     os.remove(file_name)
        #     print(f"Remove {file_name} successfully!")
        # subprocess.call(["tar", "-zcvf", file_name, "./EasySpider_MacOS"])
        # brew install p7zip
        # subprocess.call(["7z", "a", "-mx=9", file_name, "./EasySpider_MacOS"])
        compress_folder_to_7z("./EasySpider_MacOS", file_name)
        print(f"Compress {file_name} successfully!")

