(() => {
  "use strict";
  const K = window.KONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const app = document.getElementById("app");
  if (!app) return;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const safe = fn => { try { fn(); } catch (e) { console.warn("finale3:", e); } };
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const fmt = n => Math.round(n).toLocaleString("id-ID");
  const anchor = () => $(".fx-meter-sec") || $("#timeline");

  /* ============ TALI POLAROID ============ */
  safe(() => {
    const a = anchor(); const gal = K.galeri || [];
    if (!a || !gal.length || $(".fx-garland")) return;
    const caps = ["lucu", "kangen", "hari itu", "manis", "ketawa", "favoritku", "gemes", "awet ya", "senyum", "pulang", "kita", "jangan lupa"];
    const step = Math.max(1, Math.floor(gal.length / 12));
    const picks = Array.from({ length: 12 }, (_, i) => gal[(i * step + 3) % gal.length]).filter(Boolean);
    const sec = mk("section", "fx-garland");
    sec.dataset.fx = "story";
    sec.innerHTML = `<div class="fx-garland-head"><h3 class="fx-h">Jemuran kenangan</h3><p class="fx-sub">digantung pakai jepitan, geser ke samping ya</p></div>
      <div class="fx-garland-scroll"><div class="fx-garland-row">${picks.map((p, i) =>
        `<figure class="fx-pol" style="--sd:${(4 + (i % 4) * .7).toFixed(1)}s;--sl:${(-i * .6).toFixed(1)}s"><img src="${p.foto}" alt="Kenangan ${i + 1}" loading="lazy" draggable="false"><span>${caps[i % caps.length]}</span></figure>`).join("")}</div></div>
      <span class="fx-garland-hint">⟵ geser ⟶</span>`;
    a.after(sec);
  });

  /* ============ KITA DALAM ANGKA (LEBAY) ============ */
  safe(() => {
    const a = $(".fx-garland") || anchor();
    if (!a || $(".fx-facts")) return;
    const days = Math.max(1, Math.floor((Date.now() - new Date(K.tanggalJadian || "2022-10-07T00:00:00")) / 864e5));
    const facts = [
      [fmt(days), "hari kita sudah saling punya.", "dan masih mau nambah"],
      [fmt(days * 3), "kira-kira segitu kali Rama kepikiran “Ila udah makan belum ya?”", "estimasi yang rendah hati"],
      [fmt(days * 12), "kali senyum gara-gara kamu. Hitungan konservatif.", "aslinya lebih banyak"],
      [fmt(Math.floor(days / 7)), "minggu yang Senin-nya terasa lebih ringan.", "berkat kamu"],
      ["0", "hari yang Rama nyesel pilih kamu.", "rekor bersih"]
    ];
    const sec = mk("section", "fx-wrap");
    sec.dataset.fx = "story";
    sec.innerHTML = `<h3 class="fx-h">Kita dalam angka</h3><p class="fx-sub">versi lebay, tapi niatnya serius</p>
      <div class="fx-facts">${facts.map(([b, s, sm]) => `<div class="fx-fact"><b>${b}</b><span>${s}</span><small>${sm}</small></div>`).join("")}</div>`;
    a.after(sec);
  });

  /* ============ GOMBALAN ============ */
  safe(() => {
    const a = $(".fx-facts")?.closest(".fx-wrap") || anchor();
    if (!a || $(".fx-gombal")) return;
    const lines = [
      "Kamu tahu kenapa aku suka kopi? Karena aku nggak pernah bosan sama sesuatu yang bikin aku melek, kayak kamu.",
      "Ila, kamu itu WiFi ya? Soalnya aku selalu merasa terhubung.",
      "Kalau kamu jadi lagu, aku bakal putar berulang-ulang sampai hafal. Eh, udah hafal ding.",
      "Peta boleh salah arah, tapi hatiku selalu tahu jalan pulang: ke kamu.",
      "Aku bukan fotografer, tapi aku bisa membayangkan kita berdua dalam satu frame selamanya.",
      "Kamu kayak notifikasi dari kamu: bikin aku senyum sebelum sempat buka layar.",
      "Aku bukan matematikawan, tapi aku yakin kamu ditambah aku sama dengan cocok.",
      "Kata orang cinta itu buta. Tapi aku jelas lihat: yang paling cantik ya kamu.",
      "Kalau capek, sandaran aja. Aku bukan tembok, tapi aku usahakan nggak bikin kamu jatuh.",
      "Hari ini aku mau ngomong sesuatu. Isinya: aku masih sayang. Udah, itu aja.",
      "Kamu itu alasan kenapa 'bentar lagi nyampe' selalu aku ucapkan dengan semangat.",
      "Jadi, kapan kita jalan lagi? Aku udah siapin senyum paling bagus."
    ];
    let i = Math.floor(Math.random() * lines.length);
    const sec = mk("section", "fx-wrap");
    sec.dataset.fx = "story";
    sec.innerHTML = `<div class="fx-gombal"><h3>kartu gombalan hari ini</h3><p>${lines[i]}</p><button type="button">Gombalan lagi ♡</button></div>`;
    a.after(sec);
    const p = $("p", sec);
    $("button", sec).addEventListener("click", () => {
      navigator.vibrate?.(12);
      p.classList.add("swap");
      setTimeout(() => { i = (i + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length; p.textContent = lines[i]; p.classList.remove("swap"); }, 230);
    });
  });

  /* ============ GAME TANGKAP HATI ============ */
  safe(() => {
    const host = $(".music-section");
    if (!host || $(".fx-game")) return;
    const KEY = "fx-catch-best";
    let best = 0; try { best = +localStorage.getItem(KEY) || 0; } catch {}
    const sec = mk("section", "fx-wrap");
    sec.dataset.fx = "videos";
    sec.innerHTML = `<div class="fx-game"><h3 class="fx-h" style="margin-bottom:4px">Tangkap hati Rama</h3><p class="fx-sub" style="margin-top:0">20 detik. Hati merah +1, emas +5, awan mendung −2.</p>
      <div class="fx-game-bar"><span>Skor <b class="g-score">0</b></span><span>Waktu <b class="g-time">20</b></span><span>Rekor <b class="g-best">${best}</b></span></div>
      <div class="fx-arena"><div class="fx-arena-msg">Siap menangkap?</div></div>
      <button type="button" class="primary-btn g-start">Mulai <span>♡</span></button></div>`;
    host.after(sec);
    const arena = $(".fx-arena", sec), msg = $(".fx-arena-msg", sec), btn = $(".g-start", sec);
    const sEl = $(".g-score", sec), tEl = $(".g-time", sec), bEl = $(".g-best", sec);
    let score = 0, left = 20, running = false, spawnT = 0, tickT = 0;
    const end = () => {
      running = false; clearTimeout(spawnT); clearInterval(tickT);
      arena.querySelectorAll(".fx-target").forEach(t => t.remove());
      if (score > best) { best = score; bEl.textContent = best; try { localStorage.setItem(KEY, best); } catch {} }
      const text = score >= 30 ? "Luar biasa! Hati Rama ketangkap semua. Kamu memang juaranya." : score >= 15 ? "Lumayan! Rama makin yakin kamu pantas dapat semua hatinya." : "Nggak apa-apa. Aslinya hati Rama sudah kamu pegang kok.";
      msg.innerHTML = `Skor ${score}<br><span style="font-size:20px">${text}</span>`; msg.style.display = "grid";
      btn.innerHTML = "Main lagi <span>♡</span>"; btn.disabled = false;
      if (score >= 15) window.fxConfetti?.(40);
    };
    const spawn = () => {
      if (!running) return;
      const r = Math.random(), kind = r < .12 ? "gold" : r < .3 ? "bad" : "love";
      const t = mk("button", `fx-target ${kind === "love" ? "" : kind}`, kind === "bad" ? "☁" : "♥");
      t.type = "button"; t.setAttribute("aria-label", kind);
      const w = arena.clientWidth, h = arena.clientHeight;
      t.style.left = `${30 + Math.random() * (w - 60)}px`; t.style.top = `${30 + Math.random() * (h - 60)}px`;
      const hit = e => {
        e.preventDefault(); if (!running || t.classList.contains("hit")) return;
        score = Math.max(0, score + (kind === "gold" ? 5 : kind === "bad" ? -2 : 1)); sEl.textContent = score;
        navigator.vibrate?.(kind === "bad" ? 40 : 10); t.classList.add("hit"); setTimeout(() => t.remove(), 300);
      };
      t.addEventListener("pointerdown", hit);
      arena.appendChild(t);
      setTimeout(() => t.remove(), kind === "gold" ? 900 : 1300);
      spawnT = setTimeout(spawn, Math.max(300, 700 - (20 - left) * 18));
    };
    btn.addEventListener("click", () => {
      if (running) return;
      score = 0; left = 20; sEl.textContent = 0; tEl.textContent = 20; msg.style.display = "none";
      running = true; btn.disabled = true; btn.innerHTML = "Tangkap! <span>♥</span>";
      spawn();
      tickT = setInterval(() => { left--; tEl.textContent = left; if (left <= 0) end(); }, 1000);
    });
  });
})();
