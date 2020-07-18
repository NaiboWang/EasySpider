//表现逻辑层的处理

if (window.location.href.indexOf("183.129.170.180") >= 0) {
    throw "serviceGrid"; //如果是服务器网页页面，则不执行工具
}

//Vue元素
var app;
generateToolkit();
//生成Toolkit
function generateToolkit() {
    $(".tooltips").html(`
    <div id="realcontent">
    <div class="tooldrag">✍操作提示框（可点此拖动）</div>
    <div class="realcontent">
        <div v-if="page==0">
            <input type="checkbox" style="width:15px;height:15px;vertical-align:middle;" v-on:mousedown="specialSelect"> </input>
            <p style="margin-bottom:10px;display:inline-block">特殊点选模式</p>
            <div v-if="list.nl.length==0">
                <p style="color:black">● 鼠标移动到元素上后，请<strong>右键</strong>点击或者按<strong>F7</strong>键选中页面元素。</p>
                <p style="color:black">● 如果不小心左键点选了元素导致页面跳转，直接后退或者切换回标签页即可。</p>
                {{initial()}}
            </div>
            <div v-if="list.nl.length==1">
                <div v-if="tname()!='null'">
                    ● 已选中{{numOfList()}}个{{tname()}}，<span v-if="numOfReady()>0&&tname()!='下一页元素'">同时发现{{numOfReady()}}个同类元素，</span>您可以:
                    <div class="innercontent">
                        <div v-if="numOfReady()>0 && !selectStatus"> <a v-on:mousedown="selectAll">选中全部</a> <span title="">☺</span></div>
                        <div v-if="existDescendents()&& !selectStatus &&(tname()=='元素' || tname()=='链接')"> <a v-on:mousedown="selectDescendents">选中子元素</a> <span title="">☺</span></div>
                        <div v-if="!selectedDescendents && !selectStatus" id="Single">
                            <div v-if="tname()=='选择框'"> <a>循环切换下拉选项</a><span title="">☺</span></div>
                            <div v-if="tname()=='文本框'"> <a v-on:mousedown="setInput">输入文字</a><span title="">☺</span></div>
                            <div v-if="tname()!='图片'"> <a v-on:mousedown="getText">采集该{{tname()}}的文本</a><span title="采集文本">☺</span></div>
                            <div v-if="tname()=='选择框'"> <a>采集选中项的文本</a><span title="">☺</span></div>
                            <div v-if="tname()=='链接'||tname()=='图片'"> <a v-on:mousedown="getLink">采集该{{tname()}}的地址</a><span title="">☺</span></div>
                            <div v-if="tname()!='选择框' && tname()!='文本框'"> <a v-on:mousedown="clickElement">点击该{{tname()}}</a><span title="">☺</span></div>
                            <div v-if="tname()!='选择框' && tname()!='文本框'"> <a v-on:mousedown="loopClickSingleElement">循环点击该{{tname()}}</a><span title="">☺</span></div>
                            <div v-if="tname()=='链接'||tname()=='元素'"> <a v-on:mousedown="getInnerHtml">采集该{{tname()}}的Inner Html</a><span title="">☺</span></div>
                            <div> <a v-on:mousedown="getOuterHtml">采集该{{tname()}}的Outer Html</a><span title="">☺</span></div>
                            <div> <a href="#">鼠标移动到该{{tname()}}上</a><span title="">☺</span></div>
                            <div v-if="tname()=='文本框'"> <a>识别验证码</a><span title="">☺</span></div>
                        </div>
                        <div v-if="selectedDescendents" id="Single">
                            <div><a v-on:mousedown="confirmCollectSingle">采集数据</a><span title="">☺</span></div>
                        </div>
                        <div v-if="selectStatus" id="Confirm">
                            <div><a v-on:mousedown="confirmCollectSingle">确认采集</a><span title="">☺</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="list.nl.length>1">

                <div v-if="option==100">
                    ● 已选择了以下元素，您可以：
                    <div class="innercontent">
                        <div> <a v-on:mousedown="confirmCollectMulti">采集数据</a><span title="">☺</span> </div>
                        <div> <a v-on:mousedown="revoke">撤销本次选择</a><span title="">☺</span></div>
                    </div>
                </div>

                <div v-if="option!=100">
                    ● 已选择了{{numOfList()}}个同类元素，<span v-if="numOfReady()>0">另外发现{{numOfReady()}}个同类元素，</span>您可以：
                    <div class="innercontent">
                        <div v-if="numOfReady()>0"> <a v-on:mousedown="selectAll">选中全部</a><span title="">☺</span></div>
                        <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"> <a v-on:mousedown="selectDescendents">选中子元素</a><span title="">☺</span></div>
                        <div> <a v-on:mousedown="confirmCollectMultiAndDescendents">采集数据</a><span title="">☺</span></div>
                        <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"> <a  v-on:mousedown="loopClickEveryElement">循环点击每个{{tname()}}</a><span title="">☺</span></div>
                        <div> <a v-on:mousedown="revoke">撤销本次选择</a><span title="">☺</span></div>
                    </div>
                </div>
            
            </div>

            <div v-if="valTable.length>0">
                <div class="toolkitcontain">{{setWidth("290px")}}
                    <table class="toolkittb2" cellspacing="0">
                        <tbody>
                            <th v-for="i in list.opp">{{i["name"]}}</th>
                            <th style="width:40px">删除</td>
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
            
            <div v-if="valTable.length==0&&tname()!='下一页元素'">{{setWidth("230px")}}</div>

            <div v-if="list.nl.length>0" style="bottom:12px;position:absolute;color:black!important;left:17px;font-size:13px">
                <div style="margin-bottom:5px">
                    <button v-on:mousedown="cancel">取消选择</button>
                    <button v-if="!selectStatus" v-on:mousedown="enlarge">扩大选区</button>
                </div>
                <p style="margin-left:16px;margin-bottom:0px">{{lastElementXPath()}}</p>
            </div>
        </div>
        <div v-if="page==1">
            ● 请输入文字：
            <input type="text" v-model="text" autofocus="autofocus" id="WTextBox"></input>
            <button v-on:click="getInput" style="margin-left:0px!important;">确定</button>
            <button v-on:click="cancelInput" style="margin-left:0px!important;">取消</button>
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
            valTable: [], // 用来存储转换后的参数列表
            special: false, //是否为特殊选择模式
            selectedDescendents: false, // 标记是否选中了子元素
            selectStatus: false, //标记单个元素是否点击了采集
            page: 0, //默认页面，1为输入文字页面
            text: "", // 记录输入的文字
            tNodeName: "", // 记录临时节点列表
            nowPath: "", //现在元素的xpath
        },
        watch: {
            nowPath: { //变量发生变化的时候进行一些操作
                handler: function(newVal, oldVal) {
                    console.log("xpath:", newVal);
                }
            }
        },
        methods: {
            initial: function() { //每当元素是0的时候，执行值的初始化操作
                this.selectedDescendents = false;
                this.selectStatus = false;
                this.nowPath = "";
            },
            confirmCollectSingle: function() { //单元素确认采集
                collectSingle();
                clearEl();
            },
            confirmCollectMulti: function() { //无规律多元素确认采集
                collectMultiNoPattern();
                clearEl();
            },
            confirmCollectMultiAndDescendents: function() { //有规律多元素确认采集
                collectMultiWithPattern();
                clearEl();
            },
            deleteSingleLine: function(event) { //删除单行元素
                let at = new Date().getTime()
                    //流程图送元素的时候，默认的使用不固定循环列表，但是一旦有删除元素的操作发生，则按照固定元素列表采集元素
                index = event.target.getAttribute("index");
                let tnode = nodeList.splice(index, 1)[0]; //删掉当前元素
                tnode["node"].style.backgroundColor = tnode["bgColor"];
                tnode["node"].style.boxShadow = tnode["boxShadow"];
                if (nodeList.length > 1) { // 如果删到没有就没有其他的操作了
                    handleElement();
                    if (this.selectedDescendents) {
                        handleDescendents(); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
                    }
                } else {
                    this.valTable = [];
                    this.selectStatus = false;
                    clearParameters(); //直接撤销重选
                }
                let at2 = parseInt(new Date().getTime());
                console.log("delete:", at2, at, at2 - at);
            },
            clickElement: function() { //点击元素操作
                sendSingleClick();
                //先发送数据
                nodeList[0]["node"].focus(); //获得元素焦点
                nodeList[0]["node"].click(); //点击元素
                clearEl();
            },
            loopClickSingleElement: function() { //循环点击单个元素
                sendLoopClickSingle(this.tname()); //识别下一页,循环点击单个元素和点击多个元素
                if (this.tname() != "下一页元素") { //下一页元素不进行点击操作
                    nodeList[0]["node"].focus(); //获得元素焦点
                    nodeList[0]["node"].click(); //点击元素
                }
                clearEl();
            },
            loopClickEveryElement: function() { //循环点击每个元素
                sendLoopClickEvery(); //识别下一页,循环点击单个元素和点击多个元素
                nodeList[0]["node"].focus(); //获得元素焦点
                nodeList[0]["node"].click(); //点击元素
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
                // nodeList[0]["node"].setAttribute("value", this.text); // 设置输入框内容
                input(this.text); // 设置输入
                this.text = "";
                clearEl();
            },
            cancelInput: function() {
                this.page = 0;
            },
            setWidth: function(width) { //根据是否出现表格调整最外框宽度
                $(".tooltips").css("width", width);
                return "";
            },
            getText: function() { //采集文字
                generateParameters(0, true, false);
                this.selectStatus = true;
                clearReady();
            },
            getLink: function() { //采集链接地址
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
                if (inputType != null) { //如果没有type属性，则默认为text
                    inputType = inputType.toLowerCase();
                } else {
                    inputType = "text";
                }
                if (tag == "") {
                    return "null";
                } else if ($(nodeList[0]["node"]).contents().filter(function() { return this.nodeType === 3; }).text().indexOf("下一页") >= 0) {
                    this.setWidth("250px");
                    return "下一页元素";
                } else if (tag == "A") {
                    return "链接";
                } else if (tag == "IMG") {
                    return "图片";
                } else if (tag == "BUTTON" || (tag == "INPUT" && (inputType == "button" || inputType == "submit"))) {
                    return "按钮";
                } else if (tag == "TEXTAREA" || (tag == "INPUT" && (inputType != "checkbox" || inputType != "ratio"))) { //普通输入框
                    return "文本框";
                } else if (tag == "SELECT") {
                    return "选择框";
                } else {
                    return "元素";
                }
            },
            existDescendents: function() { //检测选中的元素是否存在子元素,已经选中了子元素也不要再出现了
                return nodeList.length > 0 && nodeList[0]["node"].children.length > 0 && !this.selectedDescendents;
            },
            numOfReady: function() {
                return readyList.length;
            },
            numOfList: function() {
                return nodeList.length;
            },
            lastElementXPath: function() { //用来显示元素的最大最后5个xpath路劲元素
                path = nodeList[nodeList.length - 1]["xpath"];
                path = path.split("/");
                tp = "";
                if (path.length > 5) { //只保留最后五个元素
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
            specialSelect: function() { //特殊选择模式
                if (mousemovebind) {
                    tdiv.style.pointerEvents = "none";
                    this.special = false;
                } else {
                    this.special = true;
                }
                mousemovebind = !mousemovebind;
            },
            enlarge: function() { // 扩大选区功能，总是扩大最后一个选中的元素的选区
                if (nodeList[nodeList.length - 1]["node"].tagName != "BODY") {
                    nodeList[nodeList.length - 1]["node"].style.backgroundColor = nodeList[nodeList.length - 1]["bgColor"]; //之前元素恢复原来的背景颜色
                    nodeList[nodeList.length - 1]["node"].style.boxShadow = nodeList[nodeList.length - 1]["boxShadow"]; //之前元素恢复原来的背景颜色
                    tNode = nodeList[nodeList.length - 1]["node"].parentNode; //向上走一层
                    if (tNode != NowNode) { //扩大选区之后背景颜色的判断，当前正好选中的颜色应该是不同的
                        sty = tNode.style.backgroundColor;
                    } else {
                        sty = style;
                    }
                    nodeList[nodeList.length - 1]["node"] = tNode;
                    nodeList[nodeList.length - 1]["bgColor"] = sty;
                    nodeList[nodeList.length - 1]["xpath"] = readXPath(tNode, 1);
                    //显示框
                    var pos = tNode.getBoundingClientRect();
                    div.style.display = "block";
                    div.style.height = tNode.offsetHeight + "px";
                    div.style.width = tNode.offsetWidth + "px";
                    div.style.left = pos.left + "px";
                    div.style.top = pos.top + "px";
                    div.style.zIndex = 2147483645;
                    div.style.pointerEvents = "none";
                    handleElement(); //每次数组元素有变动，都需要重新处理下
                    oe = tNode;
                    tNode.style.backgroundColor = "rgba(0,191,255,0.5)";
                    this.selectedDescendents = false;
                }
            },
            selectAll: function() { //选中全部元素
                step++;
                readyToList(step, false);
                handleElement();
                if (this.selectedDescendents) {
                    handleDescendents(); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
                }
            },
            revoke: function() { //撤销选择当前节点
                var tstep = step;
                step--; //步数-1
                while (tstep == nodeList[nodeList.length - 1]["step"]) //删掉所有当前步数的元素节点
                {
                    let node = nodeList.splice(nodeList.length - 1, 1)[0]; //删除数组最后一项
                    node["node"].style.backgroundColor = node["bgColor"]; //还原原始属性和边框
                    node["node"].style.boxShadow = node["boxShadow"];
                    if (NowNode == node["node"]) {
                        style = node["bgColor"];
                    }
                    //处理已经有选中子元素的情况
                    // if (this.selectedDescendents) {
                    clearParameters(); //直接撤销重选
                    // }
                }
                handleElement(); //每次数组元素有变动，都需要重新处理下
            },
            selectDescendents: function() { //选择所有子元素操作
                handleDescendents();
            }
        },
    });
    h = $(".tooldrag").height();
    difference = 26 - h; //获得高度值差
    if (difference > 0) {
        $(".tooldrag").css("cssText", "height:" + (26 + difference) + "px!important")
    }
    timer = setInterval(function() { //时刻监测相应元素是否存在(防止出现如百度一样元素消失重写body的情况)，如果不存在，添加进来
        if (document.body != null && document.getElementById("wrapperToolkit") == null) {
            this.clearInterval(); //先取消原来的计时器，再设置新的计时器
            document.body.append(div); //默认如果toolkit不存在则div和tdiv也不存在
            document.body.append(tdiv);
            document.body.append(toolkit);
            generateToolkit();
            // var list = document.getElementsByTagName("a");
            // // 对于没有特殊绑定函数的a标签，使他们在新标签页中打开
            // for (var i = 0; i < list.length; i++) {
            //     if (list[i].href.indexOf("javascript") == -1 && list[i].href.indexOf("void") == -1 && list[i].href.indexOf("#") == -1 && list[i].href) {
            //         list[i].setAttribute("target", "_blank");
            //     }
            // };
            // list = document.getElementsByTagName("form");
            // // 对于没有特殊绑定函数的form标签，使他们在新标签页中打开
            // for (var i = 0; i < list.length; i++) {
            //     list[i].setAttribute("target", "_blank");
            // };
        }
    }, 3000);
}

//每次对元素进行增删之后需要执行的操作
function handleElement() {
    clearReady(); //预备元素每次处理都先处理掉
    if (nodeList.length > 1) { //选中了许多元素的情况
        app._data.option = relatedTest();
        if (app._data.option == 100) {
            generateMultiParameters();
        } else {
            generateParameters(0);
        }
    } else if (nodeList.length == 1) {
        findRelated(); //寻找和元素相关的元素
    }
}

function clearParameters(deal = true) //清空参数列表
{
    if (deal) //是否取消对选中的子元素进行处理
    {
        app._data.selectedDescendents = false;
    }
    for (o of outputParameterNodes) {
        o["node"].style.boxShadow = o["boxShadow"];
    }
    outputParameterNodes.splice(0);
    outputParameters.splice(0); //清空原来的参数列表
    app._data.valTable = []; //清空展现数组
    app._data.selectStatus = false;
}


//根据nodelist列表内的元素生成参数列表
//适合：nodelist中的元素为同类型元素
//type:0为全部文本 1为节点内直接的文字 2为innerhtml 3为outerhtml
//nodetype:0,对应全type0123
//nodetype:1 链接，对应type0123
//nodetype:2 链接地址 对应type0
//nodetype:3 按钮和输入文本框 对应type
//nodetype:4 按钮和输入文本框 对应type

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
            let pname = "文本";
            let ndText = "";
            if (type == 0) {
                ndText = $(nd).text();
                pname = "文本";
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : $(nd).prop("src");
                    pname = "地址";
                } else if (nd.tagName == "INPUT") {
                    ndText = nd.getAttribute("value") == null ? "" : nd.getAttribute("value");
                }
            } else if (type == 1) {
                ndText = $(nd).contents().filter(function() { return this.nodeType === 3; }).text().replace(/\s+/g, '');
                pname = "文本";
                if (nd.tagName == "IMG") {
                    ndText = nd.getAttribute("src") == null ? "" : $(nd).prop("src");
                    pname = "地址";
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
            if (num == 0) { //第一个节点新建，后面的增加即可
                if (nd.tagName == "IMG") { //如果元素是图片
                    outputParameters.push({
                        "nodeType": 4, //节点类型
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "参数" + (n++) + "_图片" + pname,
                        "desc": "", //参数描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                } else if (nd.tagName == "A") { //如果元素是超链接
                    if (linktext) {
                        outputParameters.push({
                            "nodeType": 1,
                            "contentType": type, // 内容类型
                            "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": "参数" + (n++) + "_链接" + pname,
                            "desc": "", //参数描述
                            "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                            "exampleValues": [{ "num": num, "value": ndText }]
                        });
                    }
                    if (linkhref) {
                        outputParameters.push({
                            "nodeType": 2,
                            "contentType": type, // 内容类型
                            "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                            "name": "参数" + (n++) + "_链接地址",
                            "desc": "", //参数描述
                            "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                            "exampleValues": [{ "num": num, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") }]
                        });
                    }
                } else if (nd.tagName == "INPUT") { //如果元素是输入项
                    outputParameters.push({
                        "nodeType": 3,
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "参数" + (n++) + "_" + pname,
                        "desc": "", //参数描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                } else { //其他所有情况
                    outputParameters.push({
                        "nodeType": 0,
                        "contentType": type, // 内容类型
                        "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                        "name": "参数" + (n++) + "_" + pname,
                        "desc": "", //参数描述
                        "relativeXpath": nodeList.length > 1 ? "" : ndPath,
                        "exampleValues": [{ "num": num, "value": ndText }]
                    });
                }
            } else { //如果元素节点已经存在，则只需要插入值就可以了
                if (nd.tagName == "IMG") { //如果元素是图片
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                } else if (nd.tagName == "A") { //如果元素是超链接
                    outputParameters[0]["exampleValues"].push({ "num": num, "value": ndText });
                    outputParameters[1]["exampleValues"].push({ "num": num, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") });
                } else if (nd.tagName == "INPUT") { //如果元素是输入项
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

//根据nodelist列表内的元素生成参数列表
//适合：nodelist中的元素为不同类型元素
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
            if (nd.tagName == "IMG") { //如果元素是图片
                outputParameters.push({
                    "nodeType": 4, //节点类型
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "参数" + (n++) + "_图片地址",
                    "desc": "", //参数描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src") }]
                });
            } else if (nd.tagName == "A") { //如果元素是超链接
                outputParameters.push({
                    "nodeType": 1,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "参数" + (n++) + "_链接文本",
                    "desc": "", //参数描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": ndText }]
                });
                outputParameters.push({
                    "nodeType": 2,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "参数" + (n++) + "_链接地址",
                    "desc": "", //参数描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href") }]
                });
            } else if (nd.tagName == "INPUT") { //如果元素是输入项
                outputParameters.push({
                    "nodeType": 3,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "参数" + (n++) + "_文本",
                    "desc": "", //参数描述
                    "relativeXpath": ndPath,
                    "exampleValues": [{ "num": 0, "value": nd.getAttribute("value") == null ? "" : nd.getAttribute("value") }]
                });
            } else { //其他所有情况
                outputParameters.push({
                    "nodeType": 0,
                    "contentType": 0, // 内容类型
                    "relative": false, //是否为相对xpath路径
                    "name": "参数" + (n++) + "_文本",
                    "desc": "", //参数描述
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


//处理子元素,对于每个块中多出的特殊元素，需要特殊处理
function handleDescendents() {
    let n = 1;
    chrome.storage.local.get({ parameterNum: 1 }, function(items) {
        let at = parseInt(new Date().getTime());
        n = items.parameterNum;
        clearParameters(); //清除原来的参数列表
        app._data.selectedDescendents = true;
        for (let num = 0; num < nodeList.length; num++) {
            let tnode = nodeList[num]["node"];
            let stack = new Array(); //深度优先搜索遍历元素
            stack.push(tnode); //从此节点开始
            while (stack.length > 0) {
                let nd = stack.pop(); // 挨个取出元素
                if (nd.parentNode.tagName == "A" && nd.tagName == "SPAN") {
                    continue; //对A标签内的SPAN元素不进行处理,剪枝，此时子元素根本不加入stack，即实现了此功能
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
                if (index == -1) { //从第二个节点开始，只插入那些不在参数列表中的元素，根据xpath进行寻址
                    //如果当前节点除了子元素外仍然有其他文字或者该元素是图片/表单项，加入子元素节点
                    if (ndText != "" || nd.tagName == "IMG" || nd.tagName == "INPUT" || nd.tagName == "A") {
                        if (nd.tagName == "IMG") { //如果元素是图片
                            outputParameters.push({
                                "nodeType": 4, //节点类型
                                "contentType": 1, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径,注意当只选择了子元素没有选中全部的时候，需要判断
                                "name": "参数" + (n++) + "_图片地址",
                                "desc": "", //参数描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd), //同理需要判断
                                "exampleValues": [{
                                    "num": num,
                                    "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src")
                                }]
                            });
                        } else if (nd.tagName == "A") { //如果元素是超链接
                            outputParameters.push({
                                "nodeType": 1,
                                "contentType": 0, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "参数" + (n++) + "_链接文本",
                                "desc": "", //参数描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{ "num": num, "value": $(nd).text() }] //注意这里的ndtext是整个a的文字！！！
                            });
                            outputParameters.push({
                                "nodeType": 2,
                                "contentType": 0, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "参数" + (n++) + "_链接地址",
                                "desc": "", //参数描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{
                                    "num": num,
                                    "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href")
                                }]
                            });
                        } else if (nd.tagName == "INPUT") { //如果元素是输入项
                            outputParameters.push({
                                "nodeType": 3,
                                "contentType": 1, // 内容类型
                                "relative": nodeList.length > 1 ? true : false, //是否为相对xpath路径
                                "name": "参数" + (n++) + "_文本",
                                "desc": "", //参数描述
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
                                "name": "参数" + (n++) + "_文本",
                                "desc": "", //参数描述
                                "relativeXpath": nodeList.length > 1 ? ndPath : readXPath(nd),
                                "exampleValues": [{ "num": num, "value": ndText }]
                            });
                        }
                    }
                } else //如果元素节点已经存在，则只需要插入值就可以了
                {
                    if (nd.tagName == "IMG") { //如果元素是图片
                        outputParameters[index]["exampleValues"].push({
                            "num": num,
                            "value": nd.getAttribute("src") == null ? "" : $(nd).prop("src")
                        });
                    } else if (nd.tagName == "A") { //如果元素是超链接
                        outputParameters[index]["exampleValues"].push({ "num": num, "value": $(nd).text() });
                        outputParameters[index + 1]["exampleValues"].push({
                            "num": num,
                            "value": nd.getAttribute("href") == null ? "" : $(nd).prop("href")
                        });
                    } else if (nd.tagName == "INPUT") { //如果元素是输入项
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
        console.log("选中子元素", at2, at, at2 - at);
        generateValTable();
    });

}


//根据参数列表生成可视化参数界面
function generateValTable(multiline = true) {
    let paravalues = [];
    for (let i = 0; i < outputParameters.length; i++) {
        let tvalues = [];
        let tindex = 0;
        let l = multiline ? nodeList.length : 1;
        for (let j = 0; j < l; j++) {
            //注意第一个循环条件，index超出界限了就不需要再寻找了，其他的全是空
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

// 选中第一个节点，自动寻找同类节点
// 方法：/div[1]/div[2]/div[2]/a[1]
// 从倒数第一个节点开始找，看去掉方括号之后是否元素数目变多，如上面的变成/div[1]/div[2]/div[2]/a
// 如果没有，则恢复原状，然后试试倒数第二个：/div[1]/div[2]/div/a[1]
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
        result.iterateNext(); //枚举第一个元素
        if (result.iterateNext() != null) { //如果能枚举到第二个元素，说明存在同类元素,选中同类元素，结束循环
            app.$data.nowPath = tempPath; //标记此元素xpath
            pushToReadyList(tempPath);
            break;
        }
    }
    let at2 = parseInt(new Date().getTime());
    console.log("findRelated：", at2, at, at2 - at);
}


//根据path将元素放入readylist中
function pushToReadyList(path) {
    result = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
    var node = result.iterateNext(); //枚举第一个元素
    while (node) { //只添加不在已选中列表内的元素
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
        node = result.iterateNext(); //枚举下一个元素
    }
}

//将readyList中的元素放入选中节点中
function readyToList(step, dealparameters = true) {
    for (o of readyList) {
        nodeList.push({ node: o["node"], "step": step, bgColor: o["bgColor"], "boxShadow": o["boxShadow"], xpath: readXPath(o["node"], 1) });
        o["node"].style.backgroundColor = selectedColor;
    }
    clearReady();
    if (dealparameters) { //防止出现先选中子元素再选中全部失效的问题
        generateParameters(0); //根据nodelist列表内的元素生成参数列表，0代表纯文本
    }

}

//根据节点列表和索引列表生成XPATH
// 如：["html","body","div"],[-1,-1,2],生成/html/body/div[2]
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

//专门测试已经选中的这些元素之间有没有相关性
// 举例：
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[3]/a[22]
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div[2]/div[3]/a[25]
// 最终转换为：
// /html/body/div[3]/div[1]/div[1]/div[1]/div[3]/div/div[3]/a
function relatedTest() {
    let at = new Date().getTime()
    var testList = [];
    var testpath = "";
    for (i = 0; i < nodeList.length; i++) {
        var testnumList = []; //用于比较节点索引号不同
        var tpath = nodeList[i]["xpath"].split("/").splice(1); //清理第一个空元素
        for (j = 0; j < tpath.length; j++) {
            if (tpath[j].indexOf("[") >= 0) { //如果存在索引值
                testnumList.push(parseInt(tpath[j].split("[")[1].replace("]", ""))); //只留下数字
            } else {
                testnumList.push(-1);
            }
            tpath[j] = tpath[j].split("[")[0];
        }
        tp = tpath.join("/");
        if (i > 0 && testpath != tp) { //如果去除括号后元素内存在不一致情况，直接返回默认情况代码100
            app.$data.nowPath = ""; //标记此元素xpath
            return 100;
        }
        testpath = tp;
        testList.push(testnumList);
    }
    testpath = testpath.split("/"); //清理第一个空元素
    var indexList = []; //记录新生成的xpath
    //如果选中的元素属于同样的序列，则计算出序列的最佳xpath表达式
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
    app.$data.nowPath = finalPath; //标记此元素xpath
    pushToReadyList(finalPath);
    let at2 = parseInt(new Date().getTime());
    console.log("手动：", at2, at, at2 - at);
    return 50; //先返回给默认码
}

//实现提示框拖拽功能
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