/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const designButton = document.getElementById('btnDesign')
designButton.addEventListener('click', () => {
    window.electronAPI.startDesign();
});

const invokeButton = document.getElementById('btnInvoke')
invokeButton.addEventListener('click', () => {
    window.electronAPI.startInvoke();
});