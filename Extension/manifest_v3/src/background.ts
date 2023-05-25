//此变量用于监听是否加载了新的页面（包括新窗口打开），如果是，增加变量值，用于传回后台。

// var tabList = []; //用来记录打开的新的tab的id
// var nowTabId = null;
// var nowTabIndex = 0; //重要变量！！
// var parameterNum = 1; //默认参数索引值
//
// chrome.storage.local.set({ "parameterNum": 1 }); //修改默认的参数索引值
// // chrome.tabs.update(6,{"active":true}) //一行就可以切换标签页
// chrome.tabs.onActivated.addListener(function(activeInfo) {
//     nowTabId = activeInfo.tabId; //记录现在活动的tabid
//     if (tabList.indexOf(nowTabId) != -1) {
//         nowTabIndex = tabList.indexOf(nowTabId);
//     }
// });
// // 监听来自content-script的消息
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.type == 0) {
//         if (tabList.indexOf(sender["tab"]["id"]) < 0) { //元素不存在加入数组
//             tabList.push(sender["tab"]["id"]);
//         }
//         nowTabIndex = tabList.indexOf(nowTabId);
//         sendResponse({ type: 0, "msg": "Get!" }); //回传一个消息
//     } else if (request.type == 1) { //前台询问参数索引值
//         sendResponse({ type: 1, "value": parameterNum }); //回传一个消息
//     } else if (request.type == 2) {
//         let message = {
//             type: 2, //消息类型，2代表键盘输入
//             message: { "keyboardStr": request.value, "xpath": request.xpath, "id": request.id } // {}全选{BS}退格
//         };
//         ws.send(JSON.stringify(message));
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             // 获取当前选项卡的 ID
//             const tabId = tabs[0].id;
//             const url = tabs[0].url;
//
//             // 停止当前页面的加载
//             // chrome.tabs.executeScript(tabId, {code: 'window.stop();'});
//         });
//     } else if (request.type == 3) {
//         let tmsg = request.msg;
//         tmsg.tabIndex = nowTabIndex; //赋值当前tab的id
//         let message = {
//             type: 3, //消息类型，3代表元素增加事件
//             from: 0, //0代表从浏览器到流程图，1代表从流程图到浏览器
//             message: {"pipe": JSON.stringify(request.msg)}
//         };
//         console.log(message);
//         ws.send(JSON.stringify(message));
//     }
// });

// 打开一个 web socket
let ws = new WebSocket("ws://localhost:8084");
ws.onopen = function() {
    // Web Socket 已连接上，使用 send() 方法发送数据
    console.log("已连接");
    let message = {
        type: 0, //消息类型，0代表链接操作
        message: {
            id: 0, //socket id
        }
    };
    this.send(JSON.stringify(message));
};
ws.onmessage = function(evt) {
    evt = JSON.parse(evt.data);
    if (evt["type"] == "0") { //0代表更新参数添加索引值
        chrome.storage.local.set({ "parameterNum": parseInt(evt["value"]) }); //修改值
    }
};
ws.onclose = function() {
    // 关闭 websocket
    console.log("连接已关闭...");
};