// ============================================================
// CORE — Speichern / Laden / Reset
// Speicherformat: localStorage Key 'hashvault_v4'
// Migriert auch alten 'hashvault_v3' Save.
// ============================================================

const SAVE_KEY_BASE = 'hashvault_v5';
const SLOT_META_KEY = 'hashvault_slots_meta_v1';
const SLOT_META_COUNT = 3;

function getActiveSlotIndex() {
  const fromWindow = Number(window.HV_ACTIVE_SLOT);
  if (Number.isInteger(fromWindow) && fromWindow >= 0) return fromWindow;

  const fromStorage = Number(localStorage.getItem('hashvault_active_slot'));
  if (Number.isInteger(fromStorage) && fromStorage >= 0) return fromStorage;

  return 0;
}

function getSaveKeyForSlot(slotIdx) {
  const safe = Number.isInteger(slotIdx) && slotIdx >= 0 ? slotIdx : 0;
  return SAVE_KEY_BASE + '_s' + (safe + 1);
}

function getCurrentSaveKey() {
  return getSaveKeyForSlot(getActiveSlotIndex());
}

window.HV_GET_SAVE_KEY_FOR_SLOT = getSaveKeyForSlot;

const SAVE_FIELDS = [
  'usd','hashes','totalHashes','totalEarned','totalClicks',
  'coins','coinReserves','prices','priceHistory',
  'rigs','upgrades','research','staff',
  'achievements','chipShop','contracts',
  'contractsDone','contractRefresh',
  'prestige','prestigeCount','chips','prestigeSkills','collectionSetCompletions',
  'lastAchievementId',
  'profileName',
  'selectedCoin','autoSell','autoSellCoins',
  'uiRigSort','uiRigOwnedOnly','debugOverlay','debugCheatUsd',
  'locationId','locationShopPurchases','unlockedLocationTier','locationMoveBoostUntilDay',
  'dailyStreak','lastDaily','playTime','maxCombo',
  'activeResearch','researchProgress','totalRigs',
  'layoutSwitchCount','coolingModeChanges','outageDecisions',
  'outageEventsSeen','outageAutoResolved','outageManualResolved',
  'powerRiskProfileChanges','powerRiskAutoModeChanges','powerCommandLinkChanges','powerRiskAutoSwitches','powerCommandSyncs',
  'powerLoadGuardActions','powerProviderChanges','powerOutagePlanChanges','coolingAutoProfileChanges','powerBatteryStrategyChanges','powerTariffPolicyChanges','powerTariffPolicySyncs','powerAdvisorRuns',
  // v5 additions:
  'rigTargets','rigHashPools','rigLayoutByLocation','rigHeat','rigBuildPresetSelected','totalCoinsMined',
  'recentEvents','activeEvent',
  'activeResearch2','researchProgress2',
  'activeBoosts',
  // v5.1 additions (Features):
  'dailyChallenges','challengeProgress',
  'goalsClaimed','storyMissionIndex','storyMissionsClaimed',
  'tutorialStep','tutorialEnabled','tutorialCompleted',
  'npcTraders','npcUsedToday',
  'rigEnergy','miningStreaks',
  'rigMods','unlockedMods','modLevels','modParts',
  'rigExplosions','_lastDailyReset',
  // v5.2 additions (Power + Time):
  'powerInfraLevel','powerCapacityKw','powerUsageKw',
  'powerPriceBase','powerPriceCurrent','powerTariffLabel',
  'powerBillAccrued','powerBillTimer','powerBillInterval',
  'powerDebt','powerEventLabel','powerEventRemaining',
  '_powerEventPriceMult','_powerEventCapMult','_powerEventCrashMult',
  '_powerEventSpawnTimer','_powerPerfMult','_powerOverloadMult','_powerCrashMult',
  '_powerEffectiveCapKw','_powerLoadRatio',
  'powerProviderId','powerProviderLockedUntilDay','powerPeakPenaltyAccrued',
  'powerBatteryTier','powerBatteryCapacityKwh','powerBatteryLevelKwh',
  'powerBatteryChargeRateKw','powerBatteryDischargeRateKw','powerBatteryCycleLoss',
  'powerBatteryMode','powerBatteryGridOffsetKw','powerBatteryStrategy','_powerBatteryStrategySavingsUsd','powerTariffPolicy','powerTariffPolicyCooldown',
  'coolingInfraLevel','coolingMode','coolingAutoProfile','_coolingAutoSwitchCd','coolingPowerKw',
  'powerRiskProfile','powerRiskAutoMode','powerRiskAutoCooldown','powerCommandLinkEnabled','powerCommandCooldown','powerLoadGuardEnabled','powerLoadGuardTarget','_powerLoadGuardActive','_powerRiskPerfMult','_powerRiskPriceMult','_powerRiskCrashMult','_powerRiskOutageMult',
  'powerOutage','powerOutageAutoPlan','powerOutageCooldown','_powerOutageSpawnChancePerSec','powerOutageBuffRemaining',
  '_powerOutageBuffPerfMult','_powerOutageBuffPriceMult','_powerOutageBuffCapMult','_powerOutageBuffCrashMult',
  '_powerDecisionPerfMult','_powerDecisionPriceMult','_powerDecisionCapMult','_powerDecisionCrashMult',
  'dailyBillHistory','dailyLastBilledDay','dailyOpsDebt','lastDailyBill',
  'opsDebtStage','opsDebtStageLabel','opsDebtStrikeDays','_opsShutdown','_opsPassiveIncomeMult',
  'loans','nextLoanId','insuranceActive','insuranceTier','leasedRigs','lastFinanceBill',
  'worldDay','worldTimeMinutes','_timeScaleMinPerSec',
  'marketRegime','marketRegimeTimer','marketRegimeDrift','marketRegimeVolMult','marketShockTimer','marketShockDir','marketShockAmp',
  'marketFloorDrift','marketMomentum','marketEventDrift','marketEventDriftTimer',
  '_newsTickerTimer',
  'walletYieldEnabled','walletYieldAccruedUsd','walletYieldLastDay','walletYieldHistory','walletLedger','walletUnlockDay','uiMissionFilter',
  'prestigeSkillPurchases','weeklyObjectives','weeklyObjectivesWeek','weeklyObjectivesClaimed','projectClaims',
  'hiredRigStaff','rigStaffAssignments','rigCrewProgress','rigCrewFocus','rigAutoRepair',
];

function cloneDefaultStateSafe() {
  try {
    if (typeof DEFAULT_STATE === 'object' && DEFAULT_STATE) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } catch {}
  return {};
}

function toNum(value, fallback, min, max, integer) {
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);
  let n = Number(value);
  if (!Number.isFinite(n)) n = Number(fallback || 0);
  if (!Number.isFinite(n)) n = 0;
  if (hasMin) n = Math.max(min, n);
  if (hasMax) n = Math.min(max, n);
  if (integer) n = Math.floor(n);
  return n;
}

function asUniqueStringArray(value, maxLen) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  const cap = Math.max(1, Number(maxLen || 500));
  for (let i = 0; i < value.length && out.length < cap; i += 1) {
    const v = String(value[i] || '').trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function ensureObject(value) {
  return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
}

function backupCorruptSave(raw, reason) {
  try {
    const stamp = Date.now();
    const key = 'hashvault_corrupt_backup_' + stamp;
    const payload = JSON.stringify({
      reason: String(reason || 'unknown'),
      slot: getActiveSlotIndex() + 1,
      savedAt: stamp,
      raw: String(raw || ''),
    });
    localStorage.setItem(key, payload);
    return key;
  } catch {
    return '';
  }
}

function sanitizeLoadedSavePayload(input) {
  const template = cloneDefaultStateSafe();
  const src = ensureObject(input);
  const out = template;
  const issues = [];
  const mark = (msg) => { issues.push(msg); };

  SAVE_FIELDS.forEach((k) => {
    if (src[k] !== undefined) out[k] = src[k];
  });
  if (src.lastSave !== undefined) out.lastSave = src.lastSave;

  out.usd = toNum(out.usd, template.usd, -1e15, 1e15, false);
  out.hashes = toNum(out.hashes, template.hashes, 0, 1e18, false);
  out.totalHashes = toNum(out.totalHashes, template.totalHashes, 0, 1e19, false);
  out.totalEarned = toNum(out.totalEarned, template.totalEarned, 0, 1e19, false);
  out.totalClicks = toNum(out.totalClicks, template.totalClicks, 0, 1e12, true);
  out.playTime = toNum(out.playTime, template.playTime, 0, 1e12, false);
  out.worldDay = toNum(out.worldDay, template.worldDay || 1, 1, 500000, true);
  out.worldTimeMinutes = toNum(out.worldTimeMinutes, template.worldTimeMinutes || (8 * 60), 0, 1439.999, false);
  out.contractRefresh = toNum(out.contractRefresh, 1800, 60, 3600, false);
  out.powerInfraLevel = toNum(out.powerInfraLevel, 0, 0, 5000, true);
  out.powerCapacityKw = toNum(out.powerCapacityKw, template.powerCapacityKw || 3, 0.5, 500000, false);
  out.powerUsageKw = toNum(out.powerUsageKw, 0, 0, 500000, false);
  out.powerPriceBase = toNum(out.powerPriceBase, template.powerPriceBase || 0.2, 0.01, 5, false);
  out.powerPriceCurrent = toNum(out.powerPriceCurrent, out.powerPriceBase, 0.01, 10, false);
  out.powerBillAccrued = toNum(out.powerBillAccrued, 0, 0, 1e12, false);
  out.powerBillTimer = toNum(out.powerBillTimer, 86400, 0, 86400 * 10, false);
  out.powerBillInterval = toNum(out.powerBillInterval, 86400, 60, 86400 * 10, false);
  out.coolingInfraLevel = toNum(out.coolingInfraLevel, 0, 0, 2000, true);
  out.coolingPowerKw = toNum(out.coolingPowerKw, 0, 0, 100000, false);
  const coolingModes = ['eco', 'balanced', 'turbo'];
  out.coolingMode = coolingModes.includes(String(out.coolingMode || ''))
    ? String(out.coolingMode)
    : 'balanced';
  const coolingProfiles = ['off', 'safe', 'balanced', 'aggressive'];
  out.coolingAutoProfile = coolingProfiles.includes(String(out.coolingAutoProfile || ''))
    ? String(out.coolingAutoProfile)
    : 'balanced';
  out._coolingAutoSwitchCd = toNum(out._coolingAutoSwitchCd, 0, 0, 600, false);
  const outagePlans = ['off', 'safe', 'balanced', 'greedy'];
  out.powerOutageAutoPlan = outagePlans.includes(String(out.powerOutageAutoPlan || ''))
    ? String(out.powerOutageAutoPlan)
    : 'balanced';
  const riskProfiles = ['throughput', 'balanced', 'resilience', 'emergency'];
  out.powerRiskProfile = riskProfiles.includes(String(out.powerRiskProfile || ''))
    ? String(out.powerRiskProfile)
    : 'balanced';
  const riskAutoModes = ['off', 'assist', 'full'];
  out.powerRiskAutoMode = riskAutoModes.includes(String(out.powerRiskAutoMode || ''))
    ? String(out.powerRiskAutoMode)
    : 'off';
  out.powerRiskAutoCooldown = toNum(out.powerRiskAutoCooldown, 0, 0, 600, false);
  out.powerCommandLinkEnabled = out.powerCommandLinkEnabled !== false;
  out.powerCommandCooldown = toNum(out.powerCommandCooldown, 0, 0, 600, false);
  out.powerLoadGuardEnabled = !!out.powerLoadGuardEnabled;
  out.powerLoadGuardTarget = toNum(out.powerLoadGuardTarget, 0.85, 0.55, 0.98, false);
  out._powerLoadGuardActive = !!out._powerLoadGuardActive;
  const batteryStrategies = ['balanced', 'peak_guard', 'arbitrage', 'reserve'];
  out.powerBatteryStrategy = batteryStrategies.includes(String(out.powerBatteryStrategy || ''))
    ? String(out.powerBatteryStrategy)
    : 'balanced';
  out._powerBatteryStrategySavingsUsd = toNum(out._powerBatteryStrategySavingsUsd, 0, 0, 1e12, false);
  const tariffPolicies = ['off', 'cost_focus', 'balanced', 'rush'];
  out.powerTariffPolicy = tariffPolicies.includes(String(out.powerTariffPolicy || ''))
    ? String(out.powerTariffPolicy)
    : 'off';
  out.powerTariffPolicyCooldown = toNum(out.powerTariffPolicyCooldown, 0, 0, 1800, false);
  out._powerRiskPerfMult = toNum(out._powerRiskPerfMult, 1, 0.2, 2.5, false);
  out._powerRiskPriceMult = toNum(out._powerRiskPriceMult, 1, 0.2, 2.5, false);
  out._powerRiskCrashMult = toNum(out._powerRiskCrashMult, 1, 0.2, 2.5, false);
  out._powerRiskOutageMult = toNum(out._powerRiskOutageMult, 1, 0.2, 2.5, false);
  out.powerOutageCooldown = toNum(out.powerOutageCooldown, 0, 0, 7200, false);
  out._powerOutageSpawnChancePerSec = toNum(out._powerOutageSpawnChancePerSec, 0, 0, 0.08, false);
  out.powerOutageBuffRemaining = toNum(out.powerOutageBuffRemaining, 0, 0, 7200, false);
  out._powerOutageBuffPerfMult = toNum(out._powerOutageBuffPerfMult, 1, 0.2, 2.5, false);
  out._powerOutageBuffPriceMult = toNum(out._powerOutageBuffPriceMult, 1, 0.2, 2.5, false);
  out._powerOutageBuffCapMult = toNum(out._powerOutageBuffCapMult, 1, 0.2, 2.5, false);
  out._powerOutageBuffCrashMult = toNum(out._powerOutageBuffCrashMult, 1, 0.2, 2.5, false);
  out._powerDecisionPerfMult = toNum(out._powerDecisionPerfMult, 1, 0.2, 2.5, false);
  out._powerDecisionPriceMult = toNum(out._powerDecisionPriceMult, 1, 0.2, 2.5, false);
  out._powerDecisionCapMult = toNum(out._powerDecisionCapMult, 1, 0.2, 2.5, false);
  out._powerDecisionCrashMult = toNum(out._powerDecisionCrashMult, 1, 0.2, 2.5, false);
  out.prestige = toNum(out.prestige, 0, 0, 1e9, false);
  out.prestigeCount = toNum(out.prestigeCount, 0, 0, 10000, true);
  out.chips = toNum(out.chips, 0, 0, 1e8, true);
  out.collectionSetCompletions = toNum(out.collectionSetCompletions, 0, 0, 999, true);
  out.modParts = toNum(out.modParts, 0, 0, 1e9, true);
  out.totalRigs = toNum(out.totalRigs, 0, 0, 1e7, true);
  out.layoutSwitchCount = toNum(out.layoutSwitchCount, 0, 0, 1e8, true);
  out.coolingModeChanges = toNum(out.coolingModeChanges, 0, 0, 1e8, true);
  out.outageDecisions = toNum(out.outageDecisions, 0, 0, 1e8, true);
  out.outageEventsSeen = toNum(out.outageEventsSeen, 0, 0, 1e8, true);
  out.outageAutoResolved = toNum(out.outageAutoResolved, 0, 0, 1e8, true);
  out.outageManualResolved = toNum(out.outageManualResolved, 0, 0, 1e8, true);
  out.powerRiskProfileChanges = toNum(out.powerRiskProfileChanges, 0, 0, 1e8, true);
  out.powerRiskAutoModeChanges = toNum(out.powerRiskAutoModeChanges, 0, 0, 1e8, true);
  out.powerCommandLinkChanges = toNum(out.powerCommandLinkChanges, 0, 0, 1e8, true);
  out.powerRiskAutoSwitches = toNum(out.powerRiskAutoSwitches, 0, 0, 1e8, true);
  out.powerCommandSyncs = toNum(out.powerCommandSyncs, 0, 0, 1e8, true);
  out.powerLoadGuardActions = toNum(out.powerLoadGuardActions, 0, 0, 1e8, true);
  out.powerProviderChanges = toNum(out.powerProviderChanges, 0, 0, 1e8, true);
  out.powerOutagePlanChanges = toNum(out.powerOutagePlanChanges, 0, 0, 1e8, true);
  out.coolingAutoProfileChanges = toNum(out.coolingAutoProfileChanges, 0, 0, 1e8, true);
  out.powerBatteryStrategyChanges = toNum(out.powerBatteryStrategyChanges, 0, 0, 1e8, true);
  out.powerTariffPolicyChanges = toNum(out.powerTariffPolicyChanges, 0, 0, 1e8, true);
  out.powerTariffPolicySyncs = toNum(out.powerTariffPolicySyncs, 0, 0, 1e8, true);
  out.powerAdvisorRuns = toNum(out.powerAdvisorRuns, 0, 0, 1e8, true);

  const coinKeys = Object.keys(COIN_DATA || template.coins || { BTC:1, ETH:1, LTC:1, BNB:1 });
  out.coins = ensureObject(out.coins);
  out.coinReserves = ensureObject(out.coinReserves);
  out.prices = ensureObject(out.prices);
  out.priceHistory = ensureObject(out.priceHistory);
  coinKeys.forEach((coin) => {
    const basePrice = Number((COIN_DATA && COIN_DATA[coin] && COIN_DATA[coin].basePrice) || 1);
    out.coins[coin] = toNum(out.coins[coin], 0, 0, 1e12, false);
    out.coinReserves[coin] = toNum(out.coinReserves[coin], Number((template.coinReserves || {})[coin] || 0), 0, 1e8, false);
    out.prices[coin] = toNum(out.prices[coin], basePrice, 0.000001, 1e12, false);
    const hist = Array.isArray(out.priceHistory[coin]) ? out.priceHistory[coin] : [];
    out.priceHistory[coin] = hist
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0)
      .slice(-120);
    if (!out.priceHistory[coin].length) out.priceHistory[coin] = [out.prices[coin]];
  });

  const rigKeys = (Array.isArray(RIGS) && RIGS.length)
    ? RIGS.map((r) => r.id)
    : Object.keys((template.rigs || {}));
  out.rigs = ensureObject(out.rigs);
  out.rigEnergy = ensureObject(out.rigEnergy);
  out.rigHeat = ensureObject(out.rigHeat);
  out.rigTargets = ensureObject(out.rigTargets);
  out.rigHashPools = ensureObject(out.rigHashPools);
  rigKeys.forEach((rigId) => {
    out.rigs[rigId] = toNum(out.rigs[rigId], 0, 0, 1e6, true);
    out.rigEnergy[rigId] = toNum(out.rigEnergy[rigId], 100, 0, 100, false);
    out.rigHeat[rigId] = toNum(out.rigHeat[rigId], 8, 0, 100, false);
    const selected = String(out.rigTargets[rigId] || '');
    out.rigTargets[rigId] = coinKeys.includes(selected) ? selected : (out.rigTargets[rigId] ? coinKeys[0] : '');
  });
  coinKeys.forEach((coin) => {
    out.rigHashPools[coin] = toNum(out.rigHashPools[coin], 0, 0, 1e15, false);
  });

  out.selectedCoin = coinKeys.includes(String(out.selectedCoin || '')) ? String(out.selectedCoin) : coinKeys[0];
  out.autoSell = !!out.autoSell;
  out.autoSellCoins = ensureObject(out.autoSellCoins);
  coinKeys.forEach((coin) => { out.autoSellCoins[coin] = !!out.autoSellCoins[coin]; });

  out.profileName = typeof out.profileName === 'string' ? out.profileName.slice(0, 18) : '';
  out.locationId = typeof out.locationId === 'string' ? out.locationId : String(template.locationId || 'home_pc');
  out.unlockedLocationTier = toNum(out.unlockedLocationTier, 1, 1, 99, true);
  out.locationMoveBoostUntilDay = toNum(out.locationMoveBoostUntilDay, 0, 0, 500000, true);
  out.rigBuildPresetSelected = String(out.rigBuildPresetSelected || 'starter_balanced');
  out.rigLayoutByLocation = ensureObject(out.rigLayoutByLocation);
  out.locationShopPurchases = ensureObject(out.locationShopPurchases);
  Object.keys(out.locationShopPurchases).forEach((locId) => {
    out.locationShopPurchases[locId] = asUniqueStringArray(out.locationShopPurchases[locId], 200);
  });
  const knownLocs = Array.isArray(window.LOCATIONS) ? window.LOCATIONS : [];
  knownLocs.forEach((loc) => {
    const key = String(loc.id || '');
    if (!key) return;
    const value = String(out.rigLayoutByLocation[key] || '');
    out.rigLayoutByLocation[key] = value || 'balanced_grid';
  });

  out.upgrades = asUniqueStringArray(out.upgrades, 500);
  out.research = asUniqueStringArray(out.research, 500);
  out.achievements = asUniqueStringArray(out.achievements, 2000);
  out.lastAchievementId = typeof out.lastAchievementId === 'string' ? out.lastAchievementId : '';
  out.unlockedMods = asUniqueStringArray(out.unlockedMods, 500);
  out.activeBoosts = Array.isArray(out.activeBoosts) ? out.activeBoosts.filter((b) => b && typeof b === 'object').slice(-80) : [];
  out.recentEvents = Array.isArray(out.recentEvents) ? out.recentEvents.filter((e) => e && typeof e === 'object').slice(-20) : [];
  out.dailyChallenges = Array.isArray(out.dailyChallenges) ? out.dailyChallenges.filter((c) => c && typeof c === 'object').slice(0, 40) : [];
  out.dailyBillHistory = Array.isArray(out.dailyBillHistory) ? out.dailyBillHistory.filter((b) => b && typeof b === 'object').slice(0, 40) : [];
  out.challengeProgress = ensureObject(out.challengeProgress);
  out.goalsClaimed = ensureObject(out.goalsClaimed);
  out.storyMissionsClaimed = ensureObject(out.storyMissionsClaimed);
  out.tutorialEnabled = out.tutorialEnabled !== false;
  out.npcTraders = ensureObject(out.npcTraders);
  out.npcUsedToday = ensureObject(out.npcUsedToday);
  out.modLevels = ensureObject(out.modLevels);
  Object.keys(out.modLevels).forEach((modId) => {
    out.modLevels[modId] = toNum(out.modLevels[modId], 0, 0, 50, true);
  });
  out.rigMods = ensureObject(out.rigMods);
  rigKeys.forEach((rigId) => {
    out.rigMods[rigId] = asUniqueStringArray(out.rigMods[rigId], 2).slice(0, 2);
  });

  out.staff = ensureObject(out.staff);
  const staffList = Array.isArray((typeof STAFF !== 'undefined' ? STAFF : null))
    ? STAFF
    : (Array.isArray((typeof window !== 'undefined' ? window.STAFF : null)) ? window.STAFF : []);
  const staffKeys = new Set([
    ...Object.keys(template.staff || {}),
    ...(staffList.map((s) => s.id)),
  ]);
  staffKeys.forEach((k) => {
    out.staff[k] = toNum(out.staff[k], Number((template.staff || {})[k] || 0), 0, 100000, true);
  });

  out.chipShop = ensureObject(out.chipShop);
  Object.keys(out.chipShop).forEach((chipId) => {
    out.chipShop[chipId] = toNum(out.chipShop[chipId], 0, 0, 9999, true);
  });
  out.prestigeSkills = ensureObject(out.prestigeSkills);
  Object.keys(out.prestigeSkills).forEach((skillId) => {
    out.prestigeSkills[skillId] = toNum(out.prestigeSkills[skillId], 0, 0, 99, true);
  });

  out.contracts = Array.isArray(out.contracts) ? out.contracts.filter((c) => c && typeof c === 'object').slice(0, 30) : [];
  out.contracts = out.contracts.map((c) => {
    const type = String(c.type || 'hashes');
    const diff = String(c.difficulty || 'easy');
    return {
      name: String(c.name || 'Contract').slice(0, 80),
      desc: String(c.desc || ''),
      type,
      target: toNum(c.target, 1, 1, 1e15, false),
      reward: toNum(c.reward, 1, 1, 1e15, false),
      difficulty: ['easy', 'medium', 'hard'].includes(diff) ? diff : 'easy',
      accepted: !!c.accepted,
      completed: !!c.completed,
    };
  });
  out.contractsDone = toNum(out.contractsDone, 0, 0, 1e8, true);

  out.marketRegime = ['bull', 'bear', 'range'].includes(String(out.marketRegime || ''))
    ? String(out.marketRegime)
    : 'range';
  out.marketRegimeTimer = toNum(out.marketRegimeTimer, 180, 1, 7200, false);
  out.marketRegimeDrift = toNum(out.marketRegimeDrift, 0, -0.1, 0.1, false);
  out.marketRegimeVolMult = toNum(out.marketRegimeVolMult, 1, 0.1, 5, false);
  out.marketShockTimer = toNum(out.marketShockTimer, 0, 0, 3000, false);
  out.marketShockDir = toNum(out.marketShockDir, 0, -1, 1, true);
  out.marketShockAmp = toNum(out.marketShockAmp, 0, 0, 1, false);
  out.marketFloorDrift = ensureObject(out.marketFloorDrift);
  out.marketMomentum = ensureObject(out.marketMomentum);
  out.marketEventDrift = ensureObject(out.marketEventDrift);
  out.marketEventDriftTimer = ensureObject(out.marketEventDriftTimer);
  out._newsTickerTimer = toNum(out._newsTickerTimer, 90, 10, 600, false);
  out.walletYieldEnabled = out.walletYieldEnabled !== false;
  out.walletYieldAccruedUsd = toNum(out.walletYieldAccruedUsd, 0, 0, 1e15, false);
  out.walletYieldLastDay = toNum(out.walletYieldLastDay, 0, 0, 1e9, true);
  coinKeys.forEach((coin) => {
    out.marketFloorDrift[coin] = toNum(out.marketFloorDrift[coin], 0, -0.06, 0.06, false);
    out.marketMomentum[coin] = toNum(out.marketMomentum[coin], 0, -0.5, 0.5, false);
    out.marketEventDrift[coin] = toNum(out.marketEventDrift[coin], 0, -0.5, 0.5, false);
    out.marketEventDriftTimer[coin] = toNum(out.marketEventDriftTimer[coin], 0, 0, 3600, false);
  });

  const tierKeys = (Array.isArray(window.RIG_STAFF_TIERS) ? window.RIG_STAFF_TIERS.map((t) => t.id) : []);
  const focusKeys = Object.keys(window.HV_RIG_CREW_FOCUS || { balanced: 1 });
  const specKeys = Object.keys(window.HV_RIG_CREW_SPECS || { balanced: 1 });
  out.hiredRigStaff = ensureObject(out.hiredRigStaff);
  out.rigCrewProgress = ensureObject(out.rigCrewProgress);
  out.rigCrewFocus = ensureObject(out.rigCrewFocus);
  out.rigAutoRepair = ensureObject(out.rigAutoRepair);
  out.rigStaffAssignments = ensureObject(out.rigStaffAssignments);
  tierKeys.forEach((tierId) => {
    out.hiredRigStaff[tierId] = toNum(out.hiredRigStaff[tierId], 0, 0, 100000, true);
    const p = ensureObject(out.rigCrewProgress[tierId]);
    p.level = toNum(p.level, 1, 1, 1000, true);
    p.xp = toNum(p.xp, 0, 0, 1e9, false);
    p.spec = specKeys.includes(String(p.spec || '')) ? String(p.spec) : 'balanced';
    out.rigCrewProgress[tierId] = p;
  });
  rigKeys.forEach((rigId) => {
    out.rigCrewFocus[rigId] = focusKeys.includes(String(out.rigCrewFocus[rigId] || ''))
      ? String(out.rigCrewFocus[rigId])
      : 'balanced';
    out.rigAutoRepair[rigId] = !!out.rigAutoRepair[rigId];
    const assign = ensureObject(out.rigStaffAssignments[rigId]);
    const safeAssign = {};
    tierKeys.forEach((tierId) => {
      safeAssign[tierId] = toNum(assign[tierId], 0, 0, 100000, true);
    });
    out.rigStaffAssignments[rigId] = safeAssign;
  });

  out.loans = Array.isArray(out.loans) ? out.loans.filter((l) => l && typeof l === 'object').slice(0, 40) : [];
  out.loans = out.loans.map((loan, idx) => ({
    id: toNum(loan.id, idx + 1, 1, 1e9, true),
    planId: String(loan.planId || ''),
    label: String(loan.label || ('Loan #' + (idx + 1))).slice(0, 60),
    principal: toNum(loan.principal, 0, 0, 1e12, false),
    outstanding: toNum(loan.outstanding, 0, 0, 1e12, false),
    ratePerDay: toNum(loan.ratePerDay, 0.015, 0, 1, false),
    dueDay: toNum(loan.dueDay, out.worldDay + 7, 1, 500000, true),
  }));
  out.nextLoanId = toNum(out.nextLoanId, 1, 1, 1e9, true);
  out.insuranceActive = !!out.insuranceActive;
  out.insuranceTier = toNum(out.insuranceTier, 0, 0, 20, true);
  out.leasedRigs = ensureObject(out.leasedRigs);
  rigKeys.forEach((rigId) => {
    out.leasedRigs[rigId] = toNum(out.leasedRigs[rigId], 0, 0, 1e6, true);
  });

  if (out.powerOutage && typeof out.powerOutage === 'object') {
    const po = out.powerOutage;
    out.powerOutage = {
      id: String(po.id || ''),
      title: String(po.title || 'Netzentscheidung'),
      desc: String(po.desc || ''),
      remaining: toNum(po.remaining, 0, 0, 1800, false),
      resolved: !!po.resolved,
      createdAt: toNum(po.createdAt, Date.now(), 0, 9999999999999, false),
      autoResolved: !!po.autoResolved,
      choiceId: String(po.choiceId || ''),
      choiceLabel: String(po.choiceLabel || ''),
      choiceText: String(po.choiceText || ''),
      penalties: ensureObject(po.penalties),
      options: Array.isArray(po.options) ? po.options.slice(0, 4).map((opt) => ({
        id: String((opt && opt.id) || ''),
        label: String((opt && opt.label) || ''),
        desc: String((opt && opt.desc) || ''),
        costUsd: toNum(opt && opt.costUsd, 0, 0, 1e12, false),
        costBtc: toNum(opt && opt.costBtc, 0, 0, 1e8, false),
        effect: ensureObject(opt && opt.effect),
        duration: toNum(opt && opt.duration, 0, 0, 3600, false),
      })) : [],
    };
    out.powerOutage.penalties.perfMult = toNum(out.powerOutage.penalties.perfMult, 1, 0.2, 2.5, false);
    out.powerOutage.penalties.priceMult = toNum(out.powerOutage.penalties.priceMult, 1, 0.2, 2.5, false);
    out.powerOutage.penalties.capMult = toNum(out.powerOutage.penalties.capMult, 1, 0.2, 2.5, false);
    out.powerOutage.penalties.crashMult = toNum(out.powerOutage.penalties.crashMult, 1, 0.2, 3, false);
  } else {
    out.powerOutage = null;
  }

  out.__integrityCheckedAt = Date.now();
  let repaired = issues.length > 0;
  try {
    repaired = repaired || (JSON.stringify(src) !== JSON.stringify(out));
  } catch {}
  return { save: out, repaired, issues };
}
window.sanitizeLoadedSavePayload = sanitizeLoadedSavePayload;

function getSlotsMetaForSave() {
  try {
    const raw = localStorage.getItem(SLOT_META_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const slots = Array.isArray(parsed) ? parsed.slice(0, SLOT_META_COUNT) : [];
    while (slots.length < SLOT_META_COUNT) slots.push(null);
    return slots.map((entry) => (entry && typeof entry === 'object' ? entry : null));
  } catch {
    return Array(SLOT_META_COUNT).fill(null);
  }
}

function setSlotsMetaForSave(slots) {
  localStorage.setItem(SLOT_META_KEY, JSON.stringify(slots));
}

function clampProgress(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function computeProgressFromSave(save) {
  const rigs = Number(save.totalRigs || 0);
  const upgrades = Array.isArray(save.upgrades) ? save.upgrades.length : 0;
  const research = Array.isArray(save.research) ? save.research.length : 0;
  const achievements = Array.isArray(save.achievements) ? save.achievements.length : 0;
  const contractsDone = Number(save.contractsDone || 0);
  const totalEarned = Number(save.totalEarned || 0);

  const progress =
    Math.min(40, rigs / 3) +
    Math.min(18, upgrades * 0.6) +
    Math.min(14, research * 0.8) +
    Math.min(14, achievements * 0.5) +
    Math.min(8, contractsDone * 0.4) +
    Math.min(6, Math.log10(Math.max(1, totalEarned + 1)) * 1.5);

  return clampProgress(progress);
}

function syncSlotMetaFromSave(save) {
  const slotIdx = getActiveSlotIndex();
  if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= SLOT_META_COUNT) return;

  const slots = getSlotsMetaForSave();
  const prev = slots[slotIdx] || {};
  const slotNo = slotIdx + 1;
  const now = Date.now();
  const rawName = typeof save.profileName === 'string' ? save.profileName.trim() : '';
  const fallback = typeof prev.nickname === 'string' && prev.nickname.trim()
    ? prev.nickname.trim()
    : ('Spielstand ' + slotNo);
  const nickname = (rawName || fallback).slice(0, 18);
  const lastSave = Number(save.lastSave || now);

  slots[slotIdx] = {
    nickname,
    createdAt: Number(prev.createdAt || lastSave || now),
    updatedAt: now,
    lastPlayed: now,
    note: prev.note || 'Automatisch aktualisiert',
    progress: computeProgressFromSave(save),
    usd: Number(save.usd || 0),
    totalEarned: Number(save.totalEarned || 0),
    playTime: Number(save.playTime || 0),
    lastSave,
  };

  setSlotsMetaForSave(slots);
}

function saveGame() {
  const save = { lastSave: Date.now() };
  SAVE_FIELDS.forEach(k => { save[k] = G[k]; });
  try {
    localStorage.setItem(getCurrentSaveKey(), JSON.stringify(save));
    G.lastSave = save.lastSave;
    syncSlotMetaFromSave(save);
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  // Versuche v4 zuerst, dann v3 (Migration)
  const activeSlot = getActiveSlotIndex();
  let raw = localStorage.getItem(getCurrentSaveKey());

  // Slot 1 migriert alte Single-Saves automatisch.
  if (!raw && activeSlot === 0) {
    raw = localStorage.getItem(SAVE_KEY_BASE);
    if (!raw) raw = localStorage.getItem('hashvault_v4');
    if (!raw) raw = localStorage.getItem('hashvault_v3');
  }
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const normalized = (typeof sanitizeLoadedSavePayload === 'function')
      ? sanitizeLoadedSavePayload(parsed)
      : { save: parsed, repaired: false, issues: [] };
    const save = normalized && normalized.save ? normalized.save : parsed;

    if (normalized && normalized.repaired) {
      try {
        localStorage.setItem(getCurrentSaveKey(), JSON.stringify(save));
      } catch {}
      if (typeof notify === 'function') {
        notify('🛡️ Save wurde automatisch bereinigt und stabil geladen.', 'warning');
      }
    }

    // Felder in G übertragen
    SAVE_FIELDS.forEach(k => {
      if (save[k] !== undefined) G[k] = save[k];
    });

    // Offline-Einnahmen berechnen
    const offlineMs  = Date.now() - (save.lastSave || Date.now());
    const offlineSec = Math.min(offlineMs / 1000, 3600 * 12); // max 12h

    if (offlineSec > 60) {
      computeMultipliers();
      const offHashes = getTotalHps() * offlineSec * 0.5; // 50% Effizienz
      G.hashes      += offHashes;
      G.totalHashes += offHashes;

      // Coins bei Auto-Sell
      const selected = G.selectedCoin || 'BTC';
      const convRate   = (typeof getConvRateForCoin === 'function')
        ? getConvRateForCoin(selected)
        : (HASH_PER_COIN / Math.max(0.1, Number(G._convMult || 1)));
      const extraCoins = Math.floor(offHashes / convRate);
      const coinAuto = !!(G.autoSellCoins && G.autoSellCoins[selected]);
      if (extraCoins > 0 && (G.autoSell || coinAuto)) {
        const earned  = extraCoins * G.prices[G.selectedCoin || 'BTC'] * 0.5;
        G.usd         += earned;
        G.totalEarned += earned;
      }

      // UI-Info
      const el = document.getElementById('offline-info');
      if (el) el.textContent = 'Offline ' + fmtTime(offlineSec) + ' → +' + fmtNum(offHashes) + ' H';

      if (offlineSec > 300) {
        setTimeout(() => notify('⏰ Offline: +' + fmtNum(offHashes) + ' Hashes!', 'gold'), 1000);
      }
    }
    syncSlotMetaFromSave({
      lastSave: save.lastSave || Date.now(),
      profileName: G.profileName,
      usd: G.usd,
      totalEarned: G.totalEarned,
      playTime: G.playTime,
      totalRigs: G.totalRigs,
      upgrades: G.upgrades,
      research: G.research,
      achievements: G.achievements,
      contractsDone: G.contractsDone,
    });
  } catch (e) {
    const backupKey = backupCorruptSave(raw, 'parse-or-load-error');
    console.error('Load error:', e);
    if (typeof notify === 'function') {
      notify('❌ Save defekt. Backup gespeichert' + (backupKey ? (' (' + backupKey + ')') : '') + '.', 'error');
    }
  }
}

function resetGame() {
  showModal(
    '⚠️ Spiel zurücksetzen',
    'ACHTUNG: Alle Fortschritte werden PERMANENT gelöscht!\nDieser Vorgang kann nicht rückgängig gemacht werden.',
    () => {
      const activeSlot = getActiveSlotIndex();
      localStorage.removeItem(getCurrentSaveKey());
      if (activeSlot === 0) {
        localStorage.removeItem(SAVE_KEY_BASE);
        localStorage.removeItem('hashvault_v4');
        localStorage.removeItem('hashvault_v3');
      }
      location.reload();
    }
  );
}
