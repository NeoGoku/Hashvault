// ============================================================
// UI — Notifications, Float-Text, Modal, Formatierungs-Helfer
// Geladen VOR state.js — kein Zugriff auf G nötig.
// ============================================================

let __hvAudioCtx = null;
function getUiAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (__hvAudioCtx) return __hvAudioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    __hvAudioCtx = new Ctx();
    return __hvAudioCtx;
  } catch {
    return null;
  }
}

function playUiTone(type) {
  const ctx = getUiAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = type === 'error' ? 170 : type === 'gold' ? 520 : type === 'success' ? 420 : 300;
  osc.type = type === 'error' ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// ── Zahlen formatieren ───────────────────────────────────────
function fmtNum(n, dec = 0) {
  if (n == null || isNaN(n)) return '0';
  if (n < 0) return '-' + fmtNum(-n, dec);
  if (n >= 1e18) return (n / 1e18).toFixed(1) + 'Qi';
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'Qa';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  if (dec > 0)   return n.toFixed(dec);
  return Math.floor(n).toLocaleString();
}

// ── Zeit formatieren ─────────────────────────────────────────
function fmtTime(s) {
  if (s < 60)    return Math.floor(s) + 's';
  if (s < 3600)  return Math.floor(s / 60) + 'm ' + Math.floor(s % 60) + 's';
  if (s < 86400) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h';
}

// ── Toast-Notification ───────────────────────────────────────
function notify(msg, type = 'info', opts = null) {
  const container = document.getElementById('notif-container');
  if (!container) return;
  const options = (opts && typeof opts === 'object' && !Array.isArray(opts)) ? opts : {};
  const timeoutMs = Number.isFinite(opts) ? Number(opts) : Math.max(800, Number(options.duration || 3500));

  const el = document.createElement('div');
  el.className = 'notif' +
    (type === 'gold'    ? ' gold'    :
     type === 'success' ? ' success' :
     type === 'error'   ? ' error'   : '');
  el.textContent = msg;
  if (typeof options.onClick === 'function') {
    el.classList.add('clickable');
    el.title = options.title || 'Zum Detail springen';
    el.addEventListener('click', () => {
      try { options.onClick(); } catch {}
      el.remove();
    });
  }
  container.appendChild(el);

  // Auto-fade nach 3.5s
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity .4s';
    setTimeout(() => el.remove(), 400);
  }, timeoutMs);

  // Max 5 gleichzeitige Toasts
  while (container.children.length > 5) {
    container.removeChild(container.firstChild);
  }

  playUiTone(type);
}

function notifyAchievement(msg, achievementId) {
  notify(msg, 'gold', {
    duration: 5500,
    title: 'Achievement anzeigen',
    onClick: () => {
      if (typeof window.focusAchievementById === 'function') {
        window.focusAchievementById(achievementId);
      }
    },
  });
}
window.notifyAchievement = notifyAchievement;

// ── Float-Text beim Klicken ──────────────────────────────────
function floatText(x, y, text) {
  const el = document.createElement('div');
  el.className   = 'float-text';
  el.textContent = text;
  el.style.left  = (x - 20) + 'px';
  el.style.top   = (y - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ── Bestätigungs-Modal ───────────────────────────────────────
function showModal(title, text, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-text').textContent  = text;
  overlay.classList.add('show');

  const close = () => overlay.classList.remove('show');
  document.getElementById('modal-confirm').onclick = () => { close(); onConfirm(); };
  document.getElementById('modal-cancel').onclick  = close;
}
