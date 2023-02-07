//表现逻辑层的处理

if (window.location.href.indexOf("backEndAddressServiceWrapper") >= 0) {
    throw "serviceGrid"; //如果是服务器网页页面, 则不执行工具
}

//Vueelement
var app;
generateToolkit();
//生成Toolkit
function generateToolkit() {
    $(".tooltips").html(`
    <div id="realcontent">
    <div class="tooldrag">✍Operation Toolbox (Can drag)</div>
    <div class="realcontent">
        <div v-if="page==0">
            <input type="checkbox" style="width:15px;height:15px;vertical-align:middle;" v-on:mousedown="specialSelect"> </input>
            <p style="margin-bottom:10px;display:inline-block">Special click mode</p>
            <div v-if="list.nl.length==0">
                <p style="color:black">● When your mouse moves to the element, please <strong>right-click</strong> your mouse button or press <strong>F7</strong> on the keyboard to select it.</p>
                <p style="color:black">● You can click the back button to go back to the page</p>
                {{initial()}}
            </div>
            <div v-if="list.nl.length==1">
                <div v-if="tname()!='null'">
                    ● Already selected {{numOfList()}} {{tname()}}, <span v-if="numOfReady()>0&&tname()!='Elements in next page'"> meanwhile we find {{numOfReady()}} element with the same type, </span>you can:
                    <div class="innercontent">
                        <div v-if="numOfReady()>0 && !selectStatus"> <a v-on:mousedown="selectAll">Select All</a><span title="">☺</span></div>
                        <div v-if="existDescendents()&& !selectStatus &&(tname()=='element' || tname()=='link')"> <a v-on:mousedown="selectDescendents">Select child elements</a> <span title="">☺</span></div>
                        <div v-if="!selectedDescendents && !selectStatus" id="Single">
                        <!-- <div v-if="tname()=='selection box'"> <a>循环切换该下拉项</a><span title="">☺</span></div> -->
                            <div v-if="tname()=='text box'"> <a v-on:mousedown="setInput">Input Text</a><span title="">☺</span></div>
                            <div v-if="tname()!='Image'"> <a v-on:mousedown="getText">Extract {{tname()}}'s text</a><span title="collet text">☺</span></div>
                            <div v-if="tname()=='selection box'"> <a>Collect text from this element</a><span title="">☺</span></div>
                            <div v-if="tname()=='link'||tname()=='Image'"> <a v-on:mousedown="getLink">Collect address of this {{tname()}}</a><span title="">☺</span></div>
                            <div v-if="tname()!='selection box' && tname()!='text box'"> <a v-on:mousedown="clickElement">Click this {{tname()}}</a><span title="">☺</span></div>
                            <div v-if="tname()!='selection box' && tname()!='text box'"> <a v-on:mousedown="loopClickSingleElement">Loop-click this {{tname()}}</a><span title="">☺</span></div>
                            <div v-if="tname()=='link'||tname()=='element'"> <a v-on:mousedown="getInnerHtml">Collect Inner Html of this {{tname()}}</a><span title="">☺</span></div>
                            <div> <a v-on:mousedown="getOuterHtml">Collect Outer Html of this element</a><span title="">☺</span></div>
                            <!-- <div> <a href="#">鼠标移动到该元素上----{{tname()}}-</a><span title="">☺</span></div> -->
                            <!-- <div v-if="tname()=='text box'"> <a>识别验证码</a><span title="">☺</span></div> -->
                        </div>
                        <div v-if="selectedDescendents" id="Single">
                            <div><a v-on:mousedown="confirmCollectSingle">Collect Data</a><span title="">☺</span></div>
                        </div>
                        <div v-if="selectStatus" id="Confirm">
                            <div><a v-on:mousedown="confirmCollectSingle">Confirm Collect</a><span title="">☺</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="list.nl.length>1">

                <div v-if="option==100">
                    ● Already selected the follwoing element, you can:
                    <div class="innercontent">
                        <div> <a v-on:mousedown="confirmCollectMulti">Collect Data</a><span title="">☺</span> </div>
                        <div> <a v-on:mousedown="revoke">Revoke selection</a><span title="">☺</span></div>
                    </div>
                </div>

                <div v-if="option!=100">
                    ● Already selected {{numOfList()}} similar elements, <span v-if="numOfReady()>0">and we find other{{numOfReady()}} similar elements, </span>you can:
                    <div class="innercontent">
                        <div v-if="numOfReady()>0"> <a v-on:mousedown="selectAll">Select All</a><span title="">☺</span></div>
                        <div v-if="existDescendents()&&(tname()=='element' || tname()=='link')"> <a v-on:mousedown="selectDescendents">Select child elements</a><span title="">☺</span></div>
                        <div> <a v-on:mousedown="confirmCollectMultiAndDescendents">Collect Data</a><span title="">☺</span></div>
                        <div v-if="tname()!='selection box' && tname()!='text box' && !selectedDescendents"> <a  v-on:mousedown="loopClickEveryElement">Loop-click every {{tname()}}</a><span title="">☺</span></div>
                        <div> <a v-on:mousedown="revoke">Revoke selection</a><span title="">☺</span></div>
                    </div>
                </div>
            
            </div>

            <div v-if="valTable.length>0">
                <div class="toolkitcontain">{{setWidth("350px")}}
                    <table class="toolkittb2" cellspacing="0">
                        <tbody>
                            <th v-for="i in list.opp">{{i["name"]}}</th>
                            <th style="width:40px">Delete</td>
                        </tbody>
                    </table>
                    <table class="toolkittb4" cellspacing="0">
                        <tbody>
                            <tr v-for="i in valTable[0].length">
                                <td v-for="j in list.opp.length">{{valTable[j-1][i-1]}}</td>
                                <td v-on:mousedown="deleteSingleLine" style="font-size: 22px!important;width:40px;cursor:pointer" v-bind:index="i-1">×</td>
                            </tr>
                    </table>
                </div>
            </div>
            
            <div v-if="valTable.length==0&&tname()!='Elements in next page'">{{setWidth("290px")}}</div>

            <div v-if="list.nl.length>0" style="bottom:12px;position:absolute;color:black!important;left:17px;font-size:13px">
                <div style="margin-bottom:5px">
                    <button v-on:mousedown="cancel">Deselect</button>
                    <button v-if="!selectStatus" v-on:mousedown="enlarge">Expand Path</button>
                </div>
                <p style="margin-left:16px;margin-bottom:0px">{{lastElementXPath()}}</p>
            </div>
        </div>
        <div v-if="page==1">
            ● Please input text:
            <input type="text" v-model="text" autofocus="autofocus" id="WTextBox"></input>
            <button v-on:click="getInput" style="margin-left:0px!important;">Confirm</button>
            <button v-on:click="cancelInput" style="margin-left:0px!important;">Cancel</button>
                <div class="innercontent">
                </div>
        </div>
    </div>
`);
    app = new Vue({
        el: '#realcontent',
        data: {
            option: 0,
            list: { nl: nodeList, opp: outputParameters },
            valTable: [], // 用来存储转换后的para列表
            special: false, //是否为特殊selection模式
            selectedDescendents: false, // 标记是否选中了子element
            selectStatus: false, //标记单个element是否点击了采集
            page: 0, //默认页面, 1为输入文字页面
            text: "", // 记录输入的文字
            tNodeName: "", // 记录临时节点列表
            nowPath: "", //现在element的xpath
        },
        watch: {
            nowPath: { //变量发生变化的时候进行一些操作
                handler: function(newVal, oldVal) {
                    console.log("xpath:", newVal);
                }
            }
        },
        methods: {
            initial: function() { //每当element是0的时候, 执行值的初始化操作
                this.selectedDescendents = false;
                this.selectStatus = false;
                this.nowPath = "";
            },
            confirmCollectSingle: function() { //单element确认采集
                collectSingle();
                clearEl();
            },
            confirmCollectMulti: function() { //无规律多element确认采集
                collectMultiNoPattern();
                clearEl();
            },
            confirmCollectMultiAndDescendents: function() { //有规律多element确认采集
                collectMultiWithPattern();
                clearEl();
            },
            deleteSingleLine: function(event) { //删除单行element
                let at = new Date().getTime()
                    //流程图送element的时候, 默认的使用不固定循环列表, 但是一旦有删除element的操作发生, 则按照固定element列表采集element
                index = event.target.getAttribute("index");
                let tnode = nodeList.splice(index, 1)[0]; //删掉当前element
                tnode["node"].style.backgroundColor = tnode["bgColor"];
                tnode["node"].style.boxShadow = tnode["boxShadow"];
                if (nodeList.length > 1) { // 如果删到没有就没有其他的操作了
                    handleElement();
                    if (this.selectedDescendents) {
                        handleDescendents(); //如果之前有Select child elements, 新加入的节点又则这里也需要重新selection子element
                    }
                } else {
                    this.valTable = [];
                    this.selectStatus = false;
                    clearParameters(); //直接Revoke 重选
                }
                let at2 = parseInt(new Date().getTime());
                console.log("delete:", at2, at, at2 - at);
            },
            clickElement: function() { //点击element操作
                sendSingleClick();
                //先发送数据
                nodeList[0]["node"].focus(); //获得element焦点
                nodeList[0]["node"].click(); //点击element
                clearEl();
            },
            loopClickSingleElement: function() { //循环点击单个element
                sendLoopClickSingle(this.tname()); //识别下一页,循环点击单个element和点击多个element
                if (this.tname() != "Elements in next page") { //Elements in next page不进行点击操作
                    nodeList[0]["node"].focus(); //获得element焦点
                    nodeList[0]["node"].click(); //点击element
                }
                clearEl();
            },
            loopClickEveryElement: function() { //循环点击每个element
                sendLoopClickEvery(); //识别下一页,循环点击单个element和点击多个element
                nodeList[0]["node"].focus(); //获得element焦点
                nodeList[0]["node"].click(); //点击element
                clearEl();
            },
            setInput: function() { //输入文字
                this.page = 1;
                this.$nextTick(function() { //下一时刻获得焦点
                    document.getElementById("WTextBox").focus();
                })
            },
            getInput: function() { //得到输入的文字
                nodeList[0]["node"].focus(); //获得文字焦点
                nodeList[0]["node"].setAttribute("value", this.text); // 设置输入 box内容
                input(this.text); // 设置输入
                this.text = "";
                clearEl();
            },
            cancelInput: function() {
                this.page = 0;
            },
            setWidth: function(width) { //根据是否出现表格调整最外 box宽度
                $(".tooltips").css("width", width);
                return "";
            },
            getText: function() { //采集文字
                generateParameters(0, true, false);
                this.selectStatus = true;
                clearReady();
            },
            getLink: function() { //采集linkAddress
                generateParameters(0, false, true);
                this.selectStatus = true;
                clearReady();
            },
            getOuterHtml: function() { //采集OuterHtml
                generateParameters(3, true, false);
                this.selectStatus = true;
                clearReady();
            },
            getInnerHtml: function() { //采集InnerHtml
                generateParameters(2, true, false);
                this.selectStatus = true;
                clearReady();
            },
            tname: function() {
                let tag = nodeList.length == 0 ? "" : nodeList[0]["node"].tagName;
                let inputType = nodeList.length == 0 ? "" : nodeList[0]["node"].getAttribute("type");
                if (inputType != null) { //如果没有type属性, 则默认为text
                    inputType = inputType.toLowerCase();
                } else {
                    inputType = "text";
                }
                if (tag == "") {
                    return "null";
                } else if ($(nodeList[0]["node"]).contents().filter(function() { return this.nodeType === 3; }).text().indexOf("Next") >= 0) {
                    this.setWidth("310px");
                    return "Elements in next page";
                } else if (tag == "A") {
                    return "link";
                } else if (tag == "IMG") {
                    return "Image";
                } else if (tag == "BUTTON" || (tag == "INPUT" && (inputType == "button" || inputType == "submit"))) {
                    return "Button";
                } else if (tag == "TEXTAREA" || (tag == "INPUT" && (inputType != "checkbox" || inputType != "ratio"))) { //普通输入 box
                    return "text box";
                } else if (tag == "SELECT") {
                    return "selection box";
                } else {
                    return "element";
                }
            },
            existDescendents: function() { //检测选中的element是否存在子element,Already 经选中了子element也不要再出现了
                return nodeList.length > 0 && nodeList[0]["node"].children.length > 0 && !this.selectedDescendents;
            },
            numOfReady: function() {
                return readyList.length;
            },
            numOfList: function() {
                return nodeList.length;
            },
            lastElementXPath: function() { //用来显示element的最大最后5个xpath路劲element
                path = nodeList[nodeList.length - 1]["xpath"];
                path = path.split("/");
                tp = "";
                if (path.length > 5) { //只保留最后五个element
                    path = path.splice(path.length - 5, 5);
                    tp = ".../"
                }
                for (i = 0; i < path.length; i++) {
                    path[i] = path[i].split("[")[0];
                }
                path = path.join("/");
                path = "Path: " + tp + path;
                return path;
            },
            cancel: function() {
                clearEl();
            },
            specialSelect: function() { //特殊selection模式
                if (mousemovebind) {
                    tdiv.style.pointerEvents = "none";
                    this.special = false;
                } else {
                    this.special = true;
                }
                mousemovebind = !mousemovebind;
            },
            enlarge: function() { // 扩大选区功能, 总是扩大最后一个选中的element的选区
                if (nodeList[nodeList.length - 1]["node"].tagName != "BODY") {
                    nodeList[nodeList.length - 1]["node"].style.backgroundColor = nodeList[nodeList.length - 1]["bgColor"]; //之前element恢复原来的背景颜色
                    nodeList[nodeList.length - 1]["node"].style.boxShadow = nodeList[nodeList.length - 1]["boxShadow"]; //之前element恢复原来的背景颜色
                    tNode = nodeList[nodeList.length - 1]["node"].parentNode; //向上走一层
                    if (tNode != NowNode) { //扩大选区之后背景颜色的判断, 当前正好选中的颜色应该是不同的
                        sty = tNode.style.backgroundColor;
                    } else {
                        sty = style;
                    }
                    nodeList[nodeList.length - 1]["node"] = tNode;
                    nodeList[nodeList.length - 1]["bgColor"] = sty;
                    nodeList[nodeList.length - 1]["xpath"] = readXPath(tNode, 1);
                    //显示 box
                    var pos = tNode.getBoundingClientRect();
                    div.style.display = "block";
                    div.style.height = tNode.offsetHeight + "px";
                    div.style.width = tNode.offsetWidth + "px";
                    div.style.left = pos.left + "px";
                    div.style.top = pos.top + "px";
                    div.style.zIndex = 2147483645;
                    div.style.pointerEvents = "none";
                    handleElement(); //每次数组element有变动, 都需要重新处理下
                    oe = tNode;
                    tNode.style.backgroundColor = "rgba(0,191,255,0.5)";
                    this.selectedDescendents = false;
                }
            },
            selectAll: function() { //Select Allelement
                step++;
                readyToList(step, false);
                handleElement();
                if (this.selectedDescendents) {
                    handleDescendents(); //如果之前有Select child elements, 新加入的节点又则这里也需要重新selection子element
                }
            },
            revoke: function() { //Revoke selection当前节点
                var tstep = step;
                step--; //步数-1
                while (tstep == nodeList[nodeList.length - 1]["step"]) //删掉所有当前步数的element节点
                {
                    let node = nodeList.splice(nodeList.length - 1, 1)[0]; //删除数组最后一项
                    node["node"].style.backgroundColor = node["bgColor"]; //还原原始属性和边 box
                    node["node"].style.boxShadow = node["boxShadow"];
                    if (NowNode == node["node"]) {
                        style = node["bgColor"];
                    }
                    //处理Already 经有Select child elements的情况
                    // if (this.selectedDescendents) {
                    clearParameters(); //直接Revoke 重选
                    // }
                }
                handleElement(); //每次数组element有变动, 都需要重新处理下
            },
            selectDescendents: function() { //selection所有子element操作
                handleDescendents();
            }
        },
    });
    h = $(".tooldrag").height();
    difference = 26 - h; //获得高度值差
    if (difference > 0) {
        $(".tooldrag").css("cssText", "height:" + (26 + difference) + "px!important")
    }
    timer = setInterval(function() { //时刻监测相应element是否存在(防止出现如百度一样element消失重写body的情况), 如果不存在, 添加进来
        if (document.body != null && document.getElementById("wrapperToolkit") == null) {
            this.clearInterval(); //先Cancel原来的计时器, 再设置新的计时器
            document.body.append(div); //默认如果toolkit不存在则div和tdiv也不存在
            document.body.append(tdiv);
            document.body.append(toolkit);
            generateToolkit();
            // var list = document.getElementsByTagName("a");
            // // 对于没有特殊绑定函数的a标签, 使他们在新标签页中打开
            // for (var i = 0; i < list.length; i++) {
            //     if (list[i].href.indexOf("javascript") == -1 && list[i].href.indexOf("void") == -1 && list[i].href.indexOf("#") == -1 && list[i].href) {
            //         list[i].setAttribute("target", "_blank");
            //     }
            // };
            // list = document.getElementsByTagName("form");
            // // 对于没有特殊绑定函数的form标签, 使他们在新标签页中打开
            // for (var i = 0; i < list.length; i++) {
            //     list[i].setAttribute("target", "_blank");
            // };
        }
    }, 3000);
}

//每次对element进行增删之后需要执行的操作
function handleElement() {
    clearReady(); //预备element每次处理都先处理掉
    if (nodeList.length > 1) { //选中了许多element的情况
        app._data.option = relatedTest();
        if (app._data.option == 100) {
            generateMultiParameters();
        } else {
            generateParameters(0);
        }
    } else if (nodeList.length == 1) {
        findRelated(); //寻找和element相关的element
    }
}

function clearParameters(deal = true) //清空para列表
{
    if (deal) //是否Cancel对选中的子element进行处理
    {
        app._data.selectedDescendents = false;
    }
    for (o of outputParameterNodes) {
        o["node"].style.boxShadow = o["boxShadow"];
    }
    outputParameterNodes.splice(0);
    outputParameters.splice(0); //清空原来的para列表
    app._data.valTable = []; //清空展现数组
    app._data.selectStatus = false;
}


//根据nodelist列表内的element生成para列表
//适合:nodelist中的element为同类型element
//type:0为全部text 1为节点内直接的文字 2为innerhtml 3为outerhtml
//nodetype:0,对应全type0123
//nodetype:1 link, 对应type0123
//nodetype:2 linkAddress 对应type0
//nodetype:3 按钮和输入text box 对应type
//nodetype:4 按钮和输入text box 对应type

function generateParameters(type, linktext = true, linkhref = true) {
    clearParameters(false);
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        for (let num = 0; num < nodeList.length; num++) {
            let nd = nodeList[num]["node"];
            ndPath = nodeList[num]["xpath"];
            outputParameterNodes.push({ "node": nd, "boxShadow": nd.style.boxShadow == "" || boxShadowColor ? "none" : nd.style.boxShadow });
            nd.style.boxShadow = boxShadowColor;
            let pname = "text";
            let ndText = "";
            if (type == 0) {
                ndText = $(nd).text();
                pname = "text";
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : $(nd).prop("src");
                    pname = "Address";
                } else if (nd.tagName == "INPUT") {
                    ndText = nd.getAttribute("value") == null ? "" : nd.getAttribute("value");
                }
            } else if (type == 1) {
                ndText = $(nd).contents().filter(function() { return this.nodeType === 3; }).text().replace(/\s+/g, '');
                pname = "text";
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : $(nd).prop("src");
                    pname = "Address";
                } else if (nd.tagName == "INPUT") {
                    ndText = nd.getAttribute("value") == null ? "" : nd.getAttribute("value");
                }
            } else if (type == 2) {
                ndText = $(nd).html();
                pname = "Innerhtml";
            } else if (type == 3) {
                ndText = $(nd).prop("outerHTML");
                pname = "outerHTML";
            }
            if (num == 0) { //第一个节点新建, 后面的增加即可
                if (nd.tagName == "IMG") { //如果element是Image
                    outputParameters.push({
                        "nodeType": 4, //节点类型
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "para" + (n++) + "_Image" + pname,
                        "desc": "", //para描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                } else if (nd.tagName == "A") { //如果element是超链接
                    if (linktext) {
                        outputParameters.push({
                            "nodeType": 1,
                            "contentType": type, // 内容类型
                            "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": "para" + (n++) + "_link" + pname,
                            "desc": "", //para描述
                            "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                            "exampleValues": [{ "num": num, "value": ndText }]
                        });
                    }
                    if (linkhref) {
                        outputParameters.push({
                            "nodeType": 2,
                            "contentType": type, // 内容类型
                            "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": "para" + (n++) + "_linkAddress",
                            "desc": "", //para描述
                            "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                            "exampleValues": [{ "num": num, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") }]
                        });
                    }
                } else if (nd.tagName == "INPUT") { //如果element是输入项
                    outputParameters.push({
                        "nodeType": 3,
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "para" + (n++) + "_" + pname,
                        "desc": "", //para描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                } else { //其他所有情况
                    outputParameters.push({
                        "nodeType": 0,
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "para" + (n++) + "_" + pname,
                        "desc": "", //para描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                }
            } else { //如果element节点Already 经存在, 则只需要插入值就可以了
                if (nd.tagName == "IMG") { //如果element是Image
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                } else if (nd.tagName == "A") { //如果element是超链接
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                    outputParameters[1]["exampleValues"].push({ "num": num, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") });
                } else if (nd.tagName == "INPUT") { //如果element是输入项
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                } else { //其他所有情况
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                }
            }
        }
        let at2 = parseInt(new Date().getTime());
        console.log("generateParameters:", at2, at, at2 - at);
        generateValTable();
        console.log(outputParameters);

    });

}

//根据nodelist列表内的element生成para列表
//适合:nodelist中的element为不同类型element
function generateMultiParameters() {
    clearParameters(false);
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        for (let num = 0; num < nodeList.length; num++) {
            let nd = nodeList[num]["node"];
            ndPath = nodeList[num]["xpath"];
            outputParameterNodes.push({ "node": nd, "boxShadow": nd.style.boxShadow == "" || boxShadowColor ? "none" : nd.style.boxShadow });
            nd.style.boxShadow = boxShadowColor;
            ndText = $(nd).text();
            if (nd.tagName == "IMG") { //如果element是Image
                outputParameters.push({
                    "nodeType": 4, //节点类型
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "para" + (n++) + "_imageAddress",
                    "desc": "", //para描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src") }]
                });
            } else if (nd.tagName == "A") { //如果element是超链接
                outputParameters.push({
                    "nodeType": 1,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "para" + (n++) + "_linktext",
                    "desc": "", //para描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": ndText }]
                });
                outputParameters.push({
                    "nodeType": 2,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "para" + (n++) + "_linkAddress",
                    "desc": "", //para描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") }]
                });
            } else if (nd.tagName == "INPUT") { //如果element是输入项
                outputParameters.push({
                    "nodeType": 3,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "para" + (n++) + "_text",
                    "desc": "", //para描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value") }]
                });
            } else { //其他所有情况
                outputParameters.push({
                    "nodeType": 0,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "para" + (n++) + "_text",
                    "desc": "", //para描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": ndText }]
                });
            }
        }
        // console.log(outputParameters);
        let at2 = parseInt(new Date().getTime());
        console.log("generateMultiParameters", at2, at, at2 - at);
        generateValTable(false);
    });

}


//处理子element,对于每个块中多出的特殊element, 需要特殊处理
function handleDescendents() {
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        clearParameters(); //清除原来的para列表
        app._data.selectedDescendents = true;
        for (let num = 0; num < nodeList.length; num++) {
            let tnode = nodeList[num]["node"];
            let stack = new Array(); //深度优先搜索遍历element
            stack.push(tnode); //从此节点开始
            while (stack.length > 0) {
                let nd = stack.pop(); // 挨个取出element
                if (nd.parentNode.tagName == "A" && nd.tagName == "SPAN") {
                    continue; //对A标签内的SPANelement不进行处理,剪枝, 此时子element根本不加入stack, 即实现了此功能
                }
                ndPath = readXPath(nd, 1, tnode);
                let index = -1;
                for (let i = 0; i < outputParameters.length; i++) {
                    if (outputParameters[i]["relativeXpath"] == ndPath) {
                        index = i;
                        break;
                    }
                }
                outputParameterNodes.push({
                    "node": nd,
                    "boxShadow": nd.style.boxShadow == "" || boxShadowColor ? "none" : nd.style.boxShadow
                });
                nd.style.boxShadow = boxShadowColor;
                ndText = $(nd).contents().filter(function() {
                    return this.nodeType === 3;
                }).text().replace(/\s+/g, '');
                if (index == -1) { //从第二个节点开始, 只插入那些不在para列表中的element, 根据xpath进行寻址
                    //如果当前节点除了子element外仍然有其他文字或者该element是Image/表单项, 加入子element节点
                    if (ndText != "" || nd.tagName == "IMG" || nd.tagName == "INPUT" || nd.tagName == "A") {
                        if (nd.tagName == "IMG") { //如果element是Image
                            outputParameters.push({
                                "nodeType": 4, //节点类型
                                "contentType": 1, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径,注意当只selection了子element没有Select All的时候, 需要判断
                                "name": "para" + (n++) + "_imageAddress",
                                "desc": "", //para描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd), //同理需要判断
                                "exampleValues": [{
                                    "num": num,
                                    "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src")
                                }]
                            });
                        } else if (nd.tagName == "A") { //如果element是超链接
                            outputParameters.push({
                                "nodeType": 1,
                                "contentType": 0, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "para" + (n++) + "_linktext",
                                "desc": "", //para描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{ "num": num, "value": $(nd).text() }] //注意这里的ndtext是整个a的文字！！！
                            });
                            outputParameters.push({
                                "nodeType": 2,
                                "contentType": 0, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "para" + (n++) + "_linkAddress",
                                "desc": "", //para描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{
                                    "num": num,
                                    "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href")
                                }]
                            });
                        } else if (nd.tagName == "INPUT") { //如果element是输入项
                            outputParameters.push({
                                "nodeType": 3,
                                "contentType": 1, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "para" + (n++) + "_text",
                                "desc": "", //para描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{
                                    "num": num,
                                    "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                                }]
                            });
                        } else { //其他所有情况
                            outputParameters.push({
                                "nodeType": 0,
                                "contentType": 1, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "para" + (n++) + "_text",
                                "desc": "", //para描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{ "num": num, "value": ndText }]
                            });
                        }
                    }
                } else //如果element节点Already 经存在, 则只需要插入值就可以了
                {
                    if (nd.tagName == "IMG") { //如果element是Image
                        outputParameters[index]["exampleValues"].push({
                            "num": num,
                            "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src")
                        });
                    } else if (nd.tagName == "A") { //如果element是超链接
                        outputParameters[index]["exampleValues"].push({ "num": num, "value": $(nd).text() });
                        outputParameters[index + 1]["exampleValues"].push({
                            "num": num,
                            "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href")
                        });
                    } else if (nd.tagName == "INPUT") { //如果element是输入项
                        outputParameters[index]["exampleValues"].push({
                            "num": num,
                            "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value")
                        });
                    } else { //其他所有情况
                        outputParameters[index]["exampleValues"].push({ "num": num, "value": ndText });
                    }
                }
                for (let i = nd.children.length - 1; i >= 0; i--) {
                    stack.push(nd.children[i]);
                }
            }
        }
        let at2 = parseInt(new Date().getTime());
        console.log("Select child elements", at2, at, at2 - at);
        generateValTable();
    });

}


//根据para列表生成可视化para界面
function generateValTable(multiline = true) {
    let paravalues = [];
    for (let i = 0; i < outputParameters.length; i++) {
        let tvalues = [];
        let tindex = 0;
        let l = multiline ? nodeList.length : 1;
        for (let j = 0; j < l; j++) {
            //注意第一个循环条件, index超出界限了就不需要再寻找了, 其他的全是空
            if (tindex < outputParameters[i]["exampleValues"].length && outputParameters[i]["exampleValues"][tindex]["num"] == j) {
                tvalues.push(outputParameters[i]["exampleValues"][tindex]["value"]);
                tindex++;
            } else {
                tvalues.push(" ");
            }
        }
        paravalues.push(tvalues);
    }
    app._data.valTable = paravalues;
}

// 选中第一个节点, 自动寻找同类节点
// 方法:/div[1]/div[2]/div[2]/a[1]
// 从倒数第一个节点开始找, 看去掉方括号之后是否element数目变多, 如上面的变成/div[1]/div[2]/div[2]/a
// 如果没有, 则恢复原状, 然后试试倒数第二个:/div[1]/div[2]/div/a[1]
// 直到找到第一个变多的节点或者追溯到根节点为止
function findRelated() {
    let at = parseInt(new Date().getTime());
    let testPath = nodeList[0]["xpath"].split("/").splice(1); //分离xpath成 ["html","body","div[0]"]这样子
    let nodeNameList = [];
    let nodeIndexList = [];
    for (i = 0; i < testPath.length; i++) {
        nodeNameList.push(testPath[i].split("[")[0]);
        if (testPath[i].indexOf("[") >= 0) { //如果存在索引值
            nodeIndexList.push(parseInt(testPath[i].split("[")[1].replace("]", ""))); //只留下数字
        } else {
            nodeIndexList.push(-1);
        }
    }
    var tempPath = "";
    for (let i = nodeIndexList.length - 1; i >= 0; i--) {
        if (nodeIndexList[i] == -1) { //没有索引值直接跳过
            continue;
        }
        tempIndexList = [...nodeIndexList]; //复刻一个index数组
        tempIndexList[i] = -1; //删除索引值
        tempPath = combineXpath(nodeNameList, tempIndexList); //生成新的xpath
        var result = document.evaluate(tempPath, document, null, XPathResult.ANY_TYPE, null);
        result.iterateNext(); //枚举第一个element
        if (result.iterateNext() != null) { //如果能枚举到第二个element, 说明存在同类element,选中同类element, 结束循环
            app.$data.nowPath = tempPath; //标记此elementxpath
            pushToReadyList(tempPath);
            break;
        }
    }
    let at2 = parseInt(new Date().getTime());
    console.log("findRelated:", at2, at, at2 - at);
}


//根据path将element放入readylist中
function pushToReadyList(path) {
    result = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
    var node = result.iterateNext(); //枚举第一个element
    while (node) { //只添加不在Already 选中列表内的element
        let exist = false;
        for (o of nodeList) {
            if (o["node"] == node) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            readyList.push({ "node": node, "bgColor": node.style.backgroundColor, "boxShadow": node.style.boxShadow == "" || boxShadowColor ? "none" : node.style.boxShadow });
        }
        node.style.boxShadow = boxShadowColor;
        node = result.iterateNext(); //枚举下一个element
    }
}

//将readyList中的element放入选中节点中
function readyToList(step, dealparameters = true) {
    for (o of readyList) {
        nodeList.push({ node: o["node"], "step": step, bgColor: o["bgColor"], "boxShadow": o["boxShadow"], xpath: readXPath(o["node"], 1) });
        o["node"].style.backgroundColor = selectedColor;
    }
    clearReady();
    if (dealparameters) { //防止出现先Select child elements再Select All失效的问题
        generateParameters(0); //根据nodelist列表内的element生成para列表, 0代表纯text
    }

}

//根据节点列表和索引列表生成XPATH
// 如:["html","body","div"],[-1,-1,2],生成/html/body/div[2]
function combineXpath(nameList, indexList) {
    let finalPath = "";
    for (i = 0; i < nameList.length; i++) {
        finalPath = finalPath + "/" + nameList[i];
        if (indexList[i] != -1) {
            finalPath = finalPath + "[" + indexList[i] + "]";
        }
    }
    return finalPath;
}

//专门测试Already 经选中的这些element之间有没有相关性
// 举例:
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[3]/a[22]
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[2]/div[3]/a[25]
// 最终转换为:
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div/div[3]/a
function relatedTest() {
    let at = new Date().getTime()
    var testList = [];
    var testpath = "";
    for (i = 0; i < nodeList.length; i++) {
        var testnumList = []; //用于比较节点索引号不同
        var tpath = nodeList[i]["xpath"].split("/").splice(1); //清理第一个空element
        for (j = 0; j < tpath.length; j++) {
            if (tpath[j].indexOf("[") >= 0) { //如果存在索引值
                testnumList.push(parseInt(tpath[j].split("[")[1].replace("]", ""))); //只留下数字
            } else {
                testnumList.push(-1);
            }
            tpath[j] = tpath[j].split("[")[0];
        }
        tp = tpath.join("/");
        if (i > 0 && testpath != tp) { //如果去除括号后element内存在不一致情况, 直接返回默认情况代码100
            app.$data.nowPath = ""; //标记此elementxpath
            return 100;
        }
        testpath = tp;
        testList.push(testnumList);
    }
    testpath = testpath.split("/"); //清理第一个空element
    var indexList = []; //记录新生成的xpath
    //如果选中的element属于同样的序列, 则计算出序列的最佳xpath表达式
    for (j = 0; j < testList[0].length; j++) {
        indexList.push(testList[0][j]);
        for (i = 1; i < testList.length; i++) {
            if (testList[i][j] != testList[i - 1][j]) {
                indexList[j] = -1; //不一致就记录成-1
                break;
            }
        }
    }
    var finalPath = combineXpath(testpath, indexList);
    app.$data.nowPath = finalPath; //标记此elementxpath
    pushToReadyList(finalPath);
    let at2 = parseInt(new Date().getTime());
    console.log("手动:", at2, at, at2 - at);
    return 50; //先返回给默认码
}

//实现提示 box拖拽功能
$('.tooldrag').mousedown(function(e) {
    // e.pageX
    var positionDiv = $(this).offset();
    var distanceX = e.pageX - positionDiv.left;
    var distanceY = e.pageY - positionDiv.top;
    //alert(distanceX)
    // alert(positionDiv.left);

    $(document).mousemove(function(e) {
        var x = e.clientX - distanceX;
        var y = e.clientY - distanceY;

        if (x < 0) {
            x = 0;
        } else if (x > window.innerWidth - $('.tooldrag').outerWidth(true)) {
            x = window.innerWidth - $('.tooldrag').outerWidth(true);
        }

        if (y < 0) {
            y = 0;
        } else if (y > window.innerHeight - $('.tooldrag').outerHeight(true)) {
            y = window.innerHeight - $('.tooldrag').outerHeight(true);
        }

        $('.tooltips').css({
            'right': window.innerWidth - x - $('.tooltips').outerWidth(true) + 'px',
            'bottom': window.innerHeight - y - $('.tooltips').outerHeight(true) + 'px',
        });
    });

    $(document).mouseup(function() {
        $(document).off('mousemove');
    });
});