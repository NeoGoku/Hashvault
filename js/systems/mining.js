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

function doClick(e) {
  if (G._opsShutdown) {
    const nowWarn = Date.now();
    const lastWarn = Number(G._lastOpsShutdownWarnAt || 0);
    if (nowWarn - lastWarn > 4000) {
      G._lastOpsShutdownWarnAt = nowWarn;
      notify('⛔ Betrieb abgeschaltet. Erst Schulden tilgen oder Insolvenz abwarten.', 'error');
    }
    return;
  }

  const now      = Date.now();
  const timeDiff = now - G.lastClickTime;

  // Combo-Tracking
  if (timeDiff < 1200) {
    G.comboCount = Math.min(G.comboCount + 1, 100);
  } else {
    G.comboCount = 1;
  }
  G.lastClickTime = now;
  if (G.comboCount > G.maxCombo) G.maxCombo = G.comboCount;

  // Hash-Berechnung mit Combo-Multiplikator
  const comboMult = 1 + (G.comboCount / 20) * (1 + G._comboBonus);
  const power     = Math.max(1, Math.floor(getClickPower() * comboMult));
  G.hashes      += power;
  G.totalHashes += power;
  G.totalClicks++;

  // Button-Glow
  const btn = document.getElementById('mine-btn');
  btn.classList.remove('combo2', 'combo3');
  if      (G.comboCount >= 20) btn.classList.add('combo3');
  else if (G.comboCount >= 8)  btn.classList.add('combo2');

  // Combo-Display
  const cd = document.getElementById('combo-display');
  if (G.comboCount >= 3) {
    cd.textContent = 'COMBO ×' + G.comboCount + ' (+' + Math.round((comboMult - 1) * 100) + '%)';
  } else {
    cd.textContent = '';
  }

  // Float-Text
  if (e) floatText(e.clientX, e.clientY, '+' + fmtNum(power) + ' H');
}

function buyRig(rigId, qty) {
  const r = RIGS.find(x => x.id === rigId);
  if (!r) return;

  const totalRigs = (typeof getTotalRigCount === 'function')
    ? getTotalRigCount()
    : Object.values(G.rigs || {}).reduce((sum, val) => sum + Number(val || 0), 0);
  const cap = (typeof getCurrentLocationRigCap === 'function') ? getCurrentLocationRigCap() : Infinity;
  const free = Math.max(0, cap - totalRigs);
  if (free <= 0) {
    notify('🏢 Standort voll! Erst umziehen, dann mehr Rigs kaufen.', 'error');
    return;
  }
  const buyQty = Math.min(Math.max(1, qty), free);
  if (buyQty < qty) {
    notify('ℹ️ Standortlimit erreicht, nur ×' + buyQty + ' gekauft.', 'warning');
  }
  const powerLimit = (typeof getMaxRigBuyByPower === 'function') ? getMaxRigBuyByPower(rigId) : Infinity;
  if (powerLimit <= 0) {
    notify('⚡ Kein freier Strom mehr! Erst Netzkapazitaet ausbauen oder Rigs verkaufen.', 'error');
    return;
  }
  const finalQty = Math.min(buyQty, Math.max(0, Math.floor(powerLimit)));
  if (finalQty < buyQty) {
    notify('⚡ Stromlimit erreicht, nur ×' + finalQty + ' kaufbar.', 'warning');
  }

  if (totalRigs < r.unlock) {
    notify('🔒 Noch nicht freigeschaltet! (Benötigt ' + r.unlock + ' Rigs gesamt)', 'error');
    return;
  }
  if (finalQty <= 0) {
    notify('⚡ Kein Rig kaufbar wegen Stromlimit.', 'error');
    return;
  }
  const cost = getRigCost(rigId, finalQty);
  if (G.usd < cost) {
    notify('Nicht genug USD! Benötigt: $' + fmtNum(cost) + ' 💸', 'error');
    return;
  }
  G.usd        -= cost;
  G.rigs[rigId] = (G.rigs[rigId] || 0) + finalQty;
  G.totalRigs  += finalQty;
  computeMultipliers();
  renderRigs();
  if (typeof updateMineUI === 'function') updateMineUI();
  if (typeof renderPowerPanel === 'function') renderPowerPanel();
  notify('✅ ' + r.name + ' ×' + finalQty + ' gekauft!');
}

function buyMax(rigId) {
  const n = getMaxBuyable(rigId);
  if (n <= 0) {
    notify('Nicht genug USD! 💸', 'error');
    return;
  }
  buyRig(rigId, n);
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
