import {
    LANG,
    clearEl,
    addEl,
    global,
    readyToList,
    handleElement,
    handleDescendents,
    selectAllElements
} from "./global.js";

//试运行操作标记
export function trial(evt) {
    // if(global.justSend){ //如果是刚刚发送的消息到流程图，不处理
    //     global.justSend = false;
    //     return;
    // }
    let node = JSON.parse(evt["message"]["message"]["node"]);
    let parentNode = JSON.parse(evt["message"]["message"]["parentNode"]);
    let parameters = node.parameters;
    let type = evt["message"]["message"]["type"];
    // console.log("parameters", parameters);
    for (let node of global.markElements) {
        let element = node.element;
        element.style.boxShadow = "none";
    }
    // 删除所有class为highlight_of_easyspider的元素
    let elements = document.getElementsByClassName('highlight_of_easyspider');
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    global.markElements = [];
    if (type == 0) {
        let option = node.option;
        console.log("option", option);
        if (option == 2 || option == 4 || option == 6 || option == 7) {
            let xpath = parameters.xpath;
            if (parameters.useLoop && option != 4 && option != 6) {
                let parentXPath = parentNode.parameters.xpath;
                if (parentNode.parameters.loopType == 2) { //循环项列表
                    parentXPath = parentNode.parameters.pathList.split("\n")[0].trim();
                }
                xpath = parentXPath + xpath;
            }
            let point = parameters.xpath;
            if (xpath.includes("point(")) {
                xpath = "//body"
            }
            let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (parameters.xpath.includes("point(")) {
                point = point.substring(6, point.length - 1).split(",");
                let x = parseInt(point[0]);
                let y = parseInt(point[1]);
                highlightAt(x, y);
            } else if (element != null) {
                clearEl(true);
                addEl(null, element);
            }
            // if (element != null) {
            //     //移动到元素位置
            //     element.scrollIntoView({block: "center", inline: "center"});
            // }
        } else if (option == 3) {
            let params = parameters.params; //所有的提取数据参数
            clearEl(true);
            for (let i = 0; i < params.length; i++) {
                let param = params[i];
                let xpath = param.relativeXPath;
                let parentXPaths = "";
                let xpaths = [];
                if (param.relative) {
                    if (parentNode.parameters.loopType <= 1) {
                        parentXPaths = [parentNode.parameters.xpath];
                    } else if (parentNode.parameters.loopType == 2) { //循环项列表
                        parentXPaths = parentNode.parameters.pathList.split("\n");
                    }
                    for (let j = 0; j < parentXPaths.length; j++) {
                        let parentXPath = parentXPaths[j];
                        let realXPath = parentXPath + xpath;
                        xpaths.push(realXPath);
                    }
                } else {
                    xpaths.push(xpath);
                }
                for (let j = 0; j < xpaths.length; j++) {
                    let xpath = xpaths[j];
                    try {
                        let elementList = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        console.log(xpath)
                        for (let k = 0; k < elementList.snapshotLength; k++) {
                            let element = elementList.snapshotItem(k);
                            if (element != null) {
                                global.markElements.push({
                                    "element": element, "bgColor": element.style.backgroundColor,
                                    "boxShadow": element.style.boxShadow
                                });
                                // element.style.backgroundColor = global.selectedColor;
                                element.style.boxShadow = "0 0 0 1px #00a8ff";
                            }
                        }
                    } catch (e) {
                        console.log("跳过错误的xpath", xpath);
                    }
                }
            }
        } else if (option == 11) {
            let params = parameters.params; //所有的提取数据参数
            let i = parameters.index;
            let param = params[i];
            let xpath = param.relativeXPath;
            if (param.relative) {
                let parentXPath = parentNode.parameters.xpath;
                if (parentNode.parameters.loopType == 2) {
                    parentXPath = parentNode.parameters.pathList.split("\n")[0].trim();
                }
                xpath = parentXPath + xpath;
            }
            let elementList = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            clearEl(true);
            for (let j = 0; j < elementList.snapshotLength; j++) {
                let element = elementList.snapshotItem(j);
                if (element != null) {
                    addEl(null, element);
                }
            }
        } else if (option == 8) {
            let loopType = parameters.loopType;
            if (loopType <= 2) {
                let xpath = "";
                if (loopType == 0) {
                    xpath = parameters.xpath;
                    let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (element != null) {
                        clearEl(true);
                        addEl(null, element);
                    }
                } else if (loopType == 1) {
                    let elementList = document.evaluate(parameters.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    let element = elementList.snapshotItem(0);
                    // if (element != null) {
                    //     clearEl(true);
                    //     addEl(null, element);
                    //     if (elementList.snapshotLength > 1) {
                    //         selectAllElements();
                    //     }
                    // }
                    clearEl(true);
                    for (let i = 0; i < elementList.snapshotLength; i++) {
                        let element = elementList.snapshotItem(i);
                        if (element != null) {
                            addEl(null, element);
                        }
                    }
                } else if (loopType == 2) {
                    clearEl(true);
                    let pathList = parameters.pathList.split("\n");
                    for (let i = 0; i < pathList.length; i++) {
                        let path = pathList[i].trim();
                        let element = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (element != null) {
                            addEl(null, element);
                        }
                    }
                }
            }
        } else if (option == 10) { //条件分支
            let condition = parameters.class;
            let result = 0;
            let additionalInfo = "";
            if (condition == 3 || condition == 4 || condition == 7) { //当前循环项判断时，选中当前循环项
                let xpath = parentNode.parameters.xpath;
                if (parentNode.parameters.loopType == 2) {
                    let pathList = parentNode.parameters.pathList.split("\n")[0].trim();
                    xpath = pathList;
                }
                let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    clearEl(true);
                    addEl(null, element);
                }
            }
            if (condition == 0) { //无条件
                result = 1;
            } else if (condition == 1) { //当前页面包含文本
                let value = parameters.value;
                let element = document.getElementsByTagName("body")[0];
                let bodyText = element.innerText;
                let outcome = bodyText.indexOf(value) >= 0;
                if (outcome) {
                    result = 1;
                }
            } else if (condition == 2) { //当前页面包含元素，xpath
                let xpath = parameters.value;
                let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    result = 1;
                }
            } else if (condition == 3) { //当前循环项包含文本，xpath
                let value = parameters.value;
                let parentXPath = parentNode.parameters.xpath;
                if (parentNode.parameters.loopType == 2) { //循环项列表
                    parentXPath = parentNode.parameters.pathList.split("\n")[0].trim();
                }
                let element = document.evaluate(parentXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    let elementText = element.innerText;
                    let outcome = elementText.indexOf(value) >= 0;
                    if (outcome) {
                        result = 1;
                    }
                }
                if (result == 0) {
                    additionalInfo = LANG("，注意只会检索第一个匹配到的循环项", ", note that only the first matching loop item will be retrieved");
                }
            } else if (condition == 4) { //当前循环项包含元素，xpath
                let parentXPath = parentNode.parameters.xpath;
                if (parentNode.parameters.loopType == 2) { //循环项列表
                    parentXPath = parentNode.parameters.pathList.split("\n")[0].trim();
                }
                let value = parameters.value;
                // full_path = "(" + parentPath + ")" + \
                //                             "[" + str(index + 1) + "]" + \
                //                             relativeXPath + content_type
                let xpath = "(" + parentXPath + ")" + "[" + "1" + "]" + value;
                let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    result = 1;
                }
                if (result == 0) {
                    additionalInfo = LANG("，注意只会检索第一个匹配到的循环项", ", note that only the first matching loop item will be retrieved");
                }
            } else if (condition == 5 || condition == 7) { //从主程序传入的结果
                result = evt["message"]["message"]["result"];
                if (condition == 7 && result == 0) {
                    additionalInfo = LANG("，注意只会检索第一个匹配到的循环项", ", note that only the first matching loop item will be retrieved");
                }
            } else {
                result = 2;
            }

            if (result == 0) {
                createNotification(LANG("当前页面下，条件分支“" + node.title + "”的条件未满足" + additionalInfo, "The condition of the conditional branch: " + node.title + " is not met on the current page" + additionalInfo), "warning");
            } else if (result == 1) {
                createNotification(LANG("当前页面下，条件分支“" + node.title + "”的条件已满足" + additionalInfo, "The condition of the conditional branch: " + node.title + " is met on the current page" + additionalInfo), "success");
            } else if (result == 2) {
                createNotification(LANG("不支持此条件判断类型的动态调试，请在任务正式运行阶段测试是否有效。", "Dynamic debugging of this condition judgment type is not supported. Please test whether it is valid in the formal call stage."), "info");
            }
        }

    }

}

export function createNotification(text, type = "info") {
    // 创建通知元素
    let notification = document.createElement('div');
    notification.className = 'notification_of_easyspider'; // 使用 class 方便后续添加样式
    notification.setAttribute("data-timestamp", new Date().getTime()); // 用于清除通知
    // 设置通知文本
    notification.innerText = text;

    // 定义与添加样式
    let cssText = `
      position: fixed;
      bottom: 20px; /* 距底部20px */
      right: -320px; /* 初始位置在屏幕右侧，假设通知框宽度320px */
      min-width: 300px;
      padding: 10px 20px;
      color: white;
      z-index: 2147483641;
      border-radius: 4px;
      text-align: center;
      font-size: 15px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: right 0.5s ease-in-out; /* 动画效果 */
    `;
    notification.style.cssText = cssText;

    if (type === "success") {
        notification.style.backgroundColor = 'rgb(103, 194, 58)';
    } else if (type === "info") {
        notification.style.backgroundColor = '#00a8ff';
    } else if (type === "warning") {
        notification.style.backgroundColor = 'rgb(230, 162, 60)';
    } else if (type === "error") {
        notification.style.backgroundColor = '#ff6b6b';
        notification.style.bottom = '70px';
    }

    // 将通知添加到页面中
    document.body.appendChild(notification);

    // 触发动画，通知从右向左滑入
    setTimeout(function () {
        notification.style.right = '20px'; // 调整距离左边的位置
    }, 100);
    // let removeXPathText = text.split("是否正确：")[0].split("is correct:")[0];
    // let timeoutInterval = 1500 * removeXPathText.length / 5;
    let timeoutInterval = 1500 * text.length / 5;
    // 设置退出动画，通知从右向左滑出
    setTimeout(function () {
        notification.style.right = '-320px'; // 向左退出
        // 确定动画结束后移除通知
        notification.addEventListener('transitionend', function () {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification); // 避免移除已经不存在的元素
            }
        });
    }, timeoutInterval + 500); // 通知停留时间加上动画时间
}

function highlightAt(x, y) {
    // 创建一个新元素
    let element = document.createElement('div');

    element.className = 'highlight_of_easyspider'; // 使用 class 方便后续添加样式

    // 设置样式
    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = '10px';  // 你可以根据需要设置大小
    element.style.height = '10px';
    element.style.backgroundColor = 'blue';  // 高亮颜色
    element.style.zIndex = '999999999';  // 确保在最上层
    element.style.pointerEvents = 'none';  // 避免阻挡点击事件
    //圆形
    element.style.borderRadius = '50%';
    // 设置动画
    element.style.animation = 'blinkAnimation 2s infinite'; // 2秒一个周期的无限循环动画
    // element.style.border = '1px solid ';    // 边框样式

    // 将元素添加到文档
    document.body.appendChild(element);
}