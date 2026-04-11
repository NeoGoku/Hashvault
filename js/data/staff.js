// ============================================================
// DATA — Staff / Mitarbeiter  (stark verteuerter Rebalance)
// costBase: ~3× höher als v3
// costMult: höher → Skalierung steiler
// ============================================================

const STAFF = [
  {
    id:'dev',    name:'Developer',       icon:'👨‍💻',
    role:'Software Engineer',
    desc:'+5% H/s pro eingestellter Person',
    costBase: 10000,  costMult: 2.6, maxHire: 10, wagePerDay: 90,
  },
  {
    id:'trader', name:'Crypto Trader',   icon:'📈',
    role:'Market Analyst',
    desc:'+3% auf Verkaufspreise pro Person',
    costBase: 50000,  costMult: 3.0, maxHire: 8, wagePerDay: 170,
  },
  {
    id:'sec',    name:'Security Expert', icon:'🔒',
    role:'Cyber Security',
    desc:'Passiv +$4/s pro Person',
    costBase: 80000,  costMult: 2.6, maxHire: 5, wagePerDay: 260,
  },
  {
    id:'maint',  name:'Techniker',       icon:'🔧',
    role:'Hardware Maintenance',
    desc:'+8% H/s pro eingestellter Person',
    costBase: 25000,  costMult: 2.2, maxHire: 12, wagePerDay: 120,
  },
  {
    id:'quant',  name:'Quant Analyst',   icon:'🧮',
    role:'Algorithm Specialist',
    desc:'+12% auf gesamtes Passiveinkommen',
    costBase: 200000, costMult: 3.5, maxHire: 5, wagePerDay: 420,
  },
  {
    id:'pm',     name:'Project Manager', icon:'📋',
    role:'Operations Lead',
    desc:'Contract-Belohnungen +25% pro Person',
    costBase: 150000, costMult: 3.0, maxHire: 4, wagePerDay: 360,
  },
  {
    id:'dataeng', name:'Data Engineer',  icon:'🧠',
    role:'Pipeline & Telemetry',
    desc:'+18% Forschungsgeschwindigkeit und +3% H/s pro Person',
    costBase: 480000, costMult: 2.9, maxHire: 6, wagePerDay: 620, minPrestige: 2,
  },
  {
    id:'opsdir',  name:'Ops Director',   icon:'🧭',
    role:'Operations Strategy',
    desc:'Contract-Belohnungen +12% und +$6/s passiv pro Person',
    costBase: 900000, costMult: 3.05, maxHire: 4, wagePerDay: 920, minPrestige: 3,
  },
  {
    id:'cfo',     name:'CFO',            icon:'🏛️',
    role:'Treasury & Markets',
    desc:'+8% Marktpreise pro Person',
    costBase: 1600000, costMult: 3.2, maxHire: 3, wagePerDay: 1450, minPrestige: 4,
  },
];
