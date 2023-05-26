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