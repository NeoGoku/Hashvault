// ============================================================
// SYSTEM — Contracts: generieren, annehmen, einlösen
// ============================================================

const CONTRACT_BALANCE = {
  minSlots: 5,
  maxSlots: 12,
  chipSlotBonusId: 'cu6',
  maxPerType: 2,
  targetRndMin: 0.86,
  targetRndMax: 1.28,
  rewardRndMin: 0.92,
  rewardRndMax: 1.22,
  difficultyTargetMult: { easy: 0.88, medium: 1.04, hard: 1.26 },
  difficultyRewardMult: { easy: 0.95, medium: 1.10, hard: 1.30 },
  minRewardByDifficulty: { easy: 240, medium: 1300, hard: 5600 },
};
window.HV_CONTRACT_BALANCE = CONTRACT_BALANCE;

function getContractProgressProfile() {
  const totalEarned = Math.max(0, Number(G.totalEarned || 0));
  const totalRigs = Math.max(0, Number(G.totalRigs || Object.values(G.rigs || {}).reduce((a, b) => a + Number(b || 0), 0)));
  const researchCount = Array.isArray(G.research) ? G.research.length : 0;
  const contractsDone = Math.max(0, Number(G.contractsDone || 0));
  const prestige = Math.max(0, Number(G.prestigeCount || 0));
  const locationTier = (typeof window.getCurrentLocation === 'function')
    ? Number((getCurrentLocation() || {}).tier || 1)
    : 1;

  const earnedScore = Math.min(1, Math.log10(totalEarned + 1) / 8);
  const rigScore = Math.min(1, totalRigs / 320);
  const researchScore = Math.min(1, researchCount / 24);
  const contractScore = Math.min(1, contractsDone / 55);
  const prestigeScore = Math.min(1, prestige / 8);
  const locationScore = Math.min(1, Math.max(0, locationTier - 1) / 8);

  const progress = Math.max(
    0,
    Math.min(
      1,
      earnedScore * 0.28 +
      rigScore * 0.18 +
      researchScore * 0.16 +
      contractScore * 0.16 +
      prestigeScore * 0.12 +
      locationScore * 0.10
    )
  );

  return {
    totalEarned,
    totalRigs,
    researchCount,
    contractsDone,
    prestige,
    locationTier,
    progress,
    earnedScore,
    rigScore,
    researchScore,
    contractScore,
    prestigeScore,
    locationScore,
  };
}
window.getContractProgressProfile = getContractProgressProfile;

function getContractDifficultyWeights(profile) {
  const p = profile || getContractProgressProfile();
  const hardGate = p.progress >= 0.58 || p.locationTier >= 6 || p.prestige >= 2;
  const mediumGate = p.progress >= 0.22 || p.locationTier >= 3 || p.totalEarned >= 25000;

  const weights = {
    easy: Math.max(0.08, 1.15 - p.progress * 1.05),
    medium: mediumGate ? (0.25 + p.progress * 0.95) : 0,
    hard: hardGate ? Math.max(0.05, (p.progress - 0.45) * 1.55 + p.prestige * 0.18) : 0,
  };
  return weights;
}

function pickWeightedDifficulty(weights, available) {
  const allowed = Object.keys(weights || {}).filter((key) => Number(weights[key] || 0) > 0 && available.has(key));
  if (!allowed.length) return available.has('easy') ? 'easy' : null;
  const total = allowed.reduce((sum, key) => sum + Number(weights[key] || 0), 0);
  let r = Math.random() * Math.max(0.0001, total);
  for (const key of allowed) {
    r -= Number(weights[key] || 0);
    if (r <= 0) return key;
  }
  return allowed[allowed.length - 1];
}

function randomBetween(min, max) {
  const lo = Number(min || 0);
  const hi = Number(max || lo);
  if (hi <= lo) return lo;
  return lo + Math.random() * (hi - lo);
}

function buildContractFromTemplate(template, profile, difficulty) {
  const t = template || {};
  const diff = String(difficulty || t.difficulty || 'easy');
  const targetRnd = randomBetween(CONTRACT_BALANCE.targetRndMin, CONTRACT_BALANCE.targetRndMax);
  const rewardRnd = randomBetween(CONTRACT_BALANCE.rewardRndMin, CONTRACT_BALANCE.rewardRndMax);

  const baseDiffTargetMult = Number((CONTRACT_BALANCE.difficultyTargetMult || {})[diff] || 1);
  const baseDiffRewardMult = Number((CONTRACT_BALANCE.difficultyRewardMult || {})[diff] || 1);
  const progressTargetMult = 0.92 + Math.pow(Math.max(0, Number(profile.progress || 0)), 1.12) * 2.35;
  const progressRewardMult = 0.95 + Math.pow(Math.max(0, Number(profile.progress || 0)), 0.84) * 1.30;

  let target = 0;
  const baseTarget = Math.max(1, Number(t.diffMult || 1));
  if (t.fixedTarget) {
    if (t.type === 'location_tier') {
      const maxTier = Array.isArray(window.LOCATIONS) ? window.LOCATIONS.reduce((m, loc) => Math.max(m, Number((loc && loc.tier) || 1)), 9) : 9;
      const tierBump = Math.floor(Number(profile.progress || 0) * 3) + Math.floor(Number(profile.locationTier || 1) / 4);
      target = Math.max(2, Math.min(maxTier, Math.floor(baseTarget + tierBump)));
    } else if (t.type === 'power_infra') {
      const bump = Math.floor(Number(profile.progress || 0) * 4) + Math.floor(Math.max(0, Number(profile.prestige || 0)) / 3);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'prestige_count') {
      const bump = Math.floor(Number(profile.progress || 0) * 2);
      target = Math.max(1, Math.floor(baseTarget + bump));
    } else if (t.type === 'crew_coverage') {
      const coverageBump = Math.floor(Number(profile.progress || 0) * 10);
      target = Math.max(72, Math.min(99, Math.floor(baseTarget + coverageBump)));
    } else if (t.type === 'research_count') {
      const bump = Math.floor(Number(profile.progress || 0) * 8);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'location_shop_items') {
      const bump = Math.floor(Number(profile.progress || 0) * 10);
      target = Math.max(1, Math.floor(baseTarget + bump));
    } else if (t.type === 'cooling_level') {
      const bump = Math.floor(Number(profile.progress || 0) * 4);
      target = Math.max(1, Math.floor(baseTarget + bump));
    } else if (t.type === 'layout_switches') {
      const bump = Math.floor(Number(profile.progress || 0) * 6);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'outage_responses') {
      const bump = Math.floor(Number(profile.progress || 0) * 5);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'outage_events') {
      const bump = Math.floor(Number(profile.progress || 0) * 5);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'outage_auto_responses') {
      const bump = Math.floor(Number(profile.progress || 0) * 4);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'outage_manual_responses') {
      const bump = Math.floor(Number(profile.progress || 0) * 4);
      target = Math.max(2, Math.floor(baseTarget + bump));
    } else if (t.type === 'cooling_switches') {
      const bump = Math.floor(Number(profile.progress || 0) * 10);
      target = Math.max(3, Math.floor(baseTarget + bump));
    } else {
      target = Math.max(1, Math.floor(baseTarget));
    }
  } else {
    let typeCurve = 1;
    if (t.type === 'hashes') typeCurve = 0.92 + Number(profile.rigScore || 0) * 0.55 + Number(profile.researchScore || 0) * 0.28;
    if (t.type === 'earn') typeCurve = 0.90 + Number(profile.earnedScore || 0) * 0.70 + Number(profile.contractScore || 0) * 0.22;
    if (t.type === 'rigs') typeCurve = 0.95 + Number(profile.rigScore || 0) * 0.60 + Number(profile.locationScore || 0) * 0.18;
    target = Math.floor(baseTarget * targetRnd * progressTargetMult * baseDiffTargetMult * typeCurve);
    if (t.type === 'rigs') target = Math.max(3, target);
  }

  let reward = Math.floor(
    Math.max(1, Number(t.reward || 0)) *
    rewardRnd *
    progressRewardMult *
    baseDiffRewardMult
  );
  reward = Math.max(
    Number((CONTRACT_BALANCE.minRewardByDifficulty || {})[diff] || 100),
    reward
  );

  const desc = String(t.desc || '')
    .replace('{t}', fmtNum(target))
    .replace('${t}', fmtNum(target));

  return {
    name: String(t.name || 'Contract'),
    desc,
    type: String(t.type || 'hashes'),
    target,
    reward,
    difficulty: diff,
    accepted: false,
    completed: false,
    createdAt: Date.now(),
  };
}

function generateContracts() {
  const profile = getContractProgressProfile();
  const chipSlots = Math.max(0, Number((G.chipShop || {})[CONTRACT_BALANCE.chipSlotBonusId] || 0));
  const prestigeSlots = Math.floor(Math.max(0, Number(G.prestigeCount || 0)) / 2);
  const count = Math.max(
    CONTRACT_BALANCE.minSlots,
    Math.min(CONTRACT_BALANCE.maxSlots, CONTRACT_BALANCE.minSlots + chipSlots + prestigeSlots)
  );

  const templates = Array.isArray(CONTRACT_TEMPLATES) ? CONTRACT_TEMPLATES : [];
  const byDifficulty = {
    easy: templates.filter((t) => t && t.difficulty === 'easy'),
    medium: templates.filter((t) => t && t.difficulty === 'medium'),
    hard: templates.filter((t) => t && t.difficulty === 'hard'),
  };
  const availableDiff = new Set(Object.keys(byDifficulty).filter((d) => byDifficulty[d].length > 0));
  const weights = getContractDifficultyWeights(profile);

  const usedNames = new Set();
  const typeCounts = {};
  const output = [];
  let guard = 0;

  while (output.length < count && guard < 500) {
    guard += 1;
    const diff = pickWeightedDifficulty(weights, availableDiff);
    if (!diff) break;
    const pool = (byDifficulty[diff] || []).filter((t) => {
      const name = String((t && t.name) || '');
      const type = String((t && t.type) || 'hashes');
      const typeCount = Number(typeCounts[type] || 0);
      return !usedNames.has(name) && typeCount < Number(CONTRACT_BALANCE.maxPerType || 2);
    });
    if (!pool.length) continue;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (!picked) continue;
    const built = buildContractFromTemplate(picked, profile, diff);
    output.push(built);
    usedNames.add(String(picked.name || built.name));
    typeCounts[built.type] = Number(typeCounts[built.type] || 0) + 1;
  }

  if (!output.length && templates.length) {
    output.push(buildContractFromTemplate(templates[0], profile, templates[0].difficulty || 'easy'));
  }

  G.contracts = output;
  renderContracts();
}

function acceptContract(idx) {
  if (!G.contracts[idx] || G.contracts[idx].accepted || G.contracts[idx].completed) return;
  G.contracts[idx].accepted = true;
  renderContracts();
  notify('📋 Contract angenommen: ' + G.contracts[idx].name);
}

function claimContract(idx) {
  const c = G.contracts[idx];
  if (!c || !c.accepted || c.completed) return;
  if (!isContractComplete(c)) {
    notify('Contract noch nicht erfüllt!', 'error');
    return;
  }
  const prestigeMult = (typeof window.getPrestigeMissionRewardMult === 'function')
    ? getPrestigeMissionRewardMult()
    : 1;
  const reward      = Math.floor(c.reward * (1 + G._contractBonus) * prestigeMult);
  G.usd            += reward;
  G.totalEarned    += reward;
  G.contracts[idx].completed = true;
  G.contractsDone++;
  renderContracts();
  notify('🎉 Contract abgeschlossen! +$' + fmtNum(reward), 'gold');
}

function getContractCurrentValue(c) {
  if (!c || typeof c !== 'object') return 0;
  if (c.type === 'hashes') return Number(G.totalHashes || 0);
  if (c.type === 'earn') return Number(G.totalEarned || 0);
  if (c.type === 'rigs') return Number(G.totalRigs || 0);
  if (c.type === 'research_count') return Array.isArray(G.research) ? G.research.length : 0;
  if (c.type === 'location_tier') {
    const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
    return Number((loc && loc.tier) || 1);
  }
  if (c.type === 'crew_coverage') return Math.max(0, Math.min(100, Number(G._rigStaffCoverage || 0) * 100));
  if (c.type === 'location_shop_items') {
    return (typeof window.getTotalLocationShopItemsOwned === 'function')
      ? Number(getTotalLocationShopItemsOwned(G) || 0)
      : 0;
  }
  if (c.type === 'power_infra') return Number(G.powerInfraLevel || 0);
  if (c.type === 'cooling_level') return Number(G.coolingInfraLevel || 0);
  if (c.type === 'layout_switches') return Number(G.layoutSwitchCount || 0);
  if (c.type === 'outage_responses') return Number(G.outageDecisions || 0);
  if (c.type === 'outage_events') return Number(G.outageEventsSeen || 0);
  if (c.type === 'outage_auto_responses') return Number(G.outageAutoResolved || 0);
  if (c.type === 'outage_manual_responses') return Number(G.outageManualResolved || 0);
  if (c.type === 'cooling_switches') return Number(G.coolingModeChanges || 0);
  if (c.type === 'prestige_count') return Number(G.prestigeCount || 0);
  return 0;
}
window.getContractCurrentValue = getContractCurrentValue;

function isContractComplete(c) {
  const current = getContractCurrentValue(c);
  const target = Math.max(1, Number((c && c.target) || 1));
  return Number(current || 0) >= target;
}

// ── Daily Bonus ─────────────────────────────────────────────
function claimDaily() {
  const now       = Date.now();
  const oneDayMs  = 86400000;
  if (now - G.lastDaily < oneDayMs) {
    notify('Bereits heute geclaimed! Komm morgen wieder. 📅', 'error');
    return;
  }
  // Streak brechen wenn mehr als 2 Tage vergangen
  if (now - G.lastDaily > oneDayMs * 2) G.dailyStreak = 0;

  G.dailyStreak++;
  G.lastDaily = now;

  let reward = (75 + G.dailyStreak * 40) * 0.78;
  if (G.dailyStreak >= 7)  reward = Math.floor(reward * 2);
  if (G.dailyStreak >= 30) reward = Math.floor(reward * 3);
  reward = Math.floor(reward);
  if (typeof window.getPrestigeMissionRewardMult === 'function') {
    reward = Math.floor(reward * getPrestigeMissionRewardMult());
  }

  G.usd         += reward;
  G.totalEarned += reward;

  notify('🎁 Daily Bonus: +$' + fmtNum(reward) + ' (Streak: ' + G.dailyStreak + ' Tage)', 'gold');
  updateDailyBar();
}
