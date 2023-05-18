function getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    let r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return ""; //返回参数值,默认后台地址
}

function getOperatingSystemInfo() {
    let platform = navigator.platform;
    let osVersion = "";
    let osBit = "";
    let agent = navigator.userAgent.toLowerCase();
    if (platform.startsWith("Win")) {
        osVersion = "win";
        if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
            osBit = 32;
        }
        if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
            osBit = 64;
        }
    } else if (platform.startsWith("Mac")) {
            osVersion = "macOS";
            osBit = 64;
    } else if (platform.startsWith("Linux")) {
        osVersion = "linux";
        osBit = 64;
    }
    return {
        version: osVersion,
        bit: osBit
    };
}

Vue.filter('lang', function (value) {
    if (getUrlParam("lang") == "zh") {
        return value.split("~")[1];
    } else {
        return value.split("~")[0];
    }
})