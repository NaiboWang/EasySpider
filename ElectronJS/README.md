## Note

Remember to update EasySpider.crx everytime the extension updates.

## Prerequisite

Download a chrome from the Internet: https://www.google.com/chrome/, and then put them into this folder, with name format of the following:

```
chrome_win32/ # for windows x86
chrome_win64/ # for windows x64
chrome_linux64/ # for linux x64
chrome_mac64/ # for mac x64
```

Then, download the corresponding chromedriver from the Internet on this page: https://chromedriver.chromium.org/downloads, note the **chromedriver version must match your chrome version**!!! And put them into corresponding chrome folder, with name format of the following:

```
chromedriver_win32.exe # for windows x86
chromedriver_win64.exe # for windows x64
chromedriver_linux64 # for linux x64
chromedriver_mac64 # for mac x64
```

For example, if you want to build this software on Windows x64 platform, then you should first download a chrome for windows x64, then copy the whole `chrome` folder to this `ElectronJS` folder and rename the folder to `chrome_win64`, assume the chrome version you downloaded is 110; then, download a `chromedriver.exe` with version 110 for windows x64, and put it into the `chrome_win64` folder, then rename it to `chromedriver_win64.exe`.


Finally, copy the `stealth.min.js` file in this folder to all of these `chrome` folders.

## Run Instruction

On Windows, you need to install `VS Build Tools 2017` (double click the vs_BuildTools.exe in this folder, then select and install the `Visual Studio Build Tools 2017` component) first for node-gyp to install `node-windows-manager`.



```
npm install
npm install @electron-forge/cli
```

## Package Instruction

```
npx electron-forge import
npm run package
```

optional:

```
npm run make
```

## For windows x64

依次执行下面两个cmd即可打包

```
package_win64.cmd
clean_win64.cmd
```

## For Windows x86
依次执行下面两个cmd即可打包

```
package_win32.cmd
clean_win32.cmd
```