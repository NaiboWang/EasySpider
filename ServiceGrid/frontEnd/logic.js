exampleMsg = { //示例消息
    "type": 0, //消息类型，1代表增加操作
    "data": {
        "option": 1, //增加选项
        "parameters": { //传入的参数
            "url": "https://www.baidu.com"
        }
    }
}
console.log(JSON.stringify(exampleMsg));
ws = new WebSocket("ws://localhost:8084");
ws.onopen = function() {
    // Web Socket 已连接上，使用 send() 方法发送数据
    console.log("已连接");
    message = {
        type: 0, //消息类型，0代表链接操作
        message: {
            id: 2, //socket id
        }
    };
    this.send(JSON.stringify(message));
};
ws.onclose = function() {
    // 关闭 websocket
    console.log("连接已关闭...");
};
var ttt;
ws.onmessage = function(evt) {
    evt = JSON.parse(evt.data);
    console.log(evt);
    if (evt["type"] == "special") { //如果不是特殊处理的话，默认全部是增加元素操作

    } else {
        handleAddElement(evt); //处理增加元素操作
    }

};

function handleAddElement(msg) {
    if (msg["type"] == "openPage") {
        addElement(1, msg);
    } else if (msg["type"] == "InputText") {
        addElement(4, msg);
    } else if (msg["type"] == "singleClick") {
        addElement(2, msg);
    } else if (msg["type"] == "loopClickSingle") {
        addElement(8, msg);
        addElement(2, msg);
        app._data.nowArrow["position"] = -1; //循环点击单个元素，下一个要插入的位置一般在元素上方
    } else if (msg["type"] == "loopClickEvery") {
        addElement(8, msg);
        addElement(2, msg);
    } else if (msg["type"] == "singleCollect" || msg["type"] == "multiCollectNoPattern") {
        if (app._data.nowNode != null && app._data["nowNode"]["option"] == 3) { //如果当前点击的动作就是提取数据
            for (let i = 0; i < msg["parameters"].length; i++) {
                app._data["nowNode"]["parameters"]["paras"].push(msg["parameters"][i]);
            }
            app._data.paras.parameters = app._data["nowNode"]["parameters"]["paras"];
        } else {
            addElement(3, msg);
        }
        notifyParameterNum(msg["parameters"].length); //通知浏览器端参数的个数变化
    } else if (msg["type"] == "multiCollectWithPattern") {
        addElement(8, msg);
        addElement(3, msg);
        notifyParameterNum(msg["parameters"].length); //通知浏览器端参数的个数变化
    }
}


function notifyParameterNum(num) {
    parameterNum += num;
    let message = {
        type: 3, //消息类型，3代表元素增加事件
        from: 1, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: { "pipe": JSON.stringify({ "type": 0, "value": parameterNum }) } // {}全选{BS}退格
    };
    window.ws.send(JSON.stringify(message));
}
// function isExtract() { //检测当前锚点之前的元素是否为提取数据字段
//     if (app.$data.nowArrow["position"] == -1) {
//         return false;
//     } else if (nodeList[nodeList[app.$data.nowArrow["pId"]].sequence[app.$data.nowArrow["position"]]]["option"] == 3) {
//         return true;
//     } else {
//         return false;
//     }
// }

// 流程图元素点击后的处理逻辑
function handleElement() {
    app._data["nowNode"] = nodeList[vueData.nowNodeIndex];
    app._data["nodeType"] = app._data["nowNode"]["option"];
    app._data.useLoop = app._data["nowNode"]["parameters"]["useLoop"];
    if (app._data["nodeType"] == 8) {
        app._data.loopType = app._data["nowNode"]["parameters"]["loopType"];
    } else if (app._data["nodeType"] == 3) {
        app._data.paraIndex = 0; //参数索引初始化
        app._data.paras.parameters = app._data["nowNode"]["parameters"]["paras"];
    } else if (app._data["nodeType"] == 10) {
        app._data.TClass = app._data["nowNode"]["parameters"]["class"];
    }
}

// 新增元素时的默认参数处理
function addParameters(t) {
    t["parameters"] = {
        history: 1,
        tabIndex: 0,
        useLoop: false, //是否使用循环中的元素
        xpath: "", //xpath
        wait: 0, //执行后等待
    }; //公共参数处理
    if (t.option == 1) {
        t["parameters"]["url"] = "about:blank";
        t["parameters"]["links"] = "about:blank";
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 0; //滚动次数
    } else if (t.option == 2) { //点击元素
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 0; //滚动次数
        t["parameters"]["paras"] = []; //默认参数列表
    } else if (t.option == 3) { //提取数据
        t["parameters"]["paras"] = []; //默认参数列表
    } else if (t.option == 4) { //输入文字
        t["parameters"]["value"] = "";
    } else if (t.option == 8) { //循环
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 0; //滚动次数
        t["parameters"]["loopType"] = 0; //默认循环类型
        t["parameters"]["xpath"] = "";
        t["parameters"]["pathList"] = "";
        t["parameters"]["textList"] = "";
        t["parameters"]["exitCount"] = 0; //执行多少次后退出循环，0代表不设置此条件
        t["parameters"]["historyWait"] = 2; //历史记录回退时间，用于循环点击每个链接的情况下点击链接后不打开新标签页的情况
    } else if (t.option == 9) { //条件

    } else if (t.option == 10) { //条件分支
        t["parameters"]["class"] = 0; //0代表什么条件都没有，1代表当前页面包括文本，2代表当前页面包括元素，3代表当前循环包括文本，4代表当前循环包括元素
        t["parameters"]["value"] = ""; //相关值
    }
}

//修改元素参数
function modifyParameters(t, para) {
    t["parameters"]["history"] = para["history"];
    t["parameters"]["tabIndex"] = para["tabIndex"];
    if (t.option == 1) {
        t["parameters"]["url"] = para["url"];
        t["parameters"]["links"] = para["links"];
        $("#serviceDescription").val(para["url"]);
        $("#url").val(para["url"]);
    } else if (t.option == 4) { //输入文字事件
        t["parameters"]["value"] = para["value"];
        t["parameters"]["xpath"] = para["xpath"];
    } else if (t.option == 2) { //鼠标点击事件
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["useLoop"] = para["useLoop"];
    } else if (t.option == 8) { //循环事件
        t["parameters"]["loopType"] = para["loopType"];
        t["parameters"]["xpath"] = para["xpath"];
        if (para["nextPage"]) { //循环点击下一页的情况下
            t["title"] = "循环点击下一页"
        } else {
            t["title"] = "循环"
        }
        if (para["loopType"] == 2) //如果是固定元素列表
        {
            t["parameters"]["pathList"] = para["pathList"].join("\n");
        }
    } else if (t.option == 3) { //采集数据
        for (let i = 0; i < para["parameters"].length; i++) {
            para["parameters"][i]["default"] = ""; //找不到元素时候的默认值
        }
        t["parameters"]["paras"] = para["parameters"];
    }
}

//点击确定按钮时的处理
$("#confirm").mousedown(function() {
    refresh(false);
    app.$data.nowArrow["num"]++; //改变元素的值,通知画图，重新对锚点画图
    let tnodes = document.getElementsByClassName("clk");
    let position = nodeList[vueData.nowNodeIndex]["position"];
    let pid = nodeList[vueData.nowNodeIndex]["parentId"];
    for (let i = 0; i < tnodes.length; i++) {
        if (position == tnodes[i].getAttribute("position") && pid == tnodes[i].getAttribute("pId")) {
            tnodes[i].style.borderColor = "blue"; // 点击了确定按钮之后需要重新对选中的颜色画框
            nowNode = tnodes[i];
            break;
        }
    }
});

//获取url中的参数
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return "http://183.129.170.180:8041";
}

var sId = getUrlParam('id');
var backEndAddressServiceWrapper = getUrlParam("backEndAddressServiceWrapper");

function saveService(type) {
    var serviceId = $("#serviceId").val();
    var text = "确认要保存服务吗？";
    if (type == 1) { //服务另存为
        serviceId = -1;
        text = "确认要另存为服务吗？";
    }
    if (confirm(text)) {
        let serviceName = $("#serviceName").val();
        let url = $("#url").val();
        let serviceDescription = $("#serviceDescription").val();
        let inputParameters = [];
        let outputParameters = [];
        let outputNames = [];
        let inputIndex = 0;
        let outputIndex = 0;
        let links = ""; //记录所有的link
        let containJudge = false; //是否含有判断语句
        for (let i = 1; i < nodeList.length; i++) {
            if (nodeList[i]["id"] != -1) { //已经被删除的节点不进行统计
                if (nodeList[i]["option"] == 1) //打开网页操作，统计输入框输入操作
                {
                    if (!nodeList[i]["parameters"]["useLoop"]) //如果不是使用循环里的文本
                    {
                        inputParameters.push({
                            id: inputIndex,
                            name: "urlList_" + inputIndex++,
                            nodeId: i, //记录操作位于的节点位置，重要！！！
                            nodeName: nodeList[i]["title"],
                            value: nodeList[i]["parameters"]["links"],
                            desc: "要采集的网址列表,多行以\\n分开",
                            type: "string",
                            exampleValue: "https://www.jd.com"
                        });
                        links = nodeList[i]["parameters"]["links"];
                    }
                } else if (nodeList[i]["option"] == 4) //输入文字操作
                {
                    if (!nodeList[i]["parameters"]["useLoop"]) //如果不是使用循环里的文本
                    {
                        inputParameters.push({
                            id: inputIndex,
                            name: "inputText_" + inputIndex++,
                            nodeName: nodeList[i]["title"],
                            nodeId: i,
                            desc: "要输入的文本，如京东搜索框输入：电脑",
                            type: "string",
                            exampleValue: nodeList[i]["parameters"]["value"],
                            value: nodeList[i]["parameters"]["value"],
                        });
                    }
                } else if (nodeList[i]["option"] == 8) //循环操作
                {
                    if (parseInt(nodeList[i]["parameters"]["loopType"]) > 2) //循环中的循环输入文本或循环输入网址
                        inputParameters.push({
                        id: inputIndex,
                        name: "loopText_" + inputIndex++,
                        nodeId: i,
                        nodeName: nodeList[i]["title"],
                        desc: "要输入的文本/网址,多行以\\n分开",
                        type: "string",
                        exampleValue: nodeList[i]["parameters"]["textList"],
                        value: nodeList[i]["parameters"]["textList"],
                    });
                } else if (nodeList[i]["option"] == 3) //提取数据操作
                {
                    for (let j = 0; j < nodeList[i]["parameters"]["paras"].length; j++) {
                        if (outputNames.indexOf(nodeList[i]["parameters"]["paras"][j]["name"]) < 0) { //参数名称还未被添加
                            outputNames.push(nodeList[i]["parameters"]["paras"][j]["name"]);
                            outputParameters.push({
                                id: outputIndex++,
                                name: nodeList[i]["parameters"]["paras"][j]["name"],
                                desc: nodeList[i]["parameters"]["paras"][j]["desc"],
                                type: "string",
                                exampleValue: nodeList[i]["parameters"]["paras"][j]["exampleValues"][0]["value"],
                            });
                        }
                    }
                } else if (nodeList[i]["option"] == 9) //条件判断
                {
                    containJudge = true;
                }
            }
        }
        let serviceInfo = {
            "id": parseInt(serviceId),
            "name": serviceName,
            "url": url,
            "links": links,
            "containJudge": containJudge,
            "desc": serviceDescription,
            "inputParameters": inputParameters,
            "outputParameters": outputParameters,
            "graph": nodeList, //图结构要存储下来
        };
        $.post(backEndAddressServiceWrapper + "/backEnd/manageService", { paras: JSON.stringify(serviceInfo) }, function(result) { $("#serviceId").val(parseInt(result)) });
        // alert("保存成功!");
        $('#myModal').modal('hide');
        $("#tip").slideDown(); //提示框
        fadeout = setTimeout(function() {
            $("#tip").slideUp();
        }, 2000);

    }
}

//点击保存服务按钮时的处理
$("#saveButton").mousedown(function() {
    saveService(0);
});
//点击另存为服务按钮时的处理
$("#saveAsButton").mousedown(function() {
    saveService(1);
});


if (sId != null && sId != -1) //加载服务
{
    $.get(backEndAddressServiceWrapper + "/backEnd/queryService?id=" + sId, function(result) {
        nodeList = result["graph"];
        app.$data.list.nl = nodeList;
        $("#serviceName").val(result["name"]);
        $("#serviceId").val(result["id"]);
        $("#url").val(result["url"]);
        $("#serviceDescription").val(result["desc"]);
        refresh();
    });
} else {
    refresh(); //新增服务
}