// ============================================================
// DATA — Coins, Hash-Conversion, Chip-Shop
// ============================================================

/** Hashes fuer 1 Coin (langfristigeres Progressionstempo) */
const HASH_PER_COIN = 12000;

const COIN_DATA = {
  BTC: { name:'Bitcoin',   symbol:'₿', color:'#f7931a', basePrice: 80,  volatility: 0.025 },
  ETH: { name:'Ethereum',  symbol:'Ξ', color:'#627eea', basePrice: 35,  volatility: 0.030 },
  LTC: { name:'Litecoin',  symbol:'Ł', color:'#bfbbbb', basePrice: 15,  volatility: 0.040 },
  BNB: { name:'BNB',       symbol:'⬡', color:'#f3ba2f', basePrice: 25,  volatility: 0.030 },
};

// Coin-Profile fuer klarere Rollen (Ertrag + Marktcharakter).
// miningHashMult: beeinflusst H/s, die auf diese Coin laufen.
// convMult:       Hashes pro Coin (hoeher = schwerer zu minen).
// driftBias:      leichter Trend-Bias pro Coin.
// noiseMult:      Mikro-Schwankungsintensitaet.
// reversionMult:  Rueckkehr zur Basis (niedriger = laeuft laenger trendig).
// shockMult:      Reaktion auf Mikrozyklen/Events.
const COIN_PROFILES = {
  BTC: {
    miningHashMult: 0.62,
    convMult: 1.22,
    driftBias: 0.00030,
    noiseMult: 0.72,
    reversionMult: 1.05,
    shockMult: 0.70,
    yieldLabel: 'Value Store',
  },
  ETH: {
    miningHashMult: 1.04,
    convMult: 0.94,
    driftBias: 0.00018,
    noiseMult: 0.95,
    reversionMult: 0.95,
    shockMult: 1.00,
    yieldLabel: 'Research Fuel',
  },
  LTC: {
    miningHashMult: 1.34,
    convMult: 0.80,
    driftBias: 0.00005,
    noiseMult: 1.20,
    reversionMult: 0.90,
    shockMult: 1.28,
    yieldLabel: 'Repair Economy',
  },
  BNB: {
    miningHashMult: 0.98,
    convMult: 0.90,
    driftBias: 0.00012,
    noiseMult: 1.02,
    reversionMult: 0.92,
    shockMult: 1.08,
    yieldLabel: 'Ops Hedge',
  },
};

// ──────────────────────────────────────────────────────────────────
// CHIP-SHOP — 3 Kategorien:
//   'boost'  → dauerhaft & stapelbar (Multiplikatoren)
//   'unlock' → Einmalig; schaltet neue Features permanent frei
//   'use'    → Verbrauchsmittel; kaufen = Vorrat, benutzen = einmalige Wirkung
// ──────────────────────────────────────────────────────────────────
const CHIP_SHOP = [

  // ── 💪 BOOSTS ─────────────────────────────────────────────────
  { id:'cb1',  cat:'boost',  name:'Hash Boost I',      desc:'+25% H/s dauerhaft',                 cost:1, effect:'hps+0.25',           max:6  },
  { id:'cb2',  cat:'boost',  name:'Hash Boost II',     desc:'+75% H/s dauerhaft',                 cost:4, effect:'hps+0.75',           max:4  },
  { id:'cb3',  cat:'boost',  name:'Click Verstärker',  desc:'+75% Klick-Power dauerhaft',         cost:2, effect:'click*1.75',         max:4  },
  { id:'cb4',  cat:'boost',  name:'Markt-Boost',       desc:'+35% Coin-Preise dauerhaft',         cost:2, effect:'price+0.35',         max:5  },
  { id:'cb5',  cat:'boost',  name:'Passiv Income',     desc:'+$15/s passives Einkommen',          cost:3, effect:'passive+15',         max:10 },
  { id:'cb6',  cat:'boost',  name:'Startkapital',      desc:'+$3.000 Startgeld nach Prestige',    cost:1, effect:'startcash+3000',     max:20 },
  { id:'cb7',  cat:'boost',  name:'Rig-Rabatt',        desc:'Rig-Preise −8% dauerhaft',          cost:3, effect:'rigcost-0.08',       max:3  },
  { id:'cb8',  cat:'boost',  name:'Combo-Meister',     desc:'Combo-Bonus +75% dauerhaft',        cost:3, effect:'combo+0.75',         max:4  },
  { id:'cb9',  cat:'boost',  name:'Legacy-Bonus',      desc:'+8% ALLE Einnahmen pro Prestige-Lvl', cost:5, effect:'legacy+0.08',     max:5  },
  { id:'cb10', cat:'boost',  name:'Research Speed',    desc:'Forschung läuft 40% schneller',      cost:4, effect:'researchspeed+0.4', max:3  },
  { id:'cb11', cat:'boost',  name:'Titan Hash Matrix', desc:'+120% H/s dauerhaft',                cost:6, effect:'hps+1.2',           max:3  },
  { id:'cb12', cat:'boost',  name:'Market Dominion',   desc:'+50% Coin-Preise dauerhaft',         cost:6, effect:'price+0.5',         max:3  },

  // ── 🔓 UNLOCKS ─────────────────────────────────────────────────
  { id:'cu1', cat:'unlock', name:'Auto-Klicker',       desc:'Klickt automatisch 2× pro Sekunde', cost:5,  effect:'autoclicker',       max:1  },
  { id:'cu2', cat:'unlock', name:'Diversified Portfolio', desc:'+10% H/s & Preise pro Coin mit eigenem Rig (max +40% für alle 4)', cost:8, effect:'multicoin', max:1 },
  { id:'cu3', cat:'unlock', name:'Crash-Schutz',       desc:'Preise fallen maximal −30%',        cost:6,  effect:'crashprotect',      max:1  },
  { id:'cu4', cat:'unlock', name:'Rig-Blueprints',     desc:'+10% H/s pro Prestige-Level',       cost:7,  effect:'rigblueprint',      max:1  },
  { id:'cu5', cat:'unlock', name:'Forschungs-Labor',   desc:'Zwei Forschungen gleichzeitig',     cost:10, effect:'parallelresearch',  max:1  },
  { id:'cu6', cat:'unlock', name:'Contract-Slot +1',   desc:'Einen extra Contract-Slot',         cost:6,  effect:'extracontract',     max:3  },
  { id:'cu7', cat:'unlock', name:'Insurance Desk',     desc:'Versicherungs-Praemien dauerhaft −15%', cost:7, effect:'insurancediscount', max:1 },

  // ── ⚡ VERBRAUCHSMITTEL ────────────────────────────────────────
  { id:'cc1', cat:'use', name:'Zeitsprung',            desc:'2h Idle-Einnahmen sofort kassieren', cost:3, effect:'timewarp4h',        max:99 },
  { id:'cc2', cat:'use', name:'Hash-Burst',            desc:'H/s ×10 für 60 Sekunden',           cost:4, effect:'hashburst60',       max:99 },
  { id:'cc3', cat:'use', name:'Markt-Spike',           desc:'Alle Preise ×3 für 30 Sekunden',    cost:5, effect:'pricespike30',      max:99 },
  { id:'cc4', cat:'use', name:'Rig-Überladung',        desc:'Alle Rigs ×5 H/s für 2 Minuten',   cost:6, effect:'rigsurge120',       max:99 },
];
