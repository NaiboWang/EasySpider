
from django.http import HttpResponse
import pymongo
import json
from bson import json_util

"""
高分服务器地址：192.168.14.113
用户名：root
密码：zju.edu.cn
ftp用户：naibowang
密码：qq
程序位置：/root/servicewrapper
"""

def hello(request):
    return HttpResponse("Hello world ! ")


myclient = pymongo.MongoClient('mongodb://localhost:27017/')
mydb = myclient['service']
mycol = mydb["services"]
taskcol = mydb["tasks"] #生成新任务并返回ID

def queryServices(request):
    result = mycol.find({"id" : { "$ne" : -2 }},{ "name": 1, "id": 1, "url": 1, "_id": 0 }) #查询id不为-2的元素
    return HttpResponse(json.dumps(list(result)), content_type="application/json")

def queryTasks(request):
    result = taskcol.find({"id" : { "$ne" : -2 }},{ "name": 1, "id": 1, "url": 1, "_id": 0 }) #查询id不为-2的元素
    return HttpResponse(json.dumps(list(result)), content_type="application/json")

def queryService(request):
    if 'id' in request.GET:
        tid = request.GET['id']
    else:
        tid = "0"
    result = mycol.find({"id":int(tid)},{"_id":0})
    r = list(result)[0]
    return HttpResponse(json.dumps(r), content_type="application/json")

def queryTask(request):
    if 'id' in request.GET:
        tid = request.GET['id']
    else:
        tid = "0"
    
    result = taskcol.find({"id":int(tid)},{"_id":0})
    r = list(result)[0]
    return HttpResponse(json.dumps(r), content_type="application/json")


def manageService(request):
    data = request.POST['paras']
    data = json.loads(data)
    if int(data["id"]) == -1:
        count = mycol.find({}).count()
        data["id"] = count #修改id
        mycol.insert_one(data) 
    else:
        mycol.delete_one({"id":int(data["id"])})
        mycol.insert_one(data)
    return HttpResponse(data["id"])

def deleteService(request):
    if 'id' in request.GET:
        tid = request.GET['id']
        myquery = { "id": int(tid) }
        newvalues = { "$set": { "id": -2 } } #删除就是将服务id变成-2，并没有真正删除
        mycol.update_one(myquery, newvalues)
    return HttpResponse("Done!")

# 调用服务
def invokeService(request):
    tid = request.POST['id']
    data = json.loads(request.POST['paras'])
    result = mycol.find({"id":int(tid)},{"_id":0})
    service = list(result)[0]
    try:
        service["links"] = data["urlList_0"]
    except:
        pass
    for key,value in data.items():
        for i in range(len(service["inputParameters"])):
            if key == service["inputParameters"][i]["name"]: #能调用
                nodeId = int(service["inputParameters"][i]["nodeId"])
                node = service["graph"][nodeId]
                if node["option"] == 1:
                    node["parameters"]["links"] = value
                elif node["option"] == 4:
                    node["parameters"]["value"] = value
                elif node["option"] == 8:
                    node["parameters"]["textList"] = value
                break
    count = taskcol.find({}).count()
    service["id"] = count #修改id
    taskcol.insert_one(service) 
    return HttpResponse(count)

def insertInfo(request):
    request.GET = request.GET.copy()
    data = request.GET
    dbd = myclient['dongcang']
    cold = dbd["redirect"]
    cold.insert_one(data) 
    return HttpResponse("200")

def queryInfos(request):
    dbd = myclient['dongcang']
    cold = dbd["redirect"]
    result = cold.find()
    return HttpResponse(json_util.dumps(result).encode('utf-8').decode('unicode_escape'), content_type="application/json")