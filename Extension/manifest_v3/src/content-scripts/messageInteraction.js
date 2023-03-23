//实现与后台和流程图部分的交互

import {global, readXPath} from "./global.js";

var startMsg = { "type": 0, msg: ""};

chrome.runtime.sendMessage(startMsg, function(response) {
    console.log(response.msg);
}); //每次打开新页面的时候需要告诉后台
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request["type"] == 1){
            sendResponse("回答处理结果");
        }
    }
);

export function input(value) {
    let message = {
        "type": "InputText",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "value": value,
    };
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
    msg = { "type": 2, value: value, xpath: message.xpath };
    chrome.runtime.sendMessage(msg);
}

//点击元素操作
export function sendSingleClick() {
    let message = {
        "type": "singleClick",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": false, //是否使用循环内元素
        "xpath": readXPath(global.nodeList[0]["node"], 0),
    };
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
}

//采集单个元素
export function collectSingle() {
    let message = {
        "type": "singleCollect",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "parameters": global.outputParameters,
    };
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
}

//采集无规律多元素
export function collectMultiNoPattern() {
    let message = {
        "type": "multiCollectNoPattern",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "parameters": global.outputParameters,
    };
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
}

//采集有规律多元素
export function collectMultiWithPattern() {
    //先点击选择全部然后再
    let message = {
        "type": "multiCollectWithPattern",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "loopType": 1,
        "xpath": "", //默认值设置为空
        "isDescendents": global.app._data.selectedDescendents, //标记是否采集的是子元素
        "parameters": global.outputParameters,
    };
    if (!detectAllSelected()) //如果不是全部选中的话
    {
        message.loopType = 2; //固定元素列表
    }
    if (message.loopType == 1) {
        message["xpath"] = global.app._data.nowPath;
    } else { //固定元素列表
        message["pathList"] = [];
        for (let i = 0; i < global.nodeList.length; i++) {
            message["pathList"].push(readXPath(global.nodeList[i]["node"], 0));
        }
    }
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
}

//循环点击单个元素
export function sendLoopClickSingle(name) {
    let message = {
        "type": "loopClickSingle",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "useLoop": true, //是否使用循环内元素
        "xpath": readXPath(global.nodeList[0]["node"], 0),
        "loopType": 0, //循环类型，0为单个元素
        "nextPage": false, //是否循环点击下一页
    };
    if (name == "下一页元素") {
        message.nextPage = true;
    }
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
}

//循环点击每个元素
export function sendLoopClickEvery() {
    let message = {
        "type": "loopClickEvery",
        "history": history.length, //记录history的长度
        "tabIndex": -1,
        "xpath": "", //默认值设置为空
        "useLoop": true, //是否使用循环内元素
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
    let msg = { "type": 3, msg: message };
    chrome.runtime.sendMessage(msg);
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