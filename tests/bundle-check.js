import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import * as presets from '../packages/effects/src/index.js';

const assets = new URL('../examples/frameworks/dist/assets/', import.meta.url);
const bundle = readdirSync(assets)
  .filter(name => name.endsWith('.js'))
  .map(name => readFileSync(new URL(name, assets), 'utf8'))
  .join('\n');
const included = Object.values(presets).map(preset => preset.id).filter(id => bundle.includes(id)).sort();
assert.deepEqual(included, ['circular-spinner', 'dot-matrix-wave']);
console.log('Framework example bundle contains only the two imported presets.');
