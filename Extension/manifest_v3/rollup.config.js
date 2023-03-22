import json from '@rollup/plugin-json';
import vue from 'rollup-plugin-vue2';
import {
  chromeExtension,
  simpleReloader,
} from 'rollup-plugin-chrome-extension';
import { emptyDir } from 'rollup-plugin-empty-dir';
import typescript from 'rollup-plugin-typescript2'; // '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import alias from 'rollup-plugin-alias';
import _dotenv from 'dotenv/config';
import path from "path";

export default {
  input: 'src/manifest.json',
  output: {
    dir: 'dist',
    format: 'esm',
    chunkFileNames: 'chunks/[name]-[hash].js',
  },
  onwarn: (warning, defaultHandler) => {
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    defaultHandler(warning)
  },
  // watch: { clearScreen: false }, // for dev debug
  plugins: [
    alias({
      entries: {
        ['@']: path.resolve(__dirname, 'src')
      }}),
    // chromeExtension() must be first, in order to properly treat manifest.json as the entry point
    chromeExtension({
      extendManifest: {
        "key": process.env.VUE_APP_MV3_KEY
      }
    }),
    simpleReloader(), // Adds a Chrome extension reloader during watch mode
    vue(),
    replace({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.VUE_APP_FIREBASE_APIKEY":  JSON.stringify(process.env.VUE_APP_FIREBASE_APIKEY),
      "process.env.VUE_APP_FIREBASE_AUTHDOMAIN": JSON.stringify(process.env.VUE_APP_FIREBASE_AUTHDOMAIN),
      "process.env.VUE_APP_FIREBASE_PROJECTID": JSON.stringify(process.env.VUE_APP_FIREBASE_PROJECTID),
      "process.env.VUE_APP_FIREBASE_STORAGEBUCKET": JSON.stringify(process.env.VUE_APP_FIREBASE_STORAGEBUCKET),
      "process.env.VUE_APP_FIREBASE_MESSAGINGSENDERID": JSON.stringify(process.env.VUE_APP_FIREBASE_MESSAGINGSENDERID),
      "process.env.VUE_APP_FIREBASE_APPID": JSON.stringify(process.env.VUE_APP_FIREBASE_APPID),
      "process.env.VUE_APP_MEASUREMENTID": JSON.stringify(process.env.VUE_APP_MEASUREMENTID),
      preventAssignment: true
    }),
    typescript(),
    postcss(),
    json(),
    resolve(),
    commonjs(),
    emptyDir(),
    ],
};

