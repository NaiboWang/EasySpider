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
          if (process.platform == "darwin") {
            writeError(res, 400, "Executing from remote control is not supported on macOS.");
            return;
          }
          let params = url.parse(req.url, true).query;
          if (params === undefined || params.id === undefined || params.id == "") {
            writeError(res, 400, "Execution instance ID is required.");
            return;
          }
          if (params.use_user_data == "true" || params.use_user_data == "1") {
            params.use_user_data = 1;
          } else {
            params.use_user_data = 0;
          }
          try{
            // 尝试读取一次任务文件
            let eid = parseInt(params.id);
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
          ws.send(JSON.stringify(
            {
              type: 5, //消息类型，调用执行程序
              message: {
                id: parseInt(params.id),
                user_data_folder: params.use_user_data ? config.user_data_folder : "",
                mysql_config_path: config.mysql_config_path,
                execute_type: 1
              }
            }
          ))
          writeSuccess(res, {id: parseInt(params.id)}, "Execution instance has been invoked successfully.");
        }
      }, res));
    })
    .listen(port);
  console.log("Server has started.");
};


let ws = new WebSocket("ws://localhost:8084");
ws.onopen = function () {
    // Web Socket 已连接上，使用 send() 方法发送数据
    console.log("backend websocket 已连接");
    message = {
        type: 0, //消息类型，0代表链接操作
        message: {
            id: 4, //socket id
        }
    };
    this.send(JSON.stringify(message));
};
ws.onclose = function () {
    // 关闭 websocket
    console.log("连接已关闭...");
};