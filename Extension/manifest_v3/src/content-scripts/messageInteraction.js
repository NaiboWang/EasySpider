//实现与后台和流程图部分的交互

import {getElementXPaths, global, readXPath, isInIframe, clearEl, LANG} from "./global.js";
import {trial, createNotification} from "./trail.js";

global.ws = new WebSocket("ws://localhost:8084");
global.ws.onopen = function () {
    // Web Socket 已连接上，使用 send() 方法发送数据
    console.log("已连接");
    let message = {
        type: 0, //消息类型，0代表连接操作
        message: {
            id: global.id, //socket id
            title: document.title, //网页标题
        }
    };
    this.send(JSON.stringify(message));
};
global.ws.onmessage = function (evt) {
    evt = JSON.parse(evt.data);
    if (evt["type"] == "update_parameter_num") { //0代表更新参数添加索引值
        chrome.storage.local.set({"parameterNum": parseInt(evt["value"])}); //修改值
        console.log("更新参数添加索引值为：" + evt["value"]);
    } else if (evt["type"] == "notify") { //1代表更新参数
        createNotification(LANG(evt["msg_zh"], evt["msg_en"]), evt["level"]);
    } else if (evt["type"] == "cancelSelection") { //试运行点击元素后取消选中元素
        clearEl();
    } else if (evt["type"] == "trial") {
        trial(evt);
    } else if (evt["type"] == "showAllToolboxes") {
        document.getElementById("wrapperToolkit").style.display = "block";
    } else if (evt["type"] == "hideAllToolboxes") {
        document.getElementById("wrapperToolkit").style.display = "none";
    }
};

function clearAfterSend() {
    global.justSend = true;
    // setTimeout(function () {
    //     if (global.justSend) {
    //         clearEl();
    //         global.justSend = false;
    //     }
    // }, 1000);
}

export function input(value, batch = false) {
    let type = "inputText";
    let useLoop = false;
    if (batch) {
        type = "batchInputText";
        useLoop = true;
    }
    let message = {
        "type": type,
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "allXPaths": getElementXPaths(global.nodeList[0]["node"]),
        "iframe": global.iframe,
        "value": value,
        "useLoop": useLoop, //是否使用循环内元素
        "loopType": 3, //循环类型，3为文本列表
    };
    window.stop();
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    // msg = { type: 2, value: value, xpath: message.xpath, id: global.id};
    let message_keyboard = {
        type: 2, //消息类型，2代表键盘输入
        message: {"keyboardStr": value, "xpath": message.xpath, "iframe": global.iframe, "id": global.id} // {}全选{BS}退格
    };
    global.ws.send(JSON.stringify(message_keyboard));
    clearAfterSend();
}

//点击元素操作
export function sendSingleClick() {
    let message = {
        "type": "singleClick",
        "id": global.id,
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": false, //是否使用循环内元素
        "iframe": global.iframe,
        "content": global.nodeList[0]["node"].innerText,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "allXPaths": getElementXPaths(global.nodeList[0]["node"]),
    };
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

export function sendChangeOption(optionMode, optionValue) {
    let message = {
        "type": "changeOption",
        "optionMode": optionMode,
        "optionValue": optionValue,
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": false, //是否使用循环内元素
        "iframe": global.iframe,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "allXPaths": getElementXPaths(global.nodeList[0]["node"]),
    };
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

export function sendMouseMove() {
    let message = {
        "type": "mouseMove",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": false, //是否使用循环内元素
        "iframe": global.iframe,
        "content": global.nodeList[0]["node"].innerText,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "allXPaths": getElementXPaths(global.nodeList[0]["node"]),
    };
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

export function sendLoopMouseMove() {
    let message = {
        "type": "loopMouseMove",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "xpath": "", //默认值设置为空
        "allXPaths": "",
        "content": "",
        "useLoop": true, //是否使用循环内元素
        "iframe": global.iframe,
        "loopType": 1, //循环类型，1为不固定元素列表
    };
    if (!detectAllSelected()) //如果不是全部选中的话
    {
        message.loopType = 2; //固定元素列表
    }
    if (message.loopType == 1) {
        message["xpath"] = global.app._data.nowPath;
    } else { //固定元素列表
        //有的网站像淘宝，每个元素都有一个独一无二的ID号，这时候就不适用用id进行xpath定位了，这个问题暂时搁置
        message["pathList"] = [];
        for (let i = 0; i < global.nodeList.length; i++) {
            message["pathList"].push(readXPath(global.nodeList[i]["node"], 0));
        }
    }
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

//采集单个元素
export function collectSingle() {
    let message = {
        "type": "singleCollect",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "iframe": global.iframe,
        "parameters": global.outputParameters,
    };
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

setInterval(function () {
    let notifications = document.getElementsByClassName("notification_of_easyspider");
    for (let i = 0; i < notifications.length; i++) {
        if (new Date().getTime() - parseInt(notifications[i].dataset.timestamp) > 10000) {
            if (notifications[i].parentNode === document.body) {
                document.body.removeChild(notifications[i]); // 避免移除已经不存在的元素
            }
        }
    }
}, 3000);

//采集无规律多元素
export function collectMultiNoPattern() {
    let message = {
        "type": "multiCollectNoPattern",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "iframe": global.iframe,
        "parameters": global.outputParameters,
    };
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

//采集有规律多元素
export function collectMultiWithPattern() {
    //先点击选择全部然后再
    let message = {
        "type": "multiCollectWithPattern",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "loopType": 1,
        "iframe": global.iframe,
        "xpath": "", //默认值设置为空
        "allXPaths": "",
        "isDescendents": global.app._data.selectedDescendents, //标记是否采集的是子元素
        "parameters": global.outputParameters,
    };
    for (let i = 0; i < global.outputParameters.length; i++) {
        global.outputParameters[i]["exampleValues"] = [global.outputParameters[i]["exampleValues"][0]];
    }
    if (!detectAllSelected()) //如果不是全部选中的话
    {
        message.loopType = 2; //固定元素列表
    }
    if (message.loopType == 1) {
        message["xpath"] = global.app._data.nowPath;
        message["allXPaths"] = global.app._data.nowAllPaths;
    } else { //固定元素列表
        message["pathList"] = [];
        for (let i = 0; i < global.nodeList.length; i++) {
            message["pathList"].push(readXPath(global.nodeList[i]["node"], 0));
        }
    }
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

//循环点击单个元素
export function sendLoopClickSingle(name = "") {
    let message = {
        "type": "loopClickSingle",
        "id": global.id,
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": true, //是否使用循环内元素
        "iframe": global.iframe,
        "content": global.nodeList[0]["node"].innerText,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "allXPaths": getElementXPaths(global.nodeList[0]["node"]),
        "loopType": 0, //循环类型，0为单个元素
        "nextPage": false, //是否循环点击下一页
        "lastAction": global.app._data.lastAction,
    };
    if (name == "下一页元素") {
        message.nextPage = true;
    } else if (name == "nextPageFromIndexPage") {
        message.nextPage = true;
        message.type = "loopClickNextPage";
    }
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

//循环点击每个元素
export function sendLoopClickEvery() {
    let message = {
        "type": "loopClickEvery",
        "id": global.id,
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "xpath": "", //默认值设置为空
        "allXPaths": "",
        "content": "",
        "useLoop": true, //是否使用循环内元素
        "iframe": global.iframe,
        "loopType": 1, //循环类型，1为不固定元素列表
    };
    if (!detectAllSelected()) //如果不是全部选中的话
    {
        message.loopType = 2; //固定元素列表
    }
    if (message.loopType == 1) {
        message["xpath"] = global.app._data.nowPath;
    } else { //固定元素列表
        //有的网站像淘宝，每个元素都有一个独一无二的ID号，这时候就不适用用id进行xpath定位了，这个问题暂时搁置
        message["pathList"] = [];
        for (let i = 0; i < global.nodeList.length; i++) {
            message["pathList"].push(readXPath(global.nodeList[i]["node"], 0));
        }
    }
    let message_action = {
        type: 3, //消息类型，3代表元素增加事件
        from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
        message: {"pipe": JSON.stringify(message)}
    };
    global.ws.send(JSON.stringify(message_action));
    clearAfterSend();
}

//检测是否xpath对应的元素被全选了，个数判断即可
export function detectAllSelected() {
    if (global.app._data.nowPath == "") {
        return false;
    } else {
        let num = 0;
        let result = document.evaluate(global.app._data.nowPath, document, null, XPathResult.ANY_TYPE, null);
        var node = result.iterateNext(); //枚举第一个元素
        while (node) {
            // console.log(node.innerHTML);
            num++;
            node = result.iterateNext();
        }
        if (num == global.nodeList.length) {
            return true;
        } else {
            return false;
        }
    }
}
