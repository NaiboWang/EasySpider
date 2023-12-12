// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen, session} = require('electron');
app.commandLine.appendSwitch("--disable-http-cache");
const {Builder, By, Key, until, Select, StaleElementReferenceException} = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const {ServiceBuilder} = require('selenium-webdriver/chrome');
const {rootCertificates} = require('tls');
const {exit} = require('process');
const path = require('path');
const fs = require('fs');
const {exec, spawn} = require('child_process');
const iconPath = path.join(__dirname, 'favicon.ico');
const task_server = require(path.join(__dirname, 'server.js'));
const util = require('util');

let config = fs.readFileSync(path.join(task_server.getDir(), `config.json`), 'utf8');
config = JSON.parse(config);

if (config.debug) {
    let logPath = 'info.log'
    let logFile = fs.createWriteStream(logPath, {flags: 'a'})
    console.log = function () {
        logFile.write(util.format.apply(null, arguments) + '\n')
        process.stdout.write(util.format.apply(null, arguments) + '\n')
    }
    console.error = function () {
        logFile.write(util.format.apply(null, arguments) + '\n')
        process.stderr.write(util.format.apply(null, arguments) + '\n')
    }
}
let allWindowSockets = [];
let allWindowScoketNames = [];
task_server.start(config.webserver_port); //start local server
let server_address = `${config.webserver_address}:${config.webserver_port}`;
const websocket_port = 8084; //目前只支持8084端口，写死，因为扩展里面写死了
console.log("server_address: " + server_address);
let driverPath = "";
let chromeBinaryPath = "";
let execute_path = "";
console.log(process.arch);

exec(`wmic os get Caption`, function (error, stdout, stderr) {
    if (error) {
        console.error(`执行的错误: ${error}`);
        return;
    }

    if (stdout.includes('Windows 7')) {
        console.log('Windows 7');
        let sys_arch = config.sys_arch;
        if (sys_arch === 'x64') {
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Error',
                message: 'Windows 7系统请下载使用x32版本的软件，不论Win 7系统为x64还是x32版本。\nFor Windows 7, please download and use the x32 version of the software, regardless of whether the Win 7 system is x64 or x32 version.',
            });
        }
    } else {
        console.log('Not Windows 7');
    }
});

if (process.platform === 'win32' && process.arch === 'ia32') {
    driverPath = path.join(__dirname, "chrome_win32/chromedriver_win32.exe");
    chromeBinaryPath = path.join(__dirname, "chrome_win32/chrome.exe");
    execute_path = path.join(__dirname, "chrome_win32/execute.bat");
} else if (process.platform === 'win32' && process.arch === 'x64') {
    driverPath = path.join(__dirname, "chrome_win64/chromedriver_win64.exe");
    chromeBinaryPath = path.join(__dirname, "chrome_win64/chrome.exe");
    execute_path = path.join(__dirname, "chrome_win64/execute.bat");
} else if (process.platform === 'darwin') {
    driverPath = path.join(__dirname, "chromedriver_mac64");
    chromeBinaryPath = path.join(__dirname, "chrome_mac64.app/Contents/MacOS/Google Chrome");
    execute_path = path.join(__dirname, "");
} else if (process.platform === 'linux') {
    driverPath = path.join(__dirname, "chrome_linux64/chromedriver_linux64");
    chromeBinaryPath = path.join(__dirname, "chrome_linux64/chrome");
    execute_path = path.join(__dirname, "chrome_linux64/execute.sh");
}
console.log(driverPath, chromeBinaryPath, execute_path);
let language = "en";
let driver = null;
let mainWindow = null;
let flowchart_window = null;
let current_handle = null;
let old_handles = [];
let handle_pairs = {};
let socket_window = null;
let socket_start = null;
let socket_flowchart = null;
let invoke_window = null;

// var ffi = require('ffi-napi');
// var libm = ffi.Library('libm', {
//   'ceil': [ 'double', [ 'double' ] ]
// });
// libm.ceil(1.5); // 2
// const {user32FindWindowEx,
//   winspoolGetDefaultPrinter,} = require('win32-api/fun');
// async function testt(){
//   // 获取当前电脑当前用户默认打印机名
//   const printerName = await winspoolGetDefaultPrinter()
//   console.log(printerName);
// }

// testt();

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 550,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, 'src/js/preload.js')
        },
        icon: iconPath,
        // frame: false, //取消window自带的关闭最小化等
        resizable: false //禁止改变主窗口尺寸
    })

    // and load the index.html of the app.
    // mainWindow.loadFile('src/index.html');
    mainWindow.loadURL(server_address + '/index.html?user_data_folder=' + config.user_data_folder + "&copyright=" + config.copyright, {extraHeaders: 'pragma: no-cache\n'});
    // 隐藏菜单栏
    const {Menu} = require('electron');
    Menu.setApplicationMenu(null);
    mainWindow.on('close', function (e) {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    // mainWindow.webContents.openDevTools();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}


async function findElementRecursive(driver, by, value, frames) {
    for (const frame of frames) {
        try {
            // Try to switch to the frame
            try {
                await driver.switchTo().frame(frame);
            } catch (error) {
                if (error.name.indexOf('StaleElement') >= 0) {
                    // If the frame is stale, switch to the parent frame and then retry switching to the frame
                    await driver.switchTo().parentFrame();
                    await driver.switchTo().frame(frame);
                } else {
                    // If it is another exception rethrow it
                    throw error;
                }
            }

            let element;
            try {
                // Attempt to find the element in this frame
                element = await driver.findElement(by(value));
                return element;
            } catch (error) {
                if (error.name.indexOf('NoSuchElement') >= 0) {
                    // The element was not found in this frame, recurse into nested iframes
                    const nestedFrames = await driver.findElements(By.tagName("iframe"));
                    if (nestedFrames.length > 0) {
                        element = await findElementRecursive(driver, by, value, nestedFrames);
                        if (element) {
                            return element;
                        }
                    }
                } else {
                    // If it is another exception, log it
                    console.error(`Exception while processing frame: ${error}`);
                }
            }
        } catch (error) {
            console.error(`Exception while processing frame: ${error}`);
        }
    }

    throw new Error(`Element ${value} not found in any frame or iframe`);
}

async function findElement(driver, by, value, iframe = false) {
    // Switch back to the main document
    await driver.switchTo().defaultContent();

    if (iframe) {
        const frames = await driver.findElements(By.tagName("iframe"));
        if (frames.length === 0) {
            throw new Error(`No iframes found in the current page while searching for ${value}`);
        }
        const element = await findElementRecursive(driver, by, value, frames);
        return element;
    } else {
        // Find element in the main document as normal
        let element = await driver.findElement(by(value));
        return element;
    }
}

async function findElementAcrossAllWindows(msg, notifyBrowser = true, scrollIntoView = true) {
    let handles = await driver.getAllWindowHandles();
    // console.log("handles", handles);
    let content_handle = current_handle;
    let id = -1;
    try {
        id = msg.message.id;
    } catch {
        id = msg.id;
    }
    if (id == -1) { //如果是-1，从当前窗口开始搜索
        content_handle = current_handle;
    } else {
        content_handle = handle_pairs[id];
    }
    // console.log(msg.message.id, content_handle);
    let order = [...handles.filter(handle => handle != current_handle && handle != content_handle), current_handle, content_handle]; //搜索顺序
    let len = order.length;
    let element = null;
    let iframe = false;
    try {
        iframe = msg.message.iframe;
    } catch {
        iframe = msg.iframe;
    }
    // if (iframe) {
    //     notify_browser("在IFrame中执行操作可能需要较长时间，请耐心等待。", "Executing operations in IFrame may take a long time, please wait patiently.", "info");
    // }
    let xpath = "";
    try {
        xpath = msg.message.xpath;
    } catch {
        xpath = msg.xpath;
    }
    if (xpath.indexOf("Field(") >= 0 || xpath.indexOf("eval(") >= 0) {
        //两秒后通知浏览器
        await new Promise(resolve => setTimeout(resolve, 2000));
        notify_browser("检测到XPath中包含Field(\"\")或eval(\"\")，试运行时无法正常定位到包含此两项表达式的元素，请在任务正式调用阶段测试是否有效。", "Field(\"\") or eval(\"\") is detected in xpath, and the element containing these two expressions cannot be located normally during trial operation. Please test whether it is valid in the formal call stage.", "warning");
        return null;
    }
    let notify = false;
    while (true) {
        // console.log("handles");
        try {
            let h = order[len - 1];
            console.log("current_handle", current_handle);
            if (h != null && handles.includes(h)) {
                await driver.switchTo().window(h);
                current_handle = h;
                console.log("switch to handle: ", h);
            }
            element = await findElement(driver, By.xpath, xpath, iframe);
            break;
        } catch (error) {
            console.log("len", len);
            len = len - 1;
            if (!notify) {
                notify = true;
                // notify_browser("正在尝试在其他窗口中查找元素，请耐心等待。", "Trying to find elements in other windows, please wait patiently.", "info");
            }
            if (len == 0) {
                break;
            }
        }
    }
    if (element == null && notifyBrowser) {
        notify_browser("无法找到元素，请检查XPath是否正确：" + xpath, "Cannot find the element, please check if the XPath is correct: " + xpath, "warning");
    }
    if (element != null && scrollIntoView) {
        // 浏览器切换到元素位置稍微靠上的位置
        try {
            // let script = `arguments[0].scrollIntoView(true);`;
            let script = `arguments[0].scrollIntoView({block: "center", inline: "center"});`;
            await driver.executeScript(script, element);
        } catch (e) {
            console.log("Cannot scrollIntoView");
        }
    }
    return element;
}

async function beginInvoke(msg, ws) {
    if (msg.type == 1) {
        if (msg.message.id != -1) {
            let url = "";
            if (language == "zh") {
                url = server_address + `/taskGrid/FlowChart_CN.html?id=${msg.message.id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address;
            } else if (language == "en") {
                url = server_address + `/taskGrid/FlowChart.html?id=${msg.message.id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address;
            }
            console.log(url);
            flowchart_window.loadURL(url, {extraHeaders: 'pragma: no-cache\n'});
        }
        mainWindow.hide();
        // Prints the currently focused window bounds.
        // This method has to be called on macOS before changing the window's bounds, otherwise it will throw an error.
        // It will prompt an accessibility permission request dialog, if needed.
        if (process.platform != "linux" && process.platform != "darwin") {
            const {windowManager} = require("node-window-manager");
            const window = windowManager.getActiveWindow();
            console.log(window);
            windowManager.requestAccessibility();
            // Sets the active window's bounds.
            let size = screen.getPrimaryDisplay().workAreaSize
            let width = parseInt(size.width)
            let height = parseInt(size.height * 0.6)
            window.setBounds({x: 0, y: size.height * 0.4, height: height, width: width});
        }
        flowchart_window.show();
        // flowchart_window.openDevTools();
    } else if (msg.type == 2) {
        // 键盘输入事件
        // const robot = require("@jitsi/robotjs");
        let keyInfo = msg.message.keyboardStr;
        let enter = false;
        if (/<enter>/i.test(keyInfo)) {
            keyInfo = keyInfo.replace(/<enter>/gi, '');
            enter = true;
        }
        let element = await findElementAcrossAllWindows(msg, notifyBrowser = true, scrollIntoView = false);
        await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
        if (enter) {
            await element.sendKeys(Key.ENTER);
        }
    } else if (msg.type == 3) {
        try {
            if (msg.from == 0) {
                socket_flowchart.send(msg.message.pipe); //直接把消息转接
                let message = JSON.parse(msg.message.pipe);
                let type = message.type;
                console.log("FROM Browser: ", message);
                if (type.indexOf("Click") >= 0 || type.indexOf("Move") >= 0) {
                    let element = await findElementAcrossAllWindows(message, notifyBrowser = true, scrollIntoView = false);
                    if (type.indexOf("Click") >= 0) {
                        await click_element(element);
                    } else if (type.indexOf("Move") >= 0) {
                        await driver.actions().move({origin: element}).perform();
                    }
                }
            } else {
                send_message_to_browser(msg.message.pipe);
                console.log("FROM Flowchart: ", JSON.parse(msg.message.pipe));
            }
        } catch (e) {
            console.log(e);
        }
    } else if (msg.type == 4) { //标记元素和试运行功能
        let node = JSON.parse(msg.message.node);
        let type = msg.message.type;
        if (type == 0) { //标记元素
            let option = node.option;
            let parameters = node.parameters;
            //下面是让浏览器自动滚动到元素位置
            if (option == 2 || option == 4 || option == 6 || option == 7) {
                let xpath = parameters.xpath;
                let parent_node = JSON.parse(msg.message.parentNode);
                if (parameters.useLoop && option != 4 && option != 6) {
                    let parentXPath = parent_node.parameters.xpath;
                    xpath = parentXPath + xpath;
                }
                let elementInfo = {"iframe": parameters.iframe, "xpath": xpath, "id": -1};
                //用于跳转到元素位置
                let element = await findElementAcrossAllWindows(elementInfo, notifyBrowser = false);
            } else if (option == 3) {
                let paras = parameters.paras; //所有的提取数据参数
                let para = paras[0];
                let xpath = para.relativeXPath;
                if (para.relative) {
                    let parent_node = JSON.parse(msg.message.parentNode);
                    let parent_xpath = parent_node.parameters.xpath;
                    xpath = parent_xpath + xpath;
                }
                let elementInfo = {"iframe": para.iframe, "xpath": xpath, "id": -1};
                let element = await findElementAcrossAllWindows(elementInfo, notifyBrowser = false);
            } else if (option == 11) {
                let paras = parameters.paras; //所有的提取数据参数
                let i = parameters.index;
                let para = paras[i];
                let xpath = para.relativeXPath;
                if (para.relative) {
                    let parent_node = JSON.parse(msg.message.parentNode);
                    let parent_xpath = parent_node.parameters.xpath;
                    xpath = parent_xpath + xpath;
                }
                let elementInfo = {"iframe": para.iframe, "xpath": xpath, "id": -1};
                let element = await findElementAcrossAllWindows(elementInfo, notifyBrowser = false);
            } else if (option == 8) {
                //     <select v-model='loopType' class="form-control" @change = "handleLoopTypeChange" >
                //         < option
                // :
                //     value = 0 > 单个元素（多用于循环点击下一页）</option>
                //     <option :value = 1 > 不固定元素列表 < /option>
                //     <option :value = 2 > 固定元素列表 < /option>
                //     <option :value = 3 > 文本列表（多用于循环在文本框输入文本）</option>
                //     <option :value = 4 > 网址列表（多用于循环打开网页）</option>
                //     <option :value = 5 > JavaScript命令返回值（需以return
                //     开头）</option>
                //     <option :value = 6 > 系统命令返回值 < /option>
                //     <option :value = 7 > 执行环境下的Python表达式值（eval操作）</option>
                // </select>
                //
                let loopType = parameters.loopType;
                if (loopType <= 2) {
                    let xpath = "";
                    if (loopType <= 1) {
                        xpath = parameters.xpath;
                    } else if (loopType == 2) {
                        xpath = parameters.pathList.split("\n")[0].trim();
                    }
                    let elementInfo = {"iframe": parameters.iframe, "xpath": xpath, "id": -1};
                    let element = await findElementAcrossAllWindows(elementInfo, notifyBrowser = false);
                } else if (loopType == 5) { //JavaScript命令返回值
                    let code = parameters.code;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    let outcome = await execute_js(code, element, waitTime);
                    if (!outcome || outcome == -1) {
                        notify_browser("目前页面中，设置的循环“" + node.title + "”的JavaScript条件不成立", "The condition of the loop " + node.title + " is not met, skip this loop.", "warning");
                    } else {
                        notify_browser("目前页面中，设置的循环“" + node.title + "”的JavaScript条件成立", "The condition of the loop " + node.title + " is met, continue this loop.", "success");
                    }
                }
            } else if (option == 10) { //条件分支
                let condition = parameters.class; //条件类型
                let result = -1;
                let additionalInfo = "";
                if (condition == 5 || condition == 7) { //JavaScript命令返回值
                    let code = parameters.code;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    if (condition == 7) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let xpath = parent_node.parameters.xpath;
                        elementInfo = {"iframe": parent_node.parameters.iframe, "xpath": xpath, "id": -1};
                        element = await findElementAcrossAllWindows(elementInfo);
                    }
                    let outcome = await execute_js(code, element, waitTime);
                    if (!outcome) {
                        msg.message.result = 0; //条件不成立传入扩展
                    } else if (outcome == -1) {
                        msg.message.result = -1; //JS执行出错
                    } else {
                        msg.message.result = 1; //条件成立传入扩展
                    }
                }
            }
            send_message_to_browser(JSON.stringify({"type": "trial", "message": msg}));
        } else { //试运行
            try {
                let flowchart_url = flowchart_window.webContents.getURL();
            } catch {
                flowchart_window = null;
            }
            if (flowchart_window == null) {
                notify_flowchart("试运行功能只能在设计任务阶段，Chrome浏览器打开时使用！", "The trial run function can only be used when designing tasks and opening in Chrome browser!", "error");
            } else {
                notify_browser("正在试运行操作：" + node.title, "Trying to run the operation: " + node.title, "info");
                let option = node.option;
                let parameters = node.parameters;
                let beforeJS = "";
                let beforeJSWaitTime = 0;
                let afterJS = "";
                let afterJSWaitTime = 0;
                try {
                    beforeJS = parameters.beforeJS;
                    beforeJSWaitTime = parameters.beforeJSWaitTime;
                    afterJS = parameters.afterJS;
                    afterJSWaitTime = parameters.afterJSWaitTime;
                } catch (e) {
                    console.log(e);
                }
                if (option == 1) {
                    let url = parameters.links.split("\n")[0].trim();
                    if (parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        url = parent_node["parameters"]["textList"].split("\n")[0];
                    }
                    try {
                        await driver.get(url);
                    } catch (e) {
                        driver.switchTo().window(current_handle);
                        await driver.get(url);
                    }
                } else if (option == 2 || option == 7) { //点击事件
                    let elementInfo = {"iframe": parameters.iframe, "xpath": parameters.xpath, "id": -1};
                    if (parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        elementInfo.xpath = parent_xpath + elementInfo.xpath;
                    }
                    let element = await findElementAcrossAllWindows(elementInfo); //通过此函数找到元素并切换到对应的窗口
                    await execute_js(parameters.beforeJS, element, parameters.beforeJSWaitTime);
                    if (option == 2) {
                        await click_element(element);
                        let alertHandleType = parameters.alertHandleType;
                        if (alertHandleType == 1) {
                            try {
                                await driver.switchTo().alert().accept();
                            } catch (e) {
                                console.log("No alert");
                            }
                        } else if (alertHandleType == 2) {
                            try {
                                await driver.switchTo().alert().dismiss();
                            } catch (e) {
                                console.log("No alert");
                            }
                        }
                    } else if (option == 7) {
                        await driver.actions().move({origin: element}).perform();
                    }
                    await execute_js(parameters.afterJS, element, parameters.afterJSWaitTime);
                    send_message_to_browser(JSON.stringify({"type": "cancelSelection"}));
                } else if (option == 3) { //提取数据
                    notify_browser("提示：提取数据操作只能试运行设置的JavaScript语句，且只针对第一个匹配的元素。", "Hint: can only test JavaScript  statement set in the data extraction operation, and only for the first matching element.", "info");
                    let paras = parameters.paras; //所有的提取数据参数
                    let not_found_xpaths = [];
                    for (let i = 0; i < paras.length; i++) {
                        let para = paras[i];
                        let xpath = para.relativeXPath;
                        if (para.relative) {
                            let parent_node = JSON.parse(msg.message.parentNode);
                            let parent_xpath = parent_node.parameters.xpath;
                            xpath = parent_xpath + xpath;
                        }
                        let elementInfo = {"iframe": para.iframe, "xpath": xpath, "id": -1};
                        let element = await findElementAcrossAllWindows(elementInfo, notifyBrowser = false);
                        if (element != null) {
                            await execute_js(para.beforeJS, element, para.beforeJSWaitTime);
                            await execute_js(para.afterJS, element, para.afterJSWaitTime);
                        } else {
                            not_found_xpaths.push(xpath);
                        }
                    }
                    if (not_found_xpaths.length > 0) {
                        notify_browser("无法找到以下元素，请检查XPath是否正确：" + not_found_xpaths.join("\n"), "Cannot find the element, please check if the XPath is correct: " + not_found_xpaths.join("\n"), "warning");
                    }
                } else if (option == 4) { //键盘输入事件
                    let elementInfo = {"iframe": parameters.iframe, "xpath": parameters.xpath, "id": -1};
                    let value = node.parameters.value;
                    if (node.parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        value = parent_node["parameters"]["textList"].split("\n")[0];
                        let index = node.parameters.index;
                        if (index > 0) {
                            value = value.split("~")[index - 1];
                        }
                    }
                    let keyInfo = value
                    let enter = false;
                    if (/<enter>/i.test(keyInfo)) {
                        keyInfo = keyInfo.replace(/<enter>/gi, '');
                        enter = true;
                    }
                    if (keyInfo.indexOf("Field(") >= 0 || keyInfo.indexOf("eval(") >= 0) {
                        //两秒后通知浏览器
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        notify_browser("检测到文字中包含Field(\"\")或eval(\"\")，试运行时无法输入两项表达式的替换值，请在任务正式调用阶段测试是否有效。", "Field(\"\") or eval(\"\") is detected in the text, and the replacement value of the two expressions cannot be entered during trial operation. Please test whether it is valid in the formal call stage.", "warning");
                    }
                    let element = await findElementAcrossAllWindows(elementInfo);
                    await execute_js(beforeJS, element, beforeJSWaitTime);
                    await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
                    if (enter) {
                        await element.sendKeys(Key.ENTER);
                    }
                    await execute_js(afterJS, element, afterJSWaitTime);
                } else if (option == 5) { //自定义操作的JS代码
                    let code = parameters.code;
                    let codeMode = parameters.codeMode;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    if (codeMode == 0) {
                        await execute_js(code, element, waitTime);
                    } else if (codeMode == 8) {
                        //刷新页面
                        await driver.navigate().refresh();
                    }
                } else if (option == 6) { //切换下拉选项
                    let optionMode = parseInt(parameters.optionMode);
                    let optionValue = parameters.optionValue;
                    if (node.parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        optionValue = parent_node["parameters"]["textList"].split("\n")[0];
                        let index = node.parameters.index;
                        if (index > 0) {
                            optionValue = optionValue.split("~")[index - 1];
                        }
                    }
                    let elementInfo = {"iframe": parameters.iframe, "xpath": parameters.xpath, "id": -1};
                    let element = await findElementAcrossAllWindows(elementInfo);
                    execute_js(beforeJS, element, beforeJSWaitTime);
                    let dropdown = new Select(element);
                    // Interacting with dropdown element based on optionMode
                    switch (optionMode) {
                        case 0: //切换到下一个选项
                            let script = `var options = arguments[0].options;
                        for (var i = 0; i < options.length; i++) {
                            if (options[i].selected) {
                                options[i].selected = false;
                                if (i == options.length - 1) {
                                    options[0].selected = true;
                                } else {
                                    options[i + 1].selected = true;
                                }
                                break;
                            }
                        }`;
                            await driver.executeScript(script, element);
                            break;
                        case 1:
                            await dropdown.selectByIndex(parseInt(optionValue));
                            break;
                        case 2:
                            await dropdown.selectByValue(optionValue);
                            break;
                        case 3:
                            await dropdown.selectByVisibleText(optionValue);
                            break;
                        default:
                            throw new Error('Invalid option mode');
                    }
                    execute_js(afterJS, element, afterJSWaitTime);
                } else if (option == 11) { //单个提取数据参数
                    notify_browser("提示：提取数据操作只能试运行设置的JavaScript语句，且只针对第一个匹配的元素。", "Hint: can only test JavaScript  statement set in the data extraction operation, and only for the first matching element.", "info");
                    let paras = parameters.paras; //所有的提取数据参数
                    let i = parameters.index;
                    let para = paras[i];
                    let xpath = para.relativeXPath;
                    if (para.relative) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        xpath = parent_xpath + xpath;
                    }
                    let elementInfo = {"iframe": para.iframe, "xpath": xpath, "id": -1};
                    let element = await findElementAcrossAllWindows(elementInfo);
                    if (element != null) {
                        await execute_js(para.beforeJS, element, para.beforeJSWaitTime);
                        await execute_js(para.afterJS, element, para.afterJSWaitTime);
                    }
                }
            }
        }

    } else if (msg.type == 5) {
        let child = require('child_process').execFile;
        // 参数顺序： 1. task id 2. server address 3. saved_file_name 4. "remote" or "local" 5. user_data_folder
        // var parameters = [msg.message.id, server_address];
        let parameters = [];
        console.log(msg.message)
        if (msg.message.user_data_folder == null || msg.message.user_data_folder == undefined || msg.message.user_data_folder == "") {
            parameters = ["--ids", "[" + msg.message.id + "]", "--server_address", server_address, "--user_data", 0];
        } else {
            let user_data_folder_path = path.join(task_server.getDir(), msg.message.user_data_folder);
            parameters = ["--ids", "[" + msg.message.id + "]", "--server_address", server_address, "--user_data", 1];
            config.user_data_folder = msg.message.user_data_folder;
            config.absolute_user_data_folder = user_data_folder_path;
            fs.writeFileSync(path.join(task_server.getDir(), "config.json"), JSON.stringify(config));
        }
        if (msg.message.mysql_config_path != "-1") {
            config.mysql_config_path = msg.message.mysql_config_path;
        }
        fs.writeFileSync(path.join(task_server.getDir(), "config.json"), JSON.stringify(config));
        // child('Chrome/easyspider_executestage.exe', parameters, function(err,stdout, stderr) {
        //    console.log(stdout);
        // });

        let spawn = require("child_process").spawn;
        if (process.platform != "darwin" && msg.message.execute_type == 1 && msg.message.id != -1) {
            let child_process = spawn(execute_path, parameters);
            child_process.stdout.on('data', function (data) {
                console.log(data.toString());
            });
        }
        ws.send(JSON.stringify({
            "config_folder": task_server.getDir() + "/",
            "easyspider_location": task_server.getEasySpiderLocation()
        }));
    } else if (msg.type == 6) {
        try {
            flowchart_window.openDevTools();
        } catch {
            console.log("open devtools error");
        }
        try {
            invoke_window.openDevTools();
        } catch {
            console.log("open devtools error");
        }
    } else if (msg.type == 7) {
        // 获得当前页面Cookies
        try {
            let cookies = await driver.manage().getCookies();
            console.log("Cookies: ", cookies);
            let cookiesText = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('\n');
            socket_flowchart.send(JSON.stringify({"type": "GetCookies", "message": cookiesText}));
        } catch {
            console.log("Cannot get Cookies");
        }
    }
}

async function click_element(element) {
    try {
        await element.click();
        //ctrl+click
        // await driver.actions().keyDown(Key.CONTROL).click(element).keyUp(Key.CONTROL).perform();
    } catch (e) {
        console.log(e);
        await driver.executeScript("arguments[0].click();", element);
    }
}

async function execute_js(js, element, wait_time = 3) {
    let outcome = 0;
    if (js.length != 0) {
        try {
            outcome = await driver.executeScript(js, element);
            if (wait_time == 0) {
                wait_time = 30000;
            }
            // await new Promise(resolve => setTimeout(resolve, wait_time));
        } catch (e) {
            // await new Promise(resolve => setTimeout(resolve, 2000));
            notify_browser("执行JavaScript出错，请检查JavaScript语句是否正确：" + js + "\n错误信息：" + e, "Error executing JavaScript, please check if the JavaScript statement is correct: " + js + "\nError message: " + e, "error");
            outcome = -1;
        }
        if (js.indexOf("Field(") >= 0 || js.indexOf("eval(") >= 0) {
            //两秒后通知浏览器
            await new Promise(resolve => setTimeout(resolve, 2000));
            notify_browser("检测到JavaScript中包含Field(\"\")或eval(\"\")，试运行时无法执行两项表达式，请在任务正式调用阶段测试是否有效。", "Field(\"\") or eval(\"\") is detected in JavaScript, and the two expressions cannot be executed during trial operation. Please test whether it is valid in the formal call stage.", "warning");
        }
    }
    return outcome;
}

function notify_flowchart(msg_zh, msg_en, level = "info") {
    socket_flowchart.send(JSON.stringify({"type": "notify", "level": level, "msg_zh": msg_zh, "msg_en": msg_en}));
}

function notify_browser(msg_zh, msg_en, level = "info") {
    send_message_to_browser(JSON.stringify({"type": "notify", "level": level, "msg_zh": msg_zh, "msg_en": msg_en}));
}

function send_message_to_browser(message) {
    socket_window.send(message);
    for (let i in allWindowSockets) {
        try {
            allWindowSockets[i].send(message);
        } catch {
            console.log("Cannot send to socket with id: ", allWindowScoketNames[i]);
        }
    }
}

const WebSocket = require('ws');
const {all} = require("express/lib/application");
let wss = new WebSocket.Server({port: websocket_port});
wss.on('connection', function (ws) {
    ws.on('message', async function (message, isBinary) {
        let msg = JSON.parse(message.toString());
        // console.log("\n\nGET A MESSAGE: ", msg);
        // console.log(msg, msg.type, msg.message);
        if (msg.type == 0) {
            if (msg.message.id == 0) {
                socket_window = ws;
                // socket_window.on('close', function (event) {
                //     socket_window = null;
                //     console.log("socket_window closed");
                // });
                // console.log("set socket_window at time: ", new Date());
            } else if (msg.message.id == 1) {
                socket_start = ws;
                console.log("set socket_start at time: ", new Date());
            } else if (msg.message.id == 2) {
                socket_flowchart = ws;
                // socket_flowchart.on('close', function (event) {
                //     socket_flowchart = null;
                //     console.log("socket_flowchart closed");
                // });
                console.log("set socket_flowchart at time: ", new Date());
            } else { //其他的ID是用来标识不同的浏览器标签页的
                // await new Promise(resolve => setTimeout(resolve, 200));
                let handles = await driver.getAllWindowHandles();
                if (arrayDifference(handles, old_handles).length > 0) {
                    old_handles = handles;
                    current_handle = handles[handles.length - 1];
                    await driver.switchTo().window(current_handle);
                    console.log("New tab opened, change current_handle to: ", current_handle);
                    // 调整浏览器窗口大小，不然扩展会白屏
                    let size = await driver.manage().window().getRect();
                    let width = size.width;
                    let height = size.height;
                    await driver.manage().window().setRect({width: width, height: height + 10});
                    // height = height - 1;
                    await driver.manage().window().setRect({width: width, height: height});
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                handle_pairs[msg.message.id] = current_handle;
                console.log("Set handle_pair for id: ", msg.message.id, " to ", current_handle, ", title is: ", msg.message.title);
                socket_flowchart.send(JSON.stringify({"type": "title", "data": {"title": msg.message.title}}));
                allWindowSockets.push(ws);
                allWindowScoketNames.push(msg.message.id);
                console.log("set socket for id: ", msg.message.id, " at time: ", new Date());
                ws.on('close', async function (event) {
                    let index = allWindowSockets.indexOf(ws);
                    if (index > -1) {
                        allWindowSockets.splice(index, 1);
                        allWindowScoketNames.splice(index, 1);
                    }
                    let handles = await driver.getAllWindowHandles();
                    if (handles.length < old_handles.length) {
                        old_handles = handles;
                        current_handle = handles[handles.length - 1];
                        await driver.switchTo().window(current_handle);
                        console.log("Current tab closed, change current_handle to: ", current_handle);
                    }
                    console.log("socket for id: ", msg.message.id, " closed at time: ", new Date());
                });
                // console.log("handle_pairs: ", handle_pairs);
            }
        } else if (msg.type == 10) {
            let leave_handle = handle_pairs[msg.message.id];
            if (leave_handle != null && leave_handle != undefined && leave_handle != "") {
                await driver.switchTo().window(leave_handle);
                console.log("Switch to handle: ", leave_handle);
                current_handle = leave_handle;
            }
        } else {
            await beginInvoke(msg, ws);
        }
    });

});

console.log(process.platform);

async function runBrowser(lang = "en", user_data_folder = '', mobile = false) {
    const serviceBuilder = new ServiceBuilder(driverPath);
    let options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-infobars');
    // 添加实验性选项以排除'enable-automation'开关
    options.set('excludeSwitches', ['enable-automation']);
    options.excludeSwitches("enable-automation")

    // 添加实验性选项来禁用自动化扩展
    options.set('useAutomationExtension', false);
    // options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36');
    options.set
    language = lang;
    if (lang == "en") {
        options.addExtensions(path.join(__dirname, "EasySpider_en.crx"));
    } else if (lang == "zh") {
        options.addExtensions(path.join(__dirname, "EasySpider_zh.crx"));
    }
    options.addExtensions(path.join(__dirname, "XPathHelper.crx"));
    options.setChromeBinaryPath(chromeBinaryPath);

    if (user_data_folder != "") {
        let dir = path.join(task_server.getDir(), user_data_folder);
        console.log(dir);
        options.addArguments("--user-data-dir=" + dir);
        config.user_data_folder = user_data_folder;
        fs.writeFileSync(path.join(task_server.getDir(), "config.json"), JSON.stringify(config));
    }
    if (mobile) {
        const mobileEmulation = {
            deviceName: 'iPhone XR'
        };
        options.addArguments(`--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"`);
        options.setMobileEmulation(mobileEmulation);
    }
    driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(serviceBuilder)
        .build();
    await driver.manage().setTimeouts({implicit: 3, pageLoad: 10000, script: 10000});
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    // await driver.executeScript("localStorage.clear();"); //重置参数数量
    const cdpConnection = await driver.createCDPConnection("page");
    let stealth_path = path.join(__dirname, "stealth.min.js");
    let stealth = fs.readFileSync(stealth_path, 'utf8');
    await cdpConnection.execute('Page.addScriptToEvaluateOnNewDocument', {
        source: stealth,
    });
    try {
        if (mobile) {
            await driver.get(server_address + "/taskGrid/taskList.html?wsport=" + websocket_port + "&backEndAddressServiceWrapper=" + server_address + "&mobile=1&lang=" + lang);
        } else {
            await driver.get(server_address + "/taskGrid/taskList.html?wsport=" + websocket_port + "&backEndAddressServiceWrapper=" + server_address + "&lang=" + lang);
        }

        old_handles = await driver.getAllWindowHandles();
        current_handle = old_handles[old_handles.length - 1];
    } finally {
        // await driver.quit(); // 退出浏览器
    }
}

function handleOpenBrowser(event, lang = "en", user_data_folder = "", mobile = false) {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    runBrowser(lang, user_data_folder, mobile);
    let size = screen.getPrimaryDisplay().workAreaSize;
    let width = parseInt(size.width);
    let height = parseInt(size.height * 0.5);
    flowchart_window = new BrowserWindow({
        x: 0,
        y: 0,
        width: width,
        height: height,
        icon: iconPath,
        maximizable: true,
        resizable: true,
    });
    let url = "";
    let id = -1;
    if (lang == "en") {
        url = server_address + `/taskGrid/FlowChart.html?id=${id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address + "&mobile=" + mobile.toString();
    } else if (lang == "zh") {
        url = server_address + `/taskGrid/FlowChart_CN.html?id=${id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address + "&mobile=" + mobile.toString();
    }
    // and load the index.html of the app.
    flowchart_window.loadURL(url, {extraHeaders: 'pragma: no-cache\n'});
    if (process.platform != "darwin") {
        flowchart_window.hide();
    }
    flowchart_window.on('close', function (event) {
        mainWindow.show();
        driver.quit();
    });
}

function handleOpenInvoke(event, lang = "en") {
    invoke_window = new BrowserWindow({icon: iconPath});
    let url = "";
    language = lang;
    if (lang == "en") {
        url = server_address + `/taskGrid/taskList.html?type=1&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address;
    } else if (lang == "zh") {
        url = server_address + `/taskGrid/taskList.html?type=1&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address + "&lang=zh";
    }
    // and load the index.html of the app.
    invoke_window.loadURL(url, {extraHeaders: 'pragma: no-cache\n'});
    invoke_window.maximize();
    mainWindow.hide();
    invoke_window.on('close', function (event) {
        mainWindow.show();
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Accept-Language'] = 'zh'
        callback({cancel: false, requestHeaders: details.requestHeaders})
    })
    ipcMain.on('start-design', handleOpenBrowser);
    ipcMain.on('start-invoke', handleOpenInvoke);
    ipcMain.on('accept-agreement', function (event, arg) {
        config.copyright = 1;
        fs.writeFileSync(path.join(task_server.getDir(), "config.json"), JSON.stringify(config));
    });
    createWindow();

    app.on('activate', function () {
        // On MacOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function arrayDifference(arr1, arr2) {
    return arr1.filter(item => !arr2.includes(item));
}
