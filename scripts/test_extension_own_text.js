#!/usr/bin/env node

// Regression test for the example values of "own text" fields created by the
// extension (for example by "select child elements"). These values used to
// have every space removed, so "3.0 out of 5 stars" was shown as
// "3.0outof5stars" (#683).
//
// Run with: node scripts/test_extension_own_text.js
//
// The content scripts need a browser page, so this test loads the helper's
// source from each copy of global.js and runs it on small stand-in nodes.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const copies = [
  'Extension/manifest_v3/src/content-scripts/global.js',
  'ElectronJS/EasySpider_zh/content-scripts/global.js',
  'ElectronJS/EasySpider_en/content-scripts/global.js',
];

function readCopy(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadGetOwnText(source, relativePath) {
  const match = source.match(/^function getOwnText\(node\) \{\r?\n[\s\S]*?^\}/m);
  assert.ok(match, `getOwnText() not found in ${relativePath}`);
  return new Function(`${match[0]}\nreturn getOwnText;`)();
}

const text = (value) => ({nodeType: 3, textContent: value});
const element = (...childNodes) => ({
  nodeType: 1,
  childNodes,
  textContent: childNodes.map((node) => node.textContent).join(''),
});

for (const relativePath of copies) {
  test(`${relativePath}: own text keeps the spaces between words`, () => {
    const getOwnText = loadGetOwnText(readCopy(relativePath), relativePath);

    assert.equal(getOwnText(element(text('  3.0 out of 5 stars  '))), '3.0 out of 5 stars');
    assert.equal(
      getOwnText(element(
        text('\n    Reviewed in the United States\n    on '),
        element(text('January 27, 2025')),
        text(' via mobile '),
      )),
      'Reviewed in the United States on via mobile',
    );
  });

  test(`${relativePath}: whitespace-only text is still empty`, () => {
    const getOwnText = loadGetOwnText(readCopy(relativePath), relativePath);

    assert.equal(getOwnText(element(text('\n   '), element(text('child')), text('\t'))), '');
    assert.equal(getOwnText(element()), '');
  });

  test(`${relativePath}: example values no longer strip all whitespace`, () => {
    const source = readCopy(relativePath);

    assert.ok(!source.includes("ndText = ndText.replace(/\\s+/g, '');"));
    assert.equal((source.match(/ndText = getOwnText\(nd\);/g) || []).length, 3);
  });
}
