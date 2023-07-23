import config from './config.json';

export var global = {
    nodeList: [], //已被选中的节点列表
    readyList: [], //预备选中的list
    outputParameters: [], //输出参数列表
    outputParameterNodes: [], //输出参数节点列表
    NowNode: null,
    xnode: null,
    step: 0, //记录这是第几次点击操作
    style: "", //记录上个元素的颜色
    oe: null, //记录上个元素
    app: null,
    div:null,
    tdiv:null,
    selectedColor: "rgba(151,255,255, 0.6)",
    defaultbgColor: 'rgba(221,221,255,0.8)',
    boxShadowColor: "blue 0px 0px 5px",
    lang: config.language,
    id: "C" + Math.floor(Math.random() * (99999999)).toString(), //处理不同标签页的handles，生成的id
    ws: null,
    iframe: false,
};

export function isInIframe() {
    try {
        return window.self !== window.parent;
    } catch (e) {
        return true;
    }
}
export function getOS () {
    if (navigator.userAgent.indexOf('Window') > 0) {
        return 'Windows'
    } else if (navigator.userAgent.indexOf('Mac') > 0) {
        return 'Mac'
    } else if (navigator.userAgent.indexOf('Linux') > 0) {
        return 'Linux'
    } else {
        return 'NULL'
    }
}

export function getElementXPaths(element, parentElement = document.body) {
    let paths = [];
    let pre_xpath = "";
    // if(global.iframe){
    //     pre_xpath = "//iframe";
    // }
    paths.push(readXPath(element,1, parentElement));
    paths.push(pre_xpath + "//" + element.tagName.toLowerCase() + "[contains(., '" + element.textContent.slice(0, 10).trim() + "')]");
    if (element.id) {
        paths.push(pre_xpath + `id("${element.id}")`);
    }
    if (element.className) {
        paths.push(pre_xpath + "//" + element.tagName + "[@class='" + element.className + "']");
    }
    if (element.name) {
        paths.push(pre_xpath + "//" + element.tagName + "[@name='" + element.name + "']");
    }
    if (element.alt) {
        paths.push(pre_xpath + "//" + element.tagName + "[@alt='" + element.alt + "']");
    }
    paths.push(getAbsoluteXPathWithReverseIndex(element));
    console.log("ALL PATHS: " + paths);
    return paths;
}

function getAbsoluteXPathWithReverseIndex(element) {
    let pre_xpath = "";
    // if(global.iframe){
    //     pre_xpath = "//iframe";
    // }
    let path = [];
    while (element && element.nodeType == Node.ELEMENT_NODE) {
        let index = 0;
        for (let sibling = element.nextSibling; sibling; sibling = sibling.nextSibling) {
            // Ignore document type declaration.
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                continue;
            if (sibling.nodeName == element.nodeName)
                ++index;
        }

        let tagName = element.nodeName.toLowerCase();
        let pathIndex = (index ? "[last()-" + index + "]" : "");
        path.unshift(tagName + pathIndex);

        element = element.parentNode;
    }
    return pre_xpath + "/" + path.join("/");
}

//返回element相对node节点的xpath，默认的node节点是: /
export function readXPath(element, type = 1, node = document.body) {
    let pre_xpath = "";
    // if(global.iframe){
    //     pre_xpath = "//iframe";
    // }
    try {
        if (type == 0) //type=0代表默认可通过id生成xpath  type=1代表只能从根节点生成xpath, nodeList里必须使用绝对xpath!
        {
            if (element.id !== "") { //判断id属性，如果这个元素有id，则显示//*[@id="xPath"]  形式内容
                return pre_xpath + '//*[@id=\"' + element.id + '\"]';
            }
            if (element.className != ""){ //如果有class且某个class name只有一个元素，则使用class name生成xpath
                console.log("class name: " + element.className);
                let names = element.className.split(" ");
                for (let i = 0; i < names.length; i++) {
                    if (names[i] != "") {
                        // return '//*[@class=\"' + names[i] + '\"]';
                        // console.log('//*[@contains(@class, \"' + names[i] + '\")]');
                        let elements_of_class = node.getElementsByClassName(names[i]);
                        // console.log("Length of elements_of_class: " + elements_of_class.length);
                        if(elements_of_class.length == 1){
                            return pre_xpath + '//*[contains(@class, \"' + names[i] + '\")]'
                        }
                    }
                }
            }
        }
        //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
        if (element == node) { //递归到body处，结束递归
            if (node == document.body) {
                return pre_xpath + '/html/' + element.tagName.toLowerCase();
            } else {
                return  "";
            }
        }
        let ix = 1, //在nodelist中的位置，且每次点击初始化
            siblings = element.parentNode.childNodes; //同级的子元素

        for (let i = 0, l = siblings.length; i < l; i++) {
            let sibling = siblings[i];
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
        return pre_xpath + "/"
    }
}

//选中元素到列表中
export function addEl() {
    // if (tooltips) {
    //     return;
    // }
    let exist = false;
    for (let o of global.nodeList) {
        if (o["node"] == global.oe) {
            exist = true;
            break;
        }
    }
    //元素没有被添加过才去添加
    if (!exist) {
        global.step++;
        exist = false; //判断刚加入的元素是否在readyList中，如果在，则将所有readylist中的元素全部放入list中
        for (let o of global.readyList) {
            if (o["node"] == global.oe) {
                exist = true;
                break;
            }
        }
        if (exist) { //存在在readylist就全选中
            readyToList(global.step, false);
            if (global.app._data.selectedDescendents) {
                handleDescendents(); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
            }
        } else //不然只添加一个元素
        {
            clearReady(); //readylist清零重新算
            global.nodeList.push({ node: global.NowNode, "step": global.step, bgColor: global.style, "boxShadow": global.NowNode.style.boxShadow == "" || global.boxShadowColor ? "none" : global.NowNode.style.boxShadow, xpath: readXPath(global.NowNode, 1), "allXPaths": getElementXPaths(global.NowNode) });
            global.NowNode.style.backgroundColor = global.selectedColor;
        }
        handleElement(); //处理新状态

        //将虚线框显示在元素上方但屏蔽其鼠标操作
        let pos = global.NowNode.getBoundingClientRect();
        global.div.style.display = "block";
        global.div.style.height = global.NowNode.offsetHeight + "px";
        global.div.style.width = global.NowNode.offsetWidth + "px";
        global.div.style.left = pos.left + "px";
        global.div.style.top = pos.top + "px";
        global.div.style.zIndex = 2147483645;
        global.div.style.pointerEvents = "none";
    }
    // console.log("------");
    // for (i = 0; i < global.nodeList.length; i++) {
    //     console.log(global.nodeList[i]["xpath"]);
    // }
    //对于可点击元素，屏蔽a标签默认点击事件
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
}

//清除选择项
export function clearEl() {
    //如果最后停留的元素被选中，则调整此元素的style为原始style，否则不进行调整
    for (let node of global.nodeList) {
        node["node"].style.backgroundColor = node["bgColor"];
        node["node"].style.boxShadow = node["boxShadow"];
        if (global.NowNode == node["node"]) {
            global.style = node["bgColor"];
        }
    }
    global.step = 0;
    clearReady();
    clearParameters();
    global.nodeList.splice(0, global.nodeList.length); //清空数组
    global.app._data.option = 0; //选项重置
    global.app._data.page = 0; //恢复原始页面
}


//清除预备数组
export function clearReady() {
    for (let node of global.readyList) //节点列表状态恢复原状
    {
        node["node"].style.boxShadow = node["boxShadow"];
    }
    global.readyList.splice(0, global.readyList.length); //清空数组
}

//每次对元素进行增删之后需要执行的操作
export function handleElement() {
    clearReady(); //预备元素每次处理都先处理掉
    if (global.nodeList.length > 1) { //选中了许多元素的情况
        global.app._data.option = relatedTest();
        if (global.app._data.option == 100) {
            generateMultiParameters();
        } else {
            generateParameters(0);
        }
    } else if (global.nodeList.length == 1) {
        findRelated(); //寻找和元素相关的元素
    }
}

export function clearParameters(deal = true) //清空参数列表
{
    if (deal) //是否取消对选中的子元素进行处理
    {
        global.app._data.selectedDescendents = false;
    }
    for (let o of global.outputParameterNodes) {
        o["node"].style.boxShadow = o["boxShadow"];
    }
    global.outputParameterNodes.splice(0);
    global.outputParameters.splice(0); //清空原来的参数列表
    global.app._data.valTable = []; //清空展现数组
    global.app._data.selectStatus = false;
}

function parameterName(value){
    if (global.lang == 'zh'){
        return value;
    } else{
        switch(value){
            case "文本": return "text";
            case "链接": return "link";
            case "_链接": return "_link";
            case "_文本": return "_text";
            case "链接文本": return "link_text";
            case "_链接文本": return "_link_text";
            case "链接地址": return "link_address";
            case "_链接地址": return "_link_address";
            case "按钮": return "button";
            case "输入文本框": return "input_text";
            case "单选框": return "radio";
            case "复选框": return "checkbox";
            case "下拉框": return "select";
            case "下拉框选项": return "select_option";
            case "地址": return "address";
            case "参数": return "para";
            case "_图片": return "_image";
            case "_图片地址": return "_image_address";
            case "背景图片地址": return "background_image_address";
            case "_背景图片": return "_background_image";
            case "页面网址": return "page_url";
            case "_页面网址": return "_page_url";
            case "页面标题": return "page_title";
            case "_页面标题": return "_page_title";
            case "选择的选项文本": return "selected_option_text";
            case "_选择的选项文本": return "_selected_option_text";
            case "选择的选项值": return "selected_option_value";
            case "_选择的选项值": return "_selected_option_value";
            default: return "";
        }
    }
}

//根据nodelist列表内的元素生成参数列表
//适合：nodelist中的元素为同类型元素
//type:0为全部文本 1为节点内直接的文字 2为innerhtml 3为outerhtml 4为backgroundImg 5为当前页面网址 6为当前页面标题 7为元素截图 8为OCR识别 9为JavaScript返回值 10为选择框选择的值 11为选择框选择的文本
//nodetype:0,对应全type0123
//nodetype:1 链接，对应type0123
//nodetype:2 链接地址 对应type0
//nodetype:3 按钮和输入文本框 对应type
//nodetype:4 按钮和输入文本框 对应type
export function generateParameters(type, linktext = true, linkhref = true) {
    clearParameters(false);
    let n = 1;
    chrome.storage.local.get('parameterNum',  function(items) {
        // let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        let ndPath = "";
        let ndAllXPaths = [];
        for (let num = 0; num < global.nodeList.length; num++) {
            let nd = global.nodeList[num]["node"];
            ndPath = global.nodeList[num]["xpath"];
            ndAllXPaths = global.nodeList[num]["allXPaths"];
            let unique_index = Math.random().toString(36).substring(2) + Date.now().toString(36);; //唯一标识符
            global.outputParameterNodes.push({ "node": nd,
                "unique_index": unique_index,
                "boxShadow": nd.style.boxShadow == "" || global.boxShadowColor ? "none" : nd.style.boxShadow });
            nd.style.boxShadow = global.boxShadowColor;
            let pname = parameterName("文本");
            let ndText = "";
            if (type == 0) {
                // ndText = $(nd).text();
                ndText = nd.textContent;
                pname = parameterName("文本");
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : nd.getAttribute("src");
                    pname = parameterName("地址");
                } else if (nd.tagName == "INPUT") {
                    ndText = nd.getAttribute("value") == null ? "" : nd.getAttribute("value");
                }
            } else if (type == 1) {
                // ndText = $(nd).contents().filter(function() { return this.nodeType === 3; }).text().replace(/\s+/g, '');
                ndText = "";
                let ndContents = nd.childNodes;
                for (let i = 0; i < ndContents.length; i++) {
                    if (ndContents[i].nodeType === 3) { // if it's a text node
                        ndText += ndContents[i].textContent.trim(); // add its content to the string
                    }
                }
                ndText = ndText.replace(/\s+/g, ''); // remove any whitespace characters
                pname = parameterName("文本");
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : nd.getAttribute("src");
                    pname = parameterName("地址");
                } else if (nd.tagName == "INPUT") {
                    ndText = nd.getAttribute("value") == null ? "" : nd.getAttribute("value");
                }
            } else if (type == 2) {
                // ndText = $(nd).html();
                ndText = nd.innerHTML;
                pname = "Innerhtml";
            } else if (type == 3) {
                // ndText = $(nd).prop("outerHTML");
                ndText = nd.outerHTML;
                pname = "outerHTML";
            } else if(type == 4){
                ndText = nd.style.backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
                pname = parameterName("背景图片地址");
            } else if(type == 5){
                ndText = window.location.href;
                pname = parameterName("页面网址");
            } else if(type == 6){
                ndText = document.title;
                pname = parameterName("页面标题");
            } else if(type == 10){
                ndText = nd.value;
                pname = parameterName("选择的选项值");
            } else if(type == 11){
                ndText = nd.options[nd.selectedIndex].text;
                pname = parameterName("选择的选项文本");
            }
            if (num == 0) { //第一个节点新建，后面的增加即可
                if (nd.tagName == "IMG") { //如果元素是图片
                    global.outputParameters.push({
                        "nodeType": 4, //节点类型
                        "contentType": type, // 内容类型
                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": parameterName("参数") + (n++) + parameterName("_图片") + pname,
                        "desc": "", //参数描述
                        "extractType": 0, //提取方式 0 普通 1 OCR
                        "relativeXPath": global.nodeList.length > 1 ? "" : ndPath,
                        "allXPaths": global.nodeList.length > 1 ? "" : ndAllXPaths,
                        "exampleValues": [{ "num": num, "value": ndText }],
                        "unique_index": unique_index,
                        "iframe": global.iframe,
                    });
                } else if (nd.tagName == "A") { //如果元素是超链接
                    if (linktext) {
                        global.outputParameters.push({
                            "nodeType": 1,
                            "contentType": type, // 内容类型
                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": parameterName("参数") + (n++) + parameterName("_链接") + pname,
                            "desc": "", //参数描述
                            "extractType": 0, //提取方式 0 普通 1 OCR
                            "relativeXPath": global.nodeList.length > 1 ? "" : ndPath,
                            "allXPaths": global.nodeList.length > 1 ? "" : ndAllXPaths,
                            "exampleValues": [{ "num": num, "value": ndText }],
                            "unique_index": unique_index,
                            "iframe": global.iframe,
                        });
                    }
                    if (linkhref) {
                        global.outputParameters.push({
                            "nodeType": 2,
                            "contentType": type, // 内容类型
                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": parameterName("参数") + (n++) + parameterName("_链接地址"),
                            "desc": "", //参数描述
                            "relativeXPath": global.nodeList.length > 1 ? "" : ndPath,
                            "allXPaths": global.nodeList.length > 1 ? "" : ndAllXPaths,
                            "exampleValues": [{ "num": num, "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href") }],
                            "unique_index": unique_index,
                            "iframe": global.iframe,
                        });
                    }
                } else if (nd.tagName == "INPUT") { //如果元素是输入项
                    global.outputParameters.push({
                        "nodeType": 3,
                        "contentType": type, // 内容类型
                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": parameterName("参数") + (n++) + "_" + pname,
                        "desc": "", //参数描述
                        "extractType": 0, //提取方式 0 普通 1 OCR
                        "relativeXPath": global.nodeList.length > 1 ? "" : ndPath,
                        "allXPaths": global.nodeList.length > 1 ? "" : ndAllXPaths,
                        "exampleValues": [{ "num": num, "value": ndText }],
                        "unique_index": unique_index,
                        "iframe": global.iframe,
                    });
                } else { //其他所有情况
                    global.outputParameters.push({
                        "nodeType": 0,
                        "contentType": type, // 内容类型
                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": parameterName("参数") + (n++) + "_" + pname,
                        "desc": "", //参数描述
                        "extractType": 0, //提取方式 0 普通 1 OCR
                        "relativeXPath": global.nodeList.length > 1 ? "" : ndPath,
                        "allXPaths": global.nodeList.length > 1 ? "" : ndAllXPaths,
                        "exampleValues": [{ "num": num, "value": ndText }],
                        "unique_index": unique_index,
                        "iframe": global.iframe,
                    });
                }
            } else { //如果元素节点已经存在，则只需要插入值就可以了
                if (nd.tagName == "IMG") { //如果元素是图片
                    global.outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                } else if (nd.tagName == "A") { //如果元素是超链接
                    global.outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                    global.outputParameters[1]["exampleValues"].push({ "num": num, "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href") });
                } else if (nd.tagName == "INPUT") { //如果元素是输入项
                    global.outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                } else { //其他所有情况
                    global.outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                }
            }
        }
        // let at2 = parseInt(new Date().getTime());
        // console.log("generateParameters:", at2, at, at2 - at);
        generateValTable();
        console.log(global.outputParameters);
    });
}

//根据nodelist列表内的元素生成参数列表
//适合：nodelist中的元素为不同类型元素
export function generateMultiParameters() {
    clearParameters(false);
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        // let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        let nd, ndText, ndPath, pname, ndAllXPaths;
        for (let num = 0; num < global.nodeList.length; num++) {
            let nd = global.nodeList[num]["node"];
            ndPath = global.nodeList[num]["xpath"];
            ndAllXPaths = global.nodeList[num]["allXPaths"];
            let unique_index = Math.random().toString(36).substring(2) + Date.now().toString(36);;
            global.outputParameterNodes.push({ "node": nd, "unique_index": unique_index, "boxShadow": nd.style.boxShadow == "" || global.boxShadowColor ? "none" : nd.style.boxShadow });
            nd.style.boxShadow = global.boxShadowColor;
            // ndText = $(nd).text();
            ndText = nd.textContent;
            if (nd.tagName == "IMG") { //如果元素是图片
                global.outputParameters.push({
                    "nodeType": 4, //节点类型
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": parameterName("参数") + (n++) + parameterName("_图片地址"),
                    "desc": "", //参数描述
                    "relativeXPath": ndPath,
                    "allXPaths": ndAllXPaths,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("src") == null ? "" : nd.getAttribute("src") }],
                    "unique_index": unique_index,
                    "iframe": global.iframe,
                });
            } else if (nd.tagName == "A") { //如果元素是超链接
                global.outputParameters.push({
                    "nodeType": 1,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": parameterName("参数") + (n++) + parameterName("_链接文本"),
                    "desc": "", //参数描述
                    "relativeXPath": ndPath,
                    "allXPaths": ndAllXPaths,
                    "exampleValues": [{ "num": 0, "value": ndText }],
                    "unique_index": unique_index,
                    "iframe": global.iframe,
                });
                global.outputParameters.push({
                    "nodeType": 2,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": parameterName("参数") + (n++) + parameterName("_链接地址"),
                    "desc": "", //参数描述
                    "relativeXPath": ndPath,
                    "allXPaths": ndAllXPaths,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href") }],
                    "unique_index": unique_index,
                    "iframe": global.iframe,
                });
            } else if (nd.tagName == "INPUT") { //如果元素是输入项
                global.outputParameters.push({
                    "nodeType": 3,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": parameterName("参数") + (n++) + parameterName("_文本"),
                    "desc": "", //参数描述
                    "relativeXPath": ndPath,
                    "allXPaths": ndAllXPaths,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value") }],
                    "unique_index": unique_index,
                    "iframe": global.iframe,
                });
            } else { //其他所有情况
                global.outputParameters.push({
                    "nodeType": 0,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": parameterName("参数") + (n++) + parameterName("_文本"),
                    "desc": "", //参数描述
                    "relativeXPath": ndPath,
                    "allXPaths": ndAllXPaths,
                    "exampleValues": [{ "num": 0, "value": ndText }],
                    "unique_index": unique_index,
                    "iframe": global.iframe,
                });
            }
        }
        // console.log(global.outputParameters);
        // let at2 = parseInt(new Date().getTime());
        // console.log("generateMultiParameters", at2, at, at2 - at);
        generateValTable(false);
    });

}

//处理子元素,对于每个块中多出的特殊元素，需要特殊处理
export function handleDescendents(mode = 0) {
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        // let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        clearParameters(); //清除原来的参数列表
        global.app._data.selectedDescendents = true;
        let nd, ndText, ndPath, pname, ndAllPaths, tmode;
        tmode = mode;
        if(mode == 2){
            let xpath_list = [];
            // mode == 1; //如果是选中全部块的共有子元素，则先选中和第一个块相同的子元素，然后最后再删除第一个块中和其他块不同的子元素
            for (let num = 0; num < global.nodeList.length; num++) {
                let node_xpaths = [];
                let tnode = global.nodeList[num]["node"];
                let stack = new Array(); //深度优先搜索遍历元素
                stack.push(tnode); //从此节点开始
                while (stack.length > 0) {
                    let nd = stack.pop(); // 挨个取出元素
                    if (nd.parentNode.tagName == "A" && nd.tagName == "SPAN") {
                        continue; //对A标签内的SPAN元素不进行处理,剪枝，此时子元素根本不加入stack，即实现了此功能
                    }
                    ndPath = readXPath(nd, 1, tnode);
                    node_xpaths.push(ndPath);
                    for (let i = nd.children.length - 1; i >= 0; i--) {
                        stack.push(nd.children[i]);
                    }
                }
                xpath_list.push(node_xpaths);
            }
            // 取第一个子数组作为初始的共有元素集合
            let commonXPaths = new Set(xpath_list[0]);
            // 遍历剩余的子数组
            for (let i = 1; i < xpath_list.length; i++) {
                // 使用过滤函数来筛选出与共有元素集合中的元素相同的元素
                commonXPaths = new Set(xpath_list[i].filter(element => commonXPaths.has(element)));
            }
            // 将共有元素集合转换为数组
            let commonXPathList = Array.from(commonXPaths);
            // console.log(commonXPathList);
            let hash = {}; //记录index和数组位置的对应关系
            for (let num = 0; num < global.nodeList.length; num++) {
                let tnode = global.nodeList[num]["node"];
                let stack = new Array(); //深度优先搜索遍历元素
                stack.push(tnode); //从此节点开始
                while (stack.length > 0) {
                    let nd = stack.pop(); // 挨个取出元素
                    if (nd.parentNode.tagName == "A" && nd.tagName == "SPAN") {
                        continue; //对A标签内的SPAN元素不进行处理,剪枝，此时子元素根本不加入stack，即实现了此功能
                    }
                    ndPath = readXPath(nd, 1, tnode);
                    ndAllPaths = getElementXPaths(nd, tnode);
                    let index = -1;
                    for (let i = 0; i < commonXPathList.length; i++) {
                        if (commonXPathList[i] == ndPath) {
                            index = i;
                            break;
                        }
                    }

                    if (index != -1) { //如果是共有元素
                        let unique_index = ndPath;
                        ndText = "";
                        let ndContents = nd.childNodes;
                        for (let i = 0; i < ndContents.length; i++) {
                            if (ndContents[i].nodeType === 3) { // if it's a text node
                                ndText += ndContents[i].textContent.trim(); // add its content to the string
                            }
                        }
                        ndText = ndText.replace(/\s+/g, ''); // remove any whitespace characters
                        if (ndText != "" || nd == tnode) {
                            global.outputParameterNodes.push({
                                "node": nd,
                                "unique_index": unique_index,
                                "boxShadow": nd.style.boxShadow == "" || global.boxShadowColor ? "none" : nd.style.boxShadow
                            });
                            nd.style.boxShadow = global.boxShadowColor;
                        }
                        // console.log("Hash", hash);
                        if (num == 0) { //从第二个节点开始，只插入那些不在参数列表中的元素，根据xpath进行寻址
                            //如果当前节点除了子元素外仍然有其他文字或者该元素是图片/表单项，加入子元素节点
                            if (ndText != "" || nd.tagName == "IMG" || nd.tagName == "INPUT" || nd.tagName == "A") {
                                    hash[index] = global.outputParameters.length;
                                    if (nd.tagName == "IMG") { //如果元素是图片
                                        global.outputParameters.push({
                                            "nodeType": 4, //节点类型
                                            "contentType": 1, // 内容类型
                                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径,注意当只选择了子元素没有选中全部的时候，需要判断
                                            "name": parameterName("参数") + (n++) + parameterName("_图片地址"),
                                            "desc": "", //参数描述
                                            "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd), //同理需要判断
                                            "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                            "exampleValues": [{
                                                "num": num,
                                                "value": nd.getAttribute("src") == null ? "" : nd.getAttribute("src")
                                            }],
                                            "unique_index": unique_index,
                                            "iframe": global.iframe,
                                        });
                                    } else if (nd.tagName == "A") { //如果元素是超链接
                                        global.outputParameters.push({
                                            "nodeType": 1,
                                            "contentType": 0, // 内容类型
                                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                            "name": parameterName("参数") + (n++) + parameterName("_链接文本"),
                                            "desc": "", //参数描述
                                            "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                            "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                            "exampleValues": [{"num": num, "value": nd.textContent}], //注意这里的ndtext是整个a的文字！！！
                                            "unique_index": unique_index,
                                            "iframe": global.iframe,
                                        });
                                        global.outputParameters.push({
                                            "nodeType": 2,
                                            "contentType": 0, // 内容类型
                                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                            "name": parameterName("参数") + (n++) + parameterName("_链接地址"),
                                            "desc": "", //参数描述
                                            "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                            "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                            "exampleValues": [{
                                                "num": num,
                                                "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href")
                                            }],
                                            "unique_index": unique_index,
                                            "iframe": global.iframe,
                                        });
                                    } else if (nd.tagName == "INPUT") { //如果元素是输入项
                                        global.outputParameters.push({
                                            "nodeType": 3,
                                            "contentType": 1, // 内容类型
                                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                            "name": parameterName("参数") + (n++) + parameterName("_文本"),
                                            "desc": "", //参数描述
                                            "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                            "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                            "exampleValues": [{
                                                "num": num,
                                                "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                                            }],
                                            "unique_index": unique_index,
                                            "iframe": global.iframe,
                                        });
                                    } else { //其他所有情况
                                        global.outputParameters.push({
                                            "nodeType": 0,
                                            "contentType": 1, // 内容类型
                                            "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                            "name": parameterName("参数") + (n++) + parameterName("_文本"),
                                            "desc": "", //参数描述
                                            "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                            "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                            "exampleValues": [{"num": num, "value": ndText}],
                                            "unique_index": unique_index,
                                            "iframe": global.iframe,
                                        });
                                    }
                                }
                        } else //如果元素节点已经存在，则只需要插入值就可以了
                        {
                            try{
                                if (ndText != "" || nd.tagName == "IMG" || nd.tagName == "INPUT" || nd.tagName == "A") {
                                    if (nd.tagName == "IMG") { //如果元素是图片
                                        global.outputParameters[hash[index]]["exampleValues"].push({
                                            "num": num,
                                            "value": nd.getAttribute("src") == null ? "" : nd.getAttribute("src")
                                        });
                                    } else if (nd.tagName == "A") { //如果元素是超链接
                                        global.outputParameters[hash[index]]["exampleValues"].push({
                                            "num": num,
                                            "value": nd.textContent
                                        });
                                        global.outputParameters[hash[index] + 1]["exampleValues"].push({
                                            "num": num,
                                            "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href")
                                        });
                                    } else if (nd.tagName == "INPUT") { //如果元素是输入项
                                        global.outputParameters[hash[index]]["exampleValues"].push({
                                            "num": num,
                                            "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                                        });
                                    } else { //其他所有情况
                                        global.outputParameters[hash[index]]["exampleValues"].push({
                                            "num": num,
                                            "value": ndText
                                        });
                                    }
                                }
                            } catch (e) {
                                console.log("Error: -----------------------\n\n", e);
                            }

                        }
                    }
                    for (let i = nd.children.length - 1; i >= 0; i--) {
                        stack.push(nd.children[i]);
                    }
                }
            }
        }
        else {
            for (let num = 0; num < global.nodeList.length; num++) {
                let tnode = global.nodeList[num]["node"];
                let stack = new Array(); //深度优先搜索遍历元素
                stack.push(tnode); //从此节点开始
                while (stack.length > 0) {
                    let nd = stack.pop(); // 挨个取出元素
                    if (nd.parentNode.tagName == "A" && nd.tagName == "SPAN") {
                        continue; //对A标签内的SPAN元素不进行处理,剪枝，此时子元素根本不加入stack，即实现了此功能
                    }
                    ndPath = readXPath(nd, 1, tnode);
                    ndAllPaths = getElementXPaths(nd, tnode);
                    let index = -1;
                    for (let i = 0; i < global.outputParameters.length; i++) {
                        if (global.outputParameters[i]["relativeXPath"] == ndPath) {
                            index = i;
                            break;
                        }
                    }
                    ndText = "";
                    let ndContents = nd.childNodes;
                    for (let i = 0; i < ndContents.length; i++) {
                        if (ndContents[i].nodeType === 3) { // if it's a text node
                            ndText += ndContents[i].textContent.trim(); // add its content to the string
                        }
                    }
                    ndText = ndText.replace(/\s+/g, ''); // remove any whitespace characters
                    let unique_index = ndPath;
                    if(ndText!= "" || nd == tnode){
                        if (mode == 0 || (mode == 1 && (index != -1 || num == 0))) { //如果不是应选尽选，则只添加和第一个元素相同类型的子元素
                            global.outputParameterNodes.push({
                                "node": nd,
                                "unique_index": unique_index,
                                "boxShadow": nd.style.boxShadow == "" || global.boxShadowColor ? "none" : nd.style.boxShadow
                            });
                            nd.style.boxShadow = global.boxShadowColor;
                        } else if(mode == 1 && nd == tnode){ //最外层元素标记一下
                            nd.style.boxShadow = global.boxShadowColor;
                        }
                    }
                    if (index == -1) { //从第二个节点开始，只插入那些不在参数列表中的元素，根据xpath进行寻址
                        //如果当前节点除了子元素外仍然有其他文字或者该元素是图片/表单项，加入子元素节点
                        if (!(mode == 1 && num > 0)) { //如果不是应选尽选，则只添加和第一个元素相同类型的子元素
                            if (ndText!= "" || nd.tagName == "IMG" || nd.tagName == "INPUT" || nd.tagName == "A") {
                                if (nd.tagName == "IMG") { //如果元素是图片
                                    global.outputParameters.push({
                                        "nodeType": 4, //节点类型
                                        "contentType": 1, // 内容类型
                                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径,注意当只选择了子元素没有选中全部的时候，需要判断
                                        "name": parameterName("参数") + (n++) + parameterName("_图片地址"),
                                        "desc": "", //参数描述
                                        "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd), //同理需要判断
                                        "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                        "exampleValues": [{
                                            "num": num,
                                            "value": nd.getAttribute("src") == null ? "" : nd.getAttribute("src")
                                        }],
                                        "unique_index": unique_index,
                                        "iframe": global.iframe,
                                    });
                                } else if (nd.tagName == "A") { //如果元素是超链接
                                    global.outputParameters.push({
                                        "nodeType": 1,
                                        "contentType": 0, // 内容类型
                                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                        "name": parameterName("参数") + (n++) + parameterName("_链接文本"),
                                        "desc": "", //参数描述
                                        "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                        "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                        "exampleValues": [{"num": num, "value": nd.textContent}], //注意这里的ndtext是整个a的文字！！！
                                        "unique_index": unique_index,
                                        "iframe": global.iframe,
                                    });
                                    global.outputParameters.push({
                                        "nodeType": 2,
                                        "contentType": 0, // 内容类型
                                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                        "name": parameterName("参数") + (n++) + parameterName("_链接地址"),
                                        "desc": "", //参数描述
                                        "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                        "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                        "exampleValues": [{
                                            "num": num,
                                            "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href")
                                        }],
                                        "unique_index": unique_index,
                                        "iframe": global.iframe,
                                    });
                                } else if (nd.tagName == "INPUT") { //如果元素是输入项
                                    global.outputParameters.push({
                                        "nodeType": 3,
                                        "contentType": 1, // 内容类型
                                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                        "name": parameterName("参数") + (n++) + parameterName("_文本"),
                                        "desc": "", //参数描述
                                        "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                        "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                        "exampleValues": [{
                                            "num": num,
                                            "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                                        }],
                                        "unique_index": unique_index,
                                        "iframe": global.iframe,
                                    });
                                } else { //其他所有情况
                                    global.outputParameters.push({
                                        "nodeType": 0,
                                        "contentType": 1, // 内容类型
                                        "relative": global.nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                        "name": parameterName("参数") + (n++) + parameterName("_文本"),
                                        "desc": "", //参数描述
                                        "relativeXPath": global.nodeList.length > 1 ? ndPath : readXPath(nd),
                                        "allXPaths": global.nodeList.length > 1 ? ndAllPaths : getElementXPaths(nd),
                                        "exampleValues": [{"num": num, "value": ndText}],
                                        "unique_index": unique_index,
                                        "iframe": global.iframe,
                                    });
                                }
                            }
                        }
                    } else //如果元素节点已经存在，则只需要插入值就可以了
                    {
                        if (nd.tagName == "IMG") { //如果元素是图片
                            global.outputParameters[index]["exampleValues"].push({
                                "num": num,
                                "value": nd.getAttribute("src") == null ? "" : nd.getAttribute("src")
                            });
                        } else if (nd.tagName == "A") { //如果元素是超链接
                            global.outputParameters[index]["exampleValues"].push({ "num": num, "value": nd.textContent });
                            global.outputParameters[index + 1]["exampleValues"].push({
                                "num": num,
                                "value": nd.getAttribute("href") == null ? "" : nd.getAttribute("href")
                            });
                        } else if (nd.tagName == "INPUT") { //如果元素是输入项
                            global.outputParameters[index]["exampleValues"].push({
                                "num": num,
                                "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                            });
                        } else { //其他所有情况
                            global.outputParameters[index]["exampleValues"].push({ "num": num, "value": ndText });
                        }
                    }
                    for (let i = nd.children.length - 1; i >= 0; i--) {
                        stack.push(nd.children[i]);
                    }
                }
            }
        }
        // let at2 = parseInt(new Date().getTime());
        // console.log("选中子元素", at2, at, at2 - at);
        generateValTable();
    });

}


//根据参数列表生成可视化参数界面
export function generateValTable(multiline = true) {
    let paraValues = [];
    for (let i = 0; i < global.outputParameters.length; i++) {
        let tValues = [];
        let tindex = 0;
        let l = multiline ? global.nodeList.length : 1;
        for (let j = 0; j < l; j++) {
            //注意第一个循环条件，index超出界限了就不需要再寻找了，其他的全是空
            if (tindex < global.outputParameters[i]["exampleValues"].length && global.outputParameters[i]["exampleValues"][tindex]["num"] == j) {
                tValues.push(global.outputParameters[i]["exampleValues"][tindex]["value"]);
                tindex++;
            } else {
                tValues.push(" ");
            }
        }
        paraValues.push(tValues);
    }
    global.app._data.valTable = paraValues;
    // console.log("生成参数表格", paraValues);
}

// 选中第一个节点，自动寻找同类节点
// 方法：/div[1]/div[2]/div[2]/a[1]
// 从倒数第一个节点开始找，看去掉方括号之后是否元素数目变多，如上面的变成/div[1]/div[2]/div[2]/a
// 如果没有，则恢复原状，然后试试倒数第二个：/div[1]/div[2]/div/a[1]
// 直到找到第一个变多的节点或者追溯到根节点为止
export function findRelated() {
    // let at = parseInt(new Date().getTime());
    let testPath = global.nodeList[0]["xpath"].replace("//iframe","").split("/").splice(1); //分离xpath成 ["html","body","div[0]"]这样子
    let nodeNameList = [];
    let nodeIndexList = [];
    for (let i = 0; i < testPath.length; i++) {
        nodeNameList.push(testPath[i].split("[")[0]);
        if (testPath[i].indexOf("[") >= 0) { //如果存在索引值
            nodeIndexList.push(parseInt(testPath[i].split("[")[1].replace("]", ""))); //只留下数字
        } else {
            nodeIndexList.push(-1);
        }
    }
    let tempPath = "";
    for (let i = nodeIndexList.length - 1; i >= 0; i--) {
        if (nodeIndexList[i] == -1) { //没有索引值直接跳过
            continue;
        }
        let tempIndexList = [...nodeIndexList]; //复刻一个index数组
        tempIndexList[i] = -1; //删除索引值
        tempPath = combineXpath(nodeNameList, tempIndexList); //生成新的xpath
        let result = document.evaluate(tempPath, document, null, XPathResult.ANY_TYPE, null);
        result.iterateNext(); //枚举第一个元素
        if (result.iterateNext() != null) { //如果能枚举到第二个元素，说明存在同类元素,选中同类元素，结束循环
            global.app.$data.nowPath = tempPath; //标记此元素xpath
            let element = document.evaluate(tempPath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
            console.log("tempPath:", tempPath, "element:", element);
            global.app.$data.nowAllPaths = getElementXPaths(element); //标记此元素xpath
            pushToReadyList(tempPath);
            break;
        }
    }
    // let at2 = parseInt(new Date().getTime());
    // console.log("findRelated：", at2, at, at2 - at);
}


//根据path将元素放入readylist中
export function pushToReadyList(path) {
    let result = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
    let node = result.iterateNext(); //枚举第一个元素
    while (node) { //只添加不在已选中列表内的元素
        let exist = false;
        for (let o of global.nodeList) {
            if (o["node"] == node) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            global.readyList.push({ "node": node, "bgColor": node.style.backgroundColor, "boxShadow": node.style.boxShadow == "" || global.boxShadowColor ? "none" : node.style.boxShadow });
        }
        node.style.boxShadow = global.boxShadowColor;
        node = result.iterateNext(); //枚举下一个元素
    }
}

//将readyList中的元素放入选中节点中
export function readyToList(step, dealparameters = true) {
    for (let o of global.readyList) {
        global.nodeList.push({ node: o["node"], "step": global.step, bgColor: o["bgColor"], "boxShadow": o["boxShadow"], xpath: readXPath(o["node"], 1), "allXPaths": getElementXPaths(o["node"]) });
        o["node"].style.backgroundColor = global.selectedColor;
    }
    clearReady();
    if (dealparameters) { //防止出现先选中子元素再选中全部失效的问题
        generateParameters(0); //根据nodelist列表内的元素生成参数列表，0代表纯文本
    }

}

//根据节点列表和索引列表生成XPATH
// 如：["html","body","div"],[-1,-1,2],生成/html/body/div[2]
export function combineXpath(nameList, indexList) {
    let finalPath = "";
    for (let i = 0; i < nameList.length; i++) {
        finalPath = finalPath + "/" + nameList[i];
        if (indexList[i] != -1) {
            finalPath = finalPath + "[" + indexList[i] + "]";
        }
    }
    return finalPath;
}

//专门测试已经选中的这些元素之间有没有相关性
// 举例：
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[3]/a[22]
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[2]/div[3]/a[25]
// 最终转换为：
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div/div[3]/a
export function relatedTest() {
    // let at = new Date().getTime()
    let testList = [];
    let testpath = "";
    for (let i = 0; i < global.nodeList.length; i++) {
        let testnumList = []; //用于比较节点索引号不同
        let tpath = global.nodeList[i]["xpath"].replace("//iframe","").split("/").splice(1); //清理第一个空元素
        for (let j = 0; j < tpath.length; j++) {
            if (tpath[j].indexOf("[") >= 0) { //如果存在索引值
                testnumList.push(parseInt(tpath[j].split("[")[1].replace("]", ""))); //只留下数字
            } else {
                testnumList.push(-1);
            }
            tpath[j] = tpath[j].split("[")[0];
        }
        let tp = tpath.join("/");
        if (i > 0 && testpath != tp) { //如果去除括号后元素内存在不一致情况，直接返回默认情况代码100
            global.app.$data.nowPath = ""; //标记此元素xpath
            return 100;
        }
        testpath = tp;
        testList.push(testnumList);
    }
    testpath = testpath.split("/"); //清理第一个空元素
    let indexList = []; //记录新生成的xpath
    //如果选中的元素属于同样的序列，则计算出序列的最佳xpath表达式
    for (let j = 0; j < testList[0].length; j++) {
        indexList.push(testList[0][j]);
        for (let i = 1; i < testList.length; i++) {
            if (testList[i][j] != testList[i - 1][j]) {
                indexList[j] = -1; //不一致就记录成-1
                break;
            }
        }
    }
    let finalPath = combineXpath(testpath, indexList);
    let element = document.evaluate(finalPath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
    global.app.$data.nowAllPaths = getElementXPaths(element); //标记此元素xpath
    console.log("finalPath:", finalPath, "element:", element);
    global.app.$data.nowPath = finalPath; //标记此元素xpath
    pushToReadyList(finalPath);
    // let at2 = parseInt(new Date().getTime());
    // console.log("手动：", at2, at, at2 - at);
    return 50; //先返回给默认码
}
