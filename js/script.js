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

async function fetchText(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('failed to load ' + path);
    return await res.text();
  } catch (err) {
    console.warn(err);
    return '';
  }
}

// Turns a plain-text essay into paragraphs: a blank line starts a new
// paragraph, *word* becomes italic, **word** becomes bold. Nothing else.
function mdInline(s) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
function parseBody(raw) {
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map(mdInline);
}
function formatDateLong(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
    const href = entry.slug ? ('post.html?post=' + encodeURIComponent(entry.slug)) : '#';
    const a = el('a', { class: 'journal-entry', href: href });
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

// ---------- Feature excerpt (the spotlighted essay on Home / Words) ----------
// Shows the first two paragraphs of whichever journal entry is marked
// "featured": true (or the newest one, if none is marked), with a
// Continue reading link through to the full piece.
async function loadFeature(opts) {
  const kicker = opts.kickerId ? document.getElementById(opts.kickerId) : null;
  const titleEl = opts.titleId ? document.getElementById(opts.titleId) : null;
  const deckEl = opts.deckId ? document.getElementById(opts.deckId) : null;
  const bodyEl = opts.bodyId ? document.getElementById(opts.bodyId) : null;
  const ctaEl = opts.ctaId ? document.getElementById(opts.ctaId) : null;

  const entries = (await fetchJSON('content/journal.json')) || [];
  if (!entries.length) return;
  const sorted = entries.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const featured = entries.find((e) => e.featured) || sorted[0];
  if (!featured || !featured.slug) return;

  if (kicker && featured.tag) kicker.textContent = featured.tag;
  if (titleEl) titleEl.textContent = featured.title || '';
  if (deckEl) deckEl.textContent = featured.summary || '';
  if (ctaEl) ctaEl.setAttribute('href', 'post.html?post=' + encodeURIComponent(featured.slug));

  // Optional: the homepage cover story uses the same featured entry.
  const coverKicker = opts.coverKickerId ? document.getElementById(opts.coverKickerId) : null;
  const coverTitle = opts.coverTitleId ? document.getElementById(opts.coverTitleId) : null;
  const coverDeck = opts.coverDeckId ? document.getElementById(opts.coverDeckId) : null;
  const coverCta = opts.coverCtaId ? document.getElementById(opts.coverCtaId) : null;
  if (coverKicker && featured.tag) coverKicker.textContent = featured.tag;
  if (coverTitle) coverTitle.textContent = featured.title || '';
  if (coverDeck) coverDeck.textContent = featured.summary || '';
  if (coverCta) coverCta.setAttribute('href', 'post.html?post=' + encodeURIComponent(featured.slug));

  if (bodyEl) {
    bodyEl.innerHTML = '';
    const raw = await fetchText('content/posts/' + featured.slug + '.md');
    const paras = raw ? parseBody(raw) : [];
    if (!paras.length) {
      bodyEl.appendChild(text('p', '', '[Write this piece in content/posts/' + featured.slug + '.md]'));
      return;
    }
    paras.slice(0, 2).forEach((p, i) => {
      const node = document.createElement('p');
      if (i === 0) node.className = 'dropcap';
      node.innerHTML = p;
      bodyEl.appendChild(node);
    });
  }
}

// ---------- Full post page (post.html?post=<slug>) ----------
async function loadFullPost(opts) {
  const container = document.getElementById(opts.containerId);
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('post');

  if (!slug) {
    if (container) container.innerHTML = '<p>No post specified.</p>';
    return;
  }

  const entries = (await fetchJSON('content/journal.json')) || [];
  const entry = entries.find((e) => e.slug === slug);

  if (!entry) {
    if (container) container.innerHTML = '<p>That post wasn\u2019t found. It may have been renamed or removed.</p>';
    return;
  }

  document.title = 'Bryce — ' + entry.title;
  if (opts.kickerId) document.getElementById(opts.kickerId).textContent = entry.tag || '';
  if (opts.titleId) document.getElementById(opts.titleId).textContent = entry.title || '';
  if (opts.deckId) document.getElementById(opts.deckId).textContent = entry.summary || '';
  if (opts.dateId) document.getElementById(opts.dateId).textContent = formatDateLong(entry.date);

  if (container) {
    container.innerHTML = '';
    const raw = await fetchText('content/posts/' + slug + '.md');
    const paras = raw ? parseBody(raw) : [];
    if (!paras.length) {
      container.appendChild(text('p', '', 'Nothing written yet — add the text in content/posts/' + slug + '.md'));
    } else {
      paras.forEach((p, i) => {
        const node = document.createElement('p');
        if (i === 0) node.className = 'dropcap';
        node.innerHTML = p;
        container.appendChild(node);
      });
    }
  }
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
