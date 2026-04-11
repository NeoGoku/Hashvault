// ============================================================
// DATA — Rig-Crew (manuelle Betreuung pro Rig-Typ)
// ============================================================

window.RIG_STAFF_TIERS = [
  {
    id: 'junior',
    name: 'Aushilfe',
    icon: '🧑‍🔧',
    rigsPerUnit: 6,
    repairPerSec: 0.07,
    crashReduction: 0.02,
    wagePerDay: 85,
    hireBaseCost: 340,
    hireCostMult: 1.58,
  },
  {
    id: 'technician',
    name: 'Techniker',
    icon: '🔧',
    rigsPerUnit: 11,
    repairPerSec: 0.14,
    crashReduction: 0.045,
    wagePerDay: 220,
    hireBaseCost: 1150,
    hireCostMult: 1.68,
  },
  {
    id: 'senior',
    name: 'Senior Tech',
    icon: '🛠️',
    rigsPerUnit: 18,
    repairPerSec: 0.24,
    crashReduction: 0.075,
    wagePerDay: 500,
    hireBaseCost: 3100,
    hireCostMult: 1.76,
  },
  {
    id: 'lead',
    name: 'Lead Engineer',
    icon: '👷',
    rigsPerUnit: 27,
    repairPerSec: 0.34,
    crashReduction: 0.11,
    wagePerDay: 980,
    hireBaseCost: 7300,
    hireCostMult: 1.82,
  },
  {
    id: 'elite',
    name: 'Elite Specialist',
    icon: '🧠',
    rigsPerUnit: 38,
    repairPerSec: 0.46,
    crashReduction: 0.16,
    wagePerDay: 1900,
    hireBaseCost: 15500,
    hireCostMult: 1.90,
  },
];

function getRigStaffTierById(tierId) {
  return (window.RIG_STAFF_TIERS || []).find((x) => x.id === tierId) || null;
}

window.getRigStaffTierById = getRigStaffTierById;
