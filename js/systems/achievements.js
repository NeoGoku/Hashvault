// ============================================================
// SYSTEM — Achievements prüfen & freischalten
// ============================================================

function checkAchievements() {
  let newUnlocks = false;

  ACHIEVEMENTS.forEach(a => {
    if (G.achievements.includes(a.id)) return;
    try {
      if (a.check(G)) {
        G.achievements.push(a.id);
        if (typeof window.notifyAchievement === 'function') {
          notifyAchievement(
            '🏆 Achievement: ' + a.name + (a.rewardText ? ' (' + a.rewardText + ')' : ''),
            a.id
          );
        } else {
          notify(
            '🏆 Achievement: ' + a.name + (a.rewardText ? ' (' + a.rewardText + ')' : ''),
            'gold'
          );
        }
        computeMultipliers();
        newUnlocks = true;
      }
    } catch (e) {
      // Fehlersichere Prüfung — silent fail
    }
  });

  if (newUnlocks) {
    renderAchievements();
    const badge = document.getElementById('ach-badge');
    if (badge) badge.style.display = 'inline';
  }
}
