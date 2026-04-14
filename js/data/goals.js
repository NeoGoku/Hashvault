// ============================================================
// DATA - Langfristige Ziele (einmalig claimbar)
// ============================================================

window.GOALS = [
  {
    id: 'g_hash_100k',
    name: 'Erste Hash-Welle',
    description: 'Sammle 100.000 Hashes insgesamt.',
    type: 'total_hashes',
    target: 100000,
    unit: 'H',
    rewards: { cash: 2500, chips: 1 }
  },
  {
    id: 'g_hash_5m',
    name: 'Hash-Maschine',
    description: 'Sammle 5.000.000 Hashes insgesamt.',
    type: 'total_hashes',
    target: 5000000,
    unit: 'H',
    rewards: { cash: 30000, chips: 3 }
  },
  {
    id: 'g_cash_100k',
    name: 'Erstes Vermoegen',
    description: 'Verdiene insgesamt $100.000.',
    type: 'total_earned',
    target: 100000,
    unit: '$',
    rewards: { chips: 1 }
  },
  {
    id: 'g_cash_2m',
    name: 'Millionaer-Miner',
    description: 'Verdiene insgesamt $2.000.000.',
    type: 'total_earned',
    target: 2000000,
    unit: '$',
    rewards: { chips: 4, cash: 80000 }
  },
  {
    id: 'g_rigs_5',
    name: 'Rig-Betreiber',
    description: 'Besitze 5 Rigs gleichzeitig.',
    type: 'total_rigs',
    target: 5,
    unit: 'Rigs',
    rewards: { cash: 20000, chips: 2 }
  },
  {
    id: 'g_rigs_25',
    name: 'Rig-Imperium',
    description: 'Besitze 25 Rigs gleichzeitig.',
    type: 'total_rigs',
    target: 25,
    unit: 'Rigs',
    rewards: { cash: 120000, chips: 5 }
  },
  {
    id: 'g_research_4',
    name: 'Lab Master',
    description: 'Schliesse 4 Research-Projekte ab.',
    type: 'research_done',
    target: 4,
    unit: 'Research',
    rewards: { cash: 50000, chips: 3 }
  },
  {
    id: 'g_contract_12',
    name: 'Vertragsprofi',
    description: 'Schliesse 12 Contracts ab.',
    type: 'contracts_done',
    target: 12,
    unit: 'Contracts',
    rewards: { chips: 4, cash: 80000 }
  },
  {
    id: 'g_staff_10',
    name: 'Teamlead',
    description: 'Heuere insgesamt 10 Staff-Mitglieder an.',
    type: 'staff_hired',
    target: 10,
    unit: 'Staff',
    rewards: { cash: 60000, chips: 3 }
  },
  {
    id: 'g_btc_2',
    name: 'BTC Reserve',
    description: 'Halte 2 BTC gleichzeitig.',
    type: 'btc_balance',
    target: 2,
    unit: 'BTC',
    rewards: { cash: 80000, chips: 3 }
  },
  {
    id: 'g_streak_7',
    name: 'Konsequenz',
    description: 'Erreiche eine Daily-Streak von 7 Tagen.',
    type: 'daily_streak',
    target: 7,
    unit: 'Tage',
    rewards: { chips: 4, cash: 90000 }
  },
  {
    id: 'g_prestige_2',
    name: 'Neustart-Profi',
    description: 'Fuehre 2 Prestiges durch.',
    type: 'prestige_count',
    target: 2,
    unit: 'Prestige',
    rewards: { chips: 10 }
  },
  {
    id: 'g_loc_t6',
    name: 'Standortleiter',
    description: 'Erreiche einen Standort ab Tier 6.',
    type: 'location_tier',
    target: 6,
    unit: 'Tier',
    rewards: { chips: 6, cash: 220000 }
  },
  {
    id: 'g_crew_85',
    name: 'Crew Commander',
    description: 'Halte 85% Crew-Abdeckung (ab 80 Rigs).',
    type: 'crew_coverage',
    target: 85,
    minRigs: 80,
    minLocationTier: 5,
    unit: '%',
    rewards: { chips: 4, cash: 140000 }
  },
  {
    id: 'g_shop_10',
    name: 'Facility Designer',
    description: 'Installiere 10 Standort-Shop Items insgesamt (ab Tier 5).',
    type: 'location_shop_items',
    target: 10,
    minLocationTier: 5,
    unit: 'Items',
    rewards: { chips: 4, cash: 90000 }
  },
  {
    id: 'g_loc_t8',
    name: 'Campus Operator',
    description: 'Erreiche einen Standort ab Tier 8.',
    type: 'location_tier',
    target: 8,
    unit: 'Tier',
    rewards: { chips: 8, cash: 450000 }
  },
  {
    id: 'g_contract_30',
    name: 'Pipeline Director',
    description: 'Schliesse 30 Contracts ab.',
    type: 'contracts_done',
    target: 30,
    unit: 'Contracts',
    rewards: { chips: 9, cash: 650000 }
  },
  {
    id: 'g_crew_95',
    name: 'Ops Marshal',
    description: 'Halte 95% Crew-Abdeckung (ab 180 Rigs).',
    type: 'crew_coverage',
    target: 95,
    minRigs: 180,
    minLocationTier: 7,
    unit: '%',
    rewards: { chips: 10, cash: 400000 }
  },
  {
    id: 'g_shop_18',
    name: 'Facility Architect',
    description: 'Installiere 18 Standort-Shop Items insgesamt (ab Tier 7).',
    type: 'location_shop_items',
    target: 18,
    minLocationTier: 7,
    unit: 'Items',
    rewards: { chips: 11, cash: 700000 }
  },
  {
    id: 'g_hash_500m',
    name: 'Hash Continuum',
    description: 'Sammle 500.000.000 Hashes insgesamt.',
    type: 'total_hashes',
    target: 500000000,
    unit: 'H',
    rewards: { chips: 14, cash: 1500000 }
  },
  {
    id: 'g_research_24',
    name: 'Deep Science Lead',
    description: 'Schliesse 24 Research-Projekte ab.',
    type: 'research_done',
    target: 24,
    unit: 'Research',
    rewards: { chips: 16, cash: 2200000 }
  },
  {
    id: 'g_rigs_220',
    name: 'Planetary Fleet',
    description: 'Besitze 220 Rigs gleichzeitig (ab Tier 8).',
    type: 'total_rigs',
    target: 220,
    minLocationTier: 8,
    unit: 'Rigs',
    rewards: { chips: 18, cash: 3000000 }
  },
  {
    id: 'g_prestige_5',
    name: 'Legacy Architect',
    description: 'Fuehre 5 Prestiges durch.',
    type: 'prestige_count',
    target: 5,
    unit: 'Prestige',
    rewards: { chips: 24, cash: 5000000 }
  }
];

window.WEEKLY_OBJECTIVE_TEMPLATES = [
  { id:'w_hash_push', name:'Hash Push', desc:'Sammle {t} Hashes in dieser Woche.', type:'total_hashes_delta', baseTarget: 2500000, growth: 0.34, rewards:{ cash: 120000, chips: 2 } },
  { id:'w_cash_route', name:'Cash Route', desc:'Verdiene ${t} in dieser Woche.', type:'total_earned_delta', baseTarget: 180000, growth: 0.38, rewards:{ cash: 150000, chips: 2 } },
  { id:'w_ops_grid', name:'Grid Discipline', desc:'Fuehre {t} Grid-/Cooling-Wechsel aus.', type:'ops_actions_delta', baseTarget: 10, growth: 0.22, rewards:{ cash: 95000, chips: 2 } },
  { id:'w_contract_run', name:'Contract Run', desc:'Schliesse {t} Contracts in dieser Woche ab.', type:'contracts_done_delta', baseTarget: 4, growth: 0.26, rewards:{ cash: 135000, chips: 3 } },
  { id:'w_wallet_yield', name:'Yield Desk', desc:'Erziele $ {t} Wallet-Zinsen in dieser Woche.', type:'wallet_yield_delta', baseTarget: 2500, growth: 0.45, rewards:{ cash: 90000, chips: 3 } },
  { id:'w_shop_expansion', name:'Facility Sprint', desc:'Kaufe {t} Standort-Shop-Items in dieser Woche.', type:'shop_items_delta', baseTarget: 2, growth: 0.20, rewards:{ cash: 140000, chips: 2 } },
];

window.OPERATIONS_PROJECTS = [
  {
    id: 'p_first_vault',
    name: 'Yield Treasury',
    desc: 'Baue zum ersten Mal eine ernsthafte Wallet auf.',
    targetLabel: 'Wallet-Wert auf $25.000 bringen',
    type: 'wallet_value_peak',
    target: 25000,
    rewards: { cash: 220000, chips: 4 },
  },
  {
    id: 'p_grid_stability',
    name: 'Zero Panic Week',
    desc: 'Halte dein Netz stabil trotz Last und Ausbau.',
    targetLabel: '12 manuelle/automatische Outage-Entscheidungen',
    type: 'outage_responses_total',
    target: 12,
    rewards: { cash: 260000, chips: 4 },
  },
  {
    id: 'p_collection_push',
    name: 'Set Architect',
    desc: 'Aktiviere mehrere Set-Boni fuer deinen Betrieb.',
    targetLabel: '3 aktive Sammlungs-Sets',
    type: 'collection_sets_active',
    target: 3,
    rewards: { cash: 340000, chips: 5 },
  },
  {
    id: 'p_prestige_loop',
    name: 'Legacy Loop',
    desc: 'Verzahne Meta-Progress und Live-Betrieb.',
    targetLabel: '2 Prestiges und 6 Skilltree-Kauefe',
    type: 'prestige_and_skills',
    target: 2,
    subTarget: 6,
    rewards: { cash: 480000, chips: 8 },
  },
];
