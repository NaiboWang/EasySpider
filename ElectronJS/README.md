## Note

Remember to update EasySpider.crx everytime the extension updates.

## Run Instruction

On Windows, you need to install `VS Build Tools 2017` (double click the vs_BuildTools.exe in this folder, then select and install the `Visual Studio Build Tools 2017` component) first for node-gyp to install `node-windows-manager`.

```bash

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