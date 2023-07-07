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

function getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    let r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return ""; //返回参数值,默认后台地址
}

Vue.filter('lang', function (value) {
    if (getUrlParam("lang") == "zh") {
        return value.split("~")[1];
    } else {
        return value.split("~")[0];
    }
})

function isValidMySQLTableName(tableName) {
    // 正则表达式：以字母或汉字开头，后接字母、数字、下划线或汉字的字符串，长度为1到64字符
    const pattern = /^[\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z0-9_]{0,63}$/;
    return pattern.test(tableName);
}

