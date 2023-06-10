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
ws = new WebSocket("ws://localhost:"+getUrlParam("wsport"));
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
let old_title = "";
ws.onmessage = function(evt) {
    evt = JSON.parse(evt.data);
    console.log(evt);
    if (evt["type"] == "title") { //如果不是特殊处理的话，默认全部是增加元素操作
        if (old_title == "New Task") { //只记录第一次的title
            $("#serviceName").val(evt.data.title);
        }
        old_title = evt.data.title;
    } else {
        handleAddElement(evt); //处理增加元素操作
    }

};

function changeGetDataParameters(msg, i) {
    msg["parameters"][i]["default"] = ""; //找不到元素时候的默认值
    msg["parameters"][i]["beforeJS"] = ""; //执行前执行的js
    msg["parameters"][i]["beforeJSWaitTime"] = 0; //执行前js等待时间
    msg["parameters"][i]["JS"] = ""; //如果是JS，需要执行的js
    msg["parameters"][i]["JSWaitTime"] = 0; //JS等待时间
    msg["parameters"][i]["afterJS"] = ""; //执行后执行的js
    msg["parameters"][i]["afterJSWaitTime"] = 0; //执行后js等待时间
    msg["parameters"][i]["downloadPic"] = 0; //是否下载图片
}


function extractTitle(html) {
    var match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1]) {
        return "Collect" + match[1];
    } else {
        return "New Web Collection Task";
    }
}

function handleAddElement(msg) {
    if (msg["type"] == "openPage") {
        addElement(1, msg);
    } else if (msg["type"] == "singleClick") {
        addElement(2, msg);
    } else if (msg["type"] == "InputText") {
        addElement(4, msg);
    } else if (msg["type"] == "changeOption"){
        addElement(6, msg);
    } else if (msg["type"] == "mouseMove") {
        addElement(7, msg);
    } else if (msg["type"] == "loopMouseMove") {
        addElement(8, msg);
        addElement(7, msg);
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
                changeGetDataParameters(msg, i);
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
        beforeJS: "", //执行前执行的js
        beforeJSWaitTime: 0, //执行前js等待时间
        afterJS: "", //执行后执行的js
        afterJSWaitTime: 0, //执行后js等待时间
    }; //公共参数处理
    if (t.option == 1) {
        t["parameters"]["url"] = "about:blank";
        t["parameters"]["links"] = "about:blank";
        t["parameters"]["maxWaitTime"] = 10; //最长等待时间
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 1; //滚动次数
        t["parameters"]["scrollWaitTime"] = 1; //滚动后等待时间
    } else if (t.option == 2) { //点击元素
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 1; //滚动次数
        t["parameters"]["scrollWaitTime"] = 1; //滚动后等待时间
        t["parameters"]["maxWaitTime"] = 10; //最长等待时间
        t["parameters"]["paras"] = []; //默认参数列表
        t["parameters"]["wait"] = 2; //点击后等待时间默认2s
        t["parameters"]["beforeJS"] = ""; //执行前执行的js
        t["parameters"]["beforeJSWaitTime"] = 0; //执行前js等待时间
        t["parameters"]["afterJS"] = ""; //执行后执行的js
        t["parameters"]["afterJSWaitTime"] = 0; //执行后js等待时间
    } else if (t.option == 3) { //提取数据
        t["parameters"]["paras"] = []; //默认参数列表
    } else if (t.option == 4) { //输入文字
        t["parameters"]["value"] = "";
        t["parameters"]["beforeJS"] = ""; //执行前执行的js
        t["parameters"]["beforeJSWaitTime"] = 0; //执行前js等待时间
        t["parameters"]["afterJS"] = ""; //执行后执行的js
        t["parameters"]["afterJSWaitTime"] = 0; //执行后js等待时间
    } else if(t.option == 5) { //自定义操作
        t["parameters"]["codeMode"] = 0; //代码模式，0代表JS, 2代表系统级别
        t["parameters"]["code"] = "";
        t["parameters"]["waitTime"] = 0; //最长等待时间
        t["parameters"]["recordASField"] = 0; //是否记录脚本输出
    } else if (t.option == 8) { //循环
        t["parameters"]["scrollType"] = 0; //滚动类型，0不滚动，1向下滚动1屏，2滚动到底部
        t["parameters"]["scrollCount"] = 1; //滚动次数
        t["parameters"]["scrollWaitTime"] = 1; //滚动后等待时间
        t["parameters"]["loopType"] = 0; //默认循环类型
        t["parameters"]["xpath"] = "";
        t["parameters"]["pathList"] = "";
        t["parameters"]["textList"] = "";
        t["parameters"]["code"] = ""; //执行的代码
        t["parameters"]["waitTime"] = 0; //最长等待时间
        t["parameters"]["exitCount"] = 0; //执行多少次后退出循环，0代表不设置此条件
        t["parameters"]["historyWait"] = 2; //历史记录回退时间，用于循环点击每个链接的情况下点击链接后不打开新标签页的情况
        t["parameters"]["breakMode"] = 0; //break类型，0代表JS，2代表系统命令
        t["parameters"]["breakCode"] = ""; //break条件
        t["parameters"]["breakCodeWaitTime"] = 0; //break条件等待时间
    } else if (t.option == 9) { //条件

    } else if (t.option == 10) { //条件分支
        t["parameters"]["class"] = 0; //0代表什么条件都没有，1代表当前页面包括文本，2代表当前页面包括元素，3代表当前循环包括文本，4代表当前循环包括元素
        t["parameters"]["value"] = ""; //相关值
        t["parameters"]["code"] = ""; //code
        t["parameters"]["waitTime"] = 0; //最长等待时间
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
    } else if (t.option == 2) { //鼠标点击事件
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["useLoop"] = para["useLoop"];
        t["parameters"]["allXPaths"] = para["allXPaths"];
    } else if (t.option == 4) { //输入文字事件
        t["parameters"]["value"] = para["value"];
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["allXPaths"] = para["allXPaths"];
    } else if(t.option == 6){
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["allXPaths"] = para["allXPaths"];
        t["parameters"]["optionMode"] = para["optionMode"];
        t["parameters"]["optionValue"] = para["optionValue"];
    } else if(t.option == 7){
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["useLoop"] = para["useLoop"];
        t["parameters"]["allXPaths"] = para["allXPaths"];
    } else if (t.option == 8) { //循环事件
        t["parameters"]["loopType"] = para["loopType"];
        t["parameters"]["xpath"] = para["xpath"];
        t["parameters"]["allXPaths"] = para["allXPaths"];
        if (para["nextPage"]) { //循环点击下一页的情况下
            t["title"] = "Loop click next page"
        } else {
            t["title"] = "Loop"
        }
        if (para["loopType"] == 2) //如果是固定元素列表
        {
            t["parameters"]["pathList"] = para["pathList"].join("\n");
        }
    } else if (t.option == 3) { //采集数据
        for (let i = 0; i < para["parameters"].length; i++) {
            changeGetDataParameters(para, i);
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
    return "";
}

var sId = getUrlParam('id');
var backEndAddressServiceWrapper = getUrlParam("backEndAddressServiceWrapper");

function saveService(type) {
    let serviceId = $("#serviceId").val();
    let text = "Confirm to save this task (If cannot click, can press Enter)? ";
    if (type == 1) { //任务另存为
        serviceId = -1;
        text = "Confirm to save as another task in the system (If cannot click, can press Enter)?";
    }
    // if (confirm(text)) {
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
                            desc: "List of URLs to be collected, separated by \\n for multiple lines",
                            type: "string",
                            exampleValue: nodeList[i]["parameters"]["links"]
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
                            desc: "The text to be entered, such as 'computer' at eBay search box",
                            type: "string",
                            exampleValue: nodeList[i]["parameters"]["value"],
                            value: nodeList[i]["parameters"]["value"],
                        });
                    }
                } else if (nodeList[i]["option"] == 8) //循环操作
                {
                    if (parseInt(nodeList[i]["parameters"]["loopType"]) > 2 && parseInt(nodeList[i]["parameters"]["loopType"]) < 5) { //循环中的循环输入文本或循环输入网址
                        inputParameters.push({
                            id: inputIndex,
                            name: "loopText_" + inputIndex++,
                            nodeId: i,
                            nodeName: nodeList[i]["title"],
                            desc:"Text/URL to be entered, multiple lines should be separated by \\n",
                            type: "string",
                            exampleValue: nodeList[i]["parameters"]["textList"],
                            value: nodeList[i]["parameters"]["textList"],
                        });
                    } else if (parseInt(nodeList[i]["parameters"]["loopType"]) == 0) {
                        inputParameters.push({
                            id: inputIndex,
                            name: "loopTimes_" + nodeList[i]["title"] + "_" + inputIndex++,
                            nodeId: i,
                            nodeName: nodeList[i]["title"],
                            desc: "Number of loop executions, 0 means unlimited loops (until element not found)",
                            type: "int",
                            exampleValue: nodeList[i]["parameters"]["exitCount"],
                            value: nodeList[i]["parameters"]["exitCount"],
                        });
                    }
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
                } else if (nodeList[i]["option"] == 5) //自定义操作
                {
                    if (nodeList[i]["parameters"]["recordASField"] == 1) {
                        let id = outputIndex++;
                        let title = nodeList[i]["title"];
                        if (outputNames.indexOf(title) >= 0) { //参数名称已经被添加
                            $('#myModal').modal('hide');
                            $("#tip2").slideDown(); //提示框
                            fadeout = setTimeout(function() {
                                $("#tip2").slideUp();
                            }, 5000);
                            return;
                        }
                        outputNames.push(title);
                        outputParameters.push({
                            id: id,
                            name: title,
                            desc: "Output of custom action",
                            type: "string",
                            exampleValue: "",
                        });
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
            "create_time": new Date().toLocaleString(),
            "version": "0.3.3",
            "containJudge": containJudge,
            "desc": serviceDescription,
            "inputParameters": inputParameters,
            "outputParameters": outputParameters,
            "graph": nodeList, //图结构要存储下来
        };
        $.post(backEndAddressServiceWrapper + "/manageTask", { paras: JSON.stringify(serviceInfo) },
            function(result) { $("#serviceId").val(parseInt(result)) });
        // alert("保存成功!");
        $('#myModal').modal('hide');
        $("#tip").slideDown(); //提示框
        let fadeout = setTimeout(function() {
            $("#tip").slideUp();
        }, 2000);

    // }
}

//点击保存任务按钮时的处理
$("#saveButton").mousedown(function() {
    saveService(0);
});
//点击另存为任务按钮时的处理
$("#saveAsButton").mousedown(function() {
    saveService(1);
});


if (sId != null && sId != -1) //加载任务
{
    $.get(backEndAddressServiceWrapper + "/queryTask?id=" + sId, function(result) {
        nodeList = result["graph"];
        app.$data.list.nl = nodeList;
        $("#serviceName").val(result["name"]);
        $("#serviceId").val(result["id"]);
        $("#url").val(result["url"]);
        $("#serviceDescription").val(result["desc"]);
        refresh();
    });
} else {
    refresh(); //新增任务
}