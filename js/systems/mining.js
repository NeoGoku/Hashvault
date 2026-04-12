// ============================================================
// SYSTEM — Mining: Klick-Logik, Rig kaufen
// ============================================================

const RIG_SELL_BALANCE = {
  buybackRate: 0.55,
  feeRate: 0.06,
  cooldownMs: 1800,
};

const RIG_REPAIR_BALANCE = {
  autoTriggerPct: 70,
  manualTargetPct: 100,
  maxAutoRepairPerSec: 4.5,
};

const RIG_LEASE_BALANCE = {
  upfrontRate: 0.18,
  buyoutRate: 0.72,
};

const HOLD_MINING_BALANCE = {
  maxHoldSec: 60,
  rearmCooldownSec: 2.5,
  clicksPerSec: 6,
  clickPowerMult: 0.85,
  armMs: 3000,
};
window.HV_HOLD_MINING_BALANCE = HOLD_MINING_BALANCE;

function resetMiningComboChain() {
  G.comboCount = 0;
  G.lastClickTime = 0;
  const btn = document.getElementById('mine-btn');
  if (btn) btn.classList.remove('combo2', 'combo3');
  const cd = document.getElementById('combo-display');
  if (cd) cd.textContent = '';
}
window.resetMiningComboChain = resetMiningComboChain;

function getCurrentClickComboMult() {
  const combo = Math.max(0, Number(G.comboCount || 0));
  return 1 + (combo / 20) * (1 + Number(G._comboBonus || 0));
}
window.getCurrentClickComboMult = getCurrentClickComboMult;

function getCurrentEffectiveClickPower() {
  const base = Math.max(1, Number(getClickPower() || 1));
  return Math.max(1, Math.floor(base * getCurrentClickComboMult()));
}
window.getCurrentEffectiveClickPower = getCurrentEffectiveClickPower;

function updateMiningComboDecay() {
  const now = Date.now();
  const last = Number(G.lastClickTime || 0);
  const isHolding = !!G._holdMiningActive;
  if (isHolding) return;
  if (Number(G.comboCount || 0) <= 0) return;
  if (!last) return;
  if (now - last >= 1200) resetMiningComboChain();
}
window.updateMiningComboDecay = updateMiningComboDecay;

function ensureHoldMiningState() {
  if (typeof G._holdMiningActive !== 'boolean') G._holdMiningActive = false;
  if (!Number.isFinite(G._holdMiningElapsed) || G._holdMiningElapsed < 0) G._holdMiningElapsed = 0;
  if (!Number.isFinite(G._holdMiningCooldown) || G._holdMiningCooldown < 0) G._holdMiningCooldown = 0;
  if (!Number.isFinite(G._holdMiningAccum) || G._holdMiningAccum < 0) G._holdMiningAccum = 0;
  if (!Number.isFinite(G._holdMiningSuppressTapUntil) || G._holdMiningSuppressTapUntil < 0) G._holdMiningSuppressTapUntil = 0;
  if (typeof G._holdMiningPointerId !== 'number') G._holdMiningPointerId = null;
}
window.ensureHoldMiningState = ensureHoldMiningState;

function isHoldMiningTapSuppressed() {
  ensureHoldMiningState();
  return Date.now() < Number(G._holdMiningSuppressTapUntil || 0);
}
window.isHoldMiningTapSuppressed = isHoldMiningTapSuppressed;

function startHoldMining(pointerId) {
  ensureHoldMiningState();
  if (G._opsShutdown) return false;
  if (G._holdMiningCooldown > 0) return false;
  G._holdMiningActive = true;
  G._holdMiningElapsed = 0;
  G._holdMiningAccum = 0;
  G._holdMiningPointerId = Number.isFinite(pointerId) ? Number(pointerId) : null;
  return true;
}
window.startHoldMining = startHoldMining;

function stopHoldMining(pointerId) {
  ensureHoldMiningState();
  if (!G._holdMiningActive) return;
  if (Number.isFinite(G._holdMiningPointerId) && Number.isFinite(pointerId) && Number(pointerId) !== Number(G._holdMiningPointerId)) return;
  G._holdMiningActive = false;
  G._holdMiningPointerId = null;
  if (Number(G._holdMiningElapsed || 0) >= Number(HOLD_MINING_BALANCE.maxHoldSec || 60)) {
    G._holdMiningCooldown = Math.max(Number(G._holdMiningCooldown || 0), Number(HOLD_MINING_BALANCE.rearmCooldownSec || 2.5));
  }
  resetMiningComboChain();
  G._holdMiningElapsed = 0;
  G._holdMiningAccum = 0;
  G._holdMiningSuppressTapUntil = Date.now() + 220;
}
window.stopHoldMining = stopHoldMining;

function getHoldMiningStatusText() {
  ensureHoldMiningState();
  if (G._holdMiningActive) {
    const left = Math.max(0, Number(HOLD_MINING_BALANCE.maxHoldSec || 60) - Number(G._holdMiningElapsed || 0));
    return 'Hold ' + fmtNum(left, 1) + 's';
  }
  if (Number(G._holdMiningCooldown || 0) > 0) {
    return 'Hold CD ' + fmtNum(G._holdMiningCooldown, 1) + 's';
  }
  return 'Hold bereit';
}
window.getHoldMiningStatusText = getHoldMiningStatusText;

function applyMineClick(powerMult, eventObj, silentShutdown) {
  if (G._opsShutdown) {
    if (!silentShutdown) {
      const nowWarn = Date.now();
      const lastWarn = Number(G._lastOpsShutdownWarnAt || 0);
      if (nowWarn - lastWarn > 4000) {
        G._lastOpsShutdownWarnAt = nowWarn;
        notify('⛔ Betrieb abgeschaltet. Erst Schulden tilgen oder Insolvenz abwarten.', 'error');
      }
    }
    return false;
  }

  const now = Date.now();
  const timeDiff = now - G.lastClickTime;
  if (timeDiff < 1200) {
    G.comboCount = Math.min(G.comboCount + 1, 100);
  } else {
    G.comboCount = 1;
  }
  G.lastClickTime = now;
  if (G.comboCount > G.maxCombo) G.maxCombo = G.comboCount;

  const comboMult = getCurrentClickComboMult();
  const pMult = Math.max(0.1, Number(powerMult || 1));
  const power = Math.max(1, Math.floor(getClickPower() * comboMult * pMult));
  G.hashes += power;
  G.totalHashes += power;
  G.totalClicks += 1;

  const btn = document.getElementById('mine-btn');
  if (btn) {
    btn.classList.remove('combo2', 'combo3');
    if (G.comboCount >= 20) btn.classList.add('combo3');
    else if (G.comboCount >= 8) btn.classList.add('combo2');
  }

  const cd = document.getElementById('combo-display');
  if (cd) {
    if (G.comboCount >= 3) {
      cd.textContent = 'COMBO ×' + G.comboCount + ' (+' + Math.round((comboMult - 1) * 100) + '%)';
    } else {
      cd.textContent = '';
    }
  }

  if (eventObj && Number.isFinite(eventObj.clientX) && Number.isFinite(eventObj.clientY)) {
    floatText(eventObj.clientX, eventObj.clientY, '+' + fmtNum(power) + ' H');
  }
  return true;
}

function updateHoldMining(dt) {
  ensureHoldMiningState();
  const safeDt = Math.max(0, Number(dt || 0));
  if (safeDt <= 0) return;

  G._holdMiningCooldown = Math.max(0, Number(G._holdMiningCooldown || 0) - safeDt);
  if (!G._holdMiningActive || G._opsShutdown) return;

  G._holdMiningElapsed += safeDt;
  if (G._holdMiningElapsed >= Number(HOLD_MINING_BALANCE.maxHoldSec || 60)) {
    G._holdMiningElapsed = Number(HOLD_MINING_BALANCE.maxHoldSec || 60);
    G._holdMiningActive = false;
    G._holdMiningPointerId = null;
    G._holdMiningCooldown = Math.max(Number(G._holdMiningCooldown || 0), Number(HOLD_MINING_BALANCE.rearmCooldownSec || 2.5));
    resetMiningComboChain();
    G._holdMiningElapsed = 0;
    G._holdMiningAccum = 0;
    G._holdMiningSuppressTapUntil = Date.now() + 220;
    notify('⏱️ Hold-Mining pausiert. Kurz loslassen und nach Cooldown wieder halten.', 'warning');
    return;
  }

  const cps = Math.max(0.5, Number(HOLD_MINING_BALANCE.clicksPerSec || 6));
  G._holdMiningAccum += safeDt * cps;
  while (G._holdMiningAccum >= 1) {
    G._holdMiningAccum -= 1;
    const ok = applyMineClick(Number(HOLD_MINING_BALANCE.clickPowerMult || 0.85), null, true);
    if (!ok) break;
  }
}
window.updateHoldMining = updateHoldMining;

function doClick(e, options) {
  const opts = options || {};
  if (!opts.fromHold && typeof isHoldMiningTapSuppressed === 'function' && isHoldMiningTapSuppressed()) return;
  applyMineClick(1, e, false);
}

function buyRig(rigId, qty, options) {
  const opts = options || {};
  const silent = !!opts.silent;
  const r = RIGS.find(x => x.id === rigId);
  if (!r) return 0;

  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const cap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const free = Math.max(0, cap - totalRigs);
  if (free <= 0) {
    if (!silent) notify('🏢 Standort voll! Erst umziehen, dann mehr Rigs kaufen.', 'error');
    return 0;
  }
  const buyQty = Math.min(Math.max(1, qty), free);
  if (buyQty < qty) {
    if (!silent) notify('ℹ️ Standortlimit erreicht, nur ×' + buyQty + ' gekauft.', 'warning');
  }
  const powerLimit = (typeof getMaxRigBuyByPower === 'function') ? getMaxRigBuyByPower(rigId) : Infinity;
  if (powerLimit <= 0) {
    if (!silent) notify('⚡ Kein freier Strom mehr! Erst Netzkapazitaet ausbauen oder Rigs verkaufen.', 'error');
    return 0;
  }
  const finalQty = Math.min(buyQty, Math.max(0, Math.floor(powerLimit)));
  if (finalQty < buyQty) {
    if (!silent) notify('⚡ Stromlimit erreicht, nur ×' + finalQty + ' kaufbar.', 'warning');
  }

  if (totalRigs < r.unlock) {
    if (!silent) notify('🔒 Noch nicht freigeschaltet! (Benötigt ' + r.unlock + ' Rigs gesamt)', 'error');
    return 0;
  }
  if (finalQty <= 0) {
    if (!silent) notify('⚡ Kein Rig kaufbar wegen Stromlimit.', 'error');
    return 0;
  }
  const cost = getRigCost(rigId, finalQty);
  if (G.usd < cost) {
    if (!silent) notify('Nicht genug USD! Benötigt: $' + fmtNum(cost) + ' 💸', 'error');
    return 0;
  }
  G.usd        -= cost;
  G.rigs[rigId] = (G.rigs[rigId] || 0) + finalQty;
  G.totalRigs  += finalQty;
  computeMultipliers();
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  if (!silent) notify('✅ ' + r.name + ' ×' + finalQty + ' gekauft!');
  return finalQty;
}

function buyMax(rigId) {
  const n = getMaxBuyable(rigId);
  if (n <= 0) {
    notify('Nicht genug USD! 💸', 'error');
    return 0;
  }
  return buyRig(rigId, n);
}

function buyRigUntilCap(rigId) {
  const rig = (RIGS || []).find((x) => x.id === rigId);
  if (!rig) return 0;
  const totalOwned = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  if (totalOwned < Number(rig.unlock || 0)) {
    notify('🔒 ' + rig.name + ' erst ab ' + rig.unlock + ' Gesamt-Rigs.', 'warning');
    return 0;
  }
  const cap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const capLeft = Math.max(0, cap - totalOwned);
  const powerLeft = (typeof getMaxRigBuyByPower === 'function') ? getMaxRigBuyByPower(rigId) : Infinity;
  const hardTarget = Math.max(0, Math.floor(Math.min(capLeft, powerLeft)));
  const affordable = Math.max(0, Number(getMaxBuyable(rigId) || 0));
  const qty = Math.min(hardTarget, affordable);

  if (hardTarget <= 0) {
    notify('⚡ Kein Platz durch Standort- oder Stromlimit.', 'warning');
    return 0;
  }
  if (qty <= 0) {
    notify('💸 Fuer Cap-Fill reicht das Budget aktuell nicht.', 'warning');
    return 0;
  }

  const bought = buyRig(rigId, qty, { silent: true });
  if (bought > 0) {
    const reason = bought >= hardTarget
      ? 'Cap erreicht'
      : (affordable < hardTarget ? 'durch Budget begrenzt' : 'Limit erreicht');
    notify('📦 Cap-Fill: ' + rig.name + ' ×' + bought + ' gekauft (' + reason + ').', 'success');
  }
  return bought;
}

function getRigSellValue(rigId, qty = 1) {
  const r = RIGS.find((x) => x.id === rigId);
  if (!r) return 0;
  const owned = Math.max(0, Number((G.rigs || {})[rigId] || 0));
  const leased = Math.max(0, Number((G.leasedRigs || {})[rigId] || 0));
  const sellable = Math.max(0, owned - leased);
  const sellQty = Math.max(0, Math.min(sellable, Math.floor(Number(qty || 0))));
  if (sellQty <= 0) return 0;

  let refund = 0;
  for (let i = 0; i < sellQty; i++) {
    const level = Math.max(0, owned - 1 - i);
    const unitCost = r.baseCost * Math.pow(RIG_SCALE, level) * Math.max(0.05, Number(G._rigCostMult || 1));
    refund += unitCost * RIG_SELL_BALANCE.buybackRate;
  }
  refund *= (1 - RIG_SELL_BALANCE.feeRate);
  return Math.max(0, Math.floor(refund));
}

function getRigSellCooldownRemaining(rigId) {
  const map = (G && G._rigSellCooldown && typeof G._rigSellCooldown === 'object')
    ? G._rigSellCooldown
    : {};
  const until = Number(map[rigId] || 0);
  return Math.max(0, (until - Date.now()) / 1000);
}

function sellRig(rigId, qty = 1) {
  const r = RIGS.find((x) => x.id === rigId);
  if (!r) return;

  const owned = Math.max(0, Number((G.rigs || {})[rigId] || 0));
  const leased = Math.max(0, Number((G.leasedRigs || {})[rigId] || 0));
  const sellable = Math.max(0, owned - leased);
  if (owned <= 0) {
    notify('❌ Keine ' + r.name + '-Rigs zum Verkaufen.', 'error');
    return;
  }
  if (sellable <= 0) {
    notify('❌ Alle ' + r.name + '-Rigs sind geleast und nicht direkt verkaufbar.', 'error');
    return;
  }
  if (!G._rigSellCooldown || typeof G._rigSellCooldown !== 'object') G._rigSellCooldown = {};
  const cdLeft = getRigSellCooldownRemaining(rigId);
  if (cdLeft > 0) {
    notify('⏳ Verkaufscooldown: noch ' + fmtNum(cdLeft, 1) + 's', 'warning');
    return;
  }

  const sellQty = Math.max(1, Math.min(sellable, Math.floor(Number(qty || 1))));
  const refund = getRigSellValue(rigId, sellQty);
  if (refund <= 0) return;

  G.rigs[rigId] = Math.max(0, owned - sellQty);
  G.totalRigs = Math.max(0, Number(G.totalRigs || 0) - sellQty);
  G.usd += refund;

  // Wenn ein Rig-Typ komplett verkauft wurde, dessen Crew-Zuweisung loeschen.
  if (G.rigs[rigId] <= 0 && G.rigStaffAssignments && typeof G.rigStaffAssignments === 'object') {
    G.rigStaffAssignments[rigId] = {};
  }
  G._rigSellCooldown[rigId] = Date.now() + RIG_SELL_BALANCE.cooldownMs;

  computeMultipliers();
  renderRigs();
  if (typeof renderRigCrew === 'function') renderRigCrew();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  notify('💸 ' + r.name + ' ×' + sellQty + ' verkauft (+$' + fmtNum(refund) + ')', 'warning');
}

function getRigRepairCost(rigId, targetPct = RIG_REPAIR_BALANCE.manualTargetPct) {
  const rig = RIGS.find((x) => x.id === rigId);
  if (!rig) return 0;
  const owned = Math.max(0, Number((G.rigs || {})[rigId] || 0));
  if (owned <= 0) return 0;
  const current = Math.max(0, Math.min(100, Number(((G.rigEnergy || {})[rigId]) ?? 100)));
  const target = Math.max(current, Math.min(100, Number(targetPct || 100)));
  const missing = Math.max(0, target - current);
  const perPct = Math.max(0.02, Number(rig.baseCost || 0) * 0.00022 * (1 + owned * 0.015));
  return Math.ceil(missing * perPct);
}

function getRigRepairLtcCost(rigId, targetPct = RIG_REPAIR_BALANCE.manualTargetPct) {
  const usdCost = getRigRepairCost(rigId, targetPct);
  if (usdCost <= 0) return 0;
  if (typeof window.getRepairLtcCostByUsd === 'function') {
    return getRepairLtcCostByUsd(usdCost);
  }
  return 0;
}

function repairRig(rigId) {
  const rig = RIGS.find((x) => x.id === rigId);
  if (!rig) return;
  const usdCost = getRigRepairCost(rigId, RIG_REPAIR_BALANCE.manualTargetPct);
  const ltcCost = getRigRepairLtcCost(rigId, RIG_REPAIR_BALANCE.manualTargetPct);
  if (usdCost <= 0) {
    notify('✅ ' + rig.name + ' ist bereits voll gewartet.', 'success');
    return;
  }
  if (Number(G.usd || 0) < usdCost) {
    notify('❌ Nicht genug USD fuer Reparatur! ($' + fmtNum(usdCost) + ')', 'error');
    return;
  }
  if (Number((G.coins || {}).LTC || 0) + 1e-9 < ltcCost) {
    notify('❌ Nicht genug LTC fuer Reparatur! (Ł' + fmtNum(ltcCost, 4) + ')', 'error');
    return;
  }
  G.usd -= usdCost;
  if (ltcCost > 0) {
    if (typeof window.spendCoin === 'function') {
      const spent = spendCoin('LTC', ltcCost);
      if (!spent) {
        G.usd += usdCost;
        notify('❌ LTC-Abbuchung fehlgeschlagen.', 'error');
        return;
      }
    } else {
      G.coins.LTC = Math.max(0, Number((G.coins || {}).LTC || 0) - ltcCost);
    }
  }
  if (!G.rigEnergy || typeof G.rigEnergy !== 'object') G.rigEnergy = {};
  G.rigEnergy[rigId] = RIG_REPAIR_BALANCE.manualTargetPct;
  notify('🛠️ ' + rig.name + ' voll repariert (-$' + fmtNum(usdCost) + ', -Ł' + fmtNum(ltcCost, 4) + ').', 'success');
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function toggleRigAutoRepair(rigId, forcedState) {
  if (!G.rigAutoRepair || typeof G.rigAutoRepair !== 'object') G.rigAutoRepair = {};
  const next = typeof forcedState === 'boolean' ? forcedState : !G.rigAutoRepair[rigId];
  G.rigAutoRepair[rigId] = next;
  const rig = (RIGS || []).find((x) => x.id === rigId);
  notify('🔧 Auto-Reparatur ' + (next ? 'aktiviert' : 'deaktiviert') + (rig ? (': ' + rig.name) : ''), next ? 'success' : 'warning');
  renderRigs();
}

function repairAllRigs() {
  let repaired = 0;
  let usdSpent = 0;
  let ltcSpent = 0;
  (RIGS || []).forEach((rig) => {
    const owned = Math.max(0, Number((G.rigs || {})[rig.id] || 0));
    if (owned <= 0) return;
    const usdCost = getRigRepairCost(rig.id, RIG_REPAIR_BALANCE.manualTargetPct);
    const ltcCost = getRigRepairLtcCost(rig.id, RIG_REPAIR_BALANCE.manualTargetPct);
    if (usdCost > 0 && Number(G.usd || 0) >= usdCost && Number((G.coins || {}).LTC || 0) + 1e-9 >= ltcCost) {
      G.usd -= usdCost;
      if (ltcCost > 0) {
        if (typeof window.spendCoin === 'function') {
          const spent = spendCoin('LTC', ltcCost);
          if (!spent) {
            G.usd += usdCost;
            return;
          }
        } else {
          G.coins.LTC = Math.max(0, Number((G.coins || {}).LTC || 0) - ltcCost);
        }
      }
      if (!G.rigEnergy || typeof G.rigEnergy !== 'object') G.rigEnergy = {};
      G.rigEnergy[rig.id] = RIG_REPAIR_BALANCE.manualTargetPct;
      repaired++;
      usdSpent += usdCost;
      ltcSpent += ltcCost;
    }
  });
  notify(
    repaired > 0
      ? ('🛠️ ' + repaired + ' Rig-Typen repariert (-$' + fmtNum(usdSpent) + ', -Ł' + fmtNum(ltcSpent, 4) + ').')
      : 'ℹ️ Nicht genug USD/LTC fuer Sammelreparatur.',
    repaired > 0 ? 'success' : 'warning'
  );
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
}

function setAutoRepairForAll(enabled) {
  if (!G.rigAutoRepair || typeof G.rigAutoRepair !== 'object') G.rigAutoRepair = {};
  (RIGS || []).forEach((rig) => { G.rigAutoRepair[rig.id] = !!enabled; });
  notify('🔧 Auto-Reparatur fuer alle Rigs: ' + (enabled ? 'AN' : 'AUS'), enabled ? 'success' : 'warning');
  renderRigs();
}

function leaseRig(rigId, qty = 1) {
  const r = RIGS.find((x) => x.id === rigId);
  if (!r) return;
  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const cap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const free = Math.max(0, cap - totalRigs);
  const leaseQty = Math.max(1, Math.min(free, Math.floor(Number(qty || 1))));
  if (leaseQty <= 0) {
    notify('🏢 Standort voll! Kein Platz fuer Leasing-Rigs.', 'error');
    return;
  }
  if (totalRigs < r.unlock) {
    notify('🔒 Noch nicht freigeschaltet! (Benötigt ' + r.unlock + ' Rigs gesamt)', 'error');
    return;
  }
  const nominal = getRigCost(rigId, leaseQty);
  const upfront = Math.ceil(nominal * RIG_LEASE_BALANCE.upfrontRate);
  if (Number(G.usd || 0) < upfront) {
    notify('❌ Nicht genug USD fuer Leasing-Anzahlung! ($' + fmtNum(upfront) + ')', 'error');
    return;
  }
  G.usd -= upfront;
  G.rigs[rigId] = Math.max(0, Number((G.rigs || {})[rigId] || 0)) + leaseQty;
  G.totalRigs = Math.max(0, Number(G.totalRigs || 0)) + leaseQty;
  if (!G.leasedRigs || typeof G.leasedRigs !== 'object') G.leasedRigs = {};
  G.leasedRigs[rigId] = Math.max(0, Number(G.leasedRigs[rigId] || 0)) + leaseQty;
  notify('📄 ' + r.name + ' ×' + leaseQty + ' geleast (Anzahlung $' + fmtNum(upfront) + ').', 'gold');
  computeMultipliers();
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}

function buyoutLeasedRig(rigId, qty = 1) {
  const rig = (RIGS || []).find((x) => x.id === rigId);
  if (!rig) return;
  const leased = Math.max(0, Number(((G.leasedRigs || {})[rigId]) || 0));
  if (leased <= 0) {
    notify('ℹ️ Keine geleasten ' + rig.name + '-Rigs.', 'warning');
    return;
  }
  const take = Math.max(1, Math.min(leased, Math.floor(Number(qty || 1))));
  const nominal = getRigCost(rigId, take);
  const buyout = Math.ceil(nominal * RIG_LEASE_BALANCE.buyoutRate);
  if (Number(G.usd || 0) < buyout) {
    notify('❌ Nicht genug USD fuer Leasing-Uebernahme! ($' + fmtNum(buyout) + ')', 'error');
    return;
  }
  G.usd -= buyout;
  G.leasedRigs[rigId] = leased - take;
  notify('✅ Leasing-Uebernahme: ' + rig.name + ' ×' + take + ' ($' + fmtNum(buyout) + ')', 'success');
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
}
