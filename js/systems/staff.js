// ============================================================
// SYSTEM — Staff einstellen
// ============================================================

function hireStaff(id) {
  const s = STAFF.find(x => x.id === id);
  if (!s) return;

  const hired = G.staff[id] || 0;
  const minPrestige = Math.max(0, Number(s.minPrestige || 0));
  if (Number(G.prestigeCount || 0) < minPrestige) {
    notify('🔒 ' + s.name + ' wird ab Prestige ' + minPrestige + ' freigeschaltet.', 'error');
    return;
  }
  if (hired >= s.maxHire) {
    notify('Maximum erreicht! (' + s.maxHire + '/' + s.maxHire + ')', 'error');
    return;
  }

  const cost = getStaffCost(id);
  if (G.usd < cost) {
    notify('Nicht genug USD! Benötigt: $' + fmtNum(cost) + ' 💸', 'error');
    return;
  }

  G.usd      -= cost;
  G.staff[id] = hired + 1;
  computeMultipliers();
  renderStaff();
  notify('👤 ' + s.name + ' eingestellt! (' + (hired + 1) + '/' + s.maxHire + ')', 'success');
}
