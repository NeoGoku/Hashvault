// ============================================================
// CORE — Globaler Spielstand
// DEFAULT_STATE: Vorlage für neue / nach Prestige reset
// G: lebender Spielstand — wird von allen Systemen genutzt
// ============================================================

const DEFAULT_STATE = {
  // Ressourcen
  usd:          0,
  hashes:       0,        // nur Klick-Hashes → selectedCoin
  totalHashes:  0,
  totalEarned:  0,
  totalClicks:  0,
  coins:        { BTC:0, ETH:0, LTC:0, BNB:0 },
  coinReserves: { BTC:0.2, ETH:1.2, LTC:1.8, BNB:2.4 },

  // Markt
  prices:       { BTC:80, ETH:35, LTC:15, BNB:25 },
  priceHistory: { BTC:[], ETH:[], LTC:[], BNB:[] },

  // Besitz
  rigs:     { usb:0, rpi:0, gpu1:0, asic1:0, gpu4:0, asic8:0, srv:0, qc:0, aic:0, fnx:0, orb:0, dyx:0 },
  upgrades: [],
  research: [],
  staff:    { dev:0, trader:0, sec:0, maint:0, quant:0, pm:0, dataeng:0, opsdir:0, cfo:0 },

  // ── Per-Rig Coin-Zuweisung ────────────────────────────────
  rigTargets:   {},  // { rigId: 'BTC'|'ETH'|'LTC'|'BNB' }
  rigHashPools: { BTC:0, ETH:0, LTC:0, BNB:0 }, // Hash-Puffer pro Coin
  rigLayoutByLocation: {}, // { locationId: layoutId }
  rigHeat: {},             // { rigId: 0-100 } Thermal Last pro Rig-Typ
  rigBuildPresetSelected: 'starter_balanced',

  // Progression
  achievements:    [],
  chipShop:        {},
  contracts:       [],
  contractsDone:   0,
  contractRefresh: 1800,

  // Prestige
  prestige:        0,
  prestigeCount:   0,
  chips:           0,
  prestigeSkills:  {},
  collectionSetCompletions: 0,

  // UI-Status
  profileName:     '',
  selectedCoin:    'BTC',
  autoSell:        false,
  autoSellCoins:   { BTC:false, ETH:false, LTC:false, BNB:false },
  uiRigSort:       'tier',
  uiRigOwnedOnly:  false,
  debugOverlay:    false,
  debugCheatUsd:   1000000,
  locationId:      'home_pc',
  locationShopPurchases: {},
  unlockedLocationTier: 1,
  locationMoveBoostUntilDay: 0,

  // Zeit & Streak
  dailyStreak:     0,
  lastDaily:       0,
  lastSave:        0,
  playTime:        0,

  // Statistiken
  maxCombo:        0,
  totalRigs:       0,
  totalCoinsMined: 0,  // Gesamt-Coins für Achievements
  layoutSwitchCount: 0,
  coolingModeChanges: 0,
  outageDecisions: 0,
  outageEventsSeen: 0,
  outageAutoResolved: 0,
  outageManualResolved: 0,
  powerRiskProfileChanges: 0,
  powerRiskAutoModeChanges: 0,
  powerCommandLinkChanges: 0,
  powerRiskAutoSwitches: 0,
  powerCommandSyncs: 0,
  powerLoadGuardActions: 0,
  powerProviderChanges: 0,
  powerOutagePlanChanges: 0,
  coolingAutoProfileChanges: 0,
  powerBatteryStrategyChanges: 0,
  powerTariffPolicyChanges: 0,
  powerTariffPolicySyncs: 0,
  powerAdvisorRuns: 0,

  // Research — Slot 1
  activeResearch:   null,
  researchProgress: 0,

  // Research — Slot 2 (freigeschaltet durch cu5 im Chip-Shop)
  activeResearch2:   null,
  researchProgress2: 0,

  // Combo-Tracking
  comboCount:      0,
  lastClickTime:   0,

  // Zeitlich begrenzte Verbrauchsmittel-Boosts
  activeBoosts: [], // [{effect, mult?, endsAt}]

  // ── Event-System ─────────────────────────────────────────
  recentEvents:  [],   // [{msg, time}] letzte 8 Meldungen
  activeEvent:   null, // {msg, fx, endsAt} aktuelles Ereignis
  _eventTimer:   0,
  _nextEventIn:  200,  // Sekunden bis nächstes Event (zufällig 180-360)
  _newsTickerTimer: 95,

  // Auto-Klicker-Akkumulator (intern, wird nicht gespeichert)
  _autoClickAccum: 0,
  _holdMiningActive: false,
  _holdMiningElapsed: 0,
  _holdMiningCooldown: 0,
  _holdMiningAccum: 0,
  _holdMiningSuppressTapUntil: 0,
  _holdMiningPointerId: null,

  // Berechnete Multiplikatoren (gesetzt von computeMultipliers())
  _hpsMult:          1,
  _clickBonus:       0,
  _clickMult:        1,
  _priceMult:        1,
  _passive:          0,
  _rigCostMult:      1,
  _convMult:         1,
  _comboBonus:       0,
  _contractBonus:    0,
  _legacyMult:       1,
  _researchSpeedMult:1,
  _difficulty:       1,   // 1.0 + prestigeCount * 0.15 (Mining-Schwierigkeit)
  _lastAchCount:     0,
  lastAchievementId: '',

  // ── Daily Challenges ──────────────────────────────────────────
  dailyChallenges:   [],  // [{id, progress, completed}] - 3 pro Tag
  challengeProgress: {},  // {challengeId: currentValue}
  goalsClaimed:      {},  // {goalId: true}
  storyMissionIndex: 0,
  storyMissionsClaimed: {},
  tutorialStep: 0,
  tutorialEnabled: true,
  tutorialCompleted: false,

  // ── NPC Traders ───────────────────────────────────────────────
  npcTraders: {},         // {npcId: deal} - tägliche Deals
  npcUsedToday: {},       // {npcId: true/false} - ob schon gekauft

  // ── Energy System ─────────────────────────────────────────────
  rigEnergy: {},          // {rigId: 0-100} - Batterie/Stromzustand
  _energyDrainPerTick: 0.8, // % pro Tick wenn aktiv

  // ── Power Grid (V1 + V2) ──────────────────────────────────────
  powerInfraLevel: 0,
  powerCapacityKw: 3.0,
  powerUsageKw: 0,
  powerPriceBase: 0.20,
  powerPriceCurrent: 0.20,
  powerTariffLabel: 'Tag',
  powerBillAccrued: 0,
  powerBillTimer: 86400,
  powerBillInterval: 86400,
  powerDebt: 0,
  powerEventLabel: '',
  powerEventRemaining: 0,
  _powerEventPriceMult: 1,
  _powerEventCapMult: 1,
  _powerEventCrashMult: 1,
  _powerEventSpawnTimer: 120,
  _powerPerfMult: 1,
  _powerOverloadMult: 1,
  _powerCrashMult: 1,
  _powerWasOverloaded: false,
  _powerEffectiveCapKw: 3.0,
  _powerLoadRatio: 0,
  powerProviderId: 'spot',
  powerProviderLockedUntilDay: 1,
  powerPeakPenaltyAccrued: 0,
  powerBatteryTier: 0,
  powerBatteryCapacityKwh: 0,
  powerBatteryLevelKwh: 0,
  powerBatteryChargeRateKw: 1.2,
  powerBatteryDischargeRateKw: 1.5,
  powerBatteryCycleLoss: 0.03,
  powerBatteryMode: 'idle',
  powerBatteryGridOffsetKw: 0,
  powerBatteryStrategy: 'balanced',
  _powerBatteryStrategySavingsUsd: 0,
  powerTariffPolicy: 'off',
  powerTariffPolicyCooldown: 0,
  coolingInfraLevel: 0,
  coolingMode: 'balanced',
  coolingAutoProfile: 'balanced',
  _coolingAutoSwitchCd: 0,
  coolingPowerKw: 0,
  powerRiskProfile: 'balanced',
  powerRiskAutoMode: 'off',
  powerRiskAutoCooldown: 0,
  powerCommandLinkEnabled: true,
  powerCommandCooldown: 0,
  powerLoadGuardEnabled: false,
  powerLoadGuardTarget: 0.85,
  _powerLoadGuardActive: false,
  _powerRiskPerfMult: 1,
  _powerRiskPriceMult: 1,
  _powerRiskCrashMult: 1,
  _powerRiskOutageMult: 1,
  powerOutage: null,
  powerOutageAutoPlan: 'balanced',
  powerOutageCooldown: 0,
  _powerOutageSpawnChancePerSec: 0,
  powerOutageBuffRemaining: 0,
  _powerOutageBuffPerfMult: 1,
  _powerOutageBuffPriceMult: 1,
  _powerOutageBuffCapMult: 1,
  _powerOutageBuffCrashMult: 1,
  _powerDecisionPerfMult: 1,
  _powerDecisionPriceMult: 1,
  _powerDecisionCapMult: 1,
  _powerDecisionCrashMult: 1,
  dailyBillHistory: [],
  dailyLastBilledDay: 0,
  dailyOpsDebt: 0,
  lastDailyBill: null,
  opsDebtStage: 0,          // 0=ok,1=mahnung,2=sanktion,3=notbetrieb,4=abschaltung
  opsDebtStageLabel: 'Stabil',
  opsDebtStrikeDays: 0,     // Tage in Stufe 4 am Stueck
  _opsShutdown: false,
  _opsPassiveIncomeMult: 1,
  loans: [],
  nextLoanId: 1,
  insuranceActive: false,
  insuranceTier: 0,
  leasedRigs: {},
  lastFinanceBill: null,

  // ── Ingame-Zeit (V2) ─────────────────────────────────────────
  worldDay: 1,
  worldTimeMinutes: 8 * 60, // 08:00 Start
  _timeScaleMinPerSec: 1,   // 1 Real-Sekunde = 1 Ingame-Minute
  marketRegime: 'range',
  marketRegimeTimer: 180,
  marketRegimeDrift: 0,
  marketRegimeVolMult: 1,
  marketShockTimer: 0,
  marketShockDir: 0,
  marketShockAmp: 0,
  marketFloorDrift: {},      // {coin: floor drift offset}
  marketMomentum: {},        // {coin: momentum return/sec}
  marketEventDrift: {},      // {coin: event drift return/sec}
  marketEventDriftTimer: {}, // {coin: remaining sec}
  walletYieldEnabled: true,
  walletYieldAccruedUsd: 0,
  walletYieldLastDay: 0,
  _prestigePowerCapMult: 1,
  _prestigeAutomationMult: 1,
  _prestigeOutagePrepMult: 1,
  _opsCostMult: 1,
  _opsBnbDiscount: 0,
  _buildCostMult: 1,
  _researchCostMult: 1,
  _marketFloorMult: 0.45,
  _collectionPowerUsageMult: 1,
  _collectionCoolingMult: 1,
  _collectionPowerCapMult: 1,
  _collectionHpsMult: 1,
  _collectionClickMult: 1,
  _collectionResearchSpeedMult: 1,
  _collectionContractBonus: 0,

  // ── Mining Streaks ────────────────────────────────────────────
  miningStreaks: {},      // {coin: hoursConsecutive}
  lastMineCheck: 0,       // Timestamp für Streak-Tracking
  
  // ── Rig Mods/Upgrades ─────────────────────────────────────────
  rigMods: {},            // {rigId: [modId1, modId2]} - bis zu 2 Mods pro Rig
  unlockedMods: [],       // [modId] - freigeschaltete Mods
  modLevels: {},          // {modId: level}
  modParts: 0,
  _modPartTimer: 0,
  hiredRigStaff: {},      // {tierId: count}
  rigStaffAssignments: {}, // {rigId: {tierId: count}}
  rigCrewProgress: {},    // {tierId: {level,xp,spec}}
  rigCrewFocus: {},       // {rigId: 'balanced'|'throughput'|'maintenance'|'safety'|'frugal'}
  rigAutoRepair: {},      // {rigId:true/false}
  _rigStaffCoverage: 1,

  // ── Rig Explosionen ───────────────────────────────────────────
  rigExplosions: {},      // {rigId: true/false} - ob explodiertlast Prestige
  _crashRiskBase: 0.02,   // 2% base risk pro Tick bei hoher Auslastung

  // ── Standort-Effekte ──────────────────────────────────────────
  _locClickMult: 1,
  _locEnergyDrainMult: 1,
  _locBatteryChargeMult: 1,
  _locPowerCapMult: 1,
  _locEventPenaltyMult: 1,
  _locMaintenanceMult: 1,
  _locCrashRiskMult: 1,
  _locPowerUsageMult: 1,
  _layoutHpsMult: 1,
  _layoutPowerUsageMult: 1,
  _layoutHeatMult: 1,
  _layoutCrashMult: 1,
  _activeRigLayoutId: 'balanced_grid',
  _activeRigLayoutName: 'Balanced Grid',
  _coolingHpsMult: 1,
  _shopHpsMult: 1,
  _shopStaffEffMult: 1,
  _shopStaffWageMult: 1,
  _shopCrewXpMult: 1,
  _shopCrashRiskMult: 1,
  _shopPowerUsageMult: 1,
  _prestigeCrewEffMult: 1,
  _prestigeCrewWageMult: 1,
  _prestigeShopCostMult: 1,
};

// Lebender Spielstand — tief kopiert damit DEFAULT_STATE unverändert bleibt
let G = JSON.parse(JSON.stringify(DEFAULT_STATE));
G.lastSave = Date.now();
