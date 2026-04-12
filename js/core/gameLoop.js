// ============================================================
// CORE — Game Loop, Multiplikatoren, Hilfs-Berechnungen
// ============================================================

let lastTick = Date.now();
const CONTRACT_REFRESH_INTERVAL = 1800; // 30 Minuten

const POWER_BALANCE = {
  basePricePerKwh: 0.185,
  minCapacityKw: 0.5,
  startCapacityKw: 3.0,
  upgradeStepKw: 10.0,
  upgradeBaseCost: 3200,
  upgradeCostMult: 1.22,
  upgradeSoftcapLevel: 18,
  upgradeSoftcapCostMult: 1.08,
  billIntervalSec: 480,
  billBaseFee: 16,
  billLevelFee: 2.4,
  billPeakFeeMult: 7.5,
  overloadWarnThreshold: 1.03,
  overloadPerfPenaltyPerExcess: 0.28,
  overloadMinPerf: 0.45,
  overloadDrainPerExcess: 1.2,
  overloadCrashPerExcess: 1.1,
  debtPenaltyCap: 0.35,
  debtPenaltyDenom: 80000,
  debtStageWarn: 2000,
  debtStagePenalty: 10000,
  debtStageCritical: 40000,
  debtStageShutdown: 120000,
  insolvencyStrikeDays: 3,
  eventMinDelaySec: 200,
  eventMaxDelaySec: 420,
  eventChance: 0.19,
  tariffs: [
    { start: 0, end: 360, label: 'Nacht', price: 0.10 },
    { start: 360, end: 1020, label: 'Tag', price: 0.185 },
    { start: 1020, end: 1320, label: 'Peak', price: 0.26 },
    { start: 1320, end: 1440, label: 'Spaet', price: 0.15 },
  ],
};
window.HV_POWER_BALANCE = POWER_BALANCE;

const POWER_PROVIDERS = [
  { id: 'spot', name: 'Spot-Markt', mode: 'variable', priceMult: 1.0, capMult: 1.0, baseFeePerDay: 10, peakPenaltyMult: 1.0, lockDays: 0 },
  { id: 'green_fixed', name: 'Green Fixed', mode: 'fixed', fixedPrice: 0.205, capMult: 1.05, baseFeePerDay: 36, peakPenaltyMult: 0.85, lockDays: 5 },
  { id: 'industrial_flex', name: 'Industrial Flex', mode: 'variable', priceMult: 0.92, capMult: 1.12, baseFeePerDay: 68, peakPenaltyMult: 1.2, lockDays: 4 },
];
window.HV_POWER_PROVIDERS = POWER_PROVIDERS;

const LOAN_PLANS = [
  { id: 'micro', label: 'Micro-Kredit', amount: 4000, ratePerDay: 0.010, durationDays: 12 },
  { id: 'growth', label: 'Growth-Kredit', amount: 18000, ratePerDay: 0.013, durationDays: 16 },
  { id: 'expansion', label: 'Expansion-Kredit', amount: 80000, ratePerDay: 0.016, durationDays: 21 },
];
window.HV_LOAN_PLANS = LOAN_PLANS;

const RIG_CREW_SPECS = {
  balanced: { label: 'Balanced', cap: 1.00, repair: 1.00, crash: 1.00, wage: 1.00 },
  repair: { label: 'Repair', cap: 0.96, repair: 1.18, crash: 1.00, wage: 1.04 },
  safety: { label: 'Safety', cap: 0.95, repair: 0.98, crash: 1.22, wage: 1.06 },
  efficiency: { label: 'Efficiency', cap: 1.12, repair: 0.92, crash: 0.94, wage: 0.92 },
};
window.HV_RIG_CREW_SPECS = RIG_CREW_SPECS;

const RIG_CREW_FOCUS = {
  balanced: { label: 'Balanced', icon: '⚖️', cap: 1.00, repair: 1.00, crash: 1.00, wage: 1.00 },
  throughput: { label: 'Durchsatz', icon: '🚀', cap: 1.10, repair: 0.88, crash: 0.90, wage: 1.08 },
  maintenance: { label: 'Wartung', icon: '🔧', cap: 0.96, repair: 1.20, crash: 1.00, wage: 1.04 },
  safety: { label: 'Safety', icon: '🛡️', cap: 0.92, repair: 0.95, crash: 1.22, wage: 1.06 },
  frugal: { label: 'Sparsam', icon: '💼', cap: 0.94, repair: 0.90, crash: 1.02, wage: 0.88 },
};
window.HV_RIG_CREW_FOCUS = RIG_CREW_FOCUS;

const ECONOMY_BALANCE = {
  prestigePowerCapPerLevel: 0.04,
  prestigeOpsCostCutPerLevel: 0.03,
  prestigeBuildCostCutPerLevel: 0.02,
  prestigeResearchCostCutPerLevel: 0.025,
  prestigeCrewEffPerLevel: 0.03,
  prestigeCrewWageCutPerLevel: 0.015,
  prestigeShopCostCutPerLevel: 0.02,
  minOpsCostMult: 0.55,
  minBuildCostMult: 0.60,
  minResearchCostMult: 0.58,
  minCrewWageMult: 0.74,
  minShopCostMult: 0.60,
  marketMinFloorBase: 0.45,
  marketFloorPerPrestige: 0.03,
};
window.HV_ECONOMY_BALANCE = ECONOMY_BALANCE;

const COIN_UTILITY_BALANCE = {
  reserveDefaults: { BTC: 0.2, ETH: 1.2, LTC: 1.8, BNB: 2.4 },
  researchEthUsdRate: 0.12,
  researchEthMin: 0.08,
  repairLtcUsdRate: 0.18,
  repairLtcMin: 0.06,
  powerBtcUsdRate: 0.0000065,
  powerBtcInfraBase: 0.01,
  powerBtcInfraPerLevel: 0.0025,
  powerBtcBatteryBase: 0.008,
  powerBtcBatteryPerLevel: 0.002,
  powerBtcMinInfra: 0.01,
  powerBtcMinBattery: 0.008,
  opsBnbDiscountPerCoin: 0.015,
  opsBnbDiscountCap: 0.18,
};
window.HV_COIN_UTILITY_BALANCE = COIN_UTILITY_BALANCE;

const AUTO_REPAIR_BALANCE = {
  billingIntervalSec: 12, // schnellerer Intervall gegen Explosionsspitzen
  targetPct: 96,
  triggerBelowPct: 88,
  emergencyTriggerPct: 10,
  maxRepairPctPerCycle: 32,
  retryDelaySec: 3,
  warnCooldownSec: 10,
};
window.HV_AUTO_REPAIR_BALANCE = AUTO_REPAIR_BALANCE;

const MARKET_BALANCE = {
  noiseScale: 0.58,
  momentumDecayPerSec: 1.55,
  momentumNoiseInject: 1.15,
  shockInjectScale: 0.82,
  meanReversionBase: 0.017,
  meanReversionVolFactor: 0.35,
  eventImpulseDurationSecMin: 50,
  eventImpulseDurationSecMax: 105,
  eventImpulseCarry: 0.24,
};
window.HV_MARKET_BALANCE = MARKET_BALANCE;

const EARLY_RIG_PROGRESS_BALANCE = {
  earlyBoostMaxDay: 4,
  earlyBoostMaxTotalRigs: 60,
  firstRunOnly: true,
  rigMult: {
    usb: 1.26,
    rpi: 1.14,
  },
  usbGroupBonuses: [
    { count: 5, mult: 1.03 },
    { count: 10, mult: 1.06 },
    { count: 20, mult: 1.10 },
    { count: 35, mult: 1.15 },
  ],
};
window.HV_EARLY_RIG_PROGRESS_BALANCE = EARLY_RIG_PROGRESS_BALANCE;

function ensureCoinReserveState() {
  if (!G.coinReserves || typeof G.coinReserves !== 'object') G.coinReserves = {};
  const defaults = COIN_UTILITY_BALANCE.reserveDefaults || {};
  Object.keys(COIN_DATA || defaults).forEach((coin) => {
    const fallback = Math.max(0, Number(defaults[coin] || 0));
    const raw = Number(G.coinReserves[coin]);
    G.coinReserves[coin] = Number.isFinite(raw) && raw >= 0 ? raw : fallback;
  });
}
window.ensureCoinReserveState = ensureCoinReserveState;

function getCoinReserve(coin) {
  const key = String(coin || 'BTC').toUpperCase();
  ensureCoinReserveState();
  return Math.max(0, Number((G.coinReserves || {})[key] || 0));
}
window.getCoinReserve = getCoinReserve;

function getAvailableCoinBalance(coin) {
  const key = String(coin || 'BTC').toUpperCase();
  const total = Math.max(0, Number((G.coins || {})[key] || 0));
  const reserve = getCoinReserve(key);
  return Math.max(0, total - reserve);
}
window.getAvailableCoinBalance = getAvailableCoinBalance;

function spendCoin(coin, amount, reason) {
  const key = String(coin || 'BTC').toUpperCase();
  const need = Math.max(0, Number(amount || 0));
  if (need <= 0) return true;
  const total = Math.max(0, Number((G.coins || {})[key] || 0));
  if (total + 1e-9 < need) return false;
  G.coins[key] = Math.max(0, total - need);
  if (reason) {
    notify('🪙 ' + reason + ': -' + fmtNum(need, 4) + ' ' + key, 'warning');
  }
  return true;
}
window.spendCoin = spendCoin;

function getResearchEthCostByUsd(usdCost) {
  const usd = Math.max(0, Number(usdCost || 0));
  const ethPrice = Math.max(0.01, Number(((G.prices || {}).ETH) || 1));
  const tokenCost = usd * Number(COIN_UTILITY_BALANCE.researchEthUsdRate || 0.12) / ethPrice;
  return Math.max(
    Number(COIN_UTILITY_BALANCE.researchEthMin || 0.08),
    Number(tokenCost.toFixed(4))
  );
}
window.getResearchEthCostByUsd = getResearchEthCostByUsd;

function getRepairLtcCostByUsd(usdCost) {
  const usd = Math.max(0, Number(usdCost || 0));
  const ltcPrice = Math.max(0.01, Number(((G.prices || {}).LTC) || 1));
  const tokenCost = usd * Number(COIN_UTILITY_BALANCE.repairLtcUsdRate || 0.18) / ltcPrice;
  return Math.max(
    Number(COIN_UTILITY_BALANCE.repairLtcMin || 0.06),
    Number(tokenCost.toFixed(4))
  );
}
window.getRepairLtcCostByUsd = getRepairLtcCostByUsd;

function getPowerBtcTokenCost(kind) {
  const mode = String(kind || 'infra');
  let base = 0;
  let minCost = 0;
  let perLevel = 0;
  let level = 0;

  if (mode === 'battery') {
    level = Math.max(0, Number(G.powerBatteryTier || 0));
    base = Number(COIN_UTILITY_BALANCE.powerBtcBatteryBase || 0.008);
    perLevel = Number(COIN_UTILITY_BALANCE.powerBtcBatteryPerLevel || 0.002);
    minCost = Number(COIN_UTILITY_BALANCE.powerBtcMinBattery || 0.008);
  } else {
    level = Math.max(0, Number(G.powerInfraLevel || 0));
    base = Number(COIN_UTILITY_BALANCE.powerBtcInfraBase || 0.01);
    perLevel = Number(COIN_UTILITY_BALANCE.powerBtcInfraPerLevel || 0.0025);
    minCost = Number(COIN_UTILITY_BALANCE.powerBtcMinInfra || 0.01);
  }

  // Stabiler Token-Pfad: keine direkten Marktschwankungen in den Ausbaukosten.
  const tokenCost = base + level * perLevel;
  return Math.max(minCost, Number(tokenCost.toFixed(4)));
}
window.getPowerBtcTokenCost = getPowerBtcTokenCost;

function getBnbOpsDiscount() {
  const bnb = Math.max(0, Number(((G.coins || {}).BNB) || 0));
  const perCoin = Math.max(0, Number(COIN_UTILITY_BALANCE.opsBnbDiscountPerCoin || 0.015));
  const cap = Math.max(0, Number(COIN_UTILITY_BALANCE.opsBnbDiscountCap || 0.18));
  return Math.min(cap, bnb * perCoin);
}
window.getBnbOpsDiscount = getBnbOpsDiscount;

function ensureMarketImpulseState() {
  if (!G.marketMomentum || typeof G.marketMomentum !== 'object') G.marketMomentum = {};
  if (!G.marketEventDrift || typeof G.marketEventDrift !== 'object') G.marketEventDrift = {};
  if (!G.marketEventDriftTimer || typeof G.marketEventDriftTimer !== 'object') G.marketEventDriftTimer = {};
  Object.keys(COIN_DATA || {}).forEach((coin) => {
    if (!Number.isFinite(G.marketMomentum[coin])) G.marketMomentum[coin] = 0;
    if (!Number.isFinite(G.marketEventDrift[coin])) G.marketEventDrift[coin] = 0;
    if (!Number.isFinite(G.marketEventDriftTimer[coin]) || G.marketEventDriftTimer[coin] < 0) {
      G.marketEventDriftTimer[coin] = 0;
    }
  });
}

function addMarketImpulse(coin, pctMove, durationSec) {
  ensureMarketImpulseState();
  const inputPct = Math.max(-0.75, Math.min(2.2, Number(pctMove || 0)));
  if (!Number.isFinite(inputPct) || Math.abs(inputPct) < 0.0001) return;
  const dur = Math.max(
    12,
    Number(durationSec || (MARKET_BALANCE.eventImpulseDurationSecMin || 45))
  );
  const logTarget = Math.log(1 + inputPct);
  const driftPerSec = logTarget / dur;
  const coins = coin ? [String(coin)] : Object.keys(COIN_DATA || {});

  coins.forEach((key) => {
    if (!COIN_DATA[key]) return;
    const prevTimer = Math.max(0, Number(G.marketEventDriftTimer[key] || 0));
    const prevDrift = Number(G.marketEventDrift[key] || 0);
    if (prevTimer > 0) {
      const carry = Math.max(0, Math.min(0.9, Number(MARKET_BALANCE.eventImpulseCarry || 0.35)));
      G.marketEventDrift[key] = prevDrift * carry + driftPerSec * (1 - carry);
      G.marketEventDriftTimer[key] = Math.max(prevTimer, dur);
    } else {
      G.marketEventDrift[key] = driftPerSec;
      G.marketEventDriftTimer[key] = dur;
    }
  });
}
window.addMarketImpulse = addMarketImpulse;

// ── Alle Boni aus Upgrades, Research, Staff, Achievements, Chips zusammenrechnen ──
function computeMultipliers() {
  ensureCoinReserveState();
  let hm = 1, cb = 0, cm = 1, pm = 1, pass = 0, rcm = 1, conv = 1, combo = 0, cbon = 0;
  let legacyPct = 0, researchSpeedBonus = 0;

  // ── Upgrades ─────────────────────────────────────────────
  G.upgrades.forEach(id => {
    const u = UPGRADES.find(x => x.id === id);
    if (!u) return;
    const e = u.effect;
    if      (e.startsWith('rigmult+'))    hm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('click+'))      cb   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('click*'))      cm   *= parseFloat(e.split('*')[1]);
    else if (e.startsWith('pricemult+'))  pm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('passive+'))    pass += parseFloat(e.split('+')[1]);
    else if (e.startsWith('rigcost-'))    rcm  -= parseFloat(e.split('-')[1]);
    else if (e === 'conv*2')              conv *= 2;
    else if (e === 'comboblend')          combo += 0.5;
    else if (e === 'pool')                hm   += 0.1 * Object.values(G.rigs).filter(v => v > 0).length;
  });

  // ── Research ─────────────────────────────────────────────
  G.research.forEach(id => {
    const r = RESEARCH.find(x => x.id === id);
    if (!r) return;
    const e = r.effect;
    if      (e.startsWith('hps+'))        hm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('price+'))      pm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('passive+'))    pass += parseFloat(e.split('+')[1]);
    else if (e.startsWith('click*'))      cm   *= parseFloat(e.split('*')[1]);
    else if (e.startsWith('rigcost-'))    rcm  -= parseFloat(e.split('-')[1]);
    else if (e.startsWith('conv+'))       conv += parseFloat(e.split('+')[1]);
    else if (e === 'both+0.5+0.2')       { hm += 0.5; pm += 0.2; }
    else if (e === 'all*2')              { hm *= 2; pm *= 2; cm *= 2; pass *= 2; }
  });

  // ── Staff ─────────────────────────────────────────────────
  hm   += (G.staff.dev    || 0) * 0.05;
  pm   += (G.staff.trader || 0) * 0.03;
  pass += (G.staff.sec    || 0) * 4;
  hm   += (G.staff.maint  || 0) * 0.08;
  const quantBoost = (G.staff.quant || 0) * 0.12;
  pass  = pass * (1 + quantBoost);
  cbon += (G.staff.pm || 0) * 0.25;
  hm   += (G.staff.dataeng || 0) * 0.03;
  researchSpeedBonus += (G.staff.dataeng || 0) * 0.18;
  cbon += (G.staff.opsdir || 0) * 0.12;
  pass += (G.staff.opsdir || 0) * 6;
  pm   += (G.staff.cfo || 0) * 0.08;

  // ── Achievements ──────────────────────────────────────────
  G.achievements.forEach(id => {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a || !a.reward) return;
    const e = a.reward;
    if      (e.startsWith('click+'))      cb   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('hps+'))        hm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('pricemult+'))  pm   += parseFloat(e.split('+')[1]);
    else if (e.startsWith('passive+'))    pass += parseFloat(e.split('+')[1]);
    else if (e.startsWith('rigmult+'))    hm   += parseFloat(e.split('+')[1]);
  });

  // ── Chip-Shop ─────────────────────────────────────────────
  Object.entries(G.chipShop).forEach(([id, count]) => {
    if (!count) return;
    const c = CHIP_SHOP.find(x => x.id === id);
    if (!c) return;

    if (c.cat === 'boost') {
      for (let i = 0; i < count; i++) {
        const e = c.effect;
        if      (e.startsWith('hps+'))            hm   += parseFloat(e.split('+')[1]);
        else if (e.startsWith('click*'))           cm   *= parseFloat(e.split('*')[1]);
        else if (e.startsWith('price+'))           pm   += parseFloat(e.split('+')[1]);
        else if (e.startsWith('passive+'))         pass += parseFloat(e.split('+')[1]);
        else if (e.startsWith('combo+'))           combo += parseFloat(e.split('+')[1]);
        else if (e.startsWith('rigcost-'))         rcm  -= parseFloat(e.split('-')[1]);
        else if (e.startsWith('legacy+'))          legacyPct += parseFloat(e.split('+')[1]);
        else if (e.startsWith('researchspeed+'))   researchSpeedBonus += parseFloat(e.split('+')[1]);
      }
    } else if (c.cat === 'unlock') {
      const e = c.effect;
      if (e === 'rigblueprint') {
        hm += G.prestigeCount * 0.10;
      }
      // cu2 'diversified': +10% hm & pm per unique coin being mined
      if (e === 'multicoin') {
        const uniqueCoins = new Set(Object.values(G.rigTargets || {})).size || 1;
        const bonus = 0.10 * Math.min(4, uniqueCoins);
        hm += bonus;
        pm += bonus;
      }
    }
  });

  // ── Active Consumable Boosts (Chip-Use + Events) ───────────
  const now = Date.now();
  G.activeBoosts = (G.activeBoosts || []).filter(b => b.endsAt > now);
  G.activeBoosts.forEach(b => {
    const m = b.mult || 1;
    if      (b.effect === 'hashburst60')   hm *= 10;
    else if (b.effect === 'pricespike30')  pm *= 3;
    else if (b.effect === 'rigsurge120')   hm *= 5;
    else if (b.effect === 'evHashBoost')   hm *= m;
    else if (b.effect === 'evPriceBoost')  pm *= m;
    else if (b.effect === 'evAllBoost')  { hm *= m; pm *= m; }
  });

  // ── Mining-Schwierigkeit (steigt mit Prestige) ─────────────
  // 1.0 + 15% pro Prestige-Reset; Forschung kann es reduzieren
  let diffReduction = 0;
  G.research.forEach(id => {
    const r = RESEARCH.find(x => x.id === id);
    if (r && r.effect === 'diffReduce') diffReduction += 0.10;
  });
  const earned = Math.max(0, Number(G.totalEarned || 0));
  const ecoPhase = Math.max(0, Math.min(1, Math.log10(earned + 1) / 8));
  const ecoDifficultyAdd = ecoPhase * 0.35;
  G._difficulty = Math.max(0.3, 1.0 + G.prestigeCount * 0.15 + ecoDifficultyAdd - diffReduction);

  // Kurzfristiger Umzugsboost: 1 Ingame-Tag +8% H/s nach Standortwechsel.
  const moveBoostUntilDay = Number(G.locationMoveBoostUntilDay || 0);
  const dayNow = Number(G.worldDay || 1);
  const moveBoostActive = moveBoostUntilDay > dayNow;
  const moveBoostMult = moveBoostActive ? 1.08 : 1;
  hm *= moveBoostMult;
  hm *= Math.max(0.2, Number(G._shopHpsMult || 1));

  const prestigeCount = Math.max(0, Number(G.prestigeCount || 0));
  const powerCapMult = 1 + prestigeCount * Number(ECONOMY_BALANCE.prestigePowerCapPerLevel || 0.04);
  const opsCostMult = Math.max(
    Number(ECONOMY_BALANCE.minOpsCostMult || 0.55),
    1 - prestigeCount * Number(ECONOMY_BALANCE.prestigeOpsCostCutPerLevel || 0.03)
  );
  const buildCostMult = Math.max(
    Number(ECONOMY_BALANCE.minBuildCostMult || 0.60),
    1 - prestigeCount * Number(ECONOMY_BALANCE.prestigeBuildCostCutPerLevel || 0.02)
  );
  const researchCostMult = Math.max(
    Number(ECONOMY_BALANCE.minResearchCostMult || 0.58),
    1 - prestigeCount * Number(ECONOMY_BALANCE.prestigeResearchCostCutPerLevel || 0.025)
  );
  const crewEffMult = 1 + prestigeCount * Number(ECONOMY_BALANCE.prestigeCrewEffPerLevel || 0.03);
  const crewWageMult = Math.max(
    Number(ECONOMY_BALANCE.minCrewWageMult || 0.74),
    1 - prestigeCount * Number(ECONOMY_BALANCE.prestigeCrewWageCutPerLevel || 0.015)
  );
  const shopCostMult = Math.max(
    Number(ECONOMY_BALANCE.minShopCostMult || 0.60),
    1 - prestigeCount * Number(ECONOMY_BALANCE.prestigeShopCostCutPerLevel || 0.02)
  );
  const hasCrashProtect = !!(G.chipShop && Number(G.chipShop.cu3 || 0) > 0);
  const marketFloorMult = Math.min(
    0.85,
    Number(ECONOMY_BALANCE.marketMinFloorBase || 0.45) +
      prestigeCount * Number(ECONOMY_BALANCE.marketFloorPerPrestige || 0.03) +
      (hasCrashProtect ? 0.25 : 0)
  );
  const ecoRigCostMult = 0.96 + ecoPhase * 0.88;
  const ecoBuildCostMult = 0.92 + ecoPhase * 0.78;
  const ecoResearchCostMult = 0.94 + ecoPhase * 0.72;
  const ecoConvPenalty = 1 + ecoPhase * 0.95;
  const ecoPassiveMult = 1 - ecoPhase * 0.28;

  // ── Schreibe berechnete Werte ─────────────────────────────
  G._hpsMult           = Math.max(0.01, hm);
  G._clickBonus        = cb;
  G._clickMult         = Math.max(1, cm);
  G._priceMult         = Math.max(1, pm);
  G._passive           = Math.max(0, pass * Math.max(0.55, ecoPassiveMult));
  G._rigCostMult       = Math.max(0.05, rcm * ecoRigCostMult);
  G._convMult          = Math.max(1, conv / ecoConvPenalty);
  G._comboBonus        = combo;
  G._contractBonus     = cbon;
  G._legacyMult        = 1 + legacyPct * G.prestigeCount;
  G._researchSpeedMult = 1 + researchSpeedBonus;
  G._locationMoveBoostActive = moveBoostActive;
  G._locationMoveBoostMult = moveBoostMult;
  G._prestigePowerCapMult = powerCapMult;
  G._opsCostMult = opsCostMult;
  G._opsBnbDiscount = getBnbOpsDiscount();
  G._buildCostMult = buildCostMult * ecoBuildCostMult;
  G._researchCostMult = researchCostMult * ecoResearchCostMult;
  G._prestigeCrewEffMult = crewEffMult;
  G._prestigeCrewWageMult = crewWageMult;
  G._prestigeShopCostMult = shopCostMult;
  G._marketFloorMult = marketFloorMult;
  G._ecoPhase = ecoPhase;
}

// ── Hilfsfunktionen ──────────────────────────────────────────
function getRigHps(rigId) {
  const r = RIGS.find(x => x.id === rigId);
  if (!r) return 0;
  const mods = (G.rigMods && G.rigMods[rigId]) ? G.rigMods[rigId] : [];
  const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : { hashPerSec: 1 };
  const modMult = Number(bonuses.hashPerSec || 1);
  const powerMult = Number(G._powerPerfMult || 1);
  let progressionMult = 1;

  const cfg = window.HV_EARLY_RIG_PROGRESS_BALANCE || EARLY_RIG_PROGRESS_BALANCE;
  const totalRigs = Object.values(G.rigs || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const day = Math.max(1, Number(G.worldDay || 1));
  const prestigeCount = Math.max(0, Number(G.prestigeCount || 0));
  const earlyRunAllowed = !cfg.firstRunOnly || prestigeCount <= 0;
  const earlyWindowActive = earlyRunAllowed && day <= Number(cfg.earlyBoostMaxDay || 0) && totalRigs <= Number(cfg.earlyBoostMaxTotalRigs || 0);

  if (earlyWindowActive) {
    const baseRigMult = Number((cfg.rigMult || {})[rigId] || 1);
    progressionMult *= Math.max(1, baseRigMult);
  }

  if (rigId === 'usb') {
    const ownedUsb = Math.max(0, Number((G.rigs || {}).usb || 0));
    let groupMult = 1;
    (cfg.usbGroupBonuses || []).forEach((entry) => {
      if (ownedUsb >= Number(entry.count || 0)) {
        groupMult = Math.max(groupMult, Number(entry.mult || 1));
      }
    });
    progressionMult *= Math.max(1, groupMult);
  }

  return r.hps * G._hpsMult * modMult * powerMult * progressionMult;
}

function getTotalHps() {
  let total = 0;
  RIGS.forEach(r => { total += (G.rigs[r.id] || 0) * getRigHps(r.id); });
  return total;
}

function getTotalRigCount() {
  return Object.values(G.rigs || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function getPowerProviderById(providerId) {
  const selected = String(providerId || 'spot');
  return (POWER_PROVIDERS || []).find((p) => p.id === selected) || POWER_PROVIDERS[0];
}
window.getPowerProviderById = getPowerProviderById;

function getLoanPlanById(planId) {
  const selected = String(planId || '');
  return (LOAN_PLANS || []).find((p) => p.id === selected) || null;
}
window.getLoanPlanById = getLoanPlanById;

function getOutstandingLoanTotal() {
  if (!Array.isArray(G.loans)) return 0;
  return G.loans.reduce((sum, loan) => sum + Math.max(0, Number((loan && loan.outstanding) || 0)), 0);
}
window.getOutstandingLoanTotal = getOutstandingLoanTotal;

function getDailyLeaseCostTotal() {
  const leased = (G && G.leasedRigs && typeof G.leasedRigs === 'object') ? G.leasedRigs : {};
  const opsCostMult = Math.max(0.4, Number(G._opsCostMult || 1));
  return (RIGS || []).reduce((sum, rig) => {
    const count = Math.max(0, Number(leased[rig.id] || 0));
    if (count <= 0) return sum;
    const daily = Number(rig.baseCost || 0) * 0.012;
    return sum + count * daily * opsCostMult;
  }, 0);
}
window.getDailyLeaseCostTotal = getDailyLeaseCostTotal;

function getInsuranceDailyPremium() {
  if (!G.insuranceActive) return 0;
  const rigs = getTotalRigCount();
  const tier = Math.max(0, Number(G.insuranceTier || 0));
  const hasChipDiscount = !!(G.chipShop && Number(G.chipShop.cu7 || 0) > 0);
  const base = 3.2 + tier * 0.8;
  const prestigeCut = Math.min(0.45, Math.max(0, Number(G.prestigeCount || 0) * 0.02));
  const premium = rigs * base * (1 - prestigeCut) * Math.max(0.4, Number(G._opsCostMult || 1));
  return hasChipDiscount ? premium * 0.85 : premium;
}
window.getInsuranceDailyPremium = getInsuranceDailyPremium;

function ensureRigCrewProgressState() {
  if (!G.rigCrewProgress || typeof G.rigCrewProgress !== 'object') G.rigCrewProgress = {};
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    if (!G.rigCrewProgress[tier.id] || typeof G.rigCrewProgress[tier.id] !== 'object') {
      G.rigCrewProgress[tier.id] = { level: 1, xp: 0, spec: 'balanced' };
    }
    const p = G.rigCrewProgress[tier.id];
    if (!Number.isFinite(p.level) || p.level < 1) p.level = 1;
    if (!Number.isFinite(p.xp) || p.xp < 0) p.xp = 0;
    if (!RIG_CREW_SPECS[p.spec]) p.spec = 'balanced';
  });
}

function getRigCrewTierProgress(tierId) {
  ensureRigCrewProgressState();
  return G.rigCrewProgress[tierId] || { level: 1, xp: 0, spec: 'balanced' };
}
window.getRigCrewTierProgress = getRigCrewTierProgress;

function getRigCrewXpTarget(level) {
  const lv = Math.max(1, Number(level || 1));
  return Math.ceil(40 + lv * 34);
}
window.getRigCrewXpTarget = getRigCrewXpTarget;

function addRigCrewXp(tierId, amount) {
  const add = Math.max(0, Number(amount || 0));
  if (add <= 0) return;
  const tier = (window.RIG_STAFF_TIERS || []).find((x) => x.id === tierId);
  if (!tier) return;

  ensureRigCrewProgressState();
  const progress = G.rigCrewProgress[tierId];
  progress.xp += add;
  let leveled = 0;
  while (progress.xp >= getRigCrewXpTarget(progress.level)) {
    progress.xp -= getRigCrewXpTarget(progress.level);
    progress.level += 1;
    leveled += 1;
  }
  if (leveled > 0) {
    notify('📈 ' + tier.name + ' auf Level ' + progress.level + ' verbessert!', 'gold');
  }
}

function getCurrentLocationRigCap() {
  const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  if (!loc) return Infinity;
  return Math.max(1, Number(loc.maxRigs || 1));
}

function refreshUnlockedLocationTier() {
  if (!Number.isFinite(G.unlockedLocationTier) || G.unlockedLocationTier < 1) G.unlockedLocationTier = 1;
  const prevTier = Math.max(1, Number(G.unlockedLocationTier || 1));
  const all = Array.isArray(window.LOCATIONS) ? window.LOCATIONS : [];
  if (!all.length || typeof window.getLocationUnlockProgress !== 'function') return;

  let unlockedTier = 1;
  all.forEach((loc) => {
    const tier = Number(loc.tier || 1);
    if (tier <= 1) {
      unlockedTier = Math.max(unlockedTier, tier);
      return;
    }
    const info = getLocationUnlockProgress(loc.id, G);
    if (info && info.unlocked) unlockedTier = Math.max(unlockedTier, tier);
  });
  G.unlockedLocationTier = Math.max(prevTier, unlockedTier);
  if (G.unlockedLocationTier > prevTier && Number(G.playTime || 0) > 2) {
    const loc = all.find((x) => Number(x.tier || 0) === Number(G.unlockedLocationTier));
    if (loc) notify('🔓 Neuer Standort verfuegbar: ' + loc.name, 'gold');
  }
}

function ensureRigStaffState() {
  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  if (!G.rigStaffAssignments || typeof G.rigStaffAssignments !== 'object') G.rigStaffAssignments = {};
  if (!G.rigCrewFocus || typeof G.rigCrewFocus !== 'object') G.rigCrewFocus = {};
  ensureRigCrewProgressState();
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    if (!Number.isFinite(G.hiredRigStaff[tier.id])) G.hiredRigStaff[tier.id] = 0;
    G.hiredRigStaff[tier.id] = Math.max(0, Math.floor(G.hiredRigStaff[tier.id]));
  });
  (RIGS || []).forEach((rig) => {
    if (!G.rigStaffAssignments[rig.id] || typeof G.rigStaffAssignments[rig.id] !== 'object') {
      G.rigStaffAssignments[rig.id] = {};
    }
    if (typeof G.rigCrewFocus[rig.id] !== 'string' || !RIG_CREW_FOCUS[G.rigCrewFocus[rig.id]]) {
      G.rigCrewFocus[rig.id] = 'balanced';
    }
    (window.RIG_STAFF_TIERS || []).forEach((tier) => {
      if (!Number.isFinite(G.rigStaffAssignments[rig.id][tier.id])) {
        G.rigStaffAssignments[rig.id][tier.id] = 0;
      }
      G.rigStaffAssignments[rig.id][tier.id] = Math.max(0, Math.floor(G.rigStaffAssignments[rig.id][tier.id]));
    });
  });

  // Sicherheitsnetz: nie mehr Mitarbeiter zuweisen als eingestellt.
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    const hired = Number(G.hiredRigStaff[tier.id] || 0);
    let assigned = 0;
    (RIGS || []).forEach((rig) => {
      assigned += Number(((G.rigStaffAssignments[rig.id] || {})[tier.id]) || 0);
    });
    let overflow = assigned - hired;
    if (overflow <= 0) return;

    for (let i = (RIGS || []).length - 1; i >= 0 && overflow > 0; i--) {
      const rig = RIGS[i];
      const group = G.rigStaffAssignments[rig.id] || {};
      const current = Number(group[tier.id] || 0);
      if (current <= 0) continue;
      const cut = Math.min(current, overflow);
      group[tier.id] = current - cut;
      overflow -= cut;
    }
  });
}

function getRigCrewFocus(rigId) {
  ensureRigStaffState();
  const key = String(rigId || '');
  const focusId = String((G.rigCrewFocus || {})[key] || 'balanced');
  return RIG_CREW_FOCUS[focusId] || RIG_CREW_FOCUS.balanced;
}
window.getRigCrewFocus = getRigCrewFocus;

function getTotalAssignedRigStaffByTier(tierId) {
  ensureRigStaffState();
  return Object.values(G.rigStaffAssignments || {}).reduce((sum, group) => {
    return sum + Number((group && group[tierId]) || 0);
  }, 0);
}

function getRigStaffHireCost(tierId) {
  const tier = (window.RIG_STAFF_TIERS || []).find((x) => x.id === tierId);
  if (!tier) return Infinity;
  ensureRigStaffState();
  const hired = Number(G.hiredRigStaff[tierId] || 0);
  const base = Number(tier.hireBaseCost || 0) * Math.pow(Number(tier.hireCostMult || 1.5), hired);
  const prestigeHireMult = Math.max(0.55, Number(G._prestigeShopCostMult || 1));
  return Math.ceil(base * Math.max(0.4, Number(G._buildCostMult || 1)) * prestigeHireMult);
}

function getRigStaffDailyWages() {
  ensureRigStaffState();
  const shopWageMult = Math.max(0.55, Number(G._shopStaffWageMult || 1));
  const prestigeWageMult = Math.max(0.55, Number(G._prestigeCrewWageMult || 1));
  return (window.RIG_STAFF_TIERS || []).reduce((sum, tier) => {
    const hired = Number(G.hiredRigStaff[tier.id] || 0);
    if (hired <= 0) return sum;
    const progress = getRigCrewTierProgress(tier.id);
    const spec = RIG_CREW_SPECS[progress.spec] || RIG_CREW_SPECS.balanced;
    let focusWeighted = 0;
    let focusUnits = 0;
    (RIGS || []).forEach((rig) => {
      const assigned = Math.max(0, Number((((G.rigStaffAssignments || {})[rig.id] || {})[tier.id]) || 0));
      if (assigned <= 0) return;
      const focus = getRigCrewFocus(rig.id);
      focusWeighted += assigned * Number(focus.wage || 1);
      focusUnits += assigned;
    });
    const focusWageMult = focusUnits > 0 ? (focusWeighted / focusUnits) : 1;
    const levelMult = 1 + Math.max(0, Number(progress.level || 1) - 1) * 0.04;
    const wageMult = Math.max(0.6, levelMult * Number(spec.wage || 1) * focusWageMult * shopWageMult * prestigeWageMult);
    return sum + hired * Number(tier.wagePerDay || 0) * wageMult;
  }, 0);
}

function getRigMaintenanceStats(rigId) {
  ensureRigStaffState();
  const rigCount = Math.max(0, Number((G.rigs || {})[rigId] || 0));
  if (rigCount <= 0) {
    return { rigCount: 0, capacity: 0, coverage: 1, uncoveredRatio: 0, repairPerSec: 0, crashReduction: 0 };
  }

  const assigned = G.rigStaffAssignments[rigId] || {};
  const focus = getRigCrewFocus(rigId);
  let capacity = 0;
  let repairPerSecTotal = 0;
  let crashReductionTotal = 0;
  const staffEffMult = Math.max(0.5, Number(G._shopStaffEffMult || 1));
  const prestigeCrewEff = Math.max(0.65, Number(G._prestigeCrewEffMult || 1));
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    const count = Math.max(0, Number(assigned[tier.id] || 0));
    if (count <= 0) return;
    const progress = getRigCrewTierProgress(tier.id);
    const spec = RIG_CREW_SPECS[progress.spec] || RIG_CREW_SPECS.balanced;
    const lv = Math.max(1, Number(progress.level || 1));
    const lvlCap = 1 + (lv - 1) * 0.03;
    const lvlRepair = 1 + (lv - 1) * 0.05;
    const lvlCrash = 1 + (lv - 1) * 0.04;
    capacity += count * Number(tier.rigsPerUnit || 0) * lvlCap * Number(spec.cap || 1) * Number(focus.cap || 1) * staffEffMult * prestigeCrewEff;
    repairPerSecTotal += count * Number(tier.repairPerSec || 0) * lvlRepair * Number(spec.repair || 1) * Number(focus.repair || 1) * staffEffMult * prestigeCrewEff;
    crashReductionTotal += count * Number(tier.crashReduction || 0) * lvlCrash * Number(spec.crash || 1) * Number(focus.crash || 1) * Math.max(0.65, staffEffMult) * Math.max(0.75, prestigeCrewEff);
  });

  const coverage = Math.max(0, Math.min(1, capacity / rigCount));
  const uncoveredRatio = Math.max(0, 1 - coverage);
  const maintMult = Math.max(0.5, Number(G._locMaintenanceMult || 1));
  const repairPerSec = (repairPerSecTotal * maintMult) / Math.max(1, rigCount);
  const crashReduction = Math.min(0.85, crashReductionTotal * coverage * maintMult);

  return { rigCount, capacity, coverage, uncoveredRatio, repairPerSec, crashReduction };
}

function getGlobalRigStaffCoverage() {
  ensureRigStaffState();
  const totalRigs = getTotalRigCount();
  if (totalRigs <= 0) return 1;

  let covered = 0;
  (RIGS || []).forEach((rig) => {
    const count = Number((G.rigs || {})[rig.id] || 0);
    if (count <= 0) return;
    const stats = getRigMaintenanceStats(rig.id);
    covered += Math.min(count, Number(stats.capacity || 0));
  });
  return Math.max(0, Math.min(1, covered / totalRigs));
}

function computeLocationEffects() {
  const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const bonus = (loc && loc.bonus) ? loc.bonus : {};
  const shopFx = (typeof window.getCurrentLocationShopEffects === 'function')
    ? getCurrentLocationShopEffects()
    : {};

  G._shopHpsMult = Number(shopFx.hpsMult || 1);
  G._shopStaffEffMult = Number(shopFx.staffEffMult || 1);
  G._shopStaffWageMult = Number(shopFx.staffWageMult || 1);
  G._shopCrewXpMult = Number(shopFx.crewXpMult || 1);
  G._shopCrashRiskMult = Number(shopFx.crashRiskMult || 1);
  G._shopPowerUsageMult = Number(shopFx.powerUsageMult || 1);

  G._locClickMult = Number(bonus.clickMult || 1) * Number(shopFx.clickMult || 1);
  G._locEnergyDrainMult = Number(bonus.energyDrainMult || 1);
  G._locBatteryChargeMult = Number(bonus.batteryChargeMult || 1);
  G._locPowerCapMult = Number(bonus.powerCapMult || 1);
  G._locEventPenaltyMult = Number(bonus.eventPenaltyMult || 1);
  G._locMaintenanceMult = Number(bonus.maintenanceMult || 1);
  G._locCrashRiskMult = Number(bonus.crashRiskMult || 1) * G._shopCrashRiskMult;
  G._locPowerUsageMult = Number(bonus.powerUsageMult || 1) * G._shopPowerUsageMult;

  G._rigStaffCoverage = getGlobalRigStaffCoverage();
}

function getClickPower() {
  return Math.max(1, Math.floor((1 + G._clickBonus) * G._clickMult * Number(G._locClickMult || 1)));
}

function getRigCost(rigId, qty = 1) {
  const r = RIGS.find(x => x.id === rigId);
  if (!r) return Infinity;
  const owned = G.rigs[rigId] || 0;
  let cost = 0;
  for (let i = 0; i < qty; i++) {
    cost += r.baseCost * Math.pow(RIG_SCALE, owned + i);
  }
  return Math.ceil(cost * G._rigCostMult);
}

function getPowerCapForPurchases() {
  const baseCap = Math.max(
    Number(POWER_BALANCE.minCapacityKw || 0.5),
    Number(G.powerCapacityKw || POWER_BALANCE.startCapacityKw || 3)
  );
  const eventCapMult = Number(G._powerEventCapMult || 1);
  const locCapMult = Math.max(0.5, Number(G._locPowerCapMult || 1));
  const prestigeCapMult = Math.max(1, Number(G._prestigePowerCapMult || 1));
  const provider = getPowerProviderById(G.powerProviderId);
  const providerCapMult = Math.max(0.6, Number((provider && provider.capMult) || 1));
  return Math.max(0.25, baseCap * eventCapMult * providerCapMult * locCapMult * prestigeCapMult);
}
window.getPowerCapForPurchases = getPowerCapForPurchases;

function getRigPowerUsageKw(rigId, count = 1) {
  const rig = RIGS.find((x) => x.id === rigId);
  if (!rig) return 0;
  const qty = Math.max(0, Number(count || 0));
  if (qty <= 0) return 0;
  const mods = (G.rigMods && G.rigMods[rigId]) ? G.rigMods[rigId] : [];
  const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
  const energyMult = Number(bonuses.energyDrain || 1);
  const watt = Number(rig.powerW || 0) * Math.max(0.4, Math.min(2.2, energyMult));
  return ((watt * qty) / 1000) * Number(G._locPowerUsageMult || 1);
}
window.getRigPowerUsageKw = getRigPowerUsageKw;

function getMaxRigBuyByPower(rigId) {
  const perRigKw = getRigPowerUsageKw(rigId, 1);
  if (perRigKw <= 0.000001) return Infinity;
  const usageKw = (typeof getTotalPowerUsageKw === 'function')
    ? getTotalPowerUsageKw()
    : Math.max(0, Number(G.powerUsageKw || 0));
  const capKw = getPowerCapForPurchases();
  const headroomKw = Math.max(0, capKw - usageKw);
  return Math.max(0, Math.floor((headroomKw + 1e-9) / perRigKw));
}
window.getMaxRigBuyByPower = getMaxRigBuyByPower;

function getMaxBuyable(rigId) {
  const r = RIGS.find(x => x.id === rigId);
  if (!r) return 0;
  const owned = G.rigs[rigId] || 0;
  const capacityLeft = Math.max(0, getCurrentLocationRigCap() - getTotalRigCount());
  const powerLeft = getMaxRigBuyByPower(rigId);
  const hardLimit = Math.max(0, Math.min(capacityLeft, powerLeft));
  if (hardLimit <= 0) return 0;
  let cost = 0, n = 0;
  while (true) {
    cost += r.baseCost * Math.pow(RIG_SCALE, owned + n) * G._rigCostMult;
    if (cost > G.usd || n >= hardLimit || n > 9999) break;
    n++;
  }
  return n;
}

function getStaffCost(staffId) {
  const s = STAFF.find(x => x.id === staffId);
  if (!s) return Infinity;
  return Math.ceil(s.costBase * Math.pow(s.costMult, G.staff[staffId] || 0) * Math.max(0.4, Number(G._buildCostMult || 1)));
}

function getCoreStaffDailyWages() {
  const list = Array.isArray(STAFF) ? STAFF : [];
  let total = 0;
  list.forEach((s) => {
    const hired = Math.max(0, Number((G.staff || {})[s.id] || 0));
    if (hired <= 0) return;
    const wagePerDay = Math.max(0, Number(s.wagePerDay || 0));
    total += hired * wagePerDay;
  });
  return total;
}
window.getCoreStaffDailyWages = getCoreStaffDailyWages;

function getEffectiveUpgradeCost(upgradeId) {
  const upg = (UPGRADES || []).find((u) => u.id === upgradeId);
  if (!upg) return Infinity;
  return Math.ceil(Number(upg.cost || 0) * Math.max(0.45, Number(G._buildCostMult || 1)));
}
window.getEffectiveUpgradeCost = getEffectiveUpgradeCost;

function getEffectiveResearchCost(researchId) {
  const res = (RESEARCH || []).find((r) => r.id === researchId);
  if (!res) return Infinity;
  return Math.ceil(Number(res.cost || 0) * Math.max(0.45, Number(G._researchCostMult || 1)));
}
window.getEffectiveResearchCost = getEffectiveResearchCost;

function getCoinProfile(coin) {
  const key = String(coin || 'BTC').toUpperCase();
  const profiles = (typeof COIN_PROFILES === 'object' && COIN_PROFILES) ? COIN_PROFILES : {};
  const profile = profiles[key] || {};
  return {
    miningHashMult: Math.max(0.25, Number(profile.miningHashMult || 1)),
    convMult: Math.max(0.55, Number(profile.convMult || 1)),
    driftBias: Number(profile.driftBias || 0),
    noiseMult: Math.max(0.35, Number(profile.noiseMult || 1)),
    reversionMult: Math.max(0.35, Number(profile.reversionMult || 1)),
    shockMult: Math.max(0.25, Number(profile.shockMult || 1)),
    yieldLabel: String(profile.yieldLabel || ''),
  };
}
window.getCoinProfile = getCoinProfile;

// ── Effektive Konversionsrate (Hashes pro Coin) ───────────────
function getConvRate() {
  return getConvRateForCoin(G.selectedCoin || 'BTC');
}

function getConvRateForCoin(coin) {
  const profile = getCoinProfile(coin);
  const base = Math.max(10, Number(HASH_PER_COIN || 12000));
  return Math.max(
    10,
    Math.ceil(base * Number(G._difficulty || 1) * profile.convMult / Math.max(0.1, Number(G._convMult || 1)))
  );
}
window.getConvRateForCoin = getConvRateForCoin;

function getTotalPowerUsageKw() {
  let kw = 0;
  RIGS.forEach(r => {
    const count = Number(G.rigs[r.id] || 0);
    if (count <= 0) return;

    const mods = (G.rigMods && G.rigMods[r.id]) ? G.rigMods[r.id] : [];
    const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
    const energyMult = Number(bonuses.energyDrain || 1);
    const watt = Number(r.powerW || 0) * Math.max(0.4, Math.min(2.2, energyMult));
    kw += (watt * count) / 1000;
  });
  return kw * Number(G._locPowerUsageMult || 1);
}

function getTariffForMinute(minuteOfDay) {
  const m = Math.max(0, Math.min(1439, Math.floor(minuteOfDay)));
  const tariffs = Array.isArray(POWER_BALANCE.tariffs) ? POWER_BALANCE.tariffs : [];
  for (const t of tariffs) {
    if (m >= t.start && m < t.end) return { label: t.label, price: t.price };
  }
  return { label: 'Tag', price: POWER_BALANCE.basePricePerKwh };
}

function triggerPowerEvent() {
  const roll = Math.random();
  let event = null;

  if (roll < 0.42) {
    event = {
      label: 'Netzstoerung',
      duration: 90,
      priceMult: 1.6,
      capMult: 0.85,
      crashMult: 1.4,
      msg: '⚡ Netzstoerung: Strom teurer, Kapazitaet sinkt, Risiko steigt!',
      type: 'error',
    };
  } else if (roll < 0.74) {
    event = {
      label: 'Lastsenkung',
      duration: 120,
      priceMult: 0.75,
      capMult: 1.0,
      crashMult: 1.0,
      msg: '🌙 Lastsenkung: guenstiger Strom fuer kurze Zeit.',
      type: 'success',
    };
  } else {
    event = {
      label: 'Industrie-Boost',
      duration: 110,
      priceMult: 1.0,
      capMult: 1.2,
      crashMult: 0.9,
      msg: '🏭 Industrie-Boost: zusaetzliche Netzkapazitaet aktiv.',
      type: 'gold',
    };
  }

  G.powerEventLabel = event.label;
  G.powerEventRemaining = event.duration;
  G._powerEventPriceMult = event.priceMult;
  G._powerEventCapMult = event.capMult;
  G._powerEventCrashMult = event.crashMult;
  updateTicker(event.msg);
  notify(event.msg, event.type);
}

function getDailyOpsBillPreview() {
  const dayNo = Math.max(1, Math.floor(Number(G.worldDay || 1)));
  const minuteRaw = Math.max(0, Number(G.worldTimeMinutes || 0));
  const minuteOfDay = ((Math.floor(minuteRaw) % 1440) + 1440) % 1440;
  const elapsedRatio = Math.max(0.04, Math.min(1, minuteOfDay / 1440));

  const usagePart = Math.max(0, Number(G.powerBillAccrued || 0));
  const projectedUsage = usagePart / elapsedRatio;
  const infraLevel = Number(G.powerInfraLevel || 0);
  const opsCostMult = Math.max(0.4, Number(G._opsCostMult || 1));
  const infraFee = POWER_BALANCE.billBaseFee + infraLevel * POWER_BALANCE.billLevelFee;
  const overload = Math.max(0, Number(G._powerLoadRatio || 0) - 1);
  const peakFee = overload * POWER_BALANCE.billPeakFeeMult;
  const provider = getPowerProviderById(G.powerProviderId);
  const providerFee = Math.max(0, Number((provider && provider.baseFeePerDay) || 0)) * opsCostMult;
  const powerTotal = Math.max(0, projectedUsage + (infraFee + peakFee) * opsCostMult + providerFee);

  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const rent = Math.max(0, Number((location && location.rentPerDay) || 0)) * opsCostMult;
  const coreWages = Math.max(0, getCoreStaffDailyWages()) * opsCostMult;
  const crewWages = Math.max(0, getRigStaffDailyWages()) * opsCostMult;
  const wages = coreWages + crewWages;
  const leaseFees = Math.max(0, getDailyLeaseCostTotal()) * opsCostMult;
  const insuranceFees = Math.max(0, getInsuranceDailyPremium()) * opsCostMult;

  const loans = Array.isArray(G.loans) ? G.loans : [];
  const loanInterest = loans.reduce((sum, loan) => {
    const outstanding = Math.max(0, Number((loan && loan.outstanding) || 0));
    const rate = Math.max(0, Number((loan && loan.ratePerDay) || 0.015));
    return sum + outstanding * rate;
  }, 0);
  const lateFees = loans.reduce((sum, loan) => {
    const outstanding = Math.max(0, Number((loan && loan.outstanding) || 0));
    const dueDay = Number((loan && loan.dueDay) || 0);
    if (outstanding <= 0 || dueDay <= 0 || dayNo <= dueDay) return sum;
    const overdue = dayNo - dueDay;
    const late = outstanding * Math.min(0.03, overdue * 0.0035);
    return sum + late;
  }, 0);

  const rawTotal = Math.max(0, powerTotal + rent + wages + leaseFees + insuranceFees + loanInterest + lateFees);
  const bnbDiscountPct = Math.max(0, Math.min(0.35, Number(getBnbOpsDiscount() || 0)));
  const bnbDiscountValue = rawTotal * bnbDiscountPct;
  const total = Math.max(0, rawTotal - bnbDiscountValue);

  const usdNow = Number(G.usd || 0);
  const usdAfter = usdNow - total;
  const runwayDays = total > 0.01
    ? (usdNow > 0 ? usdNow / total : 0)
    : Infinity;

  let riskStage = 'stable';
  let riskLabel = 'Stabil';
  if (usdAfter < 0 && usdAfter >= -total * 0.6) {
    riskStage = 'overdraft';
    riskLabel = 'Ueberzug';
  } else if (usdAfter < -total * 0.6) {
    riskStage = 'critical';
    riskLabel = 'Kritisch';
  } else if (usdAfter < total * 0.45) {
    riskStage = 'tight';
    riskLabel = 'Knapp';
  }

  return {
    day: dayNo,
    minuteOfDay,
    elapsedRatio,
    providerName: provider ? provider.name : 'Spot-Markt',
    power: Number(powerTotal.toFixed(2)),
    rent: Number(rent.toFixed(2)),
    wages: Number(wages.toFixed(2)),
    wagesCore: Number(coreWages.toFixed(2)),
    wagesCrew: Number(crewWages.toFixed(2)),
    lease: Number(leaseFees.toFixed(2)),
    insurance: Number(insuranceFees.toFixed(2)),
    loanInterest: Number((loanInterest + lateFees).toFixed(2)),
    bnbDiscountPct: Number((bnbDiscountPct * 100).toFixed(2)),
    bnbDiscountValue: Number(bnbDiscountValue.toFixed(2)),
    total: Number(total.toFixed(2)),
    usdNow: Number(usdNow.toFixed(2)),
    usdAfter: Number(usdAfter.toFixed(2)),
    runwayDays: Number.isFinite(runwayDays) ? Number(runwayDays.toFixed(2)) : runwayDays,
    riskStage,
    riskLabel,
  };
}
window.getDailyOpsBillPreview = getDailyOpsBillPreview;

function getOpsDebtValue() {
  const debt = Math.max(Number(G.dailyOpsDebt || 0), Number(G.powerDebt || 0));
  G.dailyOpsDebt = debt;
  G.powerDebt = debt;
  return debt;
}

function addOpsDebt(amount) {
  const add = Math.max(0, Number(amount || 0));
  if (add <= 0) return getOpsDebtValue();
  const total = getOpsDebtValue() + add;
  G.dailyOpsDebt = total;
  G.powerDebt = total;
  return total;
}

function getOpsDebtStageInfo(debtRaw) {
  const debt = Math.max(0, Number(debtRaw || 0));
  if (debt >= POWER_BALANCE.debtStageShutdown) {
    return {
      stage: 4,
      label: 'Abschaltung',
      perfMult: 0,
      crashMult: 1.55,
      passiveMult: 0.35,
      shutdown: true,
      notifyMsg: '⛔ Abschaltung: Betrieb wegen Schulden gestoppt.',
      notifyType: 'error',
    };
  }
  if (debt >= POWER_BALANCE.debtStageCritical) {
    return {
      stage: 3,
      label: 'Notbetrieb',
      perfMult: 0.62,
      crashMult: 1.35,
      passiveMult: 0.75,
      shutdown: false,
      notifyMsg: '🚨 Notbetrieb: starke Leistungseinbussen durch hohe Schulden.',
      notifyType: 'error',
    };
  }
  if (debt >= POWER_BALANCE.debtStagePenalty) {
    return {
      stage: 2,
      label: 'Sanktion',
      perfMult: 0.88,
      crashMult: 1.12,
      passiveMult: 0.92,
      shutdown: false,
      notifyMsg: '⚠️ Sanktion aktiv: Schulden belasten die Mining-Leistung.',
      notifyType: 'warning',
    };
  }
  if (debt >= POWER_BALANCE.debtStageWarn) {
    return {
      stage: 1,
      label: 'Mahnung',
      perfMult: 1,
      crashMult: 1,
      passiveMult: 1,
      shutdown: false,
      notifyMsg: '📨 Mahnung: Betriebsschuld wird faellig.',
      notifyType: 'warning',
    };
  }
  return {
    stage: 0,
    label: 'Stabil',
    perfMult: 1,
    crashMult: 1,
    passiveMult: 1,
    shutdown: false,
    notifyMsg: '✅ Schuldenstatus wieder stabil.',
    notifyType: 'success',
  };
}

function applyOpsDebtStage(debt) {
  const info = getOpsDebtStageInfo(debt);
  const prevStage = Math.max(0, Number(G.opsDebtStage || 0));
  if (prevStage !== info.stage) {
    notify(info.notifyMsg, info.notifyType);
  }
  G.opsDebtStage = info.stage;
  G.opsDebtStageLabel = info.label;
  G._opsShutdown = !!info.shutdown;
  G._opsPassiveIncomeMult = Math.max(0.05, Number(info.passiveMult || 1));
  return info;
}

function applyInsolvencyReset(billDay) {
  let lostRigs = 0;
  (RIGS || []).forEach((rig) => {
    const owned = Math.max(0, Number((G.rigs || {})[rig.id] || 0));
    if (owned <= 0) return;
    let cut = Math.floor(owned * 0.35);
    if (cut <= 0 && owned > 0) cut = 1;
    G.rigs[rig.id] = Math.max(0, owned - cut);
    lostRigs += cut;
  });

  G.totalRigs = getTotalRigCount();
  G.hiredRigStaff = {};
  G.rigStaffAssignments = {};
  (RIGS || []).forEach((rig) => { G.rigStaffAssignments[rig.id] = {}; });
  if (!G.rigEnergy || typeof G.rigEnergy !== 'object') G.rigEnergy = {};
  (RIGS || []).forEach((rig) => { G.rigEnergy[rig.id] = 100; });
  G.locationId = 'home_pc';
  G.locationMoveBoostUntilDay = 0;
  G.usd = Math.max(0, Number(G.usd || 0) * 0.25);
  G.powerBillAccrued = 0;
  G.dailyOpsDebt = 0;
  G.powerDebt = 0;
  G.opsDebtStrikeDays = 0;
  G.opsDebtStage = 0;
  G.opsDebtStageLabel = 'Stabil';
  G._opsShutdown = false;
  G._opsPassiveIncomeMult = 1;
  G.loans = [];
  G.nextLoanId = 1;
  G.insuranceActive = false;
  G.insuranceTier = 0;
  G.leasedRigs = {};
  (RIGS || []).forEach((rig) => { G.leasedRigs[rig.id] = 0; });

  notify(
    '💥 Insolvenz (Tag ' + billDay + '): ' + lostRigs + ' Rigs eingezogen, Crew aufgeloest, Standort zurueckgesetzt.',
    'error'
  );
  notify('🏦 Schulden wurden auf $0 gesetzt. Betrieb neu aufbauen.', 'gold');
}

function settleDailyOperationsBill(billDay) {
  const dayNo = Math.max(1, Math.floor(Number(billDay || G.worldDay || 1)));
  const lastDay = Math.max(0, Math.floor(Number(G.dailyLastBilledDay || 0)));
  if (dayNo <= lastDay) return;

  const usagePart = Number(G.powerBillAccrued || 0);
  const infraLevel = Number(G.powerInfraLevel || 0);
  const opsCostMult = Math.max(0.4, Number(G._opsCostMult || 1));
  const infraFee = POWER_BALANCE.billBaseFee + infraLevel * POWER_BALANCE.billLevelFee;
  const overload = Math.max(0, Number(G._powerLoadRatio || 0) - 1);
  const peakFee = overload * POWER_BALANCE.billPeakFeeMult;
  const provider = getPowerProviderById(G.powerProviderId);
  const providerFee = Math.max(0, Number(provider.baseFeePerDay || 0)) * opsCostMult;
  const powerTotal = Math.max(0, usagePart + (infraFee + peakFee) * opsCostMult + providerFee);
  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const rent = Math.max(0, Number((location && location.rentPerDay) || 0)) * opsCostMult;
  const coreWages = Math.max(0, getCoreStaffDailyWages()) * opsCostMult;
  const crewWages = Math.max(0, getRigStaffDailyWages()) * opsCostMult;
  const wages = coreWages + crewWages;
  const leaseFees = Math.max(0, getDailyLeaseCostTotal()) * opsCostMult;
  const insuranceFees = Math.max(0, getInsuranceDailyPremium()) * opsCostMult;
  let loanInterest = 0;
  let lateFees = 0;
  if (!Array.isArray(G.loans)) G.loans = [];
  G.loans.forEach((loan) => {
    if (!loan) return;
    const outstanding = Math.max(0, Number(loan.outstanding || 0));
    if (outstanding <= 0) return;
    const rate = Math.max(0, Number(loan.ratePerDay || 0.015));
    const interest = outstanding * rate;
    loan.outstanding = outstanding + interest;
    loanInterest += interest;
    if (Number(loan.dueDay || 0) > 0 && dayNo > Number(loan.dueDay || 0)) {
      const overdue = dayNo - Number(loan.dueDay || 0);
      const late = loan.outstanding * Math.min(0.03, overdue * 0.0035);
      loan.outstanding += late;
      lateFees += late;
    }
  });
  G.loans = G.loans.filter((loan) => Number((loan && loan.outstanding) || 0) > 0.5);
  const rawTotal = Math.max(0, powerTotal + rent + wages + leaseFees + insuranceFees + loanInterest + lateFees);
  const bnbDiscountPct = Math.max(0, Math.min(0.35, Number(getBnbOpsDiscount() || 0)));
  const bnbDiscountValue = rawTotal * bnbDiscountPct;
  const total = Math.max(0, rawTotal - bnbDiscountValue);

  G.powerBillAccrued = 0;
  G.powerPeakPenaltyAccrued = 0;
  G.dailyLastBilledDay = dayNo;
  if (total <= 0.01) return;

  const usdBefore = Number(G.usd || 0);
  G.usd = usdBefore - total;
  G.dailyOpsDebt = 0;
  G.powerDebt = 0;
  G.opsDebtStrikeDays = 0;
  applyOpsDebtStage(0);

  const billEntry = {
    day: dayNo,
    power: Number(powerTotal.toFixed(2)),
    rent: Number(rent.toFixed(2)),
    wages: Number(wages.toFixed(2)),
    wagesCore: Number(coreWages.toFixed(2)),
    wagesCrew: Number(crewWages.toFixed(2)),
    lease: Number(leaseFees.toFixed(2)),
    insurance: Number(insuranceFees.toFixed(2)),
    loanInterest: Number((loanInterest + lateFees).toFixed(2)),
    bnbDiscountPct: Number((bnbDiscountPct * 100).toFixed(2)),
    bnbDiscountValue: Number(bnbDiscountValue.toFixed(2)),
    total: Number(total.toFixed(2)),
    usdBefore: Number(usdBefore.toFixed(2)),
    usdAfter: Number(Number(G.usd || 0).toFixed(2)),
    debtAfter: 0,
  };
  G.lastDailyBill = billEntry;
  G.lastFinanceBill = {
    day: dayNo,
    provider: provider.name,
    lease: billEntry.lease,
    insurance: billEntry.insurance,
    loanInterest: billEntry.loanInterest,
    outstandingLoans: Number(getOutstandingLoanTotal().toFixed(2)),
  };
  if (!Array.isArray(G.dailyBillHistory)) G.dailyBillHistory = [];
  G.dailyBillHistory.unshift(billEntry);
  if (G.dailyBillHistory.length > 20) G.dailyBillHistory.length = 20;

  notify(
    '🧾 Tagesabrechnung T' + dayNo +
    ': Strom $' + fmtNum(powerTotal, 2) +
    ' + Miete $' + fmtNum(rent, 2) +
    ' + Lohn $' + fmtNum(wages, 2) +
    (leaseFees > 0 ? (' + Leasing $' + fmtNum(leaseFees, 2)) : '') +
    (insuranceFees > 0 ? (' + Versicherung $' + fmtNum(insuranceFees, 2)) : '') +
    (loanInterest + lateFees > 0 ? (' + Kredit $' + fmtNum(loanInterest + lateFees, 2)) : '') +
    (bnbDiscountValue > 0.01 ? (' - BNB-Rabatt $' + fmtNum(bnbDiscountValue, 2)) : '') +
    ' = $' + fmtNum(total, 2) +
    ' | Konto: $' + fmtNum(G.usd, 2),
    'warning'
  );
  if (Number(G.usd || 0) < 0) notify('⚠️ Konto im Minus: $' + fmtNum(G.usd, 2), 'error');

  // Crew-Entwicklung: XP pro Tag durch aktive Betreuung.
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    const hired = Math.max(0, Number((G.hiredRigStaff || {})[tier.id] || 0));
    if (hired <= 0) return;
    const assigned = getTotalAssignedRigStaffByTier(tier.id);
    const xpGain = (hired * 0.6 + assigned * 0.9)
      * Math.max(0.5, Number(G._shopCrewXpMult || 1))
      * Math.max(0.7, Number(G._prestigeCrewEffMult || 1));
    addRigCrewXp(tier.id, xpGain);
  });
}

function updatePowerSystem(dt) {
  const timeScale = Math.max(0.25, Number(G._timeScaleMinPerSec || 1));
  G.worldTimeMinutes = Number(G.worldTimeMinutes || 0) + dt * timeScale;
  G.worldDay = Math.max(1, Number(G.worldDay || 1));
  let dayTransitions = 0;
  while (G.worldTimeMinutes >= 1440) {
    G.worldTimeMinutes -= 1440;
    G.worldDay += 1;
    dayTransitions += 1;
  }
  if (dayTransitions > 0) {
    for (let i = 0; i < dayTransitions; i++) {
      const billedDay = G.worldDay - dayTransitions + i;
      settleDailyOperationsBill(billedDay);
    }
  }

  G.powerEventRemaining = Math.max(0, Number(G.powerEventRemaining || 0) - dt);
  if (G.powerEventRemaining <= 0 && G.powerEventLabel) {
    G.powerEventLabel = '';
    G._powerEventPriceMult = 1;
    G._powerEventCapMult = 1;
    G._powerEventCrashMult = 1;
    notify('⚡ Stromnetz wieder stabil.', 'success');
  }

  G._powerEventSpawnTimer = Number(G._powerEventSpawnTimer || 0) - dt;
  if (G._powerEventSpawnTimer <= 0) {
    G._powerEventSpawnTimer = POWER_BALANCE.eventMinDelaySec + Math.random() * (POWER_BALANCE.eventMaxDelaySec - POWER_BALANCE.eventMinDelaySec);
    if (Math.random() < POWER_BALANCE.eventChance && G.totalRigs > 0) triggerPowerEvent();
  }

  const eventPenaltyMult = Math.max(0.4, Number(G._locEventPenaltyMult || 1));
  const applyPenaltyToHigh = (value) => value > 1 ? (1 + (value - 1) * eventPenaltyMult) : value;
  const applyPenaltyToLow = (value) => value < 1 ? (1 - (1 - value) * eventPenaltyMult) : value;

  const tariff = getTariffForMinute(G.worldTimeMinutes);
  const priceMult = applyPenaltyToHigh(Number(G._powerEventPriceMult || 1));
  const capMult = applyPenaltyToLow(Number(G._powerEventCapMult || 1));
  const crashMult = applyPenaltyToHigh(Number(G._powerEventCrashMult || 1));
  const provider = getPowerProviderById(G.powerProviderId);

  const rawUsageKw = getTotalPowerUsageKw();
  const baseCapKw = Math.max(POWER_BALANCE.minCapacityKw, Number(G.powerCapacityKw || POWER_BALANCE.startCapacityKw));
  const providerCapMult = Math.max(0.6, Number(provider.capMult || 1));
  const effectiveCapKw = Math.max(
    0.25,
    baseCapKw *
      capMult *
      providerCapMult *
      Math.max(0.5, Number(G._locPowerCapMult || 1)) *
      Math.max(1, Number(G._prestigePowerCapMult || 1))
  );

  // ── Strom-V3: Notstrom-Akku (Peak-Shaving / Laden bei Reserve) ──
  const hours = Math.max(0.000001, dt / 3600);
  const batteryCap = Math.max(0, Number(G.powerBatteryCapacityKwh || 0));
  let batteryLevel = Math.max(0, Number(G.powerBatteryLevelKwh || 0));
  let batteryMode = 'idle';
  let batteryFlowKw = 0;
  let gridUsageKw = rawUsageKw;

  if (batteryCap > 0) {
    batteryLevel = Math.min(batteryCap, batteryLevel);
    const chargeRateKw = Math.max(0.1, Number(G.powerBatteryChargeRateKw || 1.2)) * Math.max(0.5, Number(G._locBatteryChargeMult || 1));
    const dischargeRateKw = Math.max(0.1, Number(G.powerBatteryDischargeRateKw || 1.5));
    const cycleLoss = Math.max(0, Math.min(0.15, Number(G.powerBatteryCycleLoss || 0.03)));

    const overloadKw = Math.max(0, rawUsageKw - effectiveCapKw);
    if (overloadKw > 0.001 && batteryLevel > 0.001) {
      const maxKwByStorage = batteryLevel / hours;
      const dischargeKw = Math.min(overloadKw, dischargeRateKw, maxKwByStorage);
      batteryLevel = Math.max(0, batteryLevel - dischargeKw * hours);
      gridUsageKw = Math.max(0, rawUsageKw - dischargeKw);
      batteryMode = 'entlaedt';
      batteryFlowKw = -dischargeKw;
    } else if (rawUsageKw < effectiveCapKw * 0.85 && batteryLevel < batteryCap - 0.001) {
      const spareKw = Math.max(0, effectiveCapKw * 0.85 - rawUsageKw);
      const maxKwBySpace = (batteryCap - batteryLevel) / hours;
      const chargeKw = Math.min(spareKw, chargeRateKw, maxKwBySpace);
      const storedKwh = chargeKw * hours * (1 - cycleLoss);
      batteryLevel = Math.min(batteryCap, batteryLevel + storedKwh);
      gridUsageKw = rawUsageKw + chargeKw;
      batteryMode = 'laedt';
      batteryFlowKw = chargeKw;
    } else if (batteryLevel <= 0.01) {
      batteryMode = 'leer';
    } else if (batteryLevel >= batteryCap - 0.01) {
      batteryMode = 'voll';
    }
  } else {
    batteryLevel = 0;
    batteryMode = 'offline';
  }

  G.powerBatteryLevelKwh = batteryLevel;
  G.powerBatteryMode = batteryMode;
  G.powerBatteryGridOffsetKw = batteryFlowKw;

  let usageKw = Math.max(0, gridUsageKw);
  let loadRatio = usageKw / effectiveCapKw;

  let perfMult = 1;
  let overloadMult = 1;
  let crashRiskMult = 1;
  if (loadRatio > 1) {
    const excess = loadRatio - 1;
    perfMult = Math.max(POWER_BALANCE.overloadMinPerf, 1 - excess * POWER_BALANCE.overloadPerfPenaltyPerExcess);
    overloadMult = 1 + excess * POWER_BALANCE.overloadDrainPerExcess;
    crashRiskMult = 1 + excess * POWER_BALANCE.overloadCrashPerExcess;
  }

  const debt = getOpsDebtValue();
  if (debt > 0) {
    const debtPenalty = Math.min(POWER_BALANCE.debtPenaltyCap, debt / POWER_BALANCE.debtPenaltyDenom);
    perfMult *= (1 - debtPenalty);
    crashRiskMult *= (1 + debtPenalty);
  }
  const debtStageInfo = applyOpsDebtStage(debt);
  perfMult *= Number(debtStageInfo.perfMult || 1);
  crashRiskMult *= Number(debtStageInfo.crashMult || 1);
  if (debtStageInfo.shutdown) {
    usageKw = 0;
    loadRatio = 0;
    overloadMult = 1;
    perfMult = 0;
  }

  const overloaded = loadRatio > POWER_BALANCE.overloadWarnThreshold;
  if (overloaded && !G._powerWasOverloaded) {
    notify('⚠️ Stromnetz ueberlastet! Mining wird gedrosselt.', 'error');
  } else if (!overloaded && G._powerWasOverloaded) {
    notify('✅ Stromlast wieder im sicheren Bereich.', 'success');
  }
  G._powerWasOverloaded = overloaded;

  G.powerTariffLabel = tariff.label;
  const basePrice = Number(G.powerPriceBase || POWER_BALANCE.basePricePerKwh);
  if (provider.mode === 'fixed') {
    G.powerPriceCurrent = Math.max(0.01, Number(provider.fixedPrice || basePrice)) * priceMult;
  } else {
    const providerPriceMult = Math.max(0.6, Number(provider.priceMult || 1));
    G.powerPriceCurrent = basePrice * (tariff.price / POWER_BALANCE.basePricePerKwh) * priceMult * providerPriceMult;
  }
  G._powerProviderName = provider.name;
  G.powerUsageKw = usageKw;
  G._powerEffectiveCapKw = effectiveCapKw;
  G._powerLoadRatio = loadRatio;
  G._powerPerfMult = perfMult;
  G._powerOverloadMult = overloadMult;
  G._powerCrashMult = crashRiskMult * crashMult;

  const kwh = usageKw * (dt / 3600);
  G.powerBillAccrued = Number(G.powerBillAccrued || 0) + kwh * G.powerPriceCurrent;
  if (tariff.label === 'Peak' && usageKw > effectiveCapKw * 0.85) {
    const pressure = Math.max(0, loadRatio - 0.85);
    const peakPenalty = kwh * Number(G.powerPriceCurrent || 0) * (0.45 + pressure) * Math.max(0.7, Number(provider.peakPenaltyMult || 1));
    G.powerBillAccrued += peakPenalty;
    G.powerPeakPenaltyAccrued = Number(G.powerPeakPenaltyAccrued || 0) + peakPenalty;
  }

  const minsUntilMidnight = Math.max(0, 1440 - Number(G.worldTimeMinutes || 0));
  G.powerBillTimer = minsUntilMidnight / timeScale;
  G.powerBillInterval = 86400 / timeScale;
}

function checkRigModUnlocks(showNotice = true) {
  if (!window.RIG_MODS) return;
  if (!Array.isArray(G.unlockedMods)) G.unlockedMods = [];

  const mods = Object.keys(window.RIG_MODS);
  if (!mods.length) return;

  let changed = false;
  mods.forEach((modId) => {
    if (G.unlockedMods.includes(modId)) return;

    let shouldUnlock = false;
    if (typeof window.getRigModUnlockProgress === 'function') {
      const info = window.getRigModUnlockProgress(modId);
      shouldUnlock = !!(info && info.unlocked);
    }

    if (!shouldUnlock) return;
    G.unlockedMods.push(modId);
    changed = true;

    if (showNotice) {
      const mod = window.RIG_MODS[modId];
      const modName = mod && mod.name ? mod.name : modId;
      notify('🧩 Mod freigeschaltet: ' + modName, 'gold');
    }
  });

  if (changed) {
    if (typeof renderRigs === 'function') renderRigs();
    if (typeof renderPowerPanel === 'function') renderPowerPanel();
  }
}

// ── Zufälliges Event feuern ───────────────────────────────────
function fireRandomEvent() {
  if (!EVENTS || !EVENTS.length) return;

  const currentLocation = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const currentTier = Number((currentLocation && currentLocation.tier) || 1);
  const currentLocId = String((currentLocation && currentLocation.id) || 'home_pc');

  const eligibleEvents = EVENTS.filter((eventDef) => {
    if (!eventDef || !eventDef.fx) return false;
    if (Number.isFinite(eventDef.minLocationTier) && currentTier < Number(eventDef.minLocationTier)) return false;
    if (Number.isFinite(eventDef.maxLocationTier) && currentTier > Number(eventDef.maxLocationTier)) return false;
    if (Array.isArray(eventDef.locationIds) && eventDef.locationIds.length > 0 && !eventDef.locationIds.includes(currentLocId)) return false;
    return true;
  });
  const ungatedEvents = EVENTS.filter((eventDef) => {
    if (!eventDef || !eventDef.fx) return false;
    const hasTierGate = Number.isFinite(eventDef.minLocationTier) || Number.isFinite(eventDef.maxLocationTier);
    const hasLocGate = Array.isArray(eventDef.locationIds) && eventDef.locationIds.length > 0;
    return !hasTierGate && !hasLocGate;
  });
  const source = eligibleEvents.length ? eligibleEvents : ungatedEvents;
  if (!source.length) return;

  // Gewichtete Auswahl
  const pool = [];
  source.forEach(e => { for (let i = 0; i < e.w; i++) pool.push(e); });
  const ev  = pool[Math.floor(Math.random() * pool.length)];
  const now = Date.now();
  const fx  = ev.fx;
  const totalEarned = Math.max(0, Number(G.totalEarned || 0));
  const rewardScale = 0.30 + Math.min(1.10, Math.pow(totalEarned / 5000000, 0.40));

  // Effekt anwenden
  if (fx.t === 'priceAll' || fx.t === 'hash' || fx.t === 'allBoost') {
    const eName = { priceAll:'evPriceBoost', hash:'evHashBoost', allBoost:'evAllBoost' }[fx.t];
    G.activeBoosts = G.activeBoosts || [];
    G.activeBoosts.push({ effect: eName, mult: fx.m, endsAt: now + fx.dur * 1000 });
    G.activeEvent = { msg: ev.msg, fx, endsAt: now + fx.dur * 1000 };

  } else if (fx.t === 'price1') {
    // Echte Kurve statt harter Sprung: Impuls ueber Zeit verteilen.
    const pctMove = Number(fx.m || 1) - 1;
    const dur = Number(MARKET_BALANCE.eventImpulseDurationSecMin || 45) +
      Math.random() * Number((MARKET_BALANCE.eventImpulseDurationSecMax || 95) - (MARKET_BALANCE.eventImpulseDurationSecMin || 45));
    addMarketImpulse(fx.coin, pctMove, dur);
    G.activeEvent = { msg: ev.msg, fx: {t:'none'}, endsAt: now + 30000 };

  } else if (fx.t === 'freeCoins') {
    const scaled = Math.max(1, Math.floor(Number(fx.amount || 0) * Math.min(1, rewardScale * 0.85)));
    G.coins[fx.coin] = (G.coins[fx.coin] || 0) + scaled;
    notify('🎁 +' + scaled + ' ' + fx.coin + ' Airdrop!', 'gold');
    G.activeEvent = { msg: ev.msg, fx: {t:'none'}, endsAt: now + 25000 };

  } else if (fx.t === 'cash') {
    const payout = Math.max(500, Math.floor(Number(fx.amount || 0) * rewardScale));
    G.usd         += payout;
    G.totalEarned += payout;
    notify('💰 +$' + fmtNum(payout) + ' Bonus!', 'gold');
    G.activeEvent = { msg: ev.msg, fx: {t:'none'}, endsAt: now + 25000 };

  } else {
    // 'none' — nur Nachricht
    G.activeEvent = { msg: ev.msg, fx: {t:'none'}, endsAt: now + 35000 };
  }

  // Preis-All und All-Boost beeinflussen den Kurs ebenfalls sanft ueber Zeit.
  if (fx.t === 'priceAll' || fx.t === 'allBoost') {
    const totalPct = Number(fx.m || 1) - 1;
    const scaledPct = totalPct * (fx.t === 'priceAll' ? 0.45 : 0.30);
    const dur = Math.max(20, Number(fx.dur || 40));
    addMarketImpulse(null, scaledPct, dur);
  }

  // Event-Ticker loggen
  G.recentEvents = G.recentEvents || [];
  G.recentEvents.unshift({ msg: ev.msg, time: now });
  if (G.recentEvents.length > 10) G.recentEvents.pop();

  // Ticker + Notification
  updateTicker(ev.msg);
  const isNegative = (fx.t === 'priceAll' && fx.m < 1) ||
                     (fx.t === 'hash'     && fx.m < 1);
  notify('📡 ' + ev.msg, isNegative ? 'error' : 'gold', 6000);
}

// ── Daily Reset Check (Challenges, NPC Trader, Streaks) ──────
function checkDailyReset() {
  const lastReset = G._lastDailyReset || 0;
  const now = Date.now();
  const daysSince = Math.floor((now - lastReset) / 86400000);
  
  if (daysSince >= 1) {
    G._lastDailyReset = now;
    
    // ── Daily Challenges neu laden
    if (window.getDailyChallenges) {
      G.dailyChallenges = getDailyChallenges().map(c => ({
        id: c.id,
        name: c.name,
        progress: 0,
        completed: false,
        claimed: false
      }));
      G.challengeProgress = {};
    }
    
    // ── NPC Traders neu laden
    if (window.generateNPCDealsForDay) {
      G.npcTraders = generateNPCDealsForDay();
      G.npcUsedToday = {};
    }
    
    // ── Mining Streaks resetten
    G.miningStreaks = {};
  }
}

// ── Energy System: Drain bei Mining, Regen wenn idle ──────────
function updateRigEnergy(dt) {
  if (!G.rigEnergy) G.rigEnergy = {};
  if (!G._autoRepairCycle || typeof G._autoRepairCycle !== 'object') G._autoRepairCycle = {};
  if (!G._autoRepairWarnAt || typeof G._autoRepairWarnAt !== 'object') G._autoRepairWarnAt = {};
  
  // Initialisiere fehlende Rigs auf 100%
  RIGS.forEach(r => {
    if (!(r.id in G.rigEnergy)) G.rigEnergy[r.id] = 100;
  });

  RIGS.forEach(r => {
    const rigId = r.id;
    const count = G.rigs[rigId] || 0;
    let autoCycle = Number(G._autoRepairCycle[rigId] || 0);
    if (!Number.isFinite(autoCycle) || autoCycle < 0) autoCycle = 0;
    autoCycle = Math.max(0, autoCycle - dt);
    if (count === 0) {
      // Ohne aktive Rigs regeneriert die Energie dieses Rig-Typs wieder auf 100%.
      G.rigEnergy[rigId] = Math.min(100, (G.rigEnergy[rigId] || 100) + 3.0 * dt);
      G._autoRepairCycle[rigId] = 0;
      return;
    }
    if (G._opsShutdown) {
      // Bei Abschaltung sind die Rigs vom Netz getrennt und regenerieren langsam.
      G.rigEnergy[rigId] = Math.min(100, (G.rigEnergy[rigId] || 100) + 2.5 * dt);
      G._autoRepairCycle[rigId] = autoCycle;
      return;
    }
    
    // Berechne Energy-Drain basierend auf Mods
    const mods = (G.rigMods && G.rigMods[rigId]) ? G.rigMods[rigId] : [];
    const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
    const drainMult = bonuses.energyDrain || 1.0;
    const overloadMult = Number(G._powerOverloadMult || 1);
    const locDrainMult = Math.max(0.5, Number(G._locEnergyDrainMult || 1));
    const maintenance = getRigMaintenanceStats(rigId);
    const uncoveredPenalty = 1 + maintenance.uncoveredRatio * 0.45;
    
    const baseDrain = 0.8 * drainMult * overloadMult * locDrainMult * uncoveredPenalty; // % pro Sekunde wenn aktiv
    const repairPerSec = Math.max(0, Number(maintenance.repairPerSec || 0));
    
    // Wenn Rig mined → Drain; sonst Regen
    const currentEnergy = Number.isFinite(G.rigEnergy[rigId]) ? G.rigEnergy[rigId] : 100;
    let nextEnergy = currentEnergy - baseDrain * dt + repairPerSec * dt;

    // Auto-Reparatur je Rig-Typ (gebuendelte Abrechnung pro Intervall)
    const autoEnabled = !!(G.rigAutoRepair && G.rigAutoRepair[rigId]);
    const triggerPct = Math.max(5, Number(AUTO_REPAIR_BALANCE.triggerBelowPct || 88));
    const emergencyPct = Math.max(0, Number(AUTO_REPAIR_BALANCE.emergencyTriggerPct || 10));
    const intervalSec = Math.max(2, Number(AUTO_REPAIR_BALANCE.billingIntervalSec || 12));
    const retryDelaySec = Math.max(1, Number(AUTO_REPAIR_BALANCE.retryDelaySec || 3));
    const warnCooldownMs = Math.max(2000, Number(AUTO_REPAIR_BALANCE.warnCooldownSec || 10) * 1000);
    const isEmergency = nextEnergy <= emergencyPct;

    if (autoEnabled && nextEnergy < triggerPct) {
      const rig = (RIGS || []).find((x) => x.id === rigId);
      const canRunCycle = autoCycle <= 0 || isEmergency;
      if (rig && canRunCycle) {
        const perPct = Math.max(0.02, Number(rig.baseCost || 0) * 0.00022 * (1 + count * 0.015));
        const maxRepairBase = Math.max(1, Number(AUTO_REPAIR_BALANCE.maxRepairPctPerCycle || 32));
        const expectedDrainUntilNextCycle = Math.max(0, baseDrain - repairPerSec) * intervalSec * 1.25;
        const maxRepair = Math.max(maxRepairBase, expectedDrainUntilNextCycle);
        const targetPct = Math.max(triggerPct + 4, Number(AUTO_REPAIR_BALANCE.targetPct || 96));
        const need = Math.max(0, targetPct - nextEnergy);
        const desiredRepair = Math.min(maxRepair, need);
        // Fix: wenn Budget fuer den vollen Zyklus nicht reicht, Teilreparatur nutzen.
        let autoRepair = desiredRepair;
        if (autoRepair > 0.0001) {
          const usdAvail = Math.max(0, Number(G.usd || 0));
          const maxByUsd = Math.max(0, usdAvail / Math.max(0.0001, perPct));
          autoRepair = Math.min(autoRepair, maxByUsd);
        }
        if (autoRepair > 0.0001) {
          const ltcAvail = Math.max(0, Number((G.coins || {}).LTC || 0));
          const step = 0.25;
          const steps = Math.max(1, Math.floor(autoRepair / step));
          let fitted = 0;
          for (let i = steps; i >= 1; i--) {
            const pct = Number((i * step).toFixed(2));
            const usdNeed = pct * perPct;
            const ltcNeed = (typeof getRepairLtcCostByUsd === 'function') ? getRepairLtcCostByUsd(usdNeed) : 0;
            if (Number(G.usd || 0) + 1e-9 >= usdNeed && ltcAvail + 1e-9 >= ltcNeed) {
              fitted = pct;
              break;
            }
          }
          autoRepair = fitted;
        }
        const usdCost = autoRepair * perPct;
        const ltcCost = (typeof getRepairLtcCostByUsd === 'function') ? getRepairLtcCostByUsd(usdCost) : 0;
        if (
          autoRepair > 0.0001 &&
          Number(G.usd || 0) >= usdCost &&
          Number((G.coins || {}).LTC || 0) + 1e-9 >= ltcCost
        ) {
          G.usd -= usdCost;
          if (ltcCost > 0) {
            if (typeof spendCoin === 'function') {
              const spent = spendCoin('LTC', ltcCost);
              if (!spent) {
                G.usd += usdCost;
              } else {
                nextEnergy += autoRepair;
              }
            } else {
              G.coins.LTC = Math.max(0, Number((G.coins || {}).LTC || 0) - ltcCost);
              nextEnergy += autoRepair;
            }
          } else {
            nextEnergy += autoRepair;
          }
          autoCycle = isEmergency ? Math.max(1, Math.min(3, intervalSec * 0.25)) : intervalSec;
        } else {
          autoCycle = Math.min(Math.max(1, retryDelaySec), Math.max(2, intervalSec * 0.5));
          if (isEmergency) {
            const nowWarn = Date.now();
            const lastWarn = Number((G._autoRepairWarnAt || {})[rigId] || 0);
            if (nowWarn - lastWarn >= warnCooldownMs) {
              G._autoRepairWarnAt[rigId] = nowWarn;
              notify('⚠️ Auto-Repair fehlgeschlagen bei ' + rig.name + ' (USD/LTC fehlen).', 'error');
            }
          }
        }
      }
    } else if (!autoEnabled) {
      autoCycle = 0;
    }

    G.rigEnergy[rigId] = Math.max(0, Math.min(100, nextEnergy));
    G._autoRepairCycle[rigId] = autoCycle;
  });
}

// ── Rig Explosion Check: Risiko steigt mit niedriger Energy ────
function checkRigExplosions() {
  if (!G.rigExplosions) G.rigExplosions = {};

  const explodeRig = (rig, currentCount, reason) => {
    const rigId = rig.id;
    const leased = Math.max(0, Number(((G.leasedRigs || {})[rigId]) || 0));
    const insuranceActive = !!G.insuranceActive;
    G.rigExplosions[rigId] = true;
    G.rigs[rigId] = Math.max(0, currentCount - 1);
    G.totalRigs = Math.max(0, Number(G.totalRigs || 0) - 1);
    if (leased > 0 && G.leasedRigs) {
      G.leasedRigs[rigId] = Math.max(0, leased - 1);
    }
    // Gewünschtes Verhalten: nach jeder Explosion startet die Haltbarkeit wieder bei 100%.
    G.rigEnergy[rigId] = 100;
    if (insuranceActive) {
      const payout = Number(rig.baseCost || 0) * (0.28 + Math.min(0.20, Number(G.insuranceTier || 0) * 0.04));
      G.usd += payout;
      G.totalEarned += payout;
      notify('🛡️ Versicherung zahlt: +$' + fmtNum(payout), 'gold');
    }
    notify('💥 Rig ' + rig.name + ' EXPLODIERT (' + reason + ')! Haltbarkeit auf 100% reset.', 'error');
  };
  
  RIGS.forEach(r => {
    const rigId = r.id;
    const count = G.rigs[rigId] || 0;
    if (count === 0) return;
    if (G._opsShutdown) {
      G.rigExplosions[rigId] = false;
      return;
    }
    
    const energyRaw = G.rigEnergy[rigId];
    const energy = Number.isFinite(energyRaw) ? energyRaw : 100;

    // Fix fuer 0%-Stuck: bei leerer Haltbarkeit erzwingen wir eine Explosion sofort.
    if (energy <= 0.01) {
      explodeRig(r, count, '0% Haltbarkeit');
      return;
    }
    
    // Crash-Risiko: bei < 10% Energy ~2% pro Tick
    if (energy < 10) {
      const mods = (G.rigMods && G.rigMods[rigId]) ? G.rigMods[rigId] : [];
      const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
      const maintenance = getRigMaintenanceStats(rigId);
      const crashResist = Math.max(0, Math.min(0.95, Number(bonuses.crashResistance || 0) + Number(maintenance.crashReduction || 0)));
      const powerCrashMult = Math.max(1, Number(G._powerCrashMult || 1));
      const locCrashMult = Math.max(0.5, Number(G._locCrashRiskMult || 1));
      const uncoveredRisk = 1 + Number(maintenance.uncoveredRatio || 0) * 0.6;
      const insuranceMult = G.insuranceActive ? Math.max(0.55, 0.8 - Number(G.insuranceTier || 0) * 0.06) : 1;
      const crashRisk = Math.min(0.95, (G._crashRiskBase || 0.02) * (1 - crashResist) * powerCrashMult * locCrashMult * uncoveredRisk * insuranceMult);
      if (Math.random() < crashRisk) {
        explodeRig(r, count, 'Kritische Haltbarkeit');
      }
    } else {
      G.rigExplosions[rigId] = false;
    }
  });
}

// ── Mining Streaks: Bonus für lange Mining einer Coin ─────────
function updateMiningStreaks(dt) {
  G.miningStreaks = G.miningStreaks || {};
  
  // Welche Coins werden gerade gemined?
  const activeMiningCoins = new Set();
  Object.entries(G.rigTargets || {}).forEach(([rigId, coin]) => {
    if ((G.rigs[rigId] || 0) > 0) activeMiningCoins.add(coin);
  });

  Object.keys(COIN_DATA || {}).forEach(coin => {
    if (activeMiningCoins.has(coin)) {
      G.miningStreaks[coin] = (G.miningStreaks[coin] || 0) + dt / 3600; // in Stunden
    } else {
      G.miningStreaks[coin] = 0; // Streak unterbrochen
    }
  });
}

// ── Challenge-Fortschritt aktualisieren ──────────────────────
function updateChallengeProgress() {
  if (!G.dailyChallenges || !window.CHALLENGES) return;
  if (!G.challengeProgress) G.challengeProgress = {};
  
  G.dailyChallenges.forEach(ch => {
    if (ch.completed) return;
    const def = window.CHALLENGES[ch.id];
    if (!def) return;

    let progress = 0;
    const baseKey = ch.id + '_base';

    if (def.type === 'mining') {
      if (G.challengeProgress[baseKey] === undefined) {
        G.challengeProgress[baseKey] = G.totalHashes || 0;
      }
      progress = Math.max(0, (G.totalHashes || 0) - G.challengeProgress[baseKey]);
    } else if (def.type === 'coin_mining') {
      const rigCount = Object.keys(G.rigTargets || {})
        .filter(rigId => (G.rigTargets[rigId] === def.coin) && (G.rigs[rigId] || 0) > 0).length;
      progress = rigCount >= (def.minRigs || 1) ? (G.coins[def.coin] || 0) : 0;
    } else if (def.type === 'selling') {
      progress = (G.challengeProgress[ch.id] || 0);
    } else if (def.type === 'selling_value') {
      progress = (G.challengeProgress[ch.id] || 0);
    } else if (def.type === 'earn') {
      if (G.challengeProgress[baseKey] === undefined) {
        G.challengeProgress[baseKey] = G.totalEarned || 0;
      }
      progress = Math.max(0, (G.totalEarned || 0) - G.challengeProgress[baseKey]);
    } else if (def.type === 'rigs') {
      progress = Object.values(G.rigs || {}).reduce((a, b) => a + b, 0);
    } else if (def.type === 'rig_diversity') {
      progress = new Set(Object.values(G.rigTargets || {})).size;
    } else if (def.type === 'research') {
      progress = (G.research || []).length;
    } else if (def.type === 'contracts_done') {
      progress = G.contractsDone || 0;
    } else if (def.type === 'location_tier') {
      const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
      progress = Number((loc && loc.tier) || 1);
    } else if (def.type === 'crew_coverage') {
      progress = Math.max(0, Math.min(100, Number(G._rigStaffCoverage || 0) * 100));
    } else if (def.type === 'location_shop_items') {
      progress = (typeof window.getTotalLocationShopItemsOwned === 'function')
        ? getTotalLocationShopItemsOwned(G)
        : 0;
    } else if (def.type === 'rig_health') {
      const totalRigs = Object.values(G.rigs || {}).reduce((a, b) => a + Number(b || 0), 0);
      if (totalRigs < Math.max(1, Number(def.minRigs || 1))) {
        progress = 0;
      } else {
      const healthValues = Object.keys(G.rigs || {}).map((rigId) => {
        if (Number((G.rigs || {})[rigId] || 0) <= 0) return null;
        return Number(((G.rigEnergy || {})[rigId]) ?? 100);
      }).filter((v) => v !== null);
      const avg = healthValues.length
        ? healthValues.reduce((a, b) => a + Number(b || 0), 0) / healthValues.length
        : 100;
      progress = Math.max(0, Math.min(100, avg));
      }
    } else if (def.type === 'daily_streak') {
      progress = G.dailyStreak || 0;
    } else if (def.type === 'prestige') {
      progress = G.prestigeCount || 0;
    }

    ch.progress = Math.min(progress, def.target);
    if (ch.progress >= def.target && !ch.completed) {
      ch.completed = true;
      notify('✅ Challenge: ' + def.name + ' abgeschlossen! +Reward', 'gold');
    }
  });
}

// ── Haupt-Loop (alle 100ms) ───────────────────────────────────
function gameTick() {
  const now = Date.now();
  const dt  = Math.min((now - lastTick) / 1000, 5);
  lastTick  = now;
  G.playTime += dt;

  G.totalRigs = getTotalRigCount();
  refreshUnlockedLocationTier();
  computeLocationEffects();
  computeMultipliers();
  
  // ── Neue Systeme pro Tick ────────────────────────────────────
  updatePowerSystem(dt);
  checkDailyReset();
  updateRigEnergy(dt);
  checkRigExplosions();
  updateMiningStreaks(dt);
  updateChallengeProgress();
  checkRigModUnlocks(true);
  if (getTotalRigCount() > 0) {
    G._modPartTimer = Number(G._modPartTimer || 0) + dt * (0.4 + Math.min(12, getTotalRigCount()) * 0.06);
    while (G._modPartTimer >= 75) {
      G._modPartTimer -= 75;
      G.modParts = Math.max(0, Number(G.modParts || 0) + 1);
    }
  }
  if (typeof window.updateStoryMissionState === 'function') window.updateStoryMissionState();
  if (typeof window.updateTutorialState === 'function') window.updateTutorialState();
  if (typeof window.updateHoldMining === 'function') window.updateHoldMining(dt);

  // ── Auto-Klicker (cu1 Unlock) ────────────────────────────
  if (G.chipShop['cu1'] && !G._opsShutdown) {
    G._autoClickAccum = (G._autoClickAccum || 0) + dt * 2;
    while (G._autoClickAccum >= 1) {
      G._autoClickAccum -= 1;
      const power = Math.max(1, Math.floor(getClickPower()));
      G.hashes      += power;
      G.totalHashes += power;
      G.totalClicks++;
    }
  }

  // ── Per-Rig Hash-Routing ─────────────────────────────────
  // Jeder Rig-Typ mined die ihm zugewiesene Coin
  G.rigHashPools = G.rigHashPools || { BTC:0, ETH:0, LTC:0, BNB:0 };
  const coinKeys = Object.keys(COIN_DATA || {});
  RIGS.forEach(r => {
    const count = G.rigs[r.id] || 0;
    if (!count) return;
    const rigEnergy = Number((G.rigEnergy && G.rigEnergy[r.id]) ?? 100);
    const energyOutputMult = Math.max(0.25, Math.min(1, rigEnergy / 100));
    const hps        = count * getRigHps(r.id) * energyOutputMult;
    const targetCoin = G.rigTargets[r.id] || G.selectedCoin || 'BTC';
    const targetProfile = getCoinProfile(targetCoin);
    const targetHps = hps * targetProfile.miningHashMult;
    const mods = G.rigMods && G.rigMods[r.id] ? G.rigMods[r.id] : [];
    const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
    const useDualCoin = !!bonuses.dualCoin && coinKeys.length > 1;

    if (useDualCoin) {
      const idx = Math.max(0, coinKeys.indexOf(targetCoin));
      const secondCoin = coinKeys[(idx + 1) % coinKeys.length] || targetCoin;
      const secondProfile = getCoinProfile(secondCoin);
      const splitTarget = targetHps * dt * 0.5;
      const splitSecond = hps * secondProfile.miningHashMult * dt * 0.5;
      G.rigHashPools[targetCoin] = (G.rigHashPools[targetCoin] || 0) + splitTarget;
      G.rigHashPools[secondCoin] = (G.rigHashPools[secondCoin] || 0) + splitSecond;
    } else {
      G.rigHashPools[targetCoin] = (G.rigHashPools[targetCoin] || 0) + targetHps * dt;
    }
    G.totalHashes += targetHps * dt;
  });

  // ── Hash-Pools → Coins konvertieren ─────────────────────
  let totalNewCoins = 0;

  Object.keys(COIN_DATA).forEach(coin => {
    const pool = G.rigHashPools[coin] || 0;
    const convRate = getConvRateForCoin(coin);
    if (pool >= convRate) {
      const earned = Math.floor(pool / convRate);
      G.rigHashPools[coin] = pool - earned * convRate;
      G.coins[coin] = (G.coins[coin] || 0) + earned;
      totalNewCoins += earned;
    }
  });

  // Klick-Hashes → selectedCoin
  const clickConvRate = getConvRateForCoin(G.selectedCoin || 'BTC');
  if (G.hashes >= clickConvRate) {
    const earned = Math.floor(G.hashes / clickConvRate);
    G.hashes -= earned * clickConvRate;
    G.coins[G.selectedCoin] = (G.coins[G.selectedCoin] || 0) + earned;
    totalNewCoins += earned;
  }

  G.totalCoinsMined = (G.totalCoinsMined || 0) + totalNewCoins;

  // ── Auto-Sell (pro Coin) ────────────────────────────────
  const autoMap = (G.autoSellCoins && typeof G.autoSellCoins === 'object') ? G.autoSellCoins : {};
  Object.keys(G.coins).forEach(coin => {
    if (!autoMap[coin]) return;
    const amt = Math.floor(getAvailableCoinBalance(coin));
    if (amt >= 1) {
      const earned      = amt * G.prices[coin] * G._priceMult * G._legacyMult;
      G.usd            += earned;
      G.totalEarned    += earned;
      G.coins[coin]    -= amt;
    }
  });

  // ── Passives Einkommen ────────────────────────────────────
  const passIncome = G._passive * dt * G._legacyMult * Math.max(0.05, Number(G._opsPassiveIncomeMult || 1));
  G.usd            += passIncome;
  G.totalEarned    += passIncome;

  // ── Research-Fortschritt — Slot 1 ────────────────────────
  if (G.activeResearch) {
    const r = RESEARCH.find(x => x.id === G.activeResearch);
    if (r) {
      G.researchProgress += dt * G._researchSpeedMult;
      if (G.researchProgress >= r.time) {
        G.research.push(G.activeResearch);
        notify('🔬 ' + r.name + ' abgeschlossen!', 'gold');
        G.activeResearch   = null;
        G.researchProgress = 0;
        computeMultipliers();
        renderResearch();
      }
    }
  }

  // ── Research-Fortschritt — Slot 2 (cu5 Unlock) ───────────
  if (G.chipShop['cu5'] && G.activeResearch2) {
    const r2 = RESEARCH.find(x => x.id === G.activeResearch2);
    if (r2) {
      G.researchProgress2 += dt * G._researchSpeedMult;
      if (G.researchProgress2 >= r2.time) {
        G.research.push(G.activeResearch2);
        notify('🔬 [Slot 2] ' + r2.name + ' abgeschlossen!', 'gold');
        G.activeResearch2   = null;
        G.researchProgress2 = 0;
        computeMultipliers();
        renderResearch();
      }
    }
  }

  // ── Preisschwankungen + Trendregime ───────────────────────
  if (typeof G.marketRegime !== 'string' || !['bull', 'bear', 'range'].includes(G.marketRegime)) {
    G.marketRegime = 'range';
    G.marketRegimeDrift = 0.0002;
    G.marketRegimeVolMult = 0.92;
    G.marketRegimeTimer = 150 + Math.random() * 140;
  }
  if (!Number.isFinite(G.marketRegimeDrift) || Math.abs(Number(G.marketRegimeDrift || 0)) < 0.00001) {
    if (G.marketRegime === 'bull') G.marketRegimeDrift = 0.0015;
    else if (G.marketRegime === 'bear') G.marketRegimeDrift = -0.0012;
    else G.marketRegimeDrift = 0.0002;
  }
  if (!Number.isFinite(G.marketRegimeVolMult) || Number(G.marketRegimeVolMult || 0) <= 0) {
    G.marketRegimeVolMult = (G.marketRegime === 'range') ? 0.86 : 0.95;
  }
  G.marketRegimeTimer = Math.max(0, Number(G.marketRegimeTimer || 0) - dt);
  if (G.marketRegimeTimer <= 0) {
    const roll = Math.random();
    if (roll < 0.30) {
      G.marketRegime = 'bull';
      G.marketRegimeDrift = 0.0015;
      G.marketRegimeVolMult = 0.92;
      G.marketRegimeTimer = 140 + Math.random() * 180;
    } else if (roll < 0.56) {
      G.marketRegime = 'bear';
      G.marketRegimeDrift = -0.0012;
      G.marketRegimeVolMult = 1.00;
      G.marketRegimeTimer = 120 + Math.random() * 165;
    } else {
      G.marketRegime = 'range';
      G.marketRegimeDrift = 0.0002;
      G.marketRegimeVolMult = 0.86;
      G.marketRegimeTimer = 165 + Math.random() * 210;
    }
  }

  // Seltene Mikrozyklen fuer kurze Spikes/Crashes
  G.marketShockTimer = Math.max(0, Number(G.marketShockTimer || 0) - dt);
  if (G.marketShockTimer <= 0 && Math.random() < 0.0030) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    G.marketShockDir = dir;
    G.marketShockAmp = 0.010 + Math.random() * 0.014;
    G.marketShockTimer = 26 + Math.random() * 45;
    updateTicker(dir > 0 ? '📈 Mikro-Zyklus: Short Squeeze startet!' : '📉 Mikro-Zyklus: Liquidity Crunch!');
  }

  if (!G.prices || typeof G.prices !== 'object') G.prices = {};
  if (!G.priceHistory || typeof G.priceHistory !== 'object') G.priceHistory = {};
  ensureMarketImpulseState();
  Object.keys(COIN_DATA).forEach((coin) => {
    if (!Number.isFinite(G.prices[coin]) || G.prices[coin] <= 0) G.prices[coin] = Number(COIN_DATA[coin].basePrice || 1);
    if (!Array.isArray(G.priceHistory[coin])) G.priceHistory[coin] = [];
  });

  const trendDrift = Number(G.marketRegimeDrift || 0);
  const trendVolMult = Math.max(0.55, Number(G.marketRegimeVolMult || 1));
  const shockDir = Number(G.marketShockDir || 0);
  const shockAmp = Number(G.marketShockTimer || 0) > 0 ? Number(G.marketShockAmp || 0) : 0;

  Object.keys(COIN_DATA).forEach(coin => {
    const c = COIN_DATA[coin];
    const profile = getCoinProfile(coin);
    const price = Math.max(0.01, Number(G.prices[coin] || c.basePrice));
    const basePrice = Math.max(0.01, Number(c.basePrice || 1));
    const prevMomentum = Number(G.marketMomentum[coin] || 0);
    const noise = (Math.random() - 0.5) * 2 * Number(c.volatility || 0.02) * Number(MARKET_BALANCE.noiseScale || 0.42) * trendVolMult * profile.noiseMult;
    const shockNoise = shockAmp * shockDir * profile.shockMult;
    const microJitter = (Math.random() - 0.5) * 0.0007 * profile.noiseMult;
    const decay = Math.exp(-Math.max(0.1, Number(MARKET_BALANCE.momentumDecayPerSec || 2.4)) * dt);
    const momentum = prevMomentum * decay +
      noise * Number(MARKET_BALANCE.momentumNoiseInject || 1.0) +
      shockNoise * Number(MARKET_BALANCE.shockInjectScale || 0.75) +
      microJitter;

    let eventDrift = Number(G.marketEventDrift[coin] || 0);
    let eventTimer = Math.max(0, Number(G.marketEventDriftTimer[coin] || 0) - dt);
    if (eventTimer <= 0) {
      eventTimer = 0;
      eventDrift = 0;
    }

    const pctFromBase = (price - basePrice) / basePrice;
    const meanRev = -pctFromBase * (
      Number(MARKET_BALANCE.meanReversionBase || 0.022) +
      Number(c.volatility || 0.02) * Number(MARKET_BALANCE.meanReversionVolFactor || 0.35)
    ) * profile.reversionMult;
    const totalReturnPerSec = trendDrift * 0.75 + profile.driftBias + eventDrift + meanRev + momentum;
    const nextPrice = price * Math.exp(totalReturnPerSec * dt);
    const floor = Number(c.basePrice || 1) * Math.max(0.35, Number(G._marketFloorMult || 0.45));
    const ceiling = Number(c.basePrice || 1) * (9 + Math.min(6, Math.max(0, Number(G.prestigeCount || 0))));
    G.marketMomentum[coin] = momentum;
    G.marketEventDrift[coin] = eventDrift;
    G.marketEventDriftTimer[coin] = eventTimer;
    G.prices[coin] = Math.max(floor, Math.min(ceiling, nextPrice));
    G.priceHistory[coin].push(G.prices[coin]);
    if (G.priceHistory[coin].length > 60) G.priceHistory[coin].shift();
  });

  // ── Event-Timer ───────────────────────────────────────────
  G._eventTimer = (G._eventTimer || 0) + dt;
  if (G._eventTimer >= G._nextEventIn) {
    G._eventTimer  = 0;
    G._nextEventIn = 180 + Math.random() * 180; // 3-6 Minuten
    fireRandomEvent();
  }

  // ── Contract-Timer ────────────────────────────────────────
  if (!Number.isFinite(G.contractRefresh) || G.contractRefresh <= 0 || G.contractRefresh > CONTRACT_REFRESH_INTERVAL || G.contractRefresh < 900) {
    G.contractRefresh = CONTRACT_REFRESH_INTERVAL;
  }
  G.contractRefresh -= dt;
  if (G.contractRefresh <= 0) {
    G.contractRefresh = CONTRACT_REFRESH_INTERVAL;
    generateContracts();
  }

  // ── Achievements prüfen ───────────────────────────────────
  checkAchievements();

  // ── UI updaten ────────────────────────────────────────────
  updateHeader();
  const minePanel = document.getElementById('mine-panel');
  const powerPanel = document.getElementById('power-panel');
  const locationPanel = document.getElementById('location-panel');
  const marketPanel = document.getElementById('market-panel');
  if (minePanel && minePanel.classList.contains('active')) updateMineUI();
  if (powerPanel && powerPanel.classList.contains('active')) renderPowerPanel();
  if (locationPanel && locationPanel.classList.contains('active')) renderPowerPanel();
  if (marketPanel && marketPanel.classList.contains('active')) renderMarket();
  if (document.getElementById('upgrades-panel').classList.contains('active'))   renderUpgrades(_currentFilter || 'all');
  const missionsPanel = document.getElementById('missions-panel');
  if (missionsPanel && missionsPanel.classList.contains('active')) updateContractTimer();
  if (document.getElementById('prestige-panel').classList.contains('active'))   renderPrestige();

  // ── Prestige-Button ───────────────────────────────────────
  const pBtn = document.getElementById('prestige-btn');
  if (pBtn) {
    const canPrestige = G.totalEarned >= PRESTIGE_PER_CHIP;
    pBtn.style.display = canPrestige ? 'block' : 'none';
    const el = document.getElementById('prestige-chips-preview');
    if (el) el.textContent = Math.floor(G.totalEarned / PRESTIGE_PER_CHIP);
  }

  // ── Aktives Event ablaufen lassen ─────────────────────────
  if (G.activeEvent && now > G.activeEvent.endsAt) {
    G.activeEvent = null;
  }
}
