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

function countClaimableWeeklyObjectives() {
  if (!Array.isArray(G.weeklyObjectives)) return 0;
  return G.weeklyObjectives.filter((obj) => obj && obj.completed && !obj.claimed).length;
}

function countClaimableProjects() {
  const list = Array.isArray(window.OPERATIONS_PROJECTS) ? window.OPERATIONS_PROJECTS : [];
  const claimed = G.projectClaims || {};
  let total = 0;
  list.forEach((project) => {
    if (!project || claimed[project.id]) return;
    const status = (typeof window.getOperationsProjectStatus === 'function')
      ? getOperationsProjectStatus(project.id)
      : null;
    if (status && status.done) total++;
  });
  return total;
}

function updateMissionBadge() {
  const badge = document.getElementById('mission-badge');
  if (!badge) return;
  const canClaimDaily = (Date.now() - Number(G.lastDaily || 0)) >= 86400000;
  const claimables = countClaimableContracts() + countClaimableGoals() + countClaimableChallenges() + countClaimableWeeklyObjectives() + countClaimableProjects();
  const storyProgress = (typeof window.getStoryMissionProgress === 'function')
    ? getStoryMissionProgress()
    : null;
  const storyMission = storyProgress && storyProgress.mission ? storyProgress.mission : null;
  const storyClaimed = !!(storyMission && G.storyMissionsClaimed && G.storyMissionsClaimed[storyMission.id]);
  const storyDone = !!(storyMission && storyProgress.done && !storyClaimed);
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
  const walletYieldOn = G.walletYieldEnabled !== false;
  const walletAccrued = Math.max(0, Number(G.walletYieldAccruedUsd || 0));
  const walletTier = (typeof window.getWalletTierMeta === 'function') ? getWalletTierMeta() : { name: 'Starter Wallet', apyBonusMult: 1, totalUsd: 0 };
  trend.innerHTML = '📈 Regime: <strong style="color:var(--text)">' + regimeLabel + '</strong>' +
    ' · Zyklus: ' + (shock ? '<span style="color:var(--gold)">aktiv</span>' : 'ruhig') +
    ' · Wechsel in: ' + fmtTime(nextPhase) +
    ' · Markt-Floor: ' + floorPct + '%' +
    ' · Wallet-Tier: <span style="color:var(--accent2)">' + String(walletTier.name || 'Starter Wallet') + '</span>' +
    ' · Wallet-Zins: ' + (walletYieldOn ? '<span style="color:var(--green)">AN</span>' : 'AUS') +
    ' · Zins-Ertrag: $' + fmtNum(walletAccrued, 2);
  grid.appendChild(trend);

  Object.entries(COIN_DATA).forEach(([coin, data]) => {
    const price   = G.prices[coin];
    const balance = G.coins[coin] || 0;
    const reserve = (typeof getWalletBalance === 'function') ? getWalletBalance(coin) : ((typeof getCoinReserve === 'function') ? getCoinReserve(coin) : 0);
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
    const dailyYieldRate = (typeof window.getWalletDailyRate === 'function')
      ? getWalletDailyRate(coin)
      : Math.max(0, Number((data && data.walletApy) || 0) / 365);
    const apyPct = Math.max(0, Number((data && data.walletApy) || 0) * 100);
    const estDailyYield = Math.max(0, Number(reserve || 0) * dailyYieldRate);
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
      <div class="coin-miners">🏦 Wallet APY: ${fmtNum(apyPct, 2)}% · Eingelagert: ${fmtNum(reserve, 4)} ${coin} · Erwartet/Tag: +${fmtNum(estDailyYield, 4)} ${coin}</div>
      <div class="coin-auto-row">
        <span>Auto-Sell ${coin}</span>
        <div class="toggle ${autoEnabled ? 'on' : ''}" onclick="toggleAutoSellCoin('${coin}')"></div>
      </div>
      <div class="coin-balance">
        Balance: <span>${fmtNum(balance, 4)} ${coin}</span>
        = <span style="color:var(--gold)">$${fmtNum(balance * price * G._priceMult, 2)}</span>
      </div>
      <div class="coin-miners">Wallet: ${fmtNum(reserve, 4)} ${coin} · Frei: ${fmtNum(freeBalance, 4)} ${coin}</div>
      <div class="sell-btns">
        <button class="sell-btn half" ${canSellAny ? '' : 'disabled'} onclick="sellCoins('${coin}', 0.5)">Sell 50%</button>
        <button class="sell-btn all" ${canSellAny ? '' : 'disabled'} onclick="sellCoins('${coin}', 1)">Sell ALL</button>
      </div>
      <canvas class="price-chart" id="chart-${coin}" height="60"></canvas>`;
    grid.appendChild(div);
    requestAnimationFrame(() => drawChart(coin, data.color));
  });
}

function renderWallet() {
  const grid = document.getElementById('wallet-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const totalWalletLiveUsd = Object.keys(COIN_DATA || {}).reduce((sum, coin) => {
    const bal = (typeof getWalletBalance === 'function') ? getWalletBalance(coin) : 0;
    return sum + bal * Math.max(0, Number((G.prices || {})[coin] || 0));
  }, 0);
  const walletTier = (typeof window.getWalletTierMeta === 'function') ? getWalletTierMeta() : { name: 'Starter Wallet', apyBonusMult: 1, totalUsd: 0, nextTier: null };
  const history = Array.isArray(G.walletYieldHistory) ? G.walletYieldHistory : [];
  const ledger = Array.isArray(G.walletLedger) ? G.walletLedger : [];
  const latestReport = history[0] || null;
  const top = document.createElement('div');
  top.className = 'power-card';
  top.innerHTML = `
    <h3>Wallet-Uebersicht</h3>
    <div class="power-list">
      <div class="power-row"><span>Status</span><strong>${G.walletYieldEnabled !== false ? 'Zinsen aktiv' : 'Zinsen pausiert'}</strong></div>
      <div class="power-row"><span>Wallet-Marktwert</span><strong>$${fmtNum(totalWalletLiveUsd, 2)}</strong></div>
      <div class="power-row"><span>Tier-Bewertung</span><strong>$${fmtNum(Number(walletTier.totalUsd || 0), 2)}</strong></div>
      <div class="power-row"><span>Tier</span><strong>${walletTier.name} (+${fmtNum((Math.max(1, Number(walletTier.apyBonusMult || 1)) - 1) * 100, 1)}% APY)</strong></div>
      <div class="power-row"><span>Sperrfrist</span><strong>${fmtNum(Number(walletTier.lockDays || 1), 0)} Tag(e)</strong></div>
      <div class="power-row"><span>Bisherige Zinsen</span><strong>$${fmtNum(Number(G.walletYieldAccruedUsd || 0), 2)}</strong></div>
      <div class="power-row"><span>Letzte Gutschrift</span><strong>${Math.max(0, Number(G.walletYieldLastDay || 0)) > 0 ? ('Tag ' + fmtNum(G.walletYieldLastDay, 0)) : 'Noch keine'}</strong></div>
    </div>
    <div class="power-actions" style="margin-top:8px;">
      <button class="buy-btn" onclick="toggleWalletYieldEnabled()">${G.walletYieldEnabled !== false ? 'Zinsen pausieren' : 'Zinsen aktivieren'}</button>
      <button class="buy-btn" disabled>${walletTier.nextTier ? ('Naechstes Tier: $' + fmtNum(Number(walletTier.nextTier.minUsd || 0), 0)) : 'Max Tier erreicht'}</button>
    </div>`;
  grid.appendChild(top);

  const reportCard = document.createElement('div');
  reportCard.className = 'power-card';
  reportCard.innerHTML = '<h3>Tagesreport</h3>' + (
    latestReport
      ? '<div class="power-list">' +
          '<div class="power-row"><span>Letzter Report</span><strong>Tag ' + fmtNum(Number(latestReport.day || 0), 0) + '</strong></div>' +
          '<div class="power-row"><span>Zinsertrag</span><strong>$' + fmtNum(Number(latestReport.totalUsd || 0), 2) + '</strong></div>' +
          '<div class="power-row"><span>Staerkste Coin</span><strong>' + (latestReport.bestCoin ? (latestReport.bestCoin + ' · $' + fmtNum(Number(latestReport.bestUsd || 0), 2)) : '—') + '</strong></div>' +
          '<div class="power-list-item">Report basiert auf Tier ' + String(latestReport.tier || 'Wallet') + ' und dem jeweiligen Hold-Bonus.</div>' +
        '</div>'
      : '<div class="power-list-item">Noch kein Wallet-Tagesreport vorhanden.</div>'
  );
  grid.appendChild(reportCard);

  const tierCard = document.createElement('div');
  tierCard.className = 'power-card';
  tierCard.innerHTML = '<h3>Bonus-Tiers</h3>' + (
    Array.isArray(walletTier.tiers) && walletTier.tiers.length
      ? '<div class="power-list">' + walletTier.tiers.map((tier) => {
          const active = tier.id === walletTier.id;
          const next = walletTier.nextTier && walletTier.nextTier.id === tier.id;
          return '<div class="power-row"><span>' + (active ? '✅ ' : (next ? '⏭️ ' : '• ')) + tier.name + '</span><strong>$' + fmtNum(Number(tier.minUsd || 0), 0) + ' · +' + fmtNum((Number(tier.apyBonusMult || 1) - 1) * 100, 1) + '%</strong></div>' +
            '<div class="power-list-item" style="margin-bottom:8px;">' + String(tier.perk || '') + ' · Sperrfrist ' + fmtNum(Number(tier.lockDays || 1), 0) + ' Tag(e)</div>';
        }).join('') + '</div>'
      : '<div class="power-list-item">Keine Wallet-Tiers geladen.</div>'
  );
  grid.appendChild(tierCard);

  const historyCard = document.createElement('div');
  historyCard.className = 'power-card';
  historyCard.innerHTML = '<h3>Yield-Historie</h3>' + (
    history.length
      ? '<div class="power-list">' + history.slice(0, 6).map((row) => (
          '<div class="power-row"><span>Tag ' + fmtNum(Number(row.day || 0), 0) + ' · ' + String(row.tier || 'Wallet') + '</span><strong>$' + fmtNum(Number(row.totalUsd || 0), 2) + '</strong></div>' +
          '<div class="power-list-item" style="margin-bottom:8px;">Wallet-Basis: $' + fmtNum(Number(row.walletUsd || 0), 2) + ' · ' + String((row.parts || []).slice(0, 3).join(' · ') || 'Keine Teilwerte') + '</div>'
        )).join('') + '</div>'
      : '<div class="power-list-item">Noch keine Zinsbuchungen vorhanden.</div>'
  );
  grid.appendChild(historyCard);

  const ledgerCard = document.createElement('div');
  ledgerCard.className = 'power-card';
  ledgerCard.innerHTML = '<h3>Wallet-Logbuch</h3>' + (
    ledger.length
      ? '<div class="power-list">' + ledger.slice(0, 8).map((row) => {
          const label = row.kind === 'deposit' ? 'Einzahlung'
            : (row.kind === 'withdraw' ? 'Auszahlung' : 'Zins');
          const value = row.coin
            ? (fmtNum(Number(row.amount || 0), 4) + ' ' + row.coin)
            : ('$' + fmtNum(Number(row.usd || 0), 2));
          return '<div class="power-row"><span>Tag ' + fmtNum(Number(row.day || 0), 0) + ' · ' + label + '</span><strong>' + value + '</strong></div>';
        }).join('') + '</div>'
      : '<div class="power-list-item">Noch keine Wallet-Bewegungen vorhanden.</div>'
  );
  grid.appendChild(ledgerCard);

  Object.entries(COIN_DATA).forEach(([coin, data]) => {
    const total = Math.max(0, Number((G.coins || {})[coin] || 0));
    const wallet = (typeof getWalletBalance === 'function') ? getWalletBalance(coin) : 0;
    const free = (typeof getAvailableCoinBalance === 'function') ? getAvailableCoinBalance(coin) : Math.max(0, total - wallet);
    const dailyRate = (typeof getWalletDailyRate === 'function') ? getWalletDailyRate(coin) : 0;
    const estYield = wallet * dailyRate;
    const locked = (typeof isWalletLocked === 'function') ? isWalletLocked(coin) : false;
    const unlockDay = (typeof getWalletUnlockDay === 'function') ? getWalletUnlockDay(coin) : Number(G.worldDay || 1);
    const holdDays = (typeof getWalletHoldDays === 'function') ? getWalletHoldDays(coin) : 0;
    const holdBonusPct = (typeof getWalletHoldBonusMult === 'function') ? ((getWalletHoldBonusMult(coin) - 1) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'power-card';
    card.innerHTML = `
      <h3>${data.symbol} ${data.name}</h3>
      <div class="power-list">
        <div class="power-row"><span>Gesamt</span><strong>${fmtNum(total, 4)} ${coin}</strong></div>
        <div class="power-row"><span>Frei</span><strong>${fmtNum(free, 4)} ${coin}</strong></div>
        <div class="power-row"><span>In Wallet</span><strong>${fmtNum(wallet, 4)} ${coin}</strong></div>
        <div class="power-row"><span>APY</span><strong>${fmtNum(Number(data.walletApy || 0) * 100, 2)}%</strong></div>
        <div class="power-row"><span>Hold-Bonus</span><strong>+${fmtNum(holdBonusPct, 1)}%</strong></div>
        <div class="power-row"><span>Hold-Tage</span><strong>${fmtNum(holdDays, 0)}</strong></div>
        <div class="power-row"><span>Erwartet / Tag</span><strong>+${fmtNum(estYield, 4)} ${coin}</strong></div>
        <div class="power-row"><span>Status</span><strong>${locked ? ('Gesperrt bis Tag ' + fmtNum(unlockDay, 0)) : 'Liquid'}</strong></div>
        <div class="power-row"><span>Nutzen</span><strong>${coin === 'BTC' ? 'Power-Upgrades' : (coin === 'ETH' ? 'Research' : (coin === 'LTC' ? 'Repair' : 'Ops-Rabatt'))}</strong></div>
      </div>
      <div class="wallet-transfer-row">
        <input
          id="wallet-amount-${coin}"
          class="wallet-amount-input"
          type="number"
          min="0"
          step="0.0001"
          inputmode="decimal"
          placeholder="Betrag in ${coin}"
        />
      </div>
      <div class="power-actions" style="margin-top:8px;">
        <button class="buy-btn" ${free > 0.0009 ? '' : 'disabled'} onclick="moveCoinToWalletAmount('${coin}')">Einzahlen</button>
        <button class="buy-btn" ${free > 0.0009 ? '' : 'disabled'} onclick="moveCoinToWallet('${coin}', 1)">Alles einzahlen</button>
        <button class="buy-btn" ${wallet > 0.0009 ? '' : 'disabled'} onclick="moveCoinFromWalletAmount('${coin}')">Auszahlen</button>
        <button class="buy-btn" ${wallet > 0.0009 ? '' : 'disabled'} onclick="moveCoinFromWallet('${coin}', 1)">Alles auszahlen</button>
      </div>`;
    grid.appendChild(card);
  });
}

function getMissionFilter() {
  const filter = String(G.uiMissionFilter || 'all');
  return ['all', 'active', 'claimable', 'done', 'locked'].includes(filter) ? filter : 'all';
}

function missionCardMatchesFilter(status) {
  const filter = getMissionFilter();
  if (filter === 'all') return true;
  if (filter === 'claimable') return !!status.claimable;
  if (filter === 'done') return !!status.done;
  if (filter === 'locked') return !!status.locked;
  if (filter === 'active') return !!status.active;
  return true;
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
  const crewPowerOps = (typeof window.getRigCrewPowerOpsSummary === 'function')
    ? getRigCrewPowerOpsSummary()
    : { powerUsageMult: 1, heatGainMult: 1, coolingAssistMult: 1, automationAssistMult: 1, outagePrepMult: 1 };
  const powerCutPct = Math.max(0, (1 - Number(crewPowerOps.powerUsageMult || 1)) * 100);
  const heatCutPct = Math.max(0, (1 - Number(crewPowerOps.heatGainMult || 1)) * 100);
  const coolingBoostPct = Math.max(0, (Number(crewPowerOps.coolingAssistMult || 1) - 1) * 100);
  const automationBoostPct = Math.max(0, (Number(crewPowerOps.automationAssistMult || 1) - 1) * 100);
  const outagePrepPct = Math.max(0, (Number(crewPowerOps.outagePrepMult || 1) - 1) * 100);
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
      <div class="ops-staff-meta" style="margin-top:6px;">
        <span>Power: ${powerCutPct > 0 ? '-' : '+'}${fmtNum(Math.abs(powerCutPct), 1)}%</span>
        <span>Heat: ${heatCutPct > 0 ? '-' : '+'}${fmtNum(Math.abs(heatCutPct), 1)}%</span>
        <span>Cooling: +${fmtNum(coolingBoostPct, 1)}%</span>
      </div>
      <div class="ops-staff-meta" style="margin-top:6px;">
        <span>Automation: +${fmtNum(automationBoostPct, 1)}%</span>
        <span>Outage Prep: +${fmtNum(outagePrepPct, 1)}%</span>
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
    const powerPct = (1 - Number(stats.powerUsageMult || 1)) * 100;
    const heatPct = (1 - Number(stats.heatGainMult || 1)) * 100;
    const autoPct = (Number(stats.automationAssistMult || 1) - 1) * 100;
    cells += `<span>${fmtNum(stats.coverage * 100, 0)}% | +${fmtNum(stats.repairPerSec, 2)}%/s<br><small style="color:var(--muted)">kW ${powerPct >= 0 ? '-' : '+'}${fmtNum(Math.abs(powerPct), 1)}% · Heat ${heatPct >= 0 ? '-' : '+'}${fmtNum(Math.abs(heatPct), 1)}% · Auto +${fmtNum(Math.max(0, autoPct), 1)}%</small></span>`;

    row.innerHTML = cells;
    assignGrid.appendChild(row);
  });

  crewWrap.appendChild(assignGrid);
  grid.appendChild(crewWrap);
}

function renderMissions() {
  const filterBar = document.getElementById('mission-filter-bar');
  if (filterBar) {
    const active = getMissionFilter();
    filterBar.innerHTML = ['all', 'active', 'claimable', 'done', 'locked'].map((id) => {
      const labels = { all: 'Alle', active: 'Aktiv', claimable: 'Claimbar', done: 'Fertig', locked: 'Gesperrt' };
      return '<button class="chip-btn' + (active === id ? ' chip-btn-done' : '') + '" style="margin-right:8px;margin-bottom:8px;" onclick="setMissionFilter(\'' + id + '\')">' + labels[id] + '</button>';
    }).join('');
  }
  renderWeeklyObjectives();
  renderOperationsProjects();
  renderContracts();
  renderChallenges();
  if (typeof window.renderStoryMissionCard === 'function') renderStoryMissionCard();
  updateDailyBar();
  updateContractTimer();
  updateMissionBadge();
}

function renderWeeklyObjectives() {
  const grid = document.getElementById('weekly-grid');
  const label = document.getElementById('weekly-cycle-label');
  if (!grid) return;
  grid.innerHTML = '';

  if (typeof window.ensureWeeklyObjectives === 'function') ensureWeeklyObjectives();
  const currentWeek = Math.max(1, Number(G.weeklyObjectivesWeek || 1));
  if (label) label.textContent = 'Woche ' + fmtNum(currentWeek, 0);

  const objectives = Array.isArray(G.weeklyObjectives) ? G.weeklyObjectives : [];
  if (!objectives.length) {
    grid.innerHTML = '<div class="contract-card"><div class="contract-desc">Noch keine Wochenziele geladen.</div></div>';
    return;
  }

  objectives.forEach((obj, idx) => {
    const target = Math.max(1, Number(obj.target || 1));
    const progress = Math.max(0, Number(obj.progress || 0));
    const pct = Math.max(0, Math.min(100, (Math.min(progress, target) / target) * 100));
    const canClaim = !!obj.completed && !obj.claimed;
    if (!missionCardMatchesFilter({
      claimable: canClaim,
      done: !!obj.claimed,
      active: !obj.claimed && !canClaim,
      locked: false,
    })) return;
    const card = document.createElement('div');
    card.className = 'contract-card' + (obj.claimed ? ' completed' : (canClaim ? ' active' : ''));
    card.innerHTML = `
      <div class="contract-type ${obj.claimed ? 'easy' : 'medium'}">WEEKLY</div>
      <div class="contract-name">${obj.name}</div>
      <div class="contract-desc">${obj.desc}</div>
      <div class="contract-timer" style="margin:6px 0 4px;">${fmtNum(Math.min(progress, target))} / ${fmtNum(target)}</div>
      <div style="height:6px;background:var(--panel1);border-radius:999px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold),var(--accent2));transition:width .25s;"></div>
      </div>
      <div class="contract-reward">🎁 $${fmtNum(Number((obj.rewards || {}).cash || 0))} · 💎 ${fmtNum(Number((obj.rewards || {}).chips || 0), 0)}</div>
      ${obj.claimed
        ? '<div style="color:var(--green);font-weight:700;">✅ Eingeloest</div>'
        : (canClaim
          ? `<button class="accept-btn" style="background:linear-gradient(135deg,var(--green),#00aa55);color:#000;" onclick="claimWeeklyObjective(${idx})">🎉 Einloesen</button>`
          : '<div class="contract-timer">Wird im Wochenzyklus verfolgt</div>')}
    `;
    grid.appendChild(card);
  });
}
window.renderWeeklyObjectives = renderWeeklyObjectives;

function renderOperationsProjects() {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const projects = Array.isArray(window.OPERATIONS_PROJECTS) ? window.OPERATIONS_PROJECTS : [];
  const claimed = G.projectClaims || {};
  if (!projects.length) {
    grid.innerHTML = '<div class="contract-card"><div class="contract-desc">Keine Projekte verfuegbar.</div></div>';
    return;
  }

  projects.forEach((project) => {
    const status = (typeof window.getOperationsProjectStatus === 'function')
      ? getOperationsProjectStatus(project.id)
      : null;
    if (!status) return;
    const isClaimed = !!claimed[project.id];
    if (!missionCardMatchesFilter({
      claimable: !!(status.done && !isClaimed && !status.locked),
      done: !!isClaimed,
      active: !status.locked && !isClaimed && !status.done,
      locked: !!status.locked,
    })) return;
    const card = document.createElement('div');
    card.className = 'chip-item' + (status.locked ? '' : (isClaimed ? ' chip-unlocked' : (status.done ? ' chip-maxed' : '')));
    const lockText = status.locked && project.req
      ? '<div class="chip-item-desc" style="color:var(--muted);margin-top:6px;"><strong>Freischaltung:</strong> '
        + [
          Number.isFinite(project.req.minDay) ? ('ab Tag ' + fmtNum(project.req.minDay, 0)) : '',
          Number.isFinite(project.req.minLocationTier) ? ('Standort-Tier ' + fmtNum(project.req.minLocationTier, 0)) : '',
          Number.isFinite(project.req.minPowerInfraLevel) ? ('Power-Infra ' + fmtNum(project.req.minPowerInfraLevel, 0)) : '',
          Number.isFinite(project.req.minPrestige) ? ('Prestige ' + fmtNum(project.req.minPrestige, 0)) : '',
        ].filter(Boolean).join(' · ')
        + '</div>'
      : '';
    card.innerHTML =
      '<div class="chip-item-header">' +
        '<div class="chip-item-name">📁 ' + project.name + '</div>' +
        '<span class="chip-owned">' + (status.locked ? 'Gesperrt' : (isClaimed ? 'Claimed' : (status.done ? 'Fertig' : fmtNum(status.percent, 0) + '%'))) + '</span>' +
      '</div>' +
      '<div class="chip-item-desc">' + project.desc + '</div>' +
      '<div class="chip-item-desc" style="color:var(--text);margin-top:6px;"><strong>Ziel:</strong> ' + project.targetLabel + '</div>' +
      lockText +
      '<div class="power-list-item"><span>Fortschritt</span><strong>' + status.progressText + '</strong></div>' +
      '<div class="power-list-item"><span>Belohnung</span><strong>$' + fmtNum(Number((project.rewards || {}).cash || 0)) + ' · 💎 ' + fmtNum(Number((project.rewards || {}).chips || 0), 0) + '</strong></div>' +
      '<button class="chip-btn ' + (isClaimed ? 'chip-btn-done' : '') + '" ' + ((status.done && !isClaimed && !status.locked) ? '' : 'disabled') + ' onclick="claimOperationsProject(\'' + project.id + '\')">' + (status.locked ? 'Noch gesperrt' : (isClaimed ? '✓ Abgeschlossen' : (status.done ? 'Belohnung abholen' : 'Projekt laeuft'))) + '</button>';
    grid.appendChild(card);
  });
}
window.renderOperationsProjects = renderOperationsProjects;

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
    const isNew = done && G.lastAchievementId === a.id;
    if (done) unlocked++;
    const div = document.createElement('div');
    div.className = 'ach-card' + (done ? ' unlocked' : ' locked') + (isNew ? ' is-new' : '');
    div.dataset.achievementId = a.id;
    div.innerHTML = `
      <div class="ach-icon">${done ? a.icon : '🔒'}</div>
      <div class="ach-name">${done ? a.name : '???'}${isNew ? ' <span class="ach-new-badge">Neu</span>' : ''}</div>
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

function focusAchievementById(achievementId) {
  if (!achievementId) return;
  if (typeof switchTab === 'function') switchTab('achievements');
  if (typeof renderAchievements === 'function') renderAchievements();
  setTimeout(() => {
    const el = document.querySelector('.ach-card[data-achievement-id="' + achievementId + '"]');
    if (!el) return;
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    el.classList.remove('tutorial-pulse');
    void el.offsetWidth;
    el.classList.add('tutorial-pulse');
  }, 80);
}
window.focusAchievementById = focusAchievementById;

function renderCollections() {
  const root = document.getElementById('collections-grid');
  const countEl = document.getElementById('collection-count');
  if (!root) return;
  root.innerHTML = '';

  const collectionState = (typeof window.getActiveCollectionBonuses === 'function')
    ? getActiveCollectionBonuses()
    : { activeSets: [], totalCompleted: 0 };
  const allSets = Array.isArray(window.COLLECTION_SETS) ? window.COLLECTION_SETS : [];

  if (countEl) {
    countEl.textContent = fmtNum(collectionState.totalCompleted || 0, 0) + '/' + fmtNum(allSets.length, 0) + ' aktiv';
  }

  const summary = document.createElement('div');
  summary.className = 'chip-section';
  summary.innerHTML =
    '<div class="chip-section-title">✅ Aktive Set-Boni</div>' +
    '<div class="chip-section-sub">Sets werden automatisch aktiv, sobald alle Bedingungen erfuellt sind.</div>';
  if (collectionState.activeSets && collectionState.activeSets.length) {
    collectionState.activeSets.forEach((set) => {
      const row = document.createElement('div');
      row.className = 'power-list-item';
      row.innerHTML = '<span>' + (set.icon || '🧩') + ' ' + set.name + '</span><strong>' + String(set.rewardText || 'Aktiv') + '</strong>';
      summary.appendChild(row);
    });
  } else {
    summary.innerHTML += '<div class="power-list-item"><span>Noch kein Set aktiv</span><strong>Baue auf erste Kombinationen hin</strong></div>';
  }
  root.appendChild(summary);

  const progressSec = document.createElement('div');
  progressSec.className = 'chip-section';
  progressSec.innerHTML =
    '<div class="chip-section-title">📦 Set-Fortschritt</div>' +
    '<div class="chip-section-sub">Alle Sets und ihre aktuellen Bedingungen.</div>';
  const setGrid = document.createElement('div');
  setGrid.className = 'chip-grid';
  allSets.forEach((set) => {
    const status = (typeof window.getCollectionSetStatus === 'function')
      ? getCollectionSetStatus(set.id)
      : null;
    if (!status) return;
    const doneCount = status.progress.filter((row) => row.done).length;
    const card = document.createElement('div');
    card.className = 'chip-item' + (status.active ? ' chip-unlocked' : '');
    card.innerHTML =
      '<div class="chip-item-header">' +
        '<div class="chip-item-name">' + (status.icon || '🧩') + ' ' + status.name + '</div>' +
        '<span class="chip-owned">' + doneCount + '/' + status.progress.length + '</span>' +
      '</div>' +
      '<div class="chip-item-desc">' + status.desc + '</div>' +
      '<div class="chip-item-desc" style="color:var(--text);margin-top:6px;"><strong>Bonus:</strong> ' + status.rewardText + '</div>' +
      '<div style="height:6px;background:var(--panel1);border-radius:999px;overflow:hidden;margin:8px 0 10px;">' +
        '<div style="height:100%;width:' + fmtNum((doneCount / Math.max(1, status.progress.length)) * 100, 0) + '%;background:linear-gradient(90deg,var(--accent),var(--accent2));"></div>' +
      '</div>' +
      status.progress.map((row) => (
        '<div class="power-list-item"><span>' + row.label + '</span><strong>' + fmtNum(row.current, 0) + '/' + fmtNum(row.target, 0) + '</strong></div>'
      )).join('') +
      '<button class="chip-btn ' + (status.active ? 'chip-btn-done' : '') + '" disabled>' + (status.active ? '✓ Aktiv' : 'Im Aufbau') + '</button>';
    setGrid.appendChild(card);
  });
  progressSec.appendChild(setGrid);
  root.appendChild(progressSec);
}
window.renderCollections = renderCollections;

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
  const collectionState = (typeof window.getActiveCollectionBonuses === 'function')
    ? getActiveCollectionBonuses()
    : { activeSets: [], totalCompleted: 0 };
  const prestigeSkillFx = (typeof window.getPrestigeSkillEffects === 'function')
    ? getPrestigeSkillEffects()
    : {};
  const allSets = Array.isArray(window.COLLECTION_SETS) ? window.COLLECTION_SETS : [];
  const skills = Array.isArray(window.PRESTIGE_SKILLS) ? window.PRESTIGE_SKILLS : [];
  const fmtSkillEffect = (skill, nextLevel) => {
    const effect = (skill && skill.effect) || {};
    const parts = [];
    Object.keys(effect).forEach((key) => {
      const raw = Number(effect[key] || 0);
      if (!Number.isFinite(raw)) return;
      if (key === 'opsCostMult') parts.push('-' + fmtNum((1 - raw) * 100, 1) + '% Ops');
      else if (key === 'buildCostMult') parts.push('-' + fmtNum((1 - raw) * 100, 1) + '% Build');
      else if (key === 'researchCostMult') parts.push('-' + fmtNum((1 - raw) * 100, 1) + '% Research');
      else if (key === 'powerCapMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Grid');
      else if (key === 'powerUsageMult') parts.push('-' + fmtNum((1 - raw) * 100, 1) + '% kW');
      else if (key === 'coolingMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Cooling');
      else if (key === 'automationMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Auto');
      else if (key === 'outagePrepMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Outage');
      else if (key === 'crewEffMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Crew');
      else if (key === 'crewWageMult') parts.push('-' + fmtNum((1 - raw) * 100, 1) + '% Loehne');
      else if (key === 'walletYieldMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Wallet-APY');
      else if (key === 'hpsMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% H/s');
      else if (key === 'clickMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Klick');
      else if (key === 'marketFloorAdd') parts.push('+' + fmtNum(raw * 100, 1) + '% Floor');
      else if (key === 'contractBonus') parts.push('+' + fmtNum(raw * 100, 1) + '% Contracts');
      else if (key === 'collectionBonusMult') parts.push('+' + fmtNum((raw - 1) * 100, 1) + '% Set-Staerke');
    });
    return parts.join(' · ') || ('Lv ' + nextLevel);
  };

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
    '<div class="power-list-item"><span>Standort-Shop Slots</span><strong>+' + fmtNum(shopSlotBonus, 0) + '</strong></div>' +
    '<div class="power-list-item"><span>Aktive Sets</span><strong>' + fmtNum(collectionState.totalCompleted || 0, 0) + '/' + fmtNum(allSets.length, 0) + '</strong></div>' +
    '<div class="power-list-item"><span>Skilltree-Bonus</span><strong>+' + fmtNum((Math.max(1, Number(prestigeSkillFx.collectionBonusMult || 1)) - 1) * 100, 1) + '% Set-Staerke</strong></div>' +
    '<div class="power-list-item"><span>Wallet-APY Bonus</span><strong>+' + fmtNum((Math.max(1, Number(prestigeSkillFx.walletYieldMult || 1)) - 1) * 100, 1) + '%</strong></div>' +
    '<div class="power-list-item"><span>Skill-Kaeufe gesamt</span><strong>' + fmtNum(Number(G.prestigeSkillPurchases || 0), 0) + '</strong></div>';
  grid.appendChild(prestigeFx);

  const groups = [];
  skills.forEach((skill) => {
    if (!groups.includes(skill.group)) groups.push(skill.group);
  });
  groups.forEach((groupName) => {
    const section = document.createElement('div');
    section.className = 'chip-section';
    section.innerHTML =
      '<div class="chip-section-title">🌳 Skilltree · ' + groupName + '</div>' +
      '<div class="chip-section-sub">Dauerhafte Chip-Investitionen fuer alle naechsten Runs.</div>';
    const treeGrid = document.createElement('div');
    treeGrid.className = 'chip-grid';

    skills.filter((skill) => skill.group === groupName).forEach((skill) => {
      const level = (typeof window.getPrestigeSkillLevel === 'function') ? getPrestigeSkillLevel(skill.id) : 0;
      const maxLevel = Math.max(1, Number(skill.max || 1));
      const nextLevel = Math.min(maxLevel, level + 1);
      const reqState = (typeof window.getPrestigeSkillRequirementState === 'function')
        ? getPrestigeSkillRequirementState(skill)
        : { ok: true, text: '' };
      const cost = (typeof window.getPrestigeSkillCost === 'function')
        ? getPrestigeSkillCost(skill.id, level + 1)
        : Number(skill.cost || 1);
      const canBuy = level < maxLevel && reqState.ok && Number(G.chips || 0) >= cost;
      const card = document.createElement('div');
      card.className = 'chip-item' + (level >= maxLevel ? ' chip-maxed' : (level > 0 ? ' chip-unlocked' : ''));
      card.innerHTML =
        '<div class="chip-item-header">' +
          '<div class="chip-item-name">' + (skill.icon || '💠') + ' ' + skill.name + '</div>' +
          '<span class="chip-owned">Lv ' + level + '/' + maxLevel + '</span>' +
        '</div>' +
        '<div class="chip-item-desc">' + String(skill.desc || '') + '</div>' +
        '<div class="chip-item-desc" style="color:var(--text);margin-top:6px;"><strong>Naechstes Level:</strong> ' + fmtSkillEffect(skill, nextLevel) + '</div>' +
        (reqState.text ? '<div class="chip-item-desc" style="margin-top:6px;">Voraussetzung: ' + reqState.text + '</div>' : '') +
        (
          level >= maxLevel
            ? '<button class="chip-btn chip-btn-done" disabled>✓ MAX</button>'
            : '<button class="chip-btn" ' + (canBuy ? '' : 'disabled') + ' onclick="buyPrestigeSkill(\'' + skill.id + '\')">💎 ' + fmtNum(cost, 0) + ' investieren</button>'
        );
      treeGrid.appendChild(card);
    });

    section.appendChild(treeGrid);
    grid.appendChild(section);
  });

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
  renderWallet();
  renderResearch();
  renderStaff();
  renderRigCrew();
  renderMissions();
  renderTraders();
  renderCollections();
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
  const guideBox = document.getElementById('tutorial-guide');
  const spotlight = document.getElementById('tutorial-spotlight');
  if (!box) return;
  const steps = window.TUTORIAL_STEPS || [];
  if (!steps.length || G.tutorialEnabled === false || G.tutorialCompleted) {
    box.style.display = 'none';
    box.innerHTML = '';
    if (guideBox) {
      guideBox.classList.remove('show');
      guideBox.innerHTML = '';
    }
    if (spotlight) spotlight.classList.remove('show');
    return;
  }
  const idx = Math.max(0, Number(G.tutorialStep || 0));
  const step = steps[idx];
  if (!step) {
    box.style.display = 'none';
    box.innerHTML = '';
    if (guideBox) {
      guideBox.classList.remove('show');
      guideBox.innerHTML = '';
    }
    if (spotlight) spotlight.classList.remove('show');
    return;
  }
  box.style.display = 'none';
  box.innerHTML = '';
  const guide = getTutorialGuide(step.id);
  const target = resolveTutorialTarget(guide);
  const targetReady = !!(target && target.kind === 'target' && target.el);
  const targetLabel = guide.focusLabel || (target && target.label) || 'Naechster Bereich';
  const areaLabel = guide.area || formatTutorialTab(guide.tab);
  const explain = getTutorialExplain(step, guide, idx, steps.length, targetReady, targetLabel, areaLabel);
  const actionText = targetReady
    ? ('Jetzt hier arbeiten: ' + targetLabel)
    : ('Wechsle zuerst in den Bereich ' + areaLabel + '.');
  if (guideBox) {
    guideBox.classList.add('show');
    guideBox.innerHTML = `
      <div class="tutorial-progress"><div class="tutorial-progress-fill" style="width:${(((idx + 1) / Math.max(1, steps.length)) * 100).toFixed(2)}%"></div></div>
      <div class="tutorial-guide-top">
        <div class="tutorial-chip">📘 Tutorial ${idx + 1}/${steps.length}</div>
        <div class="tutorial-chip">${areaLabel}</div>
      </div>
      <div class="tutorial-guide-title">${step.title}</div>
      <div class="tutorial-guide-desc">${step.desc}</div>
      <div class="tutorial-guide-section">
        <div class="tutorial-guide-label">Was ist das?</div>
        <div class="tutorial-guide-copy">${explain.what}</div>
      </div>
      <div class="tutorial-guide-section">
        <div class="tutorial-guide-label">Warum jetzt?</div>
        <div class="tutorial-guide-copy">${explain.why}</div>
      </div>
      <div class="tutorial-guide-action">${guide.cta || actionText}</div>
      <div class="tutorial-guide-section tutorial-guide-section-soft">
        <div class="tutorial-guide-label">Erledigt, wenn</div>
        <div class="tutorial-guide-copy">${explain.doneWhen}</div>
      </div>
      <div class="tutorial-guide-meta">
        <div>Ziel: <strong>${targetLabel}</strong></div>
        <div>Status: <strong>${targetReady ? 'markiert' : 'Bereich wechseln'}</strong></div>
        <div>Naechster Klick: <strong>${explain.nextClick}</strong></div>
      </div>
      <div class="tutorial-guide-actions">
        <button class="tutorial-mini-btn primary" type="button" onclick="jumpToTutorialTarget()">${targetReady ? 'Zum Ziel scrollen' : 'Zum Bereich springen'}</button>
        <button class="tutorial-mini-btn" type="button" onclick="pulseTutorialTarget()">Markierung zeigen</button>
      </div>`;
  }
  positionTutorialSpotlight(target);
}
window.renderTutorialBox = renderTutorialBox;

const TUTORIAL_GUIDE_MAP = {
  t01: { tab: 'mine', selector: '#mine-btn', area: 'Mine', focusLabel: 'Mining-Button', cta: 'Tippe auf den grossen Mining-Button. Drei Klicks reichen fuer den Start.' },
  t02: { tab: 'mine', selector: '#mine-btn', area: 'Mine', focusLabel: 'Mining-Button', cta: 'Bleib im Mine-Reiter und sammle deine ersten 15 Klicks.' },
  t03: { tab: 'mine', selector: '#s-hashes, #hs-breakdown-btn', area: 'Mine', focusLabel: 'Hash-Anzeige', cta: 'Beobachte oben deine Hash-Werte. Du brauchst 250 Gesamt-Hashes.' },
  t04: { tab: 'market', selector: '#market-grid .sell-btn.all, #market-grid .sell-btn, #market-grid', area: 'Market', focusLabel: 'Crypto Market', cta: 'Verkaufe Coins im Market, bis mindestens $120 in der Kasse liegen.' },
  t05: { tab: 'mine', selector: '#rig-grid .rig-card .buy-btn', area: 'Rigs', focusLabel: 'Rig-Kaufbutton', cta: 'Kaufe jetzt deinen ersten Rig. Ohne Rig kein passives Einkommen.' },
  t06: { tab: 'mine', selector: '#rig-grid .rig-card .rig-coin-btn', area: 'Rigs', focusLabel: 'Coin-Zuweisung', cta: 'Waehle bei deinem Rig einen Coin aus, den er minen soll.' },
  t07: { tab: 'market', selector: '#market-grid .coin-card, #market-grid', area: 'Market', focusLabel: 'Coin-Karten', cta: 'Sobald ein Rig arbeitet, tauchen hier deine ersten geminten Coins auf.' },
  t08: { tab: 'market', selector: '#market-grid .sell-btn.all, #market-grid .sell-btn', area: 'Market', focusLabel: 'Sell Button', cta: 'Verkaufe Coins regelmaessig, um Umsatz aufzubauen.' },
  t09: { tab: 'market', selector: '.coin-auto-row .toggle', area: 'Market', focusLabel: 'Auto-Sell Toggle', cta: 'Aktiviere Auto-Sell bei mindestens einem Coin fuer Grundautomation.' },
  t10: { tab: 'mine', selector: '#rig-grid .rig-card .buy-btn', area: 'Rigs', focusLabel: 'Rig-Kaufbutton', cta: 'Baue auf zwei Rigs aus. Ab hier startet dein erster kleiner Multiplikator.' },
  t11: { tab: 'upgrades', selector: '#upgrade-grid .buy-btn', area: 'Upgrades', focusLabel: 'Upgrade-Kauf', cta: 'Oeffne Upgrades und kauf dein erstes dauerhaftes Upgrade.' },
  t12: { tab: 'upgrades', selector: '#upgrade-grid .upgrade-card', area: 'Upgrades', focusLabel: 'Upgrade-Auswahl', cta: 'Kombiniere mehrere Upgrades. Drei Stueck reichen fuer diesen Schritt.' },
  t13: { tab: 'research', selector: '#research-tree .research-card .buy-btn, #research-tree .research-card button', area: 'Research', focusLabel: 'Research-Start', cta: 'Starte im Research-Reiter deine erste Forschung.' },
  t14: { tab: 'staff', selector: '#staff-grid .buy-btn, #staff-grid .hire-btn', area: 'Staff', focusLabel: 'Staff-Hiring', cta: 'Stelle dein erstes Kern-Teammitglied ein.' },
  t15: { tab: 'staff', selector: '#staff-grid .buy-btn, #staff-grid .hire-btn', area: 'Staff', focusLabel: 'Staff-Hiring', cta: 'Erweitere dein Kernteam auf drei Leute.' },
  t16: { tab: 'crew', selector: '#crew-grid .buy-btn, #crew-grid .hire-btn', area: 'Rig Crew', focusLabel: 'Crew-Hiring', cta: 'Im Rig-Crew-Reiter stellst du technische Teams fuer deine Rigs ein.' },
  t17: { tab: 'crew', selector: '#crew-grid select, #crew-grid .buy-btn', area: 'Rig Crew', focusLabel: 'Crew-Zuweisung', cta: 'Weise deine Crew einem Rig-Typ zu, damit Wartung und Performance greifen.' },
  t18: { tab: 'crew', selector: '#crew-grid .focus-btn, #crew-grid select', area: 'Rig Crew', focusLabel: 'Crew-Fokus', cta: 'Aendere den Fokus eines Rig-Typs auf etwas anderes als Balanced.' },
  t19: { tab: 'crew', selector: '#crew-grid .spec-btn, #crew-grid select', area: 'Rig Crew', focusLabel: 'Crew-Spezialisierung', cta: 'Jedes Crew-Tier kann spezialisiert werden. Setze eine bewusste Rolle.' },
  t20: { tab: 'missions', selector: '#contract-grid .contract-card .accept-btn[onclick^=\"claimContract\"], #contract-grid .contract-card.active', area: 'Missionen', focusLabel: 'Contract-Claim', cta: 'Claim jetzt deinen ersten abgeschlossenen Contract.' },
  t21: { tab: 'missions', selector: '#missions-panel', area: 'Missionen', focusLabel: 'Contract-Liste', cta: 'Arbeite mehrere Contracts parallel ab. Drei Abschluesse genuegen.' },
  t22: { tab: 'missions', selector: '#missions-panel .challenge-card button, #missions-panel button', area: 'Missionen', focusLabel: 'Daily-Challenge', cta: 'Loese eine Daily Challenge ein. Das ist dein taeglicher Routine-Boost.' },
  t23: { tab: 'achievements', selector: '#ach-grid .achievement, #ach-grid .achievement-card, #ach-grid', area: 'Achievements', focusLabel: 'Achievements', cta: 'Erfolge und Meta-Ziele geben dir fruehe Struktur. Sammle die ersten fuenf.' },
  t24: { tab: 'power', selector: '#power-panel [data-power-action=\"upgrade\"]', area: 'Power', focusLabel: 'Power-Upgrade', cta: 'Baue jetzt dein Stromnetz aus. Ohne kW kannst du spaeter keine groessere Farm tragen.' },
  t25: { tab: 'power', selector: '#power-panel [data-power-action=\"batteryupg\"]', area: 'Power', focusLabel: 'Notstrom-Akku', cta: 'Schalte den Akku frei. Er puffert Lastspitzen und spaetere Stromausfaelle ab.' },
  t26: { tab: 'power', selector: '#power-provider-select', area: 'Power', focusLabel: 'Stromanbieter', cta: 'Waehle einen anderen Stromanbieter und uebernimm den Wechsel.' },
  t27: { tab: 'location', selector: '#power-cooling-mode-select', area: 'Standort', focusLabel: 'Cooling-Modus', cta: 'Stelle den Cooling-Modus mindestens einmal um. So lernst du Hitze gegen Leistung abzuwiegen.' },
  t28: { tab: 'location', selector: '#power-cooling-auto-select', area: 'Standort', focusLabel: 'Cooling-Auto', cta: 'Teste das Cooling-Auto-Profil. Es nimmt dir spaeter Heat-Management ab.' },
  t29: { tab: 'power', selector: '#power-outage-plan-select', area: 'Power', focusLabel: 'Ausfall-Autoplan', cta: 'Lege fest, wie dein Betrieb bei Stromausfaellen automatisch reagieren soll.' },
  t30: { tab: 'location', selector: '#power-location-select', area: 'Standort', focusLabel: 'Standort-Auswahl', cta: 'Zieh in einen besseren Standort um, sobald dein PC-Zimmer zu klein wird.' },
  t31: { tab: 'location', selector: '#power-location-shop-list .buy-btn, #power-location-shop-list', area: 'Standort', focusLabel: 'Standort-Shop', cta: 'Kaufe dein erstes Standort-Item. Solche Boni helfen Crew, Hitze und Durchsatz.' },
  t32: { tab: 'location', selector: '#power-layout-select', area: 'Standort', focusLabel: 'Rig-Layout', cta: 'Wechsle dein Layout mindestens einmal. Layouts veraendern Platzbedarf, Heat und Effizienz.' },
  t33: { tab: 'mine', selector: '#rig-grid .rig-card .buy-btn', area: 'Rigs', focusLabel: 'Rig-Kaufbutton', cta: 'Ab hier beginnt echter Ausbau. Arbeite dich auf sechs Rigs hoch.' },
  t34: { tab: 'mine', selector: '#rig-grid .rig-card .buy-btn', area: 'Rigs', focusLabel: 'Rig-Kaufbutton', cta: 'Zwischen 6 und 12 Rigs fuehlt sich das Spiel erstmals wie eine kleine Farm an.' },
  t35: { tab: 'mine', selector: '#rig-grid .rig-card', area: 'Rigs', focusLabel: 'GPU Miner Mk1', cta: 'Suche den GPU Miner Mk1 und bring ihn auf acht Exemplare.' },
  t36: { tab: 'mine', selector: '#rig-grid .rig-card', area: 'Rigs', focusLabel: 'ASIC Nano', cta: 'Teste deinen ersten ASIC. Er oeffnet den naechsten Technikpfad.' },
  t37: { tab: 'power', selector: '#power-mod-workshop .buy-btn, #power-mod-workshop button', area: 'Power Mods', focusLabel: 'Mod-Workshop', cta: 'Schalte im Mod-Workshop deinen ersten Rig-Mod frei.' },
  t38: { tab: 'power', selector: '#power-mod-workshop .buy-btn, #power-mod-workshop button', area: 'Power Mods', focusLabel: 'Mod-Upgrade', cta: 'Verbessere einen bereits freigeschalteten Mod auf Level 1+.' },
  t39: { tab: 'power', selector: '#power-mod-workshop', area: 'Power Mods', focusLabel: 'Mod-Parts', cta: 'Sammle oder halte 25 Mod-Parts fuer den spaeteren Ausbau.' },
  t40: { tab: 'power', selector: '#power-load-guard-select', area: 'Power', focusLabel: 'Load Guard', cta: 'Aktiviere den Load Guard. Er kappt Lastspitzen, bevor dein Netz instabil wird.' },
  t41: { tab: 'power', selector: '#power-battery-strategy-select', area: 'Power', focusLabel: 'Akku-Strategie', cta: 'Wechsle die Akku-Strategie mindestens einmal. So steuerst du, wann geladen oder entladen wird.' },
  t42: { tab: 'power', selector: '#power-tariff-policy-select', area: 'Power', focusLabel: 'Tarif-Policy', cta: 'Lege eine Tarif-Policy fest. Damit reagiert dein Netz automatisch auf Tag-, Peak- und Nachtpreise.' },
  t43: { tab: 'power', selector: '#power-risk-profile-select', area: 'Power', focusLabel: 'Grid-Profil', cta: 'Aendere dein Grid-Profil. Damit priorisierst du Durchsatz, Stabilitaet oder Notfallreserve.' },
  t44: { tab: 'power', selector: '#power-risk-auto-select', area: 'Power', focusLabel: 'Grid-Auto', cta: 'Schalte den Grid-Auto-Modus um. Ab hier kann das Netz Teile der Steuerung selbst uebernehmen.' },
  t45: { tab: 'power', selector: '#power-command-link-select', area: 'Power', focusLabel: 'Command-Link', cta: 'Pruefe den Command-Link. Er koppelt Grid-Profile und Ausfallplaene enger zusammen.' },
  t46: { tab: 'power', selector: '[data-power-action=\"advisor\"], #power-forecast-info', area: 'Power', focusLabel: 'Power-Advisor', cta: 'Nutze den Advisor einmal. Er setzt ein sinnvolles Setup aus Profil, Akku und Tarif-Policy.' },
  t47: { tab: 'missions', selector: '#goal-grid .challenge-card button, #goal-grid', area: 'Missionen', focusLabel: 'Goals', cta: 'Claim regelmaessig Goals. Drei Claims genuegen fuer diesen Schritt.' },
  t48: { tab: 'missions', selector: '#story-mission-card button, #story-mission-card', area: 'Missionen', focusLabel: 'Story-Missionen', cta: 'Arbeite die Story-Missionen weiter ab. Vier Claims fuehren dich durch die Kernsysteme.' },
  t49: { tab: 'market', selector: '#market-grid .coin-card, #market-grid', area: 'Economy', focusLabel: 'Coin-Produktion', cta: '120 Coins insgesamt zeigen, dass dein Routing und Verkauf funktionieren.' },
  t50: { tab: 'market', selector: '#market-grid .sell-btn.all, #market-grid .sell-btn, #market-grid', area: 'Economy', focusLabel: 'Umsatz', cta: 'Dein naechstes Ziel ist $200.000 Gesamtumsatz. Skaliere Verkauf, Rigs und Upgrades zusammen.' },
  t51: { tab: 'mine', selector: '#s-hashes, #hs-breakdown-btn', area: 'Mine', focusLabel: 'Hash-Leistung', cta: '5.000.000 Gesamt-Hashes markieren den Sprung zur industriellen Skala.' },
  t52: { tab: 'location', selector: '#power-location-select', area: 'Standort', focusLabel: 'Standort Tier 3', cta: 'Ziehe in einen Tier-3-Standort um. Mehr Platz und bessere Boni.' },
  t53: { tab: 'prestige', selector: '#prestige-panel', area: 'Prestige', focusLabel: 'Prestige-Chips', cta: 'Sammle zuerst Chips. Dann lohnt sich dein erster Reset deutlich mehr.' },
  t54: { tab: 'prestige', selector: '#prestige-panel', area: 'Prestige', focusLabel: 'Prestige-Vorbereitung', cta: 'Halte mindestens fuenf Chips, bevor du den ersten Reset ernsthaft in Betracht ziehst.' },
  t55: { tab: 'prestige', selector: '#do-prestige-btn', area: 'Prestige', focusLabel: 'Prestige-Button', cta: 'Wenn du bereit bist, fuehre dein erstes Prestige aus und starte staerker neu.' },
  t56: { tab: 'mine', selector: '#rig-grid .rig-card .buy-btn', area: 'Post-Prestige', focusLabel: 'Rig-Neustart', cta: 'Nach Prestige geht es schneller. Baue direkt wieder mindestens fuenf Rigs auf.' },
};

function formatTutorialTab(tab) {
  const map = {
    mine: 'Mine',
    power: 'Power',
    market: 'Market',
    upgrades: 'Upgrades',
    research: 'Research',
    staff: 'Staff',
    crew: 'Rig Crew',
    missions: 'Missionen',
    achievements: 'Achievements',
    location: 'Standort',
    prestige: 'Prestige',
  };
  return map[String(tab || '')] || 'Spielbereich';
}

function getTutorialGuide(stepId) {
  return TUTORIAL_GUIDE_MAP[String(stepId || '')] || { tab: 'mine', selector: '#mine-btn', area: 'Mine', focusLabel: 'Mine', cta: 'Arbeite den aktuellen Tutorial-Schritt im markierten Bereich ab.' };
}

function getTutorialAreaExplainer(area) {
  const key = String(area || '').toLowerCase();
  if (key === 'mine') return {
    what: 'Hier erzeugst du aktiv Hashes und kaufst neue Rigs fuer passives Einkommen.',
    why: 'Das ist dein Startpunkt. Ohne Hashes, Cash und erste Rigs kommt der Rest des Spiels nicht ins Rollen.',
  };
  if (key === 'market' || key === 'economy') return {
    what: 'Hier verwandelst du geminte Coins in Cash und stellst Auto-Sell ein.',
    why: 'Cash ist deine Hauptwaehrung fuer Ausbau, Upgrades, Forschung und Infrastruktur.',
  };
  if (key === 'upgrades') return {
    what: 'Hier kaufst du dauerhafte Verbesserungen fuer Klicks, Rigs und Multiplikatoren.',
    why: 'Upgrades sorgen dafuer, dass du nicht nur breiter, sondern auch effizienter skalierst.',
  };
  if (key === 'research') return {
    what: 'Hier schaltest du langfristige Tech-Fortschritte frei.',
    why: 'Research oeffnet neue Systeme und macht spaetere Skalierung deutlich effizienter.',
  };
  if (key === 'staff') return {
    what: 'Hier stellst du Kernpersonal fuer Handel, Entwicklung und Operations ein.',
    why: 'Core-Staff bringt permanente Betriebsboni und ist fuer Midgame-Stabilitaet wichtig.',
  };
  if (key === 'rig crew') return {
    what: 'Hier verwaltest du Technik-Teams, die konkrete Rig-Typen betreuen.',
    why: 'Crew stabilisiert Haltbarkeit, Wartung und Performance deiner Mining-Flotte.',
  };
  if (key === 'power' || key === 'power mods') return {
    what: 'Hier steuerst du Stromnetz, Hitze, Last, Akku und Grid-Automation.',
    why: 'Ohne saubere Power-Planung bremsen Stromgrenze, Hitze und Ausfaelle dein Wachstum aus.',
  };
  if (key === 'standort' || key === 'post-prestige') return {
    what: 'Hier wechselst du in groessere Gebaeude und kaufst Standort-Boni.',
    why: 'Mehr Platz und Standort-Boni sind noetig, damit deine Farm ueberhaupt weiter wachsen kann.',
  };
  if (key === 'missionen' || key === 'meta-ziele') return {
    what: 'Hier findest du kurzfristige Aufgaben, Daily Challenges, Story-Ziele und Claims.',
    why: 'Missionen geben dir Richtung, Belohnungen und eine sinnvolle Priorisierung deiner naechsten Schritte.',
  };
  if (key === 'achievements') return {
    what: 'Hier siehst du dauerhafte Erfolge fuer Mining, Ausbau und Meta-Fortschritt.',
    why: 'Achievements zeigen dir, welche Systeme du schon bedient hast und wo noch Luecken offen sind.',
  };
  if (key === 'prestige') return {
    what: 'Hier setzt du einen Run kontrolliert zurueck und startest mit Meta-Boni neu.',
    why: 'Prestige ist der Sprung ins spaetere Spiel. Ein guter Reset beschleunigt alle weiteren Runs.',
  };
  return {
    what: 'Dieser Bereich gehoert zum aktuellen Tutorial-Schritt.',
    why: 'Hier liegt gerade dein sinnvollster Fortschritt.',
  };
}

function getTutorialExplain(step, guide, idx, total, targetReady, targetLabel, areaLabel) {
  const areaInfo = getTutorialAreaExplainer(areaLabel);
  return {
    what: guide.what || areaInfo.what,
    why: guide.why || areaInfo.why,
    doneWhen: guide.doneWhen || step.desc,
    nextClick: targetReady ? targetLabel : ('Reiter ' + areaLabel),
    stepOf: 'Schritt ' + (idx + 1) + ' von ' + total,
  };
}

function resolveTutorialTarget(guide) {
  if (!guide) return null;
  const activeTab = document.querySelector('.tab.active');
  const activeTabId = activeTab ? String(activeTab.dataset.tab || '') : '';
  if (guide.tab && guide.tab !== activeTabId) {
    const tabBtn = document.querySelector('.tab[data-tab="' + guide.tab + '"]');
    return tabBtn ? { kind: 'tab', el: tabBtn, label: formatTutorialTab(guide.tab) } : null;
  }
  const selectors = String(guide.selector || '').split(',').map((x) => x.trim()).filter(Boolean);
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return { kind: 'target', el, label: guide.focusLabel || selector };
  }
  if (guide.tab) {
    const tabBtn = document.querySelector('.tab[data-tab="' + guide.tab + '"]');
    if (tabBtn) return { kind: 'tab', el: tabBtn, label: formatTutorialTab(guide.tab) };
  }
  return null;
}

function positionTutorialSpotlight(target) {
  const spotlight = document.getElementById('tutorial-spotlight');
  if (!spotlight) return;
  if (!target || !target.el) {
    spotlight.classList.remove('show');
    return;
  }
  const rect = target.el.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    spotlight.classList.remove('show');
    return;
  }
  spotlight.style.left = Math.max(6, rect.left - 6) + 'px';
  spotlight.style.top = Math.max(6, rect.top - 6) + 'px';
  spotlight.style.width = Math.max(24, rect.width + 12) + 'px';
  spotlight.style.height = Math.max(24, rect.height + 12) + 'px';
  spotlight.classList.add('show');
}

function pulseTutorialTarget() {
  const steps = window.TUTORIAL_STEPS || [];
  const step = steps[Math.max(0, Number(G.tutorialStep || 0))];
  if (!step) return;
  const target = resolveTutorialTarget(getTutorialGuide(step.id));
  if (!target || !target.el) return;
  if (typeof target.el.scrollIntoView === 'function') {
    target.el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
  target.el.classList.remove('tutorial-pulse');
  void target.el.offsetWidth;
  target.el.classList.add('tutorial-pulse');
  positionTutorialSpotlight(target);
}
window.pulseTutorialTarget = pulseTutorialTarget;

function jumpToTutorialTarget() {
  const steps = window.TUTORIAL_STEPS || [];
  const step = steps[Math.max(0, Number(G.tutorialStep || 0))];
  if (!step) return;
  const guide = getTutorialGuide(step.id);
  if (guide.tab) {
    if (typeof switchTab === 'function') switchTab(guide.tab);
    if (typeof renderApp === 'function') renderApp();
  }
  setTimeout(() => {
    pulseTutorialTarget();
  }, 80);
}
window.jumpToTutorialTarget = jumpToTutorialTarget;

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
  const coolingAutoSelect = document.getElementById('power-cooling-auto-select');
  const coolingAutoProfile = coolingAutoSelect ? coolingAutoSelect.value : String(G.coolingAutoProfile || 'balanced');
  document.querySelectorAll('[data-power-action="coolauto"]').forEach((btn) => {
    btn.textContent = 'Cooling-Auto uebernehmen';
    btn.title = 'Auto-Profil schaltet den Cooling-Modus je nach Hitze und Last.';
    btn.disabled = !coolingAutoProfile || String(coolingAutoProfile) === String(G.coolingAutoProfile || 'balanced');
  });
  const outagePlanSelect = document.getElementById('power-outage-plan-select');
  const outagePlan = outagePlanSelect ? outagePlanSelect.value : String(G.powerOutageAutoPlan || 'balanced');
  document.querySelectorAll('[data-power-action="outageplan"]').forEach((btn) => {
    btn.textContent = 'Autoplan uebernehmen';
    btn.title = 'Safety priorisiert Stabilitaet, Durchsatz priorisiert H/s.';
    btn.disabled = !outagePlan || String(outagePlan) === String(G.powerOutageAutoPlan || 'balanced');
  });
  const riskProfileSelect = document.getElementById('power-risk-profile-select');
  const riskProfile = riskProfileSelect ? riskProfileSelect.value : String(G.powerRiskProfile || 'balanced');
  document.querySelectorAll('[data-power-action="riskprofile"]').forEach((btn) => {
    btn.textContent = 'Profil uebernehmen';
    btn.title = 'Grid Control steuert Risiko, H/s und Stromkosten.';
    btn.disabled = !riskProfile || String(riskProfile) === String(G.powerRiskProfile || 'balanced');
  });
  const riskAutoSelect = document.getElementById('power-risk-auto-select');
  const riskAutoMode = riskAutoSelect ? riskAutoSelect.value : String(G.powerRiskAutoMode || 'off');
  document.querySelectorAll('[data-power-action="riskauto"]').forEach((btn) => {
    btn.textContent = 'Auto uebernehmen';
    btn.title = 'Assist stabilisiert, Full schaltet komplett dynamisch.';
    btn.disabled = !riskAutoMode || String(riskAutoMode) === String(G.powerRiskAutoMode || 'off');
  });
  const commandLinkSelect = document.getElementById('power-command-link-select');
  const commandLink = commandLinkSelect ? commandLinkSelect.value : (G.powerCommandLinkEnabled ? 'on' : 'off');
  document.querySelectorAll('[data-power-action="commandlink"]').forEach((btn) => {
    btn.textContent = 'Link uebernehmen';
    btn.title = 'Synchronisiert Outage-Autoplan mit dem aktiven Grid-Profil.';
    const current = G.powerCommandLinkEnabled ? 'on' : 'off';
    btn.disabled = !commandLink || String(commandLink) === current;
  });
  const guardSelect = document.getElementById('power-load-guard-select');
  const guardTargetSelect = document.getElementById('power-load-guard-target-select');
  const guardMode = guardSelect ? guardSelect.value : (G.powerLoadGuardEnabled ? 'on' : 'off');
  const currentGuardMode = G.powerLoadGuardEnabled ? 'on' : 'off';
  const currentGuardTarget = Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85)));
  const selectedGuardTarget = guardTargetSelect ? Number(guardTargetSelect.value || currentGuardTarget) : currentGuardTarget;
  document.querySelectorAll('[data-power-action="loadguard"]').forEach((btn) => {
    btn.textContent = 'Guard uebernehmen';
    btn.title = 'Begrenzt Last auf ein Ziel, um Ausfaelle zu vermeiden.';
    const changed = (String(guardMode) !== String(currentGuardMode))
      || (Math.abs(Number(selectedGuardTarget || 0) - Number(currentGuardTarget || 0)) > 1e-6);
    btn.disabled = !changed;
  });
  const batteryStrategySelect = document.getElementById('power-battery-strategy-select');
  const batteryStrategy = batteryStrategySelect ? batteryStrategySelect.value : String(G.powerBatteryStrategy || 'balanced');
  document.querySelectorAll('[data-power-action="batterystrategy"]').forEach((btn) => {
    btn.textContent = 'Akku-Strategie uebernehmen';
    btn.title = 'Steuert, ob dein Akku fuer Peaks, Tarife oder Notfaelle priorisiert wird.';
    btn.disabled = !batteryStrategy || String(batteryStrategy) === String(G.powerBatteryStrategy || 'balanced');
  });
  const tariffPolicySelect = document.getElementById('power-tariff-policy-select');
  const tariffPolicy = tariffPolicySelect ? tariffPolicySelect.value : String(G.powerTariffPolicy || 'off');
  document.querySelectorAll('[data-power-action="tariffpolicy"]').forEach((btn) => {
    btn.textContent = 'Tarif-Policy uebernehmen';
    btn.title = 'Schaltet Akku und Grid-Profil passend zum aktuellen Tariffenster.';
    btn.disabled = !tariffPolicy || String(tariffPolicy) === String(G.powerTariffPolicy || 'off');
  });
  document.querySelectorAll('[data-power-action="advisor"]').forEach((btn) => {
    btn.textContent = 'Advisor anwenden';
    btn.title = 'Setzt Risk-Profil, Akku-Strategie, Tarif-Policy und Lastschutz auf das empfohlene Setup.';
    btn.disabled = false;
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
      <div class="power-row"><span>Cooling Auto</span><strong>${String(G.coolingAutoProfile || 'balanced')}</strong></div>
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
  const coolingAutoSelect = document.getElementById('power-cooling-auto-select');
  if (coolingAutoSelect) {
    const isEditingAuto = document.activeElement === coolingAutoSelect;
    if (!isEditingAuto) {
      const prev = coolingAutoSelect.value || String(G.coolingAutoProfile || 'balanced');
      const opts = [
        { id: 'off', label: 'Cooling Auto: Aus' },
        { id: 'safe', label: 'Cooling Auto: Sicher' },
        { id: 'balanced', label: 'Cooling Auto: Balanced' },
        { id: 'aggressive', label: 'Cooling Auto: Aggressiv Sparen' },
      ];
      coolingAutoSelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.coolingAutoProfile || 'balanced');
      coolingAutoSelect.value = fallback;
    }
  }
  const outagePlanSelect = document.getElementById('power-outage-plan-select');
  if (outagePlanSelect) {
    const isEditingPlan = document.activeElement === outagePlanSelect;
    if (!isEditingPlan) {
      const prev = outagePlanSelect.value || String(G.powerOutageAutoPlan || 'balanced');
      const opts = [
        { id: 'off', label: 'Ausfall-Autoplan: Manuell' },
        { id: 'safe', label: 'Ausfall-Autoplan: Safety' },
        { id: 'balanced', label: 'Ausfall-Autoplan: Balanced' },
        { id: 'greedy', label: 'Ausfall-Autoplan: Durchsatz' },
      ];
      outagePlanSelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.powerOutageAutoPlan || 'balanced');
      outagePlanSelect.value = fallback;
    }
  }
  const riskProfileSelect = document.getElementById('power-risk-profile-select');
  if (riskProfileSelect) {
    const isEditingRisk = document.activeElement === riskProfileSelect;
    if (!isEditingRisk) {
      const prev = riskProfileSelect.value || String(G.powerRiskProfile || 'balanced');
      const opts = [
        { id: 'throughput', label: 'Profil: Durchsatz' },
        { id: 'balanced', label: 'Profil: Balanced' },
        { id: 'resilience', label: 'Profil: Resilienz' },
        { id: 'emergency', label: 'Profil: Emergency' },
      ];
      riskProfileSelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.powerRiskProfile || 'balanced');
      riskProfileSelect.value = fallback;
    }
  }
  const riskAutoSelect = document.getElementById('power-risk-auto-select');
  if (riskAutoSelect) {
    const isEditingRiskAuto = document.activeElement === riskAutoSelect;
    if (!isEditingRiskAuto) {
      const prev = riskAutoSelect.value || String(G.powerRiskAutoMode || 'off');
      const opts = [
        { id: 'off', label: 'Grid-Auto: Aus' },
        { id: 'assist', label: 'Grid-Auto: Assist' },
        { id: 'full', label: 'Grid-Auto: Full' },
      ];
      riskAutoSelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.powerRiskAutoMode || 'off');
      riskAutoSelect.value = fallback;
    }
  }
  const commandLinkSelect = document.getElementById('power-command-link-select');
  if (commandLinkSelect) {
    const isEditingLink = document.activeElement === commandLinkSelect;
    if (!isEditingLink) {
      const current = G.powerCommandLinkEnabled ? 'on' : 'off';
      commandLinkSelect.innerHTML = `
        <option value="on">Command-Link: EIN</option>
        <option value="off">Command-Link: AUS</option>`;
      commandLinkSelect.value = current;
    }
  }
  const guardSelect = document.getElementById('power-load-guard-select');
  if (guardSelect) {
    const isEditingGuard = document.activeElement === guardSelect;
    if (!isEditingGuard) {
      const current = G.powerLoadGuardEnabled ? 'on' : 'off';
      guardSelect.innerHTML = `
        <option value="off">Load Guard: AUS</option>
        <option value="on">Load Guard: EIN</option>`;
      guardSelect.value = current;
    }
  }
  const guardTargetSelect = document.getElementById('power-load-guard-target-select');
  if (guardTargetSelect) {
    const isEditingGuardTarget = document.activeElement === guardTargetSelect;
    if (!isEditingGuardTarget) {
      const opts = [0.70, 0.80, 0.85, 0.90, 0.95];
      guardTargetSelect.innerHTML = opts.map((v) => (
        '<option value="' + v.toFixed(2) + '">Load-Ziel: ' + fmtNum(v * 100, 0) + '%</option>'
      )).join('');
      const current = Math.max(0.55, Math.min(0.98, Number(G.powerLoadGuardTarget || 0.85)));
      const nearest = opts.reduce((best, val) => (Math.abs(val - current) < Math.abs(best - current) ? val : best), opts[0]);
      guardTargetSelect.value = nearest.toFixed(2);
    }
  }
  const batteryStrategySelect = document.getElementById('power-battery-strategy-select');
  if (batteryStrategySelect) {
    const isEditingBatteryStrategy = document.activeElement === batteryStrategySelect;
    if (!isEditingBatteryStrategy) {
      const prev = batteryStrategySelect.value || String(G.powerBatteryStrategy || 'balanced');
      const opts = [
        { id: 'balanced', label: 'Akku-Strategie: Balanced' },
        { id: 'peak_guard', label: 'Akku-Strategie: Peak Guard' },
        { id: 'arbitrage', label: 'Akku-Strategie: Tarif-Arbitrage' },
        { id: 'reserve', label: 'Akku-Strategie: Reserve' },
      ];
      batteryStrategySelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.powerBatteryStrategy || 'balanced');
      batteryStrategySelect.value = fallback;
    }
  }
  const tariffPolicySelect = document.getElementById('power-tariff-policy-select');
  if (tariffPolicySelect) {
    const isEditingTariffPolicy = document.activeElement === tariffPolicySelect;
    if (!isEditingTariffPolicy) {
      const prev = tariffPolicySelect.value || String(G.powerTariffPolicy || 'off');
      const opts = [
        { id: 'off', label: 'Tarif-Policy: Aus' },
        { id: 'cost_focus', label: 'Tarif-Policy: Kostenfokus' },
        { id: 'balanced', label: 'Tarif-Policy: Balanced' },
        { id: 'rush', label: 'Tarif-Policy: Rush Hour' },
      ];
      tariffPolicySelect.innerHTML = opts.map((opt) => (
        '<option value="' + opt.id + '">' + opt.label + '</option>'
      )).join('');
      const fallback = opts.some((x) => x.id === prev) ? prev : String(G.powerTariffPolicy || 'off');
      tariffPolicySelect.value = fallback;
    }
  }

  const forecastInfo = document.getElementById('power-forecast-info');
  if (forecastInfo) {
    const forecast = (typeof window.getPowerForecastSnapshot === 'function')
      ? getPowerForecastSnapshot()
      : null;
    const recommended = (typeof window.getRecommendedPowerSetup === 'function')
      ? getRecommendedPowerSetup()
      : null;
    if (!forecast) {
      forecastInfo.innerHTML = '<div class="power-list-item">Forecast wird geladen…</div>';
    } else {
      const riskColor = forecast.riskScore >= 72 ? '#ff6b81' : (forecast.riskScore >= 52 ? '#f6c35f' : '#64e5b3');
      const outagePct = Math.max(0, Math.min(100, Number(forecast.outageChancePerMin || 0) * 100));
      const spare = Number(forecast.spareKw || 0);
      const spareLabel = spare >= 0
        ? ('+' + fmtNum(spare, 2) + ' kW')
        : ('-' + fmtNum(Math.abs(spare), 2) + ' kW');
      forecastInfo.innerHTML = `
        <div class="power-row"><span>Profil</span><strong>${forecast.riskProfileLabel || 'Balanced'}</strong></div>
        <div class="power-row"><span>Risiko-Score</span><strong style="color:${riskColor};">${fmtNum(forecast.riskScore || 0, 1)} / 100</strong></div>
        <div class="power-row"><span>Ausfall-Chance / Min</span><strong>${fmtNum(outagePct, 2)}%</strong></div>
        <div class="power-row"><span>Lastpuffer</span><strong>${spareLabel}</strong></div>
        <div class="power-row"><span>Heat (Avg / Max)</span><strong>${fmtNum(forecast.avgHeat || 0, 1)}% / ${fmtNum(forecast.maxHeat || 0, 1)}%</strong></div>
        <div class="power-row"><span>Akku-Strategie</span><strong>${forecast.batteryStrategyLabel || 'Balanced'}</strong></div>
        <div class="power-row"><span>Tarif-Policy</span><strong>${forecast.tariffPolicyLabel || 'Aus'}</strong></div>
        <div class="power-row"><span>Advisor Setup</span><strong>${recommended ? [recommended.riskProfile, recommended.batteryStrategy, recommended.tariffPolicy].join(' / ') : '—'}</strong></div>
        <div class="power-row"><span>Crew Power-Control</span><strong>kW ${((1 - Number(forecast.crewPowerUsageMult || 1)) * 100) >= 0 ? '-' : '+'}${fmtNum(Math.abs((1 - Number(forecast.crewPowerUsageMult || 1)) * 100), 1)}% · Heat ${((1 - Number(forecast.crewHeatGainMult || 1)) * 100) >= 0 ? '-' : '+'}${fmtNum(Math.abs((1 - Number(forecast.crewHeatGainMult || 1)) * 100), 1)}%</strong></div>
        <div class="power-row"><span>Crew Automation</span><strong>Cooling +${fmtNum(Math.max(0, (Number(forecast.crewCoolingAssistMult || 1) - 1) * 100), 1)}% · Auto +${fmtNum(Math.max(0, (Number(forecast.crewAutomationAssistMult || 1) - 1) * 100), 1)}%</strong></div>
        <div class="power-row"><span>Crew Outage-Prep</span><strong>+${fmtNum(Math.max(0, (Number(forecast.crewOutagePrepMult || 1) - 1) * 100), 1)}%</strong></div>
        <div class="power-row"><span>Stromkosten / Tag (Forecast)</span><strong>$${fmtNum(forecast.projectedPowerDayCost || 0, 2)}</strong></div>
        <div class="power-row"><span>Akku-Savings gesamt</span><strong>$${fmtNum(forecast.batteryStrategySavingsUsd || 0, 2)}</strong></div>
        <div class="power-row"><span>Outages (Total / Auto / Manuell)</span><strong>${fmtNum(forecast.outagesSeen || 0, 0)} / ${fmtNum(forecast.outagesAuto || 0, 0)} / ${fmtNum(forecast.outagesManual || 0, 0)}</strong></div>
        <div class="power-row"><span>Advisor Runs</span><strong>${fmtNum(Number(G.powerAdvisorRuns || 0), 0)}</strong></div>
        <div class="power-row"><span>Empfehlung</span><strong>${forecast.recommendation || '—'}</strong></div>`;
    }
  }
  const riskInfo = document.getElementById('power-risk-info');
  if (riskInfo) {
    const meta = (typeof window.getPowerRiskProfileMeta === 'function')
      ? getPowerRiskProfileMeta(G.powerRiskProfile)
      : null;
    const batteryMeta = (typeof window.getPowerBatteryStrategyMeta === 'function')
      ? getPowerBatteryStrategyMeta(G.powerBatteryStrategy)
      : null;
    const perfPct = (Math.max(0, Number((meta && meta.perfMult) || 1)) - 1) * 100;
    const pricePct = (Math.max(0, Number((meta && meta.priceMult) || 1)) - 1) * 100;
    const crashPct = (Math.max(0, Number((meta && meta.crashMult) || 1)) - 1) * 100;
    const outagePct = (Math.max(0, Number((meta && meta.outageMult) || 1)) - 1) * 100;
    riskInfo.innerHTML = `
      <div class="power-row"><span>Aktives Profil</span><strong>${(meta && meta.label) || 'Balanced'}</strong></div>
      <div class="power-row"><span>Grid-Auto</span><strong>${String((G.powerRiskAutoMode || 'off')).toUpperCase()} ${Number(G.powerRiskAutoCooldown || 0) > 0 ? ('(' + fmtTime(G.powerRiskAutoCooldown) + ')') : ''}</strong></div>
      <div class="power-row"><span>Command-Link</span><strong>${(G.powerCommandLinkEnabled ? 'EIN' : 'AUS')} ${Number(G.powerCommandCooldown || 0) > 0 ? ('(' + fmtTime(G.powerCommandCooldown) + ')') : ''}</strong></div>
      <div class="power-row"><span>Load Guard</span><strong>${(G.powerLoadGuardEnabled ? 'EIN' : 'AUS')} @ ${fmtNum(Number(G.powerLoadGuardTarget || 0.85) * 100, 0)}% ${G._powerLoadGuardActive ? '(aktiv)' : ''}</strong></div>
      <div class="power-row"><span>Akku-Strategie</span><strong>${(batteryMeta && batteryMeta.label) || 'Balanced'}</strong></div>
      <div class="power-row"><span>Tarif-Policy</span><strong>${((typeof window.getPowerTariffPolicyMeta === 'function' ? getPowerTariffPolicyMeta(G.powerTariffPolicy).label : String(G.powerTariffPolicy || 'off')))} ${Number(G.powerTariffPolicyCooldown || 0) > 0 ? ('(' + fmtTime(G.powerTariffPolicyCooldown) + ')') : ''}</strong></div>
      <div class="power-row"><span>Outage-Plan Ziel</span><strong>${String((G.powerOutageAutoPlan || 'balanced')).toUpperCase()}</strong></div>
      <div class="power-row"><span>H/s Effekt</span><strong>${perfPct >= 0 ? '+' : ''}${fmtNum(perfPct, 1)}%</strong></div>
      <div class="power-row"><span>Strompreis Effekt</span><strong>${pricePct >= 0 ? '+' : ''}${fmtNum(pricePct, 1)}%</strong></div>
      <div class="power-row"><span>Crash-Risiko Effekt</span><strong>${crashPct >= 0 ? '+' : ''}${fmtNum(crashPct, 1)}%</strong></div>
      <div class="power-row"><span>Ausfallrate Effekt</span><strong>${outagePct >= 0 ? '+' : ''}${fmtNum(outagePct, 1)}%</strong></div>
      <div class="power-row"><span>Profilwechsel gesamt</span><strong>${fmtNum(G.powerRiskProfileChanges || 0, 0)}</strong></div>
      <div class="power-row"><span>Auto-Wechsel gesamt</span><strong>${fmtNum(G.powerRiskAutoSwitches || 0, 0)}</strong></div>
      <div class="power-row"><span>Link-Syncs gesamt</span><strong>${fmtNum(G.powerCommandSyncs || 0, 0)}</strong></div>
      <div class="power-row"><span>Guard-Aktionen gesamt</span><strong>${fmtNum(G.powerLoadGuardActions || 0, 0)}</strong></div>
      <div class="power-row"><span>Akku-Wechsel gesamt</span><strong>${fmtNum(G.powerBatteryStrategyChanges || 0, 0)}</strong></div>
      <div class="power-row"><span>Akku-Savings gesamt</span><strong>$${fmtNum(G._powerBatteryStrategySavingsUsd || 0, 2)}</strong></div>
      <div class="power-row"><span>Tarif-Wechsel gesamt</span><strong>${fmtNum(G.powerTariffPolicyChanges || 0, 0)}</strong></div>
      <div class="power-row"><span>Tarif-Syncs gesamt</span><strong>${fmtNum(G.powerTariffPolicySyncs || 0, 0)}</strong></div>
      <div class="power-row"><span>Beschreibung</span><strong>${(meta && meta.desc) || '—'}</strong></div>`;
  }

  const outageInfo = document.getElementById('power-outage-info');
  const outageActions = document.getElementById('power-outage-actions');
  if (outageInfo && outageActions) {
    const outage = (G.powerOutage && typeof G.powerOutage === 'object') ? G.powerOutage : null;
    if (!outage) {
      outageInfo.innerHTML = `
        <div class="power-row"><span>Status</span><strong>Stabil</strong></div>
        <div class="power-row"><span>Auto-Strategie</span><strong>${String(G.powerOutageAutoPlan || 'balanced')}</strong></div>
        <div class="power-row"><span>Naechster Moeglicher Ausfall</span><strong>${fmtTime(Math.max(0, Number(G.powerOutageCooldown || 0)))}</strong></div>
        <div class="power-row"><span>Aktiver Krisenbuff</span><strong>${Number(G.powerOutageBuffRemaining || 0) > 0 ? fmtTime(G.powerOutageBuffRemaining) : 'Keiner'}</strong></div>
        <div class="power-row"><span>Entscheidungen gesamt</span><strong>${fmtNum(G.outageDecisions || 0, 0)}</strong></div>`;
      outageActions.innerHTML = '';
    } else if (outage.resolved) {
      outageInfo.innerHTML = `
        <div class="power-row"><span>Event</span><strong>${outage.title}</strong></div>
        <div class="power-row"><span>Entscheidung</span><strong>${outage.choiceLabel || 'Auto-Plan'} ${outage.autoResolved ? '(auto)' : ''}</strong></div>
        <div class="power-row"><span>Effekt Restzeit</span><strong>${fmtTime(Math.max(0, Number(G.powerOutageBuffRemaining || 0)))}</strong></div>
        <div class="power-row"><span>Panel schliesst in</span><strong>${fmtTime(Math.max(0, Number(outage.remaining || 0)))}</strong></div>`;
      outageActions.innerHTML = '';
    } else {
      const penalties = outage.penalties || {};
      outageInfo.innerHTML = `
        <div class="power-row"><span>Event</span><strong>${outage.title}</strong></div>
        <div class="power-row"><span>Beschreibung</span><strong>${outage.desc || '-'}</strong></div>
        <div class="power-row"><span>Auto-Strategie</span><strong>${String(G.powerOutageAutoPlan || 'balanced')}</strong></div>
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
