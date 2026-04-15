// ============================================================
// CORE — Prestige-System
// Schwelle: $3.500.000 = 1 Chip
// Benötigt: state.js, gameLoop.js, render.js, notifications.js
// ============================================================

const PRESTIGE_PER_CHIP = 3500000; // $3.5M pro Chip

function doPrestige() {
  const chips = Math.floor(G.totalEarned / PRESTIGE_PER_CHIP);
  if (chips <= 0) {
    notify('Benötige $' + fmtNum(PRESTIGE_PER_CHIP) + ' verdient für 1 Chip!', 'error');
    return;
  }

  showModal(
    '✨ Prestige bestätigen',
    'Du erhältst ' + chips + ' Chip(s).\n' +
    'Das Spiel wird zurückgesetzt — Achievements, Chips, Skilltree & Streak bleiben erhalten.',
    () => {
      // Was wird gerettet
      const saved = {
        chips:          G.chips + chips,
        chipShop:       JSON.parse(JSON.stringify(G.chipShop)),
        prestigeSkills: JSON.parse(JSON.stringify(G.prestigeSkills || {})),
        selectedCoin:   String(G.selectedCoin || 'BTC'),
        coins:          JSON.parse(JSON.stringify(G.coins || { BTC:0, ETH:0, LTC:0, BNB:0 })),
        coinReserves:   JSON.parse(JSON.stringify(G.coinReserves || { BTC:0, ETH:0, LTC:0, BNB:0 })),
        walletYieldEnabled: G.walletYieldEnabled !== false,
        walletYieldAccruedUsd: Math.max(0, Number(G.walletYieldAccruedUsd || 0)),
        walletYieldLastDay: Math.max(0, Number(G.walletYieldLastDay || 0)),
        walletYieldHistory: JSON.parse(JSON.stringify(G.walletYieldHistory || [])),
        walletLedger: JSON.parse(JSON.stringify(G.walletLedger || [])),
        walletUnlockDay: JSON.parse(JSON.stringify(G.walletUnlockDay || {})),
        walletHoldDays: JSON.parse(JSON.stringify(G.walletHoldDays || {})),
        dailyStreak:    G.dailyStreak,
        lastDaily:      G.lastDaily,
        prestigeCount:  G.prestigeCount + 1,
        achievements:   [...G.achievements],
        playTime:       G.playTime,
        maxCombo:       G.maxCombo,
        contractsDone:  G.contractsDone,
        storyMissionIndex: Number(G.storyMissionIndex || 0),
        storyMissionsClaimed: JSON.parse(JSON.stringify(G.storyMissionsClaimed || {})),
        tutorialStep: Number(G.tutorialStep || 0),
        tutorialEnabled: G.tutorialEnabled !== false,
        tutorialCompleted: !!G.tutorialCompleted,
      };

      // Startkapital aus Chip-Shop berechnen (cb6 Boosts)
      let startCash = 0;
      Object.entries(saved.chipShop).forEach(([id, count]) => {
        if (!count) return;
        const c = CHIP_SHOP.find(x => x.id === id);
        if (c && c.effect && c.effect.startsWith('startcash+')) {
          startCash += count * parseFloat(c.effect.split('+')[1]);
        }
      });

      // Vollständiger Reset
      G = JSON.parse(JSON.stringify(DEFAULT_STATE));
      G.usd            = startCash;
      G.chips          = saved.chips;
      G.chipShop       = saved.chipShop;
      G.prestigeSkills = saved.prestigeSkills;
      G.selectedCoin   = saved.selectedCoin;
      G.coins          = saved.coins;
      G.coinReserves   = saved.coinReserves;
      G.walletYieldEnabled = saved.walletYieldEnabled;
      G.walletYieldAccruedUsd = saved.walletYieldAccruedUsd;
      G.walletYieldLastDay = saved.walletYieldLastDay;
      G.walletYieldHistory = saved.walletYieldHistory;
      G.walletLedger = saved.walletLedger;
      G.walletUnlockDay = saved.walletUnlockDay;
      G.walletHoldDays = saved.walletHoldDays;
      G.dailyStreak    = saved.dailyStreak;
      G.lastDaily      = saved.lastDaily;
      G.prestigeCount  = saved.prestigeCount;
      G.achievements   = saved.achievements;
      G.playTime       = saved.playTime;
      G.maxCombo       = saved.maxCombo;
      G.contractsDone  = saved.contractsDone;
      G.storyMissionIndex = saved.storyMissionIndex;
      G.storyMissionsClaimed = saved.storyMissionsClaimed;
      G.tutorialStep = saved.tutorialStep;
      G.tutorialEnabled = saved.tutorialEnabled;
      G.tutorialCompleted = saved.tutorialCompleted;
      G.unlockedLocationTier = Math.min(4, 1 + Math.floor(saved.prestigeCount / 2));
      G.locationId = 'home_pc';
      G.lastSave       = Date.now();
      G.prices         = {
        BTC: Number((COIN_DATA.BTC && COIN_DATA.BTC.basePrice) || 80),
        ETH: Number((COIN_DATA.ETH && COIN_DATA.ETH.basePrice) || 35),
        LTC: Number((COIN_DATA.LTC && COIN_DATA.LTC.basePrice) || 15),
        BNB: Number((COIN_DATA.BNB && COIN_DATA.BNB.basePrice) || 25),
      };
      G.marketRegime = 'range';
      G.marketRegimeDrift = 0.0002;
      G.marketRegimeVolMult = 0.92;
      G.marketRegimeTimer = 140;

      computeMultipliers();
      renderAll();
      saveGame();
      notify('✨ Prestige ' + saved.prestigeCount + '! +' + chips + ' Chips erhalten! 💎', 'gold');
      notify('🏢 Meta-Bonus: Standort-Freischaltung startet jetzt auf Tier ' + G.unlockedLocationTier + '.', 'success');
    }
  );
}

function buyPrestigeSkill(id) {
  const skill = (window.PRESTIGE_SKILLS || []).find((entry) => entry.id === id);
  if (!skill) return;

  const current = (typeof window.getPrestigeSkillLevel === 'function')
    ? getPrestigeSkillLevel(id)
    : Math.max(0, Number(((G.prestigeSkills || {})[id]) || 0));
  if (current >= Number(skill.max || 1)) {
    notify('Skill ist bereits auf Maximum.', 'error');
    return;
  }

  const reqState = (typeof window.getPrestigeSkillRequirementState === 'function')
    ? getPrestigeSkillRequirementState(skill)
    : { ok: true, text: '' };
  if (!reqState.ok) {
    notify('Voraussetzung fehlt: ' + reqState.text, 'error');
    return;
  }

  const cost = (typeof window.getPrestigeSkillCost === 'function')
    ? getPrestigeSkillCost(id, current + 1)
    : Math.max(1, Number(skill.cost || 1));
  if (Number(G.chips || 0) < cost) {
    notify('Nicht genug Chips! 💎', 'error');
    return;
  }

  G.chips -= cost;
  G.prestigeSkills = G.prestigeSkills || {};
  G.prestigeSkills[id] = current + 1;
  G.prestigeSkillPurchases = Math.max(0, Number(G.prestigeSkillPurchases || 0)) + 1;
  computeMultipliers();
  renderAll();
  saveGame();
  notify('💠 ' + skill.name + ' auf Lv ' + (current + 1) + ' ausgebaut.', 'gold');
}
window.buyPrestigeSkill = buyPrestigeSkill;

// ── Chip kaufen (alle 3 Kategorien) ──────────────────────────
function buyChipItem(id) {
  const c = CHIP_SHOP.find(x => x.id === id);
  if (!c) return;
  const owned = G.chipShop[id] || 0;
  const now = Date.now();
  const discountBoost = (G.activeBoosts || []).find(b => b.effect === 'chipDiscount' && b.endsAt > now);
  const chipCost = discountBoost
    ? Math.max(1, Math.ceil(c.cost * (discountBoost.mult || 1)))
    : c.cost;

  if (owned >= c.max)    { notify('Maximum bereits erreicht!', 'error'); return; }
  if (G.chips < chipCost){ notify('Nicht genug Chips! 💎', 'error');    return; }
  G.chips         -= chipCost;
  G.chipShop[id]   = owned + 1;
  computeMultipliers();
  renderPrestige();
  const catLabel = c.cat === 'use' ? '×' + (G.chipShop[id]) + ' im Lager' : 'aktiv';
  notify('💎 ' + c.name + ' gekauft fuer ' + chipCost + ' Chips! (' + catLabel + ')', 'gold');
}

// ── Verbrauchsmittel benutzen ─────────────────────────────────
function useChipItem(id) {
  const c = CHIP_SHOP.find(x => x.id === id);
  if (!c || c.cat !== 'use') return;
  const owned = G.chipShop[id] || 0;
  if (owned <= 0) { notify('Kein Vorrat! Kaufe zuerst mehr.', 'error'); return; }

  G.chipShop[id] = owned - 1;
  const now = Date.now();

  if (c.effect === 'timewarp4h') {
    // 2 Stunden Idle-Einnahmen sofort kassieren (mit Effizienzfaktor)
    const hps         = getTotalHps();
    const warpSeconds = 7200; // 2 Stunden
    const efficiency  = 0.65;
    const hashIncome  = (hps * warpSeconds / HASH_PER_COIN) * G.prices[G.selectedCoin] * G._priceMult * efficiency;
    const passIncome  = G._passive * warpSeconds * efficiency;
    const total       = (hashIncome + passIncome) * (G._legacyMult || 1);
    G.usd            += total;
    G.totalEarned    += total;
    notify('⏰ Zeitsprung! +$' + fmtNum(total) + ' (2h Einnahmen kassiert)', 'gold');

  } else if (c.effect === 'hashburst60') {
    G.activeBoosts = (G.activeBoosts || []).filter(b => b.effect !== 'hashburst60');
    G.activeBoosts.push({ effect: 'hashburst60', endsAt: now + 60000 });
    notify('⚡ Hash-Burst aktiv! H/s ×10 für 60 Sekunden!', 'gold');

  } else if (c.effect === 'pricespike30') {
    G.activeBoosts = (G.activeBoosts || []).filter(b => b.effect !== 'pricespike30');
    G.activeBoosts.push({ effect: 'pricespike30', endsAt: now + 30000 });
    notify('📈 Markt-Spike aktiv! Alle Preise ×3 für 30 Sekunden!', 'gold');

  } else if (c.effect === 'rigsurge120') {
    G.activeBoosts = (G.activeBoosts || []).filter(b => b.effect !== 'rigsurge120');
    G.activeBoosts.push({ effect: 'rigsurge120', endsAt: now + 120000 });
    notify('🏭 Rig-Überladung aktiv! Alle Rigs ×5 H/s für 2 Minuten!', 'gold');
  }

  computeMultipliers();
  renderPrestige();
}
