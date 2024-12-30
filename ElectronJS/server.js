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
      } else if (pathName.indexOf(".") < 0) {
        //如果没有后缀名, 则为后台请求
        res.writeHead(200, { "Content-Type": "application/json" });
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
      else {
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
      req.on("end", function () {
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
                url: task.url,
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
          res.write(JSON.stringify(output));
          res.end();
        } else if (pathName == "/queryOSVersion") {
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
            res.write(data);
            res.end();
          } catch (error) {
            res.write(
              JSON.stringify({
                error: "Cannot find task based on specified task ID.",
              })
            );
            res.end();
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
            res.write(data);
            res.end();
          } catch (error) {
            res.write(
              JSON.stringify({
                error:
                  "Cannot find execution instance based on specified execution ID.",
              })
            );
            res.end();
          }
        } else if (pathName == "/") {
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
            res.write(
              JSON.stringify({ success: "Task has been deleted successfully." })
            );
            res.end();
          } catch (error) {
            res.write(
              JSON.stringify({
                error: "Cannot find task based on specified task ID.",
              })
            );
            res.end();
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

          res.write(id.toString(), "utf8");
          res.end();
        } else if (pathName == "/invokeTask") {
          body = querystring.parse(body);
          let data = JSON.parse(body.params);
          let id = body.id;
          let task = fs.readFileSync(
            path.join(getDir(), `tasks/${id}.json`),
            "utf8"
          );
          task = JSON.parse(task);
          try {
            task["links"] = data["urlList_0"];
            if (task["links"] == undefined) {
              task["links"] = "about:blank";
            }
          } catch (error) {
            task["links"] = "about:blank";
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
              } catch (error) {}
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
          res.write(
            JSON.stringify({
              success: "User data folder has been set successfully.",
            })
          );
          res.end();
        }
      });
    })
    .listen(port);
  console.log("Server has started.");
};
