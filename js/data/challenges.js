// ============================================================
// Daily Challenges - rotierende Tagesquests
// ============================================================

window.DAILY_CHALLENGE_COUNT = 5;

window.CHALLENGES = {
  // Mining
  c_hash_1m: {
    id: 'c_hash_1m',
    name: '1M Hash sammeln',
    description: 'Mine 1.000.000 Hashes',
    type: 'mining',
    target: 1000000,
    unit: 'hash',
    rewards: { chips: 3, cashBonus: 5000 },
    difficulty: 1
  },
  c_hash_10m: {
    id: 'c_hash_10m',
    name: '10M Hash sammeln',
    description: 'Mine 10.000.000 Hashes',
    type: 'mining',
    target: 10000000,
    unit: 'hash',
    rewards: { chips: 8, cashBonus: 25000 },
    difficulty: 3
  },
  c_hash_50m: {
    id: 'c_hash_50m',
    name: '50M Hash sammeln',
    description: 'Mine 50.000.000 Hashes',
    type: 'mining',
    target: 50000000,
    unit: 'hash',
    rewards: { chips: 12, cashBonus: 90000 },
    difficulty: 4
  },

  // Coin Mining
  c_btc_mine: {
    id: 'c_btc_mine',
    name: 'BTC Specialist',
    description: 'Mine 0.5 BTC mit mindestens 2 Rigs',
    type: 'coin_mining',
    coin: 'BTC',
    target: 0.5,
    minRigs: 2,
    rewards: { chips: 5, chipType: 'permanent' },
    difficulty: 2
  },
  c_eth_mine: {
    id: 'c_eth_mine',
    name: 'ETH Specialist',
    description: 'Mine 1 ETH mit mindestens 2 Rigs',
    type: 'coin_mining',
    coin: 'ETH',
    target: 1,
    minRigs: 2,
    rewards: { chips: 5, cashBonus: 15000 },
    difficulty: 2
  },
  c_ltc_mine: {
    id: 'c_ltc_mine',
    name: 'LTC Burst',
    description: 'Mine 4 LTC mit mindestens 3 Rigs',
    type: 'coin_mining',
    coin: 'LTC',
    target: 4,
    minRigs: 3,
    rewards: { chips: 6, cashBonus: 22000 },
    difficulty: 3
  },

  // Selling
  c_sell_5: {
    id: 'c_sell_5',
    name: 'Kleine Trades',
    description: 'Verkaufe 5 Coins insgesamt',
    type: 'selling',
    target: 5,
    unit: 'coins',
    rewards: { chips: 2, cashBonus: 3000 },
    difficulty: 1
  },
  c_sell_40: {
    id: 'c_sell_40',
    name: 'Trade Marathon',
    description: 'Verkaufe 40 Coins insgesamt',
    type: 'selling',
    target: 40,
    unit: 'coins',
    rewards: { chips: 7, cashBonus: 25000 },
    difficulty: 3
  },
  c_sell_100k: {
    id: 'c_sell_100k',
    name: 'Big Seller',
    description: 'Verkaufe Coins im Wert von $100.000',
    type: 'selling_value',
    target: 100000,
    unit: 'dollars',
    rewards: { chips: 6, cashBonus: 15000 },
    difficulty: 2
  },
  c_sell_1m: {
    id: 'c_sell_1m',
    name: 'Market Shark',
    description: 'Verkaufe Coins im Wert von $1.000.000',
    type: 'selling_value',
    target: 1000000,
    unit: 'dollars',
    rewards: { chips: 12, cashBonus: 120000 },
    difficulty: 4
  },

  // Rig / Progress
  c_rig_3: {
    id: 'c_rig_3',
    name: 'Multi-Miner',
    description: 'Betreibe 3 oder mehr Rigs',
    type: 'rigs',
    target: 3,
    unit: 'rigs',
    rewards: { chips: 4, cashBonus: 8000 },
    difficulty: 2
  },
  c_rig_12: {
    id: 'c_rig_12',
    name: 'Rig Fleet',
    description: 'Betreibe 12 oder mehr Rigs',
    type: 'rigs',
    target: 12,
    unit: 'rigs',
    rewards: { chips: 10, cashBonus: 60000 },
    difficulty: 4
  },
  c_rig_diverse: {
    id: 'c_rig_diverse',
    name: 'Diversifizierung',
    description: 'Setze Rigs auf 3 verschiedene Coins',
    type: 'rig_diversity',
    target: 3,
    unit: 'coins',
    rewards: { chips: 5, chipType: 'consumable' },
    difficulty: 2
  },
  c_location_t4: {
    id: 'c_location_t4',
    name: 'Standortsprung',
    description: 'Erreiche mindestens Standort-Tier 4',
    type: 'location_tier',
    target: 4,
    unit: 'tier',
    rewards: { chips: 6, cashBonus: 30000 },
    difficulty: 3
  },
  c_crew_coverage_80: {
    id: 'c_crew_coverage_80',
    name: 'Crew in Position',
    description: 'Halte 80% Crew-Abdeckung',
    type: 'crew_coverage',
    target: 80,
    unit: 'percent',
    rewards: { chips: 8, cashBonus: 52000 },
    difficulty: 3
  },
  c_shop_items_4: {
    id: 'c_shop_items_4',
    name: 'Facility Setup',
    description: 'Installiere 4 Standort-Shop Items',
    type: 'location_shop_items',
    target: 4,
    unit: 'items',
    rewards: { chips: 7, chipType: 'permanent' },
    difficulty: 3
  },
  c_health_92: {
    id: 'c_health_92',
    name: 'Gesunder Maschinenpark',
    description: 'Halte die durchschnittliche Rig-Haltbarkeit bei 92%',
    type: 'rig_health',
    target: 92,
    minRigs: 4,
    unit: 'percent',
    rewards: { chips: 6, cashBonus: 34000 },
    difficulty: 2
  },
  c_shop_items_8: {
    id: 'c_shop_items_8',
    name: 'Facility Expansion',
    description: 'Installiere 8 Standort-Shop Items',
    type: 'location_shop_items',
    target: 8,
    unit: 'items',
    rewards: { chips: 10, cashBonus: 92000 },
    difficulty: 4
  },
  c_location_t7: {
    id: 'c_location_t7',
    name: 'Campus Checkpoint',
    description: 'Erreiche mindestens Standort-Tier 7',
    type: 'location_tier',
    target: 7,
    unit: 'tier',
    rewards: { chips: 11, cashBonus: 125000 },
    difficulty: 4
  },
  c_crew_coverage_92: {
    id: 'c_crew_coverage_92',
    name: 'Crew Perfekt',
    description: 'Halte 92% Crew-Abdeckung',
    type: 'crew_coverage',
    target: 92,
    unit: 'percent',
    rewards: { chips: 10, cashBonus: 98000 },
    difficulty: 4
  },
  c_health_97: {
    id: 'c_health_97',
    name: 'Zero Downtime',
    description: 'Halte die durchschnittliche Rig-Haltbarkeit bei 97%',
    type: 'rig_health',
    target: 97,
    minRigs: 8,
    unit: 'percent',
    rewards: { chips: 10, cashBonus: 110000 },
    difficulty: 4
  },

  // Research
  c_research_2: {
    id: 'c_research_2',
    name: 'Research Rush',
    description: 'Vervollstaendige 2 Research-Projekte',
    type: 'research',
    target: 2,
    unit: 'research',
    rewards: { chips: 6, hashMultiplier: 1.1 },
    difficulty: 2
  },
  c_research_5: {
    id: 'c_research_5',
    name: 'Lab Marathon',
    description: 'Vervollstaendige 5 Research-Projekte',
    type: 'research',
    target: 5,
    unit: 'research',
    rewards: { chips: 11, cashBonus: 75000 },
    difficulty: 4
  },
  c_research_8: {
    id: 'c_research_8',
    name: 'Deep Lab',
    description: 'Vervollstaendige 8 Research-Projekte',
    type: 'research',
    target: 8,
    unit: 'research',
    rewards: { chips: 12, cashBonus: 135000 },
    difficulty: 4
  },

  // Contracts / Prestige / Streak
  c_contract_4: {
    id: 'c_contract_4',
    name: 'Freelancer Plus',
    description: 'Schliesse 4 Contracts ab',
    type: 'contracts_done',
    target: 4,
    unit: 'contracts',
    rewards: { chips: 7, cashBonus: 30000 },
    difficulty: 3
  },
  c_contract_8: {
    id: 'c_contract_8',
    name: 'Ops Pipeline',
    description: 'Schliesse 8 Contracts ab',
    type: 'contracts_done',
    target: 8,
    unit: 'contracts',
    rewards: { chips: 11, cashBonus: 105000 },
    difficulty: 4
  },
  c_prestige_1: {
    id: 'c_prestige_1',
    name: 'Prestige Milestone',
    description: 'Erreiche 1 Prestige Level',
    type: 'prestige',
    target: 1,
    unit: 'prestige',
    rewards: { chips: 10, chipType: 'permanent' },
    difficulty: 3
  },
  c_streak_3: {
    id: 'c_streak_3',
    name: 'Daily Grind',
    description: 'Halte eine Daily-Streak von 3 Tagen',
    type: 'daily_streak',
    target: 3,
    unit: 'days',
    rewards: { chips: 6, cashBonus: 20000 },
    difficulty: 2
  },
  c_hash_200m: {
    id: 'c_hash_200m',
    name: 'Hash Hyperloop',
    description: 'Mine 200.000.000 Hashes',
    type: 'mining',
    target: 200000000,
    unit: 'hash',
    rewards: { chips: 16, cashBonus: 250000 },
    difficulty: 5
  },
  c_contract_16: {
    id: 'c_contract_16',
    name: 'Executive Pipeline',
    description: 'Schliesse 16 Contracts ab',
    type: 'contracts_done',
    target: 16,
    unit: 'contracts',
    rewards: { chips: 15, cashBonus: 320000 },
    difficulty: 5
  },
  c_location_t9: {
    id: 'c_location_t9',
    name: 'Mega Campus',
    description: 'Erreiche Standort-Tier 9',
    type: 'location_tier',
    target: 9,
    unit: 'tier',
    rewards: { chips: 18, cashBonus: 600000 },
    difficulty: 5
  },
  c_crew_coverage_98: {
    id: 'c_crew_coverage_98',
    name: 'Crew Supreme',
    description: 'Halte 98% Crew-Abdeckung',
    type: 'crew_coverage',
    target: 98,
    unit: 'percent',
    rewards: { chips: 18, cashBonus: 520000 },
    difficulty: 5
  },
  c_shop_items_14: {
    id: 'c_shop_items_14',
    name: 'Facility Doctrine',
    description: 'Installiere 14 Standort-Shop Items',
    type: 'location_shop_items',
    target: 14,
    unit: 'items',
    rewards: { chips: 15, cashBonus: 300000 },
    difficulty: 5
  },
  c_research_12: {
    id: 'c_research_12',
    name: 'Hyper Lab',
    description: 'Vervollstaendige 12 Research-Projekte',
    type: 'research',
    target: 12,
    unit: 'research',
    rewards: { chips: 18, cashBonus: 680000 },
    difficulty: 5
  }
};

// Deterministische Tagesauswahl mit eindeutigen IDs
function getDailyChallenges() {
  const keys = Object.keys(window.CHALLENGES || {});
  const count = Math.min(window.DAILY_CHALLENGE_COUNT || 5, keys.length);
  if (count <= 0) return [];

  const day = Math.floor(Date.now() / 86400000);
  const picks = [];
  const used = {};

  let idx = day % keys.length;
  let step = 3 + (day % Math.max(2, keys.length - 1));
  if (step % keys.length === 0) step = 1;

  while (picks.length < count) {
    idx = (idx + step) % keys.length;
    const key = keys[idx];
    if (!used[key]) {
      used[key] = true;
      picks.push(window.CHALLENGES[key]);
      continue;
    }
    idx = (idx + 1) % keys.length;
  }

  return picks;
}
