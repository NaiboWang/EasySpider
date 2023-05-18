const https = require('https');
const fs = require("fs");
const path = require("path");

// 设置GitHub用户名和仓库名
const owner = 'NaiboWang';
const repo = 'EasySpider';
let config = fs.readFileSync(path.join(__dirname, `package.json`), 'utf8');
config = JSON.parse(config);
const version = config.version;
console.log(`Current version is ${version}`);

// 发送GET请求获取GitHub的Release API响应
https.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: {
        'User-Agent': 'Node.js'
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        // 解析响应JSON并输出最新版本号
        const release = JSON.parse(data);
        const latestVersion = release.tag_name.replace('v', '');
        console.log(`Latest version is ${latestVersion}`);
        if(version !== latestVersion) {
            console.log('There is a new version of EasySpider, you can download it from github repo: https://github.com/NaiboWang/EasySpider/releases');
        }
    });
}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});