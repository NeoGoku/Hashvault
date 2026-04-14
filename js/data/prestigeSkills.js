// ============================================================
// DATA — Prestige Skilltree
// Dauerhafte Chip-Investitionen, bleiben ueber Resets erhalten.
// ============================================================

window.PRESTIGE_SKILLS = [
  { id:'eco_ops', group:'Economy', name:'Ops Ledger', icon:'📒', desc:'Drueckt taegliche Betriebs- und Finanzkosten.', cost:2, step:1, max:5, effect:{ opsCostMult:0.972 } },
  { id:'eco_build', group:'Economy', name:'Fabricator Chain', icon:'🏗️', desc:'Senkt Build-, Rig- und Standortkosten.', cost:2, step:1, max:5, effect:{ buildCostMult:0.978 } },
  { id:'eco_research', group:'Economy', name:'Lab Funding', icon:'🧪', desc:'Forschung wird billiger und leichter skalierbar.', cost:2, step:1, max:5, effect:{ researchCostMult:0.972 } },
  { id:'eco_wallet', group:'Economy', name:'Treasury Desk', icon:'🏦', desc:'Verbessert Wallet-APY und Zins-Output.', cost:3, step:1, max:4, effect:{ walletYieldMult:1.06 }, req:{ minPrestige:1 } },

  { id:'grid_cap', group:'Grid', name:'Grid Backbone', icon:'⚡', desc:'Mehr Netzkapazitaet fuer spaetere Ausbaustufen.', cost:3, step:2, max:4, effect:{ powerCapMult:1.055 } },
  { id:'grid_thermal', group:'Grid', name:'Thermal Doctrine', icon:'🌡️', desc:'Kuehlung arbeitet effizienter und haelt Systeme stabil.', cost:3, step:2, max:4, effect:{ coolingMult:1.07 } },
  { id:'grid_ops', group:'Grid', name:'Control Stack', icon:'🧭', desc:'Automation und Ausfall-Handling reagieren schneller.', cost:4, step:2, max:4, effect:{ automationMult:1.07, outagePrepMult:1.07 }, req:{ minPrestige:1 } },

  { id:'crew_eff', group:'Crew', name:'Crew Doctrine', icon:'🛠️', desc:'Mitarbeiter holen mehr aus ihren Aufgaben heraus.', cost:3, step:1, max:5, effect:{ crewEffMult:1.045 } },
  { id:'crew_wage', group:'Crew', name:'Payroll Sync', icon:'💼', desc:'Reduziert Lohnkosten ohne Effizienzverlust.', cost:3, step:2, max:4, effect:{ crewWageMult:0.972 }, req:{ skill:'crew_eff', level:1 } },
  { id:'crew_power', group:'Crew', name:'Grid Operators', icon:'🔋', desc:'Crew spart Strom im laufenden Betrieb.', cost:4, step:2, max:4, effect:{ powerUsageMult:0.975 }, req:{ skill:'grid_ops', level:1 } },

  { id:'market_floor', group:'Market', name:'Market Memory', icon:'📈', desc:'Markt-Floor steigt und tiefe Drawdowns werden weicher.', cost:3, step:2, max:5, effect:{ marketFloorAdd:0.022 } },
  { id:'market_contracts', group:'Market', name:'Broker Net', icon:'🤝', desc:'Contracts und Daily-Belohnungen werden profitabler.', cost:3, step:2, max:4, effect:{ contractBonus:0.055 }, req:{ minPrestige:1 } },
  { id:'legacy_drive', group:'Legacy', name:'Legacy Drive', icon:'💎', desc:'Staerkt Set-Boni und gibt globalen Mining-Schub.', cost:5, step:3, max:4, effect:{ collectionBonusMult:1.10, hpsMult:1.045, clickMult:1.06 }, req:{ minPrestige:2 } },
];

function getPrestigeSkillState(stateArg) {
  return stateArg && typeof stateArg === 'object'
    ? stateArg
    : ((typeof G === 'object' && G) ? G : {});
}

function getPrestigeSkillLevel(skillId, stateArg) {
  const state = getPrestigeSkillState(stateArg);
  return Math.max(0, Number((((state.prestigeSkills || {})[skillId]) || 0)));
}

function getPrestigeSkillCost(skillId, nextLevel, stateArg) {
  const skill = (window.PRESTIGE_SKILLS || []).find((entry) => entry.id === skillId);
  if (!skill) return Infinity;
  const currentLevel = getPrestigeSkillLevel(skillId, stateArg);
  const targetLevel = Math.max(currentLevel + 1, Number(nextLevel || (currentLevel + 1)));
  return Math.max(1, Math.ceil(Number(skill.cost || 1) + Math.max(0, targetLevel - 1) * Number(skill.step || 0)));
}

function getPrestigeSkillRequirementState(skill, stateArg) {
  const req = (skill && skill.req) || null;
  const state = getPrestigeSkillState(stateArg);
  if (!req) return { ok:true, text:'' };
  if (req.minPrestige) {
    const need = Math.max(0, Number(req.minPrestige || 0));
    const current = Math.max(0, Number(state.prestigeCount || 0));
    return { ok: current >= need, text: 'Prestige ' + need + '+' };
  }
  if (req.skill) {
    const need = Math.max(1, Number(req.level || 1));
    const current = getPrestigeSkillLevel(String(req.skill), state);
    const parent = (window.PRESTIGE_SKILLS || []).find((entry) => entry.id === String(req.skill));
    const label = parent ? parent.name : String(req.skill);
    return { ok: current >= need, text: label + ' Lv ' + need };
  }
  return { ok:true, text:'' };
}

function getPrestigeSkillEffects(stateArg) {
  const effects = {
    hpsMult: 1,
    clickMult: 1,
    opsCostMult: 1,
    buildCostMult: 1,
    researchCostMult: 1,
    powerCapMult: 1,
    powerUsageMult: 1,
    coolingMult: 1,
    automationMult: 1,
    outagePrepMult: 1,
    crewEffMult: 1,
    crewWageMult: 1,
    walletYieldMult: 1,
    marketFloorAdd: 0,
    contractBonus: 0,
    collectionBonusMult: 1,
  };

  (window.PRESTIGE_SKILLS || []).forEach((skill) => {
    const level = getPrestigeSkillLevel(skill.id, stateArg);
    if (level <= 0) return;
    const perLevel = skill.effect || {};
    Object.keys(perLevel).forEach((key) => {
      const raw = Number(perLevel[key] || 0);
      if (!Number.isFinite(raw)) return;
      if (key === 'marketFloorAdd' || key === 'contractBonus') effects[key] += raw * level;
      else effects[key] *= Math.pow(raw, level);
    });
  });

  return effects;
}

window.getPrestigeSkillLevel = getPrestigeSkillLevel;
window.getPrestigeSkillCost = getPrestigeSkillCost;
window.getPrestigeSkillEffects = getPrestigeSkillEffects;
window.getPrestigeSkillRequirementState = getPrestigeSkillRequirementState;
