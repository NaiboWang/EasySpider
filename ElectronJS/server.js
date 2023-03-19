const http = require('http');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');
const path=require('path');
function travel(dir,callback){
    fs.readdirSync(dir).forEach((file)=>{
        const pathname=path.join(dir,file)
        if(fs.statSync(pathname).isDirectory()){
            travel(pathname,callback)
        }else{
            callback(pathname)
        }
    })
}

exports.start = function(port = 8074) {
    http.createServer(function(req, res) {
        let body = "";
        res.setHeader("Access-Control-Allow-Origin", "*"); // 设置可访问的源
        res.writeHead(200, { 'Content-Type': 'application/json' });
        req.on('data', function(chunk) {
            body += chunk;
        });
        req.on('end', function() {
            // 解析参数
            const pathName = url.parse(req.url).pathname;
            // 设置响应头部信息及编码
            if (pathName == "/queryTasks") { //查询所有服务信息，只包括id和服务名称
                output = [];
                travel(path.join(__dirname, "tasks"),function(pathname){
                    const data = fs.readFileSync(pathname, 'utf8');
                    // parse JSON string to JSON object
                    const task = JSON.parse(data);
                    let item = {
                        "id": task.id,
                        "name": task.name,
                        "url": task.url,
                    }
                    if(item.id!= -2) {
                        output.push(item);
                    }
                });
                res.write(JSON.stringify(output));
                res.end();
            } else if (pathName == "/queryExecutionInstances") { //查询所有服务信息，只包括id和服务名称
                output = [];
                travel(path.join(__dirname, "execution_instances"),function(pathname){
                    const data = fs.readFileSync(pathname, 'utf8');
                    // parse JSON string to JSON object
                    const task = JSON.parse(data);
                    let item = {
                        "id": task.id,
                        "name": task.name,
                        "url": task.url,
                    }
                    if(item.id!= -2) {
                        output.push(item);
                    }
                });
                res.write(JSON.stringify(output));
                res.end();
            } else if (pathName == "/queryTask") {
                var params = url.parse(req.url, true).query;
                try {
                    var tid = parseInt(params.id);
                    const data = fs.readFileSync(path.join(__dirname, `tasks/${tid}.json`), 'utf8');
                    // parse JSON string to JSON object
                    res.write(data);
                    res.end();
                } catch (error) {
                    res.write(JSON.stringify({ "error": "Cannot find task based on specified task ID." }));
                    res.end();
                }
            } else if (pathName == "/queryExecutionInstance") {
                var params = url.parse(req.url, true).query;
                try {
                    var tid = parseInt(params.id);
                    const data = fs.readFileSync(path.join(__dirname, `execution_instances/${tid}.json`), 'utf8');
                    // parse JSON string to JSON object
                    res.write(data);
                    res.end();
                } catch (error) {
                    res.write(JSON.stringify({ "error": "Cannot find execution instance based on specified execution ID." }));
                    res.end();
                }
            } else if(pathName == "/"){
                res.write("Hello World!", 'utf8');
                res.end();
            } else if(pathName == "/deleteTask"){
                var params = url.parse(req.url, true).query;
                try {
                    let tid = parseInt(params.id);
                    let data = fs.readFileSync(path.join(__dirname, `tasks/${tid}.json`), 'utf8');
                    data = JSON.parse(data);
                    data.id = -2;
                    data = JSON.stringify(data);
                    // write JSON string to a file
                    fs.writeFile(path.join(__dirname, `tasks/${tid}.json`), data, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                    res.write(JSON.stringify({ "success": "Task has been deleted successfully." }));
                    res.end();
                } catch (error) {
                    res.write(JSON.stringify({ "error": "Cannot find task based on specified task ID." }));
                    res.end();
                }
            } else if(pathName == "/manageTask"){
                body = querystring.parse(body);
                data = JSON.parse(body.paras);
                let id = data["id"];
                if (data["id"] == -1) {
                    file_names = [];
                    fs.readdirSync(path.join(__dirname, "tasks")).forEach((file)=>{
                        try{
                            file_names.push(parseInt(file.split(".")[0]));
                        } catch (error) {

                        }
                    })
                    if(file_names.length == 0){
                        id = 0;
                    } else {
                        id = Math.max(...file_names) + 1;
                    }
                    data["id"] = id;
                    // write JSON string to a fil
                }
                data = JSON.stringify(data);
                // write JSON string to a file
                fs.writeFile(path.join(__dirname, `tasks/${id}.json`), data, (err) => {});
                res.write(id.toString(), 'utf8');
                res.end();
            } else if(pathName == "/invokeTask"){
                body = querystring.parse(body);
                let data = JSON.parse(body.paras);
                let id = body.id;
                let task = fs.readFileSync(path.join(__dirname, `tasks/${id}.json`), 'utf8');
                task = JSON.parse(task);
                try{
                    task["links"] = data["urlList_0"];
                }catch(error){
                    console.log(error);
                }
                for (const [key, value] of Object.entries(data)) {
                    for (let i = 0; i < task["inputParameters"].length; i++) {
                        if (key === task["inputParameters"][i]["name"]) {  // 能调用
                            const nodeId = parseInt(task["inputParameters"][i]["nodeId"]);
                            const node = task["graph"][nodeId];
                            if (node["option"] === 1) {
                                node["parameters"]["links"] = value;
                            } else if (node["option"] === 4) {
                                node["parameters"]["value"] = value;
                            } else if (node["option"] === 8 && node["parameters"]["loopType"] === 0) {
                                node["parameters"]["exitCount"] = parseInt(value);
                            } else if (node["option"] === 8) {
                                node["parameters"]["textList"] = value;
                            }
                            break;
                        }
                    }
                }
                let file_names = [];
                fs.readdirSync(path.join(__dirname, "execution_instances")).forEach((file)=>{
                    try{
                        file_names.push(parseInt(file.split(".")[0]));
                    } catch (error) {

                    }
                })
                let eid = 0;
                if (file_names.length != 0) {
                    eid = Math.max(...file_names) + 1;
                }
                task["id"] = eid;
                task = JSON.stringify(task);
                fs.writeFile(path.join(__dirname, `execution_instances/${eid}.json`), task, (err) => {});
                res.write(eid.toString(), 'utf8');
                res.end();
            }
        });
    }).listen(port);
    console.log("Server has started.");
}
