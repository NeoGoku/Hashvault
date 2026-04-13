// ============================================================
// MAIN — Entry Point, Tab-System, Event-Listener, Init
// Wird als letztes geladen — alle anderen Module sind verfügbar.
// ============================================================

// ── Tab-Wechsel ──────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName)
  );
  document.querySelectorAll('.panel').forEach(p =>
    p.classList.toggle('active', p.id === tabName + '-panel')
  );

  // Gezieltes Re-Render beim Tab-Wechsel
  switch (tabName) {
    case 'power':        renderPowerPanel();  break;
    case 'location':     renderPowerPanel();  break;
    case 'market':       renderMarket();       break;
    case 'upgrades':     renderUpgrades(_currentFilter || 'all'); break;
    case 'research':     renderResearch();     break;
    case 'staff':        renderStaff();        break;
    case 'crew':         renderRigCrew();      break;
    case 'missions':     renderMissions();     break;
    case 'traders':      renderTraders();      break;
    case 'collections':  renderCollections();  break;
    case 'achievements': renderAchievements(); break;
    case 'prestige':     renderPrestige();     break;
  }
}

function getPrestigeMissionRewardMult() {
  const prestige = Math.max(0, Number(G.prestigeCount || 0));
  return 1 + prestige * 0.03;
}

function getMissionRewardCashMult(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'challenge') return 0.68;
  if (key === 'goal') return 0.72;
  if (key === 'story') return 0.62;
  return 1;
}

// ── Rig Coin-Zuweisung ────────────────────────────────────────
function setRigTarget(rigId, coin) {
  if (!G.rigTargets) G.rigTargets = {};
  if (!COIN_DATA[coin]) return;
  G.rigTargets[rigId] = coin;
  // Sicherstellen dass rigHashPools existiert
  G.rigHashPools = G.rigHashPools || { BTC:0, ETH:0, LTC:0, BNB:0 };
  renderRigs();
  const cd = COIN_DATA[coin];
  notify('⛏️ Rig mined jetzt ' + cd.symbol + ' ' + cd.name + '!', 'success');
}

// ── Challenges System ─────────────────────────────────────────
function claimChallenge(challengeId) {
  const ch = G.dailyChallenges.find(c => c.id === challengeId);
  if (!ch || !ch.completed) {
    notify('❌ Challenge nicht abgeschlossen!', 'error');
    return;
  }
  if (ch.claimed) {
    notify('✓ Challenge bereits eingelost.', 'warning');
    return;
  }
  const def = CHALLENGES[challengeId];
  if (!def) return;

  // Rewards verteilen
  if (def.rewards.chips) {
    G.chips += def.rewards.chips;
    notify('💎 +' + def.rewards.chips + ' Chips!', 'gold');
  }
  if (def.rewards.cashBonus) {
    const cash = Math.floor(
      Number(def.rewards.cashBonus || 0) *
      getPrestigeMissionRewardMult() *
      getMissionRewardCashMult('challenge')
    );
    G.usd += cash;
    G.totalEarned += cash;
    notify('💰 +$' + fmtNum(cash) + '!', 'gold');
  }
  if (def.rewards.chipType === 'consumable') {
    const consumables = ['cc1', 'cc2', 'cc3', 'cc4'];
    const random = consumables[Math.floor(Math.random() * consumables.length)];
    G.chipShop[random] = (G.chipShop[random] || 0) + 1;
    notify('🎁 Random Chip erhalten!', 'gold');
  }
  
  ch.claimed = true;
  renderChallenges();
}

function claimGoal(goalId) {
  const goals = window.GOALS || [];
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;

  G.goalsClaimed = G.goalsClaimed || {};
  if (G.goalsClaimed[goalId]) {
    notify('🎯 Ziel bereits eingelost.', 'warning');
    return;
  }

  const progress = typeof window.getGoalProgressValue === 'function'
    ? window.getGoalProgressValue(goal)
    : 0;

  if (progress < goal.target) {
    notify('🎯 Ziel noch nicht erreicht.', 'error');
    return;
  }
  const gate = (typeof window.getGoalGateStatus === 'function')
    ? getGoalGateStatus(goal)
    : { ok: true, pending: [] };
  if (!gate.ok) {
    const hint = gate.pending && gate.pending.length ? gate.pending[0] : 'Zusatzvoraussetzung fehlt';
    notify('⛔ Ziel gesperrt: ' + hint, 'error');
    return;
  }

  const rewards = goal.rewards || {};
  if (rewards.cash) {
    const cash = Math.floor(
      Number(rewards.cash || 0) *
      getPrestigeMissionRewardMult() *
      getMissionRewardCashMult('goal')
    );
    G.usd += cash;
    G.totalEarned += cash;
  }
  if (rewards.chips) {
    G.chips += rewards.chips;
  }

  G.goalsClaimed[goalId] = true;
  notify('🎯 Ziel erledigt: ' + goal.name, 'gold');
  if (typeof renderGoals === 'function') renderGoals();
}

function claimStoryMission() {
  if (typeof window.getStoryMissionProgress !== 'function') return;
  const info = getStoryMissionProgress();
  if (!info.mission) {
    notify('📚 Keine weitere Story-Mission verfuegbar.', 'warning');
    return;
  }
  if (!info.done) {
    notify('📚 Story-Mission noch nicht abgeschlossen.', 'error');
    return;
  }

  const mission = info.mission;
  const reward = mission.reward || {};
  const missionId = mission.id;
  if (!G.storyMissionsClaimed || typeof G.storyMissionsClaimed !== 'object') G.storyMissionsClaimed = {};
  if (G.storyMissionsClaimed[missionId]) {
    notify('ℹ️ Story-Mission bereits eingelost.', 'warning');
    return;
  }

  const cash = Math.floor(
    Math.max(0, Number(reward.cash || 0)) *
    getPrestigeMissionRewardMult() *
    getMissionRewardCashMult('story')
  );
  const chips = Math.max(0, Number(reward.chips || 0));
  const parts = Math.max(0, Number(reward.modParts || 0));

  if (cash > 0) {
    G.usd += cash;
    G.totalEarned += cash;
  }
  if (chips > 0) G.chips += chips;
  if (parts > 0) G.modParts = Math.max(0, Number(G.modParts || 0)) + parts;

  G.storyMissionsClaimed[missionId] = true;
  G.storyMissionIndex = Math.max(0, Number(G.storyMissionIndex || 0)) + 1;
  notify('📚 Story-Mission abgeschlossen: ' + mission.name, 'gold');
  if (typeof renderMissions === 'function') renderMissions();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function setRigCrewSpec(tierId, specId) {
  const tier = (typeof window.getRigStaffTierById === 'function') ? getRigStaffTierById(tierId) : null;
  const specs = window.HV_RIG_CREW_SPECS || {};
  if (!tier || !specs[specId]) return;
  if (!G.rigCrewProgress || typeof G.rigCrewProgress !== 'object') G.rigCrewProgress = {};
  if (!G.rigCrewProgress[tierId] || typeof G.rigCrewProgress[tierId] !== 'object') {
    G.rigCrewProgress[tierId] = { level: 1, xp: 0, spec: 'balanced' };
  }
  G.rigCrewProgress[tierId].spec = specId;
  notify('🧠 Spezialisierung gesetzt: ' + tier.name + ' -> ' + specs[specId].label, 'success');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function getModWorkshopCost(modId) {
  const mod = (window.RIG_MODS || {})[modId];
  if (!mod) return { usd: Infinity, parts: Infinity, maxed: true, level: 0 };
  const level = Math.max(0, Number((G.modLevels && G.modLevels[modId]) || 0));
  const maxLevel = 4;
  if (level >= maxLevel) return { usd: Infinity, parts: Infinity, maxed: true, level };
  const usd = Math.ceil(Number(mod.cost || 0) * (1 + level * 0.85));
  const parts = Math.ceil(6 + level * 4);
  return { usd, parts, maxed: false, level };
}

function upgradeModTech(modId) {
  const mod = (window.RIG_MODS || {})[modId];
  if (!mod) return;
  G.unlockedMods = G.unlockedMods || [];
  if (!G.unlockedMods.includes(modId)) {
    notify('🔒 Mod ist noch nicht freigeschaltet.', 'error');
    return;
  }
  if (!G.modLevels || typeof G.modLevels !== 'object') G.modLevels = {};
  if (!Number.isFinite(G.modParts) || G.modParts < 0) G.modParts = 0;
  const price = getModWorkshopCost(modId);
  if (price.maxed) {
    notify('✅ ' + mod.name + ' ist bereits auf Max-Level.', 'success');
    return;
  }
  if (Number(G.usd || 0) < price.usd || Number(G.modParts || 0) < price.parts) {
    notify('❌ Nicht genug Ressourcen fuer Mod-Upgrade.', 'error');
    return;
  }
  G.usd -= price.usd;
  G.modParts -= price.parts;
  G.modLevels[modId] = price.level + 1;
  notify('🧩 ' + mod.name + ' auf Level ' + G.modLevels[modId] + ' verbessert!', 'gold');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof renderRigs === 'function') renderRigs();
}

function getPowerProviderSwitchCost(providerId) {
  const current = (typeof window.getPowerProviderById === 'function') ? getPowerProviderById(G.powerProviderId) : null;
  const next = (typeof window.getPowerProviderById === 'function') ? getPowerProviderById(providerId) : null;
  if (!next) return Infinity;
  if (current && current.id === next.id) return 0;
  const rigs = (typeof getTotalRigCount === 'function') ? getTotalRigCount() : Number(G.totalRigs || 0);
  const base = 220 + rigs * 14 + Math.max(0, Number(next.baseFeePerDay || 0)) * 1.8;
  return Math.ceil(base * Math.max(0.4, Number(G._buildCostMult || 1)));
}

function setPowerProvider(providerId) {
  const next = (typeof window.getPowerProviderById === 'function') ? getPowerProviderById(providerId) : null;
  const current = (typeof window.getPowerProviderById === 'function') ? getPowerProviderById(G.powerProviderId) : null;
  if (!next || !current) return;
  if (current.id === next.id) {
    notify('ℹ️ Dieser Anbieter ist bereits aktiv.', 'warning');
    return;
  }
  const dayNow = Math.max(1, Math.floor(Number(G.worldDay || 1)));
  const lockUntil = Math.max(0, Number(G.powerProviderLockedUntilDay || 0));
  if (dayNow < lockUntil) {
    notify('⛔ Anbieterwechsel gesperrt bis Tag ' + lockUntil + '.', 'error');
    return;
  }

  const cost = getPowerProviderSwitchCost(providerId);
  if (Number(G.usd || 0) < cost) {
    notify('❌ Nicht genug USD fuer Anbieterwechsel! ($' + fmtNum(cost) + ')', 'error');
    return;
  }
  G.usd -= cost;
  G.powerProviderId = next.id;
  G.powerProviderChanges = Math.max(0, Number(G.powerProviderChanges || 0)) + 1;
  G.powerProviderLockedUntilDay = dayNow + Math.max(0, Number(next.lockDays || 0));
  notify('🔌 Anbieter gewechselt: ' + next.name, 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function takeLoan(planId) {
  const plan = (typeof window.getLoanPlanById === 'function') ? getLoanPlanById(planId) : null;
  if (!plan) {
    notify('❌ Unbekannter Kreditplan.', 'error');
    return;
  }
  if (!Array.isArray(G.loans)) G.loans = [];
  if (!Number.isFinite(G.nextLoanId) || G.nextLoanId < 1) G.nextLoanId = 1;
  const dayNow = Math.max(1, Math.floor(Number(G.worldDay || 1)));
  const loan = {
    id: G.nextLoanId++,
    planId: plan.id,
    label: plan.label,
    principal: Number(plan.amount || 0),
    outstanding: Number(plan.amount || 0),
    ratePerDay: Number(plan.ratePerDay || 0.015) * Math.max(0.60, 1 - Math.max(0, Number(G.prestigeCount || 0)) * 0.025),
    dueDay: dayNow + Math.max(1, Number(plan.durationDays || 8)),
  };
  G.loans.push(loan);
  G.usd += loan.principal;
  notify('🏦 Kredit aufgenommen: ' + loan.label + ' (+$' + fmtNum(loan.principal) + ')', 'gold');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function repayLoan(loanId, amount) {
  if (!Array.isArray(G.loans) || !G.loans.length) {
    notify('ℹ️ Keine offenen Kredite.', 'warning');
    return;
  }
  let loan = null;
  if (Number.isFinite(Number(loanId))) {
    loan = G.loans.find((x) => Number(x.id) === Number(loanId)) || null;
  }
  if (!loan) {
    loan = G.loans.slice().sort((a, b) => Number(b.outstanding || 0) - Number(a.outstanding || 0))[0] || null;
  }
  if (!loan) return;
  const maxPay = Math.max(0, Number(G.usd || 0));
  if (maxPay <= 0) {
    notify('❌ Kein USD fuer Tilgung verfuegbar.', 'error');
    return;
  }
  const requested = Number.isFinite(Number(amount)) ? Math.max(0, Number(amount)) : Number(loan.outstanding || 0);
  const pay = Math.min(maxPay, Math.max(0, Number(loan.outstanding || 0)), Math.max(1, requested));
  if (pay <= 0) return;
  G.usd -= pay;
  loan.outstanding = Math.max(0, Number(loan.outstanding || 0) - pay);
  if (loan.outstanding <= 0.5) {
    G.loans = G.loans.filter((x) => Number(x.id) !== Number(loan.id));
    notify('✅ Kredit abbezahlt: ' + (loan.label || ('#' + loan.id)), 'success');
  } else {
    notify('💳 Kredit getilgt: -$' + fmtNum(pay) + ' (' + (loan.label || ('#' + loan.id)) + ')', 'success');
  }
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function repayAllLoans() {
  if (!Array.isArray(G.loans) || !G.loans.length) {
    notify('ℹ️ Keine offenen Kredite.', 'warning');
    return;
  }
  let changed = false;
  G.loans.slice().forEach((loan) => {
    if (Number(G.usd || 0) <= 0) return;
    const before = Number(loan.outstanding || 0);
    repayLoan(loan.id, before);
    if (Number(loan.outstanding || 0) < before) changed = true;
  });
  if (!changed) notify('ℹ️ Keine Tilgung moeglich.', 'warning');
}

function toggleInsurance() {
  if (!Number.isFinite(G.insuranceTier) || G.insuranceTier < 0) G.insuranceTier = 0;
  if (!G.insuranceActive) {
    const activation = Math.ceil(300 + Number(G.insuranceTier || 0) * 120);
    if (Number(G.usd || 0) < activation) {
      notify('❌ Nicht genug USD fuer Versicherungsaktivierung! ($' + fmtNum(activation) + ')', 'error');
      return;
    }
    G.usd -= activation;
    G.insuranceActive = true;
    notify('🛡️ Versicherung aktiviert.', 'success');
  } else {
    G.insuranceActive = false;
    notify('🛡️ Versicherung deaktiviert.', 'warning');
  }
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function toggleDebugOverlay() {
  G.debugOverlay = !G.debugOverlay;
  if (typeof renderDebugOverlay === 'function') renderDebugOverlay();
}

function toggleTutorialMode() {
  const isEnabled = G.tutorialEnabled !== false;
  G.tutorialEnabled = !isEnabled;
  if (G.tutorialEnabled) {
    notify('📘 Tutorial eingeblendet.', 'success');
  } else {
    notify('📘 Tutorial ausgeblendet.', 'warning');
  }
  if (typeof renderTutorialBox === 'function') renderTutorialBox();
  if (typeof renderTutorialToggleButton === 'function') renderTutorialToggleButton();
}

const DEBUG_CHEAT_USD_STEPS = [
  10000,
  50000,
  100000,
  500000,
  1000000,
  5000000,
  10000000,
  50000000,
  100000000,
  1000000000,
];

function getDebugCheatUsdSafe() {
  const raw = Number(G.debugCheatUsd || 0);
  if (!Number.isFinite(raw) || raw <= 0) return DEBUG_CHEAT_USD_STEPS[4];
  return Math.max(DEBUG_CHEAT_USD_STEPS[0], Math.floor(raw));
}

function getDebugCheatUsdStepIndex() {
  const target = getDebugCheatUsdSafe();
  let bestIdx = 0;
  let bestDiff = Infinity;
  DEBUG_CHEAT_USD_STEPS.forEach((value, idx) => {
    const diff = Math.abs(value - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

function setDebugCheatUsdByIndex(indexRaw) {
  const idx = Math.max(0, Math.min(DEBUG_CHEAT_USD_STEPS.length - 1, Math.floor(Number(indexRaw) || 0)));
  G.debugCheatUsd = DEBUG_CHEAT_USD_STEPS[idx];
  if (typeof renderDebugOverlay === 'function') renderDebugOverlay();
}

function applyDebugMoneyCheat(mode) {
  const action = String(mode || 'add');
  const amount = getDebugCheatUsdSafe();
  if (action === 'max') {
    G.usd = 1000000000000;
    notify('Debug-Cheat: USD auf $' + fmtNum(G.usd) + ' gesetzt.', 'gold');
  } else if (action === 'set') {
    G.usd = amount;
    notify('Debug-Cheat: USD auf $' + fmtNum(amount) + ' gesetzt.', 'gold');
  } else {
    G.usd += amount;
    G.totalEarned += amount;
    notify('Debug-Cheat: +$' + fmtNum(amount) + ' hinzugefuegt.', 'gold');
  }
  if (typeof updateHeader === 'function') updateHeader();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof renderUpgrades === 'function') renderUpgrades(_currentFilter || 'all');
  if (typeof renderStaff === 'function') renderStaff();
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof renderResearch === 'function') renderResearch();
  if (typeof renderMarket === 'function') renderMarket();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderGoals === 'function') renderGoals();
}

function exportSaveSnapshot() {
  try {
    const key = (typeof getCurrentSaveKey === 'function') ? getCurrentSaveKey() : 'hashvault_v5_s1';
    const raw = localStorage.getItem(key);
    if (!raw) {
      notify('ℹ️ Kein Save zum Export gefunden.', 'warning');
      return;
    }
    const payload = JSON.stringify({
      app: 'hashvault-pro',
      exportedAt: Date.now(),
      slot: Number(window.HV_ACTIVE_SLOT || 0) + 1,
      save: JSON.parse(raw),
    });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(
        () => notify('📋 Save-Backup in Zwischenablage kopiert.', 'success'),
        () => { prompt('Backup-JSON kopieren:', payload); }
      );
    } else {
      prompt('Backup-JSON kopieren:', payload);
    }
  } catch (err) {
    notify('❌ Export fehlgeschlagen.', 'error');
  }
}

function importSaveSnapshot() {
  const text = prompt('Backup-JSON hier einfuegen:');
  if (!text) return;
  try {
    const parsed = JSON.parse(text);
    const saveRaw = parsed && parsed.save ? parsed.save : parsed;
    if (!saveRaw || typeof saveRaw !== 'object') throw new Error('invalid payload');
    const normalized = (typeof sanitizeLoadedSavePayload === 'function')
      ? sanitizeLoadedSavePayload(saveRaw)
      : { save: saveRaw };
    const save = (normalized && normalized.save) ? normalized.save : saveRaw;
    const key = (typeof getCurrentSaveKey === 'function') ? getCurrentSaveKey() : 'hashvault_v5_s1';
    localStorage.setItem(key, JSON.stringify(save));
    notify(
      (normalized && normalized.repaired)
        ? '✅ Backup importiert (automatisch bereinigt). Seite wird neu geladen.'
        : '✅ Backup importiert. Seite wird neu geladen.',
      'success'
    );
    setTimeout(() => location.reload(), 300);
  } catch (err) {
    notify('❌ Import fehlgeschlagen: Ungueltiges Backup.', 'error');
  }
}

// ── NPC Trader System ────────────────────────────────────────
function acceptNPCDeal(npcId) {
  const npc = NPC_TRADERS.find(n => n.id === npcId);
  const deal = G.npcTraders[npcId];
  if (!npc || !deal || G.npcUsedToday[npcId]) {
    notify('❌ Deal nicht verfügbar!', 'error');
    return;
  }

  let success = false;
  if (deal.type === 'coin_cash') {
    const availableRaw = (typeof getAvailableCoinBalance === 'function')
      ? getAvailableCoinBalance(deal.coin)
      : Number((G.coins || {})[deal.coin] || 0);
    const available = Math.floor(Math.max(0, availableRaw));
    const qty = Math.min(available, Math.max(1, Math.floor(deal.maxCoins || 1)));
    if (qty > 0) {
      G.coins[deal.coin] -= qty;
      const earned = qty * G.prices[deal.coin] * deal.multiplier * G._priceMult;
      G.usd += earned;
      G.totalEarned += earned;
      if (!G.challengeProgress) G.challengeProgress = {};
      (G.dailyChallenges || []).forEach(ch => {
        const def = window.CHALLENGES ? window.CHALLENGES[ch.id] : null;
        if (!def || ch.completed) return;
        if (def.type === 'selling') {
          G.challengeProgress[ch.id] = (G.challengeProgress[ch.id] || 0) + qty;
        } else if (def.type === 'selling_value') {
          G.challengeProgress[ch.id] = (G.challengeProgress[ch.id] || 0) + earned;
        }
      });
      success = true;
      notify('💰 ' + npc.name + ': ' + qty + ' ' + deal.coin + ' verkauft.', 'gold');
    } else {
      notify('❌ Nicht genug ' + deal.coin + ' fuer den Deal.', 'error');
    }
  } else if (deal.type === 'chip_discount') {
    notify('🎯 ' + deal.discount + '% Chip-Rabatt fuer 5min verfuegbar!', 'success');
    G.activeBoosts = G.activeBoosts || [];
    G.activeBoosts.push({
      effect: 'chipDiscount',
      mult: 1 - deal.discount / 100,
      endsAt: Date.now() + (deal.duration || 300) * 1000
    });
    success = true;
  } else if (deal.type === 'energy_restore') {
    const rigId = deal.rigId;
    if (!rigId || (G.rigs[rigId] || 0) <= 0) {
      notify('❌ Dieses Rig ist derzeit nicht aktiv.', 'error');
      return;
    }
    if (G.usd < (deal.cost || 0)) {
      notify('❌ Nicht genug USD fuer den Energy-Deal.', 'error');
      return;
    }
    G.usd -= deal.cost || 0;
    G.rigEnergy = G.rigEnergy || {};
    const current = G.rigEnergy[rigId] === undefined ? 100 : G.rigEnergy[rigId];
    G.rigEnergy[rigId] = Math.min(100, current + (deal.amount || 0));
    notify('🔋 ' + npc.name + ': ' + rigId + ' + ' + (deal.amount || 0) + '% Energy.', 'success');
    success = true;
  } else if (deal.type === 'rig_mod_unlock') {
    const cost = deal.cost || 0;
    if (G.usd < cost) {
      notify('❌ Nicht genug USD fuer Mod-Deal.', 'error');
      return;
    }
    G.usd -= cost;
    G.unlockedMods = G.unlockedMods || [];
    if (deal.modId && !G.unlockedMods.includes(deal.modId)) G.unlockedMods.push(deal.modId);
    notify('🧩 Mod freigeschaltet: ' + (deal.modName || 'Unbekannt'), 'gold');
    success = true;
  } else if (deal.type === 'chips_bulk') {
    const basePrice = deal.basePrice || ((deal.count || 0) * 60);
    const discount = deal.discount || 0;
    const finalPrice = Math.max(1, Math.floor(basePrice * (1 - discount / 100)));
    if (G.usd < finalPrice) {
      notify('❌ Nicht genug USD fuer Bulk-Deal.', 'error');
      return;
    }
    G.usd -= finalPrice;
    const count = Math.max(1, Math.floor(deal.count || 1));
    const consumables = ['cc1', 'cc2', 'cc3', 'cc4'];
    for (let i = 0; i < count; i++) {
      const id = consumables[Math.floor(Math.random() * consumables.length)];
      G.chipShop[id] = (G.chipShop[id] || 0) + 1;
    }
    notify('🎁 ' + count + ' Mystery Chips erhalten.', 'gold');
    success = true;
  } else if (deal.type === 'wildcard') {
    if (deal.reward && deal.reward.cash) {
      G.usd += deal.reward.cash;
      G.totalEarned += deal.reward.cash;
      notify('🎁 Wildcard Cash: +$' + fmtNum(deal.reward.cash), 'gold');
      success = true;
    }
    if (deal.reward && deal.reward.chip) {
      const consumables = ['cc1', 'cc2', 'cc3', 'cc4'];
      const id = consumables[Math.floor(Math.random() * consumables.length)];
      G.chipShop[id] = (G.chipShop[id] || 0) + 1;
      notify('🎁 Wildcard Chip erhalten!', 'gold');
      success = true;
    }
    if (deal.buff && deal.duration) {
      G.activeBoosts = G.activeBoosts || [];
      G.activeBoosts.push({ effect: 'evHashBoost', mult: deal.buff, endsAt: Date.now() + deal.duration * 1000 });
      notify('⚡ Wildcard Boost aktiv!', 'success');
      success = true;
    }
  }

  if (success) {
    G.npcUsedToday[npcId] = true;
    renderTraders();
  }
}

function getPowerUpgradeCost() {
  const cfg = window.HV_POWER_BALANCE || {};
  const lvl = Number(G.powerInfraLevel || 0);
  const baseCost = Math.max(1, Number(cfg.upgradeBaseCost || 5000));
  const earlyMult = Math.max(1.01, Number(cfg.upgradeCostMult || 1.22));
  const softcapLevel = Math.max(0, Math.floor(Number(cfg.upgradeSoftcapLevel || 18)));
  const lateMult = Math.max(1.005, Number(cfg.upgradeSoftcapCostMult || 1.08));
  const earlyLevels = Math.min(lvl, softcapLevel);
  const lateLevels = Math.max(0, lvl - softcapLevel);
  const scaled = baseCost * Math.pow(earlyMult, earlyLevels) * Math.pow(lateMult, lateLevels);
  return Math.ceil(scaled * Math.max(0.4, Number(G._buildCostMult || 1)));
}

function upgradePowerCapacity() {
  const cfg = window.HV_POWER_BALANCE || {};
  const cost = getPowerUpgradeCost();
  const btcCost = (typeof getPowerBtcTokenCost === 'function') ? getPowerBtcTokenCost('infra') : 0;
  if (G.usd < cost) {
    notify('❌ Nicht genug USD fuer Netzausbau! (' + '$' + fmtNum(cost) + ')', 'error');
    return;
  }
  if (Number((G.coins || {}).BTC || 0) + 1e-9 < btcCost) {
    notify('❌ Nicht genug BTC fuer Netzausbau! (₿' + fmtNum(btcCost, 4) + ')', 'error');
    return;
  }
  G.usd -= cost;
  if (btcCost > 0) {
    if (typeof spendCoin === 'function') {
      const spent = spendCoin('BTC', btcCost);
      if (!spent) {
        G.usd += cost;
        notify('BTC-Abbuchung fehlgeschlagen.', 'error');
        return;
      }
    } else {
      G.coins.BTC = Math.max(0, Number((G.coins || {}).BTC || 0) - btcCost);
    }
  }
  G.powerInfraLevel = Number(G.powerInfraLevel || 0) + 1;
  const stepKw = Math.max(0.25, Number(cfg.upgradeStepKw || 10.0));
  const minCap = Math.max(0.5, Number(cfg.startCapacityKw || 3.0));
  G.powerCapacityKw = Number(G.powerCapacityKw || minCap) + stepKw;
  notify('⚡ Netzkapazitaet ausgebaut: +' + fmtNum(stepKw, 2) + ' kW (-$' + fmtNum(cost) + ', -₿' + fmtNum(btcCost, 4) + ')', 'success');
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateHeader === 'function') updateHeader();
}

function payPowerDebt() {
  const debt = Math.max(Number(G.dailyOpsDebt || 0), Number(G.powerDebt || 0));
  if (debt <= 0) {
    notify('✅ Keine offene Betriebsschuld.', 'success');
    return;
  }
  const pay = Math.min(Number(G.usd || 0), debt);
  if (pay <= 0) {
    notify('❌ Kein USD verfuegbar zum Tilgen.', 'error');
    return;
  }
  G.usd -= pay;
  G.dailyOpsDebt = Math.max(0, debt - pay);
  G.powerDebt = G.dailyOpsDebt;
  notify('🧾 Betriebsschuld getilgt: $' + fmtNum(pay), 'gold');
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateHeader === 'function') updateHeader();
}

function getBatteryUpgradeCost() {
  const tier = Number(G.powerBatteryTier || 0);
  return Math.ceil(2600 * Math.pow(1.75, tier) * Math.max(0.4, Number(G._buildCostMult || 1)));
}

function upgradePowerBattery() {
  const cost = getBatteryUpgradeCost();
  const btcCost = (typeof getPowerBtcTokenCost === 'function') ? getPowerBtcTokenCost('battery') : 0;
  if (Number(G.usd || 0) < cost) {
    notify('❌ Nicht genug USD fuer Akku-Ausbau! ($' + fmtNum(cost) + ')', 'error');
    return;
  }
  if (Number((G.coins || {}).BTC || 0) + 1e-9 < btcCost) {
    notify('❌ Nicht genug BTC fuer Akku-Ausbau! (₿' + fmtNum(btcCost, 4) + ')', 'error');
    return;
  }
  G.usd -= cost;
  if (btcCost > 0) {
    if (typeof spendCoin === 'function') {
      const spent = spendCoin('BTC', btcCost);
      if (!spent) {
        G.usd += cost;
        notify('BTC-Abbuchung fehlgeschlagen.', 'error');
        return;
      }
    } else {
      G.coins.BTC = Math.max(0, Number((G.coins || {}).BTC || 0) - btcCost);
    }
  }
  G.powerBatteryTier = Number(G.powerBatteryTier || 0) + 1;
  G.powerBatteryCapacityKwh = Number(G.powerBatteryCapacityKwh || 0) + 4.0;
  G.powerBatteryChargeRateKw = Number(G.powerBatteryChargeRateKw || 1.2) + 0.45;
  G.powerBatteryDischargeRateKw = Number(G.powerBatteryDischargeRateKw || 1.5) + 0.60;
  notify('🔋 Notstrom-Akku ausgebaut: +4.00 kWh (-$' + fmtNum(cost) + ', -₿' + fmtNum(btcCost, 4) + ')', 'success');
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateHeader === 'function') updateHeader();
}

function setRigLayoutForCurrentLocation(layoutId) {
  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  if (!location) {
    notify('❌ Standortdaten fehlen.', 'error');
    return;
  }
  const layouts = (typeof window.getAvailableRigLayouts === 'function') ? getAvailableRigLayouts(location.id) : [];
  const layout = layouts.find((x) => x.id === layoutId) || null;
  if (!layout) {
    notify('🔒 Layout an diesem Standort nicht verfuegbar.', 'error');
    return;
  }
  if (!G.rigLayoutByLocation || typeof G.rigLayoutByLocation !== 'object') G.rigLayoutByLocation = {};
  const prevLayout = String(G.rigLayoutByLocation[location.id] || '');
  G.rigLayoutByLocation[location.id] = layout.id;
  if (prevLayout !== layout.id) {
    G.layoutSwitchCount = Math.max(0, Number(G.layoutSwitchCount || 0)) + 1;
  }
  if (typeof computeLocationEffects === 'function') computeLocationEffects();
  if (typeof computeMultipliers === 'function') computeMultipliers();
  notify('🧱 Rig-Layout aktiv: ' + layout.name, 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function upgradeCoolingInfra() {
  const cost = (typeof window.getCoolingUpgradeCost === 'function') ? getCoolingUpgradeCost() : Infinity;
  if (!Number.isFinite(cost) || cost <= 0) return;
  if (Number(G.usd || 0) < cost) {
    notify('❌ Nicht genug USD fuer Cooling-Ausbau! ($' + fmtNum(cost) + ')', 'error');
    return;
  }
  G.usd -= cost;
  G.coolingInfraLevel = Math.max(0, Number(G.coolingInfraLevel || 0)) + 1;
  notify('🌡️ Cooling-Infrastruktur auf Level ' + G.coolingInfraLevel + ' ausgebaut.', 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function setCoolingMode(modeId) {
  const meta = (typeof window.getCoolingModeMeta === 'function') ? getCoolingModeMeta(modeId) : null;
  if (!meta) return;
  const nextMode = String(modeId || 'balanced');
  if (String(G.coolingMode || 'balanced') === nextMode) return;
  G.coolingMode = nextMode;
  G.coolingModeChanges = Math.max(0, Number(G.coolingModeChanges || 0)) + 1;
  G._coolingAutoSwitchCd = Math.max(0, Number((window.HV_POWER_AUTOMATION_BALANCE && window.HV_POWER_AUTOMATION_BALANCE.coolingSwitchCdSec) || 18));
  notify('❄️ Cooling-Modus: ' + (meta.label || G.coolingMode), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setCoolingAutoProfile(profileId) {
  const allowed = ['off', 'safe', 'balanced', 'aggressive'];
  const next = String(profileId || 'balanced');
  if (!allowed.includes(next)) return;
  if (String(G.coolingAutoProfile || 'balanced') === next) return;
  G.coolingAutoProfile = next;
  G.coolingAutoProfileChanges = Math.max(0, Number(G.coolingAutoProfileChanges || 0)) + 1;
  const labels = {
    off: 'Aus',
    safe: 'Sicher',
    balanced: 'Balanced',
    aggressive: 'Aggressiv Sparen',
  };
  notify('🤖 Cooling-Auto-Profil: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerOutageAutoPlan(planId) {
  const allowed = ['off', 'safe', 'balanced', 'greedy'];
  const next = String(planId || 'balanced');
  if (!allowed.includes(next)) return;
  if (String(G.powerOutageAutoPlan || 'balanced') === next) return;
  G.powerOutageAutoPlan = next;
  G.powerOutagePlanChanges = Math.max(0, Number(G.powerOutagePlanChanges || 0)) + 1;
  const labels = {
    off: 'Manuell',
    safe: 'Safety',
    balanced: 'Balanced',
    greedy: 'Durchsatz',
  };
  notify('⚡ Ausfall-Autoplan: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerRiskProfile(profileId) {
  const allowed = ['throughput', 'balanced', 'resilience', 'emergency'];
  const next = String(profileId || 'balanced');
  if (!allowed.includes(next)) return;
  if (String(G.powerRiskProfile || 'balanced') === next) return;
  G.powerRiskProfile = next;
  G.powerRiskProfileChanges = Math.max(0, Number(G.powerRiskProfileChanges || 0)) + 1;
  const labels = {
    throughput: 'Durchsatz',
    balanced: 'Balanced',
    resilience: 'Resilienz',
    emergency: 'Emergency',
  };
  notify('🧭 Grid Control: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerRiskAutoMode(modeId) {
  const allowed = ['off', 'assist', 'full'];
  const next = String(modeId || 'off');
  if (!allowed.includes(next)) return;
  if (String(G.powerRiskAutoMode || 'off') === next) return;
  G.powerRiskAutoMode = next;
  G.powerRiskAutoModeChanges = Math.max(0, Number(G.powerRiskAutoModeChanges || 0)) + 1;
  G.powerRiskAutoCooldown = 0;
  const labels = { off: 'Aus', assist: 'Assist', full: 'Full' };
  notify('🤖 Grid-Auto: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerCommandLink(enabled) {
  const next = !!enabled;
  if (!!G.powerCommandLinkEnabled === next) return;
  G.powerCommandLinkEnabled = next;
  G.powerCommandLinkChanges = Math.max(0, Number(G.powerCommandLinkChanges || 0)) + 1;
  G.powerCommandCooldown = 0;
  notify(next ? '🔗 Command-Link aktiviert.' : '⛔ Command-Link deaktiviert.', 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerLoadGuard(enabled, targetRaw) {
  const nextEnabled = !!enabled;
  const target = Math.max(0.55, Math.min(0.98, Number(targetRaw || 0.85)));
  const changed = (!!G.powerLoadGuardEnabled !== nextEnabled) || (Math.abs(Number(G.powerLoadGuardTarget || 0.85) - target) > 1e-9);
  if (!changed) return;
  G.powerLoadGuardEnabled = nextEnabled;
  G.powerLoadGuardTarget = target;
  if (!nextEnabled) G._powerLoadGuardActive = false;
  notify('🧯 Load Guard: ' + (nextEnabled ? ('EIN @ ' + fmtNum(target * 100, 0) + '%') : 'AUS'), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerBatteryStrategy(strategyId) {
  const allowed = ['balanced', 'peak_guard', 'arbitrage', 'reserve'];
  const next = String(strategyId || 'balanced');
  if (!allowed.includes(next)) return;
  if (String(G.powerBatteryStrategy || 'balanced') === next) return;
  G.powerBatteryStrategy = next;
  G.powerBatteryStrategyChanges = Math.max(0, Number(G.powerBatteryStrategyChanges || 0)) + 1;
  const labels = {
    balanced: 'Balanced',
    peak_guard: 'Peak Guard',
    arbitrage: 'Tarif-Arbitrage',
    reserve: 'Reserve',
  };
  notify('🔋 Akku-Strategie: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function setPowerTariffPolicy(policyId) {
  const allowed = ['off', 'cost_focus', 'balanced', 'rush'];
  const next = String(policyId || 'off');
  if (!allowed.includes(next)) return;
  if (String(G.powerTariffPolicy || 'off') === next) return;
  G.powerTariffPolicy = next;
  G.powerTariffPolicyChanges = Math.max(0, Number(G.powerTariffPolicyChanges || 0)) + 1;
  G.powerTariffPolicyCooldown = 0;
  const labels = {
    off: 'Aus',
    cost_focus: 'Kostenfokus',
    balanced: 'Balanced',
    rush: 'Rush Hour',
  };
  notify('🕒 Tarif-Policy: ' + (labels[next] || next), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function applyRecommendedPowerSetup() {
  const setup = (typeof window.getRecommendedPowerSetup === 'function')
    ? getRecommendedPowerSetup()
    : null;
  if (!setup) return;
  G.powerRiskProfile = String(setup.riskProfile || 'balanced');
  G.powerBatteryStrategy = String(setup.batteryStrategy || 'balanced');
  G.powerTariffPolicy = String(setup.tariffPolicy || 'balanced');
  G.powerLoadGuardEnabled = !!setup.loadGuardEnabled;
  G.powerLoadGuardTarget = Math.max(0.55, Math.min(0.98, Number(setup.loadGuardTarget || 0.85)));
  G.powerRiskProfileChanges = Math.max(0, Number(G.powerRiskProfileChanges || 0)) + 1;
  G.powerBatteryStrategyChanges = Math.max(0, Number(G.powerBatteryStrategyChanges || 0)) + 1;
  G.powerTariffPolicyChanges = Math.max(0, Number(G.powerTariffPolicyChanges || 0)) + 1;
  G.powerAdvisorRuns = Math.max(0, Number(G.powerAdvisorRuns || 0)) + 1;
  G.powerTariffPolicyCooldown = 0;
  notify('🧠 Power-Advisor: ' + String(setup.note || 'Setup angewendet.'), 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function applyRigBuildPreset(presetId) {
  const preset = (typeof window.getRigBuildPresetById === 'function') ? getRigBuildPresetById(presetId) : null;
  if (!preset) {
    notify('❌ Unbekanntes Build-Preset.', 'error');
    return;
  }
  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const locTier = Math.max(1, Number((location && location.tier) || 1));
  if (locTier < Math.max(1, Number(preset.minTier || 1))) {
    notify('🔒 Preset erst ab Standort-Tier ' + preset.minTier + '.', 'error');
    return;
  }
  G.rigBuildPresetSelected = preset.id;

  const beforeRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, n) => sum + Number(n || 0), 0);
  const beforeUsd = Number(G.usd || 0);

  const plan = preset.plan || {};
  Object.keys(plan).forEach((rigId) => {
    const wanted = Math.max(0, Math.floor(Number(plan[rigId] || 0)));
    if (wanted <= 0) return;
    const buyable = Math.max(0, Number((typeof getMaxBuyable === 'function') ? getMaxBuyable(rigId) : 0));
    const qty = Math.min(wanted, buyable);
    if (qty > 0 && typeof buyRig === 'function') buyRig(rigId, qty, { silent: true });
  });

  const afterRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, n) => sum + Number(n || 0), 0);
  const gained = Math.max(0, afterRigs - beforeRigs);
  const spent = Math.max(0, beforeUsd - Number(G.usd || 0));
  if (gained <= 0) {
    notify('ℹ️ Preset konnte wegen Limits/Budget nichts kaufen.', 'warning');
    return;
  }
  notify('📦 Preset gebaut: ' + preset.name + ' (+' + gained + ' Rigs, -$' + fmtNum(spent) + ')', 'gold');
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function batchSetRigCrewFocus(focusId) {
  const focusMap = window.HV_RIG_CREW_FOCUS || {};
  if (!focusMap[focusId]) return;
  if (!G.rigCrewFocus || typeof G.rigCrewFocus !== 'object') G.rigCrewFocus = {};
  (RIGS || []).forEach((rig) => {
    const count = Math.max(0, Number((G.rigs || {})[rig.id] || 0));
    if (count > 0) G.rigCrewFocus[rig.id] = focusId;
  });
}

function runRigCrewBatch(mode) {
  const m = String(mode || 'balanced');
  if (m === 'reset') {
    resetRigStaffAssignments();
    return;
  }
  if (m === 'throughput' || m === 'maintenance' || m === 'safety' || m === 'frugal' || m === 'balanced') {
    batchSetRigCrewFocus(m);
  }
  autoAssignRigStaff();
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function getLocationMoveCost(locationId) {
  const loc = (typeof window.getLocationById === 'function') ? getLocationById(locationId) : null;
  if (!loc) return Infinity;
  return Math.ceil(Math.max(0, Number(loc.moveCost || 0)) * Math.max(0.45, Number(G._buildCostMult || 1)));
}

function isLocationUnlocked(locationId) {
  const loc = (typeof window.getLocationById === 'function') ? getLocationById(locationId) : null;
  if (loc && Number(loc.tier || 1) <= Number(G.unlockedLocationTier || 1)) return true;
  if (typeof window.getLocationUnlockProgress !== 'function') return true;
  const info = getLocationUnlockProgress(locationId, G);
  return !!(info && info.unlocked);
}

function moveToLocation(locationId) {
  const loc = (typeof window.getLocationById === 'function') ? getLocationById(locationId) : null;
  const current = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  if (!loc || !current) {
    notify('❌ Standortdaten fehlen.', 'error');
    return;
  }
  if (loc.id === current.id) {
    notify('ℹ️ Bereits an diesem Standort.', 'warning');
    return;
  }
  if (Number(loc.tier || 0) <= Number(current.tier || 0)) {
    notify('❌ Nur hoehere Standorte sind verfuegbar.', 'error');
    return;
  }
  if (!isLocationUnlocked(loc.id)) {
    notify('🔒 Freischaltbedingungen fuer diesen Standort sind noch nicht erfuellt.', 'error');
    return;
  }

  const totalRigs = typeof getTotalRigCount === 'function'
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, value) => sum + Number(value || 0), 0);

  if (totalRigs > Number(loc.maxRigs || 0)) {
    notify('❌ Zu viele Rigs fuer diesen Standort.', 'error');
    return;
  }

  const moveCost = getLocationMoveCost(locationId);
  if (Number(G.usd || 0) < moveCost) {
    notify('❌ Nicht genug USD fuer Umzug! ($' + fmtNum(moveCost) + ')', 'error');
    return;
  }

  G.usd -= moveCost;
  G.locationId = loc.id;
  G.unlockedLocationTier = Math.max(Number(G.unlockedLocationTier || 1), Number(loc.tier || 1));
  const dayNow = Math.max(1, Math.floor(Number(G.worldDay || 1)));
  G.locationMoveBoostUntilDay = dayNow + 1; // 1 Ingame-Tag Startbonus
  notify('🏢 Umzug abgeschlossen: ' + loc.name, 'success');
  notify('🚚 Umzugsboost aktiv bis Tag ' + G.locationMoveBoostUntilDay + ' (+8% H/s).', 'gold');
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateHeader === 'function') updateHeader();
}

function buyLocationShopItem(itemId) {
  const item = (typeof window.getLocationShopItemById === 'function')
    ? getLocationShopItemById(itemId)
    : null;
  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  if (!item || !location) {
    notify('❌ Item oder Standortdaten fehlen.', 'error');
    return;
  }
  if (Number(location.tier || 1) < Number(item.minTier || 1)) {
    notify('🔒 Item erst ab Standort-Tier ' + Number(item.minTier || 1) + ' verfuegbar.', 'error');
    return;
  }
  if (typeof window.ensureLocationShopState === 'function') ensureLocationShopState(G);
  if (!G.locationShopPurchases || typeof G.locationShopPurchases !== 'object') G.locationShopPurchases = {};
  const locId = String(location.id || 'home_pc');
  const owned = (typeof window.getLocationShopOwnedIds === 'function')
    ? getLocationShopOwnedIds(locId, G)
    : (Array.isArray(G.locationShopPurchases[locId]) ? G.locationShopPurchases[locId] : []);
  if (owned.includes(item.id)) {
    notify('ℹ️ Item bereits an diesem Standort gekauft.', 'warning');
    return;
  }
  const slotCap = (typeof window.getLocationShopSlotCap === 'function')
    ? getLocationShopSlotCap(locId, G)
    : 5;
  if (owned.length >= slotCap) {
    notify('❌ Standort-Shop voll (' + owned.length + '/' + slotCap + ' Slots).', 'error');
    return;
  }
  const cost = (typeof window.getLocationShopItemCost === 'function')
    ? getLocationShopItemCost(item.id, G)
    : Math.max(0, Number(item.cost || 0));
  if (Number(G.usd || 0) < cost) {
    notify('❌ Nicht genug USD fuer ' + item.name + '! ($' + fmtNum(cost) + ')', 'error');
    return;
  }

  G.usd -= cost;
  owned.push(item.id);
  G.locationShopPurchases[locId] = owned;
  if (typeof computeLocationEffects === 'function') computeLocationEffects();
  if (typeof computeMultipliers === 'function') computeMultipliers();
  notify('🛒 Standort-Item gekauft: ' + item.name + ' (-$' + fmtNum(cost) + ')', 'success');
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function setRigCrewFocus(rigId, focusId) {
  const rig = (RIGS || []).find((x) => x.id === rigId);
  const focusMap = window.HV_RIG_CREW_FOCUS || {};
  if (!rig || !focusMap[focusId]) return;
  if (!G.rigCrewFocus || typeof G.rigCrewFocus !== 'object') G.rigCrewFocus = {};
  G.rigCrewFocus[rigId] = focusId;
  notify('🎯 Crew-Fokus gesetzt: ' + rig.name + ' -> ' + focusMap[focusId].label, 'success');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function getRigStaffAssignedTotal(tierId) {
  if (typeof getTotalAssignedRigStaffByTier === 'function') {
    return getTotalAssignedRigStaffByTier(tierId);
  }
  return 0;
}

function hireRigStaff(tierId) {
  const tier = (typeof window.getRigStaffTierById === 'function') ? getRigStaffTierById(tierId) : null;
  if (!tier) return;
  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  if (!Number.isFinite(G.hiredRigStaff[tierId])) G.hiredRigStaff[tierId] = 0;

  const cost = (typeof getRigStaffHireCost === 'function')
    ? getRigStaffHireCost(tierId)
    : Number(tier.hireBaseCost || 0);
  if (Number(G.usd || 0) < cost) {
    notify('❌ Nicht genug USD fuer Einstellung! ($' + fmtNum(cost) + ')', 'error');
    return;
  }

  G.usd -= cost;
  G.hiredRigStaff[tierId] += 1;
  notify('👷 ' + tier.name + ' eingestellt.', 'success');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function fireRigStaff(tierId) {
  const tier = (typeof window.getRigStaffTierById === 'function') ? getRigStaffTierById(tierId) : null;
  if (!tier) return;
  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  const hired = Math.max(0, Number(G.hiredRigStaff[tierId] || 0));
  if (hired <= 0) {
    notify('ℹ️ Kein ' + tier.name + ' zum Entlassen vorhanden.', 'warning');
    return;
  }

  const assigned = getRigStaffAssignedTotal(tierId);
  const free = Math.max(0, hired - assigned);
  if (free <= 0) {
    notify('❌ Kein freier ' + tier.name + '. Erst Zuweisung reduzieren.', 'error');
    return;
  }

  G.hiredRigStaff[tierId] = Math.max(0, hired - 1);
  notify('🧾 ' + tier.name + ' entlassen.', 'warning');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function assignRigStaff(rigId, tierId, delta) {
  const rig = (RIGS || []).find((x) => x.id === rigId);
  const tier = (typeof window.getRigStaffTierById === 'function') ? getRigStaffTierById(tierId) : null;
  if (!rig || !tier) return;

  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  if (!G.rigStaffAssignments || typeof G.rigStaffAssignments !== 'object') G.rigStaffAssignments = {};
  if (!G.rigStaffAssignments[rigId] || typeof G.rigStaffAssignments[rigId] !== 'object') {
    G.rigStaffAssignments[rigId] = {};
  }

  const current = Number(G.rigStaffAssignments[rigId][tierId] || 0);
  if (!Number.isFinite(current)) G.rigStaffAssignments[rigId][tierId] = 0;
  if (delta < 0 && current <= 0) return;
  if (delta > 0 && Number((G.rigs || {})[rigId] || 0) <= 0) {
    notify('❌ Keine aktiven ' + rig.name + '-Rigs fuer Zuweisung.', 'error');
    return;
  }

  const hired = Number(G.hiredRigStaff[tierId] || 0);
  const assignedGlobal = getRigStaffAssignedTotal(tierId);
  if (delta > 0 && assignedGlobal >= hired) {
    notify('❌ Keine freie ' + tier.name + '-Kapazitaet.', 'error');
    return;
  }

  G.rigStaffAssignments[rigId][tierId] = Math.max(0, current + delta);
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function resetRigStaffAssignments() {
  if (!G.rigStaffAssignments || typeof G.rigStaffAssignments !== 'object') G.rigStaffAssignments = {};
  (RIGS || []).forEach((rig) => {
    G.rigStaffAssignments[rig.id] = {};
  });
  notify('♻️ Alle Rig-Crew-Zuweisungen zurueckgesetzt.', 'success');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function autoAssignRigStaff() {
  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  if (!G.rigStaffAssignments || typeof G.rigStaffAssignments !== 'object') G.rigStaffAssignments = {};
  const tiers = Array.isArray(window.RIG_STAFF_TIERS) ? window.RIG_STAFF_TIERS.slice() : [];
  if (!tiers.length) return;

  const remaining = {};
  tiers.forEach((tier) => {
    remaining[tier.id] = Math.max(0, Math.floor(Number(G.hiredRigStaff[tier.id] || 0)));
  });

  (RIGS || []).forEach((rig) => { G.rigStaffAssignments[rig.id] = {}; });

  const activeRigs = (RIGS || [])
    .map((rig) => ({ rigId: rig.id, count: Math.max(0, Number((G.rigs || {})[rig.id] || 0)) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  if (!activeRigs.length) {
    notify('ℹ️ Keine aktiven Rigs fuer Auto-Zuweisung.', 'warning');
    if (typeof renderRigCrew === 'function') renderRigCrew();
    return;
  }

  // Hoehere Stufen zuerst: maximale Abdeckung mit wenig Personal.
  const tierOrder = tiers.sort((a, b) => Number(b.rigsPerUnit || 0) - Number(a.rigsPerUnit || 0));

  activeRigs.forEach((entry) => {
    let need = entry.count;
    tierOrder.forEach((tier) => {
      const free = Math.max(0, Number(remaining[tier.id] || 0));
      if (free <= 0 || need <= 0) return;
      const capPerUnit = Math.max(1, Number(tier.rigsPerUnit || 1));
      const units = Math.min(free, Math.ceil(need / capPerUnit));
      if (units <= 0) return;
      G.rigStaffAssignments[entry.rigId][tier.id] = units;
      remaining[tier.id] = free - units;
      need = Math.max(0, need - units * capPerUnit);
    });
  });

  notify('🤖 Rig-Crew automatisch pro Rig-Typ zugewiesen.', 'success');
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderRigs === 'function') renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function handlePowerAction(action) {
  if (action === 'upgrade') {
    upgradePowerCapacity();
    return;
  }
  if (action === 'batteryupg') {
    upgradePowerBattery();
    return;
  }
  if (action === 'coolingupg') {
    upgradeCoolingInfra();
    return;
  }
  if (action === 'coolmode') {
    const select = document.getElementById('power-cooling-mode-select');
    if (!select) return;
    setCoolingMode(select.value);
    return;
  }
  if (action === 'coolauto') {
    const select = document.getElementById('power-cooling-auto-select');
    if (!select) return;
    setCoolingAutoProfile(select.value);
    return;
  }
  if (action === 'outageplan') {
    const select = document.getElementById('power-outage-plan-select');
    if (!select) return;
    setPowerOutageAutoPlan(select.value);
    return;
  }
  if (action === 'riskprofile') {
    const select = document.getElementById('power-risk-profile-select');
    if (!select) return;
    setPowerRiskProfile(select.value);
    return;
  }
  if (action === 'riskauto') {
    const select = document.getElementById('power-risk-auto-select');
    if (!select) return;
    setPowerRiskAutoMode(select.value);
    return;
  }
  if (action === 'commandlink') {
    const select = document.getElementById('power-command-link-select');
    if (!select) return;
    setPowerCommandLink(String(select.value) === 'on');
    return;
  }
  if (action === 'loadguard') {
    const modeEl = document.getElementById('power-load-guard-select');
    const targetEl = document.getElementById('power-load-guard-target-select');
    if (!modeEl || !targetEl) return;
    const enabled = String(modeEl.value) === 'on';
    const target = Number(targetEl.value || 0.85);
    setPowerLoadGuard(enabled, target);
    return;
  }
  if (action === 'batterystrategy') {
    const select = document.getElementById('power-battery-strategy-select');
    if (!select) return;
    setPowerBatteryStrategy(select.value);
    return;
  }
  if (action === 'tariffpolicy') {
    const select = document.getElementById('power-tariff-policy-select');
    if (!select) return;
    setPowerTariffPolicy(select.value);
    return;
  }
  if (action === 'advisor') {
    applyRecommendedPowerSetup();
    return;
  }
  if (action === 'layout') {
    const select = document.getElementById('power-layout-select');
    if (!select) return;
    setRigLayoutForCurrentLocation(select.value);
    return;
  }
  if (action === 'provider') {
    const select = document.getElementById('power-provider-select');
    if (!select) return;
    setPowerProvider(select.value);
    return;
  }
  if (action === 'loan') {
    const select = document.getElementById('loan-plan-select');
    if (!select) return;
    takeLoan(select.value);
    return;
  }
  if (action === 'repayloan') {
    repayAllLoans();
    return;
  }
  if (action === 'insurance') {
    toggleInsurance();
    return;
  }
  if (action === 'relocate') {
    const select = document.getElementById('power-location-select');
    if (!select) return;
    moveToLocation(select.value);
  }
}

// ── Rig Mod System ──────────────────────────────────────────
function setRigMod(rigId, modId) {
  const mod = (window.RIG_MODS || {})[modId];
  if (!mod) {
    notify('❌ Unbekannte Mod.', 'error');
    return;
  }

  if (!G.rigMods) G.rigMods = {};
  if (!G.rigMods[rigId]) G.rigMods[rigId] = [];

  const mods = G.rigMods[rigId];
  if (mods.includes(modId)) {
    mods.splice(mods.indexOf(modId), 1);
    notify('❌ Mod entfernt!', 'warning');
  } else if (mods.length < 2) {
    G.unlockedMods = G.unlockedMods || [];
    if (!G.unlockedMods.includes(modId)) {
      notify('🔒 Mod noch nicht freigeschaltet.', 'error');
      return;
    }
    mods.push(modId);
    notify('✅ Mod installiert!', 'success');
  } else {
    notify('❌ Max. 2 Mods pro Rig!', 'error');
    return;
  }

  computeMultipliers();
  renderRigs();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

// ── Initialisierung ──────────────────────────────────────────
function init() {
  const pCfg = window.HV_POWER_BALANCE || {};
  const powerStartCap = Math.max(0.5, Number(pCfg.startCapacityKw || 3.0));
  const powerBasePrice = Math.max(0.01, Number(pCfg.basePricePerKwh || 0.20));
  const powerBillInterval = 86400;

  // Hintergrund starten
  initBg();

  // Spielstand laden
  loadGame();

  // Nickname aus dem Startbildschirm uebernehmen (neues Spiel).
  if (typeof window.HV_PENDING_PROFILE_NAME === 'string') {
    const pendingName = window.HV_PENDING_PROFILE_NAME.trim().slice(0, 18);
    if (pendingName) G.profileName = pendingName;
    window.HV_PENDING_PROFILE_NAME = '';
  }
  if (!G.profileName || !String(G.profileName).trim()) {
    const slotIdx = Number(window.HV_ACTIVE_SLOT);
    const slotNo = Number.isInteger(slotIdx) && slotIdx >= 0 ? (slotIdx + 1) : 1;
    G.profileName = 'Miner ' + slotNo;
  }
  
  // ── Neue Features initialisieren ──────────────────────────────────
  // Diese müssen NACH loadGame() aufgerufen werden, damit G.* verwendet werden kann
  if (!G.dailyChallenges || G.dailyChallenges.length === 0) {
    G.dailyChallenges = getDailyChallenges().map(c => ({
      id: c.id,
      name: c.name,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }
  if (!G.npcTraders || Object.keys(G.npcTraders).length === 0) {
    G.npcTraders = generateNPCDealsForDay();
    G.npcUsedToday = {};
  }
  if (!G.goalsClaimed) {
    G.goalsClaimed = {};
  }
  if (!Number.isFinite(G.storyMissionIndex) || G.storyMissionIndex < 0) G.storyMissionIndex = 0;
  if (!G.storyMissionsClaimed || typeof G.storyMissionsClaimed !== 'object') G.storyMissionsClaimed = {};
  if (!Number.isFinite(G.tutorialStep) || G.tutorialStep < 0) G.tutorialStep = 0;
  if (typeof G.tutorialEnabled !== 'boolean') G.tutorialEnabled = true;
  if (typeof G.tutorialCompleted !== 'boolean') G.tutorialCompleted = false;
  if (typeof window.ensureHoldMiningState === 'function') ensureHoldMiningState();
  if (!G.miningStreaks) {
    G.miningStreaks = { BTC:0, ETH:0, LTC:0, BNB:0 };
  }
  if (!G.autoSellCoins || typeof G.autoSellCoins !== 'object') G.autoSellCoins = {};
  Object.keys(COIN_DATA || { BTC:1, ETH:1, LTC:1, BNB:1 }).forEach((coin) => {
    if (typeof G.autoSellCoins[coin] !== 'boolean') G.autoSellCoins[coin] = false;
  });
  if (G.autoSell && !Object.values(G.autoSellCoins).some(Boolean)) {
    Object.keys(G.autoSellCoins).forEach((coin) => { G.autoSellCoins[coin] = true; });
  }
  G.autoSell = false;
  if (!G.coins || typeof G.coins !== 'object') G.coins = {};
  Object.keys(COIN_DATA || { BTC:1, ETH:1, LTC:1, BNB:1 }).forEach((coin) => {
    if (!Number.isFinite(G.coins[coin]) || G.coins[coin] < 0) G.coins[coin] = 0;
  });
  if (!G.staff || typeof G.staff !== 'object') G.staff = {};
  (STAFF || []).forEach((s) => {
    if (!Number.isFinite(G.staff[s.id]) || G.staff[s.id] < 0) G.staff[s.id] = 0;
  });
  if (!G.coinReserves || typeof G.coinReserves !== 'object') G.coinReserves = {};
  if (typeof ensureCoinReserveState === 'function') ensureCoinReserveState();
  if (typeof G.uiRigSort !== 'string' || !G.uiRigSort) G.uiRigSort = 'tier';
  if (typeof G.uiRigOwnedOnly !== 'boolean') G.uiRigOwnedOnly = false;
  if (typeof G.debugOverlay !== 'boolean') G.debugOverlay = false;
  if (!Number.isFinite(G.debugCheatUsd) || Number(G.debugCheatUsd) <= 0) G.debugCheatUsd = 1000000;
  if (!G.rigMods) {
    G.rigMods = {};
    (RIGS || []).forEach(rig => { G.rigMods[rig.id] = []; });
  }
  if (!G.rigs || typeof G.rigs !== 'object') G.rigs = {};
  (RIGS || []).forEach((rig) => {
    if (!Number.isFinite(G.rigs[rig.id]) || G.rigs[rig.id] < 0) G.rigs[rig.id] = 0;
  });
  if (!G.modLevels || typeof G.modLevels !== 'object') G.modLevels = {};
  if (!Number.isFinite(G.modParts) || G.modParts < 0) G.modParts = 0;
  if (!Number.isFinite(G._modPartTimer) || G._modPartTimer < 0) G._modPartTimer = 0;
  if (!G.locationId) G.locationId = 'home_pc';
  if (!G.rigLayoutByLocation || typeof G.rigLayoutByLocation !== 'object') G.rigLayoutByLocation = {};
  if (!G.rigHeat || typeof G.rigHeat !== 'object') G.rigHeat = {};
  if (typeof G.rigBuildPresetSelected !== 'string' || !G.rigBuildPresetSelected) G.rigBuildPresetSelected = 'starter_balanced';
  if (typeof window.ensureLocationShopState === 'function') ensureLocationShopState(G);
  if (!G.locationShopPurchases || typeof G.locationShopPurchases !== 'object') G.locationShopPurchases = {};
  if (!Number.isFinite(G.unlockedLocationTier) || G.unlockedLocationTier < 1) G.unlockedLocationTier = 1;
  if (!Number.isFinite(G.locationMoveBoostUntilDay) || G.locationMoveBoostUntilDay < 0) G.locationMoveBoostUntilDay = 0;
  if (typeof window.getCurrentLocation === 'function') {
    const curLoc = getCurrentLocation();
    if (curLoc) {
      G.unlockedLocationTier = Math.max(Number(G.unlockedLocationTier || 1), Number(curLoc.tier || 1));
    }
  }
  if (!G.hiredRigStaff || typeof G.hiredRigStaff !== 'object') G.hiredRigStaff = {};
  if (!G.rigStaffAssignments || typeof G.rigStaffAssignments !== 'object') G.rigStaffAssignments = {};
  if (!G.rigCrewProgress || typeof G.rigCrewProgress !== 'object') G.rigCrewProgress = {};
  if (!G.rigCrewFocus || typeof G.rigCrewFocus !== 'object') G.rigCrewFocus = {};
  if (!G.rigAutoRepair || typeof G.rigAutoRepair !== 'object') G.rigAutoRepair = {};
  (RIGS || []).forEach(rig => {
    if (!G.rigStaffAssignments[rig.id] || typeof G.rigStaffAssignments[rig.id] !== 'object') {
      G.rigStaffAssignments[rig.id] = {};
    }
    if (!Number.isFinite(G.rigHeat[rig.id])) G.rigHeat[rig.id] = 8;
    if (typeof G.rigCrewFocus[rig.id] !== 'string' || !(window.HV_RIG_CREW_FOCUS || {})[G.rigCrewFocus[rig.id]]) {
      G.rigCrewFocus[rig.id] = 'balanced';
    }
    if (typeof G.rigAutoRepair[rig.id] !== 'boolean') G.rigAutoRepair[rig.id] = false;
  });
  (window.LOCATIONS || []).forEach((loc) => {
    if (!loc || !loc.id) return;
    if (typeof G.rigLayoutByLocation[loc.id] !== 'string' || !G.rigLayoutByLocation[loc.id]) {
      G.rigLayoutByLocation[loc.id] = 'balanced_grid';
    }
  });
  (window.RIG_STAFF_TIERS || []).forEach((tier) => {
    if (!G.rigCrewProgress[tier.id] || typeof G.rigCrewProgress[tier.id] !== 'object') {
      G.rigCrewProgress[tier.id] = { level: 1, xp: 0, spec: 'balanced' };
    }
    const p = G.rigCrewProgress[tier.id];
    if (!Number.isFinite(p.level) || p.level < 1) p.level = 1;
    if (!Number.isFinite(p.xp) || p.xp < 0) p.xp = 0;
    if (typeof p.spec !== 'string' || !p.spec) p.spec = 'balanced';
  });
  if (!Number.isFinite(G.powerInfraLevel)) G.powerInfraLevel = 0;
  if (!Number.isFinite(G.powerCapacityKw) || G.powerCapacityKw <= 0) G.powerCapacityKw = powerStartCap;
  if (!Number.isFinite(G.powerPriceBase) || G.powerPriceBase <= 0) G.powerPriceBase = powerBasePrice;
  if (!Number.isFinite(G.powerBillInterval) || G.powerBillInterval <= 0) G.powerBillInterval = powerBillInterval;
  if (!Number.isFinite(G.powerBillTimer) || G.powerBillTimer <= 0) G.powerBillTimer = G.powerBillInterval;
  if (typeof G.powerProviderId !== 'string' || !G.powerProviderId) G.powerProviderId = 'spot';
  if (!Number.isFinite(G.powerProviderLockedUntilDay) || G.powerProviderLockedUntilDay < 1) G.powerProviderLockedUntilDay = 1;
  if (!Number.isFinite(G.powerPeakPenaltyAccrued) || G.powerPeakPenaltyAccrued < 0) G.powerPeakPenaltyAccrued = 0;
  if (!Number.isFinite(G.powerBatteryTier) || G.powerBatteryTier < 0) G.powerBatteryTier = 0;
  if (!Number.isFinite(G.powerBatteryCapacityKwh) || G.powerBatteryCapacityKwh < 0) G.powerBatteryCapacityKwh = 0;
  if (!Number.isFinite(G.powerBatteryLevelKwh) || G.powerBatteryLevelKwh < 0) G.powerBatteryLevelKwh = 0;
  if (!Number.isFinite(G.powerBatteryChargeRateKw) || G.powerBatteryChargeRateKw <= 0) G.powerBatteryChargeRateKw = 1.2;
  if (!Number.isFinite(G.powerBatteryDischargeRateKw) || G.powerBatteryDischargeRateKw <= 0) G.powerBatteryDischargeRateKw = 1.5;
  if (!Number.isFinite(G.powerBatteryCycleLoss) || G.powerBatteryCycleLoss < 0) G.powerBatteryCycleLoss = 0.03;
  if (typeof G.powerBatteryMode !== 'string') G.powerBatteryMode = 'idle';
  if (!Number.isFinite(G.powerBatteryGridOffsetKw)) G.powerBatteryGridOffsetKw = 0;
  if (!Number.isFinite(G.coolingInfraLevel) || G.coolingInfraLevel < 0) G.coolingInfraLevel = 0;
  if (typeof G.coolingMode !== 'string' || !['eco', 'balanced', 'turbo'].includes(G.coolingMode)) G.coolingMode = 'balanced';
  if (typeof G.coolingAutoProfile !== 'string' || !['off', 'safe', 'balanced', 'aggressive'].includes(G.coolingAutoProfile)) {
    G.coolingAutoProfile = 'balanced';
  }
  if (!Number.isFinite(G._coolingAutoSwitchCd) || G._coolingAutoSwitchCd < 0) G._coolingAutoSwitchCd = 0;
  if (!Number.isFinite(G.coolingPowerKw) || G.coolingPowerKw < 0) G.coolingPowerKw = 0;
  if (typeof G.powerOutageAutoPlan !== 'string' || !['off', 'safe', 'balanced', 'greedy'].includes(G.powerOutageAutoPlan)) {
    G.powerOutageAutoPlan = 'balanced';
  }
  if (typeof G.powerRiskProfile !== 'string' || !['throughput', 'balanced', 'resilience', 'emergency'].includes(G.powerRiskProfile)) {
    G.powerRiskProfile = 'balanced';
  }
  if (typeof G.powerRiskAutoMode !== 'string' || !['off', 'assist', 'full'].includes(G.powerRiskAutoMode)) {
    G.powerRiskAutoMode = 'off';
  }
  if (!Number.isFinite(G.powerRiskAutoCooldown) || G.powerRiskAutoCooldown < 0) G.powerRiskAutoCooldown = 0;
  if (typeof G.powerCommandLinkEnabled !== 'boolean') G.powerCommandLinkEnabled = true;
  if (!Number.isFinite(G.powerCommandCooldown) || G.powerCommandCooldown < 0) G.powerCommandCooldown = 0;
  if (typeof G.powerLoadGuardEnabled !== 'boolean') G.powerLoadGuardEnabled = false;
  if (!Number.isFinite(G.powerLoadGuardTarget) || G.powerLoadGuardTarget <= 0) G.powerLoadGuardTarget = 0.85;
  G.powerLoadGuardTarget = Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85)));
  if (typeof G._powerLoadGuardActive !== 'boolean') G._powerLoadGuardActive = false;
  if (typeof G.powerBatteryStrategy !== 'string' || !['balanced', 'peak_guard', 'arbitrage', 'reserve'].includes(G.powerBatteryStrategy)) {
    G.powerBatteryStrategy = 'balanced';
  }
  if (typeof G.powerTariffPolicy !== 'string' || !['off', 'cost_focus', 'balanced', 'rush'].includes(G.powerTariffPolicy)) {
    G.powerTariffPolicy = 'off';
  }
  if (!Number.isFinite(G._powerBatteryStrategySavingsUsd) || G._powerBatteryStrategySavingsUsd < 0) G._powerBatteryStrategySavingsUsd = 0;
  if (!Number.isFinite(G.powerTariffPolicyCooldown) || G.powerTariffPolicyCooldown < 0) G.powerTariffPolicyCooldown = 0;
  if (!Number.isFinite(G.layoutSwitchCount) || G.layoutSwitchCount < 0) G.layoutSwitchCount = 0;
  if (!Number.isFinite(G.coolingModeChanges) || G.coolingModeChanges < 0) G.coolingModeChanges = 0;
  if (!Number.isFinite(G.outageDecisions) || G.outageDecisions < 0) G.outageDecisions = 0;
  if (!Number.isFinite(G.outageEventsSeen) || G.outageEventsSeen < 0) G.outageEventsSeen = 0;
  if (!Number.isFinite(G.outageAutoResolved) || G.outageAutoResolved < 0) G.outageAutoResolved = 0;
  if (!Number.isFinite(G.outageManualResolved) || G.outageManualResolved < 0) G.outageManualResolved = 0;
  if (!Number.isFinite(G.powerRiskProfileChanges) || G.powerRiskProfileChanges < 0) G.powerRiskProfileChanges = 0;
  if (!Number.isFinite(G.powerRiskAutoModeChanges) || G.powerRiskAutoModeChanges < 0) G.powerRiskAutoModeChanges = 0;
  if (!Number.isFinite(G.powerCommandLinkChanges) || G.powerCommandLinkChanges < 0) G.powerCommandLinkChanges = 0;
  if (!Number.isFinite(G.powerRiskAutoSwitches) || G.powerRiskAutoSwitches < 0) G.powerRiskAutoSwitches = 0;
  if (!Number.isFinite(G.powerCommandSyncs) || G.powerCommandSyncs < 0) G.powerCommandSyncs = 0;
  if (!Number.isFinite(G.powerLoadGuardActions) || G.powerLoadGuardActions < 0) G.powerLoadGuardActions = 0;
  if (!Number.isFinite(G.powerProviderChanges) || G.powerProviderChanges < 0) G.powerProviderChanges = 0;
  if (!Number.isFinite(G.powerOutagePlanChanges) || G.powerOutagePlanChanges < 0) G.powerOutagePlanChanges = 0;
  if (!Number.isFinite(G.coolingAutoProfileChanges) || G.coolingAutoProfileChanges < 0) G.coolingAutoProfileChanges = 0;
  if (!Number.isFinite(G.powerBatteryStrategyChanges) || G.powerBatteryStrategyChanges < 0) G.powerBatteryStrategyChanges = 0;
  if (!Number.isFinite(G.powerTariffPolicyChanges) || G.powerTariffPolicyChanges < 0) G.powerTariffPolicyChanges = 0;
  if (!Number.isFinite(G.powerTariffPolicySyncs) || G.powerTariffPolicySyncs < 0) G.powerTariffPolicySyncs = 0;
  if (!Number.isFinite(G.powerAdvisorRuns) || G.powerAdvisorRuns < 0) G.powerAdvisorRuns = 0;
  if (!Number.isFinite(G.powerOutageCooldown) || G.powerOutageCooldown < 0) G.powerOutageCooldown = 0;
  if (!Number.isFinite(G._powerOutageSpawnChancePerSec) || G._powerOutageSpawnChancePerSec < 0) G._powerOutageSpawnChancePerSec = 0;
  if (!Number.isFinite(G._powerRiskPerfMult) || G._powerRiskPerfMult <= 0) G._powerRiskPerfMult = 1;
  if (!Number.isFinite(G._powerRiskPriceMult) || G._powerRiskPriceMult <= 0) G._powerRiskPriceMult = 1;
  if (!Number.isFinite(G._powerRiskCrashMult) || G._powerRiskCrashMult <= 0) G._powerRiskCrashMult = 1;
  if (!Number.isFinite(G._powerRiskOutageMult) || G._powerRiskOutageMult <= 0) G._powerRiskOutageMult = 1;
  if (!Number.isFinite(G.powerOutageBuffRemaining) || G.powerOutageBuffRemaining < 0) G.powerOutageBuffRemaining = 0;
  if (!Number.isFinite(G._powerOutageBuffPerfMult) || G._powerOutageBuffPerfMult <= 0) G._powerOutageBuffPerfMult = 1;
  if (!Number.isFinite(G._powerOutageBuffPriceMult) || G._powerOutageBuffPriceMult <= 0) G._powerOutageBuffPriceMult = 1;
  if (!Number.isFinite(G._powerOutageBuffCapMult) || G._powerOutageBuffCapMult <= 0) G._powerOutageBuffCapMult = 1;
  if (!Number.isFinite(G._powerOutageBuffCrashMult) || G._powerOutageBuffCrashMult <= 0) G._powerOutageBuffCrashMult = 1;
  if (!Number.isFinite(G._powerDecisionPerfMult) || G._powerDecisionPerfMult <= 0) G._powerDecisionPerfMult = 1;
  if (!Number.isFinite(G._powerDecisionPriceMult) || G._powerDecisionPriceMult <= 0) G._powerDecisionPriceMult = 1;
  if (!Number.isFinite(G._powerDecisionCapMult) || G._powerDecisionCapMult <= 0) G._powerDecisionCapMult = 1;
  if (!Number.isFinite(G._powerDecisionCrashMult) || G._powerDecisionCrashMult <= 0) G._powerDecisionCrashMult = 1;
  if (!G.powerOutage || typeof G.powerOutage !== 'object') G.powerOutage = null;
  if (!Array.isArray(G.dailyBillHistory)) G.dailyBillHistory = [];
  if (!Number.isFinite(G.dailyLastBilledDay) || G.dailyLastBilledDay < 0) G.dailyLastBilledDay = Math.max(0, Math.floor(G.worldDay || 1) - 1);
  if (!Number.isFinite(G.dailyOpsDebt) || G.dailyOpsDebt < 0) G.dailyOpsDebt = 0;
  G.powerDebt = 0;
  G.dailyOpsDebt = 0;
  G.opsDebtStage = 0;
  G.opsDebtStageLabel = 'Stabil';
  G.opsDebtStrikeDays = 0;
  G._opsShutdown = false;
  G._opsPassiveIncomeMult = 1;
  if (!Array.isArray(G.loans)) G.loans = [];
  if (!Number.isFinite(G.nextLoanId) || G.nextLoanId < 1) G.nextLoanId = 1;
  if (typeof G.insuranceActive !== 'boolean') G.insuranceActive = false;
  if (!Number.isFinite(G.insuranceTier) || G.insuranceTier < 0) G.insuranceTier = 0;
  if (!G.leasedRigs || typeof G.leasedRigs !== 'object') G.leasedRigs = {};
  if (!G.lastFinanceBill || typeof G.lastFinanceBill !== 'object') G.lastFinanceBill = null;
  (RIGS || []).forEach((rig) => {
    if (!Number.isFinite(G.leasedRigs[rig.id]) || G.leasedRigs[rig.id] < 0) G.leasedRigs[rig.id] = 0;
  });
  if (!Number.isFinite(G.worldDay) || G.worldDay < 1) G.worldDay = 1;
  if (!Number.isFinite(G.worldTimeMinutes) || G.worldTimeMinutes < 0) G.worldTimeMinutes = 8 * 60;
  if (!Number.isFinite(G._timeScaleMinPerSec) || G._timeScaleMinPerSec <= 0) G._timeScaleMinPerSec = 1;
  if (!Number.isFinite(G.contractRefresh) || G.contractRefresh <= 0 || G.contractRefresh > 1800 || G.contractRefresh < 900) {
    G.contractRefresh = 1800;
  }
  if (typeof G.marketRegime !== 'string' || !['bull', 'bear', 'range'].includes(G.marketRegime)) G.marketRegime = 'range';
  if (!Number.isFinite(G.marketRegimeTimer) || G.marketRegimeTimer <= 0) G.marketRegimeTimer = 180;
  if (!Number.isFinite(G.marketRegimeDrift)) G.marketRegimeDrift = 0;
  if (!Number.isFinite(G.marketRegimeVolMult) || G.marketRegimeVolMult <= 0) G.marketRegimeVolMult = 1;
  if (!Number.isFinite(G.marketShockTimer) || G.marketShockTimer < 0) G.marketShockTimer = 0;
  if (!Number.isFinite(G.marketShockDir)) G.marketShockDir = 0;
  if (!Number.isFinite(G.marketShockAmp) || G.marketShockAmp < 0) G.marketShockAmp = 0;
  if (!G.marketMomentum || typeof G.marketMomentum !== 'object') G.marketMomentum = {};
  if (!G.marketEventDrift || typeof G.marketEventDrift !== 'object') G.marketEventDrift = {};
  if (!G.marketEventDriftTimer || typeof G.marketEventDriftTimer !== 'object') G.marketEventDriftTimer = {};
  Object.keys(COIN_DATA || { BTC:1, ETH:1, LTC:1, BNB:1 }).forEach((coin) => {
    if (!Number.isFinite(G.marketMomentum[coin])) G.marketMomentum[coin] = 0;
    if (!Number.isFinite(G.marketEventDrift[coin])) G.marketEventDrift[coin] = 0;
    if (!Number.isFinite(G.marketEventDriftTimer[coin]) || G.marketEventDriftTimer[coin] < 0) {
      G.marketEventDriftTimer[coin] = 0;
    }
  });

  if (typeof ensureRigLayoutState === 'function') ensureRigLayoutState();
  if (typeof ensureRigHeatState === 'function') ensureRigHeatState();
  if (typeof ensurePowerOutageState === 'function') ensurePowerOutageState();
  if (typeof computeLocationEffects === 'function') computeLocationEffects();
  if (typeof checkRigModUnlocks === 'function') checkRigModUnlocks(false);
  
  computeMultipliers();
  renderAll();
  saveGame();

  // ── Mine-Button ───────────────────────────────────────────
  const mineBtn = document.getElementById('mine-btn');
  if (mineBtn) {
    let holdArmTimer = null;
    let holdActivePointer = null;
    let pointerDownAt = 0;
    let pointerDownPointer = null;
    const HOLD_ARM_MS = Math.max(300, Number((window.HV_HOLD_MINING_BALANCE && window.HV_HOLD_MINING_BALANCE.armMs) || 3000));

    const clearHoldArm = () => {
      if (holdArmTimer) {
        clearTimeout(holdArmTimer);
        holdArmTimer = null;
      }
    };

    mineBtn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      pointerDownAt = Date.now();
      pointerDownPointer = e.pointerId;
      clearHoldArm();
      holdArmTimer = setTimeout(() => {
        const started = startHoldMining(e.pointerId);
        if (started) holdActivePointer = e.pointerId;
      }, HOLD_ARM_MS);
    });

    const stopPointerHold = (e) => {
      const wasHold = holdActivePointer !== null;
      const durationMs = Math.max(0, Date.now() - Number(pointerDownAt || 0));
      clearHoldArm();
      if (wasHold) {
        stopHoldMining(e.pointerId);
        holdActivePointer = null;
        e.preventDefault();
      } else if (pointerDownPointer === e.pointerId && durationMs < HOLD_ARM_MS) {
        doClick({
          clientX: Number(e.clientX || 0),
          clientY: Number(e.clientY || 0),
        });
      }
      pointerDownPointer = null;
      pointerDownAt = 0;
    };
    mineBtn.addEventListener('pointerup', stopPointerHold, { passive: false });
    mineBtn.addEventListener('pointercancel', stopPointerHold, { passive: false });
    mineBtn.addEventListener('pointerleave', stopPointerHold, { passive: false });
  }

  // iOS gesture zoom im Spielbereich unterbinden
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });

  // ── Crypto-Selektor ───────────────────────────────────────
  document.querySelectorAll('.crypto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.crypto-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      G.selectedCoin = btn.dataset.coin;
    });
  });
  // Geladenes selectedCoin wiederherstellen
  document.querySelectorAll('.crypto-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.coin === G.selectedCoin)
  );

  // ── Tabs ──────────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(tab =>
    tab.addEventListener('click', () => switchTab(tab.dataset.tab))
  );

  // ── Auto-Sell Toggle ──────────────────────────────────────
  const toggle = document.getElementById('auto-sell-toggle');
  if (toggle) {
    toggle.classList.remove('on');
    toggle.style.pointerEvents = 'none';
    toggle.title = 'Auto-Sell wird jetzt pro Coin in den Markt-Karten gesteuert.';
  }

  // ── Upgrade-Filter ────────────────────────────────────────
  document.querySelectorAll('#upg-filter button').forEach(btn => {
    btn.addEventListener('click', () => {
      // Styling aller Buttons zurücksetzen
      document.querySelectorAll('#upg-filter button').forEach(b => {
        b.style.background = 'var(--panel2)';
        b.style.border     = '1px solid var(--border)';
        b.style.color      = '';
      });
      // Aktiven Button hervorheben
      btn.style.background = 'linear-gradient(135deg, var(--accent), var(--accent2))';
      btn.style.border     = 'none';
      btn.style.color      = '#fff';
      _currentFilter = btn.dataset.filter;
      renderUpgrades(_currentFilter);
    });
  });

  // ── Prestige-Buttons ──────────────────────────────────────
  document.getElementById('prestige-btn').addEventListener('click', doPrestige);
  document.getElementById('do-prestige-btn').addEventListener('click', doPrestige);

  // ── Daily Bonus ───────────────────────────────────────────
  document.getElementById('daily-claim-btn').addEventListener('click', claimDaily);

  const sortSel = document.getElementById('rig-sort-select');
  if (sortSel) {
    sortSel.value = G.uiRigSort || 'tier';
    sortSel.addEventListener('change', () => {
      G.uiRigSort = sortSel.value || 'tier';
      if (typeof renderRigs === 'function') renderRigs();
    });
  }
  const ownedOnly = document.getElementById('rig-owned-only');
  if (ownedOnly) {
    ownedOnly.checked = !!G.uiRigOwnedOnly;
    ownedOnly.addEventListener('change', () => {
      G.uiRigOwnedOnly = !!ownedOnly.checked;
      if (typeof renderRigs === 'function') renderRigs();
    });
  }
  const presetSelect = document.getElementById('rig-preset-select');
  const presetBtn = document.getElementById('rig-apply-preset-btn');
  const refreshRigPresetSelect = () => {
    if (!presetSelect) return;
    const list = (typeof window.getAvailableRigBuildPresets === 'function')
      ? getAvailableRigBuildPresets()
      : [];
    if (!list.length) {
      presetSelect.innerHTML = '<option value="">Keine Presets verfuegbar</option>';
      presetSelect.disabled = true;
      if (presetBtn) presetBtn.disabled = true;
      return;
    }
    const prev = String(presetSelect.value || G.rigBuildPresetSelected || '');
    presetSelect.innerHTML = list.map((preset) => (
      '<option value="' + preset.id + '">' + preset.name + ' - ' + preset.desc + '</option>'
    )).join('');
    const fallback = list.some((x) => x.id === G.rigBuildPresetSelected)
      ? G.rigBuildPresetSelected
      : list[0].id;
    presetSelect.value = list.some((x) => x.id === prev) ? prev : fallback;
    G.rigBuildPresetSelected = presetSelect.value;
    presetSelect.disabled = false;
    if (presetBtn) presetBtn.disabled = false;
  };
  refreshRigPresetSelect();
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      G.rigBuildPresetSelected = presetSelect.value || 'starter_balanced';
    });
  }
  if (presetBtn) {
    presetBtn.addEventListener('click', () => {
      applyRigBuildPreset((presetSelect && presetSelect.value) || G.rigBuildPresetSelected || 'starter_balanced');
      refreshRigPresetSelect();
    });
  }
  const repairAllBtn = document.getElementById('rig-repair-all-btn');
  if (repairAllBtn) repairAllBtn.addEventListener('click', repairAllRigs);
  const autoRepairAllToggle = document.getElementById('rig-auto-repair-toggle');
  if (autoRepairAllToggle) {
    autoRepairAllToggle.addEventListener('click', () => {
      const enabledCount = Object.values(G.rigAutoRepair || {}).filter(Boolean).length;
      const total = (RIGS || []).length || 1;
      const next = enabledCount < total;
      setAutoRepairForAll(next);
    });
  }
  const debugBtn = document.getElementById('debug-toggle-btn');
  if (debugBtn) debugBtn.addEventListener('click', toggleDebugOverlay);
  const hsBtn = document.getElementById('hs-breakdown-btn');
  if (hsBtn) hsBtn.addEventListener('click', () => {
    if (typeof window.renderHsBreakdownModal === 'function') renderHsBreakdownModal();
  });
  const hsClose = document.getElementById('hs-breakdown-close');
  if (hsClose) hsClose.addEventListener('click', () => {
    if (typeof window.closeHsBreakdownModal === 'function') closeHsBreakdownModal();
  });
  const hsOverlay = document.getElementById('hs-breakdown-overlay');
  if (hsOverlay) hsOverlay.addEventListener('click', (e) => {
    if (e.target === hsOverlay && typeof window.closeHsBreakdownModal === 'function') closeHsBreakdownModal();
  });
  const tutorialBtn = document.getElementById('tutorial-toggle-btn');
  if (tutorialBtn) tutorialBtn.addEventListener('click', toggleTutorialMode);
  window.addEventListener('resize', () => {
    if (typeof renderTutorialBox === 'function') renderTutorialBox();
  });
  document.addEventListener('scroll', () => {
    if (typeof renderTutorialBox === 'function') renderTutorialBox();
  }, true);
  const saveExportBtn = document.getElementById('save-export-btn');
  if (saveExportBtn) saveExportBtn.addEventListener('click', exportSaveSnapshot);
  const saveImportBtn = document.getElementById('save-import-btn');
  if (saveImportBtn) saveImportBtn.addEventListener('click', importSaveSnapshot);

  document.querySelectorAll('[data-power-action]').forEach(btn => {
    btn.addEventListener('click', () => handlePowerAction(btn.dataset.powerAction));
  });

  // ── Keyboard-Shortcuts ────────────────────────────────────
  document.addEventListener('keydown', e => {
    // Leertaste = Mine (nur wenn kein Input fokussiert)
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      doClick(null);
      const btn = document.getElementById('mine-btn');
      btn.style.transform = 'scale(.93)';
      setTimeout(() => btn.style.transform = '', 100);
    }
    // Ctrl+S = Speichern
    if (e.ctrlKey && e.code === 'KeyS') {
      e.preventDefault();
      saveGame();
      notify('💾 Spiel gespeichert!', 'success');
    }
  });

  // ── Timer ─────────────────────────────────────────────────
  setInterval(saveGame,   30000);          // Auto-Save alle 30s
  setInterval(gameTick,   100);            // Haupt-Loop alle 100ms
  setInterval(() => {
    const minePanel = document.getElementById('mine-panel');
    const staffPanel = document.getElementById('staff-panel');
    const crewPanel = document.getElementById('crew-panel');
    if (minePanel && minePanel.classList.contains('active')) renderRigs();
    if (staffPanel && staffPanel.classList.contains('active')) renderStaff();
    if (crewPanel && crewPanel.classList.contains('active')) renderRigCrew();
  }, 1000);  // Sichtbare Rig/Staff-UI jede Sekunde
  setInterval(() => { if (G.activeResearch) renderResearch(); }, 2000); // Research-Bar
  // Ticker durch Recent Events rotieren
  setInterval(() => {
    if (G.recentEvents && G.recentEvents.length > 0) {
      const idx = Math.floor(Date.now() / 18000) % G.recentEvents.length;
      if (!G.activeEvent || Date.now() > G.activeEvent.endsAt) {
        updateTicker(G.recentEvents[idx].msg);
      }
    }
  }, 18000);

  // ── Willkommens-Nachrichten ───────────────────────────────
  setTimeout(() => notify('⛏️ Willkommen bei HashVault Pro!'), 500);
  setTimeout(() => notify('💡 Mine Hashes → Coins → Verkaufe für USD → Kaufe Rigs!'), 4500);
}

// Start wird vom Boot-Menü gesteuert.
window.HV_START_GAME = init;
