//表现层的处理

if (window.location.href.indexOf("backEndAddressServiceWrapper") >= 0) {
    throw "serviceGrid"; //如果是服务器网页页面，则不执行工具
}

//返回element相对node节点的xpath，默认的node节点是: /
function readXPath(element, type = 1, node = document.body) {
    try {
        if (type == 0) //type=0代表默认可通过id生成xpath  type=1代表只能从根节点生成xpath
        {
            if (element.id !== "") { //判断id属性，如果这个元素有id，则显示//*[@id="xPath"]  形式内容
                return '//*[@id=\"' + element.id + '\"]';
            }
        }
        //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
        if (element == node) { //递归到body处，结束递归
            if (node == document.body) {
                return '/html/' + element.tagName.toLowerCase();
            } else {
                return "";
            }
        }
        var ix = 1, //在nodelist中的位置，且每次点击初始化
        siblings = element.parentNode.childNodes; //同级的子元素

        for (var i = 0, l = siblings.length; i < l; i++) {
            var sibling = siblings[i];
            //如果这个元素是siblings数组中的元素，则执行递归操作;arguments.callee代表当前函数的名称
            if (sibling == element) {
                return readXPath(element.parentNode, type, node) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
                //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
            } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) { 
                //注意此处，为了防止多计算了插入的操作台的3个div元素导致定位错误，这里需要屏蔽掉三个元素的索引号
                if(sibling.id != "wrapperDiv" && sibling.id != "wrapperTdiv" &&sibling.id != "wrapperToolkit"){
                    ix++;
                }
            }
        }
    } catch {
        return "/"
    }
};

//创造div作为选中元素后的样式存在
var div = document.createElement('div');
div.style.zIndex = -2147483647;
div.setAttribute("id", "wrapperDiv");
div.style.position = "fixed";
div.style.boxSizing = "border-box";
div.style.border = "dotted";

var tdiv = document.createElement('div');
tdiv.style.zIndex = 2147483647;
tdiv.style.position = "fixed";
tdiv.setAttribute("id", "wrapperTdiv");
tdiv.classList = "tdiv";
tdiv.style.top = "0px";
tdiv.style.width = "3000px";
tdiv.style.height = "3000px";
tdiv.style.pointerEvents = "none";

var mousemovebind = false; //如果出现元素默认绑定了mousemove事件导致匹配不到元素的时候，开启第二种模式获得元素

var toolkit = document.createElement("div")
toolkit.classList = "tooltips"; //添加样式
toolkit.setAttribute("id", "wrapperToolkit");

var tooltips = false; //标记鼠标是否在提示框上

var defaultbgColor = 'rgba(221,221,255,0.8)'; //移动到元素的背景颜色
var selectedColor = "rgba(151,255,255, 0.6)"; //选中元素的背景颜色
var boxShadowColor = "blue 0px 0px 5px"; //待选元素的边框属性


//右键菜单屏蔽
document.oncontextmenu = () => false;
var nodeList = []; //已被选中的节点列表
var readyList = []; //预备选中的list
var outputParameters = []; //输出参数列表
var outputParameterNodes = []; //输出参数节点列表
NowNode = null;
var xnode = null;
var step = 0; //记录这是第几次点击操作
var style = ""; //记录上个元素的颜色
document.addEventListener("mousemove", function() {
    if (mousemovebind) {
        tdiv.style.pointerEvents = "none";
    }

    //如果鼠标在元素框内则点击和选中失效
    var x = event.clientX;
    var y = event.clientY;
    var divx1 = toolkit.offsetLeft;
    var divy1 = toolkit.offsetTop;
    var divx2 = toolkit.offsetLeft + toolkit.offsetWidth;
    var divy2 = toolkit.offsetTop + toolkit.offsetHeight;
    if (x >= divx1 && x <= divx2 && y >= divy1 && y <= divy2) {
        tooltips = true;
        return;
    }
    oe = document.elementFromPoint(event.x, event.y);
    if (oe == tdiv) {
        return;
    }
    tooltips = false;
    NowNode = oe;
    te = 0;
    exist = 0;
    exist2 = 0;
    for (o of nodeList) {
        if (o["node"] == oe) {
            exist = 1;
            break;
        }
    }
    for (o of nodeList) {
        if (o["node"] == xnode) {
            exist2 = 1;
            break;
        }
    }
    // console.log(oe);
    if (xnode == null) {
        xnode = oe;
    }
    if (xnode != oe) {
        if (exist2 == 0) { //如果上个元素不在数组里，改回上个元素的初始颜色
            try {
                xnode.style.backgroundColor = style; //上个元素改回原来元素的背景颜色
            } catch {
                xnode.style.backgroundColor = ""; //上个元素改回原来元素的背景颜色
            }
        }

        try {
            style = oe.style.backgroundColor;
        } catch {
            style = "";
        }

        if (exist == 1) {

        } else {
            try {
                oe.style.backgroundColor = defaultbgColor; //设置新元素的背景元素
            } catch {}

        }
        xnode = oe;
        div.style.display = "none";
    }
    if (mousemovebind) {
        tdiv.style.pointerEvents = "";
    }

});

//点击没反应时候的替代方案
document.onkeydown = function(event) {
    // console.log("keydown");
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 118) { // 按 F7
        addEl();
    } else if (e && e.keyCode == 119) { //按F8
        clearEl();
    } else if (e && e.keyCode == 120) { //按F9
        NowNode.focus();
        NowNode.click();
        // console.log("click",NowNode);
    } else {
        return event.keyCode;
    }
};

//选中元素到列表中
function addEl() {
    // if (tooltips) {
    //     return;
    // }
    let exist = false;
    for (o of nodeList) {
        if (o["node"] == oe) {
            exist = true;
            break;
        }
    }
    //元素没有被添加过才去添加
    if (!exist) {
        step++;
        exist = false; //判断刚加入的元素是否在readyList中，如果在，则将所有readylist中的元素全部放入list中
        for (o of readyList) {
            if (o["node"] == oe) {
                exist = true;
                break;
            }
        }
        if (exist) { //存在在readylist就全选中
            readyToList(step);
            if (app._data.selectedDescendents) {
                handleDescendents(); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
            }
        } else //不然只添加一个元素
        {
            clearReady(); //readylist清零重新算
            nodeList.push({ node: NowNode, "step": step, bgColor: style, "boxShadow": NowNode.style.boxShadow == "" || boxShadowColor ? "none" : NowNode.style.boxShadow, xpath: readXPath(NowNode, 1) });
            NowNode.style.backgroundColor = selectedColor;
        }
        handleElement(); //处理新状态

        //将虚线框显示在元素上方但屏蔽其鼠标操作
        var pos = NowNode.getBoundingClientRect();
        div.style.display = "block";
        div.style.height = NowNode.offsetHeight + "px";
        div.style.width = NowNode.offsetWidth + "px";
        div.style.left = pos.left + "px";
        div.style.top = pos.top + "px";
        div.style.zIndex = 2147483645;
        div.style.pointerEvents = "none";
    }
    // console.log("------");
    // for (i = 0; i < nodeList.length; i++) {
    //     console.log(nodeList[i]["xpath"]);
    // } 
    //对于可点击元素，屏蔽a标签默认点击事件
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
}
document.addEventListener("mousedown", addEl);
toolkit.addEventListener("mousedown", function(e) { e.stopPropagation(); }); //重新定义toolkit里的点击事件
//清除选择项
function clearEl() {
    //如果最后停留的元素被选中，则调整此元素的style为原始style，否则不进行调整
    for (node of nodeList) {
        node["node"].style.backgroundColor = node["bgColor"];
        node["node"].style.boxShadow = node["boxShadow"];
        if (NowNode == node["node"]) {
            style = node["bgColor"];
        }
    }
    step = 0;
    clearReady();
    clearParameters();
    nodeList.splice(0, nodeList.length); //清空数组
    app._data.option = 0; //选项重置
    app._data.page = 0; //恢复原始页面
}

//清除预备数组
function clearReady() {
    for (node of readyList) //节点列表状态恢复原状
    {
        node["node"].style.boxShadow = node["boxShadow"];
    }
    readyList.splice(0, readyList.length); //清空数组
}
document.body.append(div); //默认如果toolkit不存在则div和tdiv也不存在
document.body.append(tdiv);
document.body.append(toolkit);
var timer;