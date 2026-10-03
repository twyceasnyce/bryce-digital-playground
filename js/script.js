/* ============================================================
   Bryce — shared site script
   Three jobs:
   1. The sound player demo (play/pause, pick a track)
   2. The social battery toy
   3. Loading content from the /content/*.json files so that
      adding a journal entry, track, or photo there is all it
      takes for it to show up on the site.
   ============================================================ */

// ---------- small helpers ----------
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
  }
  (children || []).forEach((c) => c && node.appendChild(c));
  return node;
}

function text(tag, cls, str) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  node.textContent = str;
  return node;
}

async function fetchJSON(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('failed to load ' + path);
    return await res.json();
  } catch (err) {
    console.warn(err);
    return null;
  }
}

// ---------- Journal (essays) ----------
// Renders into any element with the given id. `limit` caps how many
// show (used for the homepage preview); leave it off for the full list.
async function loadJournal(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const entries = await fetchJSON('content/journal.json');
  container.innerHTML = '';
  if (!entries || !entries.length) {
    container.appendChild(text('div', 'journal-empty', 'Nothing posted yet — add an entry in content/journal.json.'));
    return;
  }
  const sorted = entries.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const toShow = limit ? sorted.slice(0, limit) : sorted;
  toShow.forEach((entry) => {
    const a = el('a', { class: 'journal-entry', href: entry.href || '#' });
    a.appendChild(text('div', 'date', formatDate(entry.date)));
    a.appendChild(text('div', 't', entry.title || ''));
    a.appendChild(text('div', 'line', entry.summary || ''));
    if (entry.tag) a.appendChild(text('div', 'tag', entry.tag));
    container.appendChild(a);
  });
}

function formatDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return parts[1] + '.' + parts[2];
}

// ---------- Tracks (songs) ----------
// Loads content/tracks.json and wires up a play/pause + track-picker
// demo. playerIds/listId point at the elements on the page; a page
// can supply just a list, just a player, or both.
async function loadSound(opts) {
  const tracks = (await fetchJSON('content/tracks.json')) || [];
  let current = 0;
  let playing = false;

  const playerTitle = opts.playerTitleId ? document.getElementById(opts.playerTitleId) : null;
  const playerTag = opts.playerTagId ? document.getElementById(opts.playerTagId) : null;
  const playerBtn = opts.playerBtnId ? document.getElementById(opts.playerBtnId) : null;
  const playerBars = opts.playerBarsId ? document.getElementById(opts.playerBarsId) : null;
  const list = opts.listId ? document.getElementById(opts.listId) : null;

  function renderBars() {
    if (!playerBars) return;
    playerBars.innerHTML = '';
    for (let i = 0; i < 48; i++) {
      const h = 14 + 86 * Math.abs(Math.sin(i * 0.7 + current) * Math.cos(i * 0.23));
      const played = i < 16;
      const bar = el('div', {});
      bar.style.height = h.toFixed(0) + '%';
      bar.style.background = played ? 'var(--accent)' : '#6E6759';
      playerBars.appendChild(bar);
    }
  }

  function renderPlayer() {
    const t = tracks[current];
    if (!t) return;
    if (playerTitle) playerTitle.textContent = t.title;
    if (playerTag) playerTag.textContent = (playing ? 'Playing · ' : 'Paused · ') + t.tag;
    if (playerBtn) {
      playerBtn.innerHTML = playing
        ? '<svg width="22" height="22" viewBox="0 0 26 26" fill="#15130F"><rect x="5" y="3" width="6" height="20"/><rect x="15" y="3" width="6" height="20"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 26 26" fill="#15130F"><path d="M7 3v20l17-10z"/></svg>';
    }
    renderBars();
  }

  function renderList() {
    if (!list) return;
    list.innerHTML = '';
    tracks.forEach((t, i) => {
      const row = el('button', { class: 'track-row' + (i === current ? ' active' : ''), type: 'button' });
      row.appendChild(text('span', 'n', String(i + 1).padStart(2, '0')));
      row.appendChild(text('span', 't', t.title));
      row.appendChild(text('span', 'tag', t.tag));
      row.addEventListener('click', () => {
        current = i;
        playing = true;
        renderPlayer();
        renderList();
      });
      list.appendChild(row);
    });
  }

  if (playerBtn) {
    playerBtn.addEventListener('click', () => {
      playing = !playing;
      renderPlayer();
    });
  }

  renderPlayer();
  renderList();
}

// ---------- Photos (contact sheet strip) ----------
async function loadPhotoStrip(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const photos = (await fetchJSON('content/photos.json')) || [];
  container.innerHTML = '';
  const tones = ['#3B342B', '#8A8676', '#2A2F3A', '#CDB98E', '#6B5B47', '#B9AE9A', '#4A4F42', '#7A6C5A'];
  photos.forEach((p, i) => {
    const shot = el('div', { class: 'shot' });
    if (p.image) {
      shot.style.backgroundImage = "url('" + p.image + "')";
      shot.style.backgroundSize = 'cover';
      shot.style.backgroundPosition = 'center';
    } else {
      shot.style.background = tones[i % tones.length];
    }
    shot.appendChild(el('span', { html: p.label || String(i + 1).padStart(2, '0') }));
    container.appendChild(shot);
  });
}

// ---------- Social battery toy ----------
function initBattery(opts) {
  const pctEl = document.getElementById(opts.pctId);
  const segEl = document.getElementById(opts.segmentsId);
  const msgEl = document.getElementById(opts.msgId);
  const partyBtn = document.getElementById(opts.partyBtnId);
  const homeBtn = document.getElementById(opts.homeBtnId);
  if (!pctEl || !segEl || !msgEl) return;

  let battery = 100;

  function render() {
    pctEl.textContent = battery + '%';
    segEl.innerHTML = '';
    const filled = Math.ceil(battery / 10);
    const low = battery <= 30;
    for (let i = 0; i < 10; i++) {
      const seg = el('div', {});
      seg.style.background = i < filled ? (low ? 'var(--accent)' : 'var(--rule)') : 'transparent';
      segEl.appendChild(seg);
    }
    let msg = 'Fully charged. Dangerous. Creative.';
    if (battery <= 70) msg = 'Holding it together. Smiling on purpose.';
    if (battery <= 40) msg = 'Actively scanning the room for exits.';
    if (battery <= 10) msg = 'Please do not speak to me.';
    msgEl.textContent = msg;
  }

  if (partyBtn) partyBtn.addEventListener('click', () => { battery = Math.max(0, battery - 30); render(); });
  if (homeBtn) homeBtn.addEventListener('click', () => { battery = Math.min(100, battery + 50); render(); });

  render();
}
