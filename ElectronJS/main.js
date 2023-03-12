// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const {exec} = require('child_process');
const iconPath = path.join(__dirname, 'favicon.ico');
let driverPath = "";
let chromeBinaryPath = "";
let execute_path = "";
if (process.platform === 'win32' || process.platform === 'win64') {
  driverPath = path.join(__dirname, "chrome_win32/chromedriver_win32.exe");
  chromeBinaryPath = path.join(__dirname, "chrome_win32/chrome.exe");
  execute_path = path.join(__dirname, "chrome_win32/execute.bat");
} else if (process.platform === 'darwin') {
  driverPath = path.join(__dirname, "chromedriver_mac64");
  chromeBinaryPath = path.join(__dirname, "chrome_mac64.app/Contents/MacOS/Google Chrome");
  execute_path = path.join(__dirname, "easyspider_executestage");
} else if (process.platform === 'linux') {
  driverPath = path.join(__dirname, "chrome_linux64/chromedriver_linux64");
  chromeBinaryPath = path.join(__dirname, "chrome_linux64/chrome");
  execute_path = path.join(__dirname, "chrome_linux64/easyspider_executestage");
}

let server_address = "https://servicewrapper.systems";
let driver = null;
let mainWindow = null;
let flowchart_window = null;


function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: iconPath,
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

 // 隐藏菜单栏
 const { Menu } = require('electron');
 Menu.setApplicationMenu(null);
  // mainWindow.webContents.openDevTools();
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}


function beginInvoke(msg) {
  if (msg.type == 1) {
    if (msg.message.id != -1) {
      let url = server_address + `/FlowChart.html?id=${msg.message.id}&backEndAddressServiceWrapper=` + server_address;
      console.log(url);
      flowchart_window.loadURL(url);
    }
    mainWindow.hide();
    flowchart_window.show();
  } else if (msg.type == 2) {
    //keyboard
    const robot = require("@jitsi/robotjs");
    //TODO 实现全选并删除功能,目前没有
    keyInfo = msg.message.keyboardStr.split("BS}")[1];
    robot.typeString(keyInfo);
    robot.keyTap("shift");
    robot.keyTap("shift");
  } else if (msg.type == 3) {
    try {
      if (msg.from == 0) {
        socket_flowchart.send(msg.message.pipe); //直接把消息转接
      }
      else {
        socket_window.send(msg.message.pipe);
      }
    } catch {
      dialog.showErrorBox("Error", "Please open the flowchart window first");
    }
  } else if (msg.type == 5){
    var child = require('child_process').execFile;
    var parameters = [msg.message.id, server_address];
  
    // child('Chrome/easyspider_executestage.exe', parameters, function(err,stdout, stderr) {
    //    console.log(stdout);
    // });

    let spawn = require("child_process").spawn;
    let child_process = spawn(execute_path, parameters);
    child_process.stdout.on('data', function (data) {
      console.log(data.toString());
    });
  }
}


const WebSocket = require('ws');
let socket_window = null;
let socket_start = null;
let socket_flowchart = null;
var wss = new WebSocket.Server({ port: 8084 });
wss.on('connection', function (ws) {
  ws.on('message', function (message, isBinary) {
    let msg = JSON.parse(message.toString());
    // console.log(msg, msg.type, msg.message);
    if (msg.type == 0) {
      if (msg.message.id == 0) {
        socket_window = ws;
        console.log("set socket_window")
      }
      else if (msg.message.id == 1) {
        socket_start = ws;
        console.log("set socket_start")
      }
      else if (msg.message.id == 2) {
        socket_flowchart = ws;
        console.log("set socket_flowchart");
      }
    } else {
      beginInvoke(msg);
    }
  });
});

const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { rootCertificates } = require('tls');
const { exit } = require('process');

console.log(process.platform);

async function runBrowser() {
  const serviceBuilder = new ServiceBuilder(driverPath);
  let options = new chrome.Options();
  options.addExtensions(path.join(__dirname, "EasySpider.crx"));
  options.setChromeBinaryPath(chromeBinaryPath);
  driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(serviceBuilder)
    .build();
  try {
    await driver.get(server_address + "/serviceList.html?backEndAddressServiceWrapper=" + server_address);
  } finally {
    // await driver.quit(); // 退出浏览器
  }
}

function handleOpenBrowser(event) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  runBrowser();
  flowchart_window = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: iconPath,
  });

  let id = -1;
  let url = server_address + `/FlowChart.html?id=${id}&backEndAddressServiceWrapper=` + server_address;
  // and load the index.html of the app.
  flowchart_window.loadURL(url);
  flowchart_window.hide();
  flowchart_window.on('close', function (event) {
    mainWindow.show();
  });
}

function handleOpenInvoke(event){
  const window = new BrowserWindow({icon: iconPath});
  let url = server_address + `/serviceList.html?type=1&backEndAddressServiceWrapper=` + server_address;
  // and load the index.html of the app.
  window.loadURL(url);
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
  ipcMain.on('start-design', handleOpenBrowser);
  ipcMain.on('start-invoke', handleOpenInvoke);
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0){
       createWindow();
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'){
    app.quit();
  } 
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
