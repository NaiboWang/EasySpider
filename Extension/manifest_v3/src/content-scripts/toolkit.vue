<template>
  <div id="realcontent">
    <div v-if="lang == 'zh'">
      <div class="tooldrag">✍操作提示框（可点此拖动）</div>
      <div class="realcontent">
        <div v-if="page==0">
          <input style="width:15px;height:15px;vertical-align:middle;" type="checkbox"
                 v-on:mousedown="specialSelect"/>
          <p style="margin-bottom:10px;display:inline-block">特殊点选模式</p>
          <div v-if="list.nl.length==0" :style="{overflow: 'auto', maxHeight: winHeight * 0.4 + 'px'}">
            <p style="color:black; margin-top: 10px">● 鼠标移动到元素上后，请<strong>右键</strong>点击或者按<strong>F7</strong>键选中页面元素。
            </p>
            <p style="color:black; margin-top: 10px">● 通过鼠标左键进行点击时，页面也会有反应，但此点击操作不会被记录在任务流程中。
            </p>
            <p style="color:black; margin-top: 10px">● 同理，如果想输入文本框但并不想将动作记录（如想要在数据模式输入密码，仅此一次的操作，下次加载页面已经是已登录状态），可以鼠标移动到文本框，并按键盘的<strong>F9</strong>进行输入。</p>
            <p style="color:black; margin-top: 10px">● 如果不小心左键点选了元素导致页面跳转，直接后退或者切换回标签页即可。</p>
            {{ initial() }}
          </div>
          <div v-if="list.nl.length==1">
            <div v-if="tname()!='null'">
              ● 已选中{{ numOfList() }}个{{ tname() }}，<span
                v-if="numOfReady()>0&&tname()!='下一页元素'">同时发现{{ numOfReady() }}个同类元素，</span>您可以:
              <div class="innercontent">
                <div v-if="numOfReady()>0 && !selectStatus"><a v-on:mousedown="selectAll">选中全部</a> <span
                    title="">☺</span></div>
                <div v-if="existDescendents()&& !selectStatus &&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">选中子元素</a> <span title="">☺</span></div>
                <div v-if="!selectedDescendents && !selectStatus" id="Single">
                  <div v-if="tname()=='选择框'"><a>循环切换下拉选项</a><span title="">☺</span></div>
                  <div v-if="tname()=='文本框'"><a v-on:mousedown="setInput">输入文字</a><span title="">☺</span></div>
                  <div v-if="tname()!='图片'"><a v-on:mousedown="getText">采集该{{ tname() }}的文本</a><span
                      title="采集文本">☺</span></div>
                  <div v-if="tname()=='选择框'"><a>采集选中项的文本</a><span title="">☺</span></div>
                  <div v-if="tname()=='链接'||tname()=='图片'"><a
                      v-on:mousedown="getLink">采集该{{ tname() }}的地址</a><span title="">☺</span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a
                      v-on:mousedown="clickElement">点击该{{ tname() }}</a><span title="">☺</span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a
                      v-on:mousedown="loopClickSingleElement">循环点击该{{ tname() }}</a><span title="">☺</span></div>
                  <div v-if="tname()=='链接'||tname()=='元素'"><a v-on:mousedown="getInnerHtml">采集该{{
                      tname()
                    }}的Inner
                    Html</a><span title="">☺</span></div>
                  <div><a v-on:mousedown="getOuterHtml">采集该{{ tname() }}的Outer Html</a><span title="">☺</span></div>
                  <div><a href="#">鼠标移动到该{{ tname() }}上</a><span title="">☺</span></div>
                  <div v-if="tname()=='文本框'"><a>识别验证码</a><span title="">☺</span></div>
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
                <div><a v-on:mousedown="confirmCollectMulti">采集数据</a><span title="">☺</span></div>
                <div><a v-on:mousedown="revoke">撤销本次选择</a><span title="">☺</span></div>
              </div>
            </div>

            <div v-if="option!=100">
              ● 已选择了{{ numOfList() }}个同类元素，<span
                v-if="numOfReady()>0">另外发现{{ numOfReady() }}个同类元素，</span>您可以：
              <div class="innercontent">
                <div v-if="numOfReady()>0"><a v-on:mousedown="selectAll">选中全部</a><span title="">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">选中子元素</a><span title="">☺</span></div>
                <div><a v-on:mousedown="confirmCollectMultiAndDescendents">采集数据</a><span title="">☺</span></div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopClickEveryElement">循环点击每个{{ tname() }}</a><span title="">☺</span></div>
                <div><a v-on:mousedown="revoke">撤销本次选择</a><span title="">☺</span></div>
              </div>
            </div>
          </div>
          <div v-if="valTable.length>0">
            <div class="toolkitcontain">{{ setWidth("290px") }}
              <table cellSpacing="0" class="toolkittb2">
                <tbody>
                <th v-for="i in list.opp">{{ i["name"] }}</th>
                <th style="width:40px">删除</th>
                </tbody>
              </table>
              <table cellSpacing="0" class="toolkittb4">
                <tbody>
                <tr v-for="i in valTable[0].length">
                  <td v-for="j in list.opp.length">{{ valTable[j - 1][i - 1] }}</td>
                  <td style="font-size: 22px!important;width:40px;cursor:pointer" v-bind:index="i-1"
                      v-on:mousedown="deleteSingleLine">×
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div v-if="valTable.length==0&&tname()!='下一页元素'">{{ setWidth("290px") }}</div>

          <div v-if="list.nl.length>0"
               style="bottom:12px;position:absolute;color:black!important;left:17px;font-size:13px">
            <div style="margin-bottom:5px">
              <button v-on:mousedown="cancel">取消选择</button>
              <button v-if="!selectStatus" v-on:mousedown="enlarge">扩大选区</button>
            </div>
            <p style="margin-left:16px;margin-bottom:0px">{{ lastElementXPath() }}</p>
          </div>
        </div>
        <div v-if="page==1">
          ● 请输入文字：
          <input id="WTextBox" v-model="text" autoFocus="autofocus" type="text"></input>
          <button style="margin-left:0px!important;" v-on:click="getInput">确定</button>
          <button style="margin-left:0px!important;" v-on:click="cancelInput">取消</button>
          <div class="innercontent">
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="lang=='en'">
      <div class="tooldrag">✍Operation Toolbox (Can drag)</div>
      <div class="realcontent">
        <div v-if="page==0">
          <input style="width:15px;height:15px;vertical-align:middle;" type="checkbox"
                 v-on:mousedown="specialSelect"> </input>
          <p style="margin-bottom:10px;display:inline-block">Special click mode</p>
          <div v-if="list.nl.length==0" :style="{overflow: 'auto', maxHeight: winHeight * 0.4 + 'px'}">
            <p style="color:black">● When your mouse moves to the element, please <strong>right-click</strong> your
              mouse button or press <strong>F7</strong> on the keyboard to select it.</p>
            <p style="color:black; margin-top: 10px">● When clicked with the left mouse button, the page will also respond, but this click operation will not be recorded in the task flow.</p>
            <p style="color:black; margin-top: 10px">● Similarly, if you want to input in a text box but do not want the action to be recorded (such as wanting to input a password in data mode, this operation is only performed once, and the next time the page is loaded, it is already logged in), you can move the mouse to the text box and press <strong>F9</strong> on the keyboard to input.</p>
            <p style="color:black; margin-top: 10px">● If you accidentally left-click on an element and cause the page to jump, simply go back or switch back to the tab.</p>
            {{ initial() }}
          </div>
          <div v-if="list.nl.length==1">
            <div v-if="tname()!='null'">
              ● Already selected {{ numOfList() }} {{ tname() | toEng }}, <span
                v-if="numOfReady()>0&&tname()!='下一页元素'"> meanwhile we find {{ numOfReady() }} element with the same type, </span>you
              can:
              <div class="innercontent">
                <div v-if="numOfReady()>0 && !selectStatus"><a v-on:mousedown="selectAll">Select All</a><span
                    title="">☺</span></div>
                <div v-if="existDescendents()&& !selectStatus &&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">Select child elements</a> <span title="">☺</span></div>
                <div v-if="!selectedDescendents && !selectStatus" id="Single">
                  <!-- <div v-if="tname()=='selection box'"> <a>循环切换该下拉项</a><span title="">☺</span></div> -->
                  <div v-if="tname()=='文本框'"><a v-on:mousedown="setInput">Input Text</a><span title="">☺</span>
                  </div>
                  <div v-if="tname()!='图片'"><a v-on:mousedown="getText">Extract {{ tname() | toEng }}'s text</a><span
                      title="collect text">☺</span></div>
                  <div v-if="tname()=='选择框'"><a>Collect text from this element</a><span title="">☺</span>
                  </div>
                  <div v-if="tname()=='链接'||tname()=='图片'"><a v-on:mousedown="getLink">Collect address of this
                    {{ tname() | toEng }}</a><span title="">☺</span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a v-on:mousedown="clickElement">Click
                    this {{ tname() | toEng }}</a><span title="">☺</span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a
                      v-on:mousedown="loopClickSingleElement">Loop-click this {{ tname() | toEng }}</a><span
                      title="">☺</span>
                  </div>
                  <div v-if="tname()=='链接'||tname()=='元素'"><a v-on:mousedown="getInnerHtml">Collect Inner Html of
                    this {{ tname() | toEng }}</a><span title="">☺</span></div>
                  <div><a v-on:mousedown="getOuterHtml">Collect Outer Html of this element</a><span title="">☺</span>
                  </div>
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
              ● Already selected the following element, you can:
              <div class="innercontent">
                <div><a v-on:mousedown="confirmCollectMulti">Collect Data</a><span title="">☺</span></div>
                <div><a v-on:mousedown="revoke">Revoke selection</a><span title="">☺</span></div>
              </div>
            </div>

            <div v-if="option!=100">
              ● Already selected {{ numOfList() }} similar elements, <span
                v-if="numOfReady()>0">and we find other{{ numOfReady() }} similar elements, </span>you can:
              <div class="innercontent">
                <div v-if="numOfReady()>0"><a v-on:mousedown="selectAll">Select All</a><span title="">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">Select child elements</a><span title="">☺</span></div>
                <div><a v-on:mousedown="confirmCollectMultiAndDescendents">Collect Data</a><span title="">☺</span></div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopClickEveryElement">Loop-click every {{ tname() | toEng}}</a><span title="">☺</span>
                </div>
                <div><a v-on:mousedown="revoke">Revoke selection</a><span title="">☺</span></div>
              </div>
            </div>

          </div>

          <div v-if="valTable.length>0">
            <div class="toolkitcontain">{{ setWidth("350px") }}
              <table cellspacing="0" class="toolkittb2">
                <tbody>
                <th v-for="i in list.opp">{{ i["name"] }}</th>
                <th style="width:40px">Delete</th>
                </tbody>
              </table>
              <table cellspacing="0" class="toolkittb4">
                <tbody>
                <tr v-for="i in valTable[0].length">
                  <td v-for="j in list.opp.length">{{ valTable[j - 1][i - 1] }}</td>
                  <td style="font-size: 22px!important;width:40px;cursor:pointer" v-bind:index="i-1"
                      v-on:mousedown="deleteSingleLine">×
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div v-if="valTable.length==0&&tname()!='下一页元素'">{{ setWidth("290px") }}</div>

          <div v-if="list.nl.length>0"
               style="bottom:12px;position:absolute;color:black!important;left:17px;font-size:13px">
            <div style="margin-bottom:5px">
              <button v-on:mousedown="cancel">Deselect</button>
              <button v-if="!selectStatus" v-on:mousedown="enlarge">Expand Path</button>
            </div>
            <p style="margin-left:16px;margin-bottom:0px">{{ lastElementXPath() }}</p>
          </div>
        </div>
        <div v-if="page==1">
          ● Please input text:
          <input id="WTextBox" v-model="text" autofocus="autofocus" type="text"></input>
          <button style="margin-left:0px!important;" v-on:click="getInput">Confirm</button>
          <button style="margin-left:0px!important;" v-on:click="cancelInput">Cancel</button>
          <div class="innercontent">
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script>
import {
  global,
  getOS,
  readXPath,
  addEl,
  clearEl,
  clearReady,
  handleElement,
  clearParameters,
  generateParameters,
  generateMultiParameters,
  handleDescendents,
  generateValTable,
  findRelated,
  pushToReadyList,
  readyToList,
  combineXpath,
  relatedTest
} from "./global.js";
import {
  input,
  sendSingleClick,
  collectSingle,
  collectMultiNoPattern,
  collectMultiWithPattern,
  sendLoopClickSingle,
  sendLoopClickEvery,
  detectAllSelected
} from "./messageInteraction.js";
import $ from "jquery";

export default {
  el: '#realcontent',
  data: {
    lang: global.lang,
    option: 0,
    list: {nl: global.nodeList, opp: global.outputParameters},
    valTable: [], // 用来存储转换后的参数列表
    special: false, //是否为特殊选择模式
    selectedDescendents: false, // 标记是否选中了子元素
    selectStatus: false, //标记单个元素是否点击了采集
    page: 0, //默认页面，1为输入文字页面
    text: "", // 记录输入的文字
    tNodeName: "", // 记录临时节点列表
    nowPath: "", //现在元素的xpath
    winHeight: window.outerHeight,
  },
  mounted(){
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  },
  watch: {
    nowPath: { //变量发生变化的时候进行一些操作
      handler: function (newVal, oldVal) {
        console.log("xpath:", newVal);
      }
    }
  },
  filters: {
    toEng: function (value) {
      if (value == "下一页元素") {
        return "elements in next page";
      } else if (value == "链接") {
        return "link";
      } else if (value == "图片") {
        return "image";
      } else if (value == "按钮") {
        return "button";
      } else if (value == "文本框") {
        return "text box";
      } else if (value == "选择框") {
        return "selection box";
      } else {
        return "element";
      }
    }
  },
  methods: {
    onResize() {
      this.winHeight = window.outerHeight
    },
    initial: function () { //每当元素是0的时候，执行值的初始化操作
      this.selectedDescendents = false;
      this.selectStatus = false;
      this.nowPath = "";
    },
    confirmCollectSingle: function () { //单元素确认采集
      collectSingle();
      clearEl();
    },
    confirmCollectMulti: function () { //无规律多元素确认采集
      collectMultiNoPattern();
      clearEl();
    },
    confirmCollectMultiAndDescendents: function () { //有规律多元素确认采集
      collectMultiWithPattern();
      clearEl();
    },
    deleteSingleLine: function (event) { //删除单行元素
      let at = new Date().getTime()
      //流程图送元素的时候，默认的使用不固定循环列表，但是一旦有删除元素的操作发生，则按照固定元素列表采集元素
      let index = event.target.getAttribute("index");
      let tnode = global.nodeList.splice(index, 1)[0]; //删掉当前元素
      tnode["node"].style.backgroundColor = tnode["bgColor"];
      tnode["node"].style.boxShadow = tnode["boxShadow"];
      if (global.nodeList.length > 1) { // 如果删到没有就没有其他的操作了
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
    clickElement: function () { //点击元素操作
      sendSingleClick();
      //先发送数据
      global.nodeList[0]["node"].focus(); //获得元素焦点
      global.nodeList[0]["node"].click(); //点击元素
      clearEl();
    },
    loopClickSingleElement: function () { //循环点击单个元素
      sendLoopClickSingle(this.tname()); //识别下一页,循环点击单个元素和点击多个元素
      if (this.tname() != "下一页元素") { //下一页元素不进行点击操作
        global.nodeList[0]["node"].focus(); //获得元素焦点
        global.nodeList[0]["node"].click(); //点击元素
      }
      clearEl();
    },
    loopClickEveryElement: function () { //循环点击每个元素
      sendLoopClickEvery(); //识别下一页,循环点击单个元素和点击多个元素
      global.nodeList[0]["node"].focus(); //获得元素焦点
      global.nodeList[0]["node"].click(); //点击元素
      clearEl();
    },
    setInput: function () { //输入文字
      this.page = 1;
      this.$nextTick(function () { //下一时刻获得焦点
        document.getElementById("WTextBox").focus();
      })
    },
    getInput: function () { //得到输入的文字
      global.nodeList[0]["node"].focus(); //获得文字焦点
      if (getOS() == "Mac") {
        global.nodeList[0]["node"].setAttribute("value", this.text); // 设置输入 box内容
      } else{
        global.nodeList[0]["node"].setAttribute("value", ""); // 先设置为空，再设置输入 box内容
      }
      input(this.text); // 设置输入
      this.text = "";
      clearEl();
    },
    cancelInput: function () {
      this.page = 0;
    },
    setWidth: function (width) { //根据是否出现表格调整最外框宽度
      $(".tooltips").css("width", width);
      return "";
    },
    getText: function () { //采集文字
      generateParameters(0, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getLink: function () { //采集链接地址
      generateParameters(0, false, true);
      this.selectStatus = true;
      clearReady();
    },
    getOuterHtml: function () { //采集OuterHtml
      generateParameters(3, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getInnerHtml: function () { //采集InnerHtml
      generateParameters(2, true, false);
      this.selectStatus = true;
      clearReady();
    },
    tname: function () {
      let tag = global.nodeList.length == 0 ? "" : global.nodeList[0]["node"].tagName;
      let inputType = global.nodeList.length == 0 ? "" : global.nodeList[0]["node"].getAttribute("type");
      if (inputType != null) { //如果没有type属性，则默认为text
        inputType = inputType.toLowerCase();
      } else {
        inputType = "text";
      }
      if (tag == "") {
        return "null";
      } else if ($(global.nodeList[0]["node"]).contents().filter(function () {
        return this.nodeType === 3;
      }).text().indexOf("下一页") >= 0) {
        this.setWidth("280px");
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
    existDescendents: function () { //检测选中的元素是否存在子元素,已经选中了子元素也不要再出现了
      return global.nodeList.length > 0 && global.nodeList[0]["node"].children.length > 0 && !this.selectedDescendents;
    },
    numOfReady: function () {
      return global.readyList.length;
    },
    numOfList: function () {
      return global.nodeList.length;
    },
    lastElementXPath: function () { //用来显示元素的最大最后5个xpath路劲元素
      let path = global.nodeList[global.nodeList.length - 1]["xpath"];
      path = path.split("/");
      let tp = "";
      if (path.length > 5) { //只保留最后五个元素
        path = path.splice(path.length - 5, 5);
        tp = ".../"
      }
      for (let i = 0; i < path.length; i++) {
        path[i] = path[i].split("[")[0];
      }
      path = path.join("/");
      path = "Path: " + tp + path;
      return path;
    },
    cancel: function () {
      clearEl();
    },
    specialSelect: function () { //特殊选择模式
      if (mousemovebind) {
        global.tdiv.style.pointerEvents = "none";
        this.special = false;
      } else {
        this.special = true;
      }
      mousemovebind = !mousemovebind;
    },
    enlarge: function () { // 扩大选区功能，总是扩大最后一个选中的元素的选区
      if (global.nodeList[global.nodeList.length - 1]["node"].tagName != "BODY") {
        global.nodeList[global.nodeList.length - 1]["node"].style.backgroundColor = global.nodeList[global.nodeList.length - 1]["bgColor"]; //之前元素恢复原来的背景颜色
        global.nodeList[global.nodeList.length - 1]["node"].style.boxShadow = global.nodeList[global.nodeList.length - 1]["boxShadow"]; //之前元素恢复原来的背景颜色
        let tNode = global.nodeList[global.nodeList.length - 1]["node"].parentNode; //向上走一层
        let sty;
        if (tNode != global.NowNode) { //扩大选区之后背景颜色的判断，当前正好选中的颜色应该是不同的
          sty = tNode.style.backgroundColor;
        } else {
          sty = global.style;
        }
        global.nodeList[global.nodeList.length - 1]["node"] = tNode;
        global.nodeList[global.nodeList.length - 1]["bgColor"] = sty;
        global.nodeList[global.nodeList.length - 1]["xpath"] = readXPath(tNode, 1);
        //显示框
        var pos = tNode.getBoundingClientRect();
        global.div.style.display = "block";
        global.div.style.height = tNode.offsetHeight + "px";
        global.div.style.width = tNode.offsetWidth + "px";
        global.div.style.left = pos.left + "px";
        global.div.style.top = pos.top + "px";
        global.div.style.zIndex = 2147483645;
        global.div.style.pointerEvents = "none";
        handleElement(); //每次数组元素有变动，都需要重新处理下
        global.oe = tNode;
        tNode.style.backgroundColor = "rgba(0,191,255,0.5)";
        this.selectedDescendents = false;
      }
    },
    selectAll: function () { //选中全部元素
      global.step++;
      readyToList(global.step, false);
      handleElement();
      if (this.selectedDescendents) {
        handleDescendents(); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
      }
    },
    revoke: function () { //撤销选择当前节点
      let tstep = global.step;
      global.step--; //步数-1
      console.log(global.step, global.nodeList)
      while (tstep == global.nodeList[global.nodeList.length - 1]["step"]) //删掉所有当前步数的元素节点
      {
        let node = global.nodeList.splice(global.nodeList.length - 1, 1)[0]; //删除数组最后一项
        node["node"].style.backgroundColor = node["bgColor"]; //还原原始属性和边框
        node["node"].style.boxShadow = node["boxShadow"];
        if (global.NowNode == node["node"]) {
          global.style = node["bgColor"];
        }
        //处理已经有选中子元素的情况
        // if (this.selectedDescendents) {
        clearParameters(); //直接撤销重选
        // }
      }
      handleElement(); //每次数组元素有变动，都需要重新处理下
    },
    selectDescendents: function () { //选择所有子元素操作
      handleDescendents();
    }
  },
}

</script>

<style>
.tooltips {
  width: 330px;
  min-height: 300px;
  background-color: white;
  position: fixed;
  z-index: 2147483647;
  right: 30px;
  bottom: 30px;
  font-size: 13px !important;
  font-weight: normal !important;
  border: solid navy 2px;
  -webkit-user-select: none;
  /* 文字不可被选中 */
}

.tooldrag {
  background-color: navy;
  width: 100%;
  text-align: center;
  font-size: 13px;
  height: 26px !important;
  padding-top: 8px !important;
  color: white;
}

.realcontent {
  text-align: left;
  padding-top: 10px !important;
  padding-bottom: 80px !important;
  padding-left: 20px !important;
  padding-right: 10px !important;
}

.innercontent {
  text-align: left;
  padding-top: 5px !important;
  padding-left: 12px !important;
}

.innercontent a {
  display: inline-block;
  text-decoration: none;
  margin-top: 2px !important;
  font-size: 13px;
  color: navy !important;
  cursor: pointer;
  text-decoration: none !important;
}

.innercontent a:hover {
  color: blue !important;
}

.innercontent span {
  font-size: 20px;
  color: navy;
  line-height: normal;
  padding-left: 5px !important;
}

.tooltips button {
  margin-top: 7px !important;
  font-size: 13px;
  border-radius: 5px;
  border: solid 2px navy;
  background-color: white;
  color: navy;
  width: 100px;
  height: 30px;
  cursor: pointer;
  margin-left: 15px !important;
}

.tooltips input[type=text] {
  display: block;
  margin-top: 7px !important;
  padding-left: 5px !important;
  margin-bottom: 7px !important;
  font-size: 15px;
  border-radius: 5px;
  border: solid 2px navy;
  width: 204px;
  height: 30px;
}

.tooltips button:hover {
  color: blue;
}


/* 下面用来对冻结表格首行元素和固定表格宽度和高度设定样式 */

.toolkitcontain {
  border: 1px solid #cdd !important;
  /*width: 280px !important;*/
  /* 上面的宽度设定很重要 */
  height: 150px;
  overflow: auto;
  margin-top: 10px !important;
  position: relative;
}

.toolkitcontain table {
  table-layout: fixed;
  border-spacing: 0!important;
  word-break: break-all;
  word-wrap: break-word;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}

.toolkitcontain th,
.toolkitcontain td,
.toolkitcontain tr {
  border: 1px solid rgb(78, 78, 78) !important;
  height: 25px !important;
  width: 100px !important;
  text-align: center !important;
  font-weight: normal !important;
  overflow: hidden !important;
  font-size: 11px !important;
  padding-left: 1px !important;
  padding-right: 0px !important;
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  vertical-align: middle!important;
}

.toolkitcontain .toolkittb2 {
  position: sticky;
  top: 0px;
  margin-bottom: 0px;
  background-color: azure;
  z-index: 1000;
}

.toolkitcontain .toolkittb4 {
  position: absolute;
}
</style>