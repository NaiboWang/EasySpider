function bzreadXPath(element) {
    if (element.id !== "") {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
        return '//*[@id=\"' + element.id + '\"]';
    }
    //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
    if (element == document.body) {//递归到body处，结束递归
        return '/html/' + element.tagName.toLowerCase();
    }
    var ix = 1,//在nodelist中的位置，且每次点击初始化
        siblings = element.parentNode.childNodes;//同级的子元素

    for (var i = 0, l = siblings.length; i < l; i++) {
        var sibling = siblings[i];
        //如果这个元素是siblings数组中的元素，则执行递归操作
        if (sibling == element) {
            return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
            //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
        } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
            ix++;
        }
    }
};
console.log("sdf");
//创造div作为选中元素后的样式存在
var bzdiv = document.createElement('div');
bzdiv.style.zIndex=-2147483647;
bzdiv.style.position = "fixed";
bzdiv.style.boxSizing = "border-box";
bzdiv.style.border = "dotted";


//右键菜单屏蔽
document.oncontextmenu = () => false;
var nodeList = [];
NowNode = null;
var xnode = null;
var style = ""; //记录上个元素的颜色
document.addEventListener("mousemove", function () {
    oe = document.elementFromPoint(event.x, event.y);
    NowNode = oe;
    te = 0;
    exist = 0;
    for (o of nodeList) {
        if (o["node"] == oe) {
            exist = 1;
            break;
        }
    }
    // console.log(oe);
    if (xnode == null) {
        xnode = oe;
    }
    if (xnode != oe) {
        xnode.style.backgroundColor = style; //上个元素改回原来元素的背景颜色
        style = oe.style.backgroundColor;
        // oe.addEventListener("mousedown",addEl());
        // xnode.removeEventListener("mousedown",addEl());
        console.log(oe);
        if (exist == 1) {
            console.log("exist");
        }
        else {

            oe.style.backgroundColor = 'rgba(221,221,255,0.8)'; //设置新元素的背景元素
        }
        xnode = oe;
        bzdiv.style.display = "none";
    }
});

//点击没反应时候的替代方案
document.onkeydown = function (event) {
    console.log("keydown");
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 118) { // 按 F7
        bzaddEl();
    }
    else if (e && e.keyCode == 119) {//按F8
        bzclear();
    }
    else if (e && e.keyCode == 120) {//按F9
        NowNode.click();
        console.log("click",NowNode);
    }
};

//选中元素到列表中
function bzaddEl() {
    exist = 0;
    for (o of nodeList) {
        if (o["node"] == oe) {
            exist = 1;
            break;
        }
    }
    //元素没有被添加过才去添加
    if (exist == 0) {
        nodeList.push({ node: NowNode, bgcolor: style, xpath: bzreadXPath(NowNode) });
        NowNode.style.backgroundColor = "rgba(0,191,255,0.5)";
        style = "rgba(0,191,255,0.5)";
        //将虚线框显示在元素上方但屏蔽其鼠标操作
        var pos = NowNode.getBoundingClientRect();
        bzdiv.style.display="block";
        bzdiv.style.height = NowNode.offsetHeight + "px";
        bzdiv.style.width = NowNode.offsetWidth+ "px";
        bzdiv.style.left = pos.left+ "px";
        bzdiv.style.top = pos.top+ "px";
        bzdiv.style.zIndex=2147483647;
        bzdiv.style.pointerEvents = "none";
    }
    console.log(nodeList);
    //对于可点击元素，屏蔽a标签默认点击事件
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
}
document.addEventListener("mousedown", bzaddEl);

//清除选择项
function bzclear() {
    //如果最后停留的元素被选中，则调整此元素的style为原始style，否则不进行调整
    for (node of nodeList) {
        node["node"].style.backgroundColor = node["bgcolor"];
        if (NowNode == node["node"]) {
            style = node["bgcolor"];
        }
    }
    nodeList.splice(0, nodeList.length); //清空数组
}
bztimer = setInterval(function() {
    if(document.body != null)
    {
        clearInterval(bztimer);
        document.body.append(bzdiv);
    }
}, 100);
