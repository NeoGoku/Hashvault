#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function createSandbox() {
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: (k) => { store.delete(String(k)); },
  };

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    parseInt,
    parseFloat,
    isFinite,
    isNaN,
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage,
    location: { reload: () => {} },
    document: { getElementById: () => null },
    notify: () => {},
    showModal: () => {},
    fmtNum: (v, d = 0) => Number(v || 0).toFixed(d),
    fmtTime: (sec) => String(Math.floor(Number(sec || 0))) + 's',
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function loadScript(ctx, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, 'utf8');
  vm.runInContext(code, ctx, { filename: relPath });
}

function exposeGlobalState(ctx) {
  vm.runInContext('if (typeof G !== \"undefined\") { window.G = G; }', ctx);
}

function runContractsSmoke() {
  const sandbox = createSandbox();
  const ctx = vm.createContext(sandbox);

  loadScript(ctx, 'js/data/coins.js');
  loadScript(ctx, 'js/data/rigs.js');
  loadScript(ctx, 'js/data/contracts.js');
  loadScript(ctx, 'js/core/state.js');
  exposeGlobalState(ctx);
  loadScript(ctx, 'js/systems/contracts.js');

  sandbox.renderContracts = () => {};

  vm.runInContext('G.totalEarned = 12500000;', ctx);
  vm.runInContext('G.totalRigs = 180;', ctx);
  vm.runInContext('G.prestigeCount = 3;', ctx);
  vm.runInContext('G.contractsDone = 40;', ctx);
  vm.runInContext('G.research = Array.from({ length: 14 }, (_, i) => \"r\" + (i + 1));', ctx);
  vm.runInContext('G.powerInfraLevel = 9;', ctx);

  sandbox.generateContracts();

  const contracts = vm.runInContext('G.contracts', ctx);
  assert(Array.isArray(contracts), 'contracts list missing');
  assert(contracts.length >= 5, 'expected at least 5 contracts');

  const names = new Set();
  let hasMediumOrHard = false;
  contracts.forEach((c, idx) => {
    assert(c && typeof c === 'object', 'contract not object #' + idx);
    assert(Number(c.target || 0) > 0, 'invalid contract target #' + idx);
    assert(Number(c.reward || 0) > 0, 'invalid contract reward #' + idx);
    assert(!names.has(c.name), 'duplicate contract name: ' + c.name);
    names.add(c.name);
    if (c.difficulty === 'medium' || c.difficulty === 'hard') hasMediumOrHard = true;
  });
  assert(hasMediumOrHard, 'expected medium/hard contracts in progressed profile');

  assert(sandbox.isContractComplete({ type: 'power_infra', target: 5 }) === true, 'power_infra completion failed');
  assert(sandbox.isContractComplete({ type: 'prestige_count', target: 2 }) === true, 'prestige_count completion failed');
}

function runSaveSanitizerSmoke() {
  const sandbox = createSandbox();
  const ctx = vm.createContext(sandbox);

  loadScript(ctx, 'js/data/coins.js');
  loadScript(ctx, 'js/data/rigs.js');
  loadScript(ctx, 'js/data/rigCrew.js');
  loadScript(ctx, 'js/core/state.js');
  exposeGlobalState(ctx);
  loadScript(ctx, 'js/core/save.js');

  assert(typeof sandbox.sanitizeLoadedSavePayload === 'function', 'sanitizeLoadedSavePayload not available');

  const corrupted = {
    selectedCoin: 'DOGE',
    usd: 'NaN',
    coins: { BTC: -10, ETH: 'bad', LTC: 0.3 },
    prices: { BTC: 0, ETH: -1 },
    priceHistory: { BTC: [null, -5, 50], ETH: 'bad' },
    rigs: { usb: -5, gpu1: 4.6 },
    contracts: [{ name: null, type: 'hashes', target: 0, reward: -2, difficulty: 'x' }],
    worldDay: -2,
    worldTimeMinutes: 99999,
    autoSellCoins: 'broken',
    rigAutoRepair: { usb: 'yes' },
    hiredRigStaff: { elite: 'abc' },
    loans: [{ id: 'x', outstanding: -50, ratePerDay: 10 }],
  };

  const res = sandbox.sanitizeLoadedSavePayload(corrupted);
  const save = res.save;

  assert(save.selectedCoin === 'BTC', 'selectedCoin should fallback to valid coin');
  assert(Number(save.coins.BTC) >= 0, 'BTC coin should be non-negative');
  assert(Number(save.prices.BTC) > 0, 'BTC price should be positive');
  assert(Array.isArray(save.priceHistory.BTC) && save.priceHistory.BTC.length > 0, 'BTC price history should be rebuilt');
  assert(Number(save.rigs.usb) >= 0, 'rig count should be non-negative');
  assert(save.contracts[0].difficulty === 'easy', 'contract difficulty should sanitize to easy');
  assert(Number(save.contracts[0].target) >= 1, 'contract target should sanitize to >=1');
  assert(Number(save.worldDay) >= 1, 'world day should sanitize >=1');
  assert(Number(save.worldTimeMinutes) >= 0 && Number(save.worldTimeMinutes) < 1440, 'world time should sanitize into day range');
  assert(typeof save.autoSellCoins.BTC === 'boolean', 'autoSellCoins map should be rebuilt');
}

function main() {
  runContractsSmoke();
  runSaveSanitizerSmoke();
  console.log('Regression smoke checks passed.');
}

main();
