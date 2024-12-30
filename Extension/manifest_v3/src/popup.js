import config from './content-scripts/config.json';
import {global} from "./content-scripts/global.js";

if (config.language == 'zh') {
    document.getElementById('title').innerText = '可执行操作';
    document.getElementById('show-toolkit').innerText = '显示EasySpider操作台';
    document.getElementById('close-toolkit').innerText = '隐藏EasySpider操作台';
} else {
    document.getElementById('title').innerText = 'Executable Operations';
    document.getElementById('show-toolkit').innerText = 'Show EasySpider Toolkit';
    document.getElementById('close-toolkit').innerText = 'Hide EasySpider Toolkit';
}

var ws = new WebSocket("ws://localhost:8084");
ws.onopen = function () {
    // Web Socket 已连接上，使用 send() 方法发送数据
    console.log("已连接");
    let message = {
        type: 0, //消息类型，0代表连接操作
        message: {
            id: 3, //socket id
            title: document.title, //网页标题
        }
    };
    this.send(JSON.stringify(message));
};

document.getElementById('show-toolkit').addEventListener('click', async () => {
    try {
        // 发送消息给 content script
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: showToolkit
        });
        let message_action = {
            type: 30, //消息类型，30代表显示所有操作台
            from: 3, //3代表popup
            message: {}
        };
        window.close();
        try {
            ws.send(JSON.stringify(message_action));
        } catch (e) {

        }
    } catch (error) {
        console.error('Error showing toolkit:', error);
    }
});

document.getElementById('close-toolkit').addEventListener('click', async () => {
    try {
        // 发送消息给 content script
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: closeToolkit
        });
        let message_action = {
            type: 31, //消息类型，30代表隐藏所有操作台
            from: 3, //3代表popup
            message: {}
        };
        window.close();
        try {
            ws.send(JSON.stringify(message_action));
        } catch (e) {

        }
    } catch (error) {
        console.error('Error closing toolkit:', error);
    }
});

// 显示操作台函数
function showToolkit() {
    const showContainers = (documentRoot) => {
        const containers = documentRoot.querySelectorAll('#wrapperToolkit');
        containers.forEach(container => {
            if (getComputedStyle(container).display === 'none') {
                container.style.display = 'block';
                console.log('显示EasySpider操作台');
            }
        });
    };

    const processIframes = (documentRoot) => {
        const iframes = documentRoot.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    // 显示 iframe 内的 #wrapperToolkit
                    showContainers(iframeDoc);
                    processIframes(iframeDoc);
                }
            } catch (err) {
                console.warn('无法访问 iframe:', err);
            }
        });
    };

    // 处理主文档和嵌套 iframe
    showContainers(document);
    processIframes(document);
}

// 关闭操作台函数
function closeToolkit() {
    const hideContainers = (documentRoot) => {
        const containers = documentRoot.querySelectorAll('#wrapperToolkit');
        containers.forEach(container => {
            if (getComputedStyle(container).display === 'block') {
                container.style.display = 'none';
                console.log('关闭EasySpider操作台');
            }
        });
    };

    const processIframes = (documentRoot) => {
        const iframes = documentRoot.querySelectorAll('iframe');
        console.log("iframes", iframes);
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    // 隐藏 iframe 内的 #wrapperToolkit
                    hideContainers(iframeDoc);
                    processIframes(iframeDoc);
                }
            } catch (err) {
                console.warn('无法访问 iframe:', err);
            }
        });
    };

    // 处理主文档和嵌套 iframe
    hideContainers(document);
    processIframes(document);
}
