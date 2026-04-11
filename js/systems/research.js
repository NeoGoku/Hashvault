// ============================================================
// SYSTEM — Research starten
// Unterstützt Slot 2 wenn cu5 (Forschungs-Labor) freigeschaltet ist
// ============================================================

function startResearch(id) {
  if (G.research.includes(id)) return;

  const r = RESEARCH.find(x => x.id === id);
  if (!r) return;
  const cost = (typeof window.getEffectiveResearchCost === 'function')
    ? getEffectiveResearchCost(id)
    : Number(r.cost || 0);
  const ethCost = (typeof window.getResearchEthCostByUsd === 'function')
    ? getResearchEthCostByUsd(cost)
    : 0;

  // Voraussetzungen
  if (r.req.some(req => !G.research.includes(req))) {
    notify('🔒 Voraussetzungen nicht erfüllt!', 'error');
    return;
  }
  const minPrestige = Math.max(0, Number(r.minPrestige || 0));
  if (Number(G.prestigeCount || 0) < minPrestige) {
    notify('🔒 Forschung erfordert Prestige ' + minPrestige + '.', 'error');
    return;
  }

  // Ist bereits in einem Slot aktiv?
  if (G.activeResearch === id || G.activeResearch2 === id) {
    notify('Wird bereits erforscht!', 'error');
    return;
  }

  // Prüfen ob ein Slot frei ist
  const slot1Free = !G.activeResearch;
  const slot2Free = !G.activeResearch2;
  const hasParallel = G.chipShop['cu5'];

  if (!slot1Free && !(hasParallel && slot2Free)) {
    if (hasParallel) {
      notify('Beide Forschungsslots sind belegt!', 'error');
    } else {
      notify('Bereits in Forschung! Warte bis sie abgeschlossen ist.', 'error');
    }
    return;
  }

  // Kosten prüfen
  if (G.usd < cost) {
    notify('Nicht genug USD! Benötigt: $' + fmtNum(cost) + ' 💸', 'error');
    return;
  }
  if (Number((G.coins || {}).ETH || 0) + 1e-9 < ethCost) {
    notify('Nicht genug ETH! Benötigt: Ξ' + fmtNum(ethCost, 4), 'error');
    return;
  }

  G.usd -= cost;
  if (ethCost > 0) {
    if (typeof window.spendCoin === 'function') {
      const spent = spendCoin('ETH', ethCost);
      if (!spent) {
        G.usd += cost;
        notify('ETH-Abbuchung fehlgeschlagen.', 'error');
        return;
      }
    } else {
      G.coins.ETH = Math.max(0, Number((G.coins || {}).ETH || 0) - ethCost);
    }
  }

  if (slot1Free) {
    G.activeResearch   = id;
    G.researchProgress = 0;
    notify('🔬 Forschung gestartet (Slot 1): ' + r.name + ' ($' + fmtNum(cost) + ' + Ξ' + fmtNum(ethCost, 4) + ')');
  } else {
    G.activeResearch2   = id;
    G.researchProgress2 = 0;
    notify('🔬 Forschung gestartet (Slot 2): ' + r.name + ' ($' + fmtNum(cost) + ' + Ξ' + fmtNum(ethCost, 4) + ')');
  }

  renderResearch();
}
