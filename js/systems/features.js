// ============================================================
// FEATURES - Render fuer Ziele, Daily Challenges und NPC Traders
// ============================================================

const STORY_MISSIONS = [
  {
    id: 'sm1',
    name: 'Erster Betriebsplan',
    desc: 'Fuehre 120 Klicks aus, um deinen Mining-Workflow zu starten.',
    metric: 'totalClicks',
    target: 120,
    reward: { cash: 300, chips: 0, modParts: 4 },
  },
  {
    id: 'sm2',
    name: 'Mini-Farm Aufbau',
    desc: 'Erreiche 16 aktive Rigs fuer den ersten stabilen Durchsatz.',
    metric: 'totalRigs',
    target: 16,
    reward: { cash: 1100, chips: 1, modParts: 8 },
  },
  {
    id: 'sm3',
    name: 'Prozessdigitalisierung',
    desc: 'Absolviere 3 Forschungen, um dein Team vorzubereiten.',
    metric: 'researchCount',
    target: 3,
    reward: { cash: 3500, chips: 1, modParts: 12 },
  },
  {
    id: 'sm4',
    name: 'Stromplanung',
    desc: 'Baue dein Netz auf Infra-Level 3 aus.',
    metric: 'powerInfraLevel',
    target: 3,
    reward: { cash: 8000, chips: 1, modParts: 20 },
  },
  {
    id: 'sm5',
    name: 'Operative Expansion',
    desc: 'Ziehe in einen Standort ab Tier 5 um.',
    metric: 'locationTier',
    target: 5,
    reward: { cash: 18000, chips: 2, modParts: 26 },
  },
  {
    id: 'sm6',
    name: 'Auftragsleitung',
    desc: 'Schliesse 18 Contracts ab und etabliere dein Unternehmen.',
    metric: 'contractsDone',
    target: 18,
    reward: { cash: 38000, chips: 3, modParts: 36 },
  },
  {
    id: 'sm7',
    name: 'Skalierungsschub',
    desc: 'Erreiche insgesamt $3.000.000 Umsatz.',
    metric: 'totalEarned',
    target: 3000000,
    reward: { cash: 95000, chips: 4, modParts: 48 },
  },
  {
    id: 'sm8',
    name: 'Energie-Leitstelle',
    desc: 'Bringe dein Stromnetz auf Infra-Level 6.',
    metric: 'powerInfraLevel',
    target: 6,
    reward: { cash: 140000, chips: 4, modParts: 56 },
  },
  {
    id: 'sm9',
    name: 'Datacenter-Zugang',
    desc: 'Erreiche einen Standort ab Tier 8.',
    metric: 'locationTier',
    target: 8,
    reward: { cash: 260000, chips: 5, modParts: 72 },
  },
  {
    id: 'sm10',
    name: 'Meta-Expansion',
    desc: 'Fuehre deinen ersten Prestige-Durchlauf aus.',
    metric: 'prestigeCount',
    target: 1,
    reward: { cash: 320000, chips: 6, modParts: 88 },
  },
  {
    id: 'sm11',
    name: 'Operations-Ausbau',
    desc: 'Installiere 10 Standort-Shop Items insgesamt.',
    metric: 'locationShopItems',
    target: 10,
    reward: { cash: 420000, chips: 6, modParts: 96 },
  },
  {
    id: 'sm12',
    name: 'Crew-Leitstelle',
    desc: 'Erreiche 88% Crew-Abdeckung ueber alle Rigs.',
    metric: 'crewCoveragePct',
    target: 88,
    reward: { cash: 520000, chips: 7, modParts: 110 },
  },
  {
    id: 'sm13',
    name: 'Grossbetrieb',
    desc: 'Ziehe in einen Standort ab Tier 9 um.',
    metric: 'locationTier',
    target: 9,
    reward: { cash: 760000, chips: 8, modParts: 130 },
  },
  {
    id: 'sm14',
    name: 'Meta-Leader',
    desc: 'Fuehre 4 Prestige-Durchlaeufe durch.',
    metric: 'prestigeCount',
    target: 4,
    reward: { cash: 1200000, chips: 12, modParts: 180 },
  },
  {
    id: 'sm15',
    name: 'Facility Backbone',
    desc: 'Installiere 15 Standort-Shop Items insgesamt.',
    metric: 'locationShopItems',
    target: 15,
    reward: { cash: 1800000, chips: 12, modParts: 220 },
  },
  {
    id: 'sm16',
    name: 'Operations Discipline',
    desc: 'Erreiche 95% Crew-Abdeckung ueber alle Rigs.',
    metric: 'crewCoveragePct',
    target: 95,
    reward: { cash: 2600000, chips: 14, modParts: 260 },
  },
  {
    id: 'sm17',
    name: 'Campus Dominion',
    desc: 'Erreiche den Standort Mega-Farm Campus.',
    metric: 'locationTier',
    target: 9,
    reward: { cash: 4200000, chips: 16, modParts: 320 },
  },
  {
    id: 'sm18',
    name: 'Enterprise Pipeline',
    desc: 'Schliesse 36 Contracts ab, um dein Netzwerk zu skalieren.',
    metric: 'contractsDone',
    target: 36,
    reward: { cash: 6000000, chips: 18, modParts: 400 },
  },
  {
    id: 'sm19',
    name: 'Orbital Launch',
    desc: 'Erreiche 26 abgeschlossene Forschungen fuer den orbitalen Ausbau.',
    metric: 'researchCount',
    target: 26,
    reward: { cash: 9000000, chips: 20, modParts: 520 },
  },
  {
    id: 'sm20',
    name: 'Planetary Throughput',
    desc: 'Betreibe 260 aktive Rigs in deinem Netzwerk.',
    metric: 'totalRigs',
    target: 260,
    reward: { cash: 15000000, chips: 22, modParts: 640 },
  },
  {
    id: 'sm21',
    name: 'Treasury Apex',
    desc: 'Erziele insgesamt $80.000.000 Umsatz.',
    metric: 'totalEarned',
    target: 80000000,
    reward: { cash: 22000000, chips: 26, modParts: 820 },
  },
  {
    id: 'sm22',
    name: 'Legacy Protocol',
    desc: 'Erreiche 6 Prestige-Durchlaeufe fuer den finalen Meta-Zyklus.',
    metric: 'prestigeCount',
    target: 6,
    reward: { cash: 36000000, chips: 34, modParts: 1200 },
  },
  {
    id: 'sm23',
    name: 'Facility Singularity',
    desc: 'Installiere 24 Standort-Shop Items in deinem Gesamtverbund.',
    metric: 'locationShopItems',
    target: 24,
    reward: { cash: 54000000, chips: 38, modParts: 1650 },
  },
  {
    id: 'sm24',
    name: 'Global Contract Mesh',
    desc: 'Schliesse 72 Contracts fuer die weltweite Pipeline ab.',
    metric: 'contractsDone',
    target: 72,
    reward: { cash: 88000000, chips: 44, modParts: 2200 },
  },
  {
    id: 'sm25',
    name: 'Revenue Event Horizon',
    desc: 'Erziele insgesamt $300.000.000 Umsatz.',
    metric: 'totalEarned',
    target: 300000000,
    reward: { cash: 145000000, chips: 52, modParts: 3200 },
  },
  {
    id: 'sm26',
    name: 'Infinite Loop Architect',
    desc: 'Fuehre 9 Prestige-Durchlaeufe aus und sichere die Endgame-Aera.',
    metric: 'prestigeCount',
    target: 9,
    reward: { cash: 220000000, chips: 64, modParts: 5000 },
  },
  {
    id: 'sm27',
    name: 'Prestige Frontier',
    desc: 'Erreiche Prestige-Level 10 fuer den naechsten Content-Zyklus.',
    metric: 'prestigeCount',
    target: 10,
    reward: { cash: 280000000, chips: 70, modParts: 6200 },
  },
  {
    id: 'sm28',
    name: 'Lab Supremacy',
    desc: 'Schliesse 30 Forschungen ab und stabilisiere den Meta-Core.',
    metric: 'researchCount',
    target: 30,
    reward: { cash: 360000000, chips: 78, modParts: 7600 },
  },
  {
    id: 'sm29',
    name: 'Workforce Hypergrid',
    desc: 'Stelle 24 Core-Staff Mitglieder ein.',
    metric: 'staffCount',
    target: 24,
    reward: { cash: 520000000, chips: 88, modParts: 9200 },
  },
  {
    id: 'sm30',
    name: 'Legacy Crown',
    desc: 'Erreiche Prestige-Level 12 und sichere die finale Aera.',
    metric: 'prestigeCount',
    target: 12,
    reward: { cash: 760000000, chips: 104, modParts: 12500 },
  },
];
window.STORY_MISSIONS = STORY_MISSIONS;

function getStoryMissionMetricValue(metric) {
  switch (String(metric || '')) {
    case 'totalClicks': return Number(G.totalClicks || 0);
    case 'totalRigs': return Number(G.totalRigs || Object.values(G.rigs || {}).reduce((a, b) => a + Number(b || 0), 0));
    case 'researchCount': return Array.isArray(G.research) ? G.research.length : 0;
    case 'powerInfraLevel': return Number(G.powerInfraLevel || 0);
    case 'locationTier': {
      const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
      return Number((loc && loc.tier) || 1);
    }
    case 'contractsDone': return Number(G.contractsDone || 0);
    case 'totalEarned': return Number(G.totalEarned || 0);
    case 'prestigeCount': return Number(G.prestigeCount || 0);
    case 'staffCount': return Object.values(G.staff || {}).reduce((sum, n) => sum + Number(n || 0), 0);
    case 'upgradeCount': return Array.isArray(G.upgrades) ? G.upgrades.length : 0;
    case 'locationShopItems': {
      if (typeof window.getTotalLocationShopItemsOwned === 'function') return Number(getTotalLocationShopItemsOwned(G) || 0);
      return 0;
    }
    case 'crewCoveragePct':
      return Math.max(0, Math.min(100, Number(G._rigStaffCoverage || 0) * 100));
    default: return 0;
  }
}

function getActiveStoryMission() {
  const idx = Math.max(0, Number(G.storyMissionIndex || 0));
  return STORY_MISSIONS[idx] || null;
}
window.getActiveStoryMission = getActiveStoryMission;

function getStoryMissionProgress() {
  const mission = getActiveStoryMission();
  if (!mission) return { done: true, current: 0, target: 0, pct: 100 };
  const current = getStoryMissionMetricValue(mission.metric);
  const target = Math.max(1, Number(mission.target || 1));
  const done = current >= target;
  const pct = Math.max(0, Math.min(100, Math.round((Math.min(current, target) / target) * 100)));
  return { mission, done, current, target, pct };
}
window.getStoryMissionProgress = getStoryMissionProgress;

function updateStoryMissionState() {
  if (!Number.isFinite(G.storyMissionIndex) || G.storyMissionIndex < 0) G.storyMissionIndex = 0;
  if (!G.storyMissionsClaimed || typeof G.storyMissionsClaimed !== 'object') G.storyMissionsClaimed = {};
  if (G.storyMissionIndex >= STORY_MISSIONS.length) G.storyMissionIndex = STORY_MISSIONS.length;
}
window.updateStoryMissionState = updateStoryMissionState;

function renderStoryMissionCard() {
  const host = document.getElementById('story-mission-card');
  if (!host) return;
  updateStoryMissionState();
  const progress = getStoryMissionProgress();
  if (!progress.mission) {
    host.innerHTML = `
      <div class="challenge-card" style="padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:6px;">
        <strong>🎉 Storyline abgeschlossen</strong>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">Alle Story-Missionen sind erledigt. Weitere Kapitel folgen.</div>
      </div>`;
    return;
  }
  const mission = progress.mission;
  const rew = mission.reward || {};
  const rewards = [];
  if (rew.cash) rewards.push('💰 $' + fmtNum(rew.cash));
  if (rew.chips) rewards.push('💎 ' + rew.chips);
  if (rew.modParts) rewards.push('🧩 ' + rew.modParts + ' Parts');

  host.innerHTML = `
    <div class="challenge-card" style="padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
        <div>
          <strong>${mission.name}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${mission.desc}</div>
        </div>
        <span style="font-size:11px;color:${progress.done ? 'var(--gold)' : 'var(--muted)'};font-weight:700;">${fmtNum(progress.current)} / ${fmtNum(progress.target)}</span>
      </div>
      <div style="height:6px;background:var(--panel1);border-radius:3px;overflow:hidden;margin:8px 0;">
        <div style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));width:${progress.pct}%;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--muted);gap:8px;">
        <span>${rewards.join('  ') || '-'}</span>
        ${progress.done
          ? `<button class="buy-btn" style="padding:4px 8px;font-size:10px;" onclick="claimStoryMission()">Einloesen</button>`
          : ''}
      </div>
    </div>`;
}
window.renderStoryMissionCard = renderStoryMissionCard;

const TUTORIAL_STEPS = [
  { id: 't1', title: 'Klicke aufs Mining-Symbol', desc: 'Fuehre 12 Klicks aus.', check: () => Number(G.totalClicks || 0) >= 12 },
  { id: 't2', title: 'Kaufe deinen ersten Rig', desc: 'Erreiche mindestens 1 Rig.', check: () => Number(G.totalRigs || 0) >= 1 },
  { id: 't3', title: 'Erziele erste Umsaetze', desc: 'Verdiene insgesamt $600.', check: () => Number(G.totalEarned || 0) >= 600 },
  { id: 't4', title: 'Auto-Sell aktivieren', desc: 'Aktiviere Auto-Sell fuer mindestens 1 Coin im Markt.', check: () => Object.values(G.autoSellCoins || {}).some(Boolean) },
  { id: 't5', title: 'Baue das Stromnetz aus', desc: 'Erreiche Power-Infra Level 1.', check: () => Number(G.powerInfraLevel || 0) >= 1 },
  { id: 't6', title: 'Stelle Rig-Crew ein', desc: 'Stelle mindestens 1 Crew-Mitglied ein.', check: () => Object.values(G.hiredRigStaff || {}).reduce((a, b) => a + Number(b || 0), 0) >= 1 },
  { id: 't7', title: 'Crew spezialisieren', desc: 'Aendere eine Crew-Spezialisierung.', check: () => Object.values(G.rigCrewProgress || {}).some((p) => p && p.spec && p.spec !== 'balanced') },
  { id: 't8', title: 'Starte Forschung', desc: 'Schliesse mindestens 1 Forschung ab.', check: () => Array.isArray(G.research) && G.research.length >= 1 },
  { id: 't9', title: 'Ziehe um', desc: 'Erreiche einen Standort ab Tier 2.', check: () => {
      const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
      return Number((loc && loc.tier) || 1) >= 2;
    } },
  { id: 't10', title: 'Standort-Shop kaufen', desc: 'Kaufe mindestens 1 Standort-Item.', check: () => {
      if (typeof window.getTotalLocationShopItemsOwned === 'function') return Number(getTotalLocationShopItemsOwned(G) || 0) >= 1;
      return false;
    } },
  { id: 't11', title: 'Crew-Fokus setzen', desc: 'Setze fuer einen Rig-Typ einen Crew-Fokus ungleich Balanced.', check: () => {
      return Object.values(G.rigCrewFocus || {}).some((focus) => focus && focus !== 'balanced');
    } },
];
window.TUTORIAL_STEPS = TUTORIAL_STEPS;

function updateTutorialState() {
  if (G.tutorialCompleted) return;
  let step = Math.max(0, Number(G.tutorialStep || 0));
  while (step < TUTORIAL_STEPS.length && TUTORIAL_STEPS[step].check()) {
    step += 1;
    notify('📘 Tutorial-Schritt erledigt: ' + TUTORIAL_STEPS[Math.max(0, step - 1)].title, 'success');
  }
  G.tutorialStep = step;
  if (step >= TUTORIAL_STEPS.length) {
    G.tutorialCompleted = true;
    G.usd += 3500;
    G.totalEarned += 3500;
    G.chips += 2;
    G.modParts = Math.max(0, Number(G.modParts || 0)) + 6;
    notify('🎓 Tutorial abgeschlossen! +$3.500, +2 Chips, +6 Mod-Parts', 'gold');
  }
}
window.updateTutorialState = updateTutorialState;

function getGoalGateStatus(goal) {
  if (!goal) return { ok: true, checks: [], pending: [] };
  const totalRigs = Number(G.totalRigs || Object.values(G.rigs || {}).reduce((a, b) => a + Number(b || 0), 0));
  const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const locationTier = Number((loc && loc.tier) || 1);
  const prestige = Number(G.prestigeCount || 0);

  const checks = [];
  if (Number(goal.minRigs || 0) > 0) {
    checks.push({ label: 'Min. Rigs', current: totalRigs, target: Number(goal.minRigs || 0) });
  }
  if (Number(goal.minLocationTier || 0) > 0) {
    checks.push({ label: 'Min. Standort-Tier', current: locationTier, target: Number(goal.minLocationTier || 0) });
  }
  if (Number(goal.minPrestige || 0) > 0) {
    checks.push({ label: 'Min. Prestige', current: prestige, target: Number(goal.minPrestige || 0) });
  }

  const pending = checks
    .filter((c) => Number(c.current || 0) < Number(c.target || 0))
    .map((c) => c.label + ' ' + fmtNum(c.current || 0, 0) + '/' + fmtNum(c.target || 0, 0));

  return {
    ok: pending.length === 0,
    checks,
    pending,
  };
}
window.getGoalGateStatus = getGoalGateStatus;

function getGoalProgressValue(goal) {
  if (!goal) return 0;
  switch (goal.type) {
    case 'total_hashes':   return G.totalHashes || 0;
    case 'total_earned':   return G.totalEarned || 0;
    case 'total_rigs':     return G.totalRigs || Object.values(G.rigs || {}).reduce((a, b) => a + b, 0);
    case 'research_done':  return (G.research || []).length;
    case 'contracts_done': return G.contractsDone || 0;
    case 'prestige_count': return G.prestigeCount || 0;
    case 'staff_hired':    return Object.values(G.staff || {}).reduce((a, b) => a + b, 0);
    case 'btc_balance':    return G.coins ? (G.coins.BTC || 0) : 0;
    case 'daily_streak':   return G.dailyStreak || 0;
    case 'location_tier': {
      const loc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
      return Number((loc && loc.tier) || 1);
    }
    case 'crew_coverage':
      return Math.max(0, Math.min(100, Number(G._rigStaffCoverage || 0) * 100));
    case 'location_shop_items':
      return (typeof window.getTotalLocationShopItemsOwned === 'function') ? Number(getTotalLocationShopItemsOwned(G) || 0) : 0;
    default:               return 0;
  }
}
window.getGoalProgressValue = getGoalProgressValue;

function formatGoalRewardText(rewards) {
  if (!rewards) return '-';
  const parts = [];
  if (rewards.cash) parts.push('💰 +$' + fmtNum(rewards.cash));
  if (rewards.chips) parts.push('💎 +' + rewards.chips);
  return parts.length ? parts.join('  ') : '-';
}

function formatChallengeRewardText(def) {
  if (!def || !def.rewards) return '-';
  const r = def.rewards;
  const parts = [];
  if (r.chips) parts.push('💎 +' + r.chips + ' Chips');
  if (r.cashBonus) parts.push('💰 +$' + fmtNum(r.cashBonus));
  if (r.chipType === 'consumable') parts.push('🎁 Consumable Chip');
  if (r.chipType === 'permanent') parts.push('💠 Permanent Chip');
  if (r.hashMultiplier) parts.push('⚡ Hash x' + r.hashMultiplier);
  return parts.length ? parts.join('  ') : '-';
}

function formatGoalValue(goal, value) {
  if (!goal) return fmtNum(value || 0);
  if (goal.unit === 'BTC') return fmtNum(value || 0, 3);
  if (goal.unit === '%' || goal.unit === 'Tier' || goal.unit === 'Items' || goal.unit === 'Rigs') return fmtNum(value || 0, 0);
  return fmtNum(value || 0);
}

function formatChallengeValue(def, value) {
  if (!def) return fmtNum(value || 0);
  if (def.type === 'coin_mining') return fmtNum(value || 0, 3);
  if (def.type === 'crew_coverage' || def.type === 'location_tier' || def.type === 'location_shop_items' || def.type === 'rig_health') {
    return fmtNum(value || 0, 0);
  }
  return fmtNum(value || 0);
}

function renderGoals() {
  const grid = document.getElementById('goal-grid');
  const countEl = document.getElementById('goal-count');
  if (!grid) return;

  const goals = window.GOALS || [];
  G.goalsClaimed = G.goalsClaimed || {};

  let claimedCount = 0;
  let html = '';

  const sortedGoals = goals.slice().sort((a, b) => {
    const gateA = getGoalGateStatus(a);
    const gateB = getGoalGateStatus(b);
    const progressA = Math.min(getGoalProgressValue(a), Number(a.target || 0));
    const progressB = Math.min(getGoalProgressValue(b), Number(b.target || 0));
    const doneA = progressA >= Number(a.target || 0) && gateA.ok;
    const doneB = progressB >= Number(b.target || 0) && gateB.ok;
    const claimedA = !!(G.goalsClaimed || {})[a.id];
    const claimedB = !!(G.goalsClaimed || {})[b.id];
    const rankA = claimedA ? 3 : (doneA ? 0 : (gateA.ok ? 1 : 2));
    const rankB = claimedB ? 3 : (doneB ? 0 : (gateB.ok ? 1 : 2));
    if (rankA !== rankB) return rankA - rankB;
    const pctA = Number(a.target || 0) > 0 ? (progressA / Number(a.target || 1)) : 0;
    const pctB = Number(b.target || 0) > 0 ? (progressB / Number(b.target || 1)) : 0;
    return pctB - pctA;
  });

  sortedGoals.forEach(goal => {
    const gate = getGoalGateStatus(goal);
    const rawProgress = getGoalProgressValue(goal);
    const progress = Math.min(rawProgress, goal.target);
    const done = progress >= goal.target && gate.ok;
    const claimed = !!G.goalsClaimed[goal.id];
    const pct = goal.target > 0 ? Math.min(100, Math.round((progress / goal.target) * 100)) : 0;
    const gateHint = gate.pending.length
      ? '<div style="font-size:10px;color:var(--orange);margin-top:3px;">Voraussetzung: ' + gate.pending.join(' | ') + '</div>'
      : '';

    if (claimed) claimedCount++;

    html += `
      <div class="challenge-card" style="padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:4px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
          <div>
            <strong style="color:${claimed ? 'var(--gold)' : 'var(--accent)'};">${goal.name}</strong>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${goal.description}</div>
            ${gateHint}
          </div>
          <span style="font-size:11px;color:${done ? 'var(--gold)' : 'var(--muted)'};font-weight:700;">
            ${goal.unit === '$' ? '$' : ''}${formatGoalValue(goal, progress)} / ${goal.unit === '$' ? '$' : ''}${formatGoalValue(goal, goal.target)}
          </span>
        </div>
        <div style="height:6px;background:var(--panel1);border-radius:3px;overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;background:linear-gradient(90deg, var(--accent), var(--accent2));width:${pct}%;transition:width 0.3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--muted);gap:8px;">
          <span>${formatGoalRewardText(goal.rewards)}</span>
          ${claimed
            ? '<span style="color:var(--gold);font-weight:700;">✓ Eingeloest</span>'
            : (done
              ? '<button class="buy-btn" style="padding:4px 8px;font-size:10px;" onclick="claimGoal(\'' + goal.id + '\')">Einloesen</button>'
              : '')}
        </div>
      </div>
    `;
  });

  if (countEl) countEl.textContent = claimedCount + '/' + goals.length + ' abgeschlossen';
  grid.innerHTML = html || '<p style="color:var(--muted);padding:10px;">Keine Ziele verfuegbar</p>';
  if (typeof updateMissionBadge === 'function') updateMissionBadge();
}

// ── Challenges Panel rendern ──────────────────────────────────
function renderChallenges() {
  const grid = document.getElementById('challenge-grid');
  if (!grid) return;

  renderGoals();

  if (!G.dailyChallenges || G.dailyChallenges.length === 0) {
    G.dailyChallenges = getDailyChallenges().map(c => ({
      id: c.id,
      name: c.name,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }

  let html = '';
  let completedCount = 0;

  const sortedChallenges = (G.dailyChallenges || []).slice().sort((a, b) => {
    const da = window.CHALLENGES[a.id];
    const db = window.CHALLENGES[b.id];
    const aCanClaim = !!(a.completed && !a.claimed);
    const bCanClaim = !!(b.completed && !b.claimed);
    const rankA = a.claimed ? 3 : (aCanClaim ? 0 : (a.completed ? 1 : 2));
    const rankB = b.claimed ? 3 : (bCanClaim ? 0 : (b.completed ? 1 : 2));
    if (rankA !== rankB) return rankA - rankB;
    const pctA = da ? (Number(a.progress || 0) / Math.max(1, Number(da.target || 1))) : 0;
    const pctB = db ? (Number(b.progress || 0) / Math.max(1, Number(db.target || 1))) : 0;
    return pctB - pctA;
  });

  sortedChallenges.forEach(ch => {
    const def = window.CHALLENGES[ch.id];
    if (!def) return;

    if (ch.completed) completedCount++;
    const pct = Math.min(100, Math.round((ch.progress / def.target) * 100));
    const canClaim = ch.completed && !ch.claimed;

    html += `
      <div class="challenge-card" style="padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:4px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
          <div>
            <strong style="color:var(--accent);">${def.name}</strong>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${def.description}</div>
          </div>
          <span style="font-size:11px;color:${ch.completed ? 'var(--gold)' : 'var(--muted)'};font-weight:700;">
            ${formatChallengeValue(def, ch.progress)}/${formatChallengeValue(def, def.target)}
          </span>
        </div>
        <div style="height:6px;background:var(--panel1);border-radius:3px;overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;background:linear-gradient(90deg, var(--accent), var(--accent2));width:${pct}%;transition:width 0.3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;color:var(--muted);">
          <span>${formatChallengeRewardText(def)}</span>
          ${ch.claimed
            ? '<span style="color:var(--gold);font-weight:700;">✓ Eingeloest</span>'
            : (canClaim
              ? '<button class="buy-btn" style="padding:4px 8px;font-size:10px;" onclick="claimChallenge(\'' + ch.id + '\')">Claim</button>'
              : '')}
        </div>
      </div>
    `;
  });

  const total = (G.dailyChallenges || []).length;
  const countEl = document.getElementById('ch-count');
  if (countEl) countEl.textContent = completedCount + '/' + total + ' done';

  grid.innerHTML = html || '<p style="color:var(--muted);padding:20px;">Keine Challenges verfuegbar</p>';
  if (typeof updateMissionBadge === 'function') updateMissionBadge();
}

// ── Traders Panel rendern ──────────────────────────────────────
function renderTraders() {
  const grid = document.getElementById('trader-grid');
  if (!grid) return;

  if (!G.npcTraders || Object.keys(G.npcTraders).length === 0) {
    G.npcTraders = generateNPCDealsForDay();
    G.npcUsedToday = G.npcUsedToday || {};
  }

  let html = '';
  let total = 0;
  let usedCount = 0;

  (window.NPC_TRADERS || []).forEach(npc => {
    const deal = G.npcTraders[npc.id];
    const used = G.npcUsedToday[npc.id];
    if (!deal) return;

    total++;
    if (used) usedCount++;

    let dealHtml = '';
    if (deal.type === 'coin_cash') {
      const mult = Math.round((deal.multiplier - 1) * 100);
      const sign = mult > 0 ? '+' : '';
      dealHtml = '<strong>' + deal.coin + '</strong> bis zu ' + (deal.maxCoins || 1) + ' Coins: ' +
        '<span style="color:' + (mult > 0 ? 'var(--gold)' : 'var(--error)') + ';font-weight:700;">' + sign + mult + '%</span>';
    } else if (deal.type === 'chip_discount') {
      dealHtml = '<strong>' + deal.discount + '% Chip Rabatt</strong> fuer 5 Min';
    } else if (deal.type === 'energy_restore') {
      dealHtml = '<strong>Energy Restore</strong> ' + (deal.description || '') + ' fuer $' + fmtNum(deal.cost || 0);
    } else if (deal.type === 'rig_mod_unlock') {
      dealHtml = '<strong>Rig Mod:</strong> ' + (deal.modName || deal.description || 'Unbekannt') +
        ' fuer $' + fmtNum(deal.cost || 0);
    } else if (deal.type === 'chips_bulk') {
      const base = deal.basePrice || ((deal.count || 0) * 60);
      const final = Math.max(1, Math.floor(base * (1 - (deal.discount || 0) / 100)));
      dealHtml = '<strong>' + (deal.count || 1) + 'x Mystery Chips</strong> ' +
        (deal.discount || 0) + '% Off - $' + fmtNum(final);
    } else if (deal.type === 'wildcard') {
      dealHtml = '<strong>' + (deal.title || 'Wildcard') + '</strong> ' + (deal.description || '');
    }

    html += `
      <div class="trader-card" style="padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:4px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:20px;">${npc.emoji}</span>
          <div>
            <strong>${npc.name}</strong>
            <div style="font-size:10px;color:var(--muted);">${npc.title}</div>
          </div>
        </div>
        <div style="padding:8px;background:var(--panel1);border-radius:3px;font-size:12px;margin-bottom:8px;">
          ${dealHtml}
        </div>
        <button class="buy-btn" style="width:100%;padding:6px;font-size:11px;"
          ${used ? 'disabled' : 'onclick="acceptNPCDeal(\'' + npc.id + '\')"'}>
          ${used ? '✓ Heute genutzt' : 'Deal akzeptieren'}
        </button>
      </div>
    `;
  });

  const countEl = document.getElementById('tr-count');
  if (countEl) countEl.textContent = (total - usedCount) + '/' + total + ' verfuegbar';

  grid.innerHTML = html || '<p style="color:var(--muted);padding:20px;">Keine Trader verfuegbar</p>';
}
