import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from 'child_process';
import {remove} from "fs-extra";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config = fs.readFileSync(path.join(__dirname, `src/content-scripts/config.json`), 'utf8');
config = JSON.parse(config);

// 生成英文插件
try{
    removeDir(path.join(__dirname, `EasySpider_en`));
} catch (e) {

}

config.language = "en";
let data = JSON.stringify(config);
// write JSON string to a file
fs.writeFileSync(path.join(__dirname, `src/content-scripts/config.json`), data, (err) => {
    if (err) {
        throw err;
    }
});
execSync(`npm run build`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
fs.renameSync(path.join(__dirname, `dist/`), path.join(__dirname, `EasySpider_en`));
execSync(`npm run crx EasySpider_en`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
fs.copyFileSync(path.join(__dirname, './EasySpider_en.crx'), path.join(__dirname, '../../ElectronJS/EasySpider_en.crx'));
copyFolderSync(path.join(__dirname, './EasySpider_en'), path.join(__dirname, '../../ElectronJS/EasySpider_en'));
// 生成中文插件
try{
    removeDir(path.join(__dirname, `EasySpider_zh`));
} catch (e) {

}

config.language = "zh";
data = JSON.stringify(config);
// write JSON string to a file
fs.writeFileSync(path.join(__dirname, `src/content-scripts/config.json`), data, (err) => {
    if (err) {
        throw err;
    }
});
execSync(`npm run build`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
fs.renameSync(path.join(__dirname, `dist/`), path.join(__dirname, `EasySpider_zh`));
execSync(`npm run crx EasySpider_zh`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
fs.copyFileSync(path.join(__dirname, './EasySpider_zh.crx'), path.join(__dirname, '../../ElectronJS/EasySpider_zh.crx'));
copyFolderSync(path.join(__dirname, './EasySpider_zh'), path.join(__dirname, '../../ElectronJS/EasySpider_zh'));

function removeDir(dir) {
    let files = fs.readdirSync(dir)
    for(var i=0;i<files.length;i++){
        let newPath = path.join(dir,files[i]);
        let stat = fs.statSync(newPath)
        if(stat.isDirectory()){
            //如果是文件夹就递归下去
            removeDir(newPath);
        }else {
            //删除文件
            fs.unlinkSync(newPath);
        }
    }
    fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}

function copyFolderSync(source, target) {
    try {
        // 如果目标文件夹已存在，则先删除
        if (fs.existsSync(target)) {
            fs.removeSync(target);
        }

        // 复制文件夹
        fs.copySync(source, target);
        console.log('文件夹复制完成！');
    } catch (err) {
        console.error('复制文件夹时出错:', err);
    }
}