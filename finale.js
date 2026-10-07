(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = document.getElementById("app");
  if (!app) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const safe = fn => { try { fn(); } catch (e) { console.warn("finale:", e); } };

  /* ============ LOCK SCREEN: hati melayang, petunjuk, getar saat salah ============ */
  safe(() => {
    const lock = $("#lock");
    if (!lock) return;
    const layer = document.createElement("div");
    layer.className = "fx-lock-hearts";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 12; i++) {
      const h = document.createElement("i");
      h.textContent = i % 3 ? "♡" : "♥";
      h.style.left = `${Math.random() * 96}%`;
      h.style.fontSize = `${12 + Math.random() * 16}px`;
      h.style.animationDuration = `${9 + Math.random() * 9}s`;
      h.style.animationDelay = `${-Math.random() * 14}s`;
      h.style.setProperty("--sx", `${(Math.random() - .5) * 90}px`);
      layer.appendChild(h);
    }
    lock.prepend(layer);

    const status = $("#lockStatus");
    if (status) {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "fx-hint-btn"; btn.textContent = "lupa? minta petunjuk ♡";
      const txt = document.createElement("p");
      txt.className = "fx-hint-text";
      status.after(btn, txt);
      let n = 0;
      const hints = [
        "Petunjuk: tanggal, bulan, tahun hari jadian kita. Bukan tanggal gajian ya.",
        "Masih lupa? Delapan angka. Tanggalnya dua digit, bulannya dua digit, tahunnya empat.",
        "Hmm… hari itu hari yang bikin aku senyum-senyum sendiri sampai sekarang."
      ];
      btn.addEventListener("click", () => { txt.textContent = hints[Math.min(n++, hints.length - 1)]; txt.classList.add("show"); });
      // getar halus kalau kode salah
      new MutationObserver(() => {
        if (!status.classList.contains("ok") && status.textContent.trim()) {
          const c = $(".lock-center", lock);
          if (c && !reduced) { c.classList.remove("fx-shake"); void c.offsetWidth; c.classList.add("fx-shake"); }
          navigator.vibrate?.(60);
        }
      }).observe(status, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }
  });

  /* ============ STATUS "sudah masuk" ============ */
  const syncIn = () => document.body.classList.toggle("fx-in", !app.hidden);
  syncIn();
  new MutationObserver(() => { syncIn(); if (!app.hidden) onEnter(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });

  /* ============ TAP HEARTS ============ */
  let lastTap = 0, alive = 0;
  const spawnHeart = (x, y, glyph) => {
    if (reduced || alive > 14) return;
    const h = document.createElement("span");
    h.className = "fx-tap"; h.textContent = glyph || rnd(["♡", "♥", "♡", "✦"]);
    h.style.left = `${x}px`; h.style.top = `${y}px`;
    h.style.setProperty("--dx", `${(Math.random() - .5) * 60}px`);
    h.style.setProperty("--rot", `${(Math.random() - .5) * 40}deg`);
    h.style.fontSize = `${14 + Math.random() * 12}px`;
    document.body.appendChild(h); alive++;
    setTimeout(() => { h.remove(); alive--; }, 1000);
  };
  addEventListener("pointerdown", e => {
    if (!document.body.classList.contains("fx-in")) return;
    if (e.target.closest("button,a,input,label,video,.lightbox,.modal,#collageModal,.fx-tabbar")) return;
    const now = performance.now(); if (now - lastTap < 140) return; lastTap = now;
    spawnHeart(e.clientX, e.clientY);
  }, { passive: true });
  const burstAt = (x, y, n = 6) => { for (let i = 0; i < n; i++) setTimeout(() => spawnHeart(x + (Math.random() - .5) * 30, y), i * 50); };

  /* ============ TAB BAR BAWAH ============ */
  const routes = [
    { id: "story", label: "Story", svg: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>' },
    { id: "photos", label: "Foto", svg: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>' },
    { id: "videos", label: "Video", svg: '<rect x="3.5" y="5" width="17" height="14" rx="3.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>' },
    { id: "message", label: "Pesan", svg: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M4.5 7.5l7.5 5.5 7.5-5.5"/>' }
  ];
  const tabbar = document.createElement("nav");
  tabbar.className = "fx-tabbar"; tabbar.setAttribute("aria-label", "Navigasi bawah");
  tabbar.innerHTML = `<span class="fx-tab-pill"></span>` + routes.map(r =>
    `<button type="button" class="fx-tab" data-go="${r.id}" aria-label="${r.label}"><svg viewBox="0 0 24 24" aria-hidden="true">${r.svg}</svg><span>${r.label}</span></button>`).join("");
  document.body.appendChild(tabbar);
  const pill = $(".fx-tab-pill", tabbar);
  const tabs = $$(".fx-tab", tabbar);
  const syncTabs = () => {
    const cur = app.dataset.route || "story";
    const idx = Math.max(0, routes.findIndex(r => r.id === cur));
    tabs.forEach((t, i) => { t.classList.toggle("active", i === idx); t.setAttribute("aria-current", i === idx ? "page" : "false"); });
    pill.style.transform = `translateX(${idx * 100}%)`;
  };
  tabbar.addEventListener("click", e => {
    const t = e.target.closest(".fx-tab"); if (!t) return;
    navigator.vibrate?.(12);
    const go = t.dataset.go;
    if ((app.dataset.route || "story") === go) { scrollTo({ top: 0, behavior: "smooth" }); return; }
    const link = $(`a[data-route="${go}"]`);
    if (link) link.click(); else location.hash = `#${go}`;
  });

  /* dock menyingkir saat scroll turun (HP) */
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const dock = $(".action-dock"); if (!dock) return;
    const y = scrollY;
    if (Math.abs(y - lastY) > 8) { dock.classList.toggle("fx-hide", y > lastY && y > 300); lastY = y; }
  }, { passive: true });

  /* ============ PITA BERJALAN ============ */
  safe(() => {
    const hero = $(".hero-section");
    if (!hero || $(".fx-ticker")) return;
    const items = ["Ramadhan ♡ Ila", "07 . 10 . 2022", "still choosing you", "empat tahun & terus bertambah", "peringatan: bikin senyum sendiri", "kamu rumahku"];
    const row = items.map(t => `<span><b>${t}</b></span>`).join("");
    const t = document.createElement("div");
    t.className = "fx-ticker"; t.setAttribute("data-fx", "story"); t.setAttribute("aria-hidden", "true");
    t.innerHTML = `<div class="fx-ticker-band">${row}${row}${row}${row}</div>`;
    hero.after(t);
  });

  /* ============ LOVE METER ============ */
  safe(() => {
    const tl = $("#timeline");
    if (!tl || $(".fx-meter-sec")) return;
    const sec = document.createElement("section");
    sec.className = "fx-meter-sec"; sec.setAttribute("data-fx", "story");
    sec.innerHTML = `
      <div class="fx-meter">
        <h3>Love meter hari ini</h3>
        <p class="fx-meter-note">diukur pakai alat paling tidak ilmiah sedunia</p>
        <div class="fx-meter-track"><div class="fx-meter-fill"></div></div>
        <div class="fx-meter-read"><b class="fx-pct">0%</b><span class="fx-msg">mengukur…</span></div>
        <button type="button" class="primary-btn fx-meter-btn">Ukur lagi <span>♡</span></button>
      </div>`;
    tl.after(sec);
    const fill = $(".fx-meter-fill", sec), pct = $(".fx-pct", sec), msg = $(".fx-msg", sec), btn = $(".fx-meter-btn", sec);
    const msgs = [
      ["100%", "penuh. sistem menyarankan: peluk."],
      ["100%+", "error: melebihi batas alat ukur."],
      ["∞%", "alatnya menyerah, perasaannya tidak."],
      ["1000%", "tolong jangan dicek ulang, hasilnya konsisten."],
      ["99,9%", "sisanya 0,1% buat kangen yang belum kesampaian."],
      ["tak terhingga", "dibulatkan ke atas, seperti biasa."]
    ];
    let busy = false;
    const run = () => {
      if (busy) return; busy = true;
      fill.style.transition = "none"; fill.style.width = "0%"; pct.textContent = "0%"; msg.textContent = "mengukur…";
      void fill.offsetWidth; fill.style.transition = ""; fill.style.width = "100%";
      const [p, m] = rnd(msgs);
      let t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / 1500);
        pct.textContent = `${Math.round(k * 100)}%`;
        if (k < 1) requestAnimationFrame(step);
        else { pct.textContent = p; msg.textContent = m; busy = false; const r = btn.getBoundingClientRect(); burstAt(r.left + r.width / 2, r.top, 7); }
      };
      requestAnimationFrame(step);
    };
    let ran = false;
    new IntersectionObserver((en, ob) => { if (en[0].isIntersecting && !ran) { ran = true; run(); ob.disconnect(); } }, { threshold: .5 }).observe(sec);
    btn.addEventListener("click", run);
  });

  /* ============ STICKY NOTE P.S. ============ */
  safe(() => {
    const fin = $(".final-section");
    if (!fin || $(".fx-ps-wrap")) return;
    const w = document.createElement("div");
    w.className = "fx-ps-wrap"; w.setAttribute("data-fx", "message");
    w.innerHTML = `<div class="fx-ps">P.S. kalau habis baca ini kamu senyum, berarti misi halaman ini berhasil. <br>Sekarang boleh peluk aku ya.<small>— Rama</small><span class="fx-ps-heart">♥</span></div>`;
    fin.before(w);
  });

  /* ============ SEGEL LILIN ============ */
  safe(() => {
    const env = $("#envelopeButton");
    if (env && !$(".fx-seal", env)) { const s = document.createElement("span"); s.className = "fx-seal"; s.textContent = "R♡I"; env.appendChild(s); }
  });

  /* ============ SI HATI (maskot) ============ */
  const buddy = document.createElement("button");
  buddy.type = "button"; buddy.className = "fx-buddy"; buddy.setAttribute("aria-label", "Si Hati, ketuk aku");
  buddy.innerHTML = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs><radialGradient id="fxHg" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#ffb3c4"/><stop offset=".55" stop-color="#e5607f"/><stop offset="1" stop-color="#a82c4b"/></radialGradient></defs>
      <path d="M32 58C32 58 5 41 5 22.5 5 13.5 11.8 7 20 7c5 0 9.3 2.5 12 6.6C34.700 9.500 39 7 44 7c8.200 0 15 6.500 15 15.500C59 41 32 58 32 58z" fill="url(#fxHg)" stroke="#8c1f3b" stroke-width="1.5"/>
      <path d="M14 18c1.500-4 5-6 9-5.500" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/>
      <ellipse class="eye" cx="23" cy="30" rx="3" ry="4" fill="#3a1624"/><ellipse class="eye" cx="41" cy="30" rx="3" ry="4" fill="#3a1624"/>
      <circle cx="24" cy="28.800" r="1.100" fill="#fff"/><circle cx="42" cy="28.800" r="1.100" fill="#fff"/>
      <ellipse cx="16" cy="37" rx="4.500" ry="2.800" fill="#ff8fab" opacity=".75"/><ellipse cx="48" cy="37" rx="4.500" ry="2.800" fill="#ff8fab" opacity=".75"/>
      <path class="mouth-a" d="M28 38c1.500 2.500 6.500 2.500 8 0" stroke="#3a1624" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path class="mouth-b" d="M27 37c1 5 9 5 10 0z" fill="#7c1d36" stroke="#3a1624" stroke-width="1.500" stroke-linejoin="round"/>
    </svg>
    <span class="fx-bubble" role="status" aria-live="polite"></span>`;
  document.body.appendChild(buddy);
  const bubble = $(".fx-bubble", buddy);
  let bubbleTimer = 0;
  const say = (text, ms = 4200) => {
    bubble.textContent = text; bubble.classList.add("show");
    buddy.classList.add("happy");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubble.classList.remove("show"); buddy.classList.remove("happy"); }, ms);
  };
  const lines = [
    "Aku Si Hati. Tugasku cuma satu: ngingetin kamu betapa disayang.",
    "Udah minum air putih belum? Aku nanya atas nama Rama.",
    "Ila, kamu tuh favoritnya Rama. Tanpa saingan.",
    "Psst… Rama bilang kamu cantik. Aku cuma kurir.",
    "Kalau capek, istirahat dulu ya. Nanti lanjut lihat fotonya.",
    "Empat tahun, dan Rama masih salting kalau kamu senyum.",
    "Aku dibayar pakai peluk. Tolong sampaikan ke Rama.",
    "Ketuk aku lagi, aku punya 1000 kata manis. Mungkin 1001.",
    "Jangan lupa makan. Hati ini peduli sama perutmu juga.",
    "Rama nggak pandai ngomong, makanya bikin aku."
  ];
  const routeLines = {
    story: "Selamat datang di cerita kita ♡",
    photos: "Nah, ini gudangnya senyum. Coba tekan ✦ buat memori acak!",
    videos: "Siapin popcorn. Cuplikannya pendek tapi manis.",
    message: "Surat ini ditulis pelan-pelan. Bacanya juga ya."
  };
  let lineIdx = 0;
  buddy.addEventListener("click", e => {
    e.stopPropagation();
    navigator.vibrate?.(18);
    buddy.classList.remove("squish"); void buddy.offsetWidth; buddy.classList.add("squish");
    const r = buddy.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top, 5);
    say(lines[lineIdx++ % lines.length]);
  });
  // urutan acak sekali
  lines.sort(() => Math.random() - .5);

  let seenRoute = new Set();
  const onRoute = () => {
    syncTabs();
    const cur = app.dataset.route || "story";
    if (!seenRoute.has(cur) && document.body.classList.contains("fx-in")) {
      seenRoute.add(cur);
      setTimeout(() => { if ((app.dataset.route || "story") === cur) say(routeLines[cur]); }, 1900);
    }
  };
  new MutationObserver(onRoute).observe(app, { attributes: true, attributeFilter: ["data-route"] });
  function onEnter() { syncTabs(); setTimeout(() => say("Hai, Ila! Aku Si Hati. Ketuk aku kalau kangen ♡", 5200), 2600); seenRoute.add(app.dataset.route || "story"); }
  if (!app.hidden) onEnter();

  /* ============ LIGHTBOX: geser untuk ganti, ketuk 2x untuk favorit ============ */
  safe(() => {
    const lb = $("#lightbox"); if (!lb) return;
    const heart = document.createElement("div");
    heart.className = "fx-lb-heart"; heart.textContent = "♥"; heart.setAttribute("aria-hidden", "true");
    lb.appendChild(heart);
    let sx = 0, sy = 0, st = 0, lastTapT = 0, moved = false;
    lb.addEventListener("touchstart", e => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); moved = false;
    }, { passive: true });
    lb.addEventListener("touchmove", () => { moved = true; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (e.target.closest("button")) return;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - st < 700) {
        $(dx < 0 ? ".lb-next" : ".lb-prev", lb)?.click(); navigator.vibrate?.(10); return;
      }
      if (!moved && e.target.tagName === "IMG") {
        const now = Date.now();
        if (now - lastTapT < 320) {
          e.preventDefault();
          $(".lb-fav", lb)?.click();
          heart.classList.remove("pop"); void heart.offsetWidth; heart.classList.add("pop");
          navigator.vibrate?.(25); lastTapT = 0;
        } else lastTapT = now;
      }
    }, { passive: false });
    // petunjuk sekali per sesi
    new MutationObserver(() => {
      if (lb.hidden || !matchMedia("(hover: none)").matches || sessionStorage.getItem("fx-lb-hint")) return;
      sessionStorage.setItem("fx-lb-hint", "1");
      const h = document.createElement("div");
      h.className = "fx-lb-hint"; h.textContent = "geser untuk ganti foto · ketuk 2x untuk ♥";
      lb.appendChild(h); setTimeout(() => h.remove(), 5200);
    }).observe(lb, { attributes: true, attributeFilter: ["hidden"] });
  });

  /* ============ Ukuran viewport akurat di Android (bar alamat) ============ */
  const setVh = () => document.documentElement.style.setProperty("--fx-vh", `${innerHeight * .01}px`);
  setVh(); addEventListener("resize", setVh, { passive: true });
})();
