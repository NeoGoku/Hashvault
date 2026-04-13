// ============================================================
// DATA — Sammlungen / Set-Boni
// Auto-aktiv sobald Anforderungen erfuellt sind.
// ============================================================

window.COLLECTION_SETS = [
  {
    id: 'starter_stack',
    name: 'Starter-Stack',
    icon: '🔌',
    desc: 'Baue aus dem Kleinkram eine echte Einsteigerfarm.',
    requirements: [
      { type: 'rig', id: 'usb', count: 12, label: '12 USB Miner' },
      { type: 'rig', id: 'rpi', count: 4, label: '4 Raspberry Pi' },
    ],
    bonus: { clickMult: 1.12, hpsMult: 1.04 },
    rewardText: '+12% Klick-Power, +4% H/s',
  },
  {
    id: 'gpu_floor',
    name: 'GPU-Floor',
    icon: '🖥️',
    desc: 'Ein stabiler GPU-Boden bringt Tempo und spart spuerbar Strom.',
    requirements: [
      { type: 'rig', id: 'gpu1', count: 8, label: '8 Gaming-PCs' },
      { type: 'rig', id: 'gpu4', count: 2, label: '2 GPU Arrays' },
    ],
    bonus: { hpsMult: 1.08, powerUsageMult: 0.95 },
    rewardText: '+8% H/s, -5% Rig-Strombedarf',
  },
  {
    id: 'asic_line',
    name: 'ASIC-Line',
    icon: '⚡',
    desc: 'Ab hier wird aus Basteln echte industrielle Linienarbeit.',
    requirements: [
      { type: 'rig', id: 'asic1', count: 4, label: '4 ASIC Miner' },
      { type: 'rig', id: 'asic8', count: 1, label: '1 ASIC Cluster' },
    ],
    bonus: { hpsMult: 1.1, marketFloorAdd: 0.02, outagePrepMult: 1.08 },
    rewardText: '+10% H/s, +2% Markt-Floor, +8% Outage-Prep',
  },
  {
    id: 'research_floor',
    name: 'Research-Floor',
    icon: '🧪',
    desc: 'Ein echter Lab-Floor beschleunigt Forschung und Projektarbeit.',
    requirements: [
      { type: 'rig', id: 'srv', count: 2, label: '2 Server Farms' },
      { type: 'rig', id: 'qc', count: 1, label: '1 Quantum Core' },
      { type: 'research_count', count: 5, label: '5 Research abgeschlossen' },
    ],
    bonus: { researchSpeedMult: 1.12, contractBonus: 0.1 },
    rewardText: '+12% Research-Speed, +10% Contract-Bonus',
  },
  {
    id: 'future_stack',
    name: 'Future-Stack',
    icon: '🛰️',
    desc: 'Endgame-Hardware als Set bringt spuerbar bessere Skalierung.',
    requirements: [
      { type: 'rig', id: 'aic', count: 1, label: '1 AI Cluster' },
      { type: 'rig', id: 'fnx', count: 1, label: '1 Fusion Node' },
      { type: 'rig', id: 'orb', count: 1, label: '1 Orbital Forge' },
    ],
    bonus: { hpsMult: 1.14, buildCostMult: 0.95 },
    rewardText: '+14% H/s, -5% Build-Kosten',
  },
  {
    id: 'operator_suite',
    name: 'Operator-Suite',
    icon: '🏢',
    desc: 'Standort, Ausbau und Shop greifen als Betriebsstandard ineinander.',
    requirements: [
      { type: 'location_tier', count: 6, label: 'Standort Tier 6' },
      { type: 'shop_items', count: 8, label: '8 Standort-Shop-Items' },
      { type: 'power_infra', count: 5, label: 'Power-Infra Level 5' },
    ],
    bonus: { coolingMult: 1.12, opsCostMult: 0.94, powerCapMult: 1.06 },
    rewardText: '+12% Cooling, -6% Fixkosten, +6% Netzkapazitaet',
  },
];

function getCollectionStateObject(stateArg) {
  return stateArg && typeof stateArg === 'object'
    ? stateArg
    : ((typeof G === 'object' && G) ? G : {});
}

function getCollectionRequirementValue(req, stateArg) {
  const state = getCollectionStateObject(stateArg);
  const type = String((req && req.type) || '');
  if (type === 'rig') return Math.max(0, Number((((state.rigs || {})[req.id]) || 0)));
  if (type === 'location_tier') {
    if (typeof window.getLocationById === 'function') {
      const loc = getLocationById(state.locationId || 'home_pc');
      return Math.max(1, Number((loc && loc.tier) || 1));
    }
    return 1;
  }
  if (type === 'shop_items') {
    const purchases = state.locationShopPurchases || {};
    return Object.values(purchases).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  }
  if (type === 'power_infra') return Math.max(0, Number(state.powerInfraLevel || 0));
  if (type === 'research_count') return Array.isArray(state.research) ? state.research.length : 0;
  if (type === 'prestige_count') return Math.max(0, Number(state.prestigeCount || 0));
  return 0;
}

function getCollectionSetStatus(setId, stateArg) {
  const set = (window.COLLECTION_SETS || []).find((entry) => entry.id === setId);
  if (!set) return null;
  const requirements = Array.isArray(set.requirements) ? set.requirements : [];
  const progress = requirements.map((req) => {
    const current = getCollectionRequirementValue(req, stateArg);
    const target = Math.max(1, Number(req.count || 1));
    return {
      label: String(req.label || req.id || req.type),
      current,
      target,
      done: current >= target,
    };
  });
  const active = progress.every((row) => row.done);
  return {
    id: set.id,
    name: set.name,
    icon: set.icon || '🧩',
    desc: set.desc || '',
    rewardText: set.rewardText || '',
    bonus: set.bonus || {},
    progress,
    active,
  };
}

function getActiveCollectionBonuses(stateArg) {
  const sets = (window.COLLECTION_SETS || [])
    .map((set) => getCollectionSetStatus(set.id, stateArg))
    .filter(Boolean);
  const activeSets = sets.filter((set) => set.active);
  const effects = {
    clickMult: 1,
    hpsMult: 1,
    powerUsageMult: 1,
    powerCapMult: 1,
    coolingMult: 1,
    opsCostMult: 1,
    buildCostMult: 1,
    researchCostMult: 1,
    researchSpeedMult: 1,
    crewEffMult: 1,
    crewWageMult: 1,
    automationMult: 1,
    outagePrepMult: 1,
    marketFloorAdd: 0,
    contractBonus: 0,
  };

  activeSets.forEach((set) => {
    const bonus = set.bonus || {};
    Object.keys(bonus).forEach((key) => {
      const value = Number(bonus[key] || 0);
      if (!Number.isFinite(value)) return;
      if (key === 'marketFloorAdd' || key === 'contractBonus') effects[key] += value;
      else effects[key] *= value;
    });
  });

  return {
    activeSets,
    totalCompleted: activeSets.length,
    effects,
  };
}

window.getCollectionSetStatus = getCollectionSetStatus;
window.getActiveCollectionBonuses = getActiveCollectionBonuses;
