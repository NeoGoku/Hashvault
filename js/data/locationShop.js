// ============================================================
// DATA — Standort-Shop V2 (Items pro Standort + Crew-Effekte)
// ============================================================

window.LOCATION_SHOP_SLOT_CAP_BY_TIER = {
  1: 5,
  2: 6,
  3: 8,
  4: 10,
  5: 12,
  6: 14,
  7: 16,
  8: 18,
  9: 20,
};

window.LOCATION_SHOP_CATEGORIES = {
  efficiency: { label: 'Effizienz', icon: '⚙️' },
  safety: { label: 'Sicherheit', icon: '🛡️' },
  comfort: { label: 'Komfort', icon: '🪴' },
  power: { label: 'Energie', icon: '⚡' },
};

window.LOCATION_SHOP_ITEMS = [
  { id: 'desk_plant', name: 'Desk Plant', cat: 'comfort', minTier: 1, cost: 140, desc: 'Besseres Raumklima fuer die Crew.', effect: { staffEffMult: 1.02 } },
  { id: 'task_lamps', name: 'Task Lamps', cat: 'comfort', minTier: 1, cost: 220, desc: 'Weniger Fehler bei langer Schicht.', effect: { crewXpMult: 1.03, crashRiskMult: 0.99 } },
  { id: 'cable_management', name: 'Cable Management', cat: 'safety', minTier: 1, cost: 280, desc: 'Saubere Leitungen reduzieren Ausfaelle.', effect: { crashRiskMult: 0.985 } },
  { id: 'ergonomic_chairs', name: 'Ergonomic Chairs', cat: 'comfort', minTier: 2, cost: 420, desc: 'Hoher Komfort fuer Wartungsteams.', effect: { staffEffMult: 1.03, staffWageMult: 0.99 } },
  { id: 'anti_static_floor', name: 'Anti-Static Floor', cat: 'safety', minTier: 2, cost: 560, desc: 'Schuetzt Hardware und Crew.', effect: { crashRiskMult: 0.975 } },
  { id: 'airflow_panels', name: 'Airflow Panels', cat: 'power', minTier: 2, cost: 720, desc: 'Gefuehrter Luftstrom senkt Lastspitzen.', effect: { powerUsageMult: 0.985, crashRiskMult: 0.99 } },
  { id: 'service_cart', name: 'Service Cart', cat: 'efficiency', minTier: 3, cost: 960, desc: 'Schnelleres Werkzeug-Handling.', effect: { staffEffMult: 1.05, crewXpMult: 1.02 } },
  { id: 'monitor_wall', name: 'Monitor Wall', cat: 'efficiency', minTier: 3, cost: 1350, desc: 'Besseres Live-Monitoring der Miner.', effect: { hpsMult: 1.03 } },
  { id: 'parts_lockers', name: 'Parts Lockers', cat: 'efficiency', minTier: 3, cost: 1280, desc: 'Ersatzteile liegen direkt an der Wartungsroute.', effect: { staffEffMult: 1.04, crewXpMult: 1.03 } },
  { id: 'quiet_fans', name: 'Quiet Fans', cat: 'power', minTier: 4, cost: 1850, desc: 'Kuehlung mit weniger Lastspitzen.', effect: { powerUsageMult: 0.97, crashRiskMult: 0.98 } },
  { id: 'workshop_bench', name: 'Workshop Bench', cat: 'efficiency', minTier: 4, cost: 2300, desc: 'Wartung direkt vor Ort.', effect: { staffEffMult: 1.06 } },
  { id: 'sensor_tags', name: 'Sensor Tags', cat: 'safety', minTier: 4, cost: 2140, desc: 'Temperatur und Vibrationen werden frueh sichtbar.', effect: { crashRiskMult: 0.97, staffEffMult: 1.02 } },
  { id: 'shift_planner', name: 'Shift Planner', cat: 'comfort', minTier: 4, cost: 2520, desc: 'Ruhigere Schichtwechsel und weniger Leerlauf.', effect: { crewXpMult: 1.04, staffWageMult: 0.985 } },
  { id: 'break_room', name: 'Break Room', cat: 'comfort', minTier: 5, cost: 3400, desc: 'Bessere Moral senkt Fluktuation.', effect: { crewXpMult: 1.07, staffWageMult: 0.97 } },
  { id: 'training_corner', name: 'Training Corner', cat: 'efficiency', minTier: 5, cost: 3900, desc: 'Crew lernt schneller neue Ablaufe.', effect: { crewXpMult: 1.09 } },
  { id: 'thermal_cam_net', name: 'Thermal Cam Net', cat: 'safety', minTier: 5, cost: 4300, desc: 'Erkennt Hitzespots fruehzeitig.', effect: { crashRiskMult: 0.96 } },
  { id: 'coolant_loop', name: 'Coolant Loop', cat: 'power', minTier: 5, cost: 4020, desc: 'Stabilere Temperaturen bei hohem Durchsatz.', effect: { hpsMult: 1.03, powerUsageMult: 0.95 } },
  { id: 'diagnostic_bay', name: 'Diagnostic Bay', cat: 'efficiency', minTier: 6, cost: 5600, desc: 'Frueherkennung von Defekten.', effect: { staffEffMult: 1.08, crashRiskMult: 0.95 } },
  { id: 'ups_cluster', name: 'UPS Cluster', cat: 'power', minTier: 6, cost: 6200, desc: 'Puffert Lastspitzen am Standort.', effect: { powerUsageMult: 0.96 } },
  { id: 'quality_lab', name: 'Quality Lab', cat: 'safety', minTier: 6, cost: 6800, desc: 'Regelmaessige Checks stabilisieren die Farm.', effect: { staffEffMult: 1.06, crashRiskMult: 0.96 } },
  { id: 'smart_lighting', name: 'Smart Lighting', cat: 'power', minTier: 7, cost: 7600, desc: 'Adaptive Lichtsteuerung fuer Produktivitaet.', effect: { hpsMult: 1.05, powerUsageMult: 0.96 } },
  { id: 'security_corridor', name: 'Security Corridor', cat: 'safety', minTier: 7, cost: 8400, desc: 'Kontrollierter Zugang zu sensiblen Racks.', effect: { crashRiskMult: 0.94 } },
  { id: 'logistics_rack', name: 'Logistics Rack', cat: 'efficiency', minTier: 7, cost: 8900, desc: 'Schneller Teilefluss zwischen den Rig-Reihen.', effect: { hpsMult: 1.04, staffEffMult: 1.05 } },
  { id: 'operator_suite', name: 'Operator Suite', cat: 'comfort', minTier: 7, cost: 9600, desc: 'Bessere Uebergaben zwischen den Schichten.', effect: { crewXpMult: 1.07, staffWageMult: 0.97 } },
  { id: 'ops_dashboard', name: 'Ops Dashboard', cat: 'efficiency', minTier: 8, cost: 9800, desc: 'Zentrale Steuerung fuer Teams und Rigs.', effect: { staffEffMult: 1.10, hpsMult: 1.04 } },
  { id: 'night_shift_lounge', name: 'Night Shift Lounge', cat: 'comfort', minTier: 8, cost: 10400, desc: 'Konstantere Leistung in spaeten Schichten.', effect: { crewXpMult: 1.08, staffWageMult: 0.96 } },
  { id: 'grid_optimizer', name: 'Grid Optimizer', cat: 'power', minTier: 8, cost: 11500, desc: 'Intelligente Verteilung der Lasten.', effect: { powerUsageMult: 0.94, hpsMult: 1.03 } },
  { id: 'thermal_baffles', name: 'Thermal Baffles', cat: 'safety', minTier: 8, cost: 12300, desc: 'Lenkt Hitze weg von kritischen Clustern.', effect: { powerUsageMult: 0.95, crashRiskMult: 0.95 } },
  { id: 'ai_maintenance_hub', name: 'AI Maintenance Hub', cat: 'efficiency', minTier: 9, cost: 15000, desc: 'Automatisierte Wartungsplanung.', effect: { staffEffMult: 1.12, crewXpMult: 1.10, crashRiskMult: 0.92 } },
  { id: 'microgrid_buffer', name: 'Microgrid Buffer', cat: 'power', minTier: 9, cost: 17000, desc: 'Stabilisiert die interne Lastkurve.', effect: { powerUsageMult: 0.92 } },
  { id: 'incident_war_room', name: 'Incident War Room', cat: 'safety', minTier: 9, cost: 18200, desc: 'Schnelle Eskalation bei kritischen Ausfaellen.', effect: { crashRiskMult: 0.90 } },
];

function ensureLocationShopState(stateArg) {
  const state = stateArg && typeof stateArg === 'object'
    ? stateArg
    : ((typeof G === 'object' && G) ? G : {});
  if (!state.locationShopPurchases || typeof state.locationShopPurchases !== 'object') {
    state.locationShopPurchases = {};
  }
  return state;
}

function getLocationShopItemById(itemId) {
  const id = String(itemId || '');
  return (window.LOCATION_SHOP_ITEMS || []).find((x) => x.id === id) || null;
}

function getLocationShopCategoryMeta(catId) {
  const key = String(catId || '');
  return (window.LOCATION_SHOP_CATEGORIES || {})[key] || { label: 'Sonstiges', icon: '🧰' };
}

function getLocationShopSlotCap(locationId, stateArg) {
  const state = ensureLocationShopState(stateArg);
  const locId = String(locationId || state.locationId || 'home_pc');
  const loc = (typeof window.getLocationById === 'function')
    ? getLocationById(locId)
    : null;
  const tier = Math.max(1, Number((loc && loc.tier) || 1));
  const map = window.LOCATION_SHOP_SLOT_CAP_BY_TIER || {};

  let baseCap = 5;
  if (Number.isFinite(Number(map[tier]))) {
    baseCap = Math.max(1, Math.floor(Number(map[tier])));
  } else {
    Object.keys(map).forEach((key) => {
      const t = Number(key);
      if (!Number.isFinite(t)) return;
      if (t <= tier) baseCap = Math.max(baseCap, Number(map[key] || baseCap));
    });
  }

  const prestige = Math.max(0, Number(state.prestigeCount || 0));
  const prestigeBonus = Math.min(6, Math.floor(prestige / 2));
  return Math.max(1, Math.floor(baseCap + prestigeBonus));
}

function getLocationShopOwnedIds(locationId, stateArg) {
  const state = ensureLocationShopState(stateArg);
  const locId = String(locationId || state.locationId || 'home_pc');
  const raw = Array.isArray(state.locationShopPurchases[locId])
    ? state.locationShopPurchases[locId]
    : [];
  const validIds = new Set((window.LOCATION_SHOP_ITEMS || []).map((item) => item.id));
  const clean = [];
  const seen = new Set();
  raw.forEach((entry) => {
    const id = String(entry || '');
    if (!id || seen.has(id) || !validIds.has(id)) return;
    seen.add(id);
    clean.push(id);
  });
  state.locationShopPurchases[locId] = clean;
  return clean;
}

function getLocationShopItemsForLocation(locationId, stateArg) {
  const state = ensureLocationShopState(stateArg);
  const locId = String(locationId || state.locationId || 'home_pc');
  const loc = (typeof window.getLocationById === 'function')
    ? getLocationById(locId)
    : null;
  const tier = Math.max(1, Number((loc && loc.tier) || 1));
  return (window.LOCATION_SHOP_ITEMS || [])
    .filter((item) => tier >= Number(item.minTier || 1))
    .slice()
    .sort((a, b) => {
      const ta = Number(a.minTier || 1);
      const tb = Number(b.minTier || 1);
      if (ta !== tb) return ta - tb;
      if (String(a.cat || '') !== String(b.cat || '')) return String(a.cat || '').localeCompare(String(b.cat || ''));
      return Number(a.cost || 0) - Number(b.cost || 0);
    });
}

function getLocationShopItemCost(itemId, stateArg) {
  const state = ensureLocationShopState(stateArg);
  const item = getLocationShopItemById(itemId);
  if (!item) return Infinity;
  const baseCost = Math.max(0, Number(item.cost || 0));
  const buildCostMult = Math.max(0.55, Number(state._buildCostMult || 1));
  const prestigeCostMult = Math.max(0.60, Number(state._prestigeShopCostMult || 1));
  const totalOwned = Math.max(0, Number(getTotalLocationShopItemsOwned(state) || 0));
  const locId = String(state.locationId || 'home_pc');
  const locOwned = getLocationShopOwnedIds(locId, state).length;
  const globalInflation = Math.pow(1.11, totalOwned);
  const localInflation = Math.pow(1.07, Math.max(0, locOwned));
  let earlyGameMult = 1.0;
  const itemTier = Math.max(1, Number(item.minTier || 1));
  if (itemTier <= 3) earlyGameMult = 1.65;
  else if (itemTier <= 5) earlyGameMult = 1.35;
  else if (itemTier <= 7) earlyGameMult = 1.18;
  return Math.ceil(baseCost * buildCostMult * prestigeCostMult * globalInflation * localInflation * earlyGameMult);
}

function getLocationShopEffects(locationId, stateArg) {
  const state = ensureLocationShopState(stateArg);
  const ownedIds = getLocationShopOwnedIds(locationId, state);
  const fx = {
    clickMult: 1,
    hpsMult: 1,
    staffEffMult: 1,
    staffWageMult: 1,
    crewXpMult: 1,
    crashRiskMult: 1,
    powerUsageMult: 1,
  };

  ownedIds.forEach((itemId) => {
    const item = getLocationShopItemById(itemId);
    if (!item || !item.effect || typeof item.effect !== 'object') return;
    Object.keys(fx).forEach((key) => {
      if (!Number.isFinite(Number(item.effect[key]))) return;
      fx[key] *= Number(item.effect[key]);
    });
  });

  return fx;
}

function getTotalLocationShopItemsOwned(stateArg) {
  const state = ensureLocationShopState(stateArg);
  return Object.values(state.locationShopPurchases || {}).reduce((sum, arr) => {
    if (!Array.isArray(arr)) return sum;
    return sum + arr.length;
  }, 0);
}

function getCurrentLocationShopEffects() {
  const state = ensureLocationShopState();
  return getLocationShopEffects(state.locationId || 'home_pc', state);
}

window.ensureLocationShopState = ensureLocationShopState;
window.getLocationShopItemById = getLocationShopItemById;
window.getLocationShopCategoryMeta = getLocationShopCategoryMeta;
window.getLocationShopSlotCap = getLocationShopSlotCap;
window.getLocationShopOwnedIds = getLocationShopOwnedIds;
window.getLocationShopItemsForLocation = getLocationShopItemsForLocation;
window.getLocationShopItemCost = getLocationShopItemCost;
window.getLocationShopEffects = getLocationShopEffects;
window.getTotalLocationShopItemsOwned = getTotalLocationShopItemsOwned;
window.getCurrentLocationShopEffects = getCurrentLocationShopEffects;
