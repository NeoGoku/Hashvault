#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  'index.html',
  'js/main.js',
  'js/core/state.js',
  'js/core/save.js',
  'js/core/gameLoop.js',
  'js/systems/contracts.js',
  'js/systems/features.js',
  'js/ui/render.js',
  'js/data/contracts.js',
  'js/data/goals.js',
  'js/data/challenges.js',
  'js/data/research.js',
  'js/data/rigs.js',
  'js/data/coins.js',
];

let failed = false;
files.forEach((rel) => {
  if (!rel.endsWith('.js')) return;
  const abs = path.join(root, rel);
  const out = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf8' });
  if (out.status !== 0) {
    failed = true;
    console.error('[FAIL]', rel);
    if (out.stderr) console.error(out.stderr.trim());
  } else {
    console.log('[OK]  ', rel);
  }
});

if (failed) {
  process.exit(1);
}

console.log('Syntax check passed.');
