// ============================================================
// DATA — Mining Rigs
// RIG_SCALE: First-Run-freundlicher fuer langfristige Progression
// ============================================================

const RIG_SCALE = 1.085;

const RIGS = [
  {
    id:'usb',   name:'USB Miner',     icon:'🔌',
    desc:'Einfacher USB-Stick Miner – der erste Schritt ins Mining.',
    hps: 0.4,    baseCost: 30,         powerW: 40,    color:'r0', unlock: 0,
  },
  {
    id:'rpi',   name:'Raspberry Pi',  icon:'🍓',
    desc:'Kleiner aber effizienter Single-Board-Computer.',
    hps: 2.5,    baseCost: 500,        powerW: 120,   color:'r1', unlock: 3,
  },
  {
    id:'gpu1',  name:'Gaming-PC',     icon:'🖥️',
    desc:'Consumer-GPU – erster Schritt in ernsthaftes Mining.',
    hps: 12,     baseCost: 5000,       powerW: 900,   color:'r2', unlock: 10,
  },
  {
    id:'asic1', name:'ASIC Miner',    icon:'⚡',
    desc:'Spezialisierter ASIC-Chip – nur fürs Mining gebaut.',
    hps: 65,     baseCost: 36000,      powerW: 1800,  color:'r3', unlock: 22,
  },
  {
    id:'gpu4',  name:'GPU Array',     icon:'🔲',
    desc:'4-GPU-Farm mit professionellem Rack-System.',
    hps: 320,    baseCost: 240000,     powerW: 5500,  color:'r4', unlock: 40,
  },
  {
    id:'asic8', name:'ASIC Cluster',  icon:'🏭',
    desc:'8-ASIC-Cluster für industrielles Mining.',
    hps: 1600,   baseCost: 1450000,    powerW: 13000, color:'r5', unlock: 65,
  },
  {
    id:'srv',   name:'Server Farm',   icon:'🌐',
    desc:'Dediziertes Rechenzentrum mit Hochleistungs-CPUs.',
    hps: 8000,   baseCost: 8500000,    powerW: 24000, color:'r6', unlock: 95,
  },
  {
    id:'qc',    name:'Quantum Core',  icon:'🌀',
    desc:'Quantencomputer-Einheit der nächsten Generation.',
    hps: 50000,  baseCost: 65000000,   powerW: 60000, color:'r7', unlock: 140,
  },
  {
    id:'aic',   name:'AI Cluster',    icon:'🤖',
    desc:'Hochdichtes KI-Cluster mit optimierten Hash-Kernen.',
    hps: 210000, baseCost: 420000000,  powerW: 92000, color:'r7', unlock: 190,
  },
  {
    id:'fnx',   name:'Fusion Node',   icon:'☢️',
    desc:'Hypereffizienter Fusion-Node fuer Endgame-Farmen.',
    hps: 950000, baseCost: 2400000000, powerW: 210000, color:'r7', unlock: 240,
  },
  {
    id:'orb',   name:'Orbital Forge', icon:'🛰️',
    desc:'Orbitale Hash-Cluster mit extrem hoher Parallelitaet.',
    hps: 3800000, baseCost: 9600000000, powerW: 380000, color:'r7', unlock: 300,
  },
  {
    id:'dyx',   name:'Dyson Mesh',    icon:'🌞',
    desc:'Sternennaehe-Rechenmesh fuer Ultra-Endgame-Durchsatz.',
    hps: 14000000, baseCost: 48000000000, powerW: 750000, color:'r7', unlock: 360,
  },
];
