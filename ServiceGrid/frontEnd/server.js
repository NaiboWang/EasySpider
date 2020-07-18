var http = require('http');
var querystring = require('querystring');
var url = require('url');
var urls = "mongodb://localhost:27017/service";
var MongoClient = require('mongodb').MongoClient;

http.createServer(function(req, res) {
    var body = "";
    res.setHeader("Access-Control-Allow-Origin", "*"); // 设置可访问的源
    res.writeHead(200, { 'Content-Type': 'application/json' });
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        // 解析参数
        var pathName = url.parse(req.url).pathname;
        // 设置响应头部信息及编码
        if (pathName == "/manageService") {
            body = querystring.parse(body);
            data = JSON.parse(body.paras);
            if (data["id"] == -1) {
                MongoClient.connect(urls, { useNewUrlParser: true }, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("service");
                    dbo.collection("services").find().count().then(function(count) {
                        data["id"] = count;
                        dbo.collection("services").insertOne(data, function(err, res) {
                            if (err) throw err;
                            console.log("文档插入成功");
                            db.close();
                        });
                    });
                });
            } else {
                MongoClient.connect(urls, { useNewUrlParser: true }, function(err, db) {
                    var dbo = db.db("service");
                    dbo.collection("services").deleteOne({ "id": parseInt(data["id"]) }, function(err, res) {
                        if (err) throw err;
                        console.log("文档删除成功");
                        dbo.collection("services").insertOne(data, function(err, res) {
                            if (err) throw err;
                            console.log("文档插入成功");
                            db.close();
                        });
                    });
                });
            }
            res.end();
        } else if (pathName == "/queryServices") { //查询所有服务信息，只包括id和服务名称
            MongoClient.connect(urls, { useNewUrlParser: true }, function(err, db) {
                var dbo = db.db("service");
                let t = dbo.collection("services").find({}).project({ name: 1, id: 1, url: 1, "_id": 0 }).toArray(function(e, c) {
                    res.write(JSON.stringify(c));
                    res.end();
                });
            });
        } else if (pathName == "/queryService") { //查询所有服务信息，只包括id和服务名称
            var params = url.parse(req.url, true).query;
            var tid = parseInt(params.id);
            MongoClient.connect(urls, { useNewUrlParser: true }, function(err, db) {
                var dbo = db.db("service");
                let t = dbo.collection("services").find({ "id": tid }).toArray(function(e, c) {
                    res.write(JSON.stringify(c));
                    res.end();
                });
            });
        } else if (pathName == "/Start") {

        }

    });
}).listen(8888);