// ============================================================
// UI — Render-Funktionen (alle DOM-Updates)
// Kein Spiellogik — nur Darstellung.
// ============================================================

let _currentFilter = 'all';

function countClaimableContracts() {
  if (!Array.isArray(G.contracts)) return 0;
  return G.contracts.filter((c) => c && c.accepted && !c.completed && isContractComplete(c)).length;
}

function countClaimableGoals() {
  const goals = window.GOALS || [];
  const claimed = G.goalsClaimed || {};
  let total = 0;
  goals.forEach((goal) => {
    if (!goal || claimed[goal.id]) return;
    const progress = typeof window.getGoalProgressValue === 'function'
      ? window.getGoalProgressValue(goal)
      : 0;
    if (progress >= Number(goal.target || 0)) total++;
  });
  return total;
}

function countClaimableChallenges() {
  if (!Array.isArray(G.dailyChallenges)) return 0;
  return G.dailyChallenges.filter((ch) => ch && ch.completed && !ch.claimed).length;
}

function updateMissionBadge() {
  const badge = document.getElementById('mission-badge');
  if (!badge) return;
  const canClaimDaily = (Date.now() - Number(G.lastDaily || 0)) >= 86400000;
  const claimables = countClaimableContracts() + countClaimableGoals() + countClaimableChallenges();
  const storyProgress = (typeof window.getStoryMissionProgress === 'function')
    ? getStoryMissionProgress()
    : null;
  const storyDone = !!(storyProgress && storyProgress.mission && storyProgress.done);
  badge.style.display = (canClaimDaily || claimables > 0 || storyDone) ? 'inline' : 'none';
}

// ── Rigs ─────────────────────────────────────────────────────
function renderRigs() {
  const grid = document.getElementById('rig-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const locCap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const capLeft = Math.max(0, locCap - totalRigs);
  const sortMode = String(G.uiRigSort || 'tier');
  const ownedOnly = !!G.uiRigOwnedOnly;
  const rigs = (RIGS || []).slice().filter((rig) => !ownedOnly || Number((G.rigs || {})[rig.id] || 0) > 0);
  rigs.sort((a, b) => {
    if (sortMode === 'hps') return Number(b.hps || 0) - Number(a.hps || 0);
    if (sortMode === 'cost') return Number(a.baseCost || 0) - Number(b.baseCost || 0);
    if (sortMode === 'owned') return Number((G.rigs[b.id] || 0)) - Number((G.rigs[a.id] || 0));
    return Number(a.unlock || 0) - Number(b.unlock || 0);
  });

  rigs.forEach(r => {
    const owned    = G.rigs[r.id] || 0;
    const leased   = Math.max(0, Number((G.leasedRigs || {})[r.id] || 0));
    const sellable = Math.max(0, owned - leased);
    const unlocked = G.totalRigs >= r.unlock;
    const hps      = getRigHps(r.id);
    const cost1    = getRigCost(r.id, 1);
    const cost5    = getRigCost(r.id, 5);
    const maxN     = getMaxBuyable(r.id);
    const powerCapN = (typeof getMaxRigBuyByPower === 'function') ? Math.max(0, Number(getMaxRigBuyByPower(r.id) || 0)) : maxN;
    const capFillN = Math.max(0, Math.min(maxN, capLeft, powerCapN));
    const costMax  = maxN > 0 ? getRigCost(r.id, maxN) : 0;
    const sellOne  = (typeof getRigSellValue === 'function') ? getRigSellValue(r.id, 1) : 0;
    const sellCooldownSec = (typeof getRigSellCooldownRemaining === 'function')
      ? getRigSellCooldownRemaining(r.id)
      : 0;
    const canSell = sellable > 0 && sellCooldownSec <= 0;
    const sellLabel = canSell ? ('+$' + fmtNum(sellOne)) : ('CD ' + fmtNum(sellCooldownSec, 1) + 's');
    const repairCost = (typeof getRigRepairCost === 'function') ? getRigRepairCost(r.id, 100) : 0;
    const repairLtcCost = (typeof getRigRepairLtcCost === 'function') ? getRigRepairLtcCost(r.id, 100) : 0;
    const canRepair = repairCost > 0 &&
      Number(G.usd || 0) >= repairCost &&
      Number((G.coins || {}).LTC || 0) + 1e-9 >= repairLtcCost;
    const sellAll = (typeof getRigSellValue === 'function') ? getRigSellValue(r.id, sellable) : 0;
    const sellAllLabel = canSell ? ('+$' + fmtNum(sellAll)) : ('CD ' + fmtNum(sellCooldownSec, 1) + 's');
    const canLease = unlocked && capLeft > 0;
    const leaseCost = Math.ceil(cost1 * 0.18);
    const buyoutCost = Math.ceil(cost1 * 0.72);
    const target   = G.rigTargets[r.id] || G.selectedCoin || 'BTC';
    const tColor   = (COIN_DATA[target] || {}).color || '#fff';
    const rigPowerKw = ((Number(r.powerW || 0) * owned) / 1000);
    const mods     = (G.rigMods && Array.isArray(G.rigMods[r.id])) ? G.rigMods[r.id] : [];
    const unlockedMods = Array.isArray(G.unlockedMods) ? G.unlockedMods : [];
    const modBonuses = window.calculateRigModBonuses ? calculateRigModBonuses(mods) : { dualCoin: false };
    const coinKeys = Object.keys(COIN_DATA || {});
    const coinIdx = Math.max(0, coinKeys.indexOf(target));
    const secondCoin = coinKeys[(coinIdx + 1) % coinKeys.length] || target;
    const targetLabel = modBonuses.dualCoin && secondCoin !== target ? (target + ' + ' + secondCoin) : target;
    const rawEnergy = (G.rigEnergy && Number.isFinite(G.rigEnergy[r.id])) ? G.rigEnergy[r.id] : 100;
    const energy = Math.max(0, Math.min(100, rawEnergy));
    const energyClass = energy < 12 ? 'danger' : (energy < 35 ? 'warn' : 'ok');
    const energyHint = energy < 12 ? '⚠️ Kritisch: Explosionsrisiko hoch' : '';
    const thermal = (typeof window.getRigThermalEffects === 'function')
      ? getRigThermalEffects(r.id)
      : { heat: 0, severity: 'ok' };
    const heat = Math.max(0, Math.min(100, Number(thermal.heat || 0)));
    const heatClass = thermal.severity === 'critical' ? 'danger' : (thermal.severity === 'danger' ? 'warn' : (thermal.severity === 'warn' ? 'warn' : 'ok'));
    const heatHint = thermal.severity === 'critical'
      ? '🔥 Thermal kritisch - Explosionsrisiko steigt'
      : (thermal.severity === 'danger' ? '🌡️ Heiss - bitte Cooling/Fokus pruefen' : '');

    // Coin-Zuweisung Buttons (nur für Rigs mit count > 0)
    let coinSel = '';
    if (owned > 0) {
      const btnParts = Object.entries(COIN_DATA).map(([coin, cd]) => {
        const isActive = target === coin;
        return `<button class="rig-coin-btn c${coin.toLowerCase()}${isActive ? ' active' : ''}"
          onclick="setRigTarget('${r.id}','${coin}');event.stopPropagation()"
          title="${cd.name}">${cd.symbol}</button>`;
      }).join('');
      coinSel = `<div class="rig-coin-row">
        <span class="rig-coin-label">⛏️ Mine:</span>
        <div class="rig-coin-btns">${btnParts}</div>
        <span class="rig-coin-target" style="color:${tColor}">${targetLabel}</span>
      </div>`;
    }

    let modSel = '';
    if (owned > 0) {
      if (!unlockedMods.length) {
        modSel = '<div class="rig-mod-row rig-mod-row-empty">🧩 Keine Mods freigeschaltet</div>';
      } else {
        const modButtons = unlockedMods.map((modId) => {
          const mod = (window.RIG_MODS || {})[modId];
          if (!mod) return '';
          const active = mods.includes(modId);
          return `<button class="rig-mod-btn${active ? ' active' : ''}" onclick="setRigMod('${r.id}','${modId}');event.stopPropagation()" title="${mod.description}">${mod.name}</button>`;
        }).join('');
        modSel = `<div class="rig-mod-wrap">
          <div class="rig-mod-head">🧩 Mods <span>${mods.length}/2</span></div>
          <div class="rig-mod-btns">${modButtons}</div>
        </div>`;
      }
    }

    const energyHtml = owned > 0
      ? `<div class="rig-energy-wrap">
           <div class="rig-energy-head">
             <span>🔋 Haltbarkeit</span>
             <span>${energy.toFixed(0)}%</span>
           </div>
           <div class="rig-energy-bar">
             <div class="rig-energy-fill ${energyClass}" style="width:${energy.toFixed(1)}%"></div>
           </div>
           ${energyHint ? `<div class="rig-energy-hint">${energyHint}</div>` : ''}
           <div class="rig-energy-head" style="margin-top:6px;">
             <span>🌡️ Hitze</span>
             <span>${heat.toFixed(0)}%</span>
           </div>
           <div class="rig-energy-bar">
             <div class="rig-energy-fill ${heatClass}" style="width:${heat.toFixed(1)}%"></div>
           </div>
           ${heatHint ? `<div class="rig-energy-hint">${heatHint}</div>` : ''}
         </div>`
      : '';

    const div = document.createElement('div');
    div.className = 'rig-card ' + r.color + (unlocked ? '' : ' locked');
    div.innerHTML = `
      <div class="rig-header">
        <div class="rig-name">${r.icon} ${r.name}</div>
        <div class="rig-count">${owned}</div>
      </div>
      <div class="rig-desc">${r.desc}</div>
      <div class="rig-stats">
        <div class="rig-stat"><span class="label">H/s:</span><span class="val">${fmtNum(hps)}</span></div>
        <div class="rig-stat"><span class="label">Gesamt:</span><span class="val">${fmtNum(owned * hps)}</span></div>
        ${owned > 0 ? `<div class="rig-stat"><span class="label">Leasing:</span><span class="val">${leased}/${owned}</span></div>` : ''}
        ${owned > 0 ? `<div class="rig-stat"><span class="label">Ziel:</span><span class="val" style="color:${tColor}">${targetLabel}</span></div>` : ''}
        ${owned > 0 ? `<div class="rig-stat"><span class="label">kW:</span><span class="val">${fmtNum(rigPowerKw, 2)}</span></div>` : ''}
      </div>
      ${coinSel}
      ${energyHtml}
      ${modSel}
      ${!unlocked
        ? `<div style="font-size:11px;color:var(--muted);">🔒 Benötigt ${r.unlock} Rigs gesamt</div>`
        : `<div class="rig-btns">
            <button class="buy-btn" ${G.usd >= cost1 && capLeft > 0 ? '' : 'disabled'} onclick="buyRig('${r.id}',1)">
              Kaufen<br><small>$${fmtNum(cost1)}</small>
            </button>
            <button class="buy-btn" ${G.usd >= cost5 && capLeft > 0 ? '' : 'disabled'} onclick="buyRig('${r.id}',5)">
              ×5<br><small>$${fmtNum(cost5)}</small>
            </button>
            <button class="buy-btn" ${capFillN > 0 ? '' : 'disabled'} onclick="buyRigUntilCap('${r.id}')">
              Cap Fill<br><small>${capFillN > 0 ? ('×' + fmtNum(capFillN, 0)) : '--'}</small>
            </button>
            <button class="buy-btn max" ${maxN > 0 ? '' : 'disabled'} onclick="buyMax('${r.id}')">
              MAX(${maxN})<br><small>${maxN > 0 ? '$' + fmtNum(costMax) : '--'}</small>
            </button>
          </div>
          <div class="rig-btns" style="margin-top:6px;">
            <button class="buy-btn" style="background:linear-gradient(135deg,#74434c,#4f2c33);" ${canSell ? '' : 'disabled'} onclick="sellRig('${r.id}',1)">
              Verkauf<br><small>${sellable > 0 ? sellLabel : '--'}</small>
            </button>
            <button class="buy-btn" style="background:linear-gradient(135deg,#3d6e56,#234338);" ${canRepair ? '' : 'disabled'} onclick="repairRig('${r.id}')">
              Reparieren<br><small>${repairCost > 0 ? ('$' + fmtNum(repairCost) + ' + Ł' + fmtNum(repairLtcCost, 4)) : '100%'}</small>
            </button>
            <button class="buy-btn" style="background:linear-gradient(135deg,#7a3f48,#4f2930);" ${canSell ? '' : 'disabled'} onclick="sellRig('${r.id}',${sellable})">
              Alle verkaufen<br><small>${sellable > 0 ? sellAllLabel : '--'}</small>
            </button>
            <button class="buy-btn" style="background:linear-gradient(135deg,#7b6a3d,#4f4327);" ${canLease && G.usd >= leaseCost ? '' : 'disabled'} onclick="leaseRig('${r.id}',1)">
              Lease 1x<br><small>$${fmtNum(leaseCost)}</small>
            </button>
            <button class="buy-btn" style="background:linear-gradient(135deg,#76533d,#4e3526);" ${leased > 0 && G.usd >= buyoutCost ? '' : 'disabled'} onclick="buyoutLeasedRig('${r.id}',1)">
              Uebernehmen<br><small>${leased > 0 ? '$' + fmtNum(buyoutCost) : '--'}</small>
            </button>
          </div>
          ${capLeft <= 0 ? '<div style="margin-top:6px;font-size:10px;color:#ff7d8d;">🏢 Standortlimit erreicht — erst umziehen.</div>' : ''}`}
      <div class="rig-progress">
        <div class="rig-progress-bar" style="width:${Math.min(100, owned / Math.max(1, r.unlock + 5) * 100)}%"></div>
      </div>`;
    grid.appendChild(div);
  });

  const autoRepairToggle = document.getElementById('rig-auto-repair-toggle');
  const autoRepairLabel = document.getElementById('rig-auto-repair-toggle-label');
  if (autoRepairToggle) {
    const enabledCount = Object.values(G.rigAutoRepair || {}).filter(Boolean).length;
    const total = (RIGS || []).length || 1;
    const enabled = enabledCount >= total;
    autoRepairToggle.classList.toggle('on', enabled);
    if (autoRepairLabel) autoRepairLabel.textContent = 'Auto-Reparatur (' + autoRepairIntervalSec + 's): ' + (enabled ? 'AN' : 'AUS');
  }
}

// ── Upgrades ─────────────────────────────────────────────────
function renderUpgrades(filter) {
  filter = filter || _currentFilter || 'all';
  const grid = document.getElementById('upgrade-grid');
  if (!grid) return;
  grid.innerHTML = '';

  let available = 0, bought = 0;

  UPGRADES.forEach(u => {
    if (filter !== 'all' && u.category !== filter) return;
    const isBought = G.upgrades.includes(u.id);
    const reqMet   = !u.req || G.upgrades.includes(u.req);
    const minPrestige = Math.max(0, Number(u.minPrestige || 0));
    const prestigeMet = Number(G.prestigeCount || 0) >= minPrestige;
    const effectiveCost = (typeof window.getEffectiveUpgradeCost === 'function')
      ? getEffectiveUpgradeCost(u.id)
      : Number(u.cost || 0);
    if (isBought) bought++;
    else if (reqMet && prestigeMet && Number(G.usd || 0) >= effectiveCost) available++;

    const div = document.createElement('div');
    const locked = !reqMet || !prestigeMet;
    div.className = 'upgrade-card' + (isBought ? ' bought' : '') + (locked ? ' locked' : '');
    div.onclick   = (!isBought && !locked) ? () => buyUpgrade(u.id) : null;
    div.innerHTML = `
      <div class="upgrade-icon">${u.icon}</div>
      <div class="upgrade-name">${u.name}</div>
      <div class="upgrade-desc">${u.desc}</div>
      ${!isBought && !locked
        ? `<div class="upgrade-cost">$${fmtNum(effectiveCost)} ${G.usd >= effectiveCost ? '✅' : '❌'}</div>`
        : ''}
      ${!reqMet
        ? `<div style="font-size:10px;color:var(--muted);">🔒 Benötigt vorheriges Upgrade</div>`
        : ''}`;
    if (!prestigeMet) {
      div.innerHTML += `<div style="font-size:10px;color:var(--orange);">🔒 Verfügbar ab Prestige ${minPrestige}</div>`;
    }
    grid.appendChild(div);
  });

  const countEl = document.getElementById('upg-count');
  if (countEl) countEl.textContent = bought + '/' + UPGRADES.length + ' gekauft';

  const badge = document.getElementById('upg-badge');
  if (badge) badge.style.display = available > 0 ? 'inline' : 'none';
}

// ── Market ───────────────────────────────────────────────────
function renderMarket() {
  const grid = document.getElementById('market-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (typeof ensureAutoSellCoinState === 'function') ensureAutoSellCoinState();

  const label = document.getElementById('auto-sell-label');
  const topToggle = document.getElementById('auto-sell-toggle');
  const autoMap = (G.autoSellCoins && typeof G.autoSellCoins === 'object') ? G.autoSellCoins : {};
  const enabledCount = Object.keys(COIN_DATA || {}).reduce((sum, coin) => sum + (autoMap[coin] ? 1 : 0), 0);
  if (label) label.textContent = 'Auto-Sell pro Coin (' + enabledCount + '/' + Object.keys(COIN_DATA || {}).length + ')';
  if (topToggle) topToggle.classList.toggle('on', enabledCount > 0);

  const trend = document.createElement('div');
  trend.style.cssText = 'padding:10px 12px;margin-bottom:10px;background:var(--panel2);border:1px solid var(--border);border-radius:6px;font-size:12px;color:var(--muted);';
  const regimeRaw = String(G.marketRegime || 'range');
  const regime = (regimeRaw === 'neutral') ? 'range' : regimeRaw;
  const regimeLabel = regime === 'bull' ? 'bull' : (regime === 'bear' ? 'bear' : 'range');
  const shock = Number(G.marketShockTimer || 0) > 0;
  const nextPhase = Math.max(0, Number(G.marketRegimeTimer || 0));
  const floorPct = Math.round(Math.max(0, Number(G._marketFloorMult || 0.45)) * 100);
  trend.innerHTML = '📈 Regime: <strong style="color:var(--text)">' + regimeLabel + '</strong>' +
    ' · Zyklus: ' + (shock ? '<span style="color:var(--gold)">aktiv</span>' : 'ruhig') +
    ' · Wechsel in: ' + fmtTime(nextPhase) +
    ' · Markt-Floor: ' + floorPct + '%';
  grid.appendChild(trend);

  Object.entries(COIN_DATA).forEach(([coin, data]) => {
    const price   = G.prices[coin];
    const balance = G.coins[coin] || 0;
    const reserve = (typeof getCoinReserve === 'function') ? getCoinReserve(coin) : 0;
    const freeBalance = (typeof getAvailableCoinBalance === 'function')
      ? getAvailableCoinBalance(coin)
      : Math.max(0, Number(balance || 0) - Number(reserve || 0));
    const history = G.priceHistory[coin] || [];
    const lookback = history.length > 8 ? history[history.length - 8] : (history.length > 1 ? history[0] : price);
    const baseForChange = Math.max(0.0001, Number(lookback || price || 0.0001));
    const changePct = ((price - baseForChange) / baseForChange * 100).toFixed(2);
    const up        = parseFloat(changePct) >= 0;

    // Rigs die diese Coin minen
    const miners = RIGS.filter(r => {
      const owned = G.rigs[r.id] || 0;
      if (!owned) return false;
      return (G.rigTargets[r.id] || G.selectedCoin || 'BTC') === coin;
    });
    const minerText = miners.length
      ? miners.map(r => r.icon + ' ' + r.name + ' ×' + G.rigs[r.id]).join(', ')
      : 'Keine Rigs zugewiesen';
    const profile = (typeof getCoinProfile === 'function')
      ? getCoinProfile(coin)
      : { miningHashMult: 1, convMult: 1, yieldLabel: 'Standard' };
    const convRateCoin = (typeof getConvRateForCoin === 'function')
      ? getConvRateForCoin(coin)
      : (typeof getConvRate === 'function' ? getConvRate() : HASH_PER_COIN);
    const yieldIndex = Math.max(1, Math.round((Number(profile.miningHashMult || 1) / Math.max(0.1, Number(profile.convMult || 1))) * 100));
    const utilityRole = coin === 'ETH'
      ? 'Utility: Research-Fuel'
      : (coin === 'LTC'
        ? 'Utility: Reparaturen'
        : (coin === 'BTC'
          ? 'Utility: Power-Upgrades'
          : 'Utility: Ops-Rabatt (Holding)'));
    const autoEnabled = !!autoMap[coin];
    const canSellAny = freeBalance > 0.009;

    const priceDecimals = price >= 1000 ? 2 : 3;
    const div = document.createElement('div');
    div.className = 'coin-card';
    div.innerHTML = `
      <div class="coin-header">
        <div class="coin-name"><span class="coin-symbol">${data.symbol}</span>${data.name}</div>
      </div>
      <div class="coin-price" style="color:${data.color}">$${fmtNum(price, priceDecimals)}</div>
      <div class="coin-change" style="color:${up ? 'var(--green)' : 'var(--red)'}">
        ${up ? '▲' : '▼'} ${Math.abs(changePct)}%
      </div>
      <div class="coin-miners">⛏️ ${minerText}</div>
      <div class="coin-miners">🧠 ${utilityRole}</div>
      <div class="coin-miners">🎛️ ${profile.yieldLabel || 'Standard'} · H/Coin ${fmtNum(convRateCoin, 0)} · Yield-Index ${yieldIndex}</div>
      <div class="coin-auto-row">
        <span>Auto-Sell ${coin}</span>
        <div class="toggle ${autoEnabled ? 'on' : ''}" onclick="toggleAutoSellCoin('${coin}')"></div>
      </div>
      <div class="coin-balance">
        Balance: <span>${fmtNum(balance, 4)} ${coin}</span>
        = <span style="color:var(--gold)">$${fmtNum(balance * price * G._priceMult, 2)}</span>
      </div>
      <div class="coin-miners">Reserve: ${fmtNum(reserve, 4)} ${coin} · Frei: ${fmtNum(freeBalance, 4)} ${coin}</div>
      <div class="sell-btns">
        <button class="sell-btn half" ${canSellAny ? '' : 'disabled'} onclick="sellCoins('${coin}', 0.5)">Sell 50%</button>
        <button class="sell-btn all" ${canSellAny ? '' : 'disabled'} onclick="sellCoins('${coin}', 1)">Sell ALL</button>
      </div>
      <canvas class="price-chart" id="chart-${coin}" height="60"></canvas>`;
    grid.appendChild(div);
    requestAnimationFrame(() => drawChart(coin, data.color));
  });
}

// ── Research ─────────────────────────────────────────────────
function renderResearch() {
  const tree = document.getElementById('research-tree');
  if (!tree) return;
  tree.innerHTML = '';

  const hasParallel = G.chipShop['cu5'];

  if (hasParallel) {
    const banner = document.createElement('div');
    banner.className = 'research-slots-banner';
    const s1 = G.activeResearch  ? '🔬 ' + (RESEARCH.find(x => x.id === G.activeResearch)?.name  || '...') : '— frei —';
    const s2 = G.activeResearch2 ? '🔬 ' + (RESEARCH.find(x => x.id === G.activeResearch2)?.name || '...') : '— frei —';
    banner.innerHTML = `
      <div class="slot-badge"><strong>Slot 1:</strong> ${s1}</div>
      <div class="slot-badge"><strong>Slot 2:</strong> ${s2}</div>`;
    tree.appendChild(banner);
  }

  RESEARCH.forEach(r => {
    const done    = G.research.includes(r.id);
    const inSlot1 = G.activeResearch  === r.id;
    const inSlot2 = G.activeResearch2 === r.id;
    const active  = inSlot1 || inSlot2;
    const reqMet  = r.req.every(req => G.research.includes(req));
    const minPrestige = Math.max(0, Number(r.minPrestige || 0));
    const prestigeMet = Number(G.prestigeCount || 0) >= minPrestige;
    const locked  = !reqMet || !prestigeMet;

    const prog    = active
      ? Math.floor(((inSlot1 ? G.researchProgress : G.researchProgress2) / r.time) * 100)
      : 0;
    const barId   = inSlot2 ? 'rp2-' + r.id : 'rp-' + r.id;

    const slot1Free = !G.activeResearch;
    const slot2Free = !G.activeResearch2;
    const usdCost = (typeof window.getEffectiveResearchCost === 'function') ? getEffectiveResearchCost(r.id) : Number(r.cost || 0);
    const ethCost = (typeof window.getResearchEthCostByUsd === 'function') ? getResearchEthCostByUsd(usdCost) : 0;
    const hasUsd = Number(G.usd || 0) >= usdCost;
    const hasEth = Number((G.coins || {}).ETH || 0) + 1e-9 >= ethCost;
    const canStart  = !done && !locked && !active && (slot1Free || (hasParallel && slot2Free)) && hasUsd && hasEth;

    const div = document.createElement('div');
    div.className = 'research-card' +
      (done   ? ' unlocked'        : '') +
      (locked ? ' locked'          : '') +
      (active ? ' active-research' : '');
    div.onclick = canStart ? () => startResearch(r.id) : null;

    const slotLabel = inSlot2 ? ' [Slot 2]' : '';
    const timeLabel = Math.floor(r.time / G._researchSpeedMult) + 's';

    div.innerHTML = `
      <div class="research-icon">${r.icon}</div>
      <div class="research-name">${r.name}${active ? slotLabel : ''}</div>
      <div class="research-desc">${r.desc}</div>
      <div class="research-cost">
        ${done   ? '✅ Abgeschlossen' :
          locked ? '🔒 Gesperrt' :
          active ? '⏳ ' + prog + '%' :
                   '$' + fmtNum(usdCost) + ' + Ξ' + fmtNum(ethCost, 4) + ' | ' + timeLabel}
      </div>
      ${active
        ? `<div class="research-progress">
            <div class="research-progress-bar" id="${barId}" style="width:${prog}%"></div>
           </div>`
        : ''}
      ${!done && !active
        ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">Budget: ${hasUsd ? 'USD ✅' : 'USD ❌'} · ${hasEth ? 'ETH ✅' : 'ETH ❌'}</div>`
        : ''}
      ${r.req.length > 0 && !done
        ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">Req: ${r.req.join(', ')}</div>`
        : ''}
      ${!prestigeMet && !done
        ? `<div style="font-size:10px;color:var(--orange);margin-top:4px;">Req: Prestige ${minPrestige}</div>`
        : ''}`;
    tree.appendChild(div);
  });
}

// ── Staff ────────────────────────────────────────────────────
function renderStaff() {
  const grid = document.getElementById('staff-grid');
  if (!grid) return;
  grid.innerHTML = '';

  STAFF.forEach(s => {
    const hired = G.staff[s.id] || 0;
    const cost  = getStaffCost(s.id);
    const maxed = hired >= s.maxHire;
    const minPrestige = Math.max(0, Number(s.minPrestige || 0));
    const prestigeMet = Number(G.prestigeCount || 0) >= minPrestige;
    const wage = Math.max(0, Number(s.wagePerDay || 0));

    const div = document.createElement('div');
    div.className = 'staff-card';
    div.innerHTML = `
      <div class="staff-avatar">${s.icon}</div>
      <div class="staff-name">${s.name}</div>
      <div class="staff-role">${s.role}</div>
      <div class="staff-bonus">${s.desc}</div>
      <div class="staff-role">Fixkosten: $${fmtNum(wage, 2)} / Tag</div>
      <div class="staff-count">
        <span class="staff-hired">${hired}/${s.maxHire} angeheuert</span>
      </div>
      ${!prestigeMet ? `<div style="font-size:10px;color:var(--orange);margin-bottom:4px;">🔒 Verfügbar ab Prestige ${minPrestige}</div>` : ''}
      <button class="hire-btn" ${maxed || G.usd < cost || !prestigeMet ? 'disabled' : ''} onclick="hireStaff('${s.id}')">
        ${maxed ? '✓ MAX' : 'Hire — $' + fmtNum(cost)}
      </button>`;
    grid.appendChild(div);
  });
}

function renderRigCrew() {
  const grid = document.getElementById('crew-grid');
  const crewTiers = Array.isArray(window.RIG_STAFF_TIERS) ? window.RIG_STAFF_TIERS : [];
  if (!grid || !crewTiers.length) return;
  const activeEl = document.activeElement;
  if (activeEl && activeEl.tagName === 'SELECT' && activeEl.closest('#crew-grid')) return;
  grid.innerHTML = '';

  const coveragePct = fmtNum(Math.max(0, Math.min(100, Number(G._rigStaffCoverage || 0) * 100)), 0);
  const dailyWages = (typeof getRigStaffDailyWages === 'function') ? getRigStaffDailyWages() : 0;
  const activeRigRows = (RIGS || []).filter((rig) => Number((G.rigs || {})[rig.id] || 0) > 0);
  const activeRigCount = activeRigRows.length;
  const avgRepair = activeRigCount > 0
    ? activeRigRows.reduce((sum, rig) => {
        const stats = (typeof getRigMaintenanceStats === 'function') ? getRigMaintenanceStats(rig.id) : { repairPerSec: 0 };
        return sum + Number(stats.repairPerSec || 0);
      }, 0) / activeRigCount
    : 0;
  const avgCrashCut = activeRigCount > 0
    ? activeRigRows.reduce((sum, rig) => {
        const stats = (typeof getRigMaintenanceStats === 'function') ? getRigMaintenanceStats(rig.id) : { crashReduction: 0 };
        return sum + Number(stats.crashReduction || 0);
      }, 0) / activeRigCount
    : 0;
  const crewWrap = document.createElement('div');
  crewWrap.className = 'ops-staff-wrap';
  crewWrap.innerHTML = `
    <div class="ops-staff-head">
      <h3>🛠️ Rig-Crew (manuelle Zuweisung pro Rig-Typ)</h3>
      <div class="ops-staff-meta">
        <span>Abdeckung: ${coveragePct}%</span>
        <span>Lohn / Tag: $${fmtNum(dailyWages, 2)}</span>
      </div>
      <div class="ops-staff-meta" style="margin-top:6px;">
        <span>Avg Repair: +${fmtNum(avgRepair, 2)}%/s</span>
        <span>Avg Crash-Cut: ${fmtNum(avgCrashCut * 100, 1)}%</span>
      </div>
    </div>`;

  const crewActions = document.createElement('div');
  crewActions.className = 'ops-staff-actions';
  crewActions.innerHTML = `
    <button class="hire-btn ops-assign-btn" onclick="autoAssignRigStaff()">🤖 Auto zuweisen</button>
    <button class="hire-btn ops-assign-btn" onclick="runRigCrewBatch('throughput')">🚀 Batch Durchsatz</button>
    <button class="hire-btn ops-assign-btn" onclick="runRigCrewBatch('maintenance')">🔧 Batch Wartung</button>
    <button class="hire-btn ops-assign-btn" onclick="runRigCrewBatch('safety')">🛡️ Batch Safety</button>
    <button class="hire-btn ops-reset-btn" onclick="resetRigStaffAssignments()">♻️ Neu verteilen</button>`;
  crewWrap.appendChild(crewActions);

  const tierGrid = document.createElement('div');
  tierGrid.className = 'ops-tier-grid';
  crewTiers.forEach((tier) => {
    const hired = Number((G.hiredRigStaff && G.hiredRigStaff[tier.id]) || 0);
    const assigned = (typeof getTotalAssignedRigStaffByTier === 'function')
      ? getTotalAssignedRigStaffByTier(tier.id)
      : 0;
    const progress = (typeof window.getRigCrewTierProgress === 'function')
      ? getRigCrewTierProgress(tier.id)
      : { level: 1, xp: 0, spec: 'balanced' };
    const xpTarget = (typeof window.getRigCrewXpTarget === 'function')
      ? getRigCrewXpTarget(progress.level)
      : 100;
    const specs = window.HV_RIG_CREW_SPECS || { balanced: { label: 'Balanced' } };
    const free = Math.max(0, hired - assigned);
    const hireCost = (typeof getRigStaffHireCost === 'function')
      ? getRigStaffHireCost(tier.id)
      : Number(tier.hireBaseCost || 0);

    const card = document.createElement('div');
    card.className = 'ops-tier-card';
    const specOptions = Object.keys(specs).map((k) => `<option value="${k}" ${progress.spec === k ? 'selected' : ''}>${specs[k].label}</option>`).join('');
    const xpPct = Math.max(0, Math.min(100, Math.round((Number(progress.xp || 0) / Math.max(1, xpTarget)) * 100)));
    card.innerHTML = `
      <div class="ops-tier-head">${tier.icon} ${tier.name}</div>
      <div class="ops-tier-line">Level: ${progress.level} · XP ${fmtNum(progress.xp, 0)}/${fmtNum(xpTarget, 0)}</div>
      <div style="height:5px;background:var(--panel1);border-radius:3px;overflow:hidden;margin:4px 0 6px;">
        <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));"></div>
      </div>
      <div class="ops-tier-line">Spezialisierung:
        <select onchange="setRigCrewSpec('${tier.id}', this.value)" style="margin-left:6px;padding:2px 4px;border-radius:6px;background:var(--panel1);border:1px solid var(--border);color:var(--text);font-size:11px;">
          ${specOptions}
        </select>
      </div>
      <div class="ops-tier-line">Kapazitaet: ${tier.rigsPerUnit} Rigs</div>
      <div class="ops-tier-line">Repair: +${tier.repairPerSec}%/s</div>
      <div class="ops-tier-line">Crash-Reduktion: ${(tier.crashReduction * 100).toFixed(0)}%</div>
      <div class="ops-tier-line">Lohn / Tag: $${fmtNum(tier.wagePerDay, 2)}</div>
      <div class="ops-tier-line">Frei: ${free} (zugewiesen ${assigned}/${hired})</div>
      <div class="ops-tier-actions">
        <button class="hire-btn" ${G.usd >= hireCost ? '' : 'disabled'} onclick="hireRigStaff('${tier.id}')">
          + Einstellen ($${fmtNum(hireCost)})
        </button>
        <button class="hire-btn ops-fire-btn" ${free > 0 ? '' : 'disabled'} onclick="fireRigStaff('${tier.id}')">
          − Entlassen
        </button>
      </div>`;
    tierGrid.appendChild(card);
  });
  crewWrap.appendChild(tierGrid);

  const assignGrid = document.createElement('div');
  assignGrid.className = 'ops-assign-grid';
  const header = document.createElement('div');
  header.className = 'ops-assign-row ops-assign-head';
  header.innerHTML = '<span>Rig-Typ</span>' + crewTiers.map((tier) => `<span>${tier.name}</span>`).join('') + '<span>Fokus</span><span>Status</span>';
  assignGrid.appendChild(header);

  (RIGS || []).forEach((rig) => {
    const rigCount = Number((G.rigs && G.rigs[rig.id]) || 0);
    const stats = (typeof getRigMaintenanceStats === 'function')
      ? getRigMaintenanceStats(rig.id)
      : { coverage: 1, repairPerSec: 0, uncoveredRatio: 0 };
    const focusMap = window.HV_RIG_CREW_FOCUS || {};
    const focusId = String(((G.rigCrewFocus || {})[rig.id]) || 'balanced');
    const focus = focusMap[focusId] || focusMap.balanced || { label: 'Balanced', icon: '⚖️' };
    const focusOptions = Object.keys(focusMap).map((id) => {
      const meta = focusMap[id];
      return `<option value="${id}" ${focusId === id ? 'selected' : ''}>${meta.icon || ''} ${meta.label}</option>`;
    }).join('');
    const row = document.createElement('div');
    row.className = 'ops-assign-row';

    let cells = `<span>${rig.icon} ${rig.name} <small>(${rigCount})</small></span>`;
    crewTiers.forEach((tier) => {
      const assigned = Number((((G.rigStaffAssignments || {})[rig.id] || {})[tier.id]) || 0);
      cells += `<span class="ops-assign-cell">
        <button ${assigned > 0 ? '' : 'disabled'} onclick="assignRigStaff('${rig.id}','${tier.id}',-1)">-</button>
        <strong>${assigned}</strong>
        <button ${rigCount > 0 ? '' : 'disabled'} onclick="assignRigStaff('${rig.id}','${tier.id}',1)">+</button>
      </span>`;
    });
    cells += `<span>
      <select onchange="setRigCrewFocus('${rig.id}', this.value)" ${rigCount > 0 ? '' : 'disabled'}
        style="padding:2px 4px;border-radius:6px;background:var(--panel1);border:1px solid var(--border);color:var(--text);font-size:11px;">
        ${focusOptions}
      </select>
      <small style="display:block;color:var(--muted);margin-top:2px;">${focus.icon || ''} ${focus.label || ''}</small>
    </span>`;
    cells += `<span>${fmtNum(stats.coverage * 100, 0)}% | +${fmtNum(stats.repairPerSec, 2)}%/s</span>`;

    row.innerHTML = cells;
    assignGrid.appendChild(row);
  });

  crewWrap.appendChild(assignGrid);
  grid.appendChild(crewWrap);
}

function renderMissions() {
  renderContracts();
  renderChallenges();
  if (typeof window.renderStoryMissionCard === 'function') renderStoryMissionCard();
  updateDailyBar();
  updateContractTimer();
  updateMissionBadge();
}

// ── Contracts ────────────────────────────────────────────────
function renderContracts() {
  const grid = document.getElementById('contract-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!G.contracts || G.contracts.length === 0) generateContracts();

  const sortedContracts = (G.contracts || []).map((c, i) => ({ c, i })).sort((a, b) => {
    const ca = a.c || {};
    const cb = b.c || {};
    const aCanClaim = !!(ca.accepted && !ca.completed && isContractComplete(ca));
    const bCanClaim = !!(cb.accepted && !cb.completed && isContractComplete(cb));
    const aRank = ca.completed ? 3 : (aCanClaim ? 0 : (ca.accepted ? 1 : 2));
    const bRank = cb.completed ? 3 : (bCanClaim ? 0 : (cb.accepted ? 1 : 2));
    if (aRank !== bRank) return aRank - bRank;
    const aReward = Number(ca.reward || 0);
    const bReward = Number(cb.reward || 0);
    return bReward - aReward;
  });

  sortedContracts.forEach(({ c, i }) => {
    const canClaim = c.accepted && !c.completed && isContractComplete(c);
    const current = (typeof getContractCurrentValue === 'function') ? Number(getContractCurrentValue(c) || 0) : 0;
    const target = Math.max(1, Number(c.target || 1));
    const pct = Math.max(0, Math.min(100, Math.round((Math.min(current, target) / target) * 100)));
    const div      = document.createElement('div');
    div.className  = 'contract-card' +
      (c.accepted && !c.completed ? ' active'    : '') +
      (c.completed                ? ' completed' : '');

    div.innerHTML = `
      <div class="contract-type ${c.difficulty}">${c.difficulty.toUpperCase()}</div>
      <div class="contract-name">${c.name}</div>
      <div class="contract-desc">${c.desc}</div>
      <div class="contract-timer" style="margin:6px 0 4px;">Fortschritt: ${fmtNum(Math.min(current, target))} / ${fmtNum(target)}</div>
      <div style="height:6px;background:var(--panel1);border-radius:999px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .25s;"></div>
      </div>
      <div class="contract-reward">🎁 Belohnung: $${fmtNum(Math.floor(c.reward * (1 + G._contractBonus) * (typeof window.getPrestigeMissionRewardMult === 'function' ? getPrestigeMissionRewardMult() : 1)))}</div>
      ${c.completed
        ? '<div style="color:var(--green);font-weight:700;">✅ Abgeschlossen!</div>'
        : c.accepted
          ? canClaim
            ? `<button class="accept-btn" style="background:linear-gradient(135deg,var(--green),#00aa55);color:#000;"
                 onclick="claimContract(${i})">🎉 Einlösen!</button>`
            : '<div class="contract-timer">📊 In Bearbeitung…</div>'
          : `<button class="accept-btn" onclick="acceptContract(${i})">✅ Annehmen</button>`}`;
    grid.appendChild(div);
  });

  updateMissionBadge();
}

// ── Achievements ─────────────────────────────────────────────
function renderAchievements() {
  const grid = document.getElementById('ach-grid');
  if (!grid) return;
  grid.innerHTML = '';
  let unlocked = 0;

  ACHIEVEMENTS.forEach(a => {
    const done = G.achievements.includes(a.id);
    if (done) unlocked++;
    const div = document.createElement('div');
    div.className = 'ach-card' + (done ? ' unlocked' : ' locked');
    div.innerHTML = `
      <div class="ach-icon">${done ? a.icon : '🔒'}</div>
      <div class="ach-name">${done ? a.name : '???'}</div>
      <div class="ach-desc">${done ? a.desc : 'Unbekannt'}</div>
      ${done && a.rewardText ? `<div class="ach-reward">${a.rewardText}</div>` : ''}`;
    grid.appendChild(div);
  });

  const countEl = document.getElementById('ach-count');
  if (countEl) countEl.textContent = unlocked + '/' + ACHIEVEMENTS.length + ' freigeschaltet';

  const badge = document.getElementById('ach-badge');
  if (badge) badge.style.display = unlocked > (G._lastAchCount || 0) ? 'inline' : 'none';
  G._lastAchCount = unlocked;
}

// ── Prestige / Chip-Shop ─────────────────────────────────────
function renderPrestige() {
  const chipsEl = document.getElementById('hd-chips');
  if (chipsEl) chipsEl.textContent = G.chips + ' 💎';

  const grid = document.getElementById('chip-shop');
  if (!grid) return;
  grid.innerHTML = '';

  const pCount = Math.max(0, Number(G.prestigeCount || 0));
  const opsCut = Math.max(0, (1 - Math.max(0.4, Number(G._opsCostMult || 1))) * 100);
  const buildCut = Math.max(0, (1 - Math.max(0.4, Number(G._buildCostMult || 1))) * 100);
  const resCut = Math.max(0, (1 - Math.max(0.4, Number(G._researchCostMult || 1))) * 100);
  const capBoost = Math.max(0, (Math.max(1, Number(G._prestigePowerCapMult || 1)) - 1) * 100);
  const floorBoost = Math.max(0, Math.round(Math.max(0.35, Number(G._marketFloorMult || 0.45)) * 100));
  const crewEffBoost = Math.max(0, (Math.max(1, Number(G._prestigeCrewEffMult || 1)) - 1) * 100);
  const crewWageCut = Math.max(0, (1 - Math.max(0.55, Number(G._prestigeCrewWageMult || 1))) * 100);
  const shopCostCut = Math.max(0, (1 - Math.max(0.6, Number(G._prestigeShopCostMult || 1))) * 100);
  const shopSlotBonus = Math.min(6, Math.floor(pCount / 2));

  const prestigeFx = document.createElement('div');
  prestigeFx.className = 'chip-section';
  prestigeFx.innerHTML =
    '<div class="chip-section-title">📚 Prestige-Effekte</div>' +
    '<div class="chip-section-sub">Dauerhafte Skalierung pro Prestige-Durchlauf</div>' +
    '<div class="power-list-item"><span>Prestige-Level</span><strong>' + fmtNum(pCount, 0) + '</strong></div>' +
    '<div class="power-list-item"><span>Ops-Kostenreduktion</span><strong>-' + fmtNum(opsCut, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Build-/Upgrade-Kosten</span><strong>-' + fmtNum(buildCut, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Research-Kosten</span><strong>-' + fmtNum(resCut, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Power-Kapazitaet</span><strong>+' + fmtNum(capBoost, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Markt-Floor</span><strong>' + floorBoost + '% vom Basispreis</strong></div>' +
    '<div class="power-list-item"><span>Crew-Effizienz</span><strong>+' + fmtNum(crewEffBoost, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Crew-Lohnkosten</span><strong>-' + fmtNum(crewWageCut, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Standort-Shop Kosten</span><strong>-' + fmtNum(shopCostCut, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Standort-Shop Slots</span><strong>+' + fmtNum(shopSlotBonus, 0) + '</strong></div>';
  grid.appendChild(prestigeFx);

  // ── Aktive Zeitboosts anzeigen ──────────────────────────
  const now    = Date.now();
  const active = (G.activeBoosts || []).filter(b => b.endsAt > now);
  const boostNames = {
    hashburst60:  '⚡ Hash-Burst ×10',
    pricespike30: '📈 Markt-Spike ×3',
    rigsurge120:  '🏭 Rig-Überladung ×5',
    evHashBoost:  '⛏️ Event: Mining-Boost',
    evPriceBoost: '📈 Event: Preis-Boost',
    evAllBoost:   '🚀 Event: Alles-Boost',
  };

  if (active.length > 0) {
    const sec = document.createElement('div');
    sec.className = 'chip-section chip-section-active';
    sec.innerHTML = '<div class="chip-section-title">⏰ Aktive Effekte</div>';
    active.forEach(b => {
      const rem = Math.ceil((b.endsAt - now) / 1000);
      const row = document.createElement('div');
      row.className = 'active-boost-row';
      const label = boostNames[b.effect] || b.effect;
      const multText = b.mult && b.mult !== 1 ? ' ×' + b.mult.toFixed(1) : '';
      row.innerHTML = `<span>${label}${multText}</span><span class="boost-timer">${rem}s</span>`;
      sec.appendChild(row);
    });
    grid.appendChild(sec);
  }

  // ── 3 Kategorien ────────────────────────────────────────
  const categories = [
    { key:'boost',  title:'💪 Dauerhafte Boosts',   sub:'Stapelbar — bleiben nach Prestige erhalten' },
    { key:'unlock', title:'🔓 Freischaltungen',      sub:'Einmalig — schaltet neue Features permanent frei' },
    { key:'use',    title:'⚡ Verbrauchsmittel',     sub:'Kaufen = Vorrat · Benutzen = sofortiger Effekt' },
  ];

  categories.forEach(cat => {
    const items = CHIP_SHOP.filter(c => c.cat === cat.key);
    if (!items.length) return;

    const section = document.createElement('div');
    section.className = 'chip-section';
    section.innerHTML = `
      <div class="chip-section-title">${cat.title}</div>
      <div class="chip-section-sub">${cat.sub}</div>`;

    const catGrid = document.createElement('div');
    catGrid.className = 'chip-grid';

    items.forEach(c => {
      const owned  = G.chipShop[c.id] || 0;
      const maxed  = owned >= c.max;
      const canBuy = G.chips >= c.cost && !maxed;
      const div    = document.createElement('div');

      let cls = 'chip-item';
      if (cat.key === 'boost'  && maxed)  cls += ' chip-maxed';
      if (cat.key === 'unlock' && owned)  cls += ' chip-unlocked';
      div.className = cls;

      let statusHtml = '';
      let btnHtml    = '';

      if (cat.key === 'boost') {
        statusHtml = owned > 0
          ? `<span class="chip-owned">×${owned}/${c.max}</span>` : '';
        btnHtml = maxed
          ? `<button class="chip-btn chip-btn-done" disabled>✓ MAX</button>`
          : `<button class="chip-btn" ${canBuy ? '' : 'disabled'} onclick="buyChipItem('${c.id}')">
               💎 ${c.cost} — Kaufen</button>`;

      } else if (cat.key === 'unlock') {
        statusHtml = owned
          ? `<span class="chip-owned chip-check">✅ Aktiv</span>`
          : `<span class="chip-cost-badge">💎 ${c.cost}</span>`;
        btnHtml = owned
          ? `<button class="chip-btn chip-btn-done" disabled>✓ Freigeschaltet</button>`
          : `<button class="chip-btn" ${canBuy ? '' : 'disabled'} onclick="buyChipItem('${c.id}')">
               Freischalten</button>`;

      } else { // use
        statusHtml = owned > 0
          ? `<span class="chip-owned">×${owned} im Lager</span>`
          : `<span class="chip-owned chip-empty">Kein Vorrat</span>`;
        btnHtml = `
          <div class="chip-use-btns">
            <button class="chip-btn chip-btn-buy" ${canBuy ? '' : 'disabled'} onclick="buyChipItem('${c.id}')">
              💎 ${c.cost} Kaufen
            </button>
            <button class="chip-btn chip-btn-use" ${owned > 0 ? '' : 'disabled'} onclick="useChipItem('${c.id}')">
              ▶ Benutzen
            </button>
          </div>`;
      }

      div.innerHTML = `
        <div class="chip-item-header">
          <div class="chip-item-name">${c.name}</div>
          ${statusHtml}
        </div>
        <div class="chip-item-desc">${c.desc}</div>
        ${btnHtml}`;
      catGrid.appendChild(div);
    });

    section.appendChild(catGrid);
    grid.appendChild(section);
  });
}

// ── Alles rendern ────────────────────────────────────────────
function renderAll() {
  renderRigs();
  renderUpgrades();
  renderPowerPanel();
  renderMarket();
  renderResearch();
  renderStaff();
  renderRigCrew();
  renderMissions();
  renderTraders();
  renderAchievements();
  renderPrestige();
  updateHeader();
  updateDailyBar();
  // Ticker mit letztem Event aktualisieren
  if (G.recentEvents && G.recentEvents.length) {
    updateTicker(G.recentEvents[0].msg);
  }
}

// ── Header ───────────────────────────────────────────────────
function fmtClock() {
  const day = Math.max(1, Math.floor(Number(G.worldDay || 1)));
  let mins = Math.floor(Number(G.worldTimeMinutes || 0));
  mins = ((mins % 1440) + 1440) % 1440;
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return 'Tag ' + day + ' ' + hh + ':' + mm;
}

function updateHeader() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const usageKw = Number(G.powerUsageKw || 0);
  const capKw = Number(G._powerEffectiveCapKw || G.powerCapacityKw || 0);
  set('hd-usd',   '$' + fmtNum(G.usd));
  set('hd-hs',    fmtNum(getTotalHps()) + ' H/s');
  set('hd-power', fmtNum(usageKw, 2) + ' / ' + fmtNum(capKw, 2) + ' kW');
  set('hd-net',   'Net: $' + fmtNum(G.totalEarned));
  set('hd-clock', fmtClock());
  set('hd-chips', G.chips + ' 💎');
  renderTutorialToggleButton();
  renderDebugOverlay();
}

function renderTutorialToggleButton() {
  const btn = document.getElementById('tutorial-toggle-btn');
  if (!btn) return;
  const enabled = G.tutorialEnabled !== false;
  const stepCount = Array.isArray(window.TUTORIAL_STEPS) ? window.TUTORIAL_STEPS.length : 0;
  const step = Math.max(0, Number(G.tutorialStep || 0));

  if (!enabled) {
    btn.textContent = '📘 Tutorial AUS';
    btn.title = 'Tutorial ist pausiert und wird nicht angezeigt.';
    btn.style.background = 'var(--panel2)';
    return;
  }
  if (G.tutorialCompleted) {
    btn.textContent = '📘 Tutorial fertig';
    btn.title = 'Tutorial abgeschlossen. Per Klick kannst du es ausblenden.';
    btn.style.background = 'linear-gradient(135deg, rgba(74,222,128,0.24), rgba(59,179,255,0.22))';
    return;
  }

  const safeStepCount = Math.max(1, stepCount);
  const shownStep = Math.min(safeStepCount, step + 1);
  btn.textContent = '📘 Tutorial ' + shownStep + '/' + safeStepCount;
  btn.title = 'Klicke, um das Tutorial ein- oder auszublenden.';
  btn.style.background = 'linear-gradient(135deg, rgba(59,179,255,0.24), rgba(124,92,255,0.20))';
}

function renderDebugOverlay() {
  const box = document.getElementById('debug-overlay');
  if (!box) return;
  if (!G.debugOverlay) {
    box.style.display = 'none';
    return;
  }
  const totalRigs = (typeof getTotalRigCount === 'function') ? getTotalRigCount() : Number(G.totalRigs || 0);
  const ratePerSec = Number(G._passive || 0) * Number(G._legacyMult || 1) * Number(G._opsPassiveIncomeMult || 1);
  const loanDebt = (typeof window.getOutstandingLoanTotal === 'function') ? getOutstandingLoanTotal() : 0;
  const cheatAmount = (typeof window.getDebugCheatUsdSafe === 'function') ? getDebugCheatUsdSafe() : 1000000;
  const cheatIdx = (typeof window.getDebugCheatUsdStepIndex === 'function') ? getDebugCheatUsdStepIndex() : 0;
  box.style.display = 'block';
  box.innerHTML = `
    <div style="font-size:12px;font-weight:700;margin-bottom:4px;">Debug Overlay</div>
    <div style="font-size:11px;line-height:1.35;">
      Rigs: ${fmtNum(totalRigs, 0)}<br>
      H/s: ${fmtNum(getTotalHps(), 2)}<br>
      Leistung: ${fmtNum(G._powerPerfMult || 1, 2)}x<br>
      Last: ${fmtNum((G._powerLoadRatio || 0) * 100, 1)}%<br>
      Markt: ${String(G.marketRegime || 'range')}<br>
      Gewinn/s (passiv): $${fmtNum(ratePerSec, 2)}<br>
      Kreditbestand: $${fmtNum(loanDebt, 2)}
    </div>
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px;">Money Cheat</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">Betrag: $${fmtNum(cheatAmount)}</div>
      <input
        type="range"
        min="0"
        max="9"
        step="1"
        value="${cheatIdx}"
        oninput="setDebugCheatUsdByIndex(this.value)"
        style="width:100%;accent-color:var(--accent);margin:0 0 8px;"
      >
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;">
        <button class="buy-btn" style="padding:6px 8px;font-size:10px;" onclick="applyDebugMoneyCheat('add')">Add</button>
        <button class="buy-btn" style="padding:6px 8px;font-size:10px;" onclick="applyDebugMoneyCheat('set')">Set</button>
        <button class="buy-btn" style="padding:6px 8px;font-size:10px;background:linear-gradient(135deg,#7c5cff,#3bb3ff);" onclick="applyDebugMoneyCheat('max')">INF</button>
      </div>
    </div>`;
}

function renderHsBreakdownModal() {
  const overlay = document.getElementById('hs-breakdown-overlay');
  const body = document.getElementById('hs-breakdown-body');
  if (!overlay || !body) return;

  const rows = [];
  let rigTotal = 0;
  (RIGS || []).forEach((rig) => {
    const owned = Math.max(0, Number((G.rigs || {})[rig.id] || 0));
    if (owned <= 0) return;
    const perRig = Number(getRigHps(rig.id) || 0);
    const subtotal = perRig * owned;
    rigTotal += subtotal;
    rows.push({
      name: rig.name,
      meta: 'x' + owned + ' · ' + fmtNum(perRig, 2) + ' H/s',
      val: subtotal,
    });
  });
  rows.sort((a, b) => Number(b.val || 0) - Number(a.val || 0));

  const total = Number(getTotalHps() || 0);
  const misc = Math.max(0, total - rigTotal);
  const multRows = [
    { label: 'Global H/s-Multi', value: Number(G._hpsMult || 1) },
    { label: 'Power-Effizienz', value: Number(G._powerPerfMult || 1) },
    { label: 'Standort-Boost', value: Number(G._locationMoveBoostMult || 1) },
    { label: 'Shop H/s-Multi', value: Number(G._shopHpsMult || 1) },
  ];

  let html = '<div class="hs-breakdown-total">Gesamt: <span class="v">' + fmtNum(total, 2) + ' H/s</span></div>';
  if (!rows.length) {
    html += '<div class="hs-breakdown-row"><span class="name">Keine aktiven Rigs</span><span class="meta">-</span><span class="val">0</span></div>';
  } else {
    rows.forEach((row) => {
      html += '<div class="hs-breakdown-row">' +
        '<span class="name">' + row.name + '</span>' +
        '<span class="meta">' + row.meta + '</span>' +
        '<span class="val">' + fmtNum(row.val, 2) + '</span>' +
      '</div>';
    });
  }
  if (misc > 0.01) {
    html += '<div class="hs-breakdown-row">' +
      '<span class="name">Sonstige Rundung</span>' +
      '<span class="meta">System</span>' +
      '<span class="val">' + fmtNum(misc, 2) + '</span>' +
    '</div>';
  }

  html += '<div style="margin-top:10px;font-size:11px;color:var(--muted);">Aktive Multiplikatoren</div>';
  multRows.forEach((m) => {
    html += '<div class="hs-breakdown-row">' +
      '<span class="name">' + m.label + '</span>' +
      '<span class="meta">x</span>' +
      '<span class="val">' + fmtNum(m.value, 3) + '</span>' +
    '</div>';
  });

  body.innerHTML = html;
  overlay.classList.add('show');
}
window.renderHsBreakdownModal = renderHsBreakdownModal;

function closeHsBreakdownModal() {
  const overlay = document.getElementById('hs-breakdown-overlay');
  if (overlay) overlay.classList.remove('show');
}
window.closeHsBreakdownModal = closeHsBreakdownModal;

function renderTutorialBox() {
  const box = document.getElementById('tutorial-box');
  if (!box) return;
  const steps = window.TUTORIAL_STEPS || [];
  if (!steps.length || G.tutorialEnabled === false || G.tutorialCompleted) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  const idx = Math.max(0, Number(G.tutorialStep || 0));
  const step = steps[idx];
  if (!step) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = `
    <h3>📘 Onboarding</h3>
    <div style="font-size:12px;color:var(--muted);margin-top:4px;">Schritt ${idx + 1}/${steps.length}</div>
    <div style="margin-top:6px;font-weight:700;">${step.title}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:2px;">${step.desc}</div>`;
}

function getPowerUpgradeStepKw() {
  const cfg = window.HV_POWER_BALANCE || {};
  return Math.max(0.25, Number(cfg.upgradeStepKw || 10));
}

function fmtBatteryMode(modeRaw) {
  const mode = String(modeRaw || 'idle');
  if (mode === 'laedt') return 'laedt';
  if (mode === 'entlaedt') return 'entlaedt';
  if (mode === 'leer') return 'leer';
  if (mode === 'voll') return 'voll';
  if (mode === 'offline') return 'offline';
  return 'idle';
}

function fmtDebtStageLabel(stageRaw) {
  const stage = Math.max(0, Number(stageRaw || 0));
  if (stage >= 4) return 'Abschaltung';
  if (stage === 3) return 'Notbetrieb';
  if (stage === 2) return 'Sanktion';
  if (stage === 1) return 'Mahnung';
  return 'Stabil';
}

function updatePowerActionButtons() {
  const stepKw = getPowerUpgradeStepKw();
  const upgCost = (typeof getPowerUpgradeCost === 'function') ? getPowerUpgradeCost() : 0;
  const upgBtcCost = (typeof getPowerBtcTokenCost === 'function') ? getPowerBtcTokenCost('infra') : 0;
  const btcBalance = Number(((G.coins || {}).BTC) || 0);
  document.querySelectorAll('[data-power-action="upgrade"]').forEach(btn => {
    btn.textContent = 'Kapazitaet +' + fmtNum(stepKw, 2) + ' kW ($' + fmtNum(upgCost) + ' + ₿' + fmtNum(upgBtcCost, 4) + ')';
    btn.title = 'Erhoeht deine Basis-Netzkapazitaet dauerhaft.';
    btn.disabled = Number(G.usd || 0) < upgCost || btcBalance + 1e-9 < upgBtcCost;
  });

  const batteryCost = (typeof getBatteryUpgradeCost === 'function') ? getBatteryUpgradeCost() : 0;
  const batteryBtcCost = (typeof getPowerBtcTokenCost === 'function') ? getPowerBtcTokenCost('battery') : 0;
  const tier = Number(G.powerBatteryTier || 0);
  document.querySelectorAll('[data-power-action="batteryupg"]').forEach(btn => {
    btn.textContent = 'Notstrom-Akku +4.00 kWh (L' + tier + ' -> L' + (tier + 1) + ', $' + fmtNum(batteryCost) + ' + ₿' + fmtNum(batteryBtcCost, 4) + ')';
    btn.title = 'Mehr Puffer bei Ueberlast, laedt bei Lastreserve.';
    btn.disabled = Number(G.usd || 0) < batteryCost || btcBalance + 1e-9 < batteryBtcCost;
  });

  const coolingCost = (typeof getCoolingUpgradeCost === 'function') ? getCoolingUpgradeCost() : 0;
  const coolingLevel = Math.max(0, Number(G.coolingInfraLevel || 0));
  document.querySelectorAll('[data-power-action="coolingupg"]').forEach((btn) => {
    btn.textContent = 'Cooling-Ausbau (L' + coolingLevel + ' -> L' + (coolingLevel + 1) + ', $' + fmtNum(coolingCost) + ')';
    btn.title = 'Mehr Kuehlleistung reduziert Hitze und Crash-Risiko.';
    btn.disabled = Number(G.usd || 0) < coolingCost;
  });

  const coolingModeSelect = document.getElementById('power-cooling-mode-select');
  const coolingMode = coolingModeSelect ? coolingModeSelect.value : String(G.coolingMode || 'balanced');
  document.querySelectorAll('[data-power-action="coolmode"]').forEach((btn) => {
    btn.textContent = 'Cooling-Modus uebernehmen';
    btn.title = 'Eco spart Strom, Turbo kuehlt aggressiver.';
    btn.disabled = !coolingMode || String(coolingMode) === String(G.coolingMode || 'balanced');
  });

  const locSelect = document.getElementById('power-location-select');
  const selectedLocId = locSelect ? locSelect.value : '';
  const selectedBlocked = !!(locSelect && locSelect.selectedOptions && locSelect.selectedOptions[0] && locSelect.selectedOptions[0].disabled);
  const moveCost = (selectedLocId && typeof getLocationMoveCost === 'function')
    ? getLocationMoveCost(selectedLocId)
    : Infinity;
  document.querySelectorAll('[data-power-action="relocate"]').forEach(btn => {
    if (!selectedLocId || !Number.isFinite(moveCost)) {
      btn.textContent = 'Kein weiterer Standort verfuegbar';
      btn.disabled = true;
      return;
    }
    if (selectedBlocked) {
      btn.textContent = 'Standort noch nicht verfuegbar';
      btn.disabled = true;
      return;
    }
    btn.textContent = 'Zum Standort umziehen ($' + fmtNum(moveCost) + ')';
    btn.title = 'Standortwechsel kostet Umzugsgeld, hebt aber Rig-Cap/Boni.';
    btn.disabled = Number(G.usd || 0) < moveCost;
  });

  const layoutSelect = document.getElementById('power-layout-select');
  const layoutId = layoutSelect ? layoutSelect.value : '';
  const currentLoc = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const currentLayoutId = currentLoc && G.rigLayoutByLocation ? String(G.rigLayoutByLocation[currentLoc.id] || '') : '';
  document.querySelectorAll('[data-power-action="layout"]').forEach((btn) => {
    if (!layoutId) {
      btn.textContent = 'Layout nicht verfuegbar';
      btn.disabled = true;
      return;
    }
    btn.textContent = 'Layout anwenden';
    btn.title = 'Layouts wirken auf H/s, Hitze, Risiko und Stromverbrauch.';
    btn.disabled = String(layoutId) === String(currentLayoutId);
  });

  const providerSelect = document.getElementById('power-provider-select');
  const providerId = providerSelect ? providerSelect.value : '';
  const providerCost = (providerId && typeof getPowerProviderSwitchCost === 'function')
    ? getPowerProviderSwitchCost(providerId)
    : Infinity;
  document.querySelectorAll('[data-power-action="provider"]').forEach((btn) => {
    if (!providerId || !Number.isFinite(providerCost)) {
      btn.textContent = 'Anbieter wechseln';
      btn.disabled = true;
      return;
    }
    btn.textContent = providerCost > 0 ? ('Anbieter wechseln ($' + fmtNum(providerCost) + ')') : 'Anbieter wechseln';
    btn.title = 'Wechsel beeinflusst Strompreis, Cap-Multiplikator und Tagesgebuehr.';
    btn.disabled = Number(G.usd || 0) < Math.max(0, providerCost);
  });

  const loanSelect = document.getElementById('loan-plan-select');
  const plan = (loanSelect && typeof window.getLoanPlanById === 'function') ? getLoanPlanById(loanSelect.value) : null;
  const financePreview = (typeof window.getDailyOpsBillPreview === 'function') ? getDailyOpsBillPreview() : null;
  document.querySelectorAll('[data-power-action="loan"]').forEach((btn) => {
    if (plan) {
      const nextAfterLoan = financePreview
        ? (Number(financePreview.usdAfter || 0) + Number(plan.amount || 0))
        : null;
      btn.textContent = 'Kredit aufnehmen (+$' + fmtNum(plan.amount || 0) + ')';
      btn.title =
        'Kurzfristige Liquiditaet, aber taegliche Zinsen und Faelligkeit.' +
        (nextAfterLoan !== null ? (' Prognose nach Kredit: $' + fmtNum(nextAfterLoan, 2)) : '');
    } else {
      btn.textContent = 'Kredit aufnehmen';
      btn.title = 'Kurzfristige Liquiditaet, aber taegliche Zinsen und Faelligkeit.';
    }
    btn.disabled = !plan;
  });

  const outstanding = (typeof window.getOutstandingLoanTotal === 'function') ? getOutstandingLoanTotal() : 0;
  document.querySelectorAll('[data-power-action="repayloan"]').forEach((btn) => {
    btn.textContent = outstanding > 0 ? ('Kredit tilgen ($' + fmtNum(outstanding, 2) + ')') : 'Kredit tilgen';
    btn.title = 'Tilgt Kredite von groesstem Restbetrag nach unten.';
    btn.disabled = outstanding <= 0 || Number(G.usd || 0) <= 0;
  });

  const insurancePremium = (typeof window.getInsuranceDailyPremium === 'function') ? getInsuranceDailyPremium() : 0;
  document.querySelectorAll('[data-power-action="insurance"]').forEach((btn) => {
    btn.textContent = G.insuranceActive
      ? 'Versicherung deaktivieren'
      : ('Versicherung aktivieren (Tag: $' + fmtNum(insurancePremium, 2) + ')');
    btn.title = 'Daempft Explosionsfolgen gegen taegliche Praemie.';
    btn.disabled = false;
  });
}

// ── Mine-Panel Stats ─────────────────────────────────────────
function updateMineUI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const currentLocation = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const rigCap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const staffCoverage = Number(G._rigStaffCoverage || 1);

  const clickPow = (typeof window.getCurrentEffectiveClickPower === 'function')
    ? getCurrentEffectiveClickPower()
    : getClickPower();
  set('click-power', fmtNum(clickPow));
  set('hps-display', fmtNum(getTotalHps()));
  if (typeof window.getHoldMiningStatusText === 'function') set('hold-status', getHoldMiningStatusText());
  set('s-hashes',    fmtNum(G.totalHashes));
  set('s-btc',       fmtNum(G.coins.BTC, 6));
  set('s-eth',       fmtNum(G.coins.ETH, 6));
  set('s-ltc',       fmtNum(G.coins.LTC, 6));
  set('s-bnb',       fmtNum(G.coins.BNB, 6));
  set('s-usd',       '$' + fmtNum(G.totalEarned));
  set('s-rigs',      totalRigs);
  set('s-time',      fmtTime(G.playTime));
  set('s-diff',      G._difficulty ? G._difficulty.toFixed(2) + '×' : '1.00×');
  const selectedCoin = String(G.selectedCoin || 'BTC');
  const selectedConv = (typeof getConvRateForCoin === 'function')
    ? getConvRateForCoin(selectedCoin)
    : (typeof getConvRate === 'function' ? getConvRate() : HASH_PER_COIN);
  set('s-conv',      fmtNum(selectedConv, 0));
  set('s-power-load', fmtNum(G.powerUsageKw || 0, 2) + ' / ' + fmtNum(G._powerEffectiveCapKw || G.powerCapacityKw || 0, 2) + ' kW');
  set('s-power-price', '$' + fmtNum(G.powerPriceCurrent || 0.20, 3) + ' / kWh');
  set('s-power-bill-time', fmtTime(Math.max(0, G.powerBillTimer || 0)));
  set('s-power-bill-open', '$' + fmtNum(G.powerBillAccrued || 0, 2));
  set('s-power-battery', fmtNum(G.powerBatteryLevelKwh || 0, 2) + ' / ' + fmtNum(G.powerBatteryCapacityKwh || 0, 2) + ' kWh');
  set('s-power-battery-mode', fmtBatteryMode(G.powerBatteryMode));
  set('s-location', currentLocation ? currentLocation.name : 'Unbekannt');
  set('s-rig-capacity', totalRigs + ' / ' + (Number.isFinite(rigCap) ? rigCap : '∞'));
  set('s-staff-coverage', fmtNum(Math.max(0, Math.min(100, staffCoverage * 100)), 0) + '%');
  set('s-clock', fmtClock());
  set('s-power-level', String(G.powerInfraLevel || 0));
  set('s-power-tariff', G.powerTariffLabel || 'Tag');
  if (G.powerEventLabel && Number(G.powerEventRemaining || 0) > 0) {
    set('s-power-event', G.powerEventLabel + ' (' + fmtTime(G.powerEventRemaining) + ')');
  } else {
    set('s-power-event', 'Stabil');
  }

  const presetSelect = document.getElementById('rig-preset-select');
  const presetBtn = document.getElementById('rig-apply-preset-btn');
  if (presetSelect) {
    const isEditingPreset = document.activeElement === presetSelect;
    const presets = (typeof window.getAvailableRigBuildPresets === 'function')
      ? getAvailableRigBuildPresets()
      : [];
    if (!isEditingPreset) {
      const prev = String(presetSelect.value || G.rigBuildPresetSelected || '');
      if (!presets.length) {
        presetSelect.innerHTML = '<option value="">Keine Presets verfuegbar</option>';
        presetSelect.disabled = true;
      } else {
        presetSelect.innerHTML = presets.map((preset) => (
          '<option value="' + preset.id + '">' + preset.name + ' - ' + preset.desc + '</option>'
        )).join('');
        const fallback = presets.some((x) => x.id === G.rigBuildPresetSelected)
          ? G.rigBuildPresetSelected
          : presets[0].id;
        presetSelect.value = presets.some((x) => x.id === prev) ? prev : fallback;
        G.rigBuildPresetSelected = presetSelect.value;
        presetSelect.disabled = false;
      }
    }
    if (presetBtn) presetBtn.disabled = presetSelect.disabled;
  }

  const repairAllBtn = document.getElementById('rig-repair-all-btn');
  if (repairAllBtn) {
    let totalUsd = 0;
    let totalLtc = 0;
    let repairableTypes = 0;
    (RIGS || []).forEach((rig) => {
      const owned = Math.max(0, Number((G.rigs || {})[rig.id] || 0));
      if (owned <= 0) return;
      const usd = (typeof getRigRepairCost === 'function') ? getRigRepairCost(rig.id, 100) : 0;
      if (usd <= 0) return;
      const ltc = (typeof getRigRepairLtcCost === 'function') ? getRigRepairLtcCost(rig.id, 100) : 0;
      totalUsd += usd;
      totalLtc += ltc;
      repairableTypes += 1;
    });
    if (repairableTypes <= 0) {
      repairAllBtn.textContent = 'Alle reparieren';
      repairAllBtn.disabled = true;
    } else {
      repairAllBtn.textContent = 'Alle reparieren ($' + fmtNum(totalUsd) + ' + Ł' + fmtNum(totalLtc, 4) + ')';
      repairAllBtn.disabled = Number(G.usd || 0) < totalUsd || Number((G.coins || {}).LTC || 0) + 1e-9 < totalLtc;
    }
  }

  updatePowerActionButtons();

  updatePoolBars();
  updateEventDisplay();
  renderTutorialBox();
}

// ── Power-Panel ───────────────────────────────────────────────
function renderPowerPanel() {
  const panel = document.getElementById('power-panel');
  if (!panel) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const usageKw = Number(G.powerUsageKw || 0);
  const capKw = Number(G._powerEffectiveCapKw || G.powerCapacityKw || 0);
  const loadRatio = Number(G._powerLoadRatio || 0);
  const eventRunning = !!G.powerEventLabel && Number(G.powerEventRemaining || 0) > 0;

  set('pov-clock', fmtClock());
  set('pov-tariff', G.powerTariffLabel || 'Tag');
  set('pov-load', fmtNum(usageKw, 2) + ' / ' + fmtNum(capKw, 2) + ' kW');
  set('pov-price', '$' + fmtNum(G.powerPriceCurrent || 0.20, 3) + ' / kWh');
  set('pov-open-bill', '$' + fmtNum(G.powerBillAccrued || 0, 2));
  set('pov-next-bill', fmtTime(Math.max(0, Number(G.powerBillTimer || 0))));
  set('pov-battery', fmtNum(G.powerBatteryLevelKwh || 0, 2) + ' / ' + fmtNum(G.powerBatteryCapacityKwh || 0, 2) + ' kWh');
  set('pov-battery-mode', fmtBatteryMode(G.powerBatteryMode));

  const statusChip = document.getElementById('power-status-chip');
  if (statusChip) {
    let text = 'Stabil';
    let cls = 'stable';
    if (eventRunning) {
      text = G.powerEventLabel + ' (' + fmtTime(Math.max(0, Number(G.powerEventRemaining || 0))) + ')';
      cls = 'event';
    }
    if (loadRatio > 1.02) {
      text = 'Ueberlastet: ' + fmtNum(loadRatio * 100, 0) + '%';
      cls = 'overload';
    }
    statusChip.textContent = text;
    statusChip.className = 'power-status-chip ' + cls;
  }

  const location = (typeof window.getCurrentLocation === 'function') ? getCurrentLocation() : null;
  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const cap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const locInfo = document.getElementById('power-location-info');
  if (locInfo && location) {
    const moveBoostUntil = Number(G.locationMoveBoostUntilDay || 0);
    const moveBoostActive = moveBoostUntil > Number(G.worldDay || 1);
    locInfo.innerHTML = `
      <div class="power-row"><span>Aktueller Standort</span><strong>${location.name}</strong></div>
      <div class="power-row"><span>Rig-Kapazitaet</span><strong>${totalRigs} / ${cap}</strong></div>
      <div class="power-row"><span>Miete / Tag</span><strong>$${fmtNum(location.rentPerDay || 0, 2)}</strong></div>
      <div class="power-row"><span>Standort-Bonus</span><strong>${location.bonusText || '—'}</strong></div>
      <div class="power-row"><span>BNB Ops-Rabatt</span><strong>${fmtNum((Number(G._opsBnbDiscount || 0)) * 100, 1)}%</strong></div>
      <div class="power-row"><span>Umzugsboost</span><strong>${moveBoostActive ? ('Aktiv bis Tag ' + moveBoostUntil + ' (+8% H/s)') : 'Keiner aktiv'}</strong></div>`;
  }

  const layoutInfo = document.getElementById('power-layout-info');
  const layoutSelect = document.getElementById('power-layout-select');
  if (layoutInfo && location) {
    const activeLayout = (typeof window.getActiveRigLayout === 'function')
      ? getActiveRigLayout(location.id)
      : null;
    const hpsPct = Math.max(0, (Number((activeLayout && activeLayout.hpsMult) || 1) - 1) * 100);
    const powerPct = Math.max(0, (Number((activeLayout && activeLayout.powerMult) || 1) - 1) * 100);
    const heatCutPct = Math.max(0, (1 - Number((activeLayout && activeLayout.heatMult) || 1)) * 100);
    const crashCutPct = Math.max(0, (1 - Number((activeLayout && activeLayout.crashMult) || 1)) * 100);
    layoutInfo.innerHTML = `
      <div class="power-row"><span>Aktives Layout</span><strong>${activeLayout ? activeLayout.name : 'Balanced Grid'}</strong></div>
      <div class="power-row"><span>H/s Effekt</span><strong>${hpsPct >= 0 ? '+' : ''}${fmtNum(hpsPct, 1)}%</strong></div>
      <div class="power-row"><span>Power Effekt</span><strong>${powerPct >= 0 ? '+' : ''}${fmtNum(powerPct, 1)}%</strong></div>
      <div class="power-row"><span>Hitze-Schnitt</span><strong>-${fmtNum(heatCutPct, 1)}%</strong></div>
      <div class="power-row"><span>Crash-Schutz</span><strong>-${fmtNum(crashCutPct, 1)}%</strong></div>`;
  }
  if (layoutSelect && location) {
    const isEditingLayout = document.activeElement === layoutSelect;
    if (!isEditingLayout) {
      const layouts = (typeof window.getAvailableRigLayouts === 'function')
        ? getAvailableRigLayouts(location.id)
        : [];
      const prev = layoutSelect.value || '';
      layoutSelect.innerHTML = layouts.map((layout) => (
        '<option value="' + layout.id + '">' + layout.name + ' - ' + layout.desc + '</option>'
      )).join('');
      const activeLayoutId = G.rigLayoutByLocation && G.rigLayoutByLocation[location.id]
        ? String(G.rigLayoutByLocation[location.id])
        : (layouts[0] ? layouts[0].id : '');
      layoutSelect.value = (prev && layoutSelect.querySelector('option[value="' + prev + '"]'))
        ? prev
        : activeLayoutId;
    }
  }

  const thermalInfo = document.getElementById('power-thermal-info');
  const coolingModeSelect = document.getElementById('power-cooling-mode-select');
  if (thermalInfo) {
    const summary = (typeof window.getRigHeatSummary === 'function')
      ? getRigHeatSummary()
      : { avgHeat: 0, maxHeat: 0, dangerCount: 0, criticalCount: 0, coolingPowerKw: 0, coolingMode: 'Balanced' };
    const coolingCost = (typeof window.getCoolingUpgradeCost === 'function') ? getCoolingUpgradeCost() : 0;
    thermalInfo.innerHTML = `
      <div class="power-row"><span>Cooling Level</span><strong>${fmtNum(G.coolingInfraLevel || 0, 0)}</strong></div>
      <div class="power-row"><span>Cooling-Modus</span><strong>${summary.coolingMode || 'Balanced'}</strong></div>
      <div class="power-row"><span>Cooling-Leistung</span><strong>${fmtNum(summary.coolingPowerKw || 0, 2)} kW</strong></div>
      <div class="power-row"><span>Avg Hitze</span><strong>${fmtNum(summary.avgHeat || 0, 1)}%</strong></div>
      <div class="power-row"><span>Max Hitze</span><strong>${fmtNum(summary.maxHeat || 0, 1)}%</strong></div>
      <div class="power-row"><span>Hotspots</span><strong>${fmtNum(summary.dangerCount || 0, 0)} warn / ${fmtNum(summary.criticalCount || 0, 0)} kritisch</strong></div>
      <div class="power-row"><span>Naechstes Upgrade</span><strong>$${fmtNum(coolingCost || 0)}</strong></div>`;
  }
  if (coolingModeSelect) {
    const modes = (window.HV_COOLING_BALANCE && window.HV_COOLING_BALANCE.modes)
      ? window.HV_COOLING_BALANCE.modes
      : { balanced: { label: 'Balanced' } };
    const isEditingMode = document.activeElement === coolingModeSelect;
    if (!isEditingMode) {
      const prev = coolingModeSelect.value || String(G.coolingMode || 'balanced');
      coolingModeSelect.innerHTML = Object.keys(modes).map((key) => (
        '<option value="' + key + '">' + (modes[key].label || key) + '</option>'
      )).join('');
      coolingModeSelect.value = modes[prev] ? prev : String(G.coolingMode || 'balanced');
    }
  }

  const outageInfo = document.getElementById('power-outage-info');
  const outageActions = document.getElementById('power-outage-actions');
  if (outageInfo && outageActions) {
    const outage = (G.powerOutage && typeof G.powerOutage === 'object') ? G.powerOutage : null;
    if (!outage) {
      outageInfo.innerHTML = `
        <div class="power-row"><span>Status</span><strong>Stabil</strong></div>
        <div class="power-row"><span>Naechster Moeglicher Ausfall</span><strong>${fmtTime(Math.max(0, Number(G.powerOutageCooldown || 0)))}</strong></div>
        <div class="power-row"><span>Aktiver Krisenbuff</span><strong>${Number(G.powerOutageBuffRemaining || 0) > 0 ? fmtTime(G.powerOutageBuffRemaining) : 'Keiner'}</strong></div>`;
      outageActions.innerHTML = '';
    } else if (outage.resolved) {
      outageInfo.innerHTML = `
        <div class="power-row"><span>Event</span><strong>${outage.title}</strong></div>
        <div class="power-row"><span>Entscheidung</span><strong>${outage.choiceLabel || 'Auto-Plan'}</strong></div>
        <div class="power-row"><span>Effekt Restzeit</span><strong>${fmtTime(Math.max(0, Number(G.powerOutageBuffRemaining || 0)))}</strong></div>
        <div class="power-row"><span>Panel schliesst in</span><strong>${fmtTime(Math.max(0, Number(outage.remaining || 0)))}</strong></div>`;
      outageActions.innerHTML = '';
    } else {
      const penalties = outage.penalties || {};
      outageInfo.innerHTML = `
        <div class="power-row"><span>Event</span><strong>${outage.title}</strong></div>
        <div class="power-row"><span>Beschreibung</span><strong>${outage.desc || '-'}</strong></div>
        <div class="power-row"><span>Restzeit</span><strong>${fmtTime(Math.max(0, Number(outage.remaining || 0)))}</strong></div>
        <div class="power-row"><span>Perf / Cap</span><strong>x${fmtNum(penalties.perfMult || 1, 2)} / x${fmtNum(penalties.capMult || 1, 2)}</strong></div>
        <div class="power-row"><span>Preis / Crash</span><strong>x${fmtNum(penalties.priceMult || 1, 2)} / x${fmtNum(penalties.crashMult || 1, 2)}</strong></div>`;
      outageActions.innerHTML = (outage.options || []).map((opt) => {
        const usd = Math.max(0, Number(opt.costUsd || 0));
        const btc = Math.max(0, Number(opt.costBtc || 0));
        const canUsd = Number(G.usd || 0) + 1e-9 >= usd;
        const canBtc = Number((G.coins || {}).BTC || 0) + 1e-9 >= btc;
        const can = canUsd && canBtc;
        const costLabel = (usd > 0 || btc > 0)
          ? ('$' + fmtNum(usd, 0) + (btc > 0 ? (' + ₿' + fmtNum(btc, 4)) : ''))
          : 'keine Kosten';
        return `<button class="buy-btn" style="text-align:left;white-space:normal;" ${can ? '' : 'disabled'} onclick="resolvePowerOutageOption('${opt.id}')">
          <strong>${opt.label}</strong><br>
          <small>${opt.desc || ''}</small><br>
          <small>Kosten: ${costLabel} · Effekt: ${fmtTime(Math.max(0, Number(opt.duration || 0)))} </small>
        </button>`;
      }).join('');
    }
  }

  const locSelect = document.getElementById('power-location-select');
  let nextLoc = null;
  let nextLocUnlock = null;
  let nextLocBlockedByTier = false;
  let nextLocBlockedByCap = false;
  if (locSelect) {
    const all = Array.isArray(window.LOCATIONS) ? window.LOCATIONS : [];
    const currentTier = Number(location && location.tier ? location.tier : 1);
    const unlockedTier = Math.max(1, Number(G.unlockedLocationTier || 1));
    const future = all
      .filter((loc) => Number(loc.tier || 0) > currentTier)
      .sort((a, b) => Number(a.tier || 0) - Number(b.tier || 0));
    const isEditingSelect = document.activeElement === locSelect;

    if (!isEditingSelect) {
      const prevSelected = locSelect.value;
      const options = [];
      future.forEach((loc) => {
        const unlockInfo = (typeof window.getLocationUnlockProgress === 'function')
          ? getLocationUnlockProgress(loc.id, G)
          : { unlocked: true, requirements: [] };
        const unlockedByTier = Number(loc.tier || 0) <= unlockedTier;
        const unlockedByReq = !!unlockInfo.unlocked;
        const blockedByReq = !(unlockedByTier || unlockedByReq);
        const blockedByCap = totalRigs > Number(loc.maxRigs || 0);
        const blocked = blockedByReq || blockedByCap;
        const moveCost = Number(loc.moveCost || 0);
        const stateLabel = blocked
          ? (blockedByCap ? ' — zu viele Rigs' : ' — Anforderungen offen')
          : ' — bereit';
        options.push(`<option value="${loc.id}" ${blocked ? 'disabled' : ''}>T${loc.tier} · ${loc.name} (Cap ${loc.maxRigs}, Umzug $${fmtNum(moveCost)})${stateLabel}</option>`);
      });
      if (!options.length) {
        locSelect.innerHTML = '<option value="">Maximaler Standort erreicht</option>';
        locSelect.disabled = true;
      } else {
        locSelect.innerHTML = options.join('');
        locSelect.disabled = false;
        if (prevSelected && locSelect.querySelector('option[value="' + prevSelected + '"]')) {
          locSelect.value = prevSelected;
        }
      }
    }

    if (future.length) {
      const selectedLoc = getLocationById(locSelect.value || future[0].id);
      if (selectedLoc) {
        nextLoc = selectedLoc;
        nextLocUnlock = (typeof window.getLocationUnlockProgress === 'function')
          ? getLocationUnlockProgress(selectedLoc.id, G)
          : { unlocked: true, requirements: [] };
        const selectedUnlockedByTier = Number(selectedLoc.tier || 0) <= unlockedTier;
        const selectedUnlockedByReq = !!nextLocUnlock.unlocked;
        nextLocBlockedByTier = !(selectedUnlockedByTier || selectedUnlockedByReq);
        nextLocBlockedByCap = totalRigs > Number(selectedLoc.maxRigs || 0);
      }
    }
  }

  const locStatus = document.getElementById('power-location-status');
  if (locStatus) {
    if (!nextLoc) {
      locStatus.innerHTML = '<div class="power-list-item">Kein weiterer Standort verfuegbar.</div>';
    } else {
      const currentRent = Number((location && location.rentPerDay) || 0);
      const nextRent = Number(nextLoc.rentPerDay || 0);
      const capDelta = Number(nextLoc.maxRigs || 0) - Number(cap || 0);
      const blockedRigOver = Math.max(0, totalRigs - Number(nextLoc.maxRigs || 0));
      const reqHtml = nextLocUnlock && Array.isArray(nextLocUnlock.requirements)
        ? nextLocUnlock.requirements.map((req) => {
            const cls = req.done ? 'power-req done' : 'power-req';
            return `<div class="${cls}"><span>${req.label}</span><span>${fmtNum(req.displayCurrent)}/${fmtNum(req.displayTarget)}</span></div>`;
          }).join('')
        : '';
      const statusText = nextLocBlockedByCap
        ? ('Umzug blockiert: ' + blockedRigOver + ' Rig(s) ueber Ziel-Cap.')
        : (nextLocBlockedByTier ? 'Umzug blockiert: Freischaltbedingungen noch nicht erfuellt.' : 'Umzug bereit.');
      locStatus.innerHTML = `
        <div class="power-list-item"><strong>Ziel:</strong> T${nextLoc.tier} · ${nextLoc.name}</div>
        <div class="power-list-item">Cap +${fmtNum(capDelta, 0)} · Miete +$${fmtNum(nextRent - currentRent, 2)} / Tag</div>
        <div class="power-list-item">${statusText}</div>
        ${reqHtml}`;
    }
  }

  const shopInfo = document.getElementById('power-location-shop-info');
  const shopList = document.getElementById('power-location-shop-list');
  if (shopInfo && shopList && location) {
    const locId = String(location.id || 'home_pc');
    const slotCap = (typeof window.getLocationShopSlotCap === 'function')
      ? getLocationShopSlotCap(locId, G)
      : 5;
    const baseSlotCap = Number((window.LOCATION_SHOP_SLOT_CAP_BY_TIER || {})[Math.max(1, Number(location.tier || 1))] || slotCap);
    const prestigeSlotBonus = Math.max(0, slotCap - baseSlotCap);
    const ownedIds = (typeof window.getLocationShopOwnedIds === 'function')
      ? getLocationShopOwnedIds(locId, G)
      : [];
    const effects = (typeof window.getLocationShopEffects === 'function')
      ? getLocationShopEffects(locId, G)
      : { hpsMult: 1, staffEffMult: 1, staffWageMult: 1, crewXpMult: 1, crashRiskMult: 1, powerUsageMult: 1 };
    const items = (typeof window.getLocationShopItemsForLocation === 'function')
      ? getLocationShopItemsForLocation(locId, G)
      : [];
    const slotsLeft = Math.max(0, slotCap - ownedIds.length);
    const hpsBonusPct = Math.max(0, (Number(effects.hpsMult || 1) - 1) * 100);
    const staffBonusPct = Math.max(0, (Number(effects.staffEffMult || 1) - 1) * 100);
    const xpBonusPct = Math.max(0, (Number(effects.crewXpMult || 1) - 1) * 100);
    const wageCutPct = Math.max(0, (1 - Number(effects.staffWageMult || 1)) * 100);
    const crashCutPct = Math.max(0, (1 - Number(effects.crashRiskMult || 1)) * 100);
    const powerCutPct = Math.max(0, (1 - Number(effects.powerUsageMult || 1)) * 100);

    shopInfo.innerHTML = `
      <div class="power-row"><span>Standort-Slots</span><strong>${ownedIds.length} / ${slotCap}</strong></div>
      <div class="power-row"><span>Prestige-Slots</span><strong>+${fmtNum(prestigeSlotBonus, 0)}</strong></div>
      <div class="power-row"><span>Rig H/s Bonus</span><strong>+${fmtNum(hpsBonusPct, 1)}%</strong></div>
      <div class="power-row"><span>Crew-Effizienz</span><strong>+${fmtNum(staffBonusPct, 1)}%</strong></div>
      <div class="power-row"><span>Crew XP / Tag</span><strong>+${fmtNum(xpBonusPct, 1)}%</strong></div>
      <div class="power-row"><span>Lohnreduktion</span><strong>-${fmtNum(wageCutPct, 1)}%</strong></div>
      <div class="power-row"><span>Crash-Risiko</span><strong>-${fmtNum(crashCutPct, 1)}%</strong></div>
      <div class="power-row"><span>Power-Verbrauch</span><strong>-${fmtNum(powerCutPct, 1)}%</strong></div>`;

    if (!items.length) {
      shopList.innerHTML = '<div class="power-list-item">Keine Items fuer diesen Standort verfuegbar.</div>';
    } else {
      const byCategory = {};
      items.forEach((item) => {
        const cat = String(item.cat || 'efficiency');
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });
      const orderedCats = ['efficiency', 'safety', 'comfort', 'power']
        .filter((cat) => Array.isArray(byCategory[cat]) && byCategory[cat].length > 0)
        .concat(Object.keys(byCategory).filter((cat) => !['efficiency', 'safety', 'comfort', 'power'].includes(cat)));

      shopList.innerHTML = orderedCats.map((cat) => {
        const catMeta = (typeof window.getLocationShopCategoryMeta === 'function')
          ? getLocationShopCategoryMeta(cat)
          : { label: cat, icon: '🧰' };
        const itemsHtml = (byCategory[cat] || []).map((item) => {
          const owned = ownedIds.includes(item.id);
          const realCost = (typeof window.getLocationShopItemCost === 'function')
            ? getLocationShopItemCost(item.id, G)
            : Number(item.cost || 0);
          const slotBlocked = !owned && slotsLeft <= 0;
          const usdBlocked = !owned && Number(G.usd || 0) < Number(realCost || 0);
          const disabled = slotBlocked || usdBlocked || owned;
          const status = owned
            ? 'Installiert'
            : (slotBlocked ? 'Kein Slot frei' : (usdBlocked ? 'Zu teuer' : 'Kaufbar'));
          return `<div class="power-shop-item${owned ? ' owned' : ''}">
            <div class="power-shop-head">
              <strong>${item.name}</strong>
              <span>T${Number(item.minTier || 1)}</span>
            </div>
            <div class="power-shop-desc">${item.desc || ''}</div>
            <div class="power-shop-actions">
              <span>$${fmtNum(realCost || 0)}</span>
              <button class="buy-btn" style="padding:6px 10px;font-size:11px;" ${disabled ? 'disabled' : ''} onclick="buyLocationShopItem('${item.id}')">${owned ? 'Aktiv' : 'Kaufen'}</button>
            </div>
            <div class="power-shop-status">${status}</div>
          </div>`;
        }).join('');
        return `
          <div class="power-shop-cat">
            <div class="power-shop-cat-title">${catMeta.icon || '🧰'} ${catMeta.label || cat}</div>
            ${itemsHtml}
          </div>`;
      }).join('');
    }
  }

  const providerInfo = document.getElementById('power-provider-info');
  const providerSelect = document.getElementById('power-provider-select');
  const provider = (typeof window.getPowerProviderById === 'function') ? getPowerProviderById(G.powerProviderId) : null;
  if (providerInfo && provider) {
    const dayNow = Math.max(1, Math.floor(Number(G.worldDay || 1)));
    const lockUntil = Math.max(0, Number(G.powerProviderLockedUntilDay || 0));
    const locked = dayNow < lockUntil;
    providerInfo.innerHTML = `
      <div class="power-row"><span>Aktiver Anbieter</span><strong>${provider.name}</strong></div>
      <div class="power-row"><span>Modus</span><strong>${provider.mode === 'fixed' ? 'Fixpreis' : 'Variabel'}</strong></div>
      <div class="power-row"><span>Tagesgebuehr</span><strong>$${fmtNum(provider.baseFeePerDay || 0, 2)}</strong></div>
      <div class="power-row"><span>Peak-Strafe</span><strong>x${fmtNum(provider.peakPenaltyMult || 1, 2)}</strong></div>
      <div class="power-row"><span>Wechselstatus</span><strong>${locked ? ('gesperrt bis Tag ' + lockUntil) : 'frei'}</strong></div>`;
  }
  if (providerSelect) {
    const isEditingProvider = document.activeElement === providerSelect;
    if (!isEditingProvider) {
      const prev = providerSelect.value || G.powerProviderId;
      providerSelect.innerHTML = (window.HV_POWER_PROVIDERS || []).map((p) => (
        '<option value="' + p.id + '">' + p.name + ' (' + (p.mode === 'fixed' ? '$' + fmtNum(p.fixedPrice || 0, 3) : 'variabel') + ')</option>'
      )).join('');
      providerSelect.value = prev && providerSelect.querySelector('option[value="' + prev + '"]')
        ? prev
        : G.powerProviderId;
    }
  }

  const financeInfo = document.getElementById('power-finance-info');
  const loanSelect = document.getElementById('loan-plan-select');
  const loanOutstanding = (typeof window.getOutstandingLoanTotal === 'function') ? getOutstandingLoanTotal() : 0;
  const leaseDaily = (typeof window.getDailyLeaseCostTotal === 'function') ? getDailyLeaseCostTotal() : 0;
  const insuranceDaily = (typeof window.getInsuranceDailyPremium === 'function') ? getInsuranceDailyPremium() : 0;
  const coreStaffDaily = (typeof window.getCoreStaffDailyWages === 'function') ? getCoreStaffDailyWages() : 0;
  const preview = (typeof window.getDailyOpsBillPreview === 'function') ? getDailyOpsBillPreview() : null;
  if (financeInfo) {
    const loanCount = Array.isArray(G.loans) ? G.loans.length : 0;
    const leaseCount = Object.values(G.leasedRigs || {}).reduce((sum, n) => sum + Number(n || 0), 0);
    const opsCutPct = Math.max(0, (1 - Math.max(0.4, Number(G._opsCostMult || 1))) * 100);
    const riskColor = preview
      ? (preview.riskStage === 'critical'
        ? 'var(--red)'
        : (preview.riskStage === 'overdraft'
          ? 'var(--orange)'
          : (preview.riskStage === 'tight' ? 'var(--yellow)' : 'var(--green)')))
      : 'var(--muted)';
    const runwayText = preview
      ? (Number.isFinite(preview.runwayDays)
        ? (preview.runwayDays >= 7 ? (fmtNum(preview.runwayDays, 1) + ' Tage') : (fmtNum(preview.runwayDays, 2) + ' Tage'))
        : '∞')
      : '-';
    financeInfo.innerHTML = `
      <div class="power-row"><span>Offene Kredite</span><strong>${loanCount}</strong></div>
      <div class="power-row"><span>Kreditbestand</span><strong>$${fmtNum(loanOutstanding, 2)}</strong></div>
      <div class="power-row"><span>Leasing-Rigs</span><strong>${fmtNum(leaseCount, 0)}</strong></div>
      <div class="power-row"><span>Core Staff / Tag</span><strong>$${fmtNum(coreStaffDaily, 2)}</strong></div>
      <div class="power-row"><span>Leasing / Tag</span><strong>$${fmtNum(leaseDaily, 2)}</strong></div>
      <div class="power-row"><span>Versicherung</span><strong>${G.insuranceActive ? 'Aktiv' : 'Aus'} ($${fmtNum(insuranceDaily, 2)}/Tag)</strong></div>
      <div class="power-row"><span>Prestige Ops-Cut</span><strong>${fmtNum(opsCutPct, 1)}%</strong></div>
      <div class="power-row"><span>Naechste Tageslast</span><strong>${preview ? ('$' + fmtNum(preview.total, 2)) : '-'}</strong></div>
      <div class="power-row"><span>Kontostand danach</span><strong>${preview ? ('$' + fmtNum(preview.usdAfter, 2)) : '-'}</strong></div>
      <div class="power-row"><span>Liquiditaets-Runway</span><strong>${runwayText}</strong></div>
      <div class="power-row"><span>Finanzstatus</span><strong style="color:${riskColor};">${preview ? preview.riskLabel : 'Stabil'}</strong></div>`;
  }
  if (loanSelect) {
    const isEditingLoan = document.activeElement === loanSelect;
    if (!isEditingLoan) {
      const prev = loanSelect.value;
      loanSelect.innerHTML = (window.HV_LOAN_PLANS || []).map((plan) => (
        '<option value="' + plan.id + '">' + plan.label + ' (+$' + fmtNum(plan.amount || 0) + ', ' + fmtNum((Number(plan.ratePerDay || 0) * 100), 1) + '%/Tag)</option>'
      )).join('');
      if (prev && loanSelect.querySelector('option[value="' + prev + '"]')) loanSelect.value = prev;
    }
  }

  const lastBillEl = document.getElementById('power-last-bill');
  if (lastBillEl) {
    const bill = G.lastFinanceBill || G.lastDailyBill;
    const preview = (typeof window.getDailyOpsBillPreview === 'function') ? getDailyOpsBillPreview() : null;
    if (!bill) {
      if (preview) {
        lastBillEl.textContent = 'Noch keine Tagesabrechnung gebucht. Prognose Tag ' + preview.day + ': $' + fmtNum(preview.total, 2) + ' (' + preview.riskLabel + ').';
      } else {
        lastBillEl.textContent = 'Noch keine Tagesabrechnung gebucht.';
      }
    } else {
      lastBillEl.textContent =
        'Tag ' + bill.day +
        ' | Strom $' + fmtNum(bill.power, 2) +
        ' + Miete $' + fmtNum(bill.rent, 2) +
        ' + Lohn $' + fmtNum(bill.wages, 2) +
        (bill.lease ? (' + Leasing $' + fmtNum(bill.lease, 2)) : '') +
        (bill.insurance ? (' + Vers. $' + fmtNum(bill.insurance, 2)) : '') +
        (bill.loanInterest ? (' + Kredit $' + fmtNum(bill.loanInterest, 2)) : '') +
        ' = $' + fmtNum(bill.total, 2) +
        (preview ? (' | Naechste Prognose: $' + fmtNum(preview.total, 2) + ' (' + preview.riskLabel + ')') : '');
    }
  }

  const tariffList = document.getElementById('power-tariff-list');
  if (tariffList) {
    const tariffs = (window.HV_POWER_BALANCE && Array.isArray(window.HV_POWER_BALANCE.tariffs))
      ? window.HV_POWER_BALANCE.tariffs
      : [];
    const minsRaw = Math.floor(Number(G.worldTimeMinutes || 0));
    const mins = ((minsRaw % 1440) + 1440) % 1440;
    const fmtMin = (v) => {
      const hh = String(Math.floor(v / 60)).padStart(2, '0');
      const mm = String(v % 60).padStart(2, '0');
      return hh + ':' + mm;
    };
    tariffList.innerHTML = tariffs.map((t) => {
      const active = mins >= Number(t.start || 0) && mins < Number(t.end || 0);
      const cls = active ? 'power-list-item active' : 'power-list-item';
      return `<div class="${cls}">
        <span>${fmtMin(t.start)}-${fmtMin(t.end)} · ${t.label}</span>
        <strong>$${fmtNum(Number(t.price || 0), 3)}/kWh</strong>
      </div>`;
    }).join('');
  }

  const unlockList = document.getElementById('power-mod-unlock-list');
  if (unlockList) {
    const unlockedSet = new Set(Array.isArray(G.unlockedMods) ? G.unlockedMods : []);
    const mods = Object.values(window.RIG_MODS || {});
    if (!mods.length) {
      unlockList.innerHTML = '<div class="power-list-item">Keine Mod-Daten geladen.</div>';
    } else {
      unlockList.innerHTML = mods.map((mod) => {
        const progress = (typeof window.getRigModUnlockProgress === 'function')
          ? window.getRigModUnlockProgress(mod.id)
          : null;
        const pct = progress ? progress.progress : (unlockedSet.has(mod.id) ? 100 : 0);
        const unlocked = unlockedSet.has(mod.id) || (progress && progress.unlocked);
        const reqHtml = progress && Array.isArray(progress.requirements)
          ? progress.requirements.map((req) => {
              const reqCls = req.done ? 'done' : '';
              return `<div class="power-req ${reqCls}">
                <span>${req.label}</span>
                <span>${req.displayCurrent}/${req.displayTarget}</span>
              </div>`;
            }).join('')
          : '';
        return `<div class="power-mod-item${unlocked ? ' unlocked' : ''}">
          <div class="power-mod-head">
            <strong>${mod.name}</strong>
            <span>${unlocked ? 'Freigeschaltet' : (pct + '%')}</span>
          </div>
          <div class="power-mod-desc">${mod.description}</div>
          <div class="power-mod-progress"><div style="width:${pct}%"></div></div>
          ${reqHtml}
        </div>`;
      }).join('');
    }
  }

  const workshop = document.getElementById('power-mod-workshop');
  if (workshop) {
    const unlocked = Array.isArray(G.unlockedMods) ? G.unlockedMods : [];
    let html = '<div class="power-list-item"><span>Mod Parts</span><strong>' + fmtNum(G.modParts || 0, 0) + '</strong></div>';
    if (!unlocked.length) {
      html += '<div class="power-list-item">Keine Mod freigeschaltet.</div>';
    } else {
      unlocked.forEach((modId) => {
        const mod = (window.RIG_MODS || {})[modId];
        if (!mod) return;
        const lvl = Math.max(0, Number((G.modLevels && G.modLevels[modId]) || 0));
        const cost = (typeof getModWorkshopCost === 'function') ? getModWorkshopCost(modId) : { usd: Infinity, parts: Infinity, maxed: true };
        html += `
          <div class="power-list-item" style="display:block;">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
              <strong>${mod.name}</strong>
              <span>Lv ${lvl}</span>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;">${mod.description}</div>
            <button class="buy-btn" style="margin-top:6px;padding:6px 8px;font-size:11px;"
              ${cost.maxed || Number(G.usd || 0) < Number(cost.usd || 0) || Number(G.modParts || 0) < Number(cost.parts || 0) ? 'disabled' : ''}
              onclick="upgradeModTech('${modId}')">
              ${cost.maxed ? 'MAX' : ('Upgrade ($' + fmtNum(cost.usd) + ' + ' + fmtNum(cost.parts, 0) + ' Parts)')}
            </button>
          </div>`;
      });
    }
    workshop.innerHTML = html;
  }

  updatePowerActionButtons();
}

// ── Per-Coin Hash-Pool Fortschrittsbalken ─────────────────────
function updatePoolBars() {
  const el = document.getElementById('mine-pools');
  if (!el) return;

  const getCoinConv = (coin) => (
    (typeof getConvRateForCoin === 'function')
      ? getConvRateForCoin(coin)
      : (typeof getConvRate === 'function' ? getConvRate() : HASH_PER_COIN)
  );
  const pools    = G.rigHashPools || {};
  let html = '';

  // Welche Coins werden aktiv geminet?
  const activeCoins = new Set();
  RIGS.forEach(r => {
    if ((G.rigs[r.id] || 0) > 0) {
      activeCoins.add(G.rigTargets[r.id] || G.selectedCoin || 'BTC');
    }
  });
  // Click-Mining
  if (G.hashes > 0) activeCoins.add(G.selectedCoin || 'BTC');

  if (activeCoins.size === 0) {
    el.innerHTML = '';
    return;
  }

  activeCoins.forEach(coin => {
    const cd   = COIN_DATA[coin];
    if (!cd) return;
    const rawPool = Math.max(0, Number(pools[coin] || 0));
    const convRate = getCoinConv(coin);
    const pool = rawPool % Math.max(1, convRate);
    const pct  = Math.min(100, (pool / Math.max(1, convRate)) * 100);

    html += `<div class="pool-row">
      <span class="pool-coin" style="color:${cd.color}">${cd.symbol} ${coin}</span>
      <div class="pool-bar">
        <div class="pool-fill" style="width:${pct.toFixed(1)}%;background:${cd.color}"></div>
      </div>
      <span class="pool-pct">${pct.toFixed(0)}%</span>
    </div>`;
  });

  const clickCoin = String(G.selectedCoin || 'BTC');
  const clickPoolRaw = Math.max(0, Number(G.hashes || 0));
  if (clickPoolRaw > 0 && COIN_DATA[clickCoin]) {
    const clickCd = COIN_DATA[clickCoin];
    const convRate = getCoinConv(clickCoin);
    const clickPool = clickPoolRaw % Math.max(1, convRate);
    const clickPct = Math.min(100, (clickPool / Math.max(1, convRate)) * 100);
    html += `<div class="pool-row">
      <span class="pool-coin" style="color:${clickCd.color}">🖱️ Click ${clickCoin}</span>
      <div class="pool-bar">
        <div class="pool-fill" style="width:${clickPct.toFixed(1)}%;background:${clickCd.color};opacity:.82"></div>
      </div>
      <span class="pool-pct">${clickPct.toFixed(0)}%</span>
    </div>`;
  }

  el.innerHTML = '<div class="pool-title">⚗️ Hash-Pools</div>' + html;
}

// ── Aktives Event-Banner im Mine-Panel ───────────────────────
function updateEventDisplay() {
  const el = document.getElementById('event-display');
  if (!el) return;

  if (G.activeEvent && Date.now() < G.activeEvent.endsAt) {
    const rem    = Math.ceil((G.activeEvent.endsAt - Date.now()) / 1000);
    const hasTimer = G.activeEvent.fx && G.activeEvent.fx.t !== 'none';
    const isNeg  = G.activeEvent.fx && (G.activeEvent.fx.m < 1);
    el.style.display = 'block';
    el.innerHTML = `<div class="event-banner ${isNeg ? 'event-neg' : 'event-pos'}">
      <div class="event-msg">${G.activeEvent.msg}</div>
      ${hasTimer ? `<div class="event-timer">⏰ ${rem}s verbleibend</div>` : ''}
    </div>`;
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

// ── News Ticker ───────────────────────────────────────────────
function updateTicker(msg) {
  const el = document.getElementById('ticker-text');
  if (!el) return;
  el.style.animation = 'none';
  el.textContent = msg || '📡 Crypto-Markt stabil — Minen und auf Events warten!';
  // Kurze Animation zum Hervorheben
  requestAnimationFrame(() => {
    el.style.animation = 'tickerFadeIn 0.5s ease';
  });
}

// ── Daily Bonus Bar ──────────────────────────────────────────
function updateDailyBar() {
  const canClaim = (Date.now() - G.lastDaily) >= 86400000;
  const btn = document.getElementById('daily-claim-btn');
  if (btn) btn.disabled = !canClaim;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('daily-streak', G.dailyStreak);
  set('daily-title',  canClaim ? 'Daily Bonus verfügbar! 🎁' : 'Daily Bonus');
  set('daily-sub',
    canClaim
      ? 'Tag ' + (G.dailyStreak + 1) + ' Streak!'
      : 'Streak: ' + G.dailyStreak + ' Tage'
  );
  updateMissionBadge();
}

// ── Contract-Timer & Research-Bar ────────────────────────────
function updateContractTimer() {
  const m  = Math.floor(G.contractRefresh / 60);
  const s  = Math.floor(G.contractRefresh % 60);
  const el = document.getElementById('contract-refresh');
  if (el) el.textContent = 'Refresh in: ' + m + ':' + String(s).padStart(2, '0');

  if (G.activeResearch) {
    const r   = RESEARCH.find(x => x.id === G.activeResearch);
    const bar = document.getElementById('rp-' + G.activeResearch);
    if (r && bar) bar.style.width = Math.floor((G.researchProgress / r.time) * 100) + '%';
  }
  if (G.activeResearch2) {
    const r2   = RESEARCH.find(x => x.id === G.activeResearch2);
    const bar2 = document.getElementById('rp2-' + G.activeResearch2);
    if (r2 && bar2) bar2.style.width = Math.floor((G.researchProgress2 / r2.time) * 100) + '%';
  }
}
  const autoRepairIntervalSec = Math.max(
    1,
    Number(((window.HV_AUTO_REPAIR_BALANCE || {}).billingIntervalSec) || 12)
  );
