import {LANG} from "./global.js";

//试运行操作标记
export function trial(evt) {
    let node = JSON.parse(evt["message"]["message"]["node"]);
    let parentNode = JSON.parse(evt["message"]["message"]["parentNode"]);
    let parameters = node.parameters;
    let type = evt["message"]["message"]["type"];
    console.log("parameters", parameters);
    if (type == 0) {
        let option = node.option;
        console.log("option", option);
        if (option == 2 || option == 4 || option == 6 || option == 7) {
            let xpath = parameters.xpath;
            if (parameters.useLoop && option != 4 && option != 6) {
                let parentXPath = parentNode.parameters.xpath;
                xpath = parentXPath + xpath;
            }
            let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // if (element != null) {
            //     //移动到元素位置
            //     element.scrollIntoView({block: "center", inline: "center"});
            // }
        } else if (option == 10) { //条件分支
            let condition = parameters.class;
            let result = 0;
            let additionalInfo = "";
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
                let xpath = parentNode.parameters.xpath;
                let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    let elementText = element.innerText;
                    let outcome = elementText.indexOf(value) >= 0;
                    if (outcome) {
                        result = 1;
                    }
                }
                if(result == 0){
                    additionalInfo = LANG("，注意只会检索第一个匹配到的循环项", ", note that only the first matching loop item will be retrieved");
                }
            } else if (condition == 4) { //当前循环项包含元素，xpath
                let xpath = parentNode.parameters.xpath;
                let value = parameters.value;
                // full_path = "(" + parentPath + ")" + \
                //                             "[" + str(index + 1) + "]" + \
                //                             relativeXPath + content_type
                xpath = "(" + xpath + ")" + "[" + "1" + "]" + value;
                let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element != null) {
                    result = 1;
                }
                if(result == 0){
                    additionalInfo = LANG("，注意只会检索第一个匹配到的循环项", ", note that only the first matching loop item will be retrieved");
                }
            } else if (condition == 5 || condition == 7) { //从主程序传入的结果
                result = evt["message"]["message"]["result"];
                if(condition == 7 && result == 0){
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
                createNotification(LANG("不支持此条件判断类型的动态调试，请在任务正式调用阶段测试是否有效。", "Dynamic debugging of this condition judgment type is not supported. Please test whether it is valid in the formal call stage."), "info");
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