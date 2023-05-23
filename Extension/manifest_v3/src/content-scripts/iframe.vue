<template>
  <div id="realcontent">
    <div v-if="lang == 'zh'">
      <div class="toolcannotdrag">提示 <a @click="close" style="cursor: pointer;text-decoration: underline;color:white">关闭此提示</a></div>
      <div class="realcontent">
        <p style="font-size: 15px">检测到此页面在iframe中，如想提取此页面数据，请重新设计任务，将网页URL改为下面显示的此iframe的URL地址：</p>
        <textarea style="font-size: 15px;width: 100%">{{url}}</textarea>
      </div>
    </div>
    <div v-else-if="lang=='en'">
      <div class="toolcannotdrag">Hint <a @click="close" href="#" style="cursor: pointer;text-decoration: underline;color:white">Close this hint</a></div>
      <div class="realcontent">
        <p style="font-size: 15px">Detected that this page is in an iframe. If you want to extract data from this page, please redesign the task and change the URL of the webpage to the URL address of this iframe displayed below:</p>
        <textarea style="font-size: 15px;width: 100%">{{url}}</textarea>
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
    url: window.location.href,
    lang: global.lang,
  },
  methods: {
    close() {
      document.getElementById('wrapperToolkitIframe').style.display = 'none'
    }
  },
}

</script>

<style>
#wrapperToolkitIframe{
  position: absolute;
  top:0;
}
.toolcannotdrag{
  background-color: navy;
  width: 100%;
  text-align: center;
  font-size: 13px;
  height: 26px !important;
  padding-top: 8px !important;
  color: white;
}
</style>