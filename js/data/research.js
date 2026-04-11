// ============================================================
// DATA — Research Tree  (stark verteuerter Rebalance)
// cost: ~4-5× höher als v3
// time: ~2-3× länger als v3
// ============================================================

const RESEARCH = [
  { id:'r1',  name:'Hash Basics',         icon:'🔬', desc:'+10% H/s',                   cost:8000,      time:90,    effect:'hps+0.1',       req:[]             },
  { id:'r2',  name:'Crypto Protocols',    icon:'🔐', desc:'+20% H/s',                   cost:40000,     time:200,   effect:'hps+0.2',       req:['r1']         },
  { id:'r3',  name:'ASIC Design',         icon:'⚡', desc:'+30% H/s',                   cost:200000,    time:420,   effect:'hps+0.3',       req:['r2']         },
  { id:'r4',  name:'GPU Shaders',         icon:'🖼️', desc:'+25% H/s',                   cost:140000,    time:360,   effect:'hps+0.25',      req:['r2']         },
  { id:'r5',  name:'Quantum Algorithms',  icon:'🌀', desc:'Alle Rigs +100% H/s',        cost:3000000,   time:1200,  effect:'hps+1.0',       req:['r3','r4']    },
  { id:'r6',  name:'Market Analysis AI',  icon:'📊', desc:'Marktpreise +30%',           cost:350000,    time:600,   effect:'price+0.3',     req:['r2']         },
  { id:'r7',  name:'DeFi Protocols',      icon:'🏦', desc:'Passiv +$5/s',               cost:1200000,   time:800,   effect:'passive+5',     req:['r6']         },
  { id:'r8',  name:'Blockchain 2.0',      icon:'⛓️', desc:'H/s +50% & Preise +20%',    cost:8000000,   time:2400,  effect:'both+0.5+0.2',  req:['r5','r7']    },
  { id:'r9',  name:'Neural Mining',       icon:'🧠', desc:'Click-Power ×3',             cost:2500000,   time:1600,  effect:'click*3',       req:['r5']         },
  { id:'r10', name:'Singularity',         icon:'🌌', desc:'ALLES ×2',                   cost:100000000, time:4800,  effect:'all*2',         req:['r8','r9']    },
  { id:'r11', name:'Energy Efficiency',   icon:'🔋', desc:'Rig-Kosten −15%',           cost:300000,    time:480,   effect:'rigcost-0.15',  req:['r3']         },
  { id:'r12', name:'Crypto Economics',    icon:'📈', desc:'Marktpreise +40%',           cost:2000000,   time:1200,  effect:'price+0.4',     req:['r6','r7']    },
  { id:'r13', name:'Hash Compression',    icon:'🗜️', desc:'Hash-zu-Coin Rate ×1.5',    cost:600000,    time:720,   effect:'conv+0.5',      req:['r3','r4']    },
  { id:'r14', name:'Darknet Exchange',    icon:'🕶️', desc:'Marktpreise +60%',           cost:6000000,   time:2000,  effect:'price+0.6',     req:['r12']        },
  { id:'r15', name:'Algorithmus-Optimierung', icon:'🧮', desc:'Mining-Schwierigkeit −10% (hilft gegen Prestige-Penalty)', cost:8000000, time:2800, effect:'diffReduce', req:['r13','r8'] },
  { id:'r16', name:'Quantum Entanglement',    icon:'🔮', desc:'Zweite Algorithmus-Opt.: −weitere 10% Schwierigkeit',      cost:50000000, time:4200, effect:'diffReduce', req:['r15','r10'] },
  { id:'r17', name:'Autonomous Grid',         icon:'🏗️', desc:'Alle Rigs +80% H/s',                                     cost:140000000, time:5600, effect:'hps+0.8', req:['r16'] },
  { id:'r18', name:'Institutional Desk',      icon:'🏦', desc:'Marktpreise +70%',                                       cost:220000000, time:6400, effect:'price+0.7', req:['r14','r16'] },
  { id:'r19', name:'Zero-Latency Core',       icon:'⚛️', desc:'ALLES ×2',                                               cost:650000000, time:9000, effect:'all*2', req:['r17','r18'] },
  { id:'r20', name:'Stability Oracle',        icon:'📡', desc:'Marktpreise +55% und robustere Preisboeden',            cost:820000000, time:9800, effect:'price+0.55', req:['r19'] },
  { id:'r21', name:'Synthetic Runtime',       icon:'🧪', desc:'Alle Rigs +120% H/s',                                    cost:980000000, time:11000, effect:'hps+1.2', req:['r19','r20'] },
  { id:'r22', name:'Orbital Scheduling',      icon:'🛰️', desc:'Alle Rigs +140% H/s',                                   cost:1200000000, time:11800, effect:'hps+1.4', req:['r21'] },
  { id:'r23', name:'Macro Liquidity Engine',  icon:'🌊', desc:'Marktpreise +85%',                                       cost:1450000000, time:12600, effect:'price+0.85', req:['r21'] },
  { id:'r24', name:'Entropy Dampener',        icon:'🧭', desc:'Dritte Algorithmus-Opt.: −weitere 10% Schwierigkeit',    cost:1680000000, time:13400, effect:'diffReduce', req:['r22','r23'] },
  { id:'r25', name:'Interstellar Pipeline',   icon:'🌠', desc:'ALLES ×2',                                               cost:2100000000, time:14500, effect:'all*2', req:['r24'] },
  { id:'r26', name:'Dyson Control Stack',     icon:'☀️', desc:'Alle Rigs +190% H/s',                                   cost:2600000000, time:16000, effect:'hps+1.9', req:['r25'] },
  { id:'r27', name:'Post-Quantum Cooling',    icon:'🧊', desc:'Alle Rigs +220% H/s',                                   cost:3200000000, time:17200, effect:'hps+2.2', req:['r26'], minPrestige:2 },
  { id:'r28', name:'Liquidity Nexus',         icon:'🌊', desc:'Marktpreise +110%',                                      cost:3800000000, time:17800, effect:'price+1.1', req:['r26'], minPrestige:2 },
  { id:'r29', name:'Temporal Kernel',         icon:'⏱️', desc:'ALLES ×2',                                               cost:5200000000, time:19000, effect:'all*2', req:['r27','r28'], minPrestige:3 },
  { id:'r30', name:'Helios Swarm Protocol',   icon:'🛰️', desc:'Alle Rigs +280% H/s',                                   cost:7000000000, time:21000, effect:'hps+2.8', req:['r29'], minPrestige:4 },
  { id:'r31', name:'Macro Sovereign Engine',  icon:'👑', desc:'Marktpreise +160%',                                      cost:9500000000, time:23000, effect:'price+1.6', req:['r29','r30'], minPrestige:5 },
];
