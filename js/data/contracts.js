// ============================================================
// DATA - Contract-Vorlagen
// generateContracts() in systems/contracts.js erstellt daraus
// konkrete Aufgaben mit skalierten Zielen und Belohnungen.
// ============================================================

const CONTRACT_TEMPLATES = [
  // Easy
  { name:'Hash Sprint',      desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 5000,    reward: 250,   difficulty:'easy' },
  { name:'Coin Collector',   desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 1000,    reward: 400,   difficulty:'easy' },
  { name:'Rig Aufbau',       desc:'Habe {t} Rigs gesamt',   type:'rigs',   diffMult: 5,       reward: 800,   difficulty:'easy' },
  { name:'Warmup Shift',     desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 25000,   reward: 900,   difficulty:'easy' },
  { name:'Pocket Profit',    desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 6000,    reward: 1200,  difficulty:'easy' },
  { name:'Facility Tuning',  desc:'Installiere {t} Standort-Shop Items', type:'location_shop_items', diffMult: 2, reward: 1600, difficulty:'easy', fixedTarget: true },
  { name:'Research Brief',   desc:'Schliesse {t} Forschungen ab', type:'research_count', diffMult: 3, reward: 2200, difficulty:'easy', fixedTarget: true },
  { name:'Cooling Basics',   desc:'Erreiche Cooling-Level {t}', type:'cooling_level', diffMult: 1, reward: 2400, difficulty:'easy', fixedTarget: true },
  { name:'Ops Drill',        desc:'Treffe {t} Netz-Entscheidungen', type:'outage_responses', diffMult: 2, reward: 2500, difficulty:'easy', fixedTarget: true },
  { name:'Grid Watch',       desc:'Erlebe {t} Stromausfaelle', type:'outage_events', diffMult: 2, reward: 2700, difficulty:'easy', fixedTarget: true },

  // Medium
  { name:'Hash Tsunami',     desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 200000,  reward: 2000,  difficulty:'medium' },
  { name:'Kapital Build',    desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 15000,   reward: 3500,  difficulty:'medium' },
  { name:'Mining Crew',      desc:'Habe {t} Rigs gesamt',   type:'rigs',   diffMult: 12,      reward: 4500,  difficulty:'medium' },
  { name:'Server Contract',  desc:'Habe {t} Rigs gesamt',   type:'rigs',   diffMult: 18,      reward: 7000,  difficulty:'medium' },
  { name:'Liquidation Run',  desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 45000,   reward: 9500,  difficulty:'medium' },
  { name:'Night Shift',      desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 800000,  reward: 12000, difficulty:'medium' },
  { name:'Crew Coverage',    desc:'Erreiche {t}% Crew-Abdeckung', type:'crew_coverage', diffMult: 78, reward: 9000, difficulty:'medium', fixedTarget: true },
  { name:'Expansion Audit',  desc:'Erreiche Standort-Tier {t}', type:'location_tier', diffMult: 5, reward: 11000, difficulty:'medium', fixedTarget: true },
  { name:'Ops Upgrade',      desc:'Installiere {t} Standort-Shop Items', type:'location_shop_items', diffMult: 5, reward: 12500, difficulty:'medium', fixedTarget: true },
  { name:'Grid Discipline',  desc:'Erreiche Power-Infra Level {t}', type:'power_infra', diffMult: 5, reward: 13800, difficulty:'medium', fixedTarget: true },
  { name:'Cooling Ladder',   desc:'Erreiche Cooling-Level {t}', type:'cooling_level', diffMult: 3, reward: 14600, difficulty:'medium', fixedTarget: true },
  { name:'Layout Commander', desc:'Wechsle {t}x das Rig-Layout', type:'layout_switches', diffMult: 4, reward: 15200, difficulty:'medium', fixedTarget: true },
  { name:'Auto Dispatcher',  desc:'Loese {t} Stromausfaelle automatisch', type:'outage_auto_responses', diffMult: 4, reward: 15800, difficulty:'medium', fixedTarget: true },
  { name:'Cooling Discipline',desc:'Wechsle {t}x den Cooling-Modus', type:'cooling_switches', diffMult: 8, reward: 16200, difficulty:'medium', fixedTarget: true },
  { name:'Meta Drill',       desc:'Fuehre {t} Prestige-Durchlaeufe aus', type:'prestige_count', diffMult: 2, reward: 14200, difficulty:'medium', fixedTarget: true },

  // Hard
  { name:'Mining Boss',      desc:'Habe {t} Rigs gesamt',   type:'rigs',   diffMult: 25,      reward: 10000, difficulty:'hard' },
  { name:'Hash God',         desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 5000000, reward: 25000, difficulty:'hard' },
  { name:'Crypto Whale',     desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 500000,  reward: 50000, difficulty:'hard' },
  { name:'Mega Farm',        desc:'Habe {t} Rigs gesamt',   type:'rigs',   diffMult: 40,      reward: 45000, difficulty:'hard' },
  { name:'Hyper Liquid',     desc:'Verdiene ${t} gesamt',   type:'earn',   diffMult: 1500000, reward: 95000, difficulty:'hard' },
  { name:'Datacenter Rush',  desc:'Sammle {t} Hashes',      type:'hashes', diffMult: 12000000,reward: 140000,difficulty:'hard' },
  { name:'Ops Excellence',   desc:'Erreiche {t}% Crew-Abdeckung', type:'crew_coverage', diffMult: 92, reward: 52000, difficulty:'hard', fixedTarget: true },
  { name:'Campus Readiness', desc:'Erreiche Standort-Tier {t}', type:'location_tier', diffMult: 7, reward: 62000, difficulty:'hard', fixedTarget: true },
  { name:'Facility Overhaul',desc:'Installiere {t} Standort-Shop Items', type:'location_shop_items', diffMult: 8, reward: 58000, difficulty:'hard', fixedTarget: true },
  { name:'Research Marathon',desc:'Schliesse {t} Forschungen ab', type:'research_count', diffMult: 8, reward: 68000, difficulty:'hard', fixedTarget: true },
  { name:'Grid Sovereign',   desc:'Erreiche Power-Infra Level {t}', type:'power_infra', diffMult: 8, reward: 76000, difficulty:'hard', fixedTarget: true },
  { name:'Thermal Architect',desc:'Erreiche Cooling-Level {t}', type:'cooling_level', diffMult: 6, reward: 79000, difficulty:'hard', fixedTarget: true },
  { name:'Blackout Marshal', desc:'Treffe {t} Netz-Entscheidungen', type:'outage_responses', diffMult: 8, reward: 84000, difficulty:'hard', fixedTarget: true },
  { name:'Crisis Commander', desc:'Loese {t} Stromausfaelle manuell', type:'outage_manual_responses', diffMult: 8, reward: 86000, difficulty:'hard', fixedTarget: true },
  { name:'Legacy Calibration',desc:'Fuehre {t} Prestige-Durchlaeufe aus', type:'prestige_count', diffMult: 4, reward: 88000, difficulty:'hard', fixedTarget: true }
];
