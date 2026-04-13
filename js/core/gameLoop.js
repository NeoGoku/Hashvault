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
  balanced: { label: 'Balanced', cap: 1.00, repair: 1.00, crash: 1.00, wage: 1.00, power: 1.00, cooling: 1.00, automation: 1.00, outage: 1.00, heat: 1.00 },
  repair: { label: 'Repair', cap: 0.96, repair: 1.18, crash: 1.00, wage: 1.04, power: 1.02, cooling: 1.08, automation: 0.98, outage: 1.03, heat: 1.05 },
  safety: { label: 'Safety', cap: 0.95, repair: 0.98, crash: 1.22, wage: 1.06, power: 0.99, cooling: 1.12, automation: 1.05, outage: 1.16, heat: 1.08 },
  efficiency: { label: 'Efficiency', cap: 1.12, repair: 0.92, crash: 0.94, wage: 0.92, power: 1.14, cooling: 1.06, automation: 1.04, outage: 0.96, heat: 1.06 },
};
window.HV_RIG_CREW_SPECS = RIG_CREW_SPECS;

const RIG_CREW_FOCUS = {
  balanced: { label: 'Balanced', icon: '⚖️', cap: 1.00, repair: 1.00, crash: 1.00, wage: 1.00, power: 1.00, cooling: 1.00, automation: 1.00, outage: 1.00, heat: 1.00 },
  throughput: { label: 'Durchsatz', icon: '🚀', cap: 1.10, repair: 0.88, crash: 0.90, wage: 1.08, power: 0.92, cooling: 0.92, automation: 1.06, outage: 0.94, heat: 0.92 },
  maintenance: { label: 'Wartung', icon: '🔧', cap: 0.96, repair: 1.20, crash: 1.00, wage: 1.04, power: 1.04, cooling: 1.14, automation: 1.00, outage: 1.04, heat: 1.10 },
  safety: { label: 'Safety', icon: '🛡️', cap: 0.92, repair: 0.95, crash: 1.22, wage: 1.06, power: 0.98, cooling: 1.08, automation: 1.04, outage: 1.15, heat: 1.08 },
  frugal: { label: 'Sparsam', icon: '💼', cap: 0.94, repair: 0.90, crash: 1.02, wage: 0.88, power: 1.16, cooling: 1.02, automation: 0.98, outage: 0.97, heat: 1.04 },
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
  reserveDefaults: { BTC: 0, ETH: 0, LTC: 0, BNB: 0 },
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
  floorDriftStepPerSec: 0.0009,
  floorDriftDecayPerSec: 0.85,
  floorReboundKickPerSec: 0.0032,
  floorReboundMinPct: 0.0014,
  floorReboundMaxPct: 0.0046,
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

const RIG_LAYOUT_PROFILES = [
  {
    id: 'balanced_grid',
    name: 'Balanced Grid',
    desc: 'Solider Mix aus Leistung und Stabilitaet.',
    minTier: 1,
    hpsMult: 1.00,
    powerMult: 1.00,
    heatMult: 1.00,
    crashMult: 1.00,
  },
  {
    id: 'dense_stack',
    name: 'Dense Stack',
    desc: 'Maximaler Durchsatz, aber hohe Waermelast.',
    minTier: 2,
    hpsMult: 1.14,
    powerMult: 1.08,
    heatMult: 1.24,
    crashMult: 1.18,
  },
  {
    id: 'airflow_lanes',
    name: 'Airflow Lanes',
    desc: 'Kuehlgaenge reduzieren Hitze auf Kosten von Peak-H/s.',
    minTier: 3,
    hpsMult: 0.97,
    powerMult: 0.95,
    heatMult: 0.74,
    crashMult: 0.85,
  },
  {
    id: 'cold_aisle',
    name: 'Cold Aisle Pods',
    desc: 'Segmentierte Cold-Aisles fuer starke Dauerlast.',
    minTier: 5,
    hpsMult: 1.08,
    powerMult: 1.02,
    heatMult: 0.78,
    crashMult: 0.88,
  },
  {
    id: 'isolation_cells',
    name: 'Isolation Cells',
    desc: 'Sicherster Betrieb fuer kritische Endgame-Hardware.',
    minTier: 7,
    hpsMult: 0.92,
    powerMult: 0.90,
    heatMult: 0.64,
    crashMult: 0.72,
  },
];
window.HV_RIG_LAYOUT_PROFILES = RIG_LAYOUT_PROFILES;

const COOLING_BALANCE = {
  baseCoolingPerSec: 0.55,
  levelCoolingPerSec: 0.24,
  basePowerKw: 0.12,
  levelPowerKw: 0.08,
  overheatStart: 65,
  dangerStart: 82,
  criticalStart: 94,
  upgradeBaseCost: 2100,
  upgradeCostMult: 1.58,
  modes: {
    eco: { label: 'Eco', coolingMult: 0.78, powerMult: 0.72, hpsMult: 0.98 },
    balanced: { label: 'Balanced', coolingMult: 1.00, powerMult: 1.00, hpsMult: 1.00 },
    turbo: { label: 'Turbo', coolingMult: 1.34, powerMult: 1.32, hpsMult: 1.03 },
  },
};
window.HV_COOLING_BALANCE = COOLING_BALANCE;

const POWER_AUTOMATION_BALANCE = {
  coolingSwitchCdSec: 18,
  outageAutoDelaySec: 6,
};
window.HV_POWER_AUTOMATION_BALANCE = POWER_AUTOMATION_BALANCE;

const POWER_RISK_PROFILES = {
  throughput: {
    id: 'throughput',
    label: 'Durchsatz',
    desc: 'Mehr H/s, dafuer teurer und stoeranfaelliger.',
    perfMult: 1.08,
    priceMult: 1.07,
    crashMult: 1.16,
    outageMult: 1.22,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Ausgewogener Standardbetrieb.',
    perfMult: 1.00,
    priceMult: 1.00,
    crashMult: 1.00,
    outageMult: 1.00,
  },
  resilience: {
    id: 'resilience',
    label: 'Resilienz',
    desc: 'Weniger Risiko und Ausfaelle, leicht weniger H/s.',
    perfMult: 0.96,
    priceMult: 0.97,
    crashMult: 0.82,
    outageMult: 0.74,
  },
  emergency: {
    id: 'emergency',
    label: 'Emergency',
    desc: 'Krisenmodus: sehr sicher, aber deutlich weniger Durchsatz.',
    perfMult: 0.90,
    priceMult: 0.94,
    crashMult: 0.68,
    outageMult: 0.58,
  },
};
window.HV_POWER_RISK_PROFILES = POWER_RISK_PROFILES;

const POWER_BATTERY_STRATEGIES = {
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Solides Laden und Peak-Shaving bei Ueberlast.',
    chargeHeadroom: 0.85,
    reserveFrac: 0.0,
    peakDischargeLoad: 0.0,
  },
  peak_guard: {
    id: 'peak_guard',
    label: 'Peak Guard',
    desc: 'Haelt Lastspitzen aus dem roten Bereich.',
    chargeHeadroom: 0.78,
    reserveFrac: 0.16,
    peakDischargeLoad: 0.72,
  },
  arbitrage: {
    id: 'arbitrage',
    label: 'Tarif-Arbitrage',
    desc: 'Laedt guenstig und entlaedt in teuren Tariffen.',
    chargeHeadroom: 0.95,
    reserveFrac: 0.10,
    peakDischargeLoad: 0.58,
  },
  reserve: {
    id: 'reserve',
    label: 'Reserve',
    desc: 'Bewahrt Akku fuer echte Notfaelle.',
    chargeHeadroom: 0.70,
    reserveFrac: 0.60,
    peakDischargeLoad: 0.0,
  },
};
window.HV_POWER_BATTERY_STRATEGIES = POWER_BATTERY_STRATEGIES;

const POWER_TARIFF_POLICIES = {
  off: {
    id: 'off',
    label: 'Aus',
    desc: 'Keine tarifbasierte Automatik.',
  },
  cost_focus: {
    id: 'cost_focus',
    label: 'Kostenfokus',
    desc: 'Spart in Peak-Zeiten aggressiv Stromkosten.',
    byTariff: {
      Nacht: { riskProfile: 'throughput', batteryStrategy: 'arbitrage' },
      Tag: { riskProfile: 'balanced', batteryStrategy: 'balanced' },
      Peak: { riskProfile: 'resilience', batteryStrategy: 'peak_guard' },
      Spaet: { riskProfile: 'balanced', batteryStrategy: 'arbitrage' },
    },
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Mischt stabile Tagesproduktion mit Peak-Schutz.',
    byTariff: {
      Nacht: { riskProfile: 'throughput', batteryStrategy: 'balanced' },
      Tag: { riskProfile: 'balanced', batteryStrategy: 'balanced' },
      Peak: { riskProfile: 'balanced', batteryStrategy: 'peak_guard' },
      Spaet: { riskProfile: 'balanced', batteryStrategy: 'reserve' },
    },
  },
  rush: {
    id: 'rush',
    label: 'Rush Hour',
    desc: 'Zieht nachts und tags ueber hohe Produktion an.',
    byTariff: {
      Nacht: { riskProfile: 'throughput', batteryStrategy: 'balanced' },
      Tag: { riskProfile: 'throughput', batteryStrategy: 'balanced' },
      Peak: { riskProfile: 'balanced', batteryStrategy: 'peak_guard' },
      Spaet: { riskProfile: 'throughput', batteryStrategy: 'arbitrage' },
    },
  },
};
window.HV_POWER_TARIFF_POLICIES = POWER_TARIFF_POLICIES;

const POWER_OUTAGE_EVENTS = [
  {
    id: 'transformer_trip',
    title: 'Transformator-Ausfall',
    desc: 'Ein lokaler Transformator ist ueberhitzt. Waehle sofort eine Gegenmassnahme.',
    duration: 85,
    penalties: { perfMult: 0.64, priceMult: 1.42, capMult: 0.78, crashMult: 1.35 },
    options: [
      {
        id: 'express_fix',
        label: 'Express-Reparatur',
        desc: 'Technik-Team ruft Notdienst. Teuer, aber stabil.',
        costUsd: 5200,
        costBtc: 0.018,
        duration: 190,
        effect: { perfMult: 1.03, priceMult: 0.97, capMult: 1.02, crashMult: 0.88 },
      },
      {
        id: 'load_shedding',
        label: 'Lastabwurf',
        desc: 'Teilabschaltung ohne Kosten, aber weniger Durchsatz.',
        costUsd: 0,
        costBtc: 0,
        duration: 170,
        effect: { perfMult: 0.90, priceMult: 0.96, capMult: 0.96, crashMult: 0.94 },
      },
      {
        id: 'risky_bypass',
        label: 'Riskanter Bypass',
        desc: 'Guenstig, aber Instabilitaet steigt deutlich.',
        costUsd: 1100,
        costBtc: 0,
        duration: 200,
        effect: { perfMult: 1.07, priceMult: 1.00, capMult: 1.00, crashMult: 1.28 },
      },
    ],
  },
  {
    id: 'substation_fire',
    title: 'Umspannwerk-Brand',
    desc: 'Externe Leitungen fallen aus. Du musst zwischen Kosten, Risiko und Leistung abwaegen.',
    duration: 95,
    penalties: { perfMult: 0.58, priceMult: 1.55, capMult: 0.72, crashMult: 1.45 },
    options: [
      {
        id: 'generator_bridge',
        label: 'Generator-Bruecke',
        desc: 'Sofortige Notversorgung ueber Mietgenerator.',
        costUsd: 7600,
        costBtc: 0.025,
        duration: 230,
        effect: { perfMult: 1.05, priceMult: 1.08, capMult: 1.06, crashMult: 0.92 },
      },
      {
        id: 'controlled_pause',
        label: 'Kontrollierter Pausemodus',
        desc: 'Kurzzeitig drosseln und Hardware schuetzen.',
        costUsd: 0,
        costBtc: 0,
        duration: 180,
        effect: { perfMult: 0.86, priceMult: 0.94, capMult: 0.94, crashMult: 0.86 },
      },
      {
        id: 'overclock_push',
        label: 'Volllast durchziehen',
        desc: 'Keine Ausgaben, aber deutlich hoeheres Ausfallrisiko.',
        costUsd: 0,
        costBtc: 0.004,
        duration: 210,
        effect: { perfMult: 1.12, priceMult: 1.02, capMult: 0.98, crashMult: 1.36 },
      },
    ],
  },
];
window.HV_POWER_OUTAGE_EVENTS = POWER_OUTAGE_EVENTS;

const RIG_BUILD_PRESETS = [
  {
    id: 'starter_balanced',
    name: 'Starter Balanced',
    minTier: 1,
    desc: 'Sicherer Fruehstart fuer stabile Coin-Produktion.',
    plan: { usb: 8, rpi: 2 },
  },
  {
    id: 'garage_scale',
    name: 'Garage Scale',
    minTier: 3,
    desc: 'Mittlerer Ausbau fuer Garage/Kleine Halle.',
    plan: { rpi: 8, gpu1: 6, asic1: 1 },
  },
  {
    id: 'hall_density',
    name: 'Hall Density',
    minTier: 4,
    desc: 'Dichter Produktionsmix fuer Hallen-Standorte.',
    plan: { gpu1: 12, asic1: 4, gpu4: 1 },
  },
  {
    id: 'dc_ramp',
    name: 'Datacenter Ramp',
    minTier: 6,
    desc: 'Skaliert zuegig in Richtung Datacenter-Betrieb.',
    plan: { asic1: 10, gpu4: 6, asic8: 2, srv: 1 },
  },
];
window.HV_RIG_BUILD_PRESETS = RIG_BUILD_PRESETS;

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

function getWalletBalance(coin) {
  return getCoinReserve(coin);
}
window.getWalletBalance = getWalletBalance;

function getAvailableCoinBalance(coin) {
  const key = String(coin || 'BTC').toUpperCase();
  const total = Math.max(0, Number((G.coins || {})[key] || 0));
  const reserve = getCoinReserve(key);
  return Math.max(0, total - reserve);
}
window.getAvailableCoinBalance = getAvailableCoinBalance;

function depositCoinToWallet(coin, amount) {
  const key = String(coin || 'BTC').toUpperCase();
  const move = Math.max(0, Number(amount || 0));
  if (!COIN_DATA[key] || move <= 0) return false;
  const free = getAvailableCoinBalance(key);
  if (free + 1e-9 < move) return false;
  G.coinReserves[key] = Math.max(0, Number((G.coinReserves || {})[key] || 0) + move);
  return true;
}
window.depositCoinToWallet = depositCoinToWallet;

function withdrawCoinFromWallet(coin, amount) {
  const key = String(coin || 'BTC').toUpperCase();
  const move = Math.max(0, Number(amount || 0));
  if (!COIN_DATA[key] || move <= 0) return false;
  const wallet = getCoinReserve(key);
  if (wallet + 1e-9 < move) return false;
  G.coinReserves[key] = Math.max(0, wallet - move);
  return true;
}
window.withdrawCoinFromWallet = withdrawCoinFromWallet;

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

function getWalletDailyRate(coin) {
  const data = (COIN_DATA && COIN_DATA[coin]) ? COIN_DATA[coin] : null;
  const apy = Math.max(0, Number((data && data.walletApy) || 0));
  return Math.max(0, Math.min(0.025, apy / 365));
}
window.getWalletDailyRate = getWalletDailyRate;

function settleWalletYieldForDay(dayNo) {
  if (G.walletYieldEnabled === false) return;
  const day = Math.max(1, Math.floor(Number(dayNo || G.worldDay || 1)));
  const last = Math.max(0, Math.floor(Number(G.walletYieldLastDay || 0)));
  if (day <= last) return;

  const rates = [];
  let totalUsd = 0;
  Object.keys(COIN_DATA || {}).forEach((coin) => {
    const bal = Math.max(0, getWalletBalance(coin));
    if (bal <= 0) return;
    const rate = getWalletDailyRate(coin);
    if (rate <= 0) return;
    const reward = bal * rate;
    if (reward <= 0) return;
    G.coins[coin] = bal + reward;
    const usd = reward * Math.max(0.000001, Number((G.prices || {})[coin] || 0));
    totalUsd += usd;
    rates.push(coin + ' +' + fmtNum(reward, 4));
  });

  G.walletYieldLastDay = day;
  if (totalUsd > 0) {
    G.walletYieldAccruedUsd = Math.max(0, Number(G.walletYieldAccruedUsd || 0) + totalUsd);
    notify('🏦 Wallet-Zinsen T' + day + ': ' + rates.join(' · ') + ' (~$' + fmtNum(totalUsd, 2) + ')', 'success');
  }
}
window.settleWalletYieldForDay = settleWalletYieldForDay;

function emitAmbientLiveNews() {
  const templates = [
    '📡 Marktbriefing: Regime {REGIME}, Volatilitaet bleibt {VOL}.',
    '📰 Orderflow: BTC-Dominanz bei {BTCDOM}% laut Desk-Schaetzung.',
    '📊 Derivate-Desk meldet Funding-Spanne von {FUND}% bis {FUND2}%.',
    '🌍 Miner-Update: Netzwerk-Hashrate {HASH} PH/s, Energiepreis {PRICE}$/kWh.',
    '🏦 Macro-Ticker: Risikoappetit {RISK}, Liquiditaet bleibt {LIQ}.',
    '⚙️ Infrastruktur: Grid-Auslastung {LOAD}% bei Tarif {TARIFF}.',
    '🧠 Research-Desk: Altcoin-Beta {BETA}, Mean-Reversion im Fokus.',
    '🐋 Whale-Watch: ungewoehnliche Wallet-Aktivitaet in {COIN}.',
  ];
  const regime = String(G.marketRegime || 'range');
  const regimeLabel = regime === 'bull' ? 'bullish' : (regime === 'bear' ? 'bearish' : 'seitwaerts');
  const vol = regime === 'range' ? 'moderat' : (regime === 'bull' ? 'erhoeht' : 'nervoes');
  const load = Math.max(0, Math.min(999, Number((G._powerLoadRatio || 0) * 100)));
  const hashPh = Math.max(50, Math.floor(180 + Number(getTotalHps() || 0) / 240));
  const risk = regime === 'bear' ? 'defensiv' : (regime === 'bull' ? 'offensiv' : 'neutral');
  const liq = Number(G.marketShockTimer || 0) > 0 ? 'duenn' : 'stabil';
  const co = ['BTC', 'ETH', 'LTC', 'BNB'][Math.floor(Math.random() * 4)];
  const msg = templates[Math.floor(Math.random() * templates.length)]
    .replace('{REGIME}', regimeLabel)
    .replace('{VOL}', vol)
    .replace('{BTCDOM}', fmtNum(48 + Math.random() * 9, 1))
    .replace('{FUND}', fmtNum(-0.03 + Math.random() * 0.06, 2))
    .replace('{FUND2}', fmtNum(-0.03 + Math.random() * 0.06, 2))
    .replace('{HASH}', String(hashPh))
    .replace('{PRICE}', fmtNum(Number(G.powerPriceCurrent || 0.18), 3))
    .replace('{RISK}', risk)
    .replace('{LIQ}', liq)
    .replace('{LOAD}', fmtNum(load, 0))
    .replace('{TARIFF}', String(G.powerTariffLabel || 'Tag'))
    .replace('{BETA}', fmtNum(0.85 + Math.random() * 0.55, 2))
    .replace('{COIN}', co);

  G.recentEvents = Array.isArray(G.recentEvents) ? G.recentEvents : [];
  G.recentEvents.unshift({ msg, time: Date.now() });
  if (G.recentEvents.length > 10) G.recentEvents.pop();
  updateTicker(msg);
}
window.emitAmbientLiveNews = emitAmbientLiveNews;

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
  const prestigeSkillFx = (typeof window.getPrestigeSkillEffects === 'function')
    ? getPrestigeSkillEffects()
    : {};
  const collectionRaw = (typeof window.getActiveCollectionBonuses === 'function')
    ? getActiveCollectionBonuses()
    : { totalCompleted: 0, effects: {} };
  const collectionScale = Math.max(1, Number(prestigeSkillFx.collectionBonusMult || 1));
  const scaleCollectionMult = (raw) => 1 + (Math.max(0.1, Number(raw || 1)) - 1) * collectionScale;
  const collectionFx = {
    hpsMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.hpsMult),
    clickMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.clickMult),
    powerUsageMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.powerUsageMult),
    powerCapMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.powerCapMult),
    coolingMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.coolingMult),
    opsCostMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.opsCostMult),
    buildCostMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.buildCostMult),
    researchCostMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.researchCostMult),
    researchSpeedMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.researchSpeedMult),
    crewEffMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.crewEffMult),
    crewWageMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.crewWageMult),
    automationMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.automationMult),
    outagePrepMult: scaleCollectionMult(collectionRaw.effects && collectionRaw.effects.outagePrepMult),
    marketFloorAdd: Number((collectionRaw.effects && collectionRaw.effects.marketFloorAdd) || 0) * collectionScale,
    contractBonus: Number((collectionRaw.effects && collectionRaw.effects.contractBonus) || 0) * collectionScale,
  };
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
  const finalPowerCapMult = powerCapMult * Math.max(1, Number(prestigeSkillFx.powerCapMult || 1)) * Math.max(1, Number(collectionFx.powerCapMult || 1));
  const finalOpsCostMult = opsCostMult * Math.max(0.65, Number(prestigeSkillFx.opsCostMult || 1)) * Math.max(0.65, Number(collectionFx.opsCostMult || 1));
  const finalBuildCostMult = buildCostMult * Math.max(0.65, Number(prestigeSkillFx.buildCostMult || 1)) * Math.max(0.65, Number(collectionFx.buildCostMult || 1));
  const finalResearchCostMult = researchCostMult * Math.max(0.65, Number(prestigeSkillFx.researchCostMult || 1)) * Math.max(0.65, Number(collectionFx.researchCostMult || 1));
  const finalCrewEffMult = crewEffMult * Math.max(1, Number(prestigeSkillFx.crewEffMult || 1)) * Math.max(1, Number(collectionFx.crewEffMult || 1));
  const finalCrewWageMult = crewWageMult * Math.max(0.65, Number(prestigeSkillFx.crewWageMult || 1)) * Math.max(0.65, Number(collectionFx.crewWageMult || 1));
  const finalMarketFloorMult = Math.min(
    0.92,
    marketFloorMult + Math.max(0, Number(prestigeSkillFx.marketFloorAdd || 0)) + Math.max(0, Number(collectionFx.marketFloorAdd || 0))
  );
  hm *= Math.max(1, Number(prestigeSkillFx.hpsMult || 1)) * Math.max(1, Number(collectionFx.hpsMult || 1));
  cm *= Math.max(1, Number(prestigeSkillFx.clickMult || 1)) * Math.max(1, Number(collectionFx.clickMult || 1));
  cbon += Math.max(0, Number(prestigeSkillFx.contractBonus || 0)) + Math.max(0, Number(collectionFx.contractBonus || 0));
  researchSpeedBonus +=
    (Math.max(1, Number(prestigeSkillFx.researchSpeedMult || 1)) - 1) +
    (Math.max(1, Number(collectionFx.researchSpeedMult || 1)) - 1);

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
  G._prestigePowerCapMult = finalPowerCapMult;
  G._prestigeAutomationMult = Math.max(1, Number(prestigeSkillFx.automationMult || 1));
  G._prestigeOutagePrepMult = Math.max(1, Number(prestigeSkillFx.outagePrepMult || 1));
  G._opsCostMult = finalOpsCostMult;
  G._opsBnbDiscount = getBnbOpsDiscount();
  G._buildCostMult = finalBuildCostMult * ecoBuildCostMult;
  G._researchCostMult = finalResearchCostMult * ecoResearchCostMult;
  G._prestigeCrewEffMult = finalCrewEffMult;
  G._prestigeCrewWageMult = finalCrewWageMult;
  G._prestigeShopCostMult = shopCostMult;
  G._marketFloorMult = finalMarketFloorMult;
  G._collectionPowerUsageMult = Math.max(0.65, Number(prestigeSkillFx.powerUsageMult || 1)) * Math.max(0.65, Number(collectionFx.powerUsageMult || 1));
  G._collectionCoolingMult = Math.max(1, Number(prestigeSkillFx.coolingMult || 1)) * Math.max(1, Number(collectionFx.coolingMult || 1));
  G._collectionPowerCapMult = Math.max(1, Number(collectionFx.powerCapMult || 1));
  G._collectionHpsMult = Math.max(1, Number(collectionFx.hpsMult || 1));
  G._collectionClickMult = Math.max(1, Number(collectionFx.clickMult || 1));
  G._collectionResearchSpeedMult = Math.max(1, Number(collectionFx.researchSpeedMult || 1));
  G._collectionContractBonus = Math.max(0, Number(collectionFx.contractBonus || 0));
  G.collectionSetCompletions = Math.max(0, Number(collectionRaw.totalCompleted || 0));
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
  const layoutMult = Math.max(0.55, Number(G._layoutHpsMult || 1)) * Math.max(0.6, Number(G._coolingHpsMult || 1));
  const thermalMult = (() => {
    if (typeof getRigThermalEffects === 'function') {
      const t = getRigThermalEffects(rigId);
      return Math.max(0.55, Number(t.hpsMult || 1));
    }
    return 1;
  })();
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

  return r.hps * G._hpsMult * modMult * powerMult * layoutMult * thermalMult * progressionMult;
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

function getRigLayoutById(layoutId) {
  return (RIG_LAYOUT_PROFILES || []).find((x) => x.id === layoutId) || RIG_LAYOUT_PROFILES[0];
}
window.getRigLayoutById = getRigLayoutById;

function getAvailableRigLayouts(locationId) {
  const loc = (typeof window.getLocationById === 'function')
    ? getLocationById(locationId || ((G && G.locationId) || 'home_pc'))
    : null;
  const tier = Math.max(1, Number((loc && loc.tier) || 1));
  return (RIG_LAYOUT_PROFILES || []).filter((layout) => tier >= Math.max(1, Number(layout.minTier || 1)));
}
window.getAvailableRigLayouts = getAvailableRigLayouts;

function ensureRigLayoutState() {
  if (!G.rigLayoutByLocation || typeof G.rigLayoutByLocation !== 'object') G.rigLayoutByLocation = {};
  const allLocs = Array.isArray(window.LOCATIONS) ? window.LOCATIONS : [];
  allLocs.forEach((loc) => {
    const locId = String(loc.id || '');
    if (!locId) return;
    const current = String(G.rigLayoutByLocation[locId] || '');
    const options = getAvailableRigLayouts(locId);
    const fallback = options.length ? options[0].id : 'balanced_grid';
    const valid = options.some((layout) => layout.id === current);
    G.rigLayoutByLocation[locId] = valid ? current : fallback;
  });
}

function getActiveRigLayout(locationId) {
  ensureRigLayoutState();
  const loc = (typeof window.getLocationById === 'function')
    ? getLocationById(locationId || ((G && G.locationId) || 'home_pc'))
    : null;
  if (!loc) return getRigLayoutById('balanced_grid');
  const options = getAvailableRigLayouts(loc.id);
  const selected = String((G.rigLayoutByLocation || {})[loc.id] || '');
  const active = options.find((layout) => layout.id === selected);
  return active || options[0] || getRigLayoutById('balanced_grid');
}
window.getActiveRigLayout = getActiveRigLayout;

function getRigBuildPresetById(presetId) {
  return (RIG_BUILD_PRESETS || []).find((x) => x.id === presetId) || null;
}
window.getRigBuildPresetById = getRigBuildPresetById;

function getAvailableRigBuildPresets() {
  const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const tier = Math.max(1, Number((loc && loc.tier) || 1));
  return (RIG_BUILD_PRESETS || []).filter((preset) => tier >= Math.max(1, Number(preset.minTier || 1)));
}
window.getAvailableRigBuildPresets = getAvailableRigBuildPresets;

function getCoolingModeMeta(modeId) {
  const modes = (COOLING_BALANCE && COOLING_BALANCE.modes) || {};
  const mode = String(modeId || (G && G.coolingMode) || 'balanced');
  return modes[mode] || modes.balanced || { label: 'Balanced', coolingMult: 1, powerMult: 1, hpsMult: 1 };
}
window.getCoolingModeMeta = getCoolingModeMeta;

function getPowerRiskProfileMeta(profileId) {
  const id = String(profileId || (G && G.powerRiskProfile) || 'balanced');
  return POWER_RISK_PROFILES[id] || POWER_RISK_PROFILES.balanced;
}
window.getPowerRiskProfileMeta = getPowerRiskProfileMeta;

function getPowerBatteryStrategyMeta(strategyId) {
  const id = String(strategyId || (G && G.powerBatteryStrategy) || 'balanced');
  return POWER_BATTERY_STRATEGIES[id] || POWER_BATTERY_STRATEGIES.balanced;
}
window.getPowerBatteryStrategyMeta = getPowerBatteryStrategyMeta;

function getPowerTariffPolicyMeta(policyId) {
  const id = String(policyId || (G && G.powerTariffPolicy) || 'off');
  return POWER_TARIFF_POLICIES[id] || POWER_TARIFF_POLICIES.off;
}
window.getPowerTariffPolicyMeta = getPowerTariffPolicyMeta;

function getCoolingUpgradeCost() {
  const level = Math.max(0, Math.floor(Number(G.coolingInfraLevel || 0)));
  const base = Math.max(100, Number(COOLING_BALANCE.upgradeBaseCost || 2100));
  const mult = Math.max(1.05, Number(COOLING_BALANCE.upgradeCostMult || 1.58));
  const scaled = base * Math.pow(mult, level);
  return Math.ceil(scaled * Math.max(0.4, Number(G._buildCostMult || 1)));
}
window.getCoolingUpgradeCost = getCoolingUpgradeCost;

function ensureRigHeatState() {
  if (!G.rigHeat || typeof G.rigHeat !== 'object') G.rigHeat = {};
  if (!Number.isFinite(G.coolingInfraLevel) || Number(G.coolingInfraLevel) < 0) G.coolingInfraLevel = 0;
  if (typeof G.coolingMode !== 'string' || !((COOLING_BALANCE.modes || {})[G.coolingMode])) G.coolingMode = 'balanced';
  const autoProfiles = ['off', 'safe', 'balanced', 'aggressive'];
  if (typeof G.coolingAutoProfile !== 'string' || !autoProfiles.includes(G.coolingAutoProfile)) {
    G.coolingAutoProfile = 'balanced';
  }
  if (!Number.isFinite(G._coolingAutoSwitchCd) || Number(G._coolingAutoSwitchCd) < 0) G._coolingAutoSwitchCd = 0;
  if (!Number.isFinite(G.coolingPowerKw) || Number(G.coolingPowerKw) < 0) G.coolingPowerKw = 0;
  (RIGS || []).forEach((rig) => {
    const current = Number((G.rigHeat || {})[rig.id]);
    if (!Number.isFinite(current)) {
      G.rigHeat[rig.id] = 8;
    } else {
      G.rigHeat[rig.id] = Math.max(0, Math.min(100, current));
    }
  });
}

function getRigHeat(rigId) {
  ensureRigHeatState();
  return Math.max(0, Math.min(100, Number((G.rigHeat || {})[rigId] || 0)));
}
window.getRigHeat = getRigHeat;

function getRigThermalEffects(rigId) {
  const heat = getRigHeat(rigId);
  const overheatStart = Math.max(0, Number(COOLING_BALANCE.overheatStart || 65));
  const dangerStart = Math.max(overheatStart, Number(COOLING_BALANCE.dangerStart || 82));
  const criticalStart = Math.max(dangerStart, Number(COOLING_BALANCE.criticalStart || 94));

  const warm = Math.max(0, heat - overheatStart);
  const danger = Math.max(0, heat - dangerStart);
  const critical = Math.max(0, heat - criticalStart);

  const drainMult = Math.max(0.7, 1 + warm * 0.010 + critical * 0.01);
  const crashMult = Math.max(0.8, 1 + danger * 0.018 + critical * 0.024);
  const hpsMult = Math.max(0.55, 1 - Math.max(0, heat - 74) * 0.0045);
  const repairMult = Math.max(0.45, 1 - Math.max(0, heat - 78) * 0.008);
  const severity = heat >= criticalStart ? 'critical' : (heat >= dangerStart ? 'danger' : (heat >= overheatStart ? 'warn' : 'ok'));
  return { heat, drainMult, crashMult, hpsMult, repairMult, severity };
}
window.getRigThermalEffects = getRigThermalEffects;

function getRigHeatSummary() {
  ensureRigHeatState();
  const rows = (RIGS || []).filter((rig) => Number((G.rigs || {})[rig.id] || 0) > 0);
  if (!rows.length) {
    return {
      avgHeat: 0,
      maxHeat: 0,
      dangerCount: 0,
      criticalCount: 0,
      coolingPowerKw: Number(G.coolingPowerKw || 0),
      coolingMode: getCoolingModeMeta(G.coolingMode).label,
    };
  }
  let sum = 0;
  let maxHeat = 0;
  let dangerCount = 0;
  let criticalCount = 0;
  rows.forEach((rig) => {
    const t = getRigThermalEffects(rig.id);
    sum += t.heat;
    if (t.heat > maxHeat) maxHeat = t.heat;
    if (t.severity === 'danger') dangerCount += 1;
    if (t.severity === 'critical') criticalCount += 1;
  });
  return {
    avgHeat: rows.length ? (sum / rows.length) : 0,
    maxHeat,
    dangerCount,
    criticalCount,
    coolingPowerKw: Number(G.coolingPowerKw || 0),
    coolingMode: getCoolingModeMeta(G.coolingMode).label,
  };
}
window.getRigHeatSummary = getRigHeatSummary;

function updateCoolingAutomation(dt) {
  ensureRigHeatState();
  const profile = String(G.coolingAutoProfile || 'balanced');
  if (profile === 'off') return;

  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;
  G._coolingAutoSwitchCd = Math.max(0, Number(G._coolingAutoSwitchCd || 0) - safeDt);
  if (Number(G._coolingAutoSwitchCd || 0) > 0) return;

  const summary = getRigHeatSummary();
  const maxHeat = Math.max(0, Number(summary.maxHeat || 0));
  const avgHeat = Math.max(0, Number(summary.avgHeat || 0));
  const load = Math.max(0, Number(G._powerLoadRatio || 0));

  let target = String(G.coolingMode || 'balanced');
  if (profile === 'safe') {
    if (maxHeat >= 82 || Number(summary.criticalCount || 0) > 0) target = 'turbo';
    else if (maxHeat <= 44 && load < 0.78) target = 'eco';
    else target = 'balanced';
  } else if (profile === 'aggressive') {
    if (maxHeat >= 90 || Number(summary.criticalCount || 0) > 0) target = 'turbo';
    else if (maxHeat <= 60 && avgHeat <= 52) target = 'eco';
    else target = 'balanced';
  } else {
    if (maxHeat >= 86 || Number(summary.criticalCount || 0) > 0) target = 'turbo';
    else if (maxHeat <= 48 && load < 0.74) target = 'eco';
    else target = 'balanced';
  }

  if (target === String(G.coolingMode || 'balanced')) return;
  if (!((COOLING_BALANCE.modes || {})[target])) return;

  G.coolingMode = target;
  G.coolingModeChanges = Math.max(0, Number(G.coolingModeChanges || 0)) + 1;
  G._coolingAutoSwitchCd = Math.max(6, Number(POWER_AUTOMATION_BALANCE.coolingSwitchCdSec || 18));
  const modeLabel = getCoolingModeMeta(target).label || target;
  notify('🤖 Cooling-Auto: Modus auf ' + modeLabel + ' gesetzt.', 'success');
}

function ensurePowerOutageState() {
  const plans = ['off', 'safe', 'balanced', 'greedy'];
  if (typeof G.powerOutageAutoPlan !== 'string' || !plans.includes(G.powerOutageAutoPlan)) {
    G.powerOutageAutoPlan = 'balanced';
  }
  if (typeof G.powerRiskProfile !== 'string' || !POWER_RISK_PROFILES[G.powerRiskProfile]) {
    G.powerRiskProfile = 'balanced';
  }
  const autoModes = ['off', 'assist', 'full'];
  if (typeof G.powerRiskAutoMode !== 'string' || !autoModes.includes(G.powerRiskAutoMode)) {
    G.powerRiskAutoMode = 'off';
  }
  const tariffPolicies = ['off', 'cost_focus', 'balanced', 'rush'];
  if (typeof G.powerTariffPolicy !== 'string' || !tariffPolicies.includes(G.powerTariffPolicy)) {
    G.powerTariffPolicy = 'off';
  }
  if (typeof G.powerCommandLinkEnabled !== 'boolean') G.powerCommandLinkEnabled = true;
  if (typeof G.powerLoadGuardEnabled !== 'boolean') G.powerLoadGuardEnabled = false;
  if (!Number.isFinite(G.outageDecisions) || Number(G.outageDecisions) < 0) G.outageDecisions = 0;
  if (!Number.isFinite(G.outageEventsSeen) || Number(G.outageEventsSeen) < 0) G.outageEventsSeen = 0;
  if (!Number.isFinite(G.outageAutoResolved) || Number(G.outageAutoResolved) < 0) G.outageAutoResolved = 0;
  if (!Number.isFinite(G.outageManualResolved) || Number(G.outageManualResolved) < 0) G.outageManualResolved = 0;
  if (!Number.isFinite(G.powerRiskProfileChanges) || Number(G.powerRiskProfileChanges) < 0) G.powerRiskProfileChanges = 0;
  if (!Number.isFinite(G.powerRiskAutoSwitches) || Number(G.powerRiskAutoSwitches) < 0) G.powerRiskAutoSwitches = 0;
  if (!Number.isFinite(G.powerCommandSyncs) || Number(G.powerCommandSyncs) < 0) G.powerCommandSyncs = 0;
  if (!Number.isFinite(G.powerLoadGuardActions) || Number(G.powerLoadGuardActions) < 0) G.powerLoadGuardActions = 0;
  if (!Number.isFinite(G.powerTariffPolicyChanges) || Number(G.powerTariffPolicyChanges) < 0) G.powerTariffPolicyChanges = 0;
  if (!Number.isFinite(G.powerTariffPolicySyncs) || Number(G.powerTariffPolicySyncs) < 0) G.powerTariffPolicySyncs = 0;
  if (!Number.isFinite(G.powerRiskAutoCooldown) || Number(G.powerRiskAutoCooldown) < 0) G.powerRiskAutoCooldown = 0;
  if (!Number.isFinite(G.powerCommandCooldown) || Number(G.powerCommandCooldown) < 0) G.powerCommandCooldown = 0;
  if (!Number.isFinite(G.powerTariffPolicyCooldown) || Number(G.powerTariffPolicyCooldown) < 0) G.powerTariffPolicyCooldown = 0;
  if (!Number.isFinite(G.powerLoadGuardTarget) || Number(G.powerLoadGuardTarget) <= 0) G.powerLoadGuardTarget = 0.85;
  G.powerLoadGuardTarget = Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85)));
  if (typeof G._powerLoadGuardActive !== 'boolean') G._powerLoadGuardActive = false;
  if (!Number.isFinite(G.powerOutageCooldown) || Number(G.powerOutageCooldown) < 0) G.powerOutageCooldown = 0;
  if (!Number.isFinite(G._powerOutageSpawnChancePerSec) || Number(G._powerOutageSpawnChancePerSec) < 0) G._powerOutageSpawnChancePerSec = 0;
  if (!Number.isFinite(G._powerRiskPerfMult) || Number(G._powerRiskPerfMult) <= 0) G._powerRiskPerfMult = 1;
  if (!Number.isFinite(G._powerRiskPriceMult) || Number(G._powerRiskPriceMult) <= 0) G._powerRiskPriceMult = 1;
  if (!Number.isFinite(G._powerRiskCrashMult) || Number(G._powerRiskCrashMult) <= 0) G._powerRiskCrashMult = 1;
  if (!Number.isFinite(G._powerRiskOutageMult) || Number(G._powerRiskOutageMult) <= 0) G._powerRiskOutageMult = 1;
  if (!Number.isFinite(G.powerOutageBuffRemaining) || Number(G.powerOutageBuffRemaining) < 0) G.powerOutageBuffRemaining = 0;
  if (!Number.isFinite(G._powerOutageBuffPerfMult) || Number(G._powerOutageBuffPerfMult) <= 0) G._powerOutageBuffPerfMult = 1;
  if (!Number.isFinite(G._powerOutageBuffPriceMult) || Number(G._powerOutageBuffPriceMult) <= 0) G._powerOutageBuffPriceMult = 1;
  if (!Number.isFinite(G._powerOutageBuffCapMult) || Number(G._powerOutageBuffCapMult) <= 0) G._powerOutageBuffCapMult = 1;
  if (!Number.isFinite(G._powerOutageBuffCrashMult) || Number(G._powerOutageBuffCrashMult) <= 0) G._powerOutageBuffCrashMult = 1;
  if (!Number.isFinite(G._powerDecisionPerfMult) || Number(G._powerDecisionPerfMult) <= 0) G._powerDecisionPerfMult = 1;
  if (!Number.isFinite(G._powerDecisionPriceMult) || Number(G._powerDecisionPriceMult) <= 0) G._powerDecisionPriceMult = 1;
  if (!Number.isFinite(G._powerDecisionCapMult) || Number(G._powerDecisionCapMult) <= 0) G._powerDecisionCapMult = 1;
  if (!Number.isFinite(G._powerDecisionCrashMult) || Number(G._powerDecisionCrashMult) <= 0) G._powerDecisionCrashMult = 1;
  if (G.powerOutage && typeof G.powerOutage === 'object') {
    const po = G.powerOutage;
    po.id = String(po.id || '');
    po.title = String(po.title || 'Netzentscheidung');
    po.desc = String(po.desc || '');
    po.remaining = Math.max(0, Number(po.remaining || 0));
    po.resolved = !!po.resolved;
    po.choiceId = String(po.choiceId || '');
    po.choiceLabel = String(po.choiceLabel || '');
    po.choiceText = String(po.choiceText || '');
    po.createdAt = Number.isFinite(Number(po.createdAt)) ? Number(po.createdAt) : Date.now();
    po.autoResolved = !!po.autoResolved;
    po.options = Array.isArray(po.options) ? po.options : [];
    po.penalties = (po.penalties && typeof po.penalties === 'object') ? po.penalties : {};
  } else {
    G.powerOutage = null;
  }
}

function spawnPowerOutageEvent() {
  ensurePowerOutageState();
  if (G.powerOutage && !G.powerOutage.resolved) return false;
  const list = Array.isArray(POWER_OUTAGE_EVENTS) ? POWER_OUTAGE_EVENTS : [];
  if (!list.length) return false;
  const tpl = list[Math.floor(Math.random() * list.length)];
  if (!tpl) return false;
  G.powerOutage = {
    id: String(tpl.id || 'outage'),
    title: String(tpl.title || 'Netzentscheidung'),
    desc: String(tpl.desc || ''),
    remaining: Math.max(20, Number(tpl.duration || 80)),
    resolved: false,
    createdAt: Date.now(),
    autoResolved: false,
    choiceId: '',
    choiceLabel: '',
    choiceText: '',
    penalties: {
      perfMult: Math.max(0.2, Number((tpl.penalties || {}).perfMult || 1)),
      priceMult: Math.max(0.2, Number((tpl.penalties || {}).priceMult || 1)),
      capMult: Math.max(0.2, Number((tpl.penalties || {}).capMult || 1)),
      crashMult: Math.max(0.2, Number((tpl.penalties || {}).crashMult || 1)),
    },
    options: (Array.isArray(tpl.options) ? tpl.options : []).slice(0, 4).map((opt) => ({
      id: String(opt.id || ''),
      label: String(opt.label || 'Option'),
      desc: String(opt.desc || ''),
      costUsd: Math.max(0, Number(opt.costUsd || 0)),
      costBtc: Math.max(0, Number(opt.costBtc || 0)),
      duration: Math.max(0, Number(opt.duration || 120)),
      effect: {
        perfMult: Math.max(0.2, Number((opt.effect || {}).perfMult || 1)),
        priceMult: Math.max(0.2, Number((opt.effect || {}).priceMult || 1)),
        capMult: Math.max(0.2, Number((opt.effect || {}).capMult || 1)),
        crashMult: Math.max(0.2, Number((opt.effect || {}).crashMult || 1)),
      },
    })),
  };
  G.outageEventsSeen = Math.max(0, Number(G.outageEventsSeen || 0)) + 1;
  updateTicker('🚨 ' + G.powerOutage.title + ' - Entscheidung noetig');
  notify('🚨 ' + G.powerOutage.title + ': Entscheidung im Power-Tab erforderlich.', 'error');
  return true;
}
window.spawnPowerOutageEvent = spawnPowerOutageEvent;

function pickPowerOutageOptionByPlan(planId, options) {
  const plan = String(planId || 'balanced');
  const list = Array.isArray(options) ? options : [];
  if (!list.length) return null;

  const usdBase = Math.max(1, Number(G.usd || 1));
  const btcBase = Math.max(0.001, Number(((G.coins || {}).BTC) || 0.001));
  let best = null;
  let bestScore = -Infinity;

  list.forEach((opt) => {
    if (!opt) return;
    const fx = opt.effect || {};
    const perf = Math.max(0.2, Number(fx.perfMult || 1));
    const cap = Math.max(0.2, Number(fx.capMult || 1));
    const crash = Math.max(0.2, Number(fx.crashMult || 1));
    const price = Math.max(0.2, Number(fx.priceMult || 1));
    const usdCost = Math.max(0, Number(opt.costUsd || 0));
    const btcCost = Math.max(0, Number(opt.costBtc || 0));
    const costScore = usdCost / usdBase + btcCost / btcBase;
    let score = 0;

    if (plan === 'safe') {
      score = (1 / crash) * 2.1 + cap * 0.6 + perf * 0.35 - price * 0.18 - costScore * 0.55;
    } else if (plan === 'greedy') {
      score = perf * 2.0 + cap * 0.75 + (1 / crash) * 0.2 - price * 0.06 - costScore * 0.15;
    } else {
      score = perf * 1.25 + cap * 0.78 + (1 / crash) * 0.9 - price * 0.28 - costScore * 0.38;
    }

    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  });
  return best;
}

function resolvePowerOutageOption(optionId, silentAuto) {
  ensurePowerOutageState();
  if (!G.powerOutage || G.powerOutage.resolved) return false;
  const selected = String(optionId || '');
  const opts = Array.isArray(G.powerOutage.options) ? G.powerOutage.options : [];
  const option = opts.find((x) => x && String(x.id) === selected);
  if (!option) return false;

  const usdCost = Math.max(0, Number(option.costUsd || 0));
  const btcCost = Math.max(0, Number(option.costBtc || 0));
  if (Number(G.usd || 0) + 1e-9 < usdCost) {
    if (!silentAuto) notify('❌ Nicht genug USD fuer diese Krisenoption.', 'error');
    return false;
  }
  if (Number((G.coins || {}).BTC || 0) + 1e-9 < btcCost) {
    if (!silentAuto) notify('❌ Nicht genug BTC fuer diese Krisenoption.', 'error');
    return false;
  }

  G.usd = Number(G.usd || 0) - usdCost;
  if (btcCost > 0) {
    if (typeof spendCoin === 'function') {
      const spent = spendCoin('BTC', btcCost);
      if (!spent) {
        G.usd += usdCost;
        if (!silentAuto) notify('❌ BTC-Abbuchung fehlgeschlagen.', 'error');
        return false;
      }
    } else {
      G.coins.BTC = Math.max(0, Number((G.coins || {}).BTC || 0) - btcCost);
    }
  }

  const eff = option.effect || {};
  G._powerOutageBuffPerfMult = Math.max(0.2, Number(eff.perfMult || 1));
  G._powerOutageBuffPriceMult = Math.max(0.2, Number(eff.priceMult || 1));
  G._powerOutageBuffCapMult = Math.max(0.2, Number(eff.capMult || 1));
  G._powerOutageBuffCrashMult = Math.max(0.2, Number(eff.crashMult || 1));
  G.powerOutageBuffRemaining = Math.max(0, Number(option.duration || 120));

  G.powerOutage.resolved = true;
  G.powerOutage.autoResolved = !!silentAuto;
  G.powerOutage.choiceId = option.id;
  G.powerOutage.choiceLabel = option.label;
  G.powerOutage.choiceText = option.desc || '';
  G.powerOutage.remaining = 12;
  G.powerOutageCooldown = 220 + Math.random() * 180;
  G.outageDecisions = Math.max(0, Number(G.outageDecisions || 0)) + 1;
  if (silentAuto) {
    G.outageAutoResolved = Math.max(0, Number(G.outageAutoResolved || 0)) + 1;
  } else {
    G.outageManualResolved = Math.max(0, Number(G.outageManualResolved || 0)) + 1;
  }

  const summary = '⚙️ Krisenoption: ' + option.label + (usdCost > 0 || btcCost > 0
    ? (' (-$' + fmtNum(usdCost, 0) + (btcCost > 0 ? ', -₿' + fmtNum(btcCost, 4) : '') + ')')
    : '');
  if (!silentAuto) notify(summary, 'gold');
  updateTicker(summary);
  return true;
}
window.resolvePowerOutageOption = resolvePowerOutageOption;

function updatePowerOutageDecision(dt) {
  ensurePowerOutageState();
  const safeDt = Math.max(0, Number(dt || 0));
  G._powerOutageSpawnChancePerSec = 0;

  if (G.powerOutageCooldown > 0) {
    G.powerOutageCooldown = Math.max(0, Number(G.powerOutageCooldown || 0) - safeDt);
  }
  if (G.powerOutageBuffRemaining > 0) {
    G.powerOutageBuffRemaining = Math.max(0, Number(G.powerOutageBuffRemaining || 0) - safeDt);
    if (G.powerOutageBuffRemaining <= 0) {
      G._powerOutageBuffPerfMult = 1;
      G._powerOutageBuffPriceMult = 1;
      G._powerOutageBuffCapMult = 1;
      G._powerOutageBuffCrashMult = 1;
      notify('✅ Netzkrisen-Buff ausgelaufen. Betrieb wieder normalisiert.', 'success');
    }
  }

  if (G.powerOutage && typeof G.powerOutage === 'object') {
    if (!G.powerOutage.resolved) {
      const autoPlan = String(G.powerOutageAutoPlan || 'balanced');
      if (autoPlan !== 'off') {
        const ageSec = Math.max(0, (Date.now() - Number(G.powerOutage.createdAt || Date.now())) / 1000);
        const crewOps = getRigCrewPowerOpsSummary();
        const outagePrep = Math.max(0.78, Number(crewOps.outagePrepMult || 1)) * Math.max(1, Number(G._prestigeOutagePrepMult || 1));
        const automationAssist = Math.max(0.82, Number(crewOps.automationAssistMult || 1)) * Math.max(1, Number(G._prestigeAutomationMult || 1));
        const autoDelay = Math.max(2, Number(POWER_AUTOMATION_BALANCE.outageAutoDelaySec || 6) / Math.max(0.82, outagePrep * automationAssist * 0.5));
        if (ageSec >= autoDelay) {
          const autoPick = pickPowerOutageOptionByPlan(autoPlan, G.powerOutage.options);
          if (autoPick) resolvePowerOutageOption(autoPick.id, true);
        }
      }
    }
    G.powerOutage.remaining = Math.max(0, Number(G.powerOutage.remaining || 0) - safeDt);
    if (!G.powerOutage.resolved && G.powerOutage.remaining <= 0) {
      const fallback = (G.powerOutage.options || []).find((opt) => String(opt.id || '').includes('load'))
        || (G.powerOutage.options || [])[0];
      if (fallback) resolvePowerOutageOption(fallback.id, true);
      notify('⏳ Keine Wahl getroffen - Notfallplan automatisch aktiv.', 'warning');
    } else if (G.powerOutage.resolved && G.powerOutage.remaining <= 0) {
      G.powerOutage = null;
    }
  } else if (!G._opsShutdown && getTotalRigCount() > 0 && Number(G.powerOutageCooldown || 0) <= 0) {
    const riskMeta = getPowerRiskProfileMeta(G.powerRiskProfile);
    const loadRatio = Math.max(0, Number(G._powerLoadRatio || 0));
    const loadExcess = Math.max(0, loadRatio - 0.9);
    const heat = getRigHeatSummary();
    const maxHeat = Math.max(0, Number(heat.maxHeat || 0));
    const avgHeat = Math.max(0, Number(heat.avgHeat || 0));
    const dangerCount = Math.max(0, Number(heat.dangerCount || 0));
    const criticalCount = Math.max(0, Number(heat.criticalCount || 0));
    const heatExcess = Math.max(0, maxHeat - 72) / 28;
    const avgHeatExcess = Math.max(0, avgHeat - 62) / 38;
    const hotspotPressure = Math.min(6, dangerCount) * 0.00015 + Math.min(4, criticalCount) * 0.00055;
    const baseSpawnChancePerSec = Math.max(
      0.00035,
      Math.min(
        0.028,
        0.00115 +
          loadExcess * 0.0032 +
          heatExcess * 0.0017 +
          avgHeatExcess * 0.0012 +
          hotspotPressure
      )
    );
    const riskOutageMult = Math.max(0.25, Number((riskMeta && riskMeta.outageMult) || 1));
    const crewOps = getRigCrewPowerOpsSummary();
    const outagePrepMult = Math.max(0.78, Number(crewOps.outagePrepMult || 1)) * Math.max(1, Number(G._prestigeOutagePrepMult || 1));
    const spawnChancePerSec = Math.max(0.0002, Math.min(0.04, (baseSpawnChancePerSec * riskOutageMult) / outagePrepMult));
    G._powerOutageSpawnChancePerSec = spawnChancePerSec;
    if (Math.random() < spawnChancePerSec * safeDt) {
      spawnPowerOutageEvent();
    }
  }

  let perf = 1;
  let price = 1;
  let cap = 1;
  let crash = 1;
  if (G.powerOutage && !G.powerOutage.resolved) {
    const p = G.powerOutage.penalties || {};
    perf *= Math.max(0.2, Number(p.perfMult || 1));
    price *= Math.max(0.2, Number(p.priceMult || 1));
    cap *= Math.max(0.2, Number(p.capMult || 1));
    crash *= Math.max(0.2, Number(p.crashMult || 1));
  }
  perf *= Math.max(0.2, Number(G._powerOutageBuffPerfMult || 1));
  price *= Math.max(0.2, Number(G._powerOutageBuffPriceMult || 1));
  cap *= Math.max(0.2, Number(G._powerOutageBuffCapMult || 1));
  crash *= Math.max(0.2, Number(G._powerOutageBuffCrashMult || 1));

  G._powerDecisionPerfMult = perf;
  G._powerDecisionPriceMult = price;
  G._powerDecisionCapMult = cap;
  G._powerDecisionCrashMult = crash;
}

function getPowerForecastSnapshot() {
  ensurePowerOutageState();
  const riskMeta = getPowerRiskProfileMeta(G.powerRiskProfile);
  const batteryMeta = getPowerBatteryStrategyMeta(G.powerBatteryStrategy);
  const usageKw = Math.max(0, Number(G.powerUsageKw || 0));
  const capKw = Math.max(0.01, Number(G._powerEffectiveCapKw || G.powerCapacityKw || 0.01));
  const loadRatio = Math.max(0, usageKw / capKw);
  const spareKw = capKw - usageKw;
  const pricePerKwh = Math.max(0.01, Number(G.powerPriceCurrent || G.powerPriceBase || POWER_BALANCE.basePricePerKwh || 0.2));
  const provider = getPowerProviderById(G.powerProviderId);
  const heat = getRigHeatSummary();
  const crewOps = getRigCrewPowerOpsSummary();

  const avgHeat = Math.max(0, Number(heat.avgHeat || 0));
  const maxHeat = Math.max(0, Number(heat.maxHeat || 0));
  const dangerCount = Math.max(0, Number(heat.dangerCount || 0));
  const criticalCount = Math.max(0, Number(heat.criticalCount || 0));
  const thermalScore = Math.max(
    0,
    Math.min(
      100,
      Math.max(0, avgHeat - 52) * 0.95 +
      Math.max(0, maxHeat - 70) * 1.45 +
      dangerCount * 6.2 +
      criticalCount * 13.5
    )
  );
  const overloadScore = Math.max(0, Math.min(100, Math.max(0, loadRatio - 0.84) * 290));
  const outageChancePerSec = Math.max(0, Number(G._powerOutageSpawnChancePerSec || 0));
  const outageChancePerMin = Math.max(0, Math.min(0.95, 1 - Math.exp(-outageChancePerSec * 60)));
  const outageScore = outageChancePerMin * 100;
  const riskScore = Math.max(0, Math.min(100, thermalScore * 0.42 + overloadScore * 0.33 + outageScore * 0.25));

  const dailyEnergyKwh = usageKw * 24;
  const dailyEnergyCost = dailyEnergyKwh * pricePerKwh;
  const fixedCost = Math.max(0, Number(POWER_BALANCE.billBaseFee || 0))
    + Math.max(0, Number(POWER_BALANCE.billLevelFee || 0)) * Math.max(0, Number(G.powerInfraLevel || 0))
    + Math.max(0, Number(provider.baseFeePerDay || 0));
  const projectedPowerDayCost = dailyEnergyCost + fixedCost;

  let recommendation = 'Betrieb stabil. Skalierung moeglich.';
  if (criticalCount > 0 || riskScore >= 72) {
    recommendation = 'Sofort kuehlen/umlayouten. Risiko kritisch.';
  } else if (loadRatio > 1.0) {
    recommendation = 'Ueberlast: Kapazitaet oder Last senken.';
  } else if (riskScore >= 52 || maxHeat >= 84) {
    recommendation = 'Kuehlung und Safety-Fokus anheben.';
  } else if (spareKw < 1.25) {
    recommendation = 'Kaum Lastpuffer. +Kapazitaet oder Frugal-Fokus.';
  }

  return {
    riskProfileId: String((riskMeta && riskMeta.id) || 'balanced'),
    riskProfileLabel: String((riskMeta && riskMeta.label) || 'Balanced'),
    riskProfileDesc: String((riskMeta && riskMeta.desc) || ''),
    riskAutoMode: String(G.powerRiskAutoMode || 'off'),
    riskAutoCooldown: Math.max(0, Number(G.powerRiskAutoCooldown || 0)),
    commandLinkEnabled: !!G.powerCommandLinkEnabled,
    commandCooldown: Math.max(0, Number(G.powerCommandCooldown || 0)),
    linkedOutagePlan: getOutagePlanForRiskProfile(G.powerRiskProfile),
    loadGuardEnabled: !!G.powerLoadGuardEnabled,
    loadGuardTarget: Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85))),
    loadGuardActive: !!G._powerLoadGuardActive,
    batteryStrategyId: String((batteryMeta && batteryMeta.id) || 'balanced'),
    batteryStrategyLabel: String((batteryMeta && batteryMeta.label) || 'Balanced'),
    batteryStrategyDesc: String((batteryMeta && batteryMeta.desc) || ''),
    tariffPolicyId: String((getPowerTariffPolicyMeta(G.powerTariffPolicy).id) || 'off'),
    tariffPolicyLabel: String((getPowerTariffPolicyMeta(G.powerTariffPolicy).label) || 'Aus'),
    tariffPolicyDesc: String((getPowerTariffPolicyMeta(G.powerTariffPolicy).desc) || ''),
    usageKw,
    capKw,
    spareKw,
    loadRatio,
    avgHeat,
    maxHeat,
    dangerCount,
    criticalCount,
    thermalScore,
    outageChancePerSec,
    outageChancePerMin,
    outageScore,
    overloadScore,
    riskScore,
    pricePerKwh,
    dailyEnergyKwh,
    dailyEnergyCost,
    projectedPowerDayCost,
    crewPowerUsageMult: Math.max(0.5, Number(crewOps.powerUsageMult || 1)),
    crewHeatGainMult: Math.max(0.5, Number(crewOps.heatGainMult || 1)),
    crewCoolingAssistMult: Math.max(0.5, Number(crewOps.coolingAssistMult || 1)),
    crewAutomationAssistMult: Math.max(0.5, Number(crewOps.automationAssistMult || 1)),
    crewOutagePrepMult: Math.max(0.5, Number(crewOps.outagePrepMult || 1)),
    outagesSeen: Math.max(0, Number(G.outageEventsSeen || 0)),
    outagesAuto: Math.max(0, Number(G.outageAutoResolved || 0)),
    outagesManual: Math.max(0, Number(G.outageManualResolved || 0)),
    riskProfileChanges: Math.max(0, Number(G.powerRiskProfileChanges || 0)),
    riskAutoSwitches: Math.max(0, Number(G.powerRiskAutoSwitches || 0)),
    commandSyncs: Math.max(0, Number(G.powerCommandSyncs || 0)),
    loadGuardActions: Math.max(0, Number(G.powerLoadGuardActions || 0)),
    batteryStrategyChanges: Math.max(0, Number(G.powerBatteryStrategyChanges || 0)),
    batteryStrategySavingsUsd: Math.max(0, Number(G._powerBatteryStrategySavingsUsd || 0)),
    tariffPolicyChanges: Math.max(0, Number(G.powerTariffPolicyChanges || 0)),
    tariffPolicySyncs: Math.max(0, Number(G.powerTariffPolicySyncs || 0)),
    collectionSets: Math.max(0, Number(G.collectionSetCompletions || 0)),
    prestigeAutomationMult: Math.max(1, Number(G._prestigeAutomationMult || 1)),
    prestigeOutagePrepMult: Math.max(1, Number(G._prestigeOutagePrepMult || 1)),
    recommendation,
  };
}
window.getPowerForecastSnapshot = getPowerForecastSnapshot;

function getRecommendedPowerSetup() {
  const forecast = getPowerForecastSnapshot();
  const tariff = String(G.powerTariffLabel || 'Tag');
  const risk = Number(forecast.riskScore || 0);
  const load = Number(forecast.loadRatio || 0);
  const maxHeat = Number(forecast.maxHeat || 0);
  const spareKw = Number(forecast.spareKw || 0);

  const setup = {
    riskProfile: 'balanced',
    batteryStrategy: 'balanced',
    tariffPolicy: 'balanced',
    loadGuardEnabled: false,
    loadGuardTarget: 0.85,
    note: 'Stabiler Standardmix fuer gleichmaessige Produktion.',
  };

  if (tariff === 'Peak') {
    setup.tariffPolicy = 'cost_focus';
    setup.batteryStrategy = 'peak_guard';
    setup.loadGuardEnabled = true;
    setup.loadGuardTarget = 0.80;
    setup.note = 'Peak-Fenster: Kosten druecken und Spitzen mit Akku glätten.';
  }
  if (risk >= 72 || maxHeat >= 88 || load >= 0.98) {
    setup.riskProfile = 'emergency';
    setup.batteryStrategy = 'reserve';
    setup.tariffPolicy = 'cost_focus';
    setup.loadGuardEnabled = true;
    setup.loadGuardTarget = 0.75;
    setup.note = 'Kritische Lage: Netz schuetzen und Hardware stabilisieren.';
  } else if (risk >= 54 || maxHeat >= 78 || load >= 0.88) {
    setup.riskProfile = 'resilience';
    setup.batteryStrategy = tariff === 'Peak' ? 'peak_guard' : 'balanced';
    setup.tariffPolicy = tariff === 'Peak' ? 'cost_focus' : 'balanced';
    setup.loadGuardEnabled = true;
    setup.loadGuardTarget = 0.82;
    setup.note = 'Erhoehtes Risiko: auf Stabilitaet und Peak-Schutz umstellen.';
  } else if ((tariff === 'Nacht' || tariff === 'Spaet') && spareKw >= 2.5 && load <= 0.72) {
    setup.riskProfile = 'throughput';
    setup.batteryStrategy = tariff === 'Nacht' ? 'balanced' : 'arbitrage';
    setup.tariffPolicy = 'rush';
    setup.loadGuardEnabled = false;
    setup.loadGuardTarget = 0.90;
    setup.note = 'Guenstiges Zeitfenster: Durchsatz hochfahren und Akku fuer spaeter laden.';
  }

  return setup;
}
window.getRecommendedPowerSetup = getRecommendedPowerSetup;

function updatePowerTariffPolicy(dt) {
  ensurePowerOutageState();
  const policy = getPowerTariffPolicyMeta(G.powerTariffPolicy);
  if (!policy || policy.id === 'off') return;
  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;
  const crewOps = getRigCrewPowerOpsSummary();
  const automationAssist = Math.max(0.82, Number(crewOps.automationAssistMult || 1)) * Math.max(1, Number(G._prestigeAutomationMult || 1));
  G.powerTariffPolicyCooldown = Math.max(0, Number(G.powerTariffPolicyCooldown || 0) - safeDt * automationAssist);
  if (Number(G.powerTariffPolicyCooldown || 0) > 0) return;

  const tariffLabel = String(G.powerTariffLabel || 'Tag');
  const target = (policy.byTariff && policy.byTariff[tariffLabel]) || null;
  if (!target) return;

  let changed = false;
  if (String(G.powerBatteryStrategy || 'balanced') !== String(target.batteryStrategy || 'balanced')) {
    G.powerBatteryStrategy = String(target.batteryStrategy || 'balanced');
    G.powerBatteryStrategyChanges = Math.max(0, Number(G.powerBatteryStrategyChanges || 0)) + 1;
    changed = true;
  }
  if (String(G.powerRiskAutoMode || 'off') === 'off' && String(G.powerRiskProfile || 'balanced') !== String(target.riskProfile || 'balanced')) {
    G.powerRiskProfile = String(target.riskProfile || 'balanced');
    G.powerRiskProfileChanges = Math.max(0, Number(G.powerRiskProfileChanges || 0)) + 1;
    changed = true;
  }
  if (!changed) return;

  G.powerTariffPolicySyncs = Math.max(0, Number(G.powerTariffPolicySyncs || 0)) + 1;
  G.powerTariffPolicyCooldown = 45 / automationAssist;
  notify('⏱️ Tarif-Policy: ' + (policy.label || policy.id) + ' auf ' + tariffLabel + ' synchronisiert.', 'success');
}

function updatePowerRiskAutomation(dt) {
  ensurePowerOutageState();
  const mode = String(G.powerRiskAutoMode || 'off');
  if (mode === 'off') return;
  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;

  const crewOps = getRigCrewPowerOpsSummary();
  const automationAssist = Math.max(0.82, Number(crewOps.automationAssistMult || 1)) * Math.max(1, Number(G._prestigeAutomationMult || 1));
  G.powerRiskAutoCooldown = Math.max(0, Number(G.powerRiskAutoCooldown || 0) - safeDt * automationAssist);
  if (Number(G.powerRiskAutoCooldown || 0) > 0) return;

  const forecast = getPowerForecastSnapshot();
  const current = String(G.powerRiskProfile || 'balanced');
  const unresolvedOutage = !!(G.powerOutage && !G.powerOutage.resolved);
  let target = current;

  if (mode === 'assist') {
    if (unresolvedOutage || Number(forecast.riskScore || 0) >= 76) target = 'emergency';
    else if (Number(forecast.riskScore || 0) >= 56) target = 'resilience';
    else if (Number(forecast.riskScore || 0) <= 36 && Number(forecast.loadRatio || 0) < 0.78) target = 'balanced';
  } else {
    if (unresolvedOutage || Number(forecast.riskScore || 0) >= 72 || Number(forecast.maxHeat || 0) >= 92) target = 'emergency';
    else if (Number(forecast.riskScore || 0) >= 52 || Number(forecast.outageChancePerMin || 0) >= 0.12) target = 'resilience';
    else if (Number(forecast.riskScore || 0) <= 32 && Number(forecast.loadRatio || 0) < 0.74 && Number(forecast.outageChancePerMin || 0) < 0.04) target = 'throughput';
    else target = 'balanced';
  }

  if (target === current) return;
  if (!POWER_RISK_PROFILES[target]) return;
  G.powerRiskProfile = target;
  G.powerRiskProfileChanges = Math.max(0, Number(G.powerRiskProfileChanges || 0)) + 1;
  G.powerRiskAutoSwitches = Math.max(0, Number(G.powerRiskAutoSwitches || 0)) + 1;
  G.powerRiskAutoCooldown = ((mode === 'assist') ? 80 : 60) / automationAssist;
  const label = String((POWER_RISK_PROFILES[target] || {}).label || target);
  notify('🤖 Grid-Auto schaltet auf ' + label + '.', 'success');
}

function getOutagePlanForRiskProfile(riskProfileId) {
  const id = String(riskProfileId || 'balanced');
  if (id === 'throughput') return 'greedy';
  if (id === 'resilience' || id === 'emergency') return 'safe';
  return 'balanced';
}
window.getOutagePlanForRiskProfile = getOutagePlanForRiskProfile;

function updatePowerCommandLink(dt) {
  ensurePowerOutageState();
  if (!G.powerCommandLinkEnabled) return;
  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;
  const crewOps = getRigCrewPowerOpsSummary();
  const automationAssist = Math.max(0.82, Number(crewOps.automationAssistMult || 1)) * Math.max(1, Number(G._prestigeAutomationMult || 1));
  G.powerCommandCooldown = Math.max(0, Number(G.powerCommandCooldown || 0) - safeDt * automationAssist);
  if (Number(G.powerCommandCooldown || 0) > 0) return;

  const desiredPlan = getOutagePlanForRiskProfile(G.powerRiskProfile);
  const currentPlan = String(G.powerOutageAutoPlan || 'balanced');
  if (desiredPlan === currentPlan) return;

  G.powerOutageAutoPlan = desiredPlan;
  G.powerCommandSyncs = Math.max(0, Number(G.powerCommandSyncs || 0)) + 1;
  G.powerCommandCooldown = 18 / automationAssist;
}

function updateThermalSystem(dt) {
  ensureRigHeatState();
  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;
  const modeMeta = getCoolingModeMeta(G.coolingMode);
  const loadRatio = Math.max(0, Number(G._powerLoadRatio || 0));
  const totalRigs = getTotalRigCount();

  const baseCooling = Math.max(0.05, Number(COOLING_BALANCE.baseCoolingPerSec || 0.55));
  const levelCooling = Math.max(0.01, Number(COOLING_BALANCE.levelCoolingPerSec || 0.24)) * Math.max(0, Number(G.coolingInfraLevel || 0));
  const coolingPerSec = (baseCooling + levelCooling) * Math.max(0.4, Number(modeMeta.coolingMult || 1)) * Math.max(0.6, Number(G._locMaintenanceMult || 1)) * Math.max(1, Number(G._collectionCoolingMult || 1));

  const baseCoolingPower = Math.max(0.02, Number(COOLING_BALANCE.basePowerKw || 0.12));
  const coolingPowerLevel = Math.max(0.01, Number(COOLING_BALANCE.levelPowerKw || 0.08)) * Math.max(0, Number(G.coolingInfraLevel || 0));

  let activeHeatTypes = 0;
  let avgHeatForPower = 0;
  (RIGS || []).forEach((rig) => {
    const rigId = rig.id;
    const count = Math.max(0, Number((G.rigs || {})[rigId] || 0));
    let heat = getRigHeat(rigId);
    if (count <= 0 || G._opsShutdown) {
      heat = Math.max(0, heat - (3.8 + Math.max(0, Number(G.coolingInfraLevel || 0)) * 0.35) * safeDt);
      G.rigHeat[rigId] = heat;
      return;
    }
    const maintenance = getRigMaintenanceStats(rigId);
    const layoutHeat = Math.max(0.45, Number(G._layoutHeatMult || 1));
    const rigKw = Math.max(0, Number(rig.powerW || 0) * count / 1000);
    const loadHeat = 1 + Math.max(0, loadRatio - 0.88) * 0.8;
    const coverageCool = (1 + Math.max(0, Number(maintenance.coverage || 0)) * 0.3) * Math.max(0.82, Number(maintenance.coolingAssistMult || 1));

    const gain = rigKw * 0.22 * layoutHeat * loadHeat * Math.max(0.8, Number(maintenance.heatGainMult || 1)) * safeDt;
    const drop = coolingPerSec * coverageCool * safeDt;
    heat = Math.max(0, Math.min(100, heat + gain - drop));
    G.rigHeat[rigId] = heat;

    activeHeatTypes += 1;
    avgHeatForPower += heat;
  });

  if (activeHeatTypes > 0) avgHeatForPower /= activeHeatTypes;
  const thermalPressure = Math.max(0, avgHeatForPower - 45) / 55;
  const turboHps = Math.max(0.85, Number(modeMeta.hpsMult || 1));
  G._coolingHpsMult = turboHps;
  G.coolingPowerKw = totalRigs > 0
    ? (baseCoolingPower + coolingPowerLevel) * Math.max(0.5, Number(modeMeta.powerMult || 1)) * (1 + thermalPressure * 0.65)
    : 0;
  updateCoolingAutomation(safeDt);
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
    return {
      rigCount: 0, capacity: 0, coverage: 1, uncoveredRatio: 0, repairPerSec: 0, crashReduction: 0,
      powerUsageMult: 1, heatGainMult: 1, coolingAssistMult: 1, automationAssistMult: 1, outagePrepMult: 1
    };
  }

  const assigned = G.rigStaffAssignments[rigId] || {};
  const focus = getRigCrewFocus(rigId);
  let capacity = 0;
  let repairPerSecTotal = 0;
  let crashReductionTotal = 0;
  let powerSupportTotal = 0;
  let coolingSupportTotal = 0;
  let automationSupportTotal = 0;
  let outageSupportTotal = 0;
  let heatDisciplineTotal = 0;
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
    const lvlOps = 1 + (lv - 1) * 0.035;
    capacity += count * Number(tier.rigsPerUnit || 0) * lvlCap * Number(spec.cap || 1) * Number(focus.cap || 1) * staffEffMult * prestigeCrewEff;
    repairPerSecTotal += count * Number(tier.repairPerSec || 0) * lvlRepair * Number(spec.repair || 1) * Number(focus.repair || 1) * staffEffMult * prestigeCrewEff;
    crashReductionTotal += count * Number(tier.crashReduction || 0) * lvlCrash * Number(spec.crash || 1) * Number(focus.crash || 1) * Math.max(0.65, staffEffMult) * Math.max(0.75, prestigeCrewEff);
    powerSupportTotal += count * lvlOps * Number(spec.power || 1) * Number(focus.power || 1) * Math.max(0.7, staffEffMult) * Math.max(0.75, prestigeCrewEff);
    coolingSupportTotal += count * lvlOps * Number(spec.cooling || 1) * Number(focus.cooling || 1) * Math.max(0.7, staffEffMult) * Math.max(0.75, prestigeCrewEff);
    automationSupportTotal += count * lvlOps * Number(spec.automation || 1) * Number(focus.automation || 1) * Math.max(0.75, staffEffMult) * Math.max(0.8, prestigeCrewEff);
    outageSupportTotal += count * lvlOps * Number(spec.outage || 1) * Number(focus.outage || 1) * Math.max(0.75, staffEffMult) * Math.max(0.8, prestigeCrewEff);
    heatDisciplineTotal += count * lvlOps * Number(spec.heat || 1) * Number(focus.heat || 1) * Math.max(0.7, staffEffMult) * Math.max(0.75, prestigeCrewEff);
  });

  const coverage = Math.max(0, Math.min(1, capacity / rigCount));
  const uncoveredRatio = Math.max(0, 1 - coverage);
  const maintMult = Math.max(0.5, Number(G._locMaintenanceMult || 1));
  const repairPerSec = (repairPerSecTotal * maintMult) / Math.max(1, rigCount);
  const crashReduction = Math.min(0.85, crashReductionTotal * coverage * maintMult);
  const powerSupport = powerSupportTotal / Math.max(1, rigCount);
  const coolingSupport = coolingSupportTotal / Math.max(1, rigCount);
  const automationSupport = automationSupportTotal / Math.max(1, rigCount);
  const outageSupport = outageSupportTotal / Math.max(1, rigCount);
  const heatDiscipline = heatDisciplineTotal / Math.max(1, rigCount);
  const powerUsageMult = Math.max(0.82, Math.min(1.08, 1 - (powerSupport - 1) * 0.22 * coverage));
  const heatGainMult = Math.max(0.80, Math.min(1.12, 1 - (heatDiscipline - 1) * 0.26 * coverage));
  const coolingAssistMult = Math.max(0.82, Math.min(1.28, 1 + (coolingSupport - 1) * 0.30 * coverage));
  const automationAssistMult = Math.max(0.82, Math.min(1.28, 1 + (automationSupport - 1) * 0.28 * coverage));
  const outagePrepMult = Math.max(0.78, Math.min(1.25, 1 + (outageSupport - 1) * 0.34 * coverage));

  return {
    rigCount, capacity, coverage, uncoveredRatio, repairPerSec, crashReduction,
    powerUsageMult, heatGainMult, coolingAssistMult, automationAssistMult, outagePrepMult
  };
}

function getRigCrewPowerOpsSummary() {
  ensureRigStaffState();
  const rows = (RIGS || []).filter((rig) => Number((G.rigs || {})[rig.id] || 0) > 0);
  if (!rows.length) {
    return { powerUsageMult: 1, heatGainMult: 1, coolingAssistMult: 1, automationAssistMult: 1, outagePrepMult: 1 };
  }
  let totalWeight = 0;
  let powerUsageWeighted = 0;
  let heatWeighted = 0;
  let coolingWeighted = 0;
  let automationWeighted = 0;
  let outageWeighted = 0;
  rows.forEach((rig) => {
    const weight = Math.max(1, Number((G.rigs || {})[rig.id] || 0));
    const stats = getRigMaintenanceStats(rig.id);
    totalWeight += weight;
    powerUsageWeighted += Number(stats.powerUsageMult || 1) * weight;
    heatWeighted += Number(stats.heatGainMult || 1) * weight;
    coolingWeighted += Number(stats.coolingAssistMult || 1) * weight;
    automationWeighted += Number(stats.automationAssistMult || 1) * weight;
    outageWeighted += Number(stats.outagePrepMult || 1) * weight;
  });
  return {
    powerUsageMult: powerUsageWeighted / totalWeight,
    heatGainMult: heatWeighted / totalWeight,
    coolingAssistMult: coolingWeighted / totalWeight,
    automationAssistMult: automationWeighted / totalWeight,
    outagePrepMult: outageWeighted / totalWeight,
  };
}
window.getRigCrewPowerOpsSummary = getRigCrewPowerOpsSummary;

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
  ensureRigLayoutState();
  ensureRigHeatState();
  ensurePowerOutageState();
  const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const bonus = (loc && loc.bonus) ? loc.bonus : {};
  const shopFx = (typeof window.getCurrentLocationShopEffects === 'function')
    ? getCurrentLocationShopEffects()
    : {};
  const layout = getActiveRigLayout((loc && loc.id) || (G && G.locationId) || 'home_pc');

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
  G._layoutHpsMult = Number(layout.hpsMult || 1);
  G._layoutPowerUsageMult = Number(layout.powerMult || 1);
  G._layoutHeatMult = Number(layout.heatMult || 1);
  G._layoutCrashMult = Number(layout.crashMult || 1);
  G._activeRigLayoutId = layout.id || 'balanced_grid';
  G._activeRigLayoutName = layout.name || 'Balanced Grid';
  G._locCrashRiskMult = Number(bonus.crashRiskMult || 1) * G._shopCrashRiskMult * G._layoutCrashMult;
  G._locPowerUsageMult = Number(bonus.powerUsageMult || 1) * G._shopPowerUsageMult * G._layoutPowerUsageMult;

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
  const decisionCapMult = Number(G._powerDecisionCapMult || 1);
  const locCapMult = Math.max(0.5, Number(G._locPowerCapMult || 1));
  const prestigeCapMult = Math.max(1, Number(G._prestigePowerCapMult || 1));
  const provider = getPowerProviderById(G.powerProviderId);
  const providerCapMult = Math.max(0.6, Number((provider && provider.capMult) || 1));
  return Math.max(0.25, baseCap * eventCapMult * decisionCapMult * providerCapMult * locCapMult * prestigeCapMult);
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
  const thermal = (typeof getRigThermalEffects === 'function')
    ? getRigThermalEffects(rigId)
    : { drainMult: 1 };
  const thermalPowerMult = Math.max(0.65, Number(thermal.drainMult || 1));
  const maintenance = getRigMaintenanceStats(rigId);
  return ((watt * qty) / 1000) * Number(G._locPowerUsageMult || 1) * thermalPowerMult * Math.max(0.8, Number(maintenance.powerUsageMult || 1)) * Math.max(0.65, Number(G._collectionPowerUsageMult || 1));
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
  return Math.ceil(Number(res.cost || 0));
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
  ensureRigHeatState();
  let kw = 0;
  RIGS.forEach(r => {
    const count = Number(G.rigs[r.id] || 0);
    if (count <= 0) return;

    const mods = (G.rigMods && G.rigMods[r.id]) ? G.rigMods[r.id] : [];
    const bonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : {};
    const energyMult = Number(bonuses.energyDrain || 1);
    const thermal = (typeof getRigThermalEffects === 'function')
      ? getRigThermalEffects(r.id)
      : { drainMult: 1 };
    const thermalPowerMult = Math.max(0.65, Number(thermal.drainMult || 1));
    const maintenance = getRigMaintenanceStats(r.id);
    const watt = Number(r.powerW || 0) * Math.max(0.4, Math.min(2.2, energyMult)) * thermalPowerMult;
    kw += ((watt * count) / 1000) * Math.max(0.8, Number(maintenance.powerUsageMult || 1));
  });
  kw += Math.max(0, Number(G.coolingPowerKw || 0));
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
  if (!G.rigHeat || typeof G.rigHeat !== 'object') G.rigHeat = {};
  (RIGS || []).forEach((rig) => { G.rigEnergy[rig.id] = 100; });
  (RIGS || []).forEach((rig) => { G.rigHeat[rig.id] = 12; });
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
  G.powerOutage = null;
  G.powerOutageCooldown = 200;
  G.powerOutageBuffRemaining = 0;
  G._powerOutageBuffPerfMult = 1;
  G._powerOutageBuffPriceMult = 1;
  G._powerOutageBuffCapMult = 1;
  G._powerOutageBuffCrashMult = 1;
  G._powerDecisionPerfMult = 1;
  G._powerDecisionPriceMult = 1;
  G._powerDecisionCapMult = 1;
  G._powerDecisionCrashMult = 1;

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
  settleWalletYieldForDay(dayNo);

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
  ensureRigHeatState();
  ensurePowerOutageState();
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
  const decisionPriceMult = Math.max(0.2, Number(G._powerDecisionPriceMult || 1));
  const decisionCapMult = Math.max(0.2, Number(G._powerDecisionCapMult || 1));
  const decisionCrashMult = Math.max(0.2, Number(G._powerDecisionCrashMult || 1));
  const decisionPerfMult = Math.max(0.2, Number(G._powerDecisionPerfMult || 1));
  const riskMeta = getPowerRiskProfileMeta(G.powerRiskProfile);
  const riskPerfMult = Math.max(0.2, Number((riskMeta && riskMeta.perfMult) || 1));
  const riskPriceMult = Math.max(0.2, Number((riskMeta && riskMeta.priceMult) || 1));
  const riskCrashMult = Math.max(0.2, Number((riskMeta && riskMeta.crashMult) || 1));
  const riskOutageMult = Math.max(0.2, Number((riskMeta && riskMeta.outageMult) || 1));
  G._powerRiskPerfMult = riskPerfMult;
  G._powerRiskPriceMult = riskPriceMult;
  G._powerRiskCrashMult = riskCrashMult;
  G._powerRiskOutageMult = riskOutageMult;

  const priceMult = applyPenaltyToHigh(Number(G._powerEventPriceMult || 1)) * decisionPriceMult * riskPriceMult;
  const capMult = applyPenaltyToLow(Number(G._powerEventCapMult || 1)) * decisionCapMult;
  const crashMult = applyPenaltyToHigh(Number(G._powerEventCrashMult || 1)) * decisionCrashMult * riskCrashMult;
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
  let dischargedKwhForSavings = 0;
  const batteryStrategy = getPowerBatteryStrategyMeta(G.powerBatteryStrategy);

  if (batteryCap > 0) {
    batteryLevel = Math.min(batteryCap, batteryLevel);
    const chargeRateKw = Math.max(0.1, Number(G.powerBatteryChargeRateKw || 1.2)) * Math.max(0.5, Number(G._locBatteryChargeMult || 1));
    const dischargeRateKw = Math.max(0.1, Number(G.powerBatteryDischargeRateKw || 1.5));
    const cycleLoss = Math.max(0, Math.min(0.15, Number(G.powerBatteryCycleLoss || 0.03)));
    const reserveFrac = Math.max(0, Math.min(0.9, Number((batteryStrategy && batteryStrategy.reserveFrac) || 0)));
    const reserveKwh = batteryCap * reserveFrac;
    const chargeHeadroom = Math.max(0.55, Math.min(0.98, Number((batteryStrategy && batteryStrategy.chargeHeadroom) || 0.85)));
    const isCheapTariff = tariff.label === 'Nacht' || tariff.label === 'Spaet';
    const isExpensiveTariff = tariff.label === 'Peak' || tariff.label === 'Tag';
    const adaptiveChargeHeadroom = (batteryStrategy.id === 'arbitrage')
      ? (isCheapTariff ? 0.97 : 0.72)
      : chargeHeadroom;
    const peakDischargeLoad = Math.max(0, Math.min(1, Number((batteryStrategy && batteryStrategy.peakDischargeLoad) || 0)));

    const overloadKw = Math.max(0, rawUsageKw - effectiveCapKw);
    const canUseStored = Math.max(0, batteryLevel - reserveKwh);

    if (overloadKw > 0.001 && canUseStored > 0.001) {
      const maxKwByStorage = canUseStored / hours;
      const dischargeKw = Math.min(overloadKw, dischargeRateKw, maxKwByStorage);
      const dischargedKwh = dischargeKw * hours;
      batteryLevel = Math.max(0, batteryLevel - dischargedKwh);
      dischargedKwhForSavings += dischargedKwh;
      gridUsageKw = Math.max(0, rawUsageKw - dischargeKw);
      batteryMode = 'entlaedt';
      batteryFlowKw = -dischargeKw;
    } else if (
      peakDischargeLoad > 0 &&
      isExpensiveTariff &&
      canUseStored > 0.001 &&
      rawUsageKw > effectiveCapKw * peakDischargeLoad
    ) {
      const desiredKw = rawUsageKw - effectiveCapKw * Math.max(0.45, peakDischargeLoad - 0.16);
      const maxKwByStorage = canUseStored / hours;
      const dischargeKw = Math.max(0, Math.min(desiredKw, dischargeRateKw, maxKwByStorage));
      if (dischargeKw > 0.001) {
        const dischargedKwh = dischargeKw * hours;
        batteryLevel = Math.max(0, batteryLevel - dischargedKwh);
        dischargedKwhForSavings += dischargedKwh;
        gridUsageKw = Math.max(0, rawUsageKw - dischargeKw);
        batteryMode = 'entlaedt';
        batteryFlowKw = -dischargeKw;
      }
    } else if (rawUsageKw < effectiveCapKw * adaptiveChargeHeadroom && batteryLevel < batteryCap - 0.001) {
      const spareKw = Math.max(0, effectiveCapKw * adaptiveChargeHeadroom - rawUsageKw);
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
  const guardTarget = Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85)));
  const guardEnabled = !!G.powerLoadGuardEnabled;
  const guardCapKw = effectiveCapKw * guardTarget;
  let guardPerfMult = 1;

  if (guardEnabled && usageKw > guardCapKw + 1e-9) {
    const oldUsageKw = usageKw;
    usageKw = guardCapKw;
    loadRatio = usageKw / effectiveCapKw;
    guardPerfMult = Math.max(0.45, usageKw / Math.max(0.000001, oldUsageKw));
    if (!G._powerLoadGuardActive) {
      G._powerLoadGuardActive = true;
      G.powerLoadGuardActions = Math.max(0, Number(G.powerLoadGuardActions || 0)) + 1;
      notify('🧯 Load Guard aktiv: Last automatisch gedrosselt.', 'warning');
    }
  } else if (G._powerLoadGuardActive) {
    G._powerLoadGuardActive = false;
    notify('✅ Load Guard: Last wieder innerhalb Zielbereich.', 'success');
  }

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
  perfMult *= decisionPerfMult * riskPerfMult * guardPerfMult;
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
  if (dischargedKwhForSavings > 0.000001) {
    G._powerBatteryStrategySavingsUsd = Math.max(
      0,
      Number(G._powerBatteryStrategySavingsUsd || 0) + dischargedKwhForSavings * Math.max(0.01, Number(G.powerPriceCurrent || 0))
    );
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
    const thermal = (typeof getRigThermalEffects === 'function')
      ? getRigThermalEffects(rigId)
      : { drainMult: 1, repairMult: 1 };
    const uncoveredPenalty = 1 + maintenance.uncoveredRatio * 0.45;
    
    const baseDrain = 0.8 * drainMult * overloadMult * locDrainMult * uncoveredPenalty * Math.max(0.7, Number(thermal.drainMult || 1)); // % pro Sekunde wenn aktiv
    const repairPerSec = Math.max(0, Number(maintenance.repairPerSec || 0)) * Math.max(0.45, Number(thermal.repairMult || 1));
    
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
    if (!G.rigHeat || typeof G.rigHeat !== 'object') G.rigHeat = {};
    G.rigHeat[rigId] = 24;
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
      const thermal = (typeof getRigThermalEffects === 'function') ? getRigThermalEffects(rigId) : { heat: 0, crashMult: 1 };
      const crashResist = Math.max(0, Math.min(0.95, Number(bonuses.crashResistance || 0) + Number(maintenance.crashReduction || 0)));
      const powerCrashMult = Math.max(1, Number(G._powerCrashMult || 1));
      const locCrashMult = Math.max(0.5, Number(G._locCrashRiskMult || 1));
      const uncoveredRisk = 1 + Number(maintenance.uncoveredRatio || 0) * 0.6;
      const insuranceMult = G.insuranceActive ? Math.max(0.55, 0.8 - Number(G.insuranceTier || 0) * 0.06) : 1;
      const thermalCrashMult = Math.max(0.8, Number(thermal.crashMult || 1));
      const crashRisk = Math.min(0.95, (G._crashRiskBase || 0.02) * (1 - crashResist) * powerCrashMult * locCrashMult * uncoveredRisk * insuranceMult * thermalCrashMult);
      if (Math.random() < crashRisk) {
        explodeRig(r, count, 'Kritische Haltbarkeit');
      }
      if (Number(thermal.heat || 0) >= Number(COOLING_BALANCE.criticalStart || 94)) {
        const thermalBurstChance = Math.min(0.55, 0.12 + (Number(thermal.heat || 0) - Number(COOLING_BALANCE.criticalStart || 94)) * 0.03);
        if (Math.random() < thermalBurstChance) explodeRig(r, count, 'Thermal Runaway');
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
  updateThermalSystem(dt);
  updatePowerOutageDecision(dt);
  computeMultipliers();
  
  // ── Neue Systeme pro Tick ────────────────────────────────────
  updatePowerSystem(dt);
  updatePowerTariffPolicy(dt);
  updatePowerRiskAutomation(dt);
  updatePowerCommandLink(dt);
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
  if (typeof window.updateMiningComboDecay === 'function') window.updateMiningComboDecay();

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
  if (!G.marketFloorDrift || typeof G.marketFloorDrift !== 'object') G.marketFloorDrift = {};

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
    const floorBase = Number(c.basePrice || 1) * Math.max(0.35, Number(G._marketFloorMult || 0.45));
    let floorDrift = Number(G.marketFloorDrift[coin] || 0);
    floorDrift = floorDrift * Math.exp(-Math.max(0.1, Number(MARKET_BALANCE.floorDriftDecayPerSec || 0.85)) * dt)
      + (Math.random() - 0.5) * Number(MARKET_BALANCE.floorDriftStepPerSec || 0.0009) * dt;
    floorDrift = Math.max(-0.06, Math.min(0.06, floorDrift));
    const floor = floorBase * (1 + floorDrift);
    const ceiling = Number(c.basePrice || 1) * (9 + Math.min(6, Math.max(0, Number(G.prestigeCount || 0))));
    let finalPrice = Math.max(floor, Math.min(ceiling, nextPrice));
    let momentumFinal = momentum;
    if (finalPrice <= floor * 1.0002) {
      const reboundPct = (Number(MARKET_BALANCE.floorReboundMinPct || 0.0014) +
        Math.random() * (Number(MARKET_BALANCE.floorReboundMaxPct || 0.0046) - Number(MARKET_BALANCE.floorReboundMinPct || 0.0014)));
      finalPrice = Math.min(ceiling, floor * (1 + reboundPct));
      const reboundKick = Math.max(0, Number(MARKET_BALANCE.floorReboundKickPerSec || 0.0032));
      momentumFinal = Math.max(momentumFinal, reboundKick * profile.noiseMult);
    }
    G.marketFloorDrift[coin] = floorDrift;
    G.marketMomentum[coin] = momentumFinal;
    G.marketEventDrift[coin] = eventDrift;
    G.marketEventDriftTimer[coin] = eventTimer;
    G.prices[coin] = finalPrice;
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
  G._newsTickerTimer = Number.isFinite(G._newsTickerTimer) ? Number(G._newsTickerTimer) : (75 + Math.random() * 70);
  G._newsTickerTimer -= dt;
  if (G._newsTickerTimer <= 0) {
    G._newsTickerTimer = 65 + Math.random() * 95;
    if (!(G.activeEvent && Number((G.activeEvent || {}).endsAt || 0) > Date.now())) emitAmbientLiveNews();
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
  const collectionsPanel = document.getElementById('collections-panel');
  if (collectionsPanel && collectionsPanel.classList.contains('active') && typeof renderCollections === 'function') renderCollections();
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
