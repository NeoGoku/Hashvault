// ============================================================
// DATA — Upgrades  (stark verteuerter Rebalance)
// Alle Preise ~3-4× höher als v3
// ============================================================

const UPGRADES = [

  // ── Click-Upgrades ──────────────────────────────────────────
  { id:'cu1', name:'Bessere Tastatur',    icon:'⌨️', desc:'+1 H/Klick',     effect:'click+1',        cost:500,       category:'click',  req:null  },
  { id:'cu2', name:'Ergonomische Maus',   icon:'🖱️', desc:'+2 H/Klick',     effect:'click+2',        cost:2000,      category:'click',  req:'cu1' },
  { id:'cu3', name:'Macro-Tastatur',      icon:'🎮', desc:'+5 H/Klick',     effect:'click+5',        cost:8000,      category:'click',  req:'cu2' },
  { id:'cu4', name:'Auto-Clicker V1',     icon:'🤖', desc:'+10 H/Klick',    effect:'click+10',       cost:35000,     category:'click',  req:'cu3' },
  { id:'cu5', name:'Auto-Clicker V2',     icon:'🦾', desc:'+25 H/Klick',    effect:'click+25',       cost:150000,    category:'click',  req:'cu4' },
  { id:'cu6', name:'Neural Clicker',      icon:'🧠', desc:'+100 H/Klick',   effect:'click+100',      cost:900000,    category:'click',  req:'cu5' },
  { id:'cu7', name:'Quantum Click',       icon:'💫', desc:'+500 H/Klick',   effect:'click+500',      cost:8000000,   category:'click',  req:'cu6' },

  // ── Rig-Upgrades ────────────────────────────────────────────
  { id:'ru1', name:'Cooling Upgrade',     icon:'❄️', desc:'Alle Rigs +20% H/s',   effect:'rigmult+0.2',  cost:5000,      category:'rig',    req:null  },
  { id:'ru2', name:'Übertakten',          icon:'🔥', desc:'Alle Rigs +30% H/s',   effect:'rigmult+0.3',  cost:30000,     category:'rig',    req:'ru1' },
  { id:'ru3', name:'BIOS Tuning',         icon:'⚙️', desc:'Alle Rigs +50% H/s',   effect:'rigmult+0.5',  cost:180000,    category:'rig',    req:'ru2' },
  { id:'ru4', name:'Custom Firmware',     icon:'💾', desc:'Alle Rigs +80% H/s',   effect:'rigmult+0.8',  cost:1000000,   category:'rig',    req:'ru3' },
  { id:'ru5', name:'Liquid Cooling',      icon:'💧', desc:'Alle Rigs +120% H/s',  effect:'rigmult+1.2',  cost:6000000,   category:'rig',    req:'ru4' },
  { id:'ru6', name:'AI Optimization',     icon:'🤖', desc:'Alle Rigs +200% H/s',  effect:'rigmult+2.0',  cost:40000000,  category:'rig',    req:'ru5' },

  // ── Markt-Upgrades ──────────────────────────────────────────
  { id:'mu1', name:'Crypto Wallet',       icon:'👝', desc:'Marktpreise +15%',     effect:'pricemult+0.15', cost:2500,      category:'market', req:null  },
  { id:'mu2', name:'Trading Bot',         icon:'📊', desc:'Marktpreise +25%',     effect:'pricemult+0.25', cost:20000,     category:'market', req:'mu1' },
  { id:'mu3', name:'Dark Pool Access',    icon:'🌑', desc:'Marktpreise +40%',     effect:'pricemult+0.4',  cost:150000,    category:'market', req:'mu2' },
  { id:'mu4', name:'HFT Algo',            icon:'⚡', desc:'Marktpreise +60%',     effect:'pricemult+0.6',  cost:750000,    category:'market', req:'mu3' },
  { id:'mu5', name:'Exchange Listing',    icon:'🏛️', desc:'Marktpreise +100%',    effect:'pricemult+1.0',  cost:4500000,   category:'market', req:'mu4' },

  // ── Spezial ─────────────────────────────────────────────────
  { id:'sp1', name:'Hash-zu-Coin Boost',  icon:'🔄', desc:'Conversion Rate ×2',       effect:'conv*2',      cost:10000,     category:'click',  req:null  },
  { id:'sp2', name:'Double Mining',       icon:'✌️', desc:'Klick gibt 2× Hashes',     effect:'click*2',     cost:70000,     category:'click',  req:'sp1' },
  { id:'sp3', name:'Pool Mining',         icon:'🏊', desc:'H/s +10% pro Rig-Typ',     effect:'pool',        cost:250000,    category:'rig',    req:null  },
  { id:'sp4', name:'Solar Power',         icon:'☀️', desc:'Rigs kosten 20% weniger',  effect:'rigcost-0.2', cost:1200000,   category:'rig',    req:'ru3' },
  { id:'sp5', name:'Staking Income',      icon:'💰', desc:'Passives USD +$2/s',       effect:'passive+2',   cost:700000,    category:'market', req:'mu3' },
  { id:'sp6', name:'Staking Pro',         icon:'💎', desc:'Passives USD +$8/s',       effect:'passive+8',   cost:7000000,   category:'market', req:'sp5' },
  { id:'sp7', name:'Combo Extender',      icon:'🔗', desc:'Combo-Bonus hält länger',  effect:'comboblend',  cost:90000,     category:'click',  req:'cu3' },
  { id:'sp8', name:'Mega Staking',        icon:'🏦', desc:'Passives USD +$25/s',      effect:'passive+25',  cost:55000000,  category:'market', req:'sp6' },
  { id:'sp9', name:'Demand Controller',   icon:'🕹️', desc:'Passives USD +$40/s',      effect:'passive+40',  cost:130000000, category:'market', req:'sp8' },
  { id:'ru7', name:'Predictive Maint.',   icon:'🛠️', desc:'Alle Rigs +35% H/s',       effect:'rigmult+0.35',cost:120000000, category:'rig',    req:'ru6' },
  { id:'mu6', name:'Arbitrage AI Grid',   icon:'🧮', desc:'Marktpreise +35%',          effect:'pricemult+0.35', cost:85000000, category:'market', req:'mu5' },
  { id:'sp10',name:'Load Optimizer',      icon:'⚙️', desc:'Alle Rigs +45% H/s',       effect:'rigmult+0.45',cost:220000000, category:'rig',    req:'sp9' },
  { id:'mu7', name:'Latency Broker Mesh', icon:'🛰️', desc:'Marktpreise +45%',          effect:'pricemult+0.45', cost:260000000, category:'market', req:'mu6' },
  { id:'ru8', name:'Self-Healing Cluster',icon:'🧬', desc:'Alle Rigs +65% H/s',        effect:'rigmult+0.65', cost:360000000, category:'rig',    req:'ru7' },
  { id:'sp11',name:'Treasury Engine',     icon:'🏛️', desc:'Passives USD +$75/s',      effect:'passive+75',  cost:430000000, category:'market', req:'mu7' },
  { id:'sp12',name:'Operator Nexus',      icon:'🧠', desc:'Alle Rigs +90% H/s',        effect:'rigmult+0.9', cost:620000000, category:'rig',    req:'ru8' },
  { id:'ru9', name:'Nanofabric Mesh',     icon:'🧵', desc:'Alle Rigs +110% H/s',       effect:'rigmult+1.1', cost:1400000000, category:'rig',    req:'sp12', minPrestige:2 },
  { id:'mu8', name:'Institution Prime',   icon:'🏦', desc:'Marktpreise +60%',          effect:'pricemult+0.6', cost:1200000000, category:'market', req:'sp11', minPrestige:2 },
  { id:'sp13',name:'Hypergrid Controller',icon:'🕸️', desc:'Alle Rigs +130% H/s',       effect:'rigmult+1.3', cost:2100000000, category:'rig',    req:'ru9', minPrestige:3 },
  { id:'sp14',name:'Treasury Singularity',icon:'🌌', desc:'Passives USD +$140/s',      effect:'passive+140', cost:3200000000, category:'market', req:'mu8', minPrestige:3 },
  { id:'mu9', name:'Sovereign Exchange',  icon:'🛰️', desc:'Marktpreise +85%',          effect:'pricemult+0.85', cost:4500000000, category:'market', req:'sp14', minPrestige:4 },
  { id:'ru10',name:'Dyson Runtime',       icon:'☀️', desc:'Alle Rigs +150% H/s',       effect:'rigmult+1.5', cost:5200000000, category:'rig',    req:'sp13', minPrestige:4 },
];
