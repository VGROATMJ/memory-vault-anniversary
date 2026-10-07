(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = document.getElementById("app");
  if (!app) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const safe = fn => { try { fn(); } catch (e) { console.warn("finale2:", e); } };

  /* ============ CONFETTI HATI ============ */
  const confetti = (n = 36) => {
    if (reduced) return;
    const glyphs = ["♥", "♡", "✦", "❀", "♥"];
    const colors = ["#ff8fab", "#ffb3c4", "#ebc68f", "#e5607f", "#fff4ef", "#c9a7ff"];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "fx-confetti"; c.textContent = rnd(glyphs);
      c.style.left = `${Math.random() * 100}vw`;
      c.style.color = rnd(colors);
      c.style.fontSize = `${12 + Math.random() * 18}px`;
      c.style.animationDuration = `${2.6 + Math.random() * 2.2}s`;
      c.style.animationDelay = `${Math.random() * .6}s`;
      c.style.setProperty("--cx", `${(Math.random() - .5) * 140}px`);
      c.style.setProperty("--cr", `${(Math.random() - .5) * 720}deg`);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5600);
    }
  };
  window.fxConfetti = confetti;
  new MutationObserver(() => { if (!app.hidden) setTimeout(() => confetti(26), 700); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });

  /* ============ STIKER MELAYANG ============ */
  const S = {
    star: '<svg viewBox="0 0 64 64"><path d="M32 6l7.5 17.5L58 25l-14 12.500L48 56 32 46 16 56l4-18.500L6 25l18.500-1.500z" fill="#ffe08a" stroke="#c98f2b" stroke-width="2.500" stroke-linejoin="round"/><circle cx="26" cy="33" r="2" fill="#5a2a1a"/><circle cx="38" cy="33" r="2" fill="#5a2a1a"/><path d="M28 38c2 2 6 2 8 0" stroke="#5a2a1a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="38" rx="3" ry="2" fill="#ff9db4" opacity=".8"/><ellipse cx="42" cy="38" rx="3" ry="2" fill="#ff9db4" opacity=".8"/></svg>',
    flower: '<svg viewBox="0 0 64 64"><g fill="#ffc2d1" stroke="#d6627f" stroke-width="2"><circle cx="32" cy="14" r="11"/><circle cx="50" cy="28" r="11"/><circle cx="43" cy="49" r="11"/><circle cx="21" cy="49" r="11"/><circle cx="14" cy="28" r="11"/></g><circle cx="32" cy="34" r="12" fill="#ffe08a" stroke="#c98f2b" stroke-width="2"/><circle cx="28" cy="32" r="1.800" fill="#5a2a1a"/><circle cx="36" cy="32" r="1.800" fill="#5a2a1a"/><path d="M29 37c1.500 1.500 4.500 1.500 6 0" stroke="#5a2a1a" stroke-width="1.800" fill="none" stroke-linecap="round"/></svg>',
    cloud: '<svg viewBox="0 0 64 64"><path d="M18 46a12 12 0 0 1-1-23.900A15 15 0 0 1 45 20a13 13 0 0 1 3 26z" fill="#fff4ef" stroke="#b9a1c9" stroke-width="2.500" stroke-linejoin="round"/><circle cx="26" cy="34" r="2.200" fill="#5a2a1a"/><circle cx="38" cy="34" r="2.200" fill="#5a2a1a"/><path d="M29 39c2 2 4 2 6 0" stroke="#5a2a1a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="21" cy="39" rx="3.500" ry="2.200" fill="#ff9db4" opacity=".75"/><ellipse cx="43" cy="39" rx="3.500" ry="2.200" fill="#ff9db4" opacity=".75"/></svg>',
    spark: '<svg viewBox="0 0 64 64"><path d="M32 4c2 15 8 21 28 28-20 7-26 13-28 28-2-15-8-21-28-28 20-7 26-13 28-28z" fill="#fff4ef" stroke="#ebc68f" stroke-width="2.500" stroke-linejoin="round"/></svg>',
    cherry: '<svg viewBox="0 0 64 64"><path d="M22 40C24 28 30 16 42 8M44 42C44 30 44 20 42 8" stroke="#4d8a4a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 8c8-2 14 2 16 8-8 2-14-1-16-8z" fill="#6bb868" stroke="#3d7a3a" stroke-width="2"/><circle cx="22" cy="46" r="12" fill="#e5304f" stroke="#a31232" stroke-width="2.500"/><circle cx="46" cy="48" r="11" fill="#ff5470" stroke="#a31232" stroke-width="2.500"/><circle cx="18" cy="42" r="3" fill="#fff" opacity=".6"/><circle cx="42" cy="44" r="3" fill="#fff" opacity=".6"/></svg>'
  };
  const place = (host, list) => {
    if (!host || $(".fx-stickers", host)) return;
    const layer = document.createElement("div");
    layer.className = "fx-stickers"; layer.setAttribute("aria-hidden", "true");
    list.forEach(([k, css]) => {
      const e = document.createElement("span");
      e.className = "fx-sticker"; e.style.cssText = css; e.innerHTML = S[k];
      layer.appendChild(e);
    });
    host.appendChild(layer);
  };
  safe(() => {
    place($(".hero-section"), [
      ["star", "right:6%;top:3%;--w:50px;--r:12deg;--d:5.5s"],
      ["cloud", "left:62%;top:30%;--w:56px;--r:-6deg;--d:7s;--dl:-2s"],
      ["spark", "left:4%;bottom:3%;--w:38px;--r:0deg;--d:4.5s;--dl:-1s"],
      ["cherry", "right:5%;bottom:7%;--w:48px;--r:10deg;--d:6.5s;--dl:-3s"]
    ]);
    place($(".final-section"), [
      ["flower", "left:7%;top:8%;--w:52px;--r:-8deg;--d:6s"],
      ["star", "right:8%;top:14%;--w:46px;--r:10deg;--d:5s;--dl:-2s"],
      ["cloud", "left:10%;bottom:6%;--w:54px;--r:6deg;--d:7s;--dl:-1s"],
      ["cherry", "right:9%;bottom:8%;--w:44px;--r:-10deg;--d:6s;--dl:-3s"]
    ]);
  });

  /* ============ CORETAN DI HERO ============ */
  safe(() => {
    const pills = $(".cute-pills");
    if (!pills || $(".fx-doodle")) return;
    const d = document.createElement("div");
    d.className = "fx-doodle";
    d.innerHTML = '<svg viewBox="0 0 54 30" aria-hidden="true"><path d="M50 6C36 2 22 6 12 22M12 22l-1-9M12 22l9-3"/></svg><span>ini bukan spam, ini cinta ♡</span>';
    pills.after(d);
  });

  /* ============ FOTO: pita washi + miring tipis ============ */
  safe(() => {
    const grid = $("#photoGrid");
    if (!grid) return;
    const deco = () => $$(".photo-card", grid).forEach((c, i) => {
      if (c.dataset.fxd) return; c.dataset.fxd = "1";
      c.style.setProperty("--tilt", `${(((i * 37) % 5) - 2) * .32}deg`);
      if (i % 2 === 0 || i % 7 === 0) c.classList.add("fx-taped");
    });
    deco();
    new MutationObserver(() => setTimeout(deco, 0)).observe(grid, { childList: true });
  });

  /* ============ KUPON CINTA ============ */
  safe(() => {
    const fin = $(".final-section");
    if (!fin || $(".fx-coupons")) return;
    const data = [
      ["Peluk", "1x peluk tanpa batas", "Berlaku kapan saja, tidak bisa ditolak.", "SAH"],
      ["Makan", "1x makan pilihan Ila", "Rama yang traktir, Rama juga yang nunggu pilihnya.", "LUNAS"],
      ["Curhat", "1x dengerin curhat", "Tanpa nyela, tanpa solusi kalau nggak diminta.", "ASLI"],
      ["Foto", "1x sesi foto sepuasnya", "Rama jadi fotografer. Janji sabar.", "DEAL"]
    ];
    const w = document.createElement("section");
    w.className = "fx-coupons"; w.setAttribute("data-fx", "message");
    w.innerHTML = `<h3>Kupon cinta untuk Ila</h3><p>ketuk kuponnya buat dibuka, semuanya berlaku selamanya</p>
      <div class="fx-coupon-grid">${data.map(([s, t, sub, tag], i) => `
        <button type="button" class="fx-coupon" aria-label="Kupon ${t}">
          <span class="fx-coupon-in"><span class="fx-coupon-stub">${i + 1}<br><small style="font-size:16px">${s}</small></span>
          <span class="fx-coupon-body"><span class="fx-coupon-tag">${tag}</span><span class="fx-coupon-title">${t}</span><span class="fx-coupon-sub">${sub}</span></span></span>
        </button>`).join("")}</div>
      <span class="fx-coupon-hint">kupon ini nggak ada tanggal kedaluwarsanya</span>`;
    fin.before(w);
    w.addEventListener("click", e => {
      const c = e.target.closest(".fx-coupon"); if (!c) return;
      const was = c.classList.contains("open");
      c.classList.toggle("open");
      navigator.vibrate?.(15);
      if (!was) confetti(10);
    });
  });

  /* ============ KIRIM PELUK ============ */
  safe(() => {
    const fin = $(".final-section");
    if (!fin || $(".fx-hug")) return;
    const w = document.createElement("section");
    w.className = "fx-hug"; w.setAttribute("data-fx", "message");
    w.innerHTML = `<h3>Kirim peluk ke Rama</h3><p>tahan tombolnya sampai penuh</p>
      <button type="button" class="fx-hug-btn" aria-label="Tahan untuk kirim peluk"><span class="fx-hug-core"><span><b>♥</b>tahan</span></span></button>
      <div class="fx-hug-note" aria-live="polite"></div>`;
    fin.before(w);
    const btn = $(".fx-hug-btn", w), note = $(".fx-hug-note", w), label = $(".fx-hug-core span", w);
    let raf = 0, t0 = 0, done = false, count = 0;
    const DUR = 1400;
    const stop = () => { cancelAnimationFrame(raf); btn.classList.remove("hold"); if (!done) { btn.style.setProperty("--p", 0); note.textContent = ""; } };
    const step = now => {
      const k = Math.min(1, (now - t0) / DUR);
      btn.style.setProperty("--p", k * 100);
      if (k < 1) { raf = requestAnimationFrame(step); return; }
      done = true; count++;
      btn.classList.remove("hold"); btn.classList.add("done");
      navigator.vibrate?.([40, 40, 80]);
      confetti(48);
      note.textContent = rnd(["Peluk terkirim! Rama langsung senyum.", "Diterima. Rama meleleh sedikit.", "Peluk ke-" + count + " sudah mendarat.", "Rama: terima kasih, aku butuh banget."]);
      label.innerHTML = "<b>♥</b>lagi?";
      setTimeout(() => { btn.classList.remove("done"); btn.style.setProperty("--p", 0); done = false; }, 1600);
    };
    const start = e => {
      if (done) return; e.preventDefault();
      btn.classList.add("hold"); note.textContent = "terus ditahan…"; t0 = performance.now();
      raf = requestAnimationFrame(step);
    };
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener("contextmenu", e => e.preventDefault());
    btn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
    btn.addEventListener("keyup", stop);
  });

  /* ============ SI HATI: pita, ngantuk, kangen ============ */
  safe(() => {
    const buddy = $(".fx-buddy"); if (!buddy) return;
    const svg = $("svg", buddy);
    svg?.insertAdjacentHTML("beforeend", '<g class="bow"><path d="M32 10l-9-6c-3 3-3 9 0 11zM32 10l9-6c3 3 3 9 0 11z" fill="#ffe08a" stroke="#c98f2b" stroke-width="1.800" stroke-linejoin="round"/><circle cx="32" cy="10" r="3" fill="#ffc34d" stroke="#c98f2b" stroke-width="1.500"/></g>');
    let idle;
    const night = () => { const h = new Date().getHours(); return h >= 23 || h < 4; };
    const arm = () => {
      clearTimeout(idle); buddy.classList.remove("sleepy");
      idle = setTimeout(() => {
        if (!document.body.classList.contains("fx-in")) return arm();
        const b = $(".fx-bubble", buddy);
        if (night()) { buddy.classList.add("sleepy"); b.textContent = "udah malam… jangan tidur terlalu larut ya, Ila"; }
        else b.textContent = rnd(["kok diam? kangen Rama ya?", "hei, aku masih di sini lho", "scroll lagi dong, masih banyak yang manis"]);
        b.classList.add("show"); buddy.classList.add("happy");
        setTimeout(() => { b.classList.remove("show"); buddy.classList.remove("happy"); }, 4200);
      }, 38000);
    };
    ["pointerdown", "scroll", "keydown"].forEach(ev => addEventListener(ev, arm, { passive: true }));
    arm();
  });
})();
