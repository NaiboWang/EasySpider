const path = require("path");
const task_server = require(path.join(__dirname, "server.js"));
task_server.start(8074); //start local server