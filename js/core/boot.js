// ============================================================
// CORE — Boot / Startmenue / Save Slots
// ECHTES Laden: Dateien pruefen + JS-Module dynamisch laden
// ============================================================

window.HV_BOOT_MANAGED = true;

const BOOT_ASSET_VERSION = '20260401v2';
const BOOT_SLOT_COUNT = 3;
const BOOT_META_KEY = 'hashvault_slots_meta_v1';
const BOOT_ACTIVE_SLOT_KEY = 'hashvault_active_slot';

const BOOT_FILE_CHECKS = [
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/animations.css',
];

const BOOT_JS_MODULES = [
  'js/data/events.js',
  'js/data/coins.js',
  'js/data/rigs.js',
  'js/data/upgrades.js',
  'js/data/research.js',
  'js/data/staff.js',
  'js/data/contracts.js',
  'js/data/achievements.js',
  'js/data/challenges.js',
  'js/data/goals.js',
  'js/data/npcTraders.js',
  'js/data/rigMods.js',
  'js/data/locations.js',
  'js/data/locationShop.js',
  'js/data/rigCrew.js',

  'js/ui/notifications.js',

  'js/core/state.js',
  'js/core/gameLoop.js',
  'js/core/save.js',

  'js/systems/mining.js',
  'js/systems/market.js',
  'js/systems/upgrades.js',
  'js/systems/research.js',
  'js/systems/staff.js',
  'js/systems/contracts.js',
  'js/systems/achievements.js',
  'js/systems/features.js',

  'js/ui/charts.js',
  'js/ui/background.js',
  'js/ui/render.js',

  'js/core/prestige.js',
  'js/main.js',
];

const BOOT_STEPS = [
  { id: 'boot-step-files', label: 'Dateien pruefen', at: 20 },
  { id: 'boot-step-struct', label: 'Strukturen laden', at: 52 },
  { id: 'boot-step-assets', label: 'Assets vorbereiten', at: 78 },
  { id: 'boot-step-ready', label: 'Startmenue bereit', at: 100 },
];

const Boot = {
  initStarted: false,
  gameStarted: false,
  progress: 0,
  ready: false,
  slots: [],
  loadedOps: 0,
  totalOps: BOOT_FILE_CHECKS.length + BOOT_JS_MODULES.length,
};

if (document.readyState !== 'loading') {
  bootInit();
} else {
  document.addEventListener('DOMContentLoaded', bootInit);
}

async function bootInit() {
  if (Boot.initStarted) return;
  Boot.initStarted = true;

  const bootRoot = document.getElementById('boot-root');
  const app = document.getElementById('app');

  if (!bootRoot || !app) {
    if (typeof window.HV_START_GAME === 'function') window.HV_START_GAME();
    return;
  }

  Boot.slots = loadBootSlots();
  bindBootEvents();
  renderBootSlots();

  try {
    await runRealLoader();
    Boot.ready = true;
    showBootMenu();
  } catch (err) {
    console.error(err);
    showBootFatal('Fehler beim Laden der Module. Details in der Konsole.');
  }
}

function bindBootEvents() {
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  on('boot-btn-new', () => {
    if (!Boot.ready) return;
    openNewGameModal();
  });
  on('boot-btn-load', () => {
    if (!Boot.ready) return;
    const preferredSlot = getPreferredLoadSlot();
    if (preferredSlot >= 0) {
      const ok = confirm('Slot ' + (preferredSlot + 1) + ' laden?');
      if (!ok) {
        switchBootTab('saves');
        showBootToast('Laden abgebrochen. Bitte Slot waehlen.');
        return;
      }
      showBootToast('Lade Slot ' + (preferredSlot + 1) + ' ...');
      loadFromSlot(preferredSlot);
      return;
    }
    switchBootTab('saves');
    showBootToast('Kein gueltiger Save gefunden. Bitte Slot waehlen.');
  });
  on('boot-btn-hard-reload', () => {
    hardReloadNoCache();
  });
  on('boot-btn-exit', () => showBootToast('Verlassen ist im Browser nicht verfuegbar.'));
  on('boot-tab-start', () => switchBootTab('start'));
  on('boot-tab-saves', () => switchBootTab('saves'));
  on('boot-back-start', () => switchBootTab('start'));
  on('boot-new-cancel', closeNewGameModal);
}

async function runRealLoader() {
  initStepRows();
  setBootProgress(0);

  // 1) Dateien pruefen (no-store)
  for (const path of BOOT_FILE_CHECKS) {
    await verifyFile(path);
    markBootOpDone();
  }

  // 2) JS-Module in definierter Reihenfolge laden
  for (const src of BOOT_JS_MODULES) {
    await loadScript(src);
    markBootOpDone();
  }

  if (typeof window.HV_START_GAME !== 'function') {
    throw new Error('HV_START_GAME wurde nicht registriert. main.js wurde nicht korrekt geladen.');
  }

  setBootProgress(100);
}

function initStepRows() {
  const stepsEl = document.getElementById('boot-step-list');
  if (!stepsEl) return;

  stepsEl.innerHTML = BOOT_STEPS.map(s => (
    '<div id="' + s.id + '" class="boot-step"><span>' + s.label + '</span><span>...</span></div>'
  )).join('');
}

async function verifyFile(path) {
  const url = assetUrl(path, true);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok && res.status !== 0) {
      throw new Error('HTTP ' + res.status + ' bei ' + path);
    }
  } catch (err) {
    // File-Protokoll kann fetch blockieren; Warnung statt Hard-Fail.
    console.warn('Datei-Pruefung uebersprungen:', path, err.message || err);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = assetUrl(src, true);
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Script konnte nicht geladen werden: ' + src));
    document.body.appendChild(script);
  });
}

function assetUrl(path, noStore) {
  const token = BOOT_ASSET_VERSION + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  if (noStore) return path + '?v=' + encodeURIComponent(token);
  return path + '?v=' + encodeURIComponent(BOOT_ASSET_VERSION);
}

function markBootOpDone() {
  Boot.loadedOps += 1;
  const ratio = Boot.totalOps > 0 ? Boot.loadedOps / Boot.totalOps : 1;
  setBootProgress(Math.min(100, Math.round(ratio * 100)));
}

function setBootProgress(pct) {
  Boot.progress = pct;

  const pTxt = document.getElementById('boot-progress-text');
  const pBar = document.getElementById('boot-progress-fill');
  if (pTxt) pTxt.textContent = pct + '%';
  if (pBar) pBar.style.width = pct + '%';

  BOOT_STEPS.forEach(step => {
    const row = document.getElementById(step.id);
    if (!row) return;
    if (pct >= step.at) {
      row.classList.add('done');
      row.lastElementChild.textContent = 'OK';
    }
  });
}

function showBootMenu() {
  const loading = document.getElementById('boot-loading-screen');
  const menu = document.getElementById('boot-start-screen');
  if (loading) loading.classList.remove('active');
  if (menu) menu.classList.add('active');

  switchBootTab('start');
  renderBootSlots();
}

function showBootFatal(message) {
  const loading = document.getElementById('boot-loading-screen');
  if (!loading) return;
  loading.classList.add('active');
  loading.innerHTML = '<div class="boot-card"><strong>Ladefehler</strong><p style="margin-top:8px;color:var(--muted);">' + esc(message) + '</p></div>';
}

function switchBootTab(tabName) {
  const showStart = tabName !== 'saves';

  const paneStart = document.getElementById('boot-pane-start');
  const paneSaves = document.getElementById('boot-pane-saves');
  const tabStart = document.getElementById('boot-tab-start');
  const tabSaves = document.getElementById('boot-tab-saves');

  if (paneStart) paneStart.classList.toggle('active', showStart);
  if (paneSaves) paneSaves.classList.toggle('active', !showStart);
  if (tabStart) tabStart.classList.toggle('active', showStart);
  if (tabSaves) tabSaves.classList.toggle('active', !showStart);
}

function openNewGameModal() {
  const input = document.getElementById('boot-nickname-input');
  const overlay = document.getElementById('boot-new-overlay');
  if (input) input.value = '';
  if (overlay) overlay.classList.add('show');
  renderBootSlots();
}

function closeNewGameModal() {
  const overlay = document.getElementById('boot-new-overlay');
  if (overlay) overlay.classList.remove('show');
}

function renderBootSlots() {
  const menuGrid = document.getElementById('boot-slot-grid');
  const newGrid = document.getElementById('boot-new-slot-grid');

  if (menuGrid) menuGrid.innerHTML = buildSlotCards('menu');
  if (newGrid) newGrid.innerHTML = buildSlotCards('new');

  wireSlotActions();
}

function getLastActiveSlotIndex() {
  const last = Number(localStorage.getItem(BOOT_ACTIVE_SLOT_KEY));
  if (!Number.isInteger(last) || last < 0 || last >= BOOT_SLOT_COUNT) return -1;
  return last;
}

function getPreferredLoadSlot() {
  const last = getLastActiveSlotIndex();
  if (last >= 0) {
    const snapshot = readSlotSnapshot(last);
    if (snapshot.exists) return last;
  }

  for (let i = 0; i < BOOT_SLOT_COUNT; i++) {
    const snapshot = readSlotSnapshot(i);
    if (snapshot.exists) return i;
  }
  return -1;
}

function buildSlotCards(mode) {
  const lastActiveSlot = getLastActiveSlotIndex();
  return Boot.slots.map((slotMeta, index) => {
    const snapshot = readSlotSnapshot(index);
    const used = !!slotMeta || snapshot.exists;
    const canLoad = snapshot.exists;
    const isLastActive = index === lastActiveSlot;

    const slotLabel = 'Slot ' + (index + 1);
    const badge = used
      ? '<span class="boot-badge boot-badge-used">Belegt</span>'
      : '<span class="boot-badge boot-badge-empty">Leer</span>';
    const lastBadge = isLastActive ? '<span class="boot-badge boot-badge-last">Zuletzt aktiv</span>' : '';

    const nickname = slotMeta && slotMeta.nickname
      ? slotMeta.nickname
      : (snapshot.profileName || (snapshot.exists ? ('Spielstand ' + (index + 1)) : '---'));

    let metaHtml = '';
    if (!used) {
      metaHtml = 'Freier Slot fuer neues Spiel.';
    } else {
      metaHtml = '<strong>' + esc(nickname) + '</strong>';
      if (canLoad) {
        metaHtml += '<div>Fortschritt: ' + String(snapshot.progress || 0) + '%</div>';
        metaHtml += '<div>Cash: $' + fmtNum(snapshot.usd || 0) + '</div>';
        metaHtml += '<div>Net: $' + fmtNum(snapshot.totalEarned || 0) + '</div>';
        metaHtml += '<div>Spielzeit: ' + fmtTime(snapshot.playTime || 0) + '</div>';
        metaHtml += '<div>Gespeichert: ' + fmtDate(snapshot.lastSave) + '</div>';
      } else {
        metaHtml += '<div>Fortschritt: 0%</div>';
        metaHtml += '<div>Noch kein vollstaendiger Spielstand.</div>';
      }
    }

    let primaryBtn = '';
    if (mode === 'new') {
      primaryBtn = '<button class="buy-btn" data-boot-action="start-new" data-slot="' + index + '">Hier starten</button>';
    } else {
      primaryBtn = '<button class="buy-btn" data-boot-action="load-slot" data-slot="' + index + '" ' + (canLoad ? '' : 'disabled') + '>Laden</button>';
    }

    const deleteBtn = '<button class="buy-btn" style="background:linear-gradient(135deg, #7a2a3d, #3f1a26);" data-boot-action="delete-slot" data-slot="' + index + '" ' + (used ? '' : 'disabled') + '>Loeschen</button>';

    return '' +
      '<div class="boot-slot">' +
        '<div class="boot-slot-head"><span>' + slotLabel + '</span><span>' + lastBadge + badge + '</span></div>' +
        '<div class="boot-slot-meta">' + metaHtml + '</div>' +
        '<div class="boot-slot-actions">' + primaryBtn + deleteBtn + '</div>' +
      '</div>';
  }).join('');
}

function wireSlotActions() {
  document.querySelectorAll('[data-boot-action="delete-slot"]').forEach(btn => {
    btn.onclick = () => deleteBootSlot(Number(btn.dataset.slot));
  });

  document.querySelectorAll('[data-boot-action="load-slot"]').forEach(btn => {
    btn.onclick = () => loadFromSlot(Number(btn.dataset.slot));
  });

  document.querySelectorAll('[data-boot-action="start-new"]').forEach(btn => {
    btn.onclick = () => createNewGameInSlot(Number(btn.dataset.slot));
  });
}

function createNewGameInSlot(slotIdx) {
  if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= BOOT_SLOT_COUNT) return;
  const input = document.getElementById('boot-nickname-input');
  const rawName = input ? input.value.trim() : '';
  if (!rawName) {
    showBootToast('Bitte zuerst einen Nickname eingeben.');
    return;
  }

  const nickname = rawName.slice(0, 18);
  if (Boot.slots[slotIdx]) {
    const ok = confirm('Slot ist belegt. Ueberschreiben?');
    if (!ok) return;
  }

  Boot.slots[slotIdx] = {
    nickname,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastPlayed: Date.now(),
    progress: 0,
    usd: 0,
    totalEarned: 0,
    playTime: 0,
    lastSave: 0,
    note: 'Neues Spiel gestartet'
  };

  window.HV_PENDING_PROFILE_NAME = nickname;
  saveBootSlots();
  clearSlotSave(slotIdx);
  closeNewGameModal();
  startGameFromSlot(slotIdx, 'new');
}

function loadFromSlot(slotIdx) {
  if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= BOOT_SLOT_COUNT) return;

  const snapshot = readSlotSnapshot(slotIdx);
  const used = !!Boot.slots[slotIdx] || snapshot.exists;
  if (!used) {
    showBootToast('Dieser Slot ist leer.');
    return;
  }
  if (!snapshot.exists) {
    showBootToast('Kein vollstaendiger Spielstand vorhanden.');
    return;
  }

  if (!Boot.slots[slotIdx]) {
    Boot.slots[slotIdx] = {
      nickname: snapshot.profileName || ('Spielstand ' + (slotIdx + 1)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastPlayed: Date.now(),
      progress: snapshot.progress || 0,
      usd: snapshot.usd || 0,
      totalEarned: snapshot.totalEarned || 0,
      playTime: snapshot.playTime || 0,
      lastSave: snapshot.lastSave || 0,
      note: 'Importiert aus Save-Datei'
    };
  } else {
    if (!Boot.slots[slotIdx].nickname && snapshot.profileName) {
      Boot.slots[slotIdx].nickname = snapshot.profileName;
    }
    Boot.slots[slotIdx].lastPlayed = Date.now();
    Boot.slots[slotIdx].updatedAt = Date.now();
    Boot.slots[slotIdx].progress = snapshot.progress || 0;
    Boot.slots[slotIdx].usd = snapshot.usd || 0;
    Boot.slots[slotIdx].totalEarned = snapshot.totalEarned || 0;
    Boot.slots[slotIdx].playTime = snapshot.playTime || 0;
    Boot.slots[slotIdx].lastSave = snapshot.lastSave || 0;
  }

  saveBootSlots();
  startGameFromSlot(slotIdx, 'load');
}

function deleteBootSlot(slotIdx) {
  const used = !!Boot.slots[slotIdx] || readSlotSnapshot(slotIdx).exists;
  if (!used) return;

  const ok = confirm('Slot ' + (slotIdx + 1) + ' wirklich loeschen?');
  if (!ok) return;

  Boot.slots[slotIdx] = null;
  saveBootSlots();
  clearSlotSave(slotIdx);
  renderBootSlots();
  showBootToast('Slot ' + (slotIdx + 1) + ' geloescht.');
}

function startGameFromSlot(slotIdx, mode) {
  if (Boot.gameStarted) return;
  if (!Boot.ready) {
    showBootToast('Module sind noch nicht fertig geladen.');
    return;
  }

  Boot.gameStarted = true;

  window.HV_ACTIVE_SLOT = slotIdx;
  window.HV_ACTIVE_MODE = mode;
  localStorage.setItem(BOOT_ACTIVE_SLOT_KEY, String(slotIdx));

  const starter = window.HV_START_GAME;
  if (typeof starter !== 'function') {
    Boot.gameStarted = false;
    console.error('HV_START_GAME not found.');
    showBootToast('Start fehlgeschlagen: Hauptinitialisierung fehlt.');
    return;
  }

  const bootRoot = document.getElementById('boot-root');
  const app = document.getElementById('app');
  if (bootRoot) bootRoot.classList.add('hidden');
  if (app) app.classList.remove('boot-hidden');

  try {
    starter();
  } catch (err) {
    Boot.gameStarted = false;
    if (bootRoot) bootRoot.classList.remove('hidden');
    if (app) app.classList.add('boot-hidden');
    console.error('HV_START_GAME execution failed:', err);
    showBootToast('Start fehlgeschlagen: Initialisierung abgebrochen.');
  }
}

function clearSlotSave(slotIdx) {
  localStorage.removeItem(getSlotSaveKey(slotIdx));

  if (slotIdx === 0) {
    localStorage.removeItem('hashvault_v5');
    localStorage.removeItem('hashvault_v4');
    localStorage.removeItem('hashvault_v3');
  }
}

function getSlotSaveKey(slotIdx) {
  if (typeof window.HV_GET_SAVE_KEY_FOR_SLOT === 'function') {
    return window.HV_GET_SAVE_KEY_FOR_SLOT(slotIdx);
  }
  return 'hashvault_v5_s' + (slotIdx + 1);
}

function readSlotSnapshot(slotIdx) {
  try {
    const raw = localStorage.getItem(getSlotSaveKey(slotIdx));
    if (!raw) return { exists: false };
    const data = JSON.parse(raw);
    return {
      exists: true,
      profileName: typeof data.profileName === 'string' ? data.profileName.slice(0, 18) : '',
      usd: Number(data.usd || 0),
      totalEarned: Number(data.totalEarned || 0),
      playTime: Number(data.playTime || 0),
      lastSave: Number(data.lastSave || 0),
      progress: computeSnapshotProgress(data),
    };
  } catch (e) {
    console.warn('Slot snapshot read failed for slot', slotIdx + 1, e);
    return { exists: false };
  }
}

function computeSnapshotProgress(data) {
  const rigs = Number(data.totalRigs || 0);
  const upgrades = Array.isArray(data.upgrades) ? data.upgrades.length : 0;
  const research = Array.isArray(data.research) ? data.research.length : 0;
  const achievements = Array.isArray(data.achievements) ? data.achievements.length : 0;
  const contractsDone = Number(data.contractsDone || 0);
  const totalEarned = Number(data.totalEarned || 0);

  const progress =
    Math.min(40, rigs / 3) +
    Math.min(18, upgrades * 0.6) +
    Math.min(14, research * 0.8) +
    Math.min(14, achievements * 0.5) +
    Math.min(8, contractsDone * 0.4) +
    Math.min(6, Math.log10(Math.max(1, totalEarned + 1)) * 1.5);

  return Math.max(0, Math.min(100, Math.round(progress)));
}

function loadBootSlots() {
  try {
    const raw = localStorage.getItem(BOOT_META_KEY);
    if (!raw) return Array(BOOT_SLOT_COUNT).fill(null);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array(BOOT_SLOT_COUNT).fill(null);
    return Array.from({ length: BOOT_SLOT_COUNT }, (_, i) => parsed[i] || null);
  } catch (e) {
    console.warn('Slot metadata read failed:', e);
    return Array(BOOT_SLOT_COUNT).fill(null);
  }
}

function saveBootSlots() {
  localStorage.setItem(BOOT_META_KEY, JSON.stringify(Boot.slots));
}

function showBootToast(msg) {
  const el = document.getElementById('boot-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showBootToast._timer);
  showBootToast._timer = setTimeout(() => el.classList.remove('show'), 2400);
}

async function hardReloadNoCache() {
  showBootToast('Cache wird geleert, bitte warten...');

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch (e) {
    console.warn('Service Worker cleanup failed:', e);
  }

  try {
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('CacheStorage cleanup failed:', e);
  }

  const url = new URL(window.location.href);
  url.searchParams.set('__hvhard', String(Date.now()));
  url.searchParams.set('__t', String(Date.now()));
  window.location.replace(url.toString());
}

function fmtDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return dd + '.' + mm + '.' + yy + ' ' + hh + ':' + mi;
}

function fmtNum(n) {
  const num = Number(n || 0);
  if (Math.abs(num) < 1000) return num.toFixed(0);
  if (Math.abs(num) < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (Math.abs(num) < 1000000000) return (num / 1000000).toFixed(2) + 'M';
  return (num / 1000000000).toFixed(2) + 'B';
}

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + r + 's';
  return r + 's';
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
