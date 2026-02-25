(function () {

	const importPath = /*@__PURE__*/ JSON.parse('"content-scripts/main.js"');

	import(chrome.runtime.getURL(importPath));

})();
