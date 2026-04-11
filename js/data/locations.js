// ============================================================
// DATA — Standorte (Kapazitaet, Miete, Umzugskosten, Boni)
// ============================================================

window.LOCATIONS = [
  {
    id: 'home_pc',
    tier: 1,
    name: 'PC-Zimmer Zuhause',
    maxRigs: 6,
    rentPerDay: 0,
    moveCost: 0,
    bonusText: '+5% Klick-Leistung',
    bonus: { clickMult: 1.05 },
    unlock: {},
  },
  {
    id: 'cellar_lab',
    tier: 2,
    name: 'Keller-Werkstatt',
    maxRigs: 15,
    rentPerDay: 120,
    moveCost: 500,
    bonusText: '-8% Haltbarkeitsverlust',
    bonus: { energyDrainMult: 0.92 },
    unlock: { totalEarned: 500, totalRigs: 4 },
  },
  {
    id: 'garage_unit',
    tier: 3,
    name: 'Garage-Unit',
    maxRigs: 35,
    rentPerDay: 320,
    moveCost: 1500,
    bonusText: '+10% Akku-Laderate',
    bonus: { batteryChargeMult: 1.10 },
    unlock: { totalEarned: 5000, totalRigs: 15, powerInfraLevel: 1 },
  },
  {
    id: 'small_hall',
    tier: 4,
    name: 'Kleine Halle',
    maxRigs: 70,
    rentPerDay: 900,
    moveCost: 4600,
    bonusText: '+14% Netzkapazitaet',
    bonus: { powerCapMult: 1.14 },
    unlock: { totalEarned: 30000, totalRigs: 35, powerInfraLevel: 2 },
  },
  {
    id: 'mid_hall',
    tier: 5,
    name: 'Mittlere Halle',
    maxRigs: 140,
    rentPerDay: 2100,
    moveCost: 11200,
    bonusText: '-16% Strom-Event-Strafen',
    bonus: { eventPenaltyMult: 0.84 },
    unlock: { totalEarned: 95000, totalRigs: 60, powerInfraLevel: 3, researchCount: 3 },
  },
  {
    id: 'industry_hall',
    tier: 6,
    name: 'Industriehalle',
    maxRigs: 260,
    rentPerDay: 5200,
    moveCost: 25000,
    bonusText: '+18% Wartungseffizienz',
    bonus: { maintenanceMult: 1.18 },
    unlock: { totalEarned: 360000, totalRigs: 115, powerInfraLevel: 4, researchCount: 5 },
  },
  {
    id: 'dc_suite',
    tier: 7,
    name: 'Datacenter Suite',
    maxRigs: 450,
    rentPerDay: 11800,
    moveCost: 56000,
    bonusText: '-18% Crash-Risiko',
    bonus: { crashRiskMult: 0.82 },
    unlock: { totalEarned: 1250000, totalRigs: 190, powerInfraLevel: 5, researchCount: 8 },
  },
  {
    id: 'dc_campus',
    tier: 8,
    name: 'Datacenter Campus',
    maxRigs: 750,
    rentPerDay: 23800,
    moveCost: 102000,
    bonusText: '-21% Stromverbrauch',
    bonus: { powerUsageMult: 0.79 },
    unlock: { totalEarned: 5000000, totalRigs: 340, powerInfraLevel: 6, researchCount: 11 },
  },
  {
    id: 'mega_farm',
    tier: 9,
    name: 'Mega-Farm Campus',
    maxRigs: 1200,
    rentPerDay: 56000,
    moveCost: 250000,
    bonusText: '+20% Gesamt-Wartung',
    bonus: { maintenanceMult: 1.20 },
    unlock: { totalEarned: 20000000, totalRigs: 650, powerInfraLevel: 9, researchCount: 15 },
  },
];

function getLocationById(locationId) {
  return (window.LOCATIONS || []).find((x) => x.id === locationId) || window.LOCATIONS[0];
}

function getCurrentLocation() {
  const state = (typeof G === 'object' && G) ? G : {};
  const currentId = state.locationId || 'home_pc';
  return getLocationById(currentId);
}

function getLocationUnlockProgress(locationId, stateArg) {
  const loc = getLocationById(locationId);
  const state = stateArg && typeof stateArg === 'object'
    ? stateArg
    : ((typeof G === 'object' && G) ? G : {});
  const unlock = loc && loc.unlock ? loc.unlock : {};
  const reqs = [];

  const pushReq = (label, current, target) => {
    const cur = Math.max(0, Number(current || 0));
    const tgt = Math.max(0, Number(target || 0));
    reqs.push({
      label,
      current: cur,
      target: tgt,
      done: cur >= tgt,
      displayCurrent: Math.floor(cur),
      displayTarget: Math.floor(tgt),
    });
  };

  if (Number(unlock.totalEarned || 0) > 0) {
    pushReq('Umsatz gesamt', Number(state.totalEarned || 0), Number(unlock.totalEarned || 0));
  }
  if (Number(unlock.totalRigs || 0) > 0) {
    const totalRigs = Number(state.totalRigs || Object.values(state.rigs || {}).reduce((sum, n) => sum + Number(n || 0), 0));
    pushReq('Rigs gesamt', totalRigs, Number(unlock.totalRigs || 0));
  }
  if (Number(unlock.powerInfraLevel || 0) > 0) {
    pushReq('Infra-Level', Number(state.powerInfraLevel || 0), Number(unlock.powerInfraLevel || 0));
  }
  if (Number(unlock.researchCount || 0) > 0) {
    const rc = Array.isArray(state.research) ? state.research.length : 0;
    pushReq('Forschung', rc, Number(unlock.researchCount || 0));
  }
  if (Number(unlock.prestigeCount || 0) > 0) {
    pushReq('Prestige', Number(state.prestigeCount || 0), Number(unlock.prestigeCount || 0));
  }

  return {
    locationId: loc.id,
    requirements: reqs,
    unlocked: reqs.every((r) => r.done),
  };
}

window.getLocationById = getLocationById;
window.getCurrentLocation = getCurrentLocation;
window.getLocationUnlockProgress = getLocationUnlockProgress;
