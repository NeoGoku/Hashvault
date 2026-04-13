// ============================================================
// DATA — Zufällige Markt- & Mining-Events
// w = Gewichtung (höher = häufiger)
// fx.t = Effekt-Typ:
//   'priceAll'  → G.activeBoosts evPriceBoost (mult, dur Sek)
//   'hash'      → G.activeBoosts evHashBoost   (mult, dur Sek)
//   'allBoost'  → G.activeBoosts evAllBoost    (mult, dur Sek)
//   'price1'    → sofortige Preis-Änderung einer Coin (m = Faktor)
//   'freeCoins' → sofort Coins in Wallet (coin, amount)
//   'cash'      → sofort USD (amount)
//   'none'      → nur Nachricht, kein Effekt
// ============================================================

const EVENTS = [

  // ── 📈 Preis-Boosts ────────────────────────────────────────
  {
    id:'ev_elon_btc', w:2,
    msg:'📱 Elon Musk postet "Bitcoin ist die Zukunft 🚀" — BTC-Preis explodiert!',
    fx:{ t:'price1', coin:'BTC', m:1.8 }
  },
  {
    id:'ev_eth_upgrade', w:2,
    msg:'🔧 Ethereum 4.0 Mainnet-Upgrade live — ETH-Kurs schießt durch die Decke!',
    fx:{ t:'price1', coin:'ETH', m:1.7 }
  },
  {
    id:'ev_ltc_whale', w:2,
    msg:'🐋 Mega-Wallet kauft 800.000 LTC auf — Preis springt +130%!',
    fx:{ t:'price1', coin:'LTC', m:1.6 }
  },
  {
    id:'ev_bnb_burn', w:2,
    msg:'🔥 BNB Quarterly Token-Burn abgeschlossen — Angebot sinkt, Preis +90%!',
    fx:{ t:'price1', coin:'BNB', m:1.5 }
  },
  {
    id:'ev_bull', w:2,
    msg:'🐂 Globaler Bullenmarkt! Alle Cryptos gleichzeitig im grünen Bereich!',
    fx:{ t:'priceAll', m:1.35, dur:50 }
  },
  {
    id:'ev_etf', w:1,
    msg:'📊 SEC genehmigt All-Crypto-ETF — Institutionen kaufen massiv!',
    fx:{ t:'priceAll', m:1.45, dur:60 }
  },

  // ── 📉 Markt-Crashes ───────────────────────────────────────
  {
    id:'ev_crash', w:2,
    msg:'📉 Schwarzer Crypto-Dienstag! Alle Preise brechen massiv ein!',
    fx:{ t:'priceAll', m:0.40, dur:30 }
  },
  {
    id:'ev_fud', w:1,
    msg:'😱 China verbietet Crypto erneut — Panikverkäufe überfluten den Markt!',
    fx:{ t:'priceAll', m:0.50, dur:25 }
  },
  {
    id:'ev_exchange_hack', w:1,
    msg:'🚨 Größter Exchange gehackt! $2 Mrd. gestohlen — Markt kollabiert!',
    fx:{ t:'priceAll', m:0.55, dur:20 }
  },

  // ── ⛏️ Mining-Events ────────────────────────────────────────
  {
    id:'ev_pool_bonus', w:3,
    msg:'⛏️ Global Mining Pool-Bonus aktiv — +55% Hash-Rate fuer 60 Sekunden!',
    fx:{ t:'hash', m:1.55, dur:60 }
  },
  {
    id:'ev_algorithm', w:1,
    msg:'🔬 Neuer Mining-Algorithmus entdeckt — +80% H/s für 2 Minuten!',
    fx:{ t:'hash', m:1.45, dur:120 }
  },
  {
    id:'ev_overheat', w:2,
    msg:'🌡️ Alle Rigs überhitzen! Hash-Rate −50% für 30 Sekunden. Kühlsystem versagt!',
    fx:{ t:'hash', m:0.5, dur:30 }
  },
  {
    id:'ev_powercut', w:1,
    msg:'⚡ Regionaler Stromausfall! Mining fast komplett ausgefallen für 20 Sekunden.',
    fx:{ t:'hash', m:0.05, dur:20 }
  },
  {
    id:'ev_hall_airflow', w:2,
    minLocationTier: 4,
    msg:'🏗️ Hallen-Luftfuehrung optimiert: Mining-Temperatur stabil, +35% H/s fuer 70 Sekunden!',
    fx:{ t:'hash', m:1.35, dur:70 }
  },
  {
    id:'ev_dc_enterprise', w:1,
    minLocationTier: 7,
    msg:'🏢 Enterprise-Deal im Datacenter: Premium-Abnehmer zahlen hoehere Kurse (+22% fuer 65 Sekunden).',
    fx:{ t:'priceAll', m:1.22, dur:65 }
  },
  {
    id:'ev_home_noise', w:2,
    maxLocationTier: 2,
    msg:'🏠 Wohngebiet-Beschwerde: Drosselung im Heimnetz (-22% H/s fuer 45 Sekunden).',
    fx:{ t:'hash', m:0.78, dur:45 }
  },
  {
    id:'ev_campus_grid_credit', w:1,
    locationIds: ['dc_campus', 'mega_farm'],
    msg:'🌉 Campus-Lastmanagement greift: Stromgutschrift und stabilere Kurse (+30% Preise fuer 55 Sekunden).',
    fx:{ t:'priceAll', m:1.30, dur:55 }
  },
  {
    id:'ev_dc_cooling_mesh', w:1,
    minLocationTier: 7,
    msg:'🧊 Datacenter-Cooling-Mesh aktiv: Haltbarkeit stabilisiert sich (+45% H/s fuer 70 Sekunden).',
    fx:{ t:'hash', m:1.45, dur:70 }
  },
  {
    id:'ev_mega_farm_spot_bid', w:1,
    minLocationTier: 9,
    msg:'🏭 Mega-Farm Spot-Bid gewonnen: institutioneller Schub (+38% Preise fuer 75 Sekunden).',
    fx:{ t:'priceAll', m:1.38, dur:75 }
  },
  {
    id:'ev_market_circuit_breaker', w:1,
    msg:'🛡️ Market Circuit Breaker: Panik stoppt, Preise stabilisieren sich.',
    fx:{ t:'priceAll', m:1.12, dur:40 }
  },

  // ── 🚀 All-Boosts ──────────────────────────────────────────
  {
    id:'ev_lucky', w:1,
    msg:'🍀 Glueckstag! Alle Mining-Einnahmen UND Marktpreise steigen fuer 90s!',
    fx:{ t:'allBoost', m:1.45, dur:90 }
  },
  {
    id:'ev_fomo', w:1,
    msg:'😤 FOMO greift um sich! Trader kaufen alles — Hashes & Preise steigen fuer 75s!',
    fx:{ t:'allBoost', m:1.30, dur:75 }
  },

  // ── 🎁 Sofort-Boni ─────────────────────────────────────────
  {
    id:'ev_airdrop_btc', w:2,
    msg:'🎁 Offizieller BTC-Airdrop! 1 Bitcoin landet direkt in deiner Wallet!',
    fx:{ t:'freeCoins', coin:'BTC', amount:1 }
  },
  {
    id:'ev_airdrop_eth', w:2,
    msg:'🎁 ETH Foundation Airdrop! 3 Ethereum direkt fuer dich!',
    fx:{ t:'freeCoins', coin:'ETH', amount:3 }
  },
  {
    id:'ev_investor', w:2,
    msg:'💰 Venture-Capital-Investor interessiert! $5.000 Bonus-Kapital ueberwiesen.',
    fx:{ t:'cash', amount:5000 }
  },
  {
    id:'ev_grant', w:1,
    msg:'🏛️ Staatlicher Mining-Foerderantrag genehmigt! $12.000 Subvention erhalten.',
    fx:{ t:'cash', amount:12000 }
  },

  // ── 📰 Neutrale Nachrichten ────────────────────────────────
  {
    id:'ev_n1', w:5,
    msg:'📰 Bloomberg: "Bitcoin-Kurs könnte $500.000 erreichen" — Analysten uneins.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n2', w:5,
    msg:'🌍 El Salvador erweitert Vulkan-Bitcoin-Mining auf 10 weitere Standorte.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n3', w:5,
    msg:'⚡ Studie: Globales Crypto-Mining nutzt jetzt 76% erneuerbare Energie.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n4', w:4,
    msg:'🏦 BlackRock, Fidelity & Vanguard erhöhen gemeinsam Bitcoin-Bestände.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n5', w:4,
    msg:'🔐 Bitmain kündigt 3nm ASIC-Chip an — 40% effizienter als aktuelle Generation.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n6', w:4,
    msg:'🐋 Whale Alert: 50.000 BTC bewegt — Community rätselt über Absichten.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n7', w:4,
    msg:'🧾 On-Chain-Report: Transaktionsgebuehren sinken, Retail-Aktivitaet zieht leicht an.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n8', w:4,
    msg:'🏭 Hardware-News: Neue GPU-Serie angekuendigt, Effizienzwerte sorgen fuer Debatten.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n9', w:3,
    msg:'🌐 Mining-Pools melden hoehere Uptime — Hashrate verteilt sich breiter.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n10', w:3,
    msg:'🏦 Desk-Kommentar: Institutionelle Zufluesse bleiben stabil, Risikoappetit neutral.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n11', w:3,
    msg:'🔍 Analysten-Call: Marktstruktur wirkt gesuender, kurzfristig aber weiter volatil.',
    fx:{ t:'none' }
  },
  {
    id:'ev_n12', w:3,
    msg:'📡 Macro-Ticker: Zinserwartungen unveraendert, Krypto reagiert gemischt.',
    fx:{ t:'none' }
  },
];
