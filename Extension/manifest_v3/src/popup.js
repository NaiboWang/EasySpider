import config from './content-scripts/config.json';

if (config.language == 'zh') {
    document.getElementById('title').innerText = '可执行操作';
    document.getElementById('show-toolkit').innerText = '显示EasySpider操作台';
    document.getElementById('close-toolkit').innerText = '关闭EasySpider操作台';
} else {
    document.getElementById('title').innerText = 'Executable Operations';
    document.getElementById('show-toolkit').innerText = 'Show EasySpider Toolkit';
    document.getElementById('close-toolkit').innerText = 'Close EasySpider Toolkit';
}

document.getElementById('show-toolkit').addEventListener('click', async () => {
    try {
        // 发送消息给 content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: showToolkit
        });
        window.close();
    } catch (error) {
        console.error('Error showing toolkit:', error);
    }
});

document.getElementById('close-toolkit').addEventListener('click', async () => {
    try {
        // 发送消息给 content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: closeToolkit
        });
        window.close();
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
