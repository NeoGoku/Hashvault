// ============================================================
// SYSTEM — Markt: Coins verkaufen
// ============================================================

function ensureAutoSellCoinState() {
  if (!G.autoSellCoins || typeof G.autoSellCoins !== 'object') G.autoSellCoins = {};
  Object.keys(COIN_DATA || { BTC:1, ETH:1, LTC:1, BNB:1 }).forEach((coin) => {
    if (typeof G.autoSellCoins[coin] !== 'boolean') G.autoSellCoins[coin] = false;
  });
}
window.ensureAutoSellCoinState = ensureAutoSellCoinState;

function isAutoSellCoinEnabled(coin) {
  ensureAutoSellCoinState();
  const key = String(coin || 'BTC').toUpperCase();
  return !!G.autoSellCoins[key];
}
window.isAutoSellCoinEnabled = isAutoSellCoinEnabled;

function toggleAutoSellCoin(coin, forcedState) {
  const key = String(coin || 'BTC').toUpperCase();
  if (!COIN_DATA[key]) return;
  ensureAutoSellCoinState();
  const next = (typeof forcedState === 'boolean') ? forcedState : !G.autoSellCoins[key];
  G.autoSellCoins[key] = next;
  // Legacy-Global deaktivieren, sobald pro-Coin gesteuert wird.
  G.autoSell = false;
  notify('🔄 Auto-Sell ' + key + ': ' + (next ? 'AN' : 'AUS'), next ? 'success' : 'warning');
  renderMarket();
}
window.toggleAutoSellCoin = toggleAutoSellCoin;

function sellCoins(coin, fraction) {
  const balance = Math.max(0, Number((G.coins || {})[coin] || 0));
  const reserve = (typeof getCoinReserve === 'function') ? getCoinReserve(coin) : 0;
  const available = (typeof getAvailableCoinBalance === 'function')
    ? getAvailableCoinBalance(coin)
    : Math.max(0, balance - reserve);
  let amt;
  if (fraction === 1) {
    amt = Math.floor(available * 100) / 100;
  } else {
    amt = Math.floor(available * fraction * 100) / 100;
  }

  if (amt <= 0) {
    notify('Keine frei verkaufbaren ' + coin + ' vorhanden (Reserve aktiv).', 'error');
    return;
  }

  const earned  = amt * G.prices[coin] * G._priceMult;
  G.coins[coin] -= amt;
  G.usd         += earned;
  G.totalEarned += earned;

  // Daily-Challenge Counter fuer Verkaufstypen pflegen
  if (!G.challengeProgress) G.challengeProgress = {};
  (G.dailyChallenges || []).forEach(ch => {
    const def = window.CHALLENGES ? window.CHALLENGES[ch.id] : null;
    if (!def || ch.completed) return;
    if (def.type === 'selling') {
      G.challengeProgress[ch.id] = (G.challengeProgress[ch.id] || 0) + amt;
    } else if (def.type === 'selling_value') {
      G.challengeProgress[ch.id] = (G.challengeProgress[ch.id] || 0) + earned;
    }
  });

  notify('💰 ' + fmtNum(amt, 4) + ' ' + coin + ' → $' + fmtNum(earned), 'gold');
  renderMarket();
}
