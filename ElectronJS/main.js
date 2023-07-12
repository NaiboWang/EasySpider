// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen, session} = require('electron');
app.commandLine.appendSwitch("--disable-http-cache");
const {Builder, By, Key, until} = require("selenium-webdriver");
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

if(config.debug){
    let logPath = 'info.log'
    let logFile = fs.createWriteStream(logPath, { flags: 'a' })
    console.log = function() {
        logFile.write(util.format.apply(null, arguments) + '\n')
        process.stdout.write(util.format.apply(null, arguments) + '\n')
    }
    console.error = function() {
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

exec(`wmic os get Caption`, function(error, stdout, stderr) {
    if (error) {
        console.error(`执行的错误: ${error}`);
        return;
    }

    if (stdout.includes('Windows 7')) {
        console.log('Windows 7');
        let sys_version = fs.readFileSync(path.join(__dirname, `sys_version.json`), 'utf8');
        sys_version = JSON.parse(sys_version);
        if (sys_version.arch === 'x64') {
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
        width: 520,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, 'src/js/preload.js')
        },
        icon: iconPath,
        // frame: false, //取消window自带的关闭最小化等
        // resizable: false //禁止改变主窗口尺寸
    })

    // and load the index.html of the app.
    // mainWindow.loadFile('src/index.html');
    mainWindow.loadURL(server_address + '/index.html?user_data_folder=' + config.user_data_folder+"&copyright=" + config.copyright, { extraHeaders: 'pragma: no-cache\n' });
    // 隐藏菜单栏
    const {Menu} = require('electron');
    Menu.setApplicationMenu(null);
    mainWindow.on('close', function (e) {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    mainWindow.webContents.openDevTools();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
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
            flowchart_window.loadURL(url, { extraHeaders: 'pragma: no-cache\n' });
        }
        mainWindow.hide();
        // Prints the currently focused window bounds.
        // This method has to be called on macOS before changing the window's bounds, otherwise it will throw an error.
        // It will prompt an accessibility permission request dialog, if needed.
        if(process.platform != "linux" && process.platform != "darwin"){
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
        let handles = await driver.getAllWindowHandles();
        console.log("handles", handles);
        let exit = false;
        let content_handle = handle_pairs[msg.message.id];
        console.log(msg.message.id,  content_handle);
        let order = [...handles.filter(handle => handle != current_handle && handle != content_handle), current_handle, content_handle]; //搜索顺序
        let len = order.length;
        while (true) {
            // console.log("handles");
            try{
                let iframe = msg.message.iframe;
                let enter = false;
                if (/<enter>/i.test(keyInfo)) {
                    keyInfo = keyInfo.replace(/<enter>/gi, '');
                    enter = true;
                }
                let h = order[len - 1];
                console.log("current_handle", current_handle);
                if(h != null && handles.includes(h)){
                    await driver.switchTo().window(h);
                    current_handle = h;
                    console.log("switch to handle: ", h);
                }
                // await driver.executeScript("window.stop();");
                // console.log("executeScript");
                if(!iframe){
                    let element = await driver.findElement(By.xpath(msg.message.xpath));
                    console.log("Find Element at handle: ", current_handle);
                    // 使用正则表达式匹配 '<enter>'，不论大小写
                    await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
                    if(enter){
                        await element.sendKeys(Key.ENTER);
                    }
                    console.log("send key");
                    break;
                } else {
                    let iframes = await driver.findElements(By.tagName('iframe'));
                    // 遍历所有的 iframe 并点击里面的元素
                    for(let i = 0; i < iframes.length; i++) {
                        let iframe = iframes[i];
                        // 切换到 iframe
                        await driver.switchTo().frame(iframe);
                        // 在 iframe 中查找并点击元素
                        let element;
                        try {
                            element = await driver.findElement(By.xpath(msg.message.xpath));
                        } catch (error) {
                            console.log('No such element found in the iframe');
                        }
                        if (element) {
                            await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
                            if(enter){
                                await element.sendKeys(Key.ENTER);
                            }
                        }
                        // 完成操作后切回主文档
                        await driver.switchTo().defaultContent();
                    }
                    break;
                }

            } catch (error) {
                console.log("len", len);
                len = len - 1;
                if (len == 0) {
                    break;
                }
            }
            // .then(function (element) {
            //     console.log("element", element, handles);
            //     element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
            //         exit = true;
            //     }, function (error) {
            //         console.log("error", error);
            //         len = len - 1;
            //         if (len == 0) {
            //             exit = true;
            //         }
            //     }
            // );
        }
        // let handles = driver.getAllWindowHandles();
        // driver.switchTo().window(handles[handles.length - 1]);
        // driver.findElement(By.xpath(msg.message.xpath)).sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
        // robot.keyTap("a", "control");
        // robot.keyTap("backspace");
        // robot.typeString(keyInfo);
        // robot.keyTap("shift");
        // robot.keyTap("shift");
    } else if (msg.type == 3) {
        try {
            if (msg.from == 0) {
                socket_flowchart.send(msg.message.pipe); //直接把消息转接
                let message = JSON.parse(msg.message.pipe);
                let type = message.type;
                console.log("FROM Browser: ", message);
                console.log("Iframe:", message.iframe);
                if(type.indexOf("Click")>=0){
                    // 鼠标点击事件
                    let iframe = message.iframe;
                    let handles = await driver.getAllWindowHandles();
                    console.log("handles", handles);
                    let exit = false;
                    let content_handle = handle_pairs[message.id];
                    console.log(message.id,  content_handle);
                    let order = [...handles.filter(handle => handle != current_handle && handle != content_handle), current_handle, content_handle]; //搜索顺序
                    let len = order.length;
                    while(true) {
                        try{
                            let h = order[len - 1];
                            console.log("current_handle", current_handle);
                            if(h != null && handles.includes(h)){
                                await driver.switchTo().window(h); //执行失败会抛出异常
                                current_handle = h;
                                console.log("switch to handle: ", h);
                            }
                            //下面是找到窗口的情况下
                            if(!iframe){
                                let element = await driver.findElement(By.xpath(message.xpath));
                                await element.click();
                                break;
                            } else {
                                let iframes = await driver.findElements(By.tagName('iframe'));
                                // 遍历所有的 iframe 并点击里面的元素
                                for(let i = 0; i < iframes.length; i++) {
                                    let iframe = iframes[i];
                                    // 切换到 iframe
                                    await driver.switchTo().frame(iframe);
                                    // 在 iframe 中查找并点击元素
                                    let element;
                                    try {
                                        element = await driver.findElement(By.xpath(message.xpath));
                                    } catch (error) {
                                        console.log('No such element found in the iframe');
                                    }
                                    if (element) {
                                        await element.click();
                                    }
                                    // 完成操作后切回主文档
                                    await driver.switchTo().defaultContent();
                                }
                                break;
                            }
                        } catch (error) {
                            console.log("len", len); //如果没有找到元素，就切换到下一个窗口
                            len = len - 1;
                            if (len == 0) {
                                break;
                            }
                        }
                    }
                }
            } else {
                socket_window.send(msg.message.pipe);
                for(let i in allWindowSockets){
                    try{
                        allWindowSockets[i].send(msg.message.pipe);
                    } catch {
                        console.log("Cannot send to socket with id: ", allWindowScoketNames[i]);
                    }
                }
                console.log("FROM Flowchart: ", JSON.parse(msg.message.pipe));
            }
        } catch (e) {
            console.log(e);
        }
    } else if (msg.type == 5) {
        let child = require('child_process').execFile;
        // 参数顺序： 1. task id 2. server address 3. saved_file_name 4. "remote" or "local" 5. user_data_folder
        // var parameters = [msg.message.id, server_address];
        let parameters = [];
        console.log(msg.message)
        if (msg.message.user_data_folder == null || msg.message.user_data_folder == undefined || msg.message.user_data_folder == "") {
            parameters = ["--id", "[" + msg.message.id + "]", "--server_address", server_address, "--user_data", 0];
        } else {
            let user_data_folder_path = path.join(task_server.getDir(), msg.message.user_data_folder);
            parameters = ["--id", "[" + msg.message.id + "]", "--server_address", server_address, "--user_data", 1];
            config.user_data_folder = msg.message.user_data_folder;
            config.absolute_user_data_folder = user_data_folder_path;
            fs.writeFileSync(path.join(task_server.getDir(), "config.json"), JSON.stringify(config));
        }
        if(msg.message.mysql_config_path != "-1"){
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
        ws.send(JSON.stringify({"config_folder": task_server.getDir() + "/", "easyspider_location": task_server.getEasySpiderLocation()}));
    } else if (msg.type == 6) {
        try{
            flowchart_window.openDevTools();
        } catch {
            console.log("open devtools error");
        }
    } else if (msg.type == 7) {
        // 获得当前页面Cookies
        try{
            let cookies = await driver.manage().getCookies();
            console.log("Cookies: ", cookies);
            let cookiesText = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('\n');
            socket_flowchart.send(JSON.stringify({"type": "GetCookies", "message": cookiesText}));
        } catch {
            console.log("Cannot get Cookies");
        }
    }
}

const WebSocket = require('ws');
const {all} = require("express/lib/application");
let socket_window = null;
let socket_start = null;
let socket_flowchart = null;
let wss = new WebSocket.Server({port: websocket_port});
wss.on('connection', function (ws) {
    ws.on('message', async function (message, isBinary) {
        let msg = JSON.parse(message.toString());
        console.log("\n\nGET A MESSAGE: ", msg);
        // console.log(msg, msg.type, msg.message);
        if (msg.type == 0) {
            if (msg.message.id == 0) {
                socket_window = ws;
                console.log("set socket_window")
            } else if (msg.message.id == 1) {
                socket_start = ws;
                console.log("set socket_start")
            } else if (msg.message.id == 2) {
                socket_flowchart = ws;
                console.log("set socket_flowchart");
            } else { //其他的ID是用来标识不同的浏览器标签页的
                await new Promise(resolve => setTimeout(resolve, 2300));
                let handles = await driver.getAllWindowHandles();
                if(arrayDifference(handles, old_handles).length > 0){
                    old_handles = handles;
                    current_handle = handles[handles.length - 1];
                    console.log("New tab opened, change current_handle to: ", current_handle);
                }
                handle_pairs[msg.message.id] = current_handle;
                console.log("Set handle_pair for id: ", msg.message.id, " to ", current_handle, ", title is: ", msg.message.title);
                socket_flowchart.send(JSON.stringify({"type": "title", "data": {"title":msg.message.title}}));
                allWindowSockets.push(ws);
                allWindowScoketNames.push(msg.message.id);
                // console.log("handle_pairs: ", handle_pairs);
            }
        } else if (msg.type == 10) {
            let leave_handle = handle_pairs[msg.message.id];
            if (leave_handle!=null && leave_handle!=undefined && leave_handle!="")
            {
                await driver.switchTo().window(leave_handle);
                console.log("Switch to handle: ", leave_handle);
                current_handle = leave_handle;
            }
        }
        else {
            await beginInvoke(msg, ws);
        }
    });
});

console.log(process.platform);

async function runBrowser(lang = "en", user_data_folder = '', mobile = false) {
    const serviceBuilder = new ServiceBuilder(driverPath);
    let options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
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
    await driver.manage().setTimeouts({implicit: 10000, pageLoad: 10000, script: 10000});
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    // await driver.executeScript("localStorage.clear();"); //重置参数数量
    const cdpConnection = await driver.createCDPConnection("page");
    let stealth_path = path.join(__dirname, "stealth.min.js");
    let stealth = fs.readFileSync(stealth_path, 'utf8');
    await cdpConnection.execute('Page.addScriptToEvaluateOnNewDocument', {
        source: stealth,
    });
    try {
        if(mobile){
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
    let height = parseInt(size.height * 0.6);
    flowchart_window = new BrowserWindow({
        x: 0,
        y: 0,
        width: width,
        height: height,
        icon: iconPath,
    });
    let url = "";
    let id = -1;
    if (lang == "en") {
        url = server_address + `/taskGrid/FlowChart.html?id=${id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address + "&mobile=" + mobile.toString();
    } else if (lang == "zh") {
        url = server_address + `/taskGrid/FlowChart_CN.html?id=${id}&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address+ "&mobile=" + mobile.toString();
    }
    // and load the index.html of the app.
    flowchart_window.loadURL(url, { extraHeaders: 'pragma: no-cache\n' });
    if(process.platform != "darwin"){
        flowchart_window.hide();
    }
    flowchart_window.on('close', function (event) {
        mainWindow.show();
        driver.quit();
    });
}

function handleOpenInvoke(event, lang = "en") {
    const window = new BrowserWindow({icon: iconPath});
    let url = "";
    language = lang;
    if (lang == "en") {
        url = server_address + `/taskGrid/taskList.html?type=1&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address;
    } else if (lang == "zh") {
        url = server_address + `/taskGrid/taskList.html?type=1&wsport=${websocket_port}&backEndAddressServiceWrapper=` + server_address + "&lang=zh";
    }
    // and load the index.html of the app.
    window.loadURL(url, { extraHeaders: 'pragma: no-cache\n' });
    window.maximize();
    mainWindow.hide();
    window.on('close', function (event) {
        mainWindow.show();
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Accept-Language'] = 'zh'
        callback({ cancel: false, requestHeaders: details.requestHeaders })
    })
    ipcMain.on('start-design', handleOpenBrowser);
    ipcMain.on('start-invoke', handleOpenInvoke);
    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
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
