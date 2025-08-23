const http = require("http");
const querystring = require("querystring");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { app, dialog } = require("electron");
const XLSX = require("xlsx");
const formidable = require("formidable");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { param } = require("express/lib/router");
const http_request = require('http'); // 用于发送请求
const { generateKey } = require("crypto");

function travel(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const pathname = path.join(dir, file);
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback);
    } else {
      callback(pathname);
    }
  });
}
function compare(p) {
  //这是比较函数
  return function (m, n) {
    let a = m[p];
    let b = n[p];
    return b - a; //降序
  };
}

function getDir() {
  if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
    if (process.platform == "darwin") {
      return app.getPath("userData");
    } else {
      return path.join(__dirname, "../../..");
    }
  } else {
    return __dirname;
  }
}
function getEasySpiderLocation() {
  if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
    if (process.platform == "darwin") {
      return path.join(__dirname, "../../../");
    } else {
      return path.join(__dirname, "../../../");
    }
  } else {
    return __dirname;
  }
}
if (!fs.existsSync(path.join(getDir(), "tasks"))) {
  fs.mkdirSync(path.join(getDir(), "tasks"));
}
if (!fs.existsSync(path.join(getDir(), "execution_instances"))) {
  fs.mkdirSync(path.join(getDir(), "execution_instances"));
}
if (!fs.existsSync(path.join(getDir(), "config.json"))) {
  // Generate config.json
  fs.writeFileSync(
    path.join(getDir(), "config.json"),
    JSON.stringify({
      webserver_address: "http://localhost",
      webserver_port: 8074,
      user_data_folder: "./user_data",
      debug: false,
      lang: "-",
      copyright: 0,
      sys_arch: require("os").arch(),
      mysql_config_path: "./mysql_config.json",
      absolute_user_data_folder:
        "D:\\Document\\Projects\\EasySpider\\ElectronJS\\user_data",
    })
  );
}

let child_processes = {};
let child_logs = {};

let config = fs.readFileSync(
    path.join(getDir(), `config.json`),
    "utf8"
);
config = JSON.parse(config);

exports.getDir = getDir;
exports.getEasySpiderLocation = getEasySpiderLocation;
FileMimes = JSON.parse(
  fs.readFileSync(path.join(__dirname, "mime.json")).toString()
);

const fileServer = express();
const upload = multer({ dest: path.join(getDir(), "Data/") });

fileServer.use(cors());
fileServer.post("/excelUpload", upload.single("file"), (req, res) => {
  let workbook = XLSX.readFile(req.file.path);
  let sheet_name_list = workbook.SheetNames;
  let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
  let result = data.reduce((acc, obj) => {
    Object.keys(obj).forEach((key) => {
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj[key]);
    });
    return acc;
  }, {});
  // console.log(data);
  // delete file after reading
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    // file removed
  });
  res.send(JSON.stringify(result));
});

fileServer.listen(8075, () => {
  console.log("Server listening on http://localhost:8075");
});


/**
 * Write single data and success header to a response and end the response.
 * @param {Response} res default response object
 * @param {any} data response data
 * @param {number} statusCode response status code
 * @param {string} contentType response content type
 */
function writeAndEnd(res, data, statusCode = 200, contentType = 'application/json') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.write(data);
  res.end();
}


/**
 * Write a success response with JSON content type.
 * @param {Response} res default response object
 * @param {any} data response data
 * @param {string} successMessage success message(optional)
 */
function writeSuccess(res, data, successMessage = "") {
  // Write a success response with JSON content type
  writeAndEnd(res, JSON.stringify({ success: successMessage, status: true, ...data}), 200, 'application/json');
}


/**
 * Write an error response with JSON content type.
 * @param {Response} res default response object
 * @param {number} errorCode error code
 * @param {string} errorMessage error message(optional)
 */
function writeError(res, errorCode, errorMessage="Internal Server Error") {
  // Write an error response with JSON content type
  writeAndEnd(res, JSON.stringify({ error: errorMessage, status: false }), errorCode, 'application/json');
}

function generateUuid() {
  var s = [];
  var hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = "4"
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
  s[8] = s[13] = s[18] = s[23] = "-"
  let uuid = s.join("")
  return uuid
}

// When error occurs in the handler, it will be caught and logged, and a 500 response will be sent if headers have not been sent yet.
// This is useful to prevent the server from crashing due to unhandled exceptions in the request handlers
function safeHandler(handler, res) {
  return (...args) => {
    try {
      handler(...args);
    } catch (err) {
      console.error("Error handling request:", err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        if (process.env.NODE_ENV === 'development') {
          res.end(`Internal Server Error: \n${err.stack}`);
        } else {
          res.end("Internal Server Error");
        }
      }
    }
  };
}

exports.start = function (port = 8074) {
  http
    .createServer(function (req, res) {
      let body = "";
      res.setHeader("Access-Control-Allow-Origin", "*"); // 设置可访问的源
      // 解析参数
      const pathName = url.parse(req.url).pathname;
      const safeBase = path.join(__dirname, "src");

      const safeJoin = (base, target) => {
        const targetPath = "." + path.posix.normalize("/" + target);
        return path.join(base, targetPath);
      };
      if (pathName == "/excelUpload" && req.method.toLowerCase() === "post") {
        // // parse a file upload
        // let form = new formidable.IncomingForm();
        // // Set the max file size
        // form.maxFileSize = 200 * 1024 * 1024; // 200MB
        // form.parse(req, function (err, fields, files) {
        //     console.log("excelUpload")
        //     console.log(err, fields, files);
        //     let oldpath = files.file.path;
        //     let workbook = XLSX.readFile(oldpath);
        //     let sheet_name_list = workbook.SheetNames;
        //     let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        //     console.log(data);
        //     res.end('File uploaded and read successfully.');
        // });
      }
      // else if(pathName.indexOf("index.html") >= 0) {
      //     fs.readFile(path.join(__dirname,"src", pathName), async (err, data) => {
      //         if (err) {
      //             res.writeHead(404, { 'Content-Type': 'text/html;charset="utf-8"' })
      //             res.end(err.message)
      //             return;
      //         }
      //         if (!err) {
      //             // 3. 针对不同的文件返回不同的内容头
      //             let extname = path.extname(pathName);
      //             let mime = FileMimes[extname]
      //             res.writeHead(200, { 'Content-Type': mime + ';charset="utf-8"' })
      //             res.end(data);
      //             return;
      //         }
      //     })
      // }
      else if (pathName.indexOf(".") >= 0) {
        //如果有后缀名, 则为前端请求
        // console.log(path.join(__dirname,"src/taskGrid", pathName));
        const filePath = safeJoin(safeBase, pathName);

        if (!filePath.startsWith(safeBase)) {
          res.writeHead(400, { "Content-Type": 'text/html;charset="utf-8"' });
          res.end("Invalid path");
          return;
        }
        
        fs.readFile(
          filePath,
          async (err, data) => {
            if (err) {
              res.writeHead(404, {
                "Content-Type": 'text/html;charset="utf-8"',
              });
              res.end(err.message);
              return;
            }
            if (!err) {
              // 3. 针对不同的文件返回不同的内容头
              let extname = path.extname(pathName);
              let mime = FileMimes[extname];
              res.writeHead(200, { "Content-Type": mime + ';charset="utf-8"' });
              res.end(data);
              return;
            }
          }
        );
      }

      req.on("data", function (chunk) {
        body += chunk;
      });
      req.on("end", safeHandler(() => {
        // 设置响应头部信息及编码
        if (pathName == "/queryTasks") {
          //查询所有服务信息，只包括id和服务名称
          output = [];
          travel(path.join(getDir(), "tasks"), function (pathname) {
            const data = fs.readFileSync(pathname, "utf8");
            let stat = fs.statSync(pathname, "utf8");
            // parse JSON string to JSON object
            // console.log("\n\n\n\n\n", pathname, '\n\n\n\n\n\n');
            if (pathname.indexOf(".json") >= 0) {
              const task = JSON.parse(data);
              let item = {
                id: task.id,
                name: task.name,
                url: task.links.split("\n")[0],
                mtime: stat.mtime,
                links: task.links,
                desc: task.desc,
              };
              if (item.id != -2) {
                output.push(item);
              }
            }
          });
          output.sort(compare("mtime"));
          // 只修改外层为 {} 的响应增加 status 字段，其他响应不变，否则就和之前不兼容了
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(JSON.stringify(output));
          res.end();
        } else if (pathName == "/queryOSVersion") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(
            JSON.stringify({ version: process.platform, bit: process.arch })
          );
          res.end();
        } else if (pathName == "/queryExecutionInstances") {
          //查询所有服务信息，只包括id和服务名称
          output = [];
          travel(
            path.join(getDir(), "execution_instances"),
            function (pathname) {
              const data = fs.readFileSync(pathname, "utf8");
              // parse JSON string to JSON object
              const task = JSON.parse(data);
              let item = {
                id: task.id,
                name: task.name,
                url: task.url,
              };
              if (item.id != -2) {
                output.push(item);
              }
            }
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(JSON.stringify(output));
          res.end();
        } else if (pathName == "/queryTask") {
          let params = url.parse(req.url, true).query;
          try {
            let tid = parseInt(params.id);
            const data = fs.readFileSync(
              path.join(getDir(), `tasks/${tid}.json`),
              "utf8"
            );
            // parse JSON string to JSON object
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(data);
            res.end();
          } catch (error) {
            writeError(res, 404, "Cannot find task based on specified task ID.");
          }
        } else if (pathName == "/queryExecutionInstance") {
          let params = url.parse(req.url, true).query;
          try {
            let tid = parseInt(params.id);
            const data = fs.readFileSync(
              path.join(getDir(), `execution_instances/${tid}.json`),
              "utf8"
            );
            // parse JSON string to JSON object
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(data);
            res.end();
          } catch (error) {
            writeError(res, 404, "Cannot find execution instance based on specified execution ID.");
          }
        } else if (pathName == "/") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.write("Hello World!", "utf8");
          res.end();
        } else if (pathName == "/deleteTask") {
          let params = url.parse(req.url, true).query;
          try {
            let tid = parseInt(params.id);
            let data = fs.readFileSync(
              path.join(getDir(), `tasks/${tid}.json`),
              "utf8"
            );
            data = JSON.parse(data);
            data.id = -2;
            data = JSON.stringify(data);
            // write JSON string to a file
            fs.writeFile(
              path.join(getDir(), `tasks/${tid}.json`),
              data,
              (err) => {
                if (err) {
                  throw err;
                }
              }
            );
            writeSuccess(res, {}, "Task has been deleted successfully.");
          } catch (error) {
            writeError(res, 404, "Cannot find task based on specified task ID.")
          }
        } else if (pathName == "/manageTask") {
          body = querystring.parse(body);
          data = JSON.parse(body.params);
          let id = data["id"];
          if (data["id"] == -1) {
            file_names = [];
            fs.readdirSync(path.join(getDir(), "tasks")).forEach((file) => {
              try {
                if (file.split(".")[1] == "json") {
                  file_names.push(parseInt(file.split(".")[0]));
                }
              } catch (error) {}
            });
            if (file_names.length == 0) {
              id = 0;
            } else {
              id = Math.max(...file_names) + 1;
            }
            data["id"] = id;
            // write JSON string to a fil
          }
          if (data["outputFormat"] == "mysql") {
            let mysql_config_path = path.join(getDir(), "mysql_config.json");
            // 检测文件是否存在
            fs.access(mysql_config_path, fs.F_OK, (err) => {
              if (err) {
                console.log("File does not exist. Creating...");
                // 文件不存在，创建文件
                const config = {
                  host: "localhost",
                  port: 3306,
                  username: "your_username",
                  password: "your_password",
                  database: "your_database",
                };
                fs.writeFile(
                  mysql_config_path,
                  JSON.stringify(config, null, 4),
                  (err) => {
                    if (err) throw err;
                    console.log("File is created successfully.");
                  }
                );
              } else {
                console.log("File exists.");
              }
            });
          }
          data = JSON.stringify(data);
          // write JSON string to a file
          fs.writeFile(
            path.join(getDir(), `tasks/${id}.json`),
            data,
            (err) => {}
          );
          
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.write(id.toString(), "utf8");
          res.end();
        } else if (pathName == "/invokeTask") {
          body = querystring.parse(body);
          let data;
          if (body.params === undefined || body.params == "") {
            data = {};
          } else {
            try{
              data = JSON.parse(body.params);
            } catch (error) {
              console.error(error);
              writeError(res, 400, "Fail to parse parameters from json string.");
              return;
            }
          }
          let id = body.id;
          if (id === undefined || id == "") {
            writeError(res, 400, "Task ID is required.");
            return;
          }
          let task = fs.readFileSync(
            path.join(getDir(), `tasks/${id}.json`),
            "utf8"
          );
          task = JSON.parse(task);
          // 允许不填写 urlList_0，此时采用任务中的默认值
          if (data["urlList_0"] !== undefined && data["urlList_0"] != "") {
              try {
                task["links"] = data["urlList_0"];
              } catch (error) {
            }
          }
          for (const [key, value] of Object.entries(data)) {
            for (let i = 0; i < task["inputParameters"].length; i++) {
              if (key === task["inputParameters"][i]["name"]) {
                // 能调用
                const nodeId = parseInt(task["inputParameters"][i]["nodeId"]);
                const node = task["graph"][nodeId];
                if (node["option"] === 1) {
                  node["parameters"]["links"] = value;
                } else if (node["option"] === 4) {
                  node["parameters"]["value"] = value;
                } else if (
                  node["option"] === 8 &&
                  node["parameters"]["loopType"] === 0
                ) {
                  node["parameters"]["exitCount"] = parseInt(value);
                } else if (node["option"] === 8) {
                  node["parameters"]["textList"] = value;
                }
                break;
              }
            }
          }
          let file_names = [];
          fs.readdirSync(path.join(getDir(), "execution_instances")).forEach(
            (file) => {
              try {
                if (file.split(".")[1] == "json") {
                  file_names.push(parseInt(file.split(".")[0]));
                }
                console.log(file);
              } catch (error) {
                console.error(error);
              }
            }
          );
          let eid = 0;
          if (file_names.length != 0) {
            eid = Math.max(...file_names) + 1;
          }
          if (body["EID"] != "" && body["EID"] != undefined) {
            //覆盖原有的执行实例
            eid = parseInt(body["EID"]);
          }
          task["id"] = eid;
          task = JSON.stringify(task);
          fs.writeFile(
            path.join(getDir(), `execution_instances/${eid}.json`),
            task,
            (err) => {}
          );
          console.log(`Task ${id} has been generated to file ${path.join(getDir(), `execution_instances/${eid}.json`)}`);
          // res.writeHead
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.write(eid.toString(), "utf8");
          res.end();
        } else if (pathName == "/getConfig") {
          let config_file = fs.readFileSync(
            path.join(getDir(), `config.json`),
            "utf8"
          );
          config_file = JSON.parse(config_file);
          let lang = config_file["lang"];
          if(lang == undefined){
            lang = "-";
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(JSON.stringify(config_file));
          res.end();
        } else if (pathName == "/setUserDataFolder") {
          let config = fs.readFileSync(
            path.join(getDir(), `config.json`),
            "utf8"
          );
          config = JSON.parse(config);
          body = querystring.parse(body);
          config["user_data_folder"] = body["user_data_folder"];
          config = JSON.stringify(config);
          fs.writeFile(path.join(getDir(), `config.json`), config, (err) => {});
          writeSuccess(res, {}, "User data folder has been set successfully.");
        } else if (pathName == "/executeTask") {
          body = querystring.parse(body);
          if (body === undefined || body.id === undefined || body.id == "") {
            writeError(res, 400, "Execution instance ID is required.");
            return;
          }
          let timeout = 10;
          if (body.timeout !== undefined && body.timeout != "") {
            try{
              timeout = parseInt(body.timeout);
            } catch (error) {
              writeError(res, 400, "Timeout must be a number.");
              return;
            }
          }
          // 1. Find executable path
          let platform_dir = "";
          let executable_name = "easyspider_executestage";

          if (process.platform === "win32" && process.arch === "x64") {
              platform_dir = "chrome_win64";
              executable_name += ".exe";
          } else if (process.platform === "win32" && process.arch === "ia32") {
              platform_dir = "chrome_win32";
              executable_name += ".exe";
          } else if (process.platform === "linux") {
              platform_dir = "chrome_linux64";
          } else if (process.platform === "darwin") {
              writeError(res, 400, "Executing from remote control is not supported on macOS.");
              return;
          }

          const dev_executable_path = path.join(__dirname, platform_dir, executable_name);
          const packaged_executable_path = path.join(getEasySpiderLocation(), 'resources', 'app', platform_dir, executable_name);
          let executable_path = "";

          if (fs.existsSync(dev_executable_path)) {
              executable_path = dev_executable_path;
              console.log("Using development executable path:", executable_path);
          } else if (fs.existsSync(packaged_executable_path)) {
              executable_path = packaged_executable_path;
          }

          if (executable_path === "") {
              writeError(res, 500, "Could not find the executable for this platform.");
              return;
          }

          if (body.use_user_data == "true" || body.use_user_data == "1") {
            body.use_user_data = 1;
          } else {
            body.use_user_data = 0;
          }
          try{
            body.id = JSON.parse(body.id);
          } catch (error) {
            writeError(res, 400, "Fail to parse execution instance ID from json string.");
          }
          if (Array.isArray(body.id)) {
            console.log("Multiple execution instances detected.");
            let not_found = [];
            for (let i = 0; i < body.id.length; i++) {
              try{
                // 尝试读取一次任务文件
                let eid = parseInt(body.id[i]);
                let file = fs.readFileSync(
                  path.join(getDir(), `execution_instances/${eid}.json`),
                  "utf8"
                );
                let task = JSON.parse(file);
                // 忽略逻辑删除的任务
                if (task == undefined || task.id == -2) {
                  console.log(`${eid} not found.`)
                  not_found.push(eid);
                }
              } catch (error) {
                not_found.push(body.id[i]);
              }
            }
            if (not_found.length > 0) {
              writeError(res, 404, `Cannot find execution instances based on specified execution IDs: ${not_found.join(", ")}`);
              return;
            }
            for (let i = 0; i < body.id.length; i++) {
              if (child_processes[body.id[i]] != null) {
                writeError(res, 400, `Execution instance ${body.id[i]} is already running. If you want to run it again, please stop the current execution instance first.`);
                return;
              }
            }
          } else {
            try{
              // 尝试读取一次任务文件
              let eid = parseInt(body.id);
              let file = fs.readFileSync(
                path.join(getDir(), `execution_instances/${eid}.json`),
                "utf8"
              );
              let task = JSON.parse(file);
              // 忽略逻辑删除的任务
              if (task == undefined || task.id == -2) {
                writeError(res, 404, "Cannot find execution instance based on specified execution ID.");
                return;
              }
            } catch (error) {
              writeError(res, 404, "Cannot find execution instance based on specified execution ID.");
              return;
            }
            if (child_processes[body.id] != null) {
              writeError(res, 400, `Execution instance ${body.id} is already running. If you want to run it again, please stop the current execution instance first.`);
              return;
            }
          }
          let config;
          try{
            config = fs.readFileSync(
              path.join(getDir(), `config.json`),
              "utf8"
            );
            config = JSON.parse(config);
          } catch (error) {
            writeError(res, 500, "Fail to parse config.json.");
            return;
          }
          let ids_string;
          if (Array.isArray(body.id)) {
            // 多个执行实例
            ids_string = body.id.join(",");
            for (let i = 0; i < body.id.length; i++) {
              child_logs[body.id[i]] = ""; // 初始化日志
            }
          } else {
            ids_string = body.id;
            child_logs[body.id] = ""; // 初始化日志
          }
          console.log(`Executing task with IDs: ${ids_string}`);
          let spawn = require("child_process").spawn;
          let server_address = `${config.webserver_address}:${config.webserver_port}`;
          let secret_key = generateUuid(); // 生成一个随机的密钥
          let parameters = [
              "--ids",
              "[" + ids_string + "]",
              "--server_address",
              server_address,
              "--user_data",
              body.use_user_data.toString(),
              "--remote_control",
              "1",
              "--remote_control_key",
              secret_key,
          ];
          const child_process = spawn(
            executable_path,
            parameters,
           { detached: false, env: { ...process.env, 'PYTHONUNBUFFERED': '1', 'PYTHONUTF8': '1'} } // 设置环境变量，强制 utf-8 输出
          );
          if (!child_process.pid) {
            writeError(res, 500, "Failed to start the child process and get its PID.");
            return;
          }
          console.log(`Started child process with PID: ${child_process.pid}`);

          let ipc_port_captured = false;
          child_process.stdout.on("data", (data) => {
            const output = data.toString();
            console.log(`[PID ${child_process.pid}] stdout: ${output}`);
            if (Array.isArray(body.id)) {
              for (let i = 0; i < body.id.length; i++) {
                child_logs[body.id[i]] = (child_logs[body.id[i]] || "") + output;
              }
            } else {
              child_logs[body.id] = (child_logs[body.id] || "") + output;
            }
            
            const match = output.match(/IPC_SERVER_PORT:(\d+)/);
            if (match && match[1]) {
              const ipc_port = parseInt(match[1], 10);
              console.log(`Captured IPC port ${ipc_port} for PID ${child_process.pid}`);
              
              // 存储进程信息
              const process_info = {
                pid: child_process.pid,
                ipc_port: ipc_port,
                process: child_process,
                key: secret_key,
              };
              if (Array.isArray(body.id)) {
                for (let i = 0; i < body.id.length; i++) {
                  child_processes[body.id[i]] = process_info;
                }
              } else {
                child_processes[body.id] = process_info;
              }
              
              if (!ipc_port_captured) {
                ipc_port_captured = true;
                writeSuccess(res, {message: `Task execution started successfully for ID(s): ${ids_string}`});
              }
            }
          });

          child_process.stderr.on("data", (data) => {
            console.error(`[PID ${child_process.pid}] stderr: ${data.toString()}`);
          });
         
          child_process.on('close', (code) => {
            console.log(`Child process with PID ${child_process.pid} exited with code ${code}`);
            // 清理记录
            for (const id in child_processes) {
              if (child_processes[id].pid === child_process.pid) {
                delete child_processes[id];
              }
            }
          });
          
          // 添加一个超时，以防Python脚本未能成功启动IPC服务器
          setTimeout(() => {
            if (!ipc_port_captured) {
              writeError(res, 500, "Failed to get IPC port from child process within timeout.");
              child_process.kill('SIGKILL'); // 强制杀死没有响应的进程
            }
          },  timeout * 1000); // 5秒超时
        } else if (pathName == "/stopTask") {
        body = querystring.parse(body);
          if (!body.id) {
            writeError(res, 400, "Execution instance ID is required to stop a task.");
            return;
          }

          const process_info = child_processes[body.id];
          if (!process_info || !process_info.ipc_port) {
            writeError(res, 404, `No running process found for execution instance ID: ${body.id}. It might have already finished.`);
            return;
          }

          const options = {
            hostname: '127.0.0.1',
            port: process_info.ipc_port,
            path: '/shutdown',
            method: 'GET',
            headers: {
              'Authorization': process_info.key, // 使用之前生成的密钥进行身份验证
            }
          };

          console.log(`Sending shutdown command to http://localhost:${process_info.ipc_port}/shutdown`);

          const req = http_request.request(options, (api_res) => {
            if (api_res.statusCode === 200) {
              writeSuccess(res, { message: `Shutdown command sent successfully to task ID ${body.id}.` });
            } else {
              writeError(res, 500, `IPC server responded with status: ${api_res.statusCode}`);
            }
          });

          req.on('error', (e) => {
            console.error(`Problem with request to IPC server: ${e.stack}`);
            writeError(res, 500, "Failed to send command to the task process. It might have crashed.");
          });

          req.end();

        } else if (pathName == "/getTaskLog") {
          let params = url.parse(req.url, true).query;
          if (params === undefined || params.id === undefined || params.id == "") {
            writeError(res, 400, "Execution instance ID is required.");
            return;
          }
          let id = params.id;
          const process_info = child_processes[id];
          if (process_info && process_info.ipc_port) {
            // 进程正在运行，直接读取日志
            writeSuccess(res, { log: child_logs[id] || "" });
            return;
          }
          // 进程没有运行，则读取日志文件
          // 列出 Data/Task_${id} 目录下的所有文件
          let logFileFolder = path.join(getDir(), `Data/Task_${id}`);
          // 列出目录下的所有文件，返回名称为 *.log 的文件
          let logFilePath = "";
          let logFileName = "";
          fs.readdir(logFileFolder, (err, files) => {
            if (err) {
              console.error(err);
              writeError(res, 400, "Log file does not exist.");
              return;
            }
            // 查找以 .log 结尾的文件
            files.forEach((file) => {
              if (file.endsWith(".log")) {
                let p = path.join(logFileFolder, file);
                if (file > logFileName) {
                  // 取最新的日志文件
                  logFilePath = p;
                  logFileName = file;
                }
              }
            });
            if (logFilePath === "") {
              writeError(res, 404, "Log file not found.");
              return;
            }
            fs.readFile(logFilePath, "utf8", (err, data) => {
              if (err) {
                console.error(err);
                writeError(res, 500, "Failed to read log file.");
                return;
              }
              // 缓存日志
              writeSuccess(res, { log: data });
            });
          })
        } else if (pathName == "/getTaskStatus"){
          let params = url.parse(req.url, true).query;
          if (params === undefined || params.id === undefined || params.id == "") {
            writeError(res, 400, "Execution instance ID is required.");
            return;
          }
          let id = params.id;
          const process_info = child_processes[id];
          if (process_info && process_info.ipc_port) {
            // 进程正在运行，直接读取日志
            writeSuccess(res, { running: true });
          } else {
            writeSuccess(res, { running: false })
          }
        }
      }, res));
    })
    .listen(port);
  console.log("Server has started.");
};
