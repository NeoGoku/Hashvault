// ============================================================
// NPC Traders - taeglich wechselnde Deals
// ============================================================

window.NPC_TRADERS = [
  {
    id: 'npc_luna',
    name: 'Luna',
    title: 'Coin Broker',
    emoji: '👩',
    personality: 'Ich kenne jeden Deal im Markt...',
    dealTypes: ['coin_cash', 'coin_cash', 'chip_discount']
  },
  {
    id: 'npc_mark',
    name: 'Mark',
    title: 'Energy Dealer',
    emoji: '👨‍💼',
    personality: 'Energie ist Geld, und ich hab Energie.',
    dealTypes: ['energy_restore', 'energy_restore', 'rig_mod']
  },
  {
    id: 'npc_crypto',
    name: 'Crypto',
    title: 'Mystery Trader',
    emoji: '🕵️',
    personality: 'Random ist mein Name, Profit mein Spiel.',
    dealTypes: ['wildcard', 'wildcard', 'chips_bulk']
  },
  {
    id: 'npc_ivy',
    name: 'Ivy',
    title: 'Quant Seller',
    emoji: '📊',
    personality: 'Ich hasse Spread. Ich liebe Kanten.',
    dealTypes: ['coin_cash', 'coin_cash', 'chips_bulk']
  },
  {
    id: 'npc_nova',
    name: 'Nova',
    title: 'Boost Engineer',
    emoji: '🧪',
    personality: 'Kurzzeit-Boosts sind mein Spezialgebiet.',
    dealTypes: ['chip_discount', 'rig_mod', 'wildcard']
  },
  {
    id: 'npc_otto',
    name: 'Otto',
    title: 'Rig Mechanic',
    emoji: '🔧',
    personality: 'Wenn es heiss laeuft, ruf mich.',
    dealTypes: ['energy_restore', 'rig_mod', 'energy_restore']
  },
  {
    id: 'npc_kira',
    name: 'Kira',
    title: 'Bulk Merchant',
    emoji: '🎒',
    personality: 'Masse statt Klasse? Ich biete beides.',
    dealTypes: ['chips_bulk', 'coin_cash', 'chip_discount']
  }
];

window.DEAL_TEMPLATES = {
  coin_cash: (coin, multiplier, maxCoins) => ({
    type: 'coin_cash',
    title: coin + ' zu Sonderkurs',
    description: multiplier > 1
      ? '+' + Math.round((multiplier - 1) * 100) + '% Gewinn'
      : Math.round((1 - multiplier) * 100) + '% Abschlag',
    coin,
    multiplier,
    maxCoins
  }),

  chip_discount: (discount) => ({
    type: 'chip_discount',
    title: 'Chip-Flash-Sale',
    description: discount + '% Rabatt auf Chip-Kaeufe',
    discount,
    duration: 300
  }),

  energy_restore: (rigId, rigName, amount, cost) => ({
    type: 'energy_restore',
    title: 'Energiepaket',
    description: rigName + ' + ' + amount + '% Energie',
    rigId,
    amount,
    cost
  }),

  rig_mod: (modId, modName, cost) => ({
    type: 'rig_mod_unlock',
    title: 'Mod Deal',
    description: modName + ' freischalten',
    modId,
    modName,
    cost
  }),

  chips_bulk: (count, discount, basePrice) => ({
    type: 'chips_bulk',
    title: count + 'x Mystery Chips',
    description: discount + '% Rabatt auf Batch-Kauf',
    count,
    discount,
    basePrice
  }),

  wildcard: (seed) => {
    const pool = [
      { title: '$5k Airdrop', description: 'Sofortcash', reward: { cash: 5000 }, type: 'wildcard' },
      { title: 'Hash-Boost', description: '+25% Hash fuer 20 Min', buff: 1.25, duration: 1200, type: 'wildcard' },
      { title: 'Mystery Chip', description: '1 zufaelliger Consumable Chip', reward: { chip: true }, type: 'wildcard' }
    ];
    return pool[seed % pool.length];
  }
};

function generateNPCDealsForDay() {
  const day = Math.floor(Date.now() / 86400000);
  const deals = {};

  const rigList = (window.RIGS || []);
  const rigIds = rigList.map(r => r.id);
  const rigNameById = {};
  rigList.forEach(r => { rigNameById[r.id] = r.name; });

  const modIds = Object.keys(window.RIG_MODS || {});
  const modNameById = {};
  modIds.forEach(id => { modNameById[id] = window.RIG_MODS[id].name; });

  window.NPC_TRADERS.forEach((npc, idx) => {
    const seed = (day * 37 + idx * 17) % 997;
    const dealType = npc.dealTypes[seed % npc.dealTypes.length];
    let deal = null;

    if (dealType === 'coin_cash') {
      const coins = ['BTC', 'ETH', 'LTC', 'BNB'];
      const coin = coins[seed % coins.length];
      const mult = 0.82 + ((seed * 7) % 37) / 100; // 0.82 - 1.18
      const maxCoins = 1 + ((seed * 3) % 5); // 1-5
      deal = window.DEAL_TEMPLATES.coin_cash(coin, mult, maxCoins);
    } else if (dealType === 'chip_discount') {
      deal = window.DEAL_TEMPLATES.chip_discount(10 + ((seed * 5) % 31)); // 10-40%
    } else if (dealType === 'energy_restore') {
      const rid = rigIds.length ? rigIds[seed % rigIds.length] : 'usb';
      const rname = rigNameById[rid] || rid;
      const amount = 20 + ((seed * 11) % 61); // 20-80
      const cost = 3000 + ((seed * 13) % 12001); // 3k-15k
      deal = window.DEAL_TEMPLATES.energy_restore(rid, rname, amount, cost);
    } else if (dealType === 'rig_mod') {
      const modId = modIds.length ? modIds[seed % modIds.length] : null;
      const modName = modNameById[modId] || 'Unbekannte Mod';
      const cost = 4000 + ((seed * 19) % 12001); // 4k-16k
      deal = window.DEAL_TEMPLATES.rig_mod(modId, modName, cost);
    } else if (dealType === 'chips_bulk') {
      const count = 2 + ((seed * 2) % 5); // 2-6
      const discount = 10 + ((seed * 3) % 19); // 10-28%
      const basePrice = count * 90;
      deal = window.DEAL_TEMPLATES.chips_bulk(count, discount, basePrice);
    } else if (dealType === 'wildcard') {
      deal = window.DEAL_TEMPLATES.wildcard(seed);
    }

    deals[npc.id] = deal;
  });

  return deals;
}
