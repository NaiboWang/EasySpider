<template>
  <div id="realcontent">
<!--    <div id="EasySpiderResizer" style="width: 10px; height: 10px; background-color: black; position: absolute; left: 0; bottom: 0; cursor: ne-resize;"></div>-->
    <div id="EasySpiderResizer" style="width: 10px; height: 10px; position: absolute; left: 0; top: 0; cursor: nw-resize;"></div>
    <span id="closeButton">&#x2716;</span>
    <div v-if="lang == 'zh'">
      <div class="tooldrag">✍操作台（点此拖动，左上角调整大小）</div>
      <div class="realcontent">
        <div v-if="page==0">
          <div v-if="list.nl.length==0" :style="{overflow: 'auto', maxHeight: winHeight * 0.4 + 'px'}">
            <input style="width:15px;height:15px;vertical-align:middle;" type="checkbox"
                   v-on:mousedown="specialSelect"/>
            <p style="margin-bottom:10px;display:inline-block">特殊点选模式<span title="普通模式下如果不能选中元素可以勾选此项">☺</span></p>
            <div class="innercontent" v-if = "list.nl.length==0">
              <div><a v-on:mousedown="getCurrentTitle">采集当前页面的标题</a><span title="当前页面标题">☺</span></div>
              <div><a v-on:mousedown="getCurrentURL">采集当前页面的网址</a><span title="当前页面URL地址">☺</span></div>
            </div>
            <p style="color:black; margin-top: 10px">● 鼠标移动到笑脸☺查看操作提示。</p>
            <p style="color:black; margin-top: 10px">● 鼠标移动到元素上后，请<strong>右键</strong>点击或者按<strong>F7</strong>键选中页面元素。
            </p>
            <p style="color:black; margin-top: 10px">● 如果此操作台把页面元素挡住了，可以点击此操作台右下角的×按钮键关闭操作台。</p>
            <p style="color:black; margin-top: 10px">● 通过鼠标左键进行点击时，页面也会有反应，但左键点击发生的操作不会被记录在任务流程中；同理，如果想输入文本框但并不想将动作记录，可以鼠标移动到文本框，并按键盘的<strong>F9</strong>进行输入。
            </p>
            <p style="color:black; margin-top: 10px">● 如果不小心左键点选了元素导致页面跳转，直接后退或者切换回标签页即可。</p>
            <p style="color:black; margin-top: 10px">● 操作完成后，如点击”确认采集“后任务流程图内没有”提取数据“操作被添加，<strong>重试一次</strong>即可。</p>
            {{ initial() }}
          </div>
          <div v-if="list.nl.length==1">
            <div v-if="tname()!='null'">
              ● 已选中{{ numOfList() }}个{{ tname() }}，<span
                v-if="numOfReady()>0&&tname()!='下一页元素'">同时发现{{ numOfReady() }}个同类元素（如果不全或不准请继续手动选择其余您认为的同类元素），</span>您可以:
              <div class="innercontent">
                <div v-if="numOfReady()>0 && !selectStatus"><a v-on:mousedown="selectAll">选中全部</a> <span
                    title=""></span></div>
                <div v-if="existDescendents()&& !selectStatus &&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">选中子元素</a> <span title="应选尽选模式，如想使用其他模式请先选中全部再选中子元素">☺</span></div>
                <div v-if="!selectedDescendents && !selectStatus" id="Single">
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="changeSelect">切换下拉选项</a><span title=""></span></div>
                  <div v-if="tname()=='文本框'"><a v-on:mousedown="setInput">输入文字</a><span title=""></span></div>
                  <div v-if="tname()!='图片'"><a v-on:mousedown="getText">采集该{{ tname() }}的文本</a><span
                      title="采集文本"></span></div>
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="getSelectedValue">采集当前选中项的值</a><span title=""></span></div>
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="getSelectedText">采集当前选中项的文本</a><span title=""></span></div>
                  <div v-if="tname()=='链接'||tname()=='图片'"><a
                      v-on:mousedown="getLink">采集该{{ tname() }}的地址</a><span title=""></span></div>
                  <div><a
                      v-on:mousedown="clickElement">点击该{{ tname() }}</a><span title=""></span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a
                      v-on:mousedown="loopClickSingleElement">循环点击该{{ tname() }}</a><span title="常用于循环点击下一页场景">☺</span></div>
                  <div><a v-on:mousedown="getBackgroundPic">采集该{{ tname() }}的背景图片地址</a><span title="部分元素的图片是设定为背景图像的">☺</span></div>
                  <div v-if="tname()=='链接'||tname()=='元素'"><a v-on:mousedown="getInnerHtml">采集该{{
                      tname()
                    }}的Inner
                    Html</a><span title="不包括元素自身标签的HTML">☺</span></div>
                  <div><a v-on:mousedown="getOuterHtml">采集该{{ tname() }}的Outer Html</a><span title="包括元素自身标签的HTML">☺</span></div>

                  <div><a href="#" v-on:mousedown="mouseMove">鼠标移动到该{{ tname() }}上</a><span title=""></span></div>
<!--                  <div v-if="tname()=='文本框'"><a>识别验证码</a><span title="">☺</span></div>-->
                </div>
                <div v-if="selectedDescendents" id="Single">
                  <div><a v-on:mousedown="confirmCollectSingle">采集数据</a><span title=""></span></div>
                </div>
                <div v-if="selectStatus" id="Confirm">
                  <div><a v-on:mousedown="confirmCollectSingle">确认采集</a><span title=""></span></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="list.nl.length>1">

            <div v-if="option==100">
              ● 已选择了以下元素，您可以：
              <div class="innercontent">
                <div><a v-on:mousedown="confirmCollectMulti">采集数据</a><span title=""></span></div>
                <div><a v-on:mousedown="revoke">撤销本次选择</a><span title=""></span></div>
              </div>
            </div>

            <div v-if="option!=100">
              ● 已选择了{{ numOfList() }}个同类元素，<span
                v-if="numOfReady()>0">另外发现{{ numOfReady() }}个同类元素（如果不全或不准请继续手动选择其余您认为的同类元素），</span>您可以：
              <div class="innercontent">
                <div v-if="numOfReady()>0"><a v-on:mousedown="selectAll">选中全部</a><span title=""></span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">选中子元素（应选尽选）</a><span title="每个块的每个子元素都选中进来">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents(1,1)">选中子元素（相对首选块共同元素）</a><span title="只选中和第一个选中块的子元素共同的子元素">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents(1,2)">选中子元素（所有块共同元素）</a><span title="只选中所有块都有的子元素">☺</span></div>
                <div><a v-on:mousedown="confirmCollectMultiAndDescendents">采集数据</a><span title=""></span></div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopClickEveryElement">循环点击每个{{ tname() }}</a><span title="常用于循环点击列表中的链接打开详情页采集场景">☺</span></div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopMouseMove">循环移动到每个{{ tname() }}</a><span title=""></span></div>
                <div><a v-on:mousedown="revoke">撤销本次选择</a><span title=""></span></div>
              </div>
            </div>
          </div>
          <div v-if="valTable.length>0">
            <div class="toolkitcontain">
              <table cellSpacing="0" class="toolkittb2">
                <tbody>
                <th v-for="(i, index) in list.opp"> <div>{{ i["name"] }}</div> <span v-bind:index="index" v-on:mousedown="removeField" title="删除此字段">×</span> </th>
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
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="valTable.length==0&&tname()!='下一页元素'"></div>

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
          <div style="text-align: justify;margin-top: 15px;padding-right: 15px;margin-left: 4px">
            输入&lt;enter&gt;或&lt;ENTER&gt;表示输入完成后模拟按下回车键，适用于只能通过回车键获得数据的情况。
          </div>
        </div>
        <div v-if="page==2">
          <span style="font-size: 15px"> ● 切换模式 </span>
          <select v-model="optionMode" @change="handleSelectChange">
            <option value=0>切换到下一个选项</option>
            <option value=1>按索引值切换选项</option>
            <option value=2>按选项值切换选项</option>
            <option value=3>按选项文本切换选项</option>
          </select>
          <span style="font-size: 15px" v-if="optionMode == 3"> ● 选项文本</span>
          <span style="font-size: 15px" v-if="optionMode == 1"> ● 索引值</span>
          <span style="font-size: 15px" v-if="optionMode == 2"> ● 选项值</span>
          <input id="selectValue" v-if="optionMode != 0" v-model="optionValue" autoFocus="autofocus" type="text"></input>
          <div>
            <button style="margin-left:0px!important;" v-on:click="sendChangeSelect">确定</button>
            <button style="margin-left:0px!important;" v-on:click="cancelInput">取消</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="lang=='en'">
      <div class="tooldrag">✍Toolbox (Can drag, resize at left corner)</div>
      <div class="realcontent">
        <div v-if="page==0">
          <div v-if="list.nl.length==0" :style="{overflow: 'auto', maxHeight: winHeight * 0.4 + 'px'}">
            <input style="width:15px;height:15px;vertical-align:middle;" type="checkbox"
                   v-on:mousedown="specialSelect"> </input>
            <p style="margin-bottom:10px;display:inline-block">Special click mode<span title="If cannot select element by mouse, select this option">☺</span></p>
            <div class="innercontent" v-if = "list.nl.length==0">
              <div><a v-on:mousedown="getCurrentTitle">Collect Title of current page</a><span title="Title of this page">☺</span></div>
              <div><a v-on:mousedown="getCurrentURL">Collect URL of current page</a><span title="URL of this page">☺</span></div>
            </div>
            <p style="color:black">● Mouse move to smiling face ☺ to see operation help.</p>
            <p style="color:black">● When your mouse moves to the element, please <strong>right-click</strong> your
              mouse button or press <strong>F7</strong> on the keyboard to select it.</p>
            <p style="color:black">● If this toolbox blocks the page element, you can click the × button in the
              lower right corner of this toolbox to close it.</p>
            <p style="color:black; margin-top: 10px">● When clicked with the left mouse button, the page will also respond, but this click operation will not be recorded in the task flow. Similarly, if you want to input in a text box but do not want the action to be recorded , you can move the mouse to the text box and press <strong>F9</strong> on the keyboard to input.</p>
            <p style="color:black; margin-top: 10px">● If you accidentally left-click on an element and cause the page to jump, simply go back or switch back to the tab.</p>
            <p style="color:black; margin-top: 10px">● After the operation is completed, such as if no "Collect Data" operation is added in the task flowchart after clicking "Confirm Collect", just <strong> retry </strong> again.</p>
            {{ initial() }}
          </div>
          <div v-if="list.nl.length==1">
            <div v-if="tname()!='null'">
              ● Already selected {{ numOfList() }} {{ tname() | toEng }}, <span
                v-if="numOfReady()>0&&tname()!='下一页元素'"> meanwhile we find {{ numOfReady() }} element with the same type (If unsatisfied with auto-detected similar elements, you can continue to manually select the rest of the elements that you think are similar), </span>you
              can:
              <div class="innercontent">
                <div v-if="numOfReady()>0 && !selectStatus"><a v-on:mousedown="selectAll">Select All</a><span
                    title=""></span></div>
                <div v-if="existDescendents()&& !selectStatus &&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">Select child elements</a> <span title="Greedy Mode, if you want to use other modes, please select 'Select All' option first">☺</span></div>
                <div v-if="!selectedDescendents && !selectStatus" id="Single">
                  <!-- <div v-if="tname()=='selection box'"> <a>循环切换该下拉项</a><span title="">☺</span></div> -->
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="changeSelect">Change selection option</a><span title=""></span></div>
                  <div v-if="tname()=='文本框'"><a v-on:mousedown="setInput">Input Text</a><span title=""></span>
                  </div>
                  <div v-if="tname()!='图片'"><a v-on:mousedown="getText">Extract {{ tname() | toEng }}'s text</a><span
                      title="collect text"></span></div>
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="getSelectedValue">Collect selected option value</a><span title=""></span></div>
                  <div v-if="tname()=='选择框'"><a v-on:mousedown="getSelectedText">Collect selected option text</a><span title=""></span></div>

                  <div v-if="tname()=='链接'||tname()=='图片'"><a v-on:mousedown="getLink">Collect address of this
                    {{ tname() | toEng }}</a><span title=""></span></div>
                  <div><a v-on:mousedown="clickElement">Click
                    this {{ tname() | toEng }}</a><span title=""></span></div>
                  <div v-if="tname()!='选择框' && tname()!='文本框'"><a
                      v-on:mousedown="loopClickSingleElement">Loop-click this {{ tname() | toEng }}</a><span
                      title="Usually used to loop-click the next-page button">☺</span>
                  </div>
                  <div><a v-on:mousedown="getBackgroundPic">Collect background image URL</a><span title="Some elements have background images">☺</span></div>
                  <div v-if="tname()=='链接'||tname()=='元素'"><a v-on:mousedown="getInnerHtml">Collect Inner Html of
                    this {{ tname() | toEng }}</a><span title="HTML not including the tag of this selected element">☺</span></div>
                  <div><a v-on:mousedown="getOuterHtml">Collect Outer Html of this element</a><span title="HTML including the tag of this selected element">☺</span>
                  </div>

                   <div><a href="#" v-on:mousedown="mouseMove">Move mouse to this element</a><span title=""></span></div>
                  <!-- <div v-if="tname()=='text box'"> <a>识别验证码</a><span title="">☺</span></div> -->
                </div>
                <div v-if="selectedDescendents" id="Single">
                  <div><a v-on:mousedown="confirmCollectSingle">Collect Data</a><span title=""></span></div>
                </div>
                <div v-if="selectStatus" id="Confirm">
                  <div><a v-on:mousedown="confirmCollectSingle">Confirm Collect</a><span title=""></span></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="list.nl.length>1">

            <div v-if="option==100">
              ● Already selected the following element, you can:
              <div class="innercontent">
                <div><a v-on:mousedown="confirmCollectMulti">Collect Data</a><span title=""></span></div>
                <div><a v-on:mousedown="revoke">Revoke selection</a><span title=""></span></div>
              </div>
            </div>

            <div v-if="option!=100">
              ● Already selected {{ numOfList() }} similar elements, <span
                v-if="numOfReady()>0">and we find other{{ numOfReady() }} similar elements (If unsatisfied with auto-detected similar elements, you can continue to manually select the rest of the elements that you think are similar), </span>you can:
              <div class="innercontent">
                <div v-if="numOfReady()>0"><a v-on:mousedown="selectAll">Select All</a><span title=""></span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents">Select child elements (Greedy)</a><span title="Select All child elements for all blocks">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents(1,1)">Select child elements (RFSE)</a><span title="Relative to First Selected Element, will only select the common child elements between the first selected block and the rest of the blocks">☺</span></div>
                <div v-if="existDescendents()&&(tname()=='元素' || tname()=='链接')"><a
                    v-on:mousedown="selectDescendents(1,2)">Select child elements (RASE)</a><span title="Relative to All Selected Elements, will select only the common child elements that exist in all blocks">☺</span></div>
                <div><a v-on:mousedown="confirmCollectMultiAndDescendents">Collect Data</a><span title=""></span></div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopClickEveryElement">Loop-click every {{ tname() | toEng}}</a><span title="Usually used to click every link in a list to open detail page to collect data">☺</span>
                </div>
                <div v-if="tname()!='选择框' && tname()!='文本框' && !selectedDescendents"><a
                    v-on:mousedown="loopMouseMove">Loop-mouse-move to every {{ tname() | toEng}}</a><span title=""></span></div>
                <div><a v-on:mousedown="revoke">Revoke selection</a><span title=""></span></div>
              </div>
            </div>

          </div>

          <div v-if="valTable.length>0">
            <div class="toolkitcontain">
              <table cellspacing="0" class="toolkittb2">
                <tbody>
                <th v-for="(i, index) in list.opp"><div>{{ i["name"] }}</div> <span v-bind:index="index" v-on:mousedown="removeField" title="Remove this field">×</span> </th>
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
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="valTable.length==0&&tname()!='下一页元素'"></div>

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
          <div style="text-align: justify;margin-top: 15px;padding-right: 15px;margin-left: 4px">
            Inputting &lt;enter&gt; or &lt;ENTER&gt; represents the simulation of pressing the Enter key after input is complete, which is applicable in situations where data can only be obtained through pressing the Enter key.
          </div>
        </div>
        <div v-if="page==2">
          <span style="font-size: 15px"> ● Change Mode </span>
          <select v-model="optionMode" @change="handleSelectChange">
            <option value=0>Change to next option</option>
            <option value=1>Change option by index</option>
            <option value=2>Change option by value</option>
            <option value=3>Change option by text</option>
          </select>
          <span style="font-size: 15px" v-if="optionMode == 3"> ● Option Text</span>
          <span style="font-size: 15px" v-if="optionMode == 1"> ● Option Index</span>
          <span style="font-size: 15px" v-if="optionMode == 2"> ● Option Value</span>
          <input id="selectValue" v-if="optionMode != 0" v-model="optionValue" autoFocus="autofocus" type="text"></input>
          <div>
            <button style="margin-left:0px!important;" v-on:click="sendChangeSelect">Confirm</button>
            <button style="margin-left:0px!important;" v-on:click="cancelInput">Cancel</button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script>
import {
  global,
  isInIframe,
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
  relatedTest, getElementXPaths
} from "./global.js";
import {
  input,
  sendSingleClick,
  collectSingle,
  collectMultiNoPattern,
  collectMultiWithPattern,
  sendLoopClickSingle,
  sendLoopClickEvery,
  detectAllSelected, sendChangeOption, sendMouseMove, sendLoopMouseMove
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
    nowAllPaths: [], //现在元素的所有xpath
    winHeight: window.outerHeight,
    optionMode: 0,
    optionValue: "",
    mode: 0, //记录删除字段模式
  },
  mounted(){
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    });
    if(isInIframe()){
      global.iframe = true;
    }
    // 获取页面上所有的iframe
    let iframes = document.getElementsByTagName('iframe');

    // 循环遍历所有的iframe
    for(let i = 0; i < iframes.length; i++) {
      let iframe = iframes[i];
      // 获取iframe的当前高度
      let currentHeight = iframe.offsetHeight;
      console.log("IFRAME: ", getElementXPaths(iframe), readXPath(iframe));
      console.log("IFrame Height: ", currentHeight, "px")
      // 如果当前高度小于600px，那么将其设置为600px
      if(currentHeight < 600) {
        iframe.style.height = '600px!important';
        iframe.height = '600';
      }

      let currentWidth = iframe.offsetWidth;
      console.log("IFrame Width: ", currentWidth, "px")
      // 如果当前高度小于600px，那么将其设置为600px
      if(currentWidth < 600) {
        iframe.style.width = '600px!important';
        iframe.width = '600';
      }
    }
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
          handleDescendents(this.mode); //如果之前有选中子元素，新加入的节点又则这里也需要重新选择子元素
        }
      } else {
        this.valTable = [];
        this.selectStatus = false;
        clearParameters(); //直接撤销重选
      }
      let at2 = parseInt(new Date().getTime());
      console.log("delete:", at2, at, at2 - at);
    },
    removeField: function (event){
        let index = event.target.getAttribute("index");
        let tParameter = global.outputParameters.splice(index, 1)[0];
        if(global.outputParameters.length == 0){
          this.valTable = [];
          clearEl();
        } else { //删除对应的列
          console.log("remove:", tParameter, global);
          this.valTable.splice(index, 1);
          for (let i = global.outputParameterNodes.length - 1; i >= 0; i--) {
            let node = global.outputParameterNodes[i];
            if(node["unique_index"] == tParameter["unique_index"]){
              node["node"].style.backgroundColor = "";
              node["node"].style.boxShadow = "";
              global.outputParameterNodes.splice(i, 1);
            }
          }
        }
    },
    clickElement: async function () { //点击元素操作
      sendSingleClick();
      //先发送数据
      global.nodeList[0]["node"].focus(); //获得元素焦点
      await new Promise(resolve => setTimeout(resolve, 500)); //因为nodejs点击后又会把当前元素加入到列表中，所以这里需要等待一下再清空
      // global.nodeList[0]["node"].click(); //点击元素
      clearEl();
    },
    changeSelect: function(){
      this.page = 2;
      this.optionMode = 0;
      this.optionValue = global.nodeList[0]["node"].options[global.nodeList[0]["node"].selectedIndex + 1].text;
    },
    sendChangeSelect: function (){
      sendChangeOption(this.optionMode, this.optionValue);
      //先发送数据
      try{
        if(this.optionMode == 0){
          global.nodeList[0]["node"].options[global.nodeList[0]["node"].selectedIndex + 1].selected = true;
        } else if(this.optionMode == 1){
          global.nodeList[0]["node"].selectedIndex = this.optionValue;
        } else if(this.optionMode == 2){
          global.nodeList[0]["node"].value = this.optionValue;
        } else if(this.optionMode == 3){
          global.nodeList[0]["node"].options[global.nodeList[0]["node"].selectedIndex].selected = true;
          for (let i = 0; i < global.nodeList[0]["node"].options.length; i++) {
            const option = global.nodeList[0]["node"].options[i];
            if (option.text === this.optionValue) {
              global.nodeList[0]["node"].value = option.value; // 将目标选项的值设置为<select>元素的值
              break; // 找到目标选项后跳出循环
            }
          }
        }
      } catch (e) {
        if(this.lang == "zh"){
          alert("切换失败，实际执行时可能失败，请注意。");
        } else {
          alert("Switch failed, may fail when actually executed, please note.");
        }
      }

      clearEl();
    },
    handleSelectChange: function(){
      console.log(this.optionMode, this.optionValue);
      if(this.optionMode == 0){
        this.optionValue = global.nodeList[0]["node"].options[global.nodeList[0]["node"].selectedIndex + 1].text;
      } else if(this.optionMode == 1){
        this.optionValue = global.nodeList[0]["node"].selectedIndex;
      } else if(this.optionMode == 2){
        this.optionValue = global.nodeList[0]["node"].value;
      } else if(this.optionMode == 3){
        this.optionValue = global.nodeList[0]["node"].options[global.nodeList[0]["node"].selectedIndex].text;
      }
    },
    mouseMove: function(){
      sendMouseMove();
      clearEl();
    },
    loopMouseMove: function(){
      sendLoopMouseMove();
      clearEl();
    },
    loopClickSingleElement: async function () { //循环点击单个元素
      sendLoopClickSingle(this.tname()); //识别下一页,循环点击单个元素和点击多个元素
      // if (this.tname() != "下一页元素") { //下一页元素不进行点击操作
      global.nodeList[0]["node"].focus(); //获得元素焦点
      await new Promise(resolve => setTimeout(resolve, 500)); //因为nodejs点击后又会把当前元素加入到列表中，所以这里需要等待一下再清空
      // global.nodeList[0]["node"].click(); //点击元素
      // }
      clearEl();
    },
    loopClickEveryElement: async function () { //循环点击每个元素
      sendLoopClickEvery(); //识别下一页,循环点击单个元素和点击多个元素
      global.nodeList[0]["node"].focus(); //获得元素焦点
      await new Promise(resolve => setTimeout(resolve, 500)); //因为nodejs点击后又会把当前元素加入到列表中，所以这里需要等待一下再清空
      // global.nodeList[0]["node"].click(); //点击元素
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
      // if (getOS() == "Mac") {
      //   global.nodeList[0]["node"].setAttribute("value", this.text); // 设置输入 box内容
      // } else{
      //   global.nodeList[0]["node"].setAttribute("value", ""); // 先设置为空，再设置输入 box内容
      // }
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
    getCurrentURL: function () { //获取当前页面的URL
      addEl(); // 添加当前选择元素，只是为了占位
      generateParameters(5, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getCurrentTitle: function () { //获取当前页面的Title
      // 获取文档中所有元素
      // const elements = document.querySelectorAll('*');
      // global.nodeList.push(elements[0]); //将页面第一个元素放入列表中
      addEl(); // 添加当前选择元素，只是为了占位
      generateParameters(6, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getText: function () { //采集文字
      generateParameters(0, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getSelectedValue: function () { //采集选中文字
      generateParameters(10, true, false);
      this.selectStatus = true;
      clearReady();
    },
    getSelectedText: function () { //采集选中文字
      generateParameters(11, true, false);
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
    getBackgroundPic: function () { //采集背景图片
      generateParameters(4, true, false);
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
        // this.setWidth("280px");
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
        global.nodeList[global.nodeList.length - 1]["allXPaths"] = getElementXPaths(tNode);
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
    selectDescendents: function (e, mode = 0) { //选择所有子元素操作
      handleDescendents(mode);
      this.mode = mode;
    }
  },
}

</script>

<style>

</style>
