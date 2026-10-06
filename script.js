(() => {
  "use strict";
  const K = window.KONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const defaultPhotos = (K.galeri || []).map((x, i) => ({...x, id:x.id || `p${String(i+1).padStart(3,"0")}`, default:true}));
  const defaultVideos = (K.video || []).map((x, i) => ({...x, id:x.id || `v${String(i+1).padStart(3,"0")}`, default:true}));
  const STORE_KEY = "memory-vault-state-v3";
  const DB_NAME = "memory-vault-local-v3";
  const DB_STORE = "files";
  let dbPromise = null;
  let customPhotos = [];
  let customVideos = [];
  let musicCustom = null;
  let editedPhotoIds = new Set();
  let state = loadState();
  let urls = new Map();
  let musicUrl = null;

  function loadState(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
      return {
        photoOrder: Array.isArray(raw.photoOrder) ? raw.photoOrder : defaultPhotos.map(x=>x.id),
        hiddenPhotos: Array.isArray(raw.hiddenPhotos) ? raw.hiddenPhotos : [],
        videoOrder: Array.isArray(raw.videoOrder) ? raw.videoOrder : defaultVideos.map(x=>x.id),
        hiddenVideos: Array.isArray(raw.hiddenVideos) ? raw.hiddenVideos : [],
      };
    }catch{return {photoOrder:defaultPhotos.map(x=>x.id),hiddenPhotos:[],videoOrder:defaultVideos.map(x=>x.id),hiddenVideos:[]};}
  }
  function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject)=>{
      if(!window.indexedDB){ resolve(null); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, {keyPath:"id"});
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(()=>null);
    return dbPromise;
  }
  async function putFile(record){ const db=await openDB(); if(!db) return false; return new Promise(resolve=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(record);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);}); }
  async function removeFile(id){ const db=await openDB(); if(!db) return; return new Promise(resolve=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();}); }
  async function getAllFiles(){ const db=await openDB(); if(!db) return []; return new Promise(resolve=>{const tx=db.transaction(DB_STORE,"readonly");const req=tx.objectStore(DB_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>resolve([]);}); }
  async function getFile(id){ const db=await openDB(); if(!db) return null; return new Promise(resolve=>{const tx=db.transaction(DB_STORE,"readonly");const req=tx.objectStore(DB_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null);}); }
  async function clearCustomFiles(){ const db=await openDB(); if(!db) return; return new Promise(resolve=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();}); }

  function allPhotos(){ return [...defaultPhotos,...customPhotos]; }
  function allVideos(){ return [...defaultVideos,...customVideos]; }
  function normalizeOrder(order, items){
    const ids = new Set(items.map(x=>x.id));
    const filtered = order.filter(id=>ids.has(id));
    const missing = items.map(x=>x.id).filter(id=>!filtered.includes(id));
    return [...filtered,...missing];
  }
  function orderedPhotos(){
    state.photoOrder = normalizeOrder(state.photoOrder, allPhotos());
    return state.photoOrder.map(id=>allPhotos().find(x=>x.id===id)).filter(Boolean).filter(x=>!state.hiddenPhotos.includes(x.id));
  }
  function orderedVideos(){
    state.videoOrder = normalizeOrder(state.videoOrder, allVideos());
    return state.videoOrder.map(id=>allVideos().find(x=>x.id===id)).filter(Boolean).filter(x=>!state.hiddenVideos.includes(x.id));
  }

  async function sourceFor(item){
    if(!item) return "";
    if(urls.has(item.id)) return urls.get(item.id);
    // A saved edit always wins over the original image. The original asset stays untouched.
    if(editedPhotoIds.has(item.id)){
      const edited = await getFile(`photo-edit-${item.id}`);
      if(edited?.blob){
        const u=URL.createObjectURL(edited.blob);
        urls.set(item.id,u);
        return u;
      }
      editedPhotoIds.delete(item.id);
    }
    if(item.default) return item.foto || item.file || "";
    if(item.blob){ const u=URL.createObjectURL(item.blob); urls.set(item.id,u); return u; }
    const f = await getFile(item.id);
    if(f?.blob){ const u=URL.createObjectURL(f.blob); urls.set(item.id,u); return u; }
    return "";
  }

  /* Lock screen */
  const lock=byId("lock"), access=byId("access"), app=byId("app");
  const input=byId("codeInput"), dots=byId("codeDots"), status=byId("lockStatus"), unlockBtn=byId("unlockBtn");
  for(let i=0;i<8;i++) dots.appendChild(document.createElement("i"));
  function updateDots(){ const v=input.value.replace(/\D/g,"").slice(0,8); input.value=v; $$('i',dots).forEach((d,i)=>d.classList.toggle("on",i<v.length)); }
  function addDigit(d){ if(input.value.length<8){ input.value+=d; updateDots(); if(input.value.length===8) setTimeout(checkCode,150); } }
  function checkCode(){
    if(input.value === (K.kodeTanggal||"07102022")){
      status.textContent="Tanggalnya benar. Ada cerita yang menunggu kamu."; status.className="lock-status ok";
      lock.classList.add("fade-in");
      setTimeout(()=>{ lock.hidden=true; access.hidden=false; access.classList.add("fade-in"); },550);
    }else{
      status.textContent="Bukan tanggal itu… coba sekali lagi, sayang."; status.className="lock-status bad";
      lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake"); input.value=""; updateDots();
    }
  }
  $$('[data-key]').forEach(b=>b.addEventListener("click",()=>addDigit(b.dataset.key)));
  $('[data-action="clear"]').addEventListener("click",()=>{input.value="";updateDots();});
  $('[data-action="back"]').addEventListener("click",()=>{input.value=input.value.slice(0,-1);updateDots();});
  input.addEventListener("input",updateDots); input.addEventListener("keydown",e=>{if(e.key==="Enter")checkCode();}); unlockBtn.addEventListener("click",checkCode);

  /* Background stars + hearts */
  const canvas=byId("stars"),ctx=canvas.getContext("2d"); let W=0,H=0,stars=[];
  function resizeStars(){W=innerWidth;H=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0);stars=Array.from({length:Math.min(130,Math.floor(W*H/11500))},()=>({x:Math.random()*W,y:Math.random()*H,r:.25+Math.random()*1.1,p:Math.random()*6.28,s:.4+Math.random()}));}
  function drawStars(t){ctx.clearRect(0,0,W,H);for(const s of stars){const a=.1+.5*((Math.sin(s.p+t*.001*s.s)+1)/2);ctx.fillStyle=`rgba(255,230,232,${a})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill();}requestAnimationFrame(drawStars)} resizeStars();addEventListener("resize",resizeStars);requestAnimationFrame(drawStars);
  function spawnPetal(){const layer=$('.petal-layer');if(!layer)return;const p=document.createElement('span');p.className='petal';p.style.left=`${Math.random()*100}%`;p.style.setProperty('--drift',`${(Math.random()-.5)*24}vw`);p.style.animationDuration=`${7+Math.random()*7}s`;layer.appendChild(p);setTimeout(()=>p.remove(),15000)} setInterval(spawnPetal,1100);for(let i=0;i<8;i++)setTimeout(spawnPetal,i*320);

  /* Intro copy */
  const openingText=byId("openingText"), openingName=byId("openingName");
  const introLines=(K.pembuka||[]).join(" ");
  if(openingText){ let idx=0; const type=()=>{ if(idx<=introLines.length){openingText.textContent=introLines.slice(0,idx);idx+=2;setTimeout(type,18);} }; setTimeout(type,750); }
  if(openingName) openingName.textContent=K.namaDia||"Sayang";
  byId("letterTo").textContent=(K.namaDia||"Sayang").toUpperCase(); byId("signName").textContent=K.namaKamu||"Rama"; byId("letterSign").textContent=K.suratTtd||"Dengan sayang,";

  /* Timer */
  const start=new Date(K.tanggalJadian||"2022-10-07T00:00:00"); const fmt=n=>Math.floor(n).toLocaleString("id-ID");
  function timer(){const ms=Math.max(0,Date.now()-start.getTime());byId("days").textContent=fmt(ms/864e5);byId("hours").textContent=fmt(ms/36e5);byId("minutes").textContent=fmt(ms/6e4);byId("seconds").textContent=fmt(ms/1e3);} timer(); setInterval(timer,1000);

  /* Chapters */
  const chapters=byId("chapters");
  (K.bab||[]).forEach((b,i)=>{const article=document.createElement("article");article.className="chapter reveal";article.innerHTML=`<div class="chapter-index">${escapeHTML(b.tahun||`0${i+1}`)}</div><div><h3>${escapeHTML(b.judul||"")}</h3><p>${escapeHTML(b.teks||"")}</p></div><figure><img src="${escapeHTML(b.foto||"")}" alt="${escapeHTML(b.judul||"Memori")}" loading="lazy"></figure>`;chapters.appendChild(article);});

  /* Reveal observer */
  const io=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting && e.target.classList.add("show")),{threshold:.08}); $$('.reveal').forEach(x=>io.observe(x));

  /* Main media gallery */
  const grid=byId("photoGrid");
  function renderPhotos(filter="all"){
    grid.innerHTML="";
    const photos=orderedPhotos();
    photos.forEach((g,i)=>{const fig=document.createElement("figure");fig.className="photo-card fade-in";fig.dataset.id=g.id;fig.dataset.orientation="unknown";fig.innerHTML=`<img src="" alt="Foto kenangan ${i+1}" loading="lazy">`; const img=fig.querySelector("img"); sourceFor(g).then(src=>{img.src=src;img.onload=()=>{const o=img.naturalWidth>img.naturalHeight*1.05?'landscape':'portrait';fig.dataset.orientation=o; if(filter!=="all") fig.style.display=o===filter?'':'none';};}); fig.addEventListener("click",()=>openLightbox(img,`Satu kenangan dari kita · ${oLabel(g)}`)); grid.appendChild(fig);});
    byId("photoCount").textContent=photos.length; saveState();
    requestAnimationFrame(()=>$$('.reveal',grid).forEach(x=>io.observe(x)));
  }
  function oLabel(g){return g.tulisan || "our little moment"}
  renderPhotos();

  $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPhotos(btn.dataset.filter);}));

  /* Videos */
  const vgrid=byId("videoGrid");
  async function renderVideos(){
    vgrid.innerHTML=""; const videos=orderedVideos(); byId("videoCount").textContent=String(videos.length).padStart(2,"0");
    for(const v of videos){const card=document.createElement("article");card.className='video-card reveal';card.innerHTML=`<video controls playsinline preload="metadata" muted></video><div class="video-label"><span>${escapeHTML(v.judul||'Film memori')}</span><span class="silent">SILENT CUT</span></div>`; const vd=card.querySelector('video'); vd.src=await sourceFor(v); vd.poster=v.poster||""; vd.addEventListener('play',()=>{if(musicPlaying)pauseMusic();});vgrid.appendChild(card);io.observe(card);}
  }
  renderVideos();

  /* Music */
  const audio=byId("bgMusic"); audio.volume=.32; let musicPlaying=false;
  function setMusicInfo(title,info){byId("musicTitle").textContent=title;byId("musicInfo").textContent=info;}
  async function getCustomMusic(){ const files=await getAllFiles(); return files.find(x=>x.id==='music-custom') || null; }
  async function loadMusic(){
    const custom=await getCustomMusic(); musicCustom=custom;
    if(custom?.blob){ if(musicUrl)URL.revokeObjectURL(musicUrl);musicUrl=URL.createObjectURL(custom.blob);audio.src=musicUrl;setMusicInfo(custom.name||"Lagu pilihan kita","Lagu yang kamu pilih dari perangkat ini."); }
    else{audio.src=K.musikDefault?.file||"assets/music/our-story-original.mp3";setMusicInfo(K.musikDefault?.judul||"Our Story — Original Instrumental",K.musikDefault?.info||"Instrumental lembut untuk menemani cerita kita.");}
  }
  function syncMusicUI(){byId("musicBtn").classList.toggle("playing",musicPlaying);byId("musicLabel").textContent=musicPlaying?"Music on":"Music off";byId("musicCardBtn").innerHTML=musicPlaying?'Jeda lagu <span>❚❚</span>':'Putar lagu <span>♪</span>';}
  async function startMusic(){try{if(!audio.src)await loadMusic();await audio.play();musicPlaying=true;syncMusicUI();}catch{musicPlaying=false;syncMusicUI();}}
  function pauseMusic(){audio.pause();musicPlaying=false;syncMusicUI();}
  async function resumeMusic(){try{await audio.play();musicPlaying=true;syncMusicUI();}catch{}}
  byId("musicBtn").addEventListener('click',()=>musicPlaying?pauseMusic():resumeMusic()); byId("musicCardBtn").addEventListener('click',()=>musicPlaying?pauseMusic():resumeMusic());
  audio.addEventListener('timeupdate',()=>{const p=audio.duration?audio.currentTime/audio.duration*100:0;byId('musicProgress').style.width=`${p}%`;});
  audio.addEventListener('ended',()=>{musicPlaying=false;syncMusicUI();});

  /* Enter story */
  byId("enterVault").addEventListener("click",()=>{access.classList.add('fade-in');setTimeout(async()=>{access.hidden=true;app.hidden=false;app.classList.add('fade-in');window.scrollTo(0,0);await loadMusic();await startMusic();},300);});

  /* Reasons */
  const reasons=K.alasan||[]; let ri=-1;
  byId('reasonBtn').addEventListener('click',()=>{if(!reasons.length)return;ri=(ri+1)%reasons.length;const p=byId('reasonText');p.classList.remove('fade-in');void p.offsetWidth;p.textContent=reasons[ri];p.classList.add('fade-in');byId('reasonIndex').textContent=`${String(ri+1).padStart(2,'0')} / ${String(reasons.length).padStart(2,'0')}`;byId('reasonBtn').innerHTML=(ri===reasons.length-1?'Mulai lagi dari awal':'Satu alasan lagi')+' <span>→</span>';});

  /* Letter */
  const letter=byId('letterText'); (K.surat||[]).forEach(txt=>{const p=document.createElement('p');p.textContent=txt;letter.appendChild(p);});
  byId('envelopeButton').addEventListener('click',()=>{byId('envelopeButton').classList.add('open','flipped');setTimeout(()=>byId('letterFrame').classList.add('open'),350);burstHearts(innerWidth/2,innerHeight*.46,18);});

  /* Lightbox */
  const lightbox=byId('lightbox'),lightImg=byId('lightboxImg'); let lightCaption=byId('lightboxCaption');
  if(!lightCaption){lightCaption=document.createElement('div');lightCaption.className='lightbox-caption';lightbox.appendChild(lightCaption)}
  function openLightbox(img,caption){lightImg.src=img.currentSrc||img.src;lightImg.alt=img.alt;lightCaption.textContent=caption||"our little moment";lightbox.hidden=false;document.body.style.overflow='hidden'}
  function closeLightbox(){lightbox.hidden=true;document.body.style.overflow=''}
  lightbox.addEventListener('click',e=>{if(e.target===lightbox||e.target===byId('lightboxClose'))closeLightbox()}); addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});

  /* Final */
  byId('finalBtn').addEventListener('click',()=>{const box=byId('finalMessage');box.textContent=K.kejutan||"Aku tetap memilih kamu.";box.hidden=false;burstHearts(innerWidth/2,innerHeight*.35,28);});
  function burstHearts(x,y,count=20){for(let i=0;i<count;i++){const h=document.createElement('span');h.className='burst-heart';h.textContent=Math.random()>.22?'♡':'♥';h.style.left=x+'px';h.style.top=y+'px';h.style.setProperty('--x',`${(Math.random()-.5)*min(innerWidth*.9,700)}px`);h.style.setProperty('--y',`${(Math.random()-.55)*min(innerHeight*.75,560)}px`);h.style.setProperty('--r',`${(Math.random()-.5)*60}deg`);h.style.animationDelay=`${Math.random()*.12}s`;document.body.appendChild(h);setTimeout(()=>h.remove(),1800);}}
  const min=(a,b)=>Math.min(a,b);

  /* Media manager */
  const manager=byId('manager');
  const managerPhotos=byId('managerPhotos'),managerVideos=byId('managerVideos'),managerMusic=byId('managerMusic');
  function openManager(){renderManagerPhotos();renderManagerVideos();manager.hidden=false;switchManagerTab('photos');}
  function closeManager(){manager.hidden=true;}
  byId('manageBtn').addEventListener('click',openManager); byId('manageGalleryBtn').addEventListener('click',openManager); byId('managerClose').addEventListener('click',closeManager); byId('managerDone').addEventListener('click',closeManager); $('.modal-backdrop',manager).addEventListener('click',closeManager);
  $$('.manager-tab').forEach(t=>t.addEventListener('click',()=>switchManagerTab(t.dataset.manageTab)));
  function switchManagerTab(tab){$$('.manager-tab').forEach(t=>t.classList.toggle('active',t.dataset.manageTab===tab));managerPhotos.hidden=tab!=='photos';managerVideos.hidden=tab!=='videos';managerMusic.hidden=tab!=='music';}

  function managerToolbar(type,count){
    const name=type==='photos'?'foto':'video';
    const note = type==='photos'
      ? `${count} foto aktif · geser untuk urutan · Edit untuk crop & atur framing`
      : `${count} video aktif · tarik untuk menggeser urutan`;
    return `<div class="manager-toolbar"><span>${note}</span><button class="soft-btn" data-add-type="${type}">＋ Tambah ${name}</button></div>`
  }
  let swapPhotoId = null;

  async function renderManagerPhotos(){
    const items=orderedPhotos();
    managerPhotos.innerHTML=managerToolbar('photos',items.length)+`<div class="manager-swap-hint" id="managerSwapHint">✦ Pilih dua foto dengan tombol ↔ untuk langsung menukar posisinya.</div><div class="manager-list" id="photoManagerList"></div>`;
    const hint=byId('managerSwapHint');
    const list=byId('photoManagerList'); list.innerHTML='';
    for(let i=0;i<items.length;i++){
      const item=items[i];
      const row=document.createElement('div');
      row.className='manager-item'+(swapPhotoId===item.id?' swap-selected':'');
      row.draggable=true;
      row.dataset.id=item.id;
      row.innerHTML=`<div class="manager-thumb"><img alt=""></div><div class="manager-main"><strong>${item.default?`Memory ${String(defaultPhotos.indexOf(item)+1).padStart(3,'0')}`:escapeHTML(item.name||'Foto tambahan')}</strong><span>${item.default?'MEDIA AWAL':'DITAMBAHKAN SENDIRI'}${item.default?'':' · LOKAL'}${editedPhotoIds.has(item.id)?' · EDITED':''}</span></div><div class="manager-actions"><button class="mini-btn edit-photo-btn" data-edit title="Edit foto">✂</button><button class="mini-btn swap-btn" data-swap title="Tukar posisi">↔</button><button class="mini-btn" data-move="up" title="Naik">↑</button><button class="mini-btn" data-move="down" title="Turun">↓</button><button class="mini-btn danger" data-delete title="Hapus">×</button></div>`;
      const img=row.querySelector('img'); img.src=await sourceFor(item);
      row.querySelector('[data-edit]').onclick=(e)=>{e.stopPropagation();openPhotoEditor(item);};
      row.querySelector('[data-swap]').onclick=(e)=>{
        e.stopPropagation();
        if(!swapPhotoId){ swapPhotoId=item.id; hint.textContent=`✦ ${item.default?`Memory ${String(defaultPhotos.indexOf(item)+1).padStart(3,'0')}`:'Foto pilihan'} dipilih. Sekarang tekan ↔ pada foto kedua.`; renderManagerPhotos(); return; }
        if(swapPhotoId===item.id){ swapPhotoId=null; hint.textContent='✦ Pilih dua foto dengan tombol ↔ untuk langsung menukar posisinya.'; renderManagerPhotos(); return; }
        const first=swapPhotoId; swapPhotoId=null; swapItems('photos',first,item.id);
      };
      row.querySelector('[data-move="up"]').onclick=()=>moveItem('photos',item.id,-1);
      row.querySelector('[data-move="down"]').onclick=()=>moveItem('photos',item.id,1);
      row.querySelector('[data-delete]').onclick=()=>deleteItem('photos',item.id);
      row.addEventListener('dragstart',e=>{e.dataTransfer.effectAllowed='move';row.classList.add('dragging');});
      row.addEventListener('dragend',()=>row.classList.remove('dragging'));
      row.addEventListener('dragover',e=>e.preventDefault());
      row.addEventListener('drop',()=>{const dragging=$('.manager-item.dragging',list);if(dragging&&dragging!==row){reorderItems('photos',dragging.dataset.id,row.dataset.id);}});
      list.appendChild(row);
    }
    $('.manager-toolbar [data-add-type="photos"]').onclick=()=>byId('photoUpload').click();
  }

  async function renderManagerVideos(){
    const items=orderedVideos(); managerVideos.innerHTML=managerToolbar('videos',items.length)+`<div class="manager-list" id="videoManagerList"></div>`;const list=byId('videoManagerList');list.innerHTML='';
    for(let i=0;i<items.length;i++){const item=items[i];const row=document.createElement('div');row.className='manager-item';row.draggable=true;row.dataset.id=item.id;row.innerHTML=`<div class="manager-thumb"><video muted playsinline></video></div><div class="manager-main"><strong>${item.default?escapeHTML(item.judul||`Film ${i+1}`):escapeHTML(item.name||'Video tambahan')}</strong><span>${item.default?'SILENT CUT':'DITAMBAHKAN SENDIRI'}</span></div><div class="manager-actions"><button class="mini-btn" data-move="up">↑</button><button class="mini-btn" data-move="down">↓</button><button class="mini-btn danger" data-delete>×</button></div>`;const vd=row.querySelector('video');vd.src=await sourceFor(item);vd.onmouseenter=()=>vd.play().catch(()=>{});vd.onmouseleave=()=>{vd.pause();vd.currentTime=0};row.querySelector('[data-move="up"]').onclick=()=>moveItem('videos',item.id,-1);row.querySelector('[data-move="down"]').onclick=()=>moveItem('videos',item.id,1);row.querySelector('[data-delete]').onclick=()=>deleteItem('videos',item.id);row.addEventListener('dragstart',e=>{e.dataTransfer.effectAllowed='move';row.classList.add('dragging');});row.addEventListener('dragend',()=>row.classList.remove('dragging'));row.addEventListener('dragover',e=>e.preventDefault());row.addEventListener('drop',()=>{const dragging=$('.manager-item.dragging',list);if(dragging&&dragging!==row)reorderItems('videos',dragging.dataset.id,row.dataset.id);});list.appendChild(row);}
    $('.manager-toolbar [data-add-type="videos"]').onclick=()=>byId('videoUpload').click();
  }
  function orderKey(type){return type==='photos'?'photoOrder':'videoOrder'}
  function hiddenKey(type){return type==='photos'?'hiddenPhotos':'hiddenVideos'}
  function moveItem(type,id,delta){const key=orderKey(type);const arr=state[key].slice();const i=arr.indexOf(id);const j=i+delta;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];state[key]=arr;saveState();refreshAll(type);}
  function reorderItems(type,a,b){const key=orderKey(type);const arr=state[key].slice();const ia=arr.indexOf(a),ib=arr.indexOf(b);if(ia<0||ib<0||ia===ib)return;arr.splice(ia,1);arr.splice(arr.indexOf(b),0,a);state[key]=arr;saveState();refreshAll(type);}
  function swapItems(type,a,b){const key=orderKey(type);const arr=state[key].slice();const ia=arr.indexOf(a),ib=arr.indexOf(b);if(ia<0||ib<0||ia===ib)return;[arr[ia],arr[ib]]=[arr[ib],arr[ia]];state[key]=arr;saveState();refreshAll(type);byId('managerStatus').textContent='Posisi dua foto sudah ditukar.';}
  async function deleteItem(type,id){
    if(!confirm('Hapus media ini dari galeri?'))return;
    const item=(type==='photos'?allPhotos():allVideos()).find(x=>x.id===id); const key=orderKey(type),hidden=hiddenKey(type);
    if(type==='photos'){ await removeFile(`photo-edit-${id}`); editedPhotoIds.delete(id); if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);} }
    state[key]=state[key].filter(x=>x!==id); if(item?.default)state[hidden]=[...new Set([...state[hidden],id])]; else await removeFile(id); saveState();refreshAll(type);
  }
  async function refreshAll(type){if(type==='photos'){renderPhotos($('.filter.active')?.dataset.filter||'all');await renderManagerPhotos();}else{await renderVideos();await renderManagerVideos();}}

  byId('photoUpload').addEventListener('change',async e=>{for(const file of e.target.files||[]){if(!file.type.startsWith('image/'))continue;const id=`custom-photo-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;await putFile({id,type:'photo',name:file.name,blob:file});customPhotos.push({id,name:file.name,blob:file,default:false});state.photoOrder.push(id);}saveState();e.target.value='';await refreshAll('photos');byId('managerStatus').textContent='Foto ditambahkan dan tersimpan di browser.';});
  byId('videoUpload').addEventListener('change',async e=>{for(const file of e.target.files||[]){if(!file.type.startsWith('video/'))continue;const id=`custom-video-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;await putFile({id,type:'video',name:file.name,blob:file});customVideos.push({id,name:file.name,blob:file,default:false});state.videoOrder.push(id);}saveState();e.target.value='';await refreshAll('videos');byId('managerStatus').textContent='Video ditambahkan dan tersimpan di browser.';});
  async function handleMusicUpload(file){if(!file||!file.type.startsWith('audio/'))return;await putFile({id:'music-custom',type:'music',name:file.name,blob:file});await loadMusic();await resumeMusic();byId('managerStatus').textContent='Lagu baru aktif.';}
  byId('musicUpload').addEventListener('change',e=>handleMusicUpload(e.target.files?.[0])); byId('managerMusicUpload').addEventListener('change',e=>handleMusicUpload(e.target.files?.[0]));
  byId('resetMedia').addEventListener('click',async()=>{if(!confirm('Kembalikan semua media ke kondisi awal? Foto/video tambahan dan lagu pilihan akan dihapus dari browser.'))return;await clearCustomFiles();customPhotos=[];customVideos=[];musicCustom=null;editedPhotoIds.clear();state={photoOrder:defaultPhotos.map(x=>x.id),hiddenPhotos:[],videoOrder:defaultVideos.map(x=>x.id),hiddenVideos:[]};saveState();if(musicUrl)URL.revokeObjectURL(musicUrl);musicUrl=null;await loadMusic();pauseMusic();renderPhotos();await renderVideos();await renderManagerPhotos();await renderManagerVideos();byId('managerStatus').textContent='Media awal sudah dipulihkan.';});

  async function hydrateCustom(){const files=await getAllFiles();customPhotos=files.filter(x=>x.type==='photo').map(x=>({...x,default:false}));customVideos=files.filter(x=>x.type==='video').map(x=>({...x,default:false}));editedPhotoIds=new Set(files.filter(x=>x.type==='photo-edit').map(x=>String(x.id).replace(/^photo-edit-/,'') ));if(musicCustom)musicCustom=files.find(x=>x.id==='music-custom')||null;state.photoOrder=normalizeOrder(state.photoOrder,allPhotos());state.videoOrder=normalizeOrder(state.videoOrder,allVideos());saveState();renderPhotos();await renderVideos();}
  hydrateCustom();

  /* ============================================================
     PHOTO EDITOR — crop / zoom / rotate / reframe + saved edit
     ============================================================ */
  let photoEditorModal = null;
  let photoEditorState = null;

  function ensurePhotoEditor(){
    if(photoEditorModal) return photoEditorModal;
    photoEditorModal=document.createElement('div');
    photoEditorModal.className='photo-editor-modal';
    photoEditorModal.hidden=true;
    photoEditorModal.innerHTML=`
      <div class="photo-editor-backdrop"></div>
      <div class="photo-editor-panel" role="dialog" aria-modal="true" aria-labelledby="photoEditorTitle">
        <div class="photo-editor-head">
          <div><span class="eyebrow">PHOTO STUDIO · PRIVATE</span><h2 id="photoEditorTitle">Atur satu kenangan</h2><p id="photoEditorMeta">Crop, geser, zoom, dan pilih framing yang paling enak dilihat.</p></div>
          <button class="close-btn" id="photoEditorClose" type="button">×</button>
        </div>
        <div class="photo-editor-layout">
          <div class="photo-editor-stage" id="photoEditorStage">
            <img id="photoEditorImg" alt="Pratinjau foto">
            <div class="photo-editor-dim top"></div><div class="photo-editor-dim left"></div><div class="photo-editor-dim right"></div><div class="photo-editor-dim bottom"></div>
            <div class="photo-editor-crop" id="photoEditorCrop"><span class="crop-corner tl"></span><span class="crop-corner tr"></span><span class="crop-corner bl"></span><span class="crop-corner br"></span><span class="crop-center">⟡</span></div>
            <div class="photo-editor-stage-note">drag foto untuk mengatur posisi</div>
          </div>
          <aside class="photo-editor-controls">
            <div class="editor-control-card">
              <span class="editor-kicker">CROP RATIO</span>
              <div class="editor-ratios" id="photoEditorRatios">
                <button type="button" data-ratio="original" class="active">Original</button><button type="button" data-ratio="free">Free</button><button type="button" data-ratio="1:1">1 : 1</button><button type="button" data-ratio="4:5">4 : 5</button><button type="button" data-ratio="3:4">3 : 4</button><button type="button" data-ratio="16:9">16 : 9</button>
              </div>
            </div>
            <div class="editor-control-card">
              <span class="editor-kicker">ZOOM</span>
              <div class="editor-range-row"><span>−</span><input id="photoEditorZoom" type="range" min="1" max="2.8" step="0.01" value="1.08"><span>＋</span></div>
            </div>
            <div class="editor-control-card editor-tools-row"><button type="button" id="photoEditorRotateLeft">↺ 90°</button><button type="button" id="photoEditorRotateRight">↻ 90°</button><button type="button" id="photoEditorReset">Reset</button></div>
            <div class="editor-preview-card"><span class="editor-kicker">LIVE PREVIEW</span><div class="editor-preview-frame" id="photoEditorPreview"><img id="photoEditorPreviewImg" alt="Preview crop"></div></div>
          </aside>
        </div>
        <div class="photo-editor-foot"><div><strong id="photoEditorState">Belum ada perubahan</strong><span>Perubahan disimpan sebagai versi edit. Foto asli tetap aman.</span></div><div class="photo-editor-actions"><button class="soft-btn" id="photoEditorRevert" type="button">Kembalikan asli</button><button class="primary-btn" id="photoEditorSave" type="button">Simpan Edit <span>✓</span></button></div></div>
      </div>`;
    document.body.appendChild(photoEditorModal);
    photoEditorModal.querySelector('.photo-editor-backdrop').addEventListener('click',closePhotoEditor);
    byId('photoEditorClose').addEventListener('click',closePhotoEditor);
    byId('photoEditorSave').addEventListener('click',savePhotoEdit);
    byId('photoEditorRevert').addEventListener('click',revertPhotoEdit);
    byId('photoEditorReset').addEventListener('click',()=>resetPhotoEditor(false));
    byId('photoEditorRotateLeft').addEventListener('click',()=>rotatePhotoEditor(-90));
    byId('photoEditorRotateRight').addEventListener('click',()=>rotatePhotoEditor(90));
    byId('photoEditorZoom').addEventListener('input',e=>{if(!photoEditorState)return;photoEditorState.zoom=Number(e.target.value);clampEditorPosition();updateEditorUI();});
    $$('#photoEditorRatios button').forEach(btn=>btn.addEventListener('click',()=>setEditorRatio(btn.dataset.ratio)));

    const stage=byId('photoEditorStage');
    let dragging=false,lastX=0,lastY=0;
    const start=(x,y)=>{if(!photoEditorState)return;dragging=true;lastX=x;lastY=y;stage.classList.add('dragging');};
    const move=(x,y)=>{if(!dragging||!photoEditorState)return;photoEditorState.x+=x-lastX;photoEditorState.y+=y-lastY;lastX=x;lastY=y;clampEditorPosition();updateEditorUI();};
    const end=()=>{dragging=false;stage.classList.remove('dragging');};
    stage.addEventListener('pointerdown',e=>{if(e.target.closest('.photo-editor-crop')){start(e.clientX,e.clientY);stage.setPointerCapture?.(e.pointerId);e.preventDefault();}});
    stage.addEventListener('pointermove',e=>move(e.clientX,e.clientY));
    stage.addEventListener('pointerup',end); stage.addEventListener('pointercancel',end);
    return photoEditorModal;
  }

  function editorStageMetrics(){
    const stage=byId('photoEditorStage');
    const rect=stage.getBoundingClientRect();
    return {stage,rect,w:rect.width,h:rect.height};
  }
  function editorCropRect(){
    const {w,h}=editorStageMetrics();
    if(!photoEditorState)return {x:w*.12,y:h*.08,w:w*.76,h:h*.84};
    const ratio=photoEditorState.ratio;
    const inset=22;
    let cw=w-inset*2,ch=h-inset*2;
    if(ratio!=='free'){
      const r=ratio==='original'?photoEditorState.displayRatio:parseRatio(ratio);
      if(cw/ch>r) cw=ch*r; else ch=cw/r;
    }
    return {x:(w-cw)/2,y:(h-ch)/2,w:cw,h:ch};
  }
  function parseRatio(v){const [a,b]=String(v).split(':').map(Number);return (a&&b)?a/b:1;}
  function setEditorRatio(ratio){
    if(!photoEditorState)return;
    photoEditorState.ratio=ratio;
    $$('#photoEditorRatios button').forEach(b=>b.classList.toggle('active',b.dataset.ratio===ratio));
    clampEditorPosition();updateEditorUI();
  }
  function rotatePhotoEditor(delta){
    if(!photoEditorState)return;
    photoEditorState.rotate=(photoEditorState.rotate+delta+360)%360;
    clampEditorPosition();updateEditorUI();
  }
  function editorRawImageDimensions(){
    const s=photoEditorState;
    return {w:s.naturalWidth*s.baseScale*s.zoom,h:s.naturalHeight*s.baseScale*s.zoom};
  }
  function editorImageDimensions(){
    const s=photoEditorState;
    const raw=editorRawImageDimensions();
    return Math.abs(s.rotate%180)===90 ? {w:raw.h,h:raw.w} : raw;
  }
  function clampEditorPosition(){
    if(!photoEditorState||!photoEditorState.imgReady)return;
    const {w,h}=editorStageMetrics(); const crop=editorCropRect();
    const d=editorImageDimensions();
    const marginX=Math.max(0,(d.w-crop.w)/2); const marginY=Math.max(0,(d.h-crop.h)/2);
    photoEditorState.x=Math.max(-marginX,Math.min(marginX,photoEditorState.x));
    photoEditorState.y=Math.max(-marginY,Math.min(marginY,photoEditorState.y));
    // Keep the whole crop area covered even near the stage edges.
    const fitX=(w-d.w)/2; const fitY=(h-d.h)/2;
    photoEditorState.x=Math.max(fitX+crop.w/2-d.w/2,Math.min(d.w/2-crop.w/2+fitX,photoEditorState.x));
    photoEditorState.y=Math.max(fitY+crop.h/2-d.h/2,Math.min(d.h/2-crop.h/2+fitY,photoEditorState.y));
  }
  function imageTransform(){
    const s=photoEditorState;
    return `translate3d(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px), 0) rotate(${s.rotate}deg)`;
  }
  function updateEditorPreview(){
    const p=byId('photoEditorPreview'), pi=byId('photoEditorPreviewImg'); if(!p||!pi||!photoEditorState)return;
    const crop=editorCropRect(); p.style.aspectRatio=String(crop.w/crop.h);
    pi.src=photoEditorState.src;
    requestAnimationFrame(()=>{
      const rect=p.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const scale=rect.width/crop.w; const raw=editorRawImageDimensions();
      pi.style.width=`${raw.w*scale}px`; pi.style.height=`${raw.h*scale}px`;
      pi.style.transform=`translate3d(calc(-50% + ${photoEditorState.x*scale}px), calc(-50% + ${photoEditorState.y*scale}px), 0) rotate(${photoEditorState.rotate}deg)`;
    });
  }
  function updateEditorUI(){
    if(!photoEditorState)return;
    const img=byId('photoEditorImg'); const raw=editorRawImageDimensions(); img.style.width=`${raw.w}px`;img.style.height=`${raw.h}px`;img.style.transform=imageTransform();
    const crop=editorCropRect(), cropEl=byId('photoEditorCrop'); cropEl.style.left=`${crop.x}px`;cropEl.style.top=`${crop.y}px`;cropEl.style.width=`${crop.w}px`;cropEl.style.height=`${crop.h}px`;
    byId('photoEditorZoom').value=String(photoEditorState.zoom);
    byId('photoEditorState').textContent=`${photoEditorState.ratio==='original'?'ORIGINAL':photoEditorState.ratio.toUpperCase()} · zoom ${photoEditorState.zoom.toFixed(2)}× · rotate ${photoEditorState.rotate}°`;
    updateEditorPreview();
  }
  function openPhotoEditor(item){
    ensurePhotoEditor();
    photoEditorModal.hidden=false;document.body.style.overflow='hidden';
    const img=byId('photoEditorImg');
    byId('photoEditorTitle').textContent=item.default?`Edit Memory ${String(defaultPhotos.indexOf(item)+1).padStart(3,'0')}`:`Edit ${item.name||'Foto pilihan'}`;
    byId('photoEditorMeta').textContent='Atur crop dan framing sampai terasa pas. Foto asli tidak akan ditimpa.';
    photoEditorState={item,src:'',naturalWidth:0,naturalHeight:0,displayRatio:1,baseScale:1,zoom:1.08,x:0,y:0,rotate:0,ratio:'original',imgReady:false};
    sourceFor(item).then(src=>{
      if(!photoEditorState||photoEditorState.item!==item)return;
      photoEditorState.src=src;
      img.onload=()=>{
        photoEditorState.naturalWidth=img.naturalWidth;photoEditorState.naturalHeight=img.naturalHeight;photoEditorState.displayRatio=img.naturalWidth/img.naturalHeight;photoEditorState.imgReady=true;
        const {w,h}=editorStageMetrics();
        const cropW=w-44,cropH=h-44; photoEditorState.baseScale=Math.max(cropW/img.naturalWidth,cropH/img.naturalHeight);photoEditorState.zoom=1.08;photoEditorState.x=0;photoEditorState.y=0;photoEditorState.rotate=0;clampEditorPosition();updateEditorUI();
      };
      img.src=src;
    });
  }
  function closePhotoEditor(){if(!photoEditorModal)return;photoEditorModal.hidden=true;document.body.style.overflow='';photoEditorState=null;}
  function resetPhotoEditor(keepOpen){
    if(!photoEditorState)return;
    photoEditorState.zoom=1.08;photoEditorState.x=0;photoEditorState.y=0;photoEditorState.rotate=0;photoEditorState.ratio='original';
    $$('#photoEditorRatios button').forEach(b=>b.classList.toggle('active',b.dataset.ratio==='original'));
    clampEditorPosition();updateEditorUI();
    if(!keepOpen)byId('managerStatus').textContent='Framing direset ke awal.';
  }
  async function canvasFromPhotoEditor(){
    if(!photoEditorState?.imgReady)throw new Error('Foto belum siap.');
    const {w:stageW,h:stageH}=editorStageMetrics(); const crop=editorCropRect();
    const outScale=Math.min(2.4,1800/Math.max(crop.w,crop.h));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(crop.w*outScale));canvas.height=Math.max(1,Math.round(crop.h*outScale));
    const c=canvas.getContext('2d'); c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.save(); c.translate(-crop.x*outScale,-crop.y*outScale); c.scale(outScale,outScale); c.translate(stageW/2+photoEditorState.x,stageH/2+photoEditorState.y); c.rotate(photoEditorState.rotate*Math.PI/180); const d=editorRawImageDimensions(); c.drawImage(byId('photoEditorImg'),-d.w/2,-d.h/2,d.w,d.h); c.restore();
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Gagal menyimpan foto.')),'image/webp',0.94));
  }
  async function savePhotoEdit(){
    if(!photoEditorState?.imgReady)return;
    const btn=byId('photoEditorSave');btn.disabled=true;btn.textContent='Menyimpan…';
    try{
      const blob=await canvasFromPhotoEditor(); const id=photoEditorState.item.id;
      await putFile({id:`photo-edit-${id}`,type:'photo-edit',name:`${photoEditorState.item.name||id}-edited.webp`,blob});
      editedPhotoIds.add(id);
      if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);}
      saveState(); closePhotoEditor(); renderPhotos($('.filter.active')?.dataset.filter||'all'); await renderManagerPhotos();
      byId('managerStatus').textContent='Edit foto tersimpan. Foto asli tetap aman.';
    }catch(err){alert(err.message||'Foto belum bisa disimpan.');}
    finally{btn.disabled=false;btn.innerHTML='Simpan Edit <span>✓</span>';}
  }
  async function revertPhotoEdit(){
    if(!photoEditorState)return;
    const id=photoEditorState.item.id;
    if(!confirm('Kembalikan foto ini ke versi asli?'))return;
    await removeFile(`photo-edit-${id}`);
    editedPhotoIds.delete(id);
    if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);}
    closePhotoEditor();renderPhotos($('.filter.active')?.dataset.filter||'all');await renderManagerPhotos();byId('managerStatus').textContent='Foto dikembalikan ke versi asli.';
  }

  // Keyboard shortcut: press M on the surprise page to toggle music, but only after unlocking.
  addEventListener('keydown',e=>{if(e.key.toLowerCase()==='m'&&!app.hidden)musicPlaying?pauseMusic():resumeMusic();});

  // initial status
  syncMusicUI();
})();
