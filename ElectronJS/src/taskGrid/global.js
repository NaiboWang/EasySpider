// function isExtract() { //检测当前锚点之前的元素是否为提取数据字段
//     if (app.$data.nowArrow["position"] == -1) {
//         return false;
//     } else if (nodeList[nodeList[app.$data.nowArrow["pId"]].sequence[app.$data.nowArrow["position"]]]["option"] == 3) {
//         return true;
//     } else {
//         return false;
//     }
// }

function DateFormat(datetime) {
    let date = new Date(datetime);

// Format the date and time
    let formatted = date.getFullYear() +
        '-' + String(date.getMonth() + 1).padStart(2, '0') +
        '-' + String(date.getDate()).padStart(2, '0') +
        ' ' + String(date.getHours()).padStart(2, '0') +
        ':' + String(date.getMinutes()).padStart(2, '0') +
        ':' + String(date.getSeconds()).padStart(2, '0');
    return formatted;
}

function formatDateTime(date) {
    const addZero = (num) => (num < 10 ? `0${num}` : num);

    let year = date.getFullYear();
    let month = addZero(date.getMonth() + 1); // getMonth() 返回值范围是0-11，所以加1
    let day = addZero(date.getDate());
    let hours = addZero(date.getHours());
    let minutes = addZero(date.getMinutes());
    let seconds = addZero(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    let r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return ""; //返回参数值,默认后台地址
}

// 判断字符串中英文字符的个数哪个多
function detectLang(str) {
    let enCount = 0;
    let cnCount = 0;

    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if ((charCode >= 0x0000) && (charCode <= 0x007F)) {
            enCount += 1;
        } else if ((charCode >= 0x4E00) && (charCode <= 0x9FA5)) {
            cnCount += 1;
        }
    }

    if (enCount === cnCount) {
        return 2;
    } else if (cnCount >= 3) {
        return 1;
    }
    return 0;
}

Vue.filter('lang', function (value) {
    let value1 = value.split("~")[0];
    let value2 = value.split("~")[1];
    let value_zh = "";
    let value_en = "";
    if (detectLang(value1) == 1) {
        value_zh = value1;
        value_en = value2;
    } else {
        value_zh = value2;
        value_en = value1;
    }
    if (getUrlParam("lang") == "zh") {
        return value_zh;
    } else {
        return value_en;
    }
})

function LANG(zh, en) {
    if (window.location.href.indexOf("_CN") != -1) {
        return zh;
    } else {
        return en;
    }
}

function isValidMySQLTableName(tableName) {
    // 使用安全工具类进行验证
    if (typeof SecurityUtils !== 'undefined') {
        return SecurityUtils.validateMySQLTableName(tableName);
    }
    
    // 后备验证逻辑
    if (!tableName || typeof tableName !== 'string') {
        return false;
    }
    
    // 正则表达式：以字母或汉字开头，后接字母、数字、下划线或汉字的字符串，长度为1到64字符
    const pattern = /^[\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z0-9_]{0,63}$/;
    return pattern.test(tableName);
}

document.onkeydown = function (e) {
    let t = false;
    try {
        t = nowNode;
    } catch (e) {
        console.log(e);
    }
    if (t && nowNode != null && e.keyCode == 46) {
        // if (confirm("确定要删除元素吗？")) {
        deleteElement();
        // }
    } else { //ctrl+s保存服务
        let currKey = 0;
        currKey = e.keyCode || e.which || e.charCode;
        if (currKey == 83 && (e.ctrlKey || e.metaKey)) {
            $('#save').click();
            return true;
        } else if (currKey == 116) {
            location.reload();
        } else if (currKey == 123) {
            console.log("打开devtools")
            let command = new WebSocket("ws://localhost:" + getUrlParam("wsport"))
            command.onopen = function () {
                let message = {
                    type: 6, //消息类型，0代表连接操作
                };
                this.send(JSON.stringify(message));
            };
        }
    }
}
function detectOperatingSystemAndArch() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    let OS = 'Unknown';
    let architecture = 'Unknown';

    // 判断操作系统类型
    if (platform.includes('win')) {
        OS = 'Windows';
    } else if (platform.includes('mac')) {
        OS = 'MacOS';
    } else if (platform.includes('linux')) {
        OS = 'Linux';
    }

    // 判断操作系统位数
    if (userAgent.includes('wow64') || userAgent.includes('win64') || platform.includes('x86_64') || platform.includes('amd64')) {
        architecture = 'x64';
    } else {
        architecture = 'ia32';
    }

    return { OS, architecture };
}
