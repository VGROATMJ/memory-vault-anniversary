(() => {
  "use strict";
  const K = window.KONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const grid = document.getElementById('photoGrid');
  const app = document.getElementById('app');
  const music = document.getElementById('bgMusic');
  if (!grid || !app) return;

  const favKey = 'memory-vault-favorites-v1';
  const readFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(favKey) || '[]')); } catch { return new Set(); } };
  const writeFavs = set => localStorage.setItem(favKey, JSON.stringify([...set]));
  let favs = readFavs();

  /* Progress line */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Hero memory collage — only thumbnails from the existing 98 memories. */
  const hero = document.querySelector('.hero-section');
  if (hero) {
    const collage = document.createElement('div');
    collage.className = 'hero-collage';
    collage.innerHTML = '<span class="hero-orbit-ring"></span><span class="hero-orbit-ring"></span>';
    const picks = [0, 6, 18, 31, 52, 79];
    picks.forEach((n, idx) => {
      const item = K.galeri?.[n];
      if (!item) return;
      const card = document.createElement('figure');
      card.className = 'hero-polaroid';
      card.innerHTML = `<img src="${item.foto}" alt="Memory ${String(n + 1).padStart(3, '0')}" loading="eager"><span>memory ${String(n + 1).padStart(2, '0')}</span>`;
      collage.appendChild(card);
    });
    hero.appendChild(collage);
  }

  /* Mini reel */
  const mediaSection = document.getElementById('moments');
  if (mediaSection && !mediaSection.querySelector('.memory-reel')) {
    const reel = document.createElement('div');
    reel.className = 'memory-reel';
    const track = document.createElement('div');
    track.className = 'memory-reel-track';
    const items = (K.galeri || []).slice(0, 18);
    [...items, ...items].forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'memory-reel-item';
      card.innerHTML = `<img src="${item.foto}" alt="memory reel ${i + 1}" loading="lazy">`;
      track.appendChild(card);
    });
    reel.appendChild(track);
    const filterRow = mediaSection.querySelector('.filter-row');
    if (filterRow) mediaSection.insertBefore(reel, filterRow);
  }

  /* Extra tools */
  if (mediaSection && !mediaSection.querySelector('.memory-tools')) {
    const tools = document.createElement('div');
    tools.className = 'memory-tools';
    tools.innerHTML = `
      <button class="memory-tool primary" data-action="spotlight">✦ Random memory</button>
      <button class="memory-tool" data-action="shuffle">↻ Acak urutan tampilan</button>
      <button class="memory-tool" data-action="favorites">♡ Lihat favorit</button>
      <button class="memory-tool" data-action="collage">▦ Buat kolase</button>
      <span class="filter-hint">Galeri sekarang membaca framing asli foto, jadi portrait + landscape bisa hidup berdampingan.</span>
    `;
    const filterRow = mediaSection.querySelector('.filter-row');
    if (filterRow) filterRow.insertAdjacentElement('afterend', tools);
    else mediaSection.prepend(tools);
    tools.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'spotlight') spotlight();
      if (action === 'shuffle') shuffleVisible();
      if (action === 'favorites') toggleFavoritesMode(btn);
      if (action === 'collage') openCollage();
    });
  }

  /* Next anniversary card */
  const timeline = document.getElementById('timeline');
  if (timeline && !timeline.querySelector('.next-anniversary')) {
    const card = document.createElement('div');
    card.className = 'next-anniversary';
    card.innerHTML = `
      <div class="na-copy"><small>NEXT CHAPTER</small><h3 id="naTitle">Menuju hari yang sama, sekali lagi.</h3><p id="naSubtitle">Setiap detik membawa kita mendekati 07 Oktober berikutnya.</p></div>
      <div class="na-count"><div><b id="naDays">—</b><span>hari</span></div><div><b id="naHours">—</b><span>jam</span></div><div><b id="naMinutes">—</b><span>menit</span></div><div><b id="naSeconds">—</b><span>detik</span></div></div>
    `;
    timeline.appendChild(card);
    const tick = () => {
      const start = new Date(K.tanggalJadian || '2022-10-07T00:00:00');
      const now = new Date();
      const target = new Date(now.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
      if (target <= now) target.setFullYear(target.getFullYear() + 1);
      const ms = target - now;
      document.getElementById('naDays').textContent = Math.floor(ms / 86400000).toLocaleString('id-ID');
      document.getElementById('naHours').textContent = String(Math.floor(ms / 3600000) % 24).padStart(2, '0');
      document.getElementById('naMinutes').textContent = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
      document.getElementById('naSeconds').textContent = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* Floating action dock */
  if (!document.querySelector('.action-dock')) {
    const dock = document.createElement('div');
    dock.className = 'action-dock';
    dock.innerHTML = `<button title="Random memory" data-action="spot">✦</button><button title="Buat kolase" data-action="collage">▦</button><button title="Ke surat" data-action="letter">✉</button><button title="Ganti suasana" data-action="theme">☾</button>`;
    dock.addEventListener('click', e => {
      const b = e.target.closest('button[data-action]');
      if (!b) return;
      if (b.dataset.action === 'spot') spotlight();
      if (b.dataset.action === 'collage') openCollage();
      if (b.dataset.action === 'letter') document.getElementById('letter')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (b.dataset.action === 'theme') toggleTheme(b);
    });
    document.body.appendChild(dock);
  }

  /* Gallery decoration / favorites */
  function decorateGallery() {
    $$('.photo-card', grid).forEach((card, i) => {
      card.style.setProperty('--i', i);
      let fav = card.querySelector('.photo-fav');
      if (!fav) {
        fav = document.createElement('button');
        fav.className = 'photo-fav';
        fav.type = 'button';
        fav.title = 'Favorit';
        fav.textContent = '♡';
        card.appendChild(fav);
        fav.addEventListener('click', e => {
          e.stopPropagation();
          const id = card.dataset.id || `photo-${i}`;
          if (favs.has(id)) favs.delete(id); else favs.add(id);
          writeFavs(favs);
          syncFavoriteButtons();
        });
      }
    });
    syncFavoriteButtons();
  }
  function syncFavoriteButtons() {
    $$('.photo-card', grid).forEach(card => {
      const active = favs.has(card.dataset.id);
      const btn = card.querySelector('.photo-fav');
      if (btn) { btn.classList.toggle('active', active); btn.textContent = active ? '♥' : '♡'; }
      card.classList.toggle('favorite-card', active);
    });
  }

  const gridObserver = new MutationObserver(() => setTimeout(decorateGallery, 0));
  gridObserver.observe(grid, { childList: true });
  decorateGallery();

  /* Spotlight and reorder */
  function visibleCards() { return $$('.photo-card', grid).filter(x => getComputedStyle(x).display !== 'none'); }
  function spotlight() {
    const cards = visibleCards();
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.animate([
      { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
      { transform: 'scale(1.06) rotate(0deg)', filter: 'brightness(1.24)' },
      { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' }
    ], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(() => card.click(), 420);
  }
  function shuffleVisible() {
    const cards = visibleCards();
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (cards[i] !== cards[j]) grid.insertBefore(cards[j], cards[i]);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    decorateGallery();
  }
  let favoritesOnly = false;
  function toggleFavoritesMode(btn) {
    favoritesOnly = !favoritesOnly;
    $$('.photo-card', grid).forEach(card => {
      card.style.display = favoritesOnly && !favs.has(card.dataset.id) ? 'none' : '';
    });
    btn.textContent = favoritesOnly ? '♡ Tampilkan semua' : '♡ Lihat favorit';
    if (favoritesOnly && !visibleCards().length) {
      btn.textContent = '♡ Belum ada favorit';
      setTimeout(() => { favoritesOnly = false; $$('.photo-card', grid).forEach(card => card.style.display = ''); btn.textContent = '♡ Lihat favorit'; }, 1200);
    }
  }

  /* Enhanced lightbox controls */
  const lightbox = document.getElementById('lightbox');
  const lightImg = document.getElementById('lightboxImg');
  if (lightbox && lightImg) {
    const prev = Object.assign(document.createElement('button'), { className: 'lb-nav lb-prev', textContent: '‹', title: 'Sebelumnya' });
    const next = Object.assign(document.createElement('button'), { className: 'lb-nav lb-next', textContent: '›', title: 'Berikutnya' });
    const fav = Object.assign(document.createElement('button'), { className: 'lb-fav', textContent: '♡', title: 'Favorit' });
    const count = Object.assign(document.createElement('div'), { className: 'lb-count' });
    lightbox.append(prev, next, fav, count);
    let currentCard = null;
    const getCards = () => visibleCards();
    const openAt = index => {
      const cards = getCards();
      if (!cards.length) return;
      const card = cards[(index + cards.length) % cards.length];
      currentCard = card;
      const img = card.querySelector('img');
      lightImg.src = img?.currentSrc || img?.src || '';
      lightImg.alt = img?.alt || 'Foto kenangan';
      lightbox.querySelector('#lightboxCaption').textContent = card.querySelector('.photo-caption')?.textContent || 'our little moment';
      count.textContent = `${String(cards.indexOf(card) + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      const id = card.dataset.id;
      fav.classList.toggle('active', favs.has(id));
      fav.textContent = favs.has(id) ? '♥' : '♡';
    };
    grid.addEventListener('click', e => {
      const card = e.target.closest('.photo-card');
      if (!card || e.target.closest('.photo-fav')) return;
      setTimeout(() => openAt(getCards().indexOf(card)), 0);
    });
    prev.addEventListener('click', e => { e.stopPropagation(); const cards=getCards(); if(currentCard) openAt(cards.indexOf(currentCard)-1); });
    next.addEventListener('click', e => { e.stopPropagation(); const cards=getCards(); if(currentCard) openAt(cards.indexOf(currentCard)+1); });
    fav.addEventListener('click', e => {
      e.stopPropagation(); if (!currentCard) return;
      const id = currentCard.dataset.id;
      if (favs.has(id)) favs.delete(id); else favs.add(id);
      writeFavs(favs); syncFavoriteButtons(); openAt(getCards().indexOf(currentCard));
    });
    addEventListener('keydown', e => {
      if (lightbox.hidden) return;
      if (e.key === 'ArrowLeft') prev.click();
      if (e.key === 'ArrowRight') next.click();
    });
  }

  /* Collage modal */
  let collage = document.getElementById('collageModal');
  if (!collage) {
    collage = document.createElement('div');
    collage.id = 'collageModal';
    collage.hidden = true;
    collage.innerHTML = `
      <div class="collage-shell" role="dialog" aria-modal="true">
        <div class="collage-head"><div><h3>Kolase kecil tentang kita</h3><p>Enam memori dipilih secara acak dari galeri.</p></div><button class="close-btn" data-close-collage type="button">×</button></div>
        <div class="collage-canvas" id="collageCanvas"></div>
        <div class="collage-actions"><button class="memory-tool" data-regenerate>↻ Buat versi lain</button><button class="memory-tool primary" data-close-collage>Selesai</button></div>
      </div>`;
    document.body.appendChild(collage);
    collage.addEventListener('click', e => { if (e.target === collage || e.target.closest('[data-close-collage]')) collage.hidden = true; if (e.target.closest('[data-regenerate]')) renderCollage(); });
  }
  function renderCollage() {
    const cards = visibleCards();
    if (!cards.length) return;
    const picked = [...cards].sort(() => Math.random() - .5).slice(0, Math.min(6, cards.length));
    const canvas = document.getElementById('collageCanvas');
    canvas.innerHTML = picked.map(card => {
      const img = card.querySelector('img');
      return `<figure><img src="${img.currentSrc || img.src}" alt="Kolase memory"></figure>`;
    }).join('');
  }
  function openCollage() { renderCollage(); collage.hidden = false; }


  /* ============================================================
     SIGNATURE SYMBOL SYSTEM — tiny visual language for R × I.
     ============================================================ */
  const symbolField = document.createElement('div');
  symbolField.className = 'symbol-field';
  symbolField.setAttribute('aria-hidden', 'true');
  symbolField.innerHTML = [
    ['⟡', 's1'], ['𓂃', 's2'], ['୨୧', 's3'], ['∞', 's4'], ['⌁', 's5'],
    ['R ♡ I', 's6'], ['07 · 10 · 22', 's7'], ['✦', 's8'], ['☾', 's9'], ['⟡', 's10'],
    ['I → R', 's11'], ['R → I', 's12']
  ].map(([g,c]) => `<span class="symbol ${c}">${g}</span>`).join('');
  app.appendChild(symbolField);

  const photoOrbit = document.createElement('div');
  photoOrbit.className = 'photo-orbit-sigil';
  photoOrbit.setAttribute('aria-hidden', 'true');
  photoOrbit.innerHTML = '<span>⟡</span><span>୨୧</span><span>∞</span><span>⌁</span>';
  mediaSection?.prepend(photoOrbit);

  /* A tiny pointer sigil, intentionally subtle and desktop-only. */
  let sigilTimer = 0;
  addEventListener('pointermove', e => {
    if (matchMedia('(hover: none)').matches || app.hidden) return;
    const now = performance.now();
    if (now - sigilTimer < 85) return;
    sigilTimer = now;
    const dot = document.createElement('span');
    dot.className = 'cursor-sigil';
    dot.textContent = Math.random() > .5 ? '✦' : '⟡';
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 720);
  }, { passive: true });

  /* Soft symbol burst whenever a memory is opened. */
  const burst = (x, y) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const glyphs = ['✦','⟡','♡','୨୧','∞'];
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('span');
      p.className = 'memory-burst';
      p.textContent = glyphs[i % glyphs.length];
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${(Math.random() - .5) * 110}px`);
      p.style.setProperty('--dy', `${-35 - Math.random() * 90}px`);
      p.style.setProperty('--rot', `${(Math.random() - .5) * 50}deg`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  };
  grid.addEventListener('click', e => {
    const card = e.target.closest('.photo-card');
    if (card && !e.target.closest('button')) { const r = card.getBoundingClientRect(); burst(r.left + r.width/2, r.top + r.height/2); }
  });

  /* ============================================================
     MULTI-PAGE ROUTER — clicks become pages, not long scrolls.
     ============================================================ */
  const routeData = {
    story: {
      label: 'OUR STORY',
      title: 'Ramadhan ♡ Ila',
      desc: 'Empat tahun, satu tanggal, dan terlalu banyak alasan untuk tetap menyimpan cerita ini.',
      stamp: 'CHAPTER 01—04'
    },
    photos: {
      label: 'OUR MOMENTS',
      title: 'Foto-foto kenangan kita',
      desc: 'Satu ruang kecil untuk semua kenangan yang pernah kita simpan. Buka pelan-pelan, jangan buru-buru.',
      stamp: 'OUR MEMORY ALBUM'
    },
    videos: {
      label: 'LITTLE FILMS',
      title: 'Momen yang lebih enak ditonton',
      desc: 'Dua potongan kecil dari cerita yang terlalu sayang kalau cuma disimpan di galeri HP.',
      stamp: '02 CLIPS'
    },
    message: {
      label: 'MESSAGE / FROM MY HEART',
      title: 'Untuk Ila Meydina',
      desc: 'Sebuah ruangan kecil khusus buat surat yang seharusnya dibaca pelan-pelan.',
      stamp: 'PRIVATE NOTE'
    }
  };

  const pageSections = $$('[data-page]');
  const topbar = document.querySelector('.topbar');
  const routeHead = document.createElement('div');
  routeHead.className = 'route-head';
  routeHead.innerHTML = `
    <button class="route-back" type="button" data-route-back>← Universe</button>
    <div class="route-title-wrap">
      <span class="eyebrow" id="routeEyebrow">OUR STORY</span>
      <h2 id="routeTitle">Ramadhan ♡ Ila</h2>
      <p id="routeDesc">Empat tahun, satu tanggal, dan terlalu banyak alasan untuk tetap menyimpan cerita ini.</p>
    </div>
    <div class="route-stamp"><strong id="routeStamp">CHAPTER 01—04</strong><span class="stamp-sigil">⟡ 07·10·22 ⟡</span><small>PRIVATE ARCHIVE</small></div>
    <div class="route-sigils" aria-hidden="true"><span>⟡</span><span>୨୧</span><span>∞</span><span>⌁</span></div>
  `;
  if (topbar) topbar.insertAdjacentElement('afterend', routeHead);

  const transition = document.createElement('div');
  transition.className = 'route-transition';
  transition.innerHTML = `<div class="rt-orbit" aria-hidden="true"><i>⟡</i><i>୨୧</i><i>∞</i></div><div class="rt-copy"><span class="rt-heart">♡</span><span class="rt-kicker" id="rtKicker">OPENING</span><div class="rt-title" id="rtTitle">Our Story</div><span class="rt-date">07 · 10 · 2022</span></div>`;
  document.body.appendChild(transition);

  let currentRoute = 'story';
  let routeTimer = null;

  function normalizeRoute(value) {
    const clean = String(value || '').replace(/^#/, '').toLowerCase();
    if (clean === 'moments' || clean === 'photos') return 'photos';
    if (clean === 'films' || clean === 'videos') return 'videos';
    if (clean === 'letter' || clean === 'message') return 'message';
    return 'story';
  }

  function showRoute(route, animate = true) {
    route = normalizeRoute(route);
    const meta = routeData[route] || routeData.story;
    currentRoute = route;
    app.classList.add('route-mode');
    app.dataset.route = route;
    document.body.classList.toggle('route-message', route === 'message');

    pageSections.forEach(section => {
      section.hidden = section.dataset.page !== route;
    });

    $$('.topbar nav a[data-route]').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
      a.setAttribute('aria-current', a.dataset.route === route ? 'page' : 'false');
    });

    $('#routeEyebrow').textContent = meta.label;
    $('#routeTitle').textContent = meta.title;
    $('#routeDesc').textContent = meta.desc;
    $('#routeStamp').textContent = meta.stamp;
    $('#rtKicker').textContent = `${meta.label} · 07.10.2022`;
    $('#rtTitle').textContent = meta.title;
    document.title = `${meta.title} — 07.10.2022`;

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (animate && app.hidden === false) {
      clearTimeout(routeTimer);
      transition.classList.remove('show');
      void transition.offsetWidth;
      transition.classList.add('show');
      routeTimer = setTimeout(() => transition.classList.remove('show'), 820);
    }

    // Re-trigger visible reveal animations because the section was formerly hidden.
    setTimeout(() => {
      pageSections.filter(s => s.dataset.page === route).forEach(section => {
        $$('.reveal', section).forEach(el => el.classList.add('show'));
      });
    }, 80);
  }

  function goToRoute(route) {
    route = normalizeRoute(route);
    if (location.hash !== `#${route}`) {
      location.hash = route;
    } else {
      showRoute(route);
    }
  }

  $$('.topbar nav a[data-route]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      goToRoute(link.dataset.route);
    });
  });

  routeHead.querySelector('[data-route-back]')?.addEventListener('click', () => goToRoute('story'));
  addEventListener('hashchange', () => showRoute(normalizeRoute(location.hash), true));

  // Cute route-specific helper cards.
  const chapterSection = document.querySelector('.chapter-section');
  if (chapterSection && !chapterSection.querySelector('.couple-card')) {
    const card = document.createElement('div');
    card.className = 'couple-card';
    card.innerHTML = `
      <div class="person"><small>THE BOY</small><strong>Ramadhan<br>Tri Atmojo</strong></div>
      <div class="middle"><span>♡</span></div>
      <div class="person"><small>THE GIRL</small><strong>Ila<br>Meydina</strong></div>
    `;
    const head = chapterSection.querySelector('.section-head');
    if (head) head.insertAdjacentElement('afterend', card);
  }

  if (mediaSection && !mediaSection.querySelector('.route-page-note')) {
    const note = document.createElement('p');
    note.className = 'route-page-note';
    note.textContent = 'PS: tanpa nomor, tanpa label. Cuma foto-foto kenangan kita. ♡';
    mediaSection.appendChild(note);
  }

  // Make the floating letter icon open the actual Message page.
  document.querySelector('.action-dock [data-action="letter"]')?.addEventListener('click', e => {
    e.preventDefault();
    goToRoute('message');
  });

  // Start on Story, or respect an existing route hash.
  showRoute(normalizeRoute(location.hash), false);

  /* Music status -> cinematic player state */
  if (music) {
    const musicCard = document.querySelector('.music-card');
    const sync = () => {
      musicCard?.classList.toggle('playing', !music.paused);
      const btn = document.getElementById('musicCardBtn');
      if (btn) btn.innerHTML = music.paused ? 'Putar lagu <span>♪</span>' : 'Jeda lagu <span>Ⅱ</span>';
    };
    music.addEventListener('play', sync); music.addEventListener('pause', sync); music.addEventListener('ended', sync); sync();
  }


  const themeKey = 'memory-vault-soft-theme';
  function applyTheme(){
    const soft = localStorage.getItem(themeKey) === '1';
    document.body.classList.toggle('soft-theme', soft);
    const b = document.querySelector('.action-dock [data-action="theme"]');
    if(b) b.textContent = soft ? '☀' : '☾';
  }
  function toggleTheme(){
    const next = !document.body.classList.contains('soft-theme');
    localStorage.setItem(themeKey, next ? '1' : '0');
    applyTheme();
  }
  applyTheme();

  /* Add tiny cinematic label to opening */
  const opening = document.getElementById('opening');
  if (opening && !opening.querySelector('.opening-breathe')) {
    const breathe = document.createElement('div');
    breathe.className = 'opening-breathe';
    breathe.setAttribute('aria-hidden','true');
    breathe.innerHTML = '♡';
    Object.assign(breathe.style, { position:'absolute', left:'50%', bottom:'12%', transform:'translateX(-50%)', color:'rgba(231,192,139,.35)', fontSize:'30px', animation:'heartbeat 2.4s infinite' });
    opening.appendChild(breathe);
  }
})();
