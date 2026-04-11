// Rig Modification Slots
// Jeder Rig kann bis zu 2 Mods haben
window.RIG_MODS = {
  // Hash-Booster
  mod_turbo_fan: {
    id: 'mod_turbo_fan',
    name: 'Turbo-Fan',
    description: '+15% Hash/s',
    bonus: { hashPerSec: 1.15 },
    cost: 5000,
    category: 'performance'
  },
  mod_liquid_cool: {
    id: 'mod_liquid_cool',
    name: 'Flüssigkühlung',
    description: '+20% Hash, −30% Energy-Drain',
    bonus: { hashPerSec: 1.20, energyDrain: 0.7 },
    cost: 8000,
    category: 'cooling'
  },
  mod_power_saver: {
    id: 'mod_power_saver',
    name: 'Power Saver',
    description: '−40% Energy-Drain',
    bonus: { energyDrain: 0.6 },
    cost: 4000,
    category: 'efficiency'
  },
  mod_hash_boost: {
    id: 'mod_hash_boost',
    name: 'Hash-Booster-Chip',
    description: '+25% Hash/s, aber +10% Energy-Drain',
    bonus: { hashPerSec: 1.25, energyDrain: 1.1 },
    cost: 10000,
    category: 'performance'
  },
  mod_stability: {
    id: 'mod_stability',
    name: 'Stabilitäts-Controller',
    description: 'Crash-Risiko −50%',
    bonus: { crashResistance: 0.5 },
    cost: 6000,
    category: 'reliability'
  },
  mod_multi_task: {
    id: 'mod_multi_task',
    name: 'Multi-Task-Kernel',
    description: 'Mine 2 Coins gleichzeitig',
    bonus: { dualCoin: true },
    cost: 12000,
    category: 'advanced'
  }
};

window.RIG_MOD_UNLOCKS = {
  mod_power_saver: {
    id: 'mod_power_saver',
    requirements: [
      { metric: 'totalRigs', target: 3, label: '3 Rigs besitzen' },
      { metric: 'worldDay', target: 1, label: 'Tag 1 erreichen' },
    ],
  },
  mod_turbo_fan: {
    id: 'mod_turbo_fan',
    requirements: [
      { metric: 'totalRigs', target: 6, label: '6 Rigs besitzen' },
      { metric: 'totalHashes', target: 15000, label: '15.000 Hashes minen' },
    ],
  },
  mod_stability: {
    id: 'mod_stability',
    requirements: [
      { metric: 'powerInfraLevel', target: 1, label: 'Power-Infra Level 1' },
      { metric: 'totalRigs', target: 8, label: '8 Rigs besitzen' },
    ],
  },
  mod_liquid_cool: {
    id: 'mod_liquid_cool',
    requirements: [
      { metric: 'powerInfraLevel', target: 2, label: 'Power-Infra Level 2' },
      { metric: 'totalEarned', target: 35000, label: '$35.000 Gesamtverdienst' },
    ],
  },
  mod_hash_boost: {
    id: 'mod_hash_boost',
    requirements: [
      { metric: 'researchCount', target: 3, label: '3 Researches abschliessen' },
      { metric: 'totalEarned', target: 85000, label: '$85.000 Gesamtverdienst' },
    ],
  },
  mod_multi_task: {
    id: 'mod_multi_task',
    requirements: [
      { metric: 'powerInfraLevel', target: 3, label: 'Power-Infra Level 3' },
      { metric: 'researchCount', target: 6, label: '6 Researches abschliessen' },
      { metric: 'totalRigs', target: 32, label: '32 Rigs besitzen' },
    ],
  },
};

// Default Mod ist immer "unmodded"
const NO_MOD = { id: null, name: 'Keine Modifikation' };

// Berechne Bonuses für einen Rig mit Mods
function calculateRigModBonuses(mods) {
  const bonuses = {
    hashPerSec: 1.0,
    energyDrain: 1.0,
    crashResistance: 0.0,
    dualCoin: false
  };

  if (!mods || mods.length === 0) return bonuses;

  mods.forEach(modId => {
    const mod = RIG_MODS[modId];
    if (!mod) return;
    const level = Math.max(0, Number((typeof G === 'object' && G && G.modLevels && G.modLevels[modId]) || 0));
    const lvlScale = 1 + level * 0.20;
    
    if (mod.bonus.hashPerSec) {
      const baseInc = Number(mod.bonus.hashPerSec) - 1;
      bonuses.hashPerSec *= 1 + baseInc * lvlScale;
    }
    if (mod.bonus.energyDrain) {
      const base = Number(mod.bonus.energyDrain);
      if (base < 1) {
        const reduction = (1 - base) * (1 + level * 0.15);
        bonuses.energyDrain *= Math.max(0.35, 1 - reduction);
      } else {
        const penalty = (base - 1) * Math.max(0.25, 1 - level * 0.18);
        bonuses.energyDrain *= 1 + penalty;
      }
    }
    if (mod.bonus.crashResistance) bonuses.crashResistance += mod.bonus.crashResistance * lvlScale;
    if (mod.bonus.dualCoin) bonuses.dualCoin = true;
  });

  bonuses.crashResistance = Math.min(0.95, bonuses.crashResistance);
  return bonuses;
}

function getRigModMetricValue(metric) {
  const safeState = (typeof G === 'object' && G) ? G : {};
  switch (metric) {
    case 'totalRigs': {
      const tracked = Number(safeState.totalRigs || 0);
      const counted = Object.values(safeState.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
      return Math.max(tracked, counted);
    }
    case 'totalHashes':
      return Number(safeState.totalHashes || 0);
    case 'totalEarned':
      return Number(safeState.totalEarned || 0);
    case 'powerInfraLevel':
      return Number(safeState.powerInfraLevel || 0);
    case 'researchCount':
      return Array.isArray(safeState.research) ? safeState.research.length : 0;
    case 'worldDay':
      return Number(safeState.worldDay || 1);
    default:
      return 0;
  }
}

function formatRigModMetric(metric, value) {
  if (metric === 'totalEarned') {
    return '$' + (typeof fmtNum === 'function' ? fmtNum(value) : String(Math.floor(value)));
  }
  if (metric === 'totalHashes') {
    return typeof fmtNum === 'function' ? fmtNum(value) : String(Math.floor(value));
  }
  return String(Math.floor(value));
}

function getRigModUnlockProgress(modId) {
  const unlockDef = (window.RIG_MOD_UNLOCKS || {})[modId];
  if (!unlockDef || !Array.isArray(unlockDef.requirements)) {
    return {
      id: modId,
      unlocked: true,
      progress: 100,
      requirements: [],
    };
  }

  const requirements = unlockDef.requirements;
  if (!requirements.length) {
    return {
      id: modId,
      unlocked: true,
      progress: 100,
      requirements: [],
    };
  }

  let ratioSum = 0;
  const items = requirements.map((req) => {
    const target = Math.max(1, Number(req.target || 1));
    const currentRaw = getRigModMetricValue(req.metric);
    const current = Math.max(0, Number.isFinite(currentRaw) ? currentRaw : 0);
    const ratio = Math.min(1, current / target);
    const done = current >= target;
    ratioSum += ratio;
    return {
      metric: req.metric,
      label: req.label || req.metric,
      target,
      current,
      done,
      displayCurrent: formatRigModMetric(req.metric, current),
      displayTarget: formatRigModMetric(req.metric, target),
    };
  });

  return {
    id: modId,
    unlocked: items.every((x) => x.done),
    progress: Math.round((ratioSum / items.length) * 100),
    requirements: items,
  };
}

window.getRigModUnlockProgress = getRigModUnlockProgress;
