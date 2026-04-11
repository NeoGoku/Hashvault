// ============================================================
// DATA — Achievements
// check(G): Funktion die den aktuellen State prüft
// reward:   Effect-String (null = nur kosmetisch)
// ============================================================

const ACHIEVEMENTS = [
  // ── Klicks ──────────────────────────────────────────────
  { id:'a1', name:'Erster Schritt',  icon:'👶', desc:'Ersten Klick gemacht',          check:G=>G.totalClicks>=1,       reward:'click+1',        rewardText:'+1 H/Klick'    },
  { id:'a2', name:'Klick-Junkie',   icon:'👆', desc:'100 Mal geklickt',              check:G=>G.totalClicks>=100,     reward:'click+2',        rewardText:'+2 H/Klick'    },
  { id:'a3', name:'Ausdauer',       icon:'💪', desc:'1.000 Mal geklickt',            check:G=>G.totalClicks>=1000,    reward:'click+5',        rewardText:'+5 H/Klick'    },
  { id:'a4', name:'Klick-Meister',  icon:'⚡', desc:'10.000 Mal geklickt',           check:G=>G.totalClicks>=10000,   reward:'click+20',       rewardText:'+20 H/Klick'   },
  { id:'a5', name:'Mega-Klicker',   icon:'🔥', desc:'100.000 Klicks',                check:G=>G.totalClicks>=100000,  reward:'click+100',      rewardText:'+100 H/Klick'  },
  { id:'a6', name:'Click God',      icon:'⚡', desc:'1.000.000 Klicks',              check:G=>G.totalClicks>=1000000, reward:'click+500',      rewardText:'+500 H/Klick'  },

  // ── Hashes ──────────────────────────────────────────────
  { id:'b1', name:'Hash Rookie',    icon:'#️⃣', desc:'1.000 Hashes gesammelt',        check:G=>G.totalHashes>=1000,      reward:'hps+0.05',     rewardText:'+5% H/s'       },
  { id:'b2', name:'Hash Collector', icon:'🔢', desc:'100.000 Hashes',                check:G=>G.totalHashes>=100000,    reward:'hps+0.1',      rewardText:'+10% H/s'      },
  { id:'b3', name:'Hash Machine',   icon:'⚙️', desc:'10 Millionen Hashes',           check:G=>G.totalHashes>=10000000,  reward:'hps+0.2',      rewardText:'+20% H/s'      },
  { id:'b4', name:'Hash Gott',      icon:'🌟', desc:'1 Milliarde Hashes',            check:G=>G.totalHashes>=1e9,       reward:'hps+0.5',      rewardText:'+50% H/s'      },
  { id:'b5', name:'Hash Universe',  icon:'🌌', desc:'1 Trillion Hashes',             check:G=>G.totalHashes>=1e12,      reward:'hps+1.0',      rewardText:'+100% H/s'     },

  // ── Geld ────────────────────────────────────────────────
  { id:'c1', name:'Erste Dollar',   icon:'💵', desc:'Erstes Geld verdient',           check:G=>G.totalEarned>=1,         reward:null,           rewardText:'Motivation!'   },
  { id:'c2', name:'Hundert Dollar', icon:'💴', desc:'$100 verdient',                  check:G=>G.totalEarned>=100,       reward:'passive+0.1',  rewardText:'+$0.10/s'      },
  { id:'c3', name:'Tausender',      icon:'💳', desc:'$1.000 verdient',               check:G=>G.totalEarned>=1000,      reward:'pricemult+0.05',rewardText:'+5% Preise'   },
  { id:'c4', name:'Zehntausend',    icon:'💰', desc:'$10.000 verdient',              check:G=>G.totalEarned>=10000,     reward:'pricemult+0.05',rewardText:'+5% Preise'   },
  { id:'c5', name:'Millionär',      icon:'🤑', desc:'$1.000.000 verdient',           check:G=>G.totalEarned>=1000000,   reward:'pricemult+0.1', rewardText:'+10% Preise'  },
  { id:'c6', name:'Milliardär',     icon:'💰', desc:'$1.000.000.000 verdient',       check:G=>G.totalEarned>=1e9,       reward:'pricemult+0.2', rewardText:'+20% Preise'  },

  // ── Rigs ────────────────────────────────────────────────
  { id:'d1', name:'Erster Rig',     icon:'🖥️', desc:'Ersten Rig gekauft',            check:G=>G.totalRigs>=1,   reward:null,           rewardText:'Automatisierung!'  },
  { id:'d2', name:'Kleine Farm',    icon:'🌱', desc:'10 Rigs insgesamt',             check:G=>G.totalRigs>=10,  reward:'rigmult+0.1',  rewardText:'+10% Rig-Output'   },
  { id:'d3', name:'Mining Farm',    icon:'🏭', desc:'50 Rigs insgesamt',             check:G=>G.totalRigs>=50,  reward:'rigmult+0.2',  rewardText:'+20% Rig-Output'   },
  { id:'d4', name:'Mega-Farm',      icon:'🌆', desc:'200 Rigs insgesamt',            check:G=>G.totalRigs>=200, reward:'rigmult+0.5',  rewardText:'+50% Rig-Output'   },
  { id:'d5', name:'Quantum Farm',   icon:'🌌', desc:'500 Rigs insgesamt',            check:G=>G.totalRigs>=500, reward:'rigmult+1.0',  rewardText:'+100% Rig-Output'  },
  { id:'d6', name:'Gott der Rigs',  icon:'👑', desc:'1.000 Rigs insgesamt',          check:G=>G.totalRigs>=1000,reward:'rigmult+2.0',  rewardText:'+200% Rig-Output'  },

  // ── Diversität ──────────────────────────────────────────
  { id:'e1', name:'Vielfalt I',     icon:'🎯', desc:'3 verschiedene Rig-Typen',      check:G=>Object.values(G.rigs).filter(v=>v>0).length>=3, reward:'rigmult+0.1', rewardText:'+10% Output' },
  { id:'e2', name:'Vielfalt II',    icon:'🎲', desc:'6 verschiedene Rig-Typen',      check:G=>Object.values(G.rigs).filter(v=>v>0).length>=6, reward:'rigmult+0.2', rewardText:'+20% Output' },
  { id:'e3', name:'Komplett!',      icon:'👑', desc:'Alle 10 Rig-Typen besitzen',    check:G=>Object.values(G.rigs).filter(v=>v>0).length>=10, reward:'rigmult+0.5', rewardText:'+50% Output' },

  // ── Staff ────────────────────────────────────────────────
  { id:'f1', name:'Erster Hire',    icon:'🤝', desc:'Ersten Mitarbeiter eingestellt', check:G=>Object.values(G.staff).reduce((a,b)=>a+b,0)>=1,  reward:null,          rewardText:'Team!'     },
  { id:'f2', name:'Klein-Team',     icon:'👥', desc:'5 Mitarbeiter gesamt',           check:G=>Object.values(G.staff).reduce((a,b)=>a+b,0)>=5,  reward:'passive+0.5', rewardText:'+$0.50/s'  },
  { id:'f3', name:'Startup',        icon:'🚀', desc:'20 Mitarbeiter gesamt',          check:G=>Object.values(G.staff).reduce((a,b)=>a+b,0)>=20, reward:'passive+2',   rewardText:'+$2/s'     },
  { id:'f4', name:'Konzern',        icon:'🏢', desc:'44 Mitarbeiter (alle max)',       check:G=>Object.values(G.staff).reduce((a,b)=>a+b,0)>=44, reward:'passive+10',  rewardText:'+$10/s'    },

  // ── Research ────────────────────────────────────────────
  { id:'g1', name:'Neugierig',      icon:'🧪', desc:'Erste Forschung abgeschlossen',  check:G=>G.research.length>=1,  reward:null,        rewardText:'Wissen ist Macht!' },
  { id:'g2', name:'Wissenschaftler',icon:'🔬', desc:'5 Forschungen abgeschlossen',    check:G=>G.research.length>=5,  reward:'hps+0.1',   rewardText:'+10% H/s'          },
  { id:'g3', name:'Professor',      icon:'🎓', desc:'19 Forschungen abgeschlossen',    check:G=>G.research.length>=19, reward:'hps+0.5',   rewardText:'+50% H/s'          },
  { id:'g4', name:'Architekt',      icon:'🧠', desc:'Alle 21 Forschungen',             check:G=>G.research.length>=21, reward:'hps+0.8',   rewardText:'+80% H/s'          },

  // ── Streak ──────────────────────────────────────────────
  { id:'h1', name:'Treu I',         icon:'📅', desc:'3 Tage Streak',                  check:G=>G.dailyStreak>=3,  reward:'passive+0.2', rewardText:'+$0.20/s' },
  { id:'h2', name:'Treu II',        icon:'🗓️', desc:'7 Tage Streak',                  check:G=>G.dailyStreak>=7,  reward:'pricemult+0.1',rewardText:'+10% Preise' },
  { id:'h3', name:'Dedication',     icon:'🏅', desc:'30 Tage Streak',                 check:G=>G.dailyStreak>=30, reward:'hps+0.5',     rewardText:'+50% H/s' },

  // ── Prestige ────────────────────────────────────────────
  { id:'i1', name:'Frischer Start', icon:'✨', desc:'Erstes Prestige durchgeführt',   check:G=>G.prestigeCount>=1, reward:null, rewardText:'Prestige I'  },
  { id:'i2', name:'Veteran',        icon:'🎖️', desc:'5× Prestige',                   check:G=>G.prestigeCount>=5, reward:null, rewardText:'Prestige V'  },

  // ── Combo ───────────────────────────────────────────────
  { id:'j1', name:'Combo!',         icon:'🔗', desc:'10× Combo erreicht',             check:G=>G.maxCombo>=10,  reward:'click+5',   rewardText:'+5 H/Klick'  },
  { id:'j2', name:'Super Combo',    icon:'💥', desc:'50× Combo erreicht',             check:G=>G.maxCombo>=50,  reward:'click+20',  rewardText:'+20 H/Klick' },
  { id:'j3', name:'Combo God',      icon:'🌀', desc:'100× Combo erreicht',            check:G=>G.maxCombo>=100, reward:'click+100', rewardText:'+100 H/Klick'},

  // ── Contracts ───────────────────────────────────────────
  { id:'k1', name:'Freelancer',     icon:'📋', desc:'Ersten Contract abgeschlossen',  check:G=>G.contractsDone>=1,  reward:null,        rewardText:'Unternehmer!'  },
  { id:'k2', name:'Contractor',     icon:'🏗️', desc:'10 Contracts abgeschlossen',     check:G=>G.contractsDone>=10, reward:'passive+1', rewardText:'+$1/s'         },
  { id:'k3', name:'Pro Contractor', icon:'🏢', desc:'50 Contracts abgeschlossen',     check:G=>G.contractsDone>=50, reward:'passive+5', rewardText:'+$5/s'         },

  // ── Spielzeit ───────────────────────────────────────────
  { id:'l1', name:'Einsteiger',     icon:'⏱️', desc:'30 Minuten gespielt',             check:G=>G.playTime>=1800,  reward:null,         rewardText:'Dabei bleiben!'  },
  { id:'l2', name:'Gamer',          icon:'🎮', desc:'5 Stunden gespielt',              check:G=>G.playTime>=18000, reward:'rigmult+0.1', rewardText:'+10% Output'     },
  { id:'l3', name:'Süchtig',        icon:'😤', desc:'24 Stunden gespielt',             check:G=>G.playTime>=86400, reward:'hps+0.2',     rewardText:'+20% H/s'        },

  // ── Meta / Ops 2.0 ──────────────────────────────────────
  { id:'m1', name:'Ops Commander I', icon:'🧭', desc:'Story-Mission 3 abschliessen',   check:G=>Number(G.storyMissionIndex||0)>=3, reward:'passive+6', rewardText:'+$6/s' },
  { id:'m2', name:'Ops Commander II',icon:'🏅', desc:'Storyline komplett abschliessen', check:G=>Number(G.storyMissionIndex||0)>=10, reward:'hps+0.35', rewardText:'+35% H/s' },
  { id:'m3', name:'Credit Master',   icon:'💳', desc:'Alle Kredite zurueckzahlen',      check:G=>(Array.isArray(G.loans)?G.loans.length:0)===0 && Number(G.totalEarned||0)>=50000, reward:'pricemult+0.12', rewardText:'+12% Preise' },
  { id:'m4', name:'Safety First',    icon:'🛡️', desc:'Versicherung 3 Tage aktiv halten',check:G=>!!G.insuranceActive && Number(G.worldDay||1)>=3, reward:'rigmult+0.15', rewardText:'+15% Rig-Output' },
  { id:'m5', name:'Grid Architect',  icon:'🏗️', desc:'Infra-Level 6 erreichen',         check:G=>Number(G.powerInfraLevel||0)>=6, reward:'hps+0.25', rewardText:'+25% H/s' },
  { id:'m6', name:'Campus Director', icon:'🏙️', desc:'Standort Tier 8 freischalten',    check:G=>Number(G.unlockedLocationTier||1)>=8, reward:'pricemult+0.18', rewardText:'+18% Preise' },
];
