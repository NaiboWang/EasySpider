import json
import os
import re
import sys

# 读取JSON文件


def read_json_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data

# 保存为JSON文件


def save_json_file(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def update_file_version(file_path, new_version, key="当前版本/Current Version: v"):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    with open(file_path, 'w', encoding='utf-8') as file:
        for line in lines:
            if key in line:
                pattern = r'('+key+')\d+\.\d+\.\d+'
                line = re.sub(pattern, r'\g<1>'+new_version, line)
            file.write(line)


version = "0.6.3"

# py html js

if __name__ == "__main__":

    file_path = "../.temp_to_pub/compress.py"
    update_file_version(file_path, version, key='easyspider_version = "')

    file_path = "./src/taskGrid/logic.js"
    update_file_version(file_path, version, key='"version": "')

    file_path = "../ExecuteStage/easyspider_executestage.py"
    update_file_version(file_path, version, key='"version": "')

    # index.html
    file_path = "./src/index.html"
    update_file_version(file_path, version, key="软件当前版本：<b>v")
    update_file_version(file_path, version, key="Current Version: <b>v")

    # package.json
    file_path = "./package.json"

    # 读取JSON文件
    electron_config = read_json_file(file_path)
    print(electron_config["version"])

    # 修改数据
    electron_config["version"] = version
    electron_config["config"]["forge"]["packagerConfig"]["appVersion"] = version

    # 保存为JSON文件
    save_json_file(electron_config, file_path)

    # 插件的package.json
    file_path = "../Extension/manifest_v3/package.json"

    # 读取JSON文件
    electron_config = read_json_file(file_path)
    print(electron_config["version"])

    # 修改数据
    electron_config["version"] = version

    # 保存为JSON文件
    save_json_file(electron_config, file_path)

    file_path = "../Extension/manifest_v3/src/manifest.json"

    # 读取JSON文件
    electron_config = read_json_file(file_path)
    print(electron_config["version"])

    # 修改数据
    electron_config["version"] = version

    # 保存为JSON文件
    save_json_file(electron_config, file_path)
