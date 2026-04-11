// ============================================================
// SYSTEM — Upgrades kaufen
// ============================================================

function buyUpgrade(id) {
  if (G.upgrades.includes(id)) return;
  const u = UPGRADES.find(x => x.id === id);
  if (!u) return;
  const cost = (typeof window.getEffectiveUpgradeCost === 'function')
    ? getEffectiveUpgradeCost(id)
    : Number(u.cost || 0);

  if (u.req && !G.upgrades.includes(u.req)) {
    notify('🔒 Voraussetzung nicht erfüllt!', 'error');
    return;
  }
  const minPrestige = Math.max(0, Number(u.minPrestige || 0));
  if (Number(G.prestigeCount || 0) < minPrestige) {
    notify('🔒 Benötigt Prestige ' + minPrestige + '.', 'error');
    return;
  }
  if (G.usd < cost) {
    notify('Nicht genug USD! Benötigt: $' + fmtNum(cost) + ' 💸', 'error');
    return;
  }

  G.usd -= cost;
  G.upgrades.push(id);
  computeMultipliers();
  renderUpgrades(_currentFilter || 'all');
  notify('🔧 ' + u.name + ' gekauft fuer $' + fmtNum(cost) + '!', 'success');
}
