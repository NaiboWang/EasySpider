# -*- coding: utf-8 -*-
from base64 import encode
import json
import os


def queryService(id):
    with open("tasks/%d.json" % id, "r", encoding='utf-8') as f:
        service = json.loads(f.read())
    return service


def invokeService(id, data):
    service = queryService(id)
    try:
        service["links"] = data["urlList_0"]
    except:
        pass
    for key, value in data.items():
        for i in range(len(service["inputParameters"])):
            if key == service["inputParameters"][i]["name"]:  # 能调用
                nodeId = int(service["inputParameters"][i]["nodeId"])
                node = service["graph"][nodeId]
                if node["option"] == 1:
                    node["parameters"]["links"] = value
                elif node["option"] == 4:
                    node["parameters"]["value"] = value
                elif node["option"] == 8 and node["parameters"]["loopType"] == 0:
                    # print("loopType 0", value)
                    node["parameters"]["exitCount"] = int(value)
                    # print(node)
                elif node["option"] == 8:
                    node["parameters"]["textList"] = value
                break

    count = len(os.listdir("tasks")) + 1
    service["id"] = count  # 修改id
    print(count)
    with open("execution_instances/%d.json" % count, "w", encoding='utf-8') as f:
        s = json.dumps(service, ensure_ascii=False)
        f.write(s)
    return count
