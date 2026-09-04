// UziVertVault — no fake content shipped. Add your own files below.
// Each entry needs: id, title, era, year, duration, type, status, cover, src
// type: "released" | "unreleased" | "snippet" | "og" | "grail" | "leaked"
/**
 * Owner emails are kept out of plain text: base64-decoded at runtime.
 * Auth still works client-side; scrapers only see ciphertext.
 */
function _b64dec(s){ try{ if(typeof atob!=='undefined') return atob(s); const b=Buffer.from(s,'base64'); return b.toString('utf8'); }catch(e){ return ''; } }
const OWNER_EMAILS = ["b3BzcHJheXllZEBnbWFpbC5jb20=","dm9pZGZlNHJAZ21haWwuY29t"].map(s=>_b64dec(s));
const OWNER_USERNAMES = [].map(s=>s.toLowerCase());
const ARTISTS = {
  uzi: {
    id:'uzi', name:'UziVertVault', title:'The Lil Uzi Vert', gradient:'Vault', bg:"assets/bg.jpg",
    bgFilter:'saturate(0.95) brightness(0.52)',
    peekImg:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Juice_Wrld_-_Legends_Never_Die.png/440px-Juice_Wrld_-_Legends_Never_Die.png',
    peekLabel:'JUICEVAULT',
    heroAlbums:['Eternal Atake','Pink Tape','Luv Is Rage 2']
  },
  juice: {
    id:'juice', name:'JuiceVault', title:'JuiceVault', gradient:'999', bg:"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80",
    bgFilter:'saturate(1.0) brightness(0.48) hue-rotate(-10deg)',
    peekImg:'assets/bg.jpg',
    peekLabel:'UZIVERTVAULT',
    heroAlbums:['Goodbye & Good Riddance','Death Race for Love','Legends Never Die']
  }
};
let currentArtist = localStorage.getItem('vault_artist') || 'uzi';
const BASE_TRACKS = [];
const JUICE_BASE_TRACKS = [];

function trackKey(){ return currentArtist==='juice' ? 'juice_custom_tracks' : 'uzi_custom_tracks'; }
function likedKey(){ return currentArtist==='juice' ? 'juice_liked' : 'uzi_liked'; }
function dislikedKey(){ return currentArtist==='juice' ? 'juice_disliked' : 'uzi_disliked'; }
function countsKey(){ return currentArtist==='juice' ? 'juice_counts' : 'uzi_counts'; }
function historyKey(){ return currentArtist==='juice' ? 'juice_history' : 'uzi_history'; }
function queueKey(){ return currentArtist==='juice' ? 'juice_queue' : 'uzi_queue'; }
function chatKey(){ return currentArtist==='juice' ? 'juice_chat' : 'uzi_chat'; }
function loadCustomTracks(){ try{ return JSON.parse(localStorage.getItem(trackKey())||'[]')}catch(e){return []} }
function saveCustomTracks(list){ localStorage.setItem(trackKey(), JSON.stringify(list)); }
let CUSTOM_TRACKS = loadCustomTracks();
function getBaseTracks(){ return currentArtist==='juice' ? JUICE_BASE_TRACKS : BASE_TRACKS; }
let TRACKS = [...getBaseTracks(), ...CUSTOM_TRACKS];

function isOwnerEmail(email){ return OWNER_EMAILS.includes((email||'').toLowerCase()); }
function isOwnerUsername(name){ return OWNER_USERNAMES.includes((name||'').toLowerCase()); }
function isOwner(){ return state.user && !state.user.guest && isOwnerEmail(state.user.email||""); }


function _safeJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw==null || raw==='') return fallback;
    const v = JSON.parse(raw);
    return v==null ? fallback : v;
  }catch(e){ try{ localStorage.removeItem(key); }catch(_){} return fallback; }
}
let state = {
  filter: 'all',
  search: '',
  era: 'all',
  sort: 'newest',
  liked: _safeJSON((localStorage.getItem('vault_artist')||'uzi')==='juice' ? 'juice_liked' : 'uzi_liked', []),
  disliked: _safeJSON((localStorage.getItem('vault_artist')||'uzi')==='juice' ? 'juice_disliked' : 'uzi_disliked', []),
  queue: _safeJSON((localStorage.getItem('vault_artist')||'uzi')==='juice' ? 'juice_queue' : 'uzi_queue', []),
  currentIndex: -1,
  currentTrack: null,
  isPlaying: false,
  shuffle: true,
  repeat: false,
  view: 'home',
  playCounts: _safeJSON((localStorage.getItem('vault_artist')||'uzi')==='juice' ? 'juice_counts' : 'uzi_counts', {}),
  history: _safeJSON((localStorage.getItem('vault_artist')||'uzi')==='juice' ? 'juice_history' : 'uzi_history', []),
  user: _safeJSON('uzi_user', null),
};
let PINNED = _safeJSON('uzi_pinned', []);
let ANNOUNCEMENT = (()=>{ try{ return localStorage.getItem('uzi_announcement')||''; }catch(e){ return ''; } })();

// --- GitHub Pages Auth (localStorage only, no server) ---
function getUsers(){ try{return JSON.parse(localStorage.getItem('uzi_users')||'{}')}catch(e){return {}} }
function saveUsers(u){ localStorage.setItem('uzi_users', JSON.stringify(u)); }
function openAuth(tab){ document.getElementById('authModal').classList.remove('hidden'); if(tab) switchAuthTab(tab); }
function closeAuth(){ document.getElementById('authModal').classList.add('hidden'); }
function switchAuthTab(tab){
  ['login','register','guest'].forEach(t=>{
    document.getElementById('auth-'+t).classList.toggle('hidden', t!==tab);
    const btn=document.getElementById('tab-'+t);
    if(btn) btn.className = t===tab ? 'text-white font-700 underline' : 'text-white/50 hover:text-white';
  });
}
function showMsg(id,msg){ const el=document.getElementById(id); if(!el) return; el.textContent=msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 2800); }
function normalizeEmail(v){ return v.trim().toLowerCase(); }
function handleLogin(){
  const u=normalizeEmail(document.getElementById('loginUser').value);
  const p=document.getElementById('loginPass').value;
  if(!u||!p) return showMsg('loginMsg','Enter email & password');
  if(!u.includes('@')) return showMsg('loginMsg','Use full email');
  const users=getUsers();
  if(!users[u] || users[u]!==p) return showMsg('loginMsg','Invalid credentials');
  const owner=isOwnerEmail(u);
  state.user={name:u.split('@')[0], email:u, guest:false, owner};
  localStorage.setItem('uzi_user', JSON.stringify(state.user));
  updateAuthUI(); closeAuth(); if(owner) openAdmin();
}
function isUsernameTaken(username, excludeEmail){
  const lower=username.toLowerCase();
  // check users map (email prefix)
  const users=getUsers();
  for(const email of Object.keys(users)){
    if(email===excludeEmail) continue;
    const name=email.split('@')[0].toLowerCase();
    if(name===lower) return true;
  }
  // check profiles
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k || !k.startsWith('uzi_profile_')) continue;
    if(k==='uzi_profile_'+excludeEmail) continue;
    try{
      const prof=JSON.parse(localStorage.getItem(k));
      if(prof && prof.displayName && prof.displayName.toLowerCase()===lower) return true;
    }catch(e){}
  }
  return false;
}
function handleRegister(){
  const u=normalizeEmail(document.getElementById('regUser').value);
  const p=document.getElementById('regPass').value;
  if(!u||!p) return showMsg('regMsg','Choose email & password');
  if(!u.includes('@')) return showMsg('regMsg','Use a valid email');
  if(p.length<4) return showMsg('regMsg','Password too short');
  const users=getUsers();
  if(users[u]) return showMsg('regMsg','Email already registered');
  const desiredName=u.split('@')[0].toLowerCase();
  if(isUsernameTaken(desiredName, u)) return showMsg('regMsg','Username taken — only one per name');
  users[u]=p; saveUsers(users);
  const owner=isOwnerEmail(u);
  state.user={name:u.split('@')[0], email:u, guest:false, owner};
  localStorage.setItem('uzi_user', JSON.stringify(state.user));
  // init profile with unique username
  persistProfile({displayName: state.user.name, bio:'No bio yet — make it vibey.', avatar:'', banner:'uzi', accent:'#ff2e93'});
  updateAuthUI(); closeAuth(); if(owner) showMsg('loginMsg', owner ? 'Owner account created' : 'Account created');
  if(owner) setTimeout(()=>openAdmin(), 300);
}
function guestLogin(){
  state.user={name:'Guest', email:'guest@local', guest:true, owner:false};
  localStorage.setItem('uzi_user', JSON.stringify(state.user));
  updateAuthUI(); closeAuth();
}
function logout(){
  localStorage.removeItem('uzi_user');
  state.user=null;
  updateAuthUI();
  openAuth('guest');
}
function updateRadioOwnerUI(){
  const isOw=isOwner();
  document.querySelectorAll('.owner-only-radio').forEach(el=>el.classList.toggle('hidden', !isOw));
  // Start Radio — owner only (as requested)
  var sr=document.getElementById('startRadioBtn'); if(sr) sr.classList.toggle('hidden', !isOw);
  var rn=document.getElementById('radioNextBtn2'); if(rn) rn.classList.toggle('hidden', !isOw);
  var gm=document.getElementById('radioGateMsg'); if(gm) gm.classList.toggle('hidden', isOw);
  var om=document.getElementById('radioOwnerOnlyMsg'); if(om) om.classList.toggle('hidden', isOw);
  // pause lock — non-owners on radio see disabled play button
  const playBtnEl=document.getElementById('playBtn');
  if(playBtnEl){
    const isRadioPlaying = state.view==='radio' && state.isPlaying;
    if(isRadioPlaying && !isOw){
      playBtnEl.classList.add('opacity-40','pointer-events-none');
      playBtnEl.title='Only owners can pause radio';
    } else {
      playBtnEl.classList.remove('opacity-40','pointer-events-none');
      playBtnEl.removeAttribute('title');
    }
  }
}
function savePerArtistState(){
  try{
    localStorage.setItem(queueKey(), JSON.stringify(state.queue));
    localStorage.setItem(likedKey(), JSON.stringify(state.liked));
    localStorage.setItem(dislikedKey(), JSON.stringify(state.disliked));
    localStorage.setItem(countsKey(), JSON.stringify(state.playCounts));
    localStorage.setItem(historyKey(), JSON.stringify(state.history));
    localStorage.setItem(chatKey(), JSON.stringify(chatMessages));
  }catch(e){}
}
function loadPerArtistState(){
  state.liked = _safeJSON(likedKey(), []);
  state.disliked = _safeJSON(dislikedKey(), []);
  state.queue = _safeJSON(queueKey(), []);
  state.playCounts = _safeJSON(countsKey(), {});
  state.history = _safeJSON(historyKey(), []);
  chatMessages = _safeJSON(chatKey(), []);
  if(!Array.isArray(chatMessages)) chatMessages=[];
}
function applyArtistUI(){
  const cfg=ARTISTS[currentArtist];
  const other=ARTISTS[currentArtist==='uzi' ? 'juice' : 'uzi'];
  document.title = cfg.id==='juice' ? 'JuiceVault — The Juice WRLD Archive' : 'UziVertVault — The Lil Uzi Vert Archive';
  const customBg=localStorage.getItem('uzi_custom_bg');
  const bg=document.getElementById('globalBg'); if(bg){ bg.style.backgroundImage=`url('${customBg || cfg.bg}')`; bg.style.filter=customBg ? 'saturate(1.0) brightness(0.55)' : cfg.bgFilter; }
  // other artist peeks on side — image behind big white bold font (owner-chosen)
  const otherBg = other.id==='uzi' ? (localStorage.getItem('uzi_sidebar_bg') || other.peekImg) : (localStorage.getItem('juice_sidebar_bg') || other.peekImg);
  const peekImg=document.getElementById('otherArtistImg'); if(peekImg) peekImg.src=otherBg;
  const peekLabel=document.getElementById('otherArtistLabel'); if(peekLabel) peekLabel.textContent=other.id==='uzi' ? 'UZI VAULT' : 'JUICE VAULT';
  const titleEl=document.getElementById('vaultTitle') || document.querySelector('.vault-title'); if(titleEl){ if(cfg.id==='juice'){ titleEl.classList.remove('alien'); titleEl.classList.add('slimy'); titleEl.innerHTML=`The Juice Wrld<br><span class="vault-gradient slimy">Vault</span>`; } else { titleEl.classList.remove('slimy'); titleEl.classList.add('alien'); titleEl.innerHTML=`The Lil Uzi Vert<br><span class="vault-gradient alien">Vault</span>`; } }
  // reload per-artist vault + radio + songs/albums
  CUSTOM_TRACKS=loadCustomTracks(); TRACKS=[...getBaseTracks(), ...CUSTOM_TRACKS];
  loadPerArtistState();
  // keep admins/owners same
}
function switchToArtist(target){
  if(target===currentArtist) return;
  savePerArtistState();
  const overlay=document.getElementById('swipeOverlay');
  const panel=document.getElementById('swipePanel');
  const shade=document.getElementById('swipeShade');
  const nextCfg=ARTISTS[target];
  if(panel){ panel.style.backgroundImage=`url('${localStorage.getItem('uzi_custom_bg') || nextCfg.bg}')`; panel.style.filter=nextCfg.bgFilter; }
  if(overlay) overlay.classList.remove('hidden');
  void panel.offsetWidth;
  if(panel) panel.classList.remove('translate-x-full');
  if(shade) { shade.classList.remove('opacity-0'); shade.classList.add('opacity-100'); }
  setTimeout(()=>{
    currentArtist=target;
    localStorage.setItem('vault_artist', currentArtist);
    applyArtistUI();
    renderVault(); renderAlbums(); renderLatest(); renderRadioQueue(); renderQueueDrawer(); renderChat(); updateVaultStats(); updateAuthUI(); renderProfile();
    if(panel) panel.classList.add('translate-x-full');
    if(shade) shade.classList.add('opacity-0');
    setTimeout(()=>{ if(overlay) overlay.classList.add('hidden'); }, 760);
  }, 680);
}
function switchArtist(){ switchToArtist(currentArtist==='uzi' ? 'juice' : 'uzi'); }
function updateAuthUI(){
  const area=document.getElementById('authArea');
  const btn=document.getElementById('authBtn');
  const adminBtn=document.getElementById('adminNavBtn');
  if(adminBtn) adminBtn.classList.toggle('hidden', !isOwner());
  updateRadioOwnerUI();
  if(!area) return;
  if(!state.user){
    area.innerHTML='';
    if(btn) { btn.textContent='Log in'; btn.onclick=()=>openAuth('login'); btn.className='hidden md:inline-flex h-9 px-5 rounded-full bg-white text-black text-[13px] font-600 hover:bg-white/90 transition'; }
    try{ renderProfile(); }catch(e){}
    return;
  }
  if(state.user.guest){
    area.innerHTML=`<span class="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono tracking-widest text-amber-300/90 border border-amber-300/20 bg-amber-300/10 rounded-full px-2.5 py-1">● GUEST</span>`;
    if(btn) { btn.textContent='Log in'; btn.onclick=()=>openAuth('login'); btn.className='hidden md:inline-flex h-9 px-5 rounded-full bg-white text-black text-[13px] font-600 hover:bg-white/90 transition'; }
  } else {
    const p=loadProfile();
    const avatarHtml = p.avatar ? `<img src="${p.avatar}" class="w-6 h-6 rounded-full object-cover border border-white/10">` : `<span class="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff2e93] to-[#a855f7] grid place-items-center text-[10px] font-display">`+ (p.displayName||state.user.name)[0].toUpperCase()+`</span>`;
    const badge = isOwner() ? `<span class="hidden sm:inline-flex text-[9px] font-mono tracking-widest bg-amber-300 text-black px-1.5 py-0.5 rounded-full font-800">OWNER</span>` : '';
    area.innerHTML=`<span class="hidden sm:inline-flex items-center gap-2 text-[12px] font-600 bg-white/10 border border-white/10 rounded-full px-3 py-1">`+avatarHtml+` `+(p.displayName||state.user.name)+` `+badge+`</span><button onclick="logout()" class="hidden sm:inline-flex text-[11px] font-mono text-white/50 hover:text-white ml-1">Logout</button>`;
    if(btn) {
      // Yellow Admin pill removed per request — owners use nav Admin link instead
      btn.className='hidden';
      btn.textContent='';
    }
  }
  try{ renderProfile(); }catch(e){}
}

function openAdmin(){
  if(!isOwner()){
    navigate('admin');
    return;
  }
  navigate('admin');
}

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');

function navigate(view){
  if(view==='admin' && !isOwner()){
    document.querySelectorAll('.view').forEach(v=>{ v.classList.add('hidden'); v.style.display='none'; });
    const adm=document.getElementById('view-admin'); if(adm){ adm.classList.remove('hidden'); adm.style.display=''; }
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active', b.dataset.nav==='admin'));
    try{ renderAdmin(); }catch(e){}
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){}
    return;
  }
  state.view = view;
  // hard-hide all views via both class and style (fixes Home sticking when clicking off)
  document.querySelectorAll('.view').forEach(v=>{ v.classList.add('hidden'); v.style.display='none'; });
  const target=document.getElementById('view-'+view);
  if(target){ target.classList.remove('hidden'); target.style.display=''; }
  else {
    const fallback=document.getElementById('view-home');
    if(fallback){ fallback.classList.remove('hidden'); fallback.style.display=''; }
    console.warn('navigate: unknown view', view);
  }
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active', b.dataset.nav===view));
  var _sb=document.getElementById('sidebar'); if(_sb) _sb.classList.remove('hidden');
  try{
    if(view==='vault') renderVault();
    if(view==='albums') renderAlbums();
    if(view==='eras') renderAlbums();
    if(view==='charts') renderCharts();
    if(view==='history') renderHistory();
    if(view==='admin') renderAdmin();
  }catch(e){ console.error('navigate render failed', e); }
  try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){}
  if(window.innerWidth<1024){ var _sb2=document.getElementById('sidebar'); if(_sb2) _sb2.classList.add('hidden'); }
}
function toggleSidebar(){ var _el=document.getElementById('sidebar'); if(_el) _el.classList.toggle('hidden'); }
function toggleMobileSearch(){ var _el=document.getElementById('mobileSearch'); if(_el) _el.classList.toggle('hidden'); }

function badgeColor(type){
  if(type==='grail') return 'bg-[#ff2e93] text-white';
  if(type==='og') return 'bg-cyan-400 text-black';
  if(type==='snippet') return 'bg-white/15 text-white border border-white/20';
  if(type==='leaked') return 'bg-emerald-400 text-black';
  if(type==='unreleased') return 'bg-[#a855f7] text-white';
  return 'bg-white/10 text-white';
}

function getFiltered(){
  let list=[...TRACKS];
  if(state.filter!=='all') list=list.filter(t=>t.type===state.filter);
  if(state.era!=='all') list=list.filter(t=>t.era===state.era);
  if(state.search){
    const q=state.search.toLowerCase();
    list=list.filter(t=> (t.title+t.era+t.id+t.status).toLowerCase().includes(q));
  }
  // owner feature: pinned tracks first
  list.sort((a,b)=>{
    const aPin=PINNED.includes(a.id), bPin=PINNED.includes(b.id);
    if(aPin!==bPin) return bPin - aPin;
    return 0;
  });
  var _sEl=document.getElementById('sortSelect'); var s=(_sEl && _sEl.value)||state.sort;
  if(s==='az') list.sort((a,b)=>{ const pinDiff=PINNED.includes(b.id)-PINNED.includes(a.id); if(pinDiff) return pinDiff; return a.title.localeCompare(b.title); });
  else if(s==='oldest') list.sort((a,b)=>{ const pinDiff=PINNED.includes(b.id)-PINNED.includes(a.id); if(pinDiff) return pinDiff; return parseInt(a.year)-parseInt(b.year); });
  else if(s==='duration') list.sort((a,b)=>{ const pinDiff=PINNED.includes(b.id)-PINNED.includes(a.id); if(pinDiff) return pinDiff; return a.duration.localeCompare(b.duration); });
  else list.sort((a,b)=>{ const pinDiff=PINNED.includes(b.id)-PINNED.includes(a.id); if(pinDiff) return pinDiff; return parseInt(b.year)-parseInt(a.year); });
  return list;
}
function togglePin(id){
  if(!isOwner()) return;
  if(PINNED.includes(id)) PINNED=PINNED.filter(x=>x!==id); else PINNED.push(id);
  localStorage.setItem('uzi_pinned', JSON.stringify(PINNED));
  renderVault(); renderAdmin();
}
function setAnnouncement(){
  if(!isOwner()) return;
  const val=document.getElementById('annInput').value.trim();
  ANNOUNCEMENT=val; localStorage.setItem('uzi_announcement', val);
  renderAnnouncement(); renderAdmin();
}
function clearAnnouncement(){
  if(!isOwner()) return;
  ANNOUNCEMENT=''; localStorage.removeItem('uzi_announcement'); renderAnnouncement(); renderAdmin();
}
function renderAnnouncement(){
  const bar=document.getElementById('announcementBar'); const text=document.getElementById('announcementText');
  if(!bar||!text) return;
  if(ANNOUNCEMENT){ bar.classList.remove('hidden'); text.textContent=ANNOUNCEMENT; } else bar.classList.add('hidden');
}
function shareTrack(id){
  const url=location.href.split('#')[0]+'#track='+id;
  navigator.clipboard.writeText(url).then(()=>alert('Link copied: '+url));
}

function renderCard(t){
  const liked = state.liked.includes(t.id);
  var isCurrent = (state.currentTrack && state.currentTrack.id)===t.id;
  const isPinned = PINNED.includes(t.id);
  const pinBadge = isPinned ? `<span class="absolute top-3 left-[68px] text-[9px] font-mono tracking-widest px-2 py-1 rounded-full bg-amber-300 text-black font-800">PINNED</span>` : '';
  const ownerTools = isOwner() ? `<button onclick="togglePin('${t.id}')" class="w-8 h-8 rounded-full ${isPinned?'bg-amber-300 text-black':'bg-amber-300/15 text-amber-300 border border-amber-300/20'} grid place-items-center text-[10px]" title="${isPinned?'Unpin':'Pin (owner)'}">📌</button><button onclick="shareTrack('${t.id}')" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px]" title="Share">⧉</button><button onclick="adminDeleteTrack('${t.id}')" class="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/20 text-red-300 grid place-items-center text-[11px]" title="Remove (owner)">🗑</button>` : `<button onclick="shareTrack('${t.id}')" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px]" title="Share">⧉</button>`;
  return `<div class="card relative rounded-[18px] overflow-hidden border border-white/10 bg-[#020208]/65 p-3.5 flex flex-col gap-3 ${isCurrent?'playing':''} ${isPinned?'ring-1 ring-amber-300/40':''}">
    <div class="relative rounded-xl overflow-hidden aspect-[1.55] bg-[#0a0a0f]">
      <img src="${t.cover}" class="w-full h-full object-cover opacity-90">
      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div>
      <span class="absolute top-3 left-3 text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-full ${badgeColor(t.type)}">${t.status}</span>
      ${pinBadge}
      <span class="absolute top-3 right-3 text-[10px] font-mono bg-black/55 backdrop-blur px-2 py-1 rounded-full border border-white/10 tracking-wide">${t.id}</span>
      <button onclick="playTrack('${t.id}')" class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white text-black grid place-items-center text-[13px] shadow-lg hover:scale-105 transition">`+(isCurrent && state.isPlaying ? '❚❚' : '▶')+`</button>
      <span class="absolute bottom-3 left-3 text-[11px] font-mono bg-black/55 px-2 py-1 rounded-full border border-white/10">${t.duration}</span>
    </div>
    <div>
      <h3 class="font-display font-700 text-[15px] leading-tight truncate pr-6 tracking-tight">${t.title}</h3>
      <p class="text-[12px] text-white/50 font-mono mt-0.5">${t.era} • ${t.year}</p>
    </div>
    <div class="flex items-center gap-2 mt-auto pt-3 border-t border-white/5 flex-wrap">
      <button onclick="toggleLike('${t.id}')" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-sm hover:bg-white/10">${liked?'♥':'♡'}</button>
      <button onclick="addToQueue('${t.id}')" class="flex-1 min-w-[60px] h-8 rounded-full bg-white/5 border border-white/10 text-[12px] font-600 hover:bg-white/10">+ Queue</button>
      <button onclick="addToPlaylistPrompt('${t.id}')" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px] hover:bg-white/10" title="Add to playlist (guest OK)">+</button>
      ${ownerTools}
      <button onclick="playTrack('${t.id}')" class="h-8 px-4 rounded-full bg-white text-black text-[12px] font-700">Play</button>
    </div>
  </div>`;
}

function renderRow(t){
  var isCurrent = (state.currentTrack && state.currentTrack.id)===t.id;
  const liked = state.liked.includes(t.id);
  return `<div class="track-row group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent ${isCurrent?'playing border-[#ff2e93]/25':''}">
    <img src="${t.cover}" class="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0">
    <button onclick="playTrack('${t.id}')" class="w-8 h-8 rounded-full bg-white text-black grid place-items-center text-[10px] shrink-0">${isCurrent && state.isPlaying?'❚❚':'▶'}</button>
    <div class="min-w-0 flex-1">
      <p class="text-[13.5px] font-600 truncate tracking-tight">${t.title} ${isCurrent?'<span class="text-[#ff2e93] font-500">• playing</span>':''}</p>
      <p class="text-[12px] text-white/50 truncate font-body">${t.era} • ${t.year} • ${t.id} • ${t.status}</p>
    </div>
    <span class="hidden sm:block text-[11px] font-mono px-2 py-1 rounded-full ${badgeColor(t.type)}">${t.status}</span>
    <span class="text-[12px] font-mono text-white/40">${t.duration}</span>
    <button onclick="toggleLike('${t.id}')" class="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10 text-sm">${liked?'♥':'♡'}</button>
    <button onclick="addToQueue('${t.id}')" class="hidden sm:grid w-8 h-8 place-items-center rounded-full hover:bg-white/10 text-white/60">＋</button>
  </div>`;
}

function emptyVaultHTML(msg, hint){
  const showExtra = typeof isOwner==='function' && isOwner();
  return `<div class="col-span-full rounded-[20px] border border-dashed border-white/15 bg-[#020208]/65 p-10 text-center">
    <p class="font-display font-700 text-[16px]">${msg}</p>
    ${showExtra ? `<p class="text-[13px] text-white/50 mt-2 max-w-[520px] mx-auto leading-relaxed font-body">${hint}</p>
    <div class="mt-5 flex flex-wrap gap-2 justify-center">
      <span class="text-[11px] font-mono bg-white text-black px-3 py-1.5 rounded-full">Edit app.js → TRACKS</span>
      <span class="text-[11px] font-mono bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">No fake leaks included</span>
    </div>` : ``}
  </div>`;
}

function renderVault(){
  const list=getFiltered();
  const countEl=document.getElementById('vaultCount');
  if(countEl) countEl.textContent=list.length;
  const grid=document.getElementById('vaultGrid');
  if(grid){
    if(list.length===0){
      if(TRACKS.length===0) grid.innerHTML = emptyVaultHTML('Vault is empty', 'This build has demo tracks. Add your own via Admin panel.');
      else grid.innerHTML = `<p class="col-span-full text-center text-white/40 py-16 font-body">No files match your filters.</p>`;
    } else {
      grid.innerHTML = list.map(t=>renderCard(t)).join('');
    }
  }
  document.querySelectorAll('.filter-btn').forEach(b=> b.classList.toggle('active', b.dataset.filter===state.filter));
  updateVaultStats();
  try{ renderVaultPlaylistsPreview(); }catch(e){}
  try{ syncVaultPlayer(); }catch(e){}
  try{ renderVaultRecents(); }catch(e){}
  // vault albums preview (filtered)
  try{
    var vAlbums=document.getElementById('vaultAlbums');
    if(vAlbums){
      var map={}; list.forEach(t=>{ var k=t.album||t.era||'Singles'; if(!map[k]) map[k]={name:k, tracks:[], cover:t.cover}; map[k].tracks.push(t); });
      var albums=Object.values(map).slice(0,6);
      if(!albums.length) vAlbums.innerHTML='<p class="text-xs opacity-40">No albums match search</p>';
      else vAlbums.innerHTML=albums.map(al=>'<div class="rounded-xl overflow-hidden border border-white/10 bg-[#121212]"><img src="'+al.cover+'" class="w-full h-24 object-cover"><div class="p-2"><p class="text-xs font-bold truncate">'+escapeHtml(al.name)+'</p><p class="text-[11px] opacity-50">'+al.tracks.length+' songs</p></div></div>').join('');
      var cnt=document.getElementById('vaultAlbumsCount'); if(cnt) cnt.textContent=albums.length+' albums';
    }
  }catch(e){}
}

function renderLatest(){
  const latestGrid=document.getElementById('latestGrid');
  const recentList=document.getElementById('recentList');
  if(TRACKS.length===0){
    if(latestGrid) latestGrid.innerHTML = emptyVaultHTML('No tracks yet', 'Owners: use Admin panel to index files. Framework is ready for radio, likes and queue.');
    if(recentList) recentList.innerHTML = `<div class="rounded-xl border border-white/10 bg-[#020208]/65 p-6 text-center text-sm text-white/50 font-body">No uploads yet — vault is clean by design.</div>`;
    return;
  }
  const latest = [...TRACKS].sort((a,b)=>b.year-a.year).slice(0,6);
  if(latestGrid) latestGrid.innerHTML = latest.map(t=>renderCard(t)).join('');
  const recent = TRACKS.slice(0,6);
  if(recentList) recentList.innerHTML = recent.map(t=>renderRow(t)).join('');
}


function renderAlbums(){
  const grid=document.getElementById('albumsGrid');
  const homeGrid=document.getElementById('homeAlbumsGrid');
  const map={};
  TRACKS.forEach(t=>{
    const key=t.album || t.era || 'Loose Files';
    if(!map[key]) map[key]={name:key, tracks:[], cover:t.cover, year:t.year};
    map[key].tracks.push(t);
    if(t.cover) map[key].cover=t.cover;
  });
  const albums=Object.values(map);
  albums.sort((a,b)=>b.tracks.length-a.tracks.length);
  function card(al){
    const esc=al.name.replace("'", "\'");
    return `<button onclick="setAlbumFilter('${esc}')" class="group text-left rounded-[20px] overflow-hidden border border-white/[0.08] bg-[#020208]/65 backdrop-blur-xl p-0 hover:border-white/15 transition flex gap-4 w-full">
      <img src="${al.cover}" class="w-28 h-28 object-cover shrink-0">
      <div class="p-4 min-w-0 flex-1">
        <p class="text-[11px] font-mono tracking-widest text-white/40">${al.tracks.length} tracks${al.year?' • '+al.year:''}</p>
        <h3 class="font-display font-700 text-[17px] mt-1 tracking-tight group-hover:text-[#ff90c2]">${al.name}</h3>
        <p class="text-[12px] text-white/50 mt-1 truncate">${al.tracks.slice(0,2).map(t=>t.title).join(' • ')}</p>
      </div>
    </button>`;
  }
  const html = albums.length===0 ? `<div class="col-span-2 rounded-[20px] border border-dashed border-white/15 bg-[#020208]/65 p-10 text-center"><p class="font-display font-700">No albums yet</p><p class="text-[13px] text-white/50 mt-1">Owners: add via Admin → Albums/EPs (whole folder)</p></div>` : albums.map(card).join('');
  if(grid) grid.innerHTML=html;
  if(homeGrid) homeGrid.innerHTML= albums.length===0 ? `<p class="col-span-2 text-sm text-white/40 py-6 text-center border border-dashed border-white/10 rounded-xl">No albums yet — add via Admin</p>` : albums.slice(0,4).map(card).join('');
}
function setAlbumFilter(album){
  state.search=album;
  const el=document.getElementById('searchInput'); if(el) el.value=album;
  navigate('vault');
  renderVault();
}

function renderEras(){
  const grid=document.getElementById('erasGrid'); if(!grid) return;
  const eras=[
    {name:"Luv Is Rage", years:"2015 — 2017", desc:"Luv Is Rage, Lil Uzi Vert vs. the World — melodic breakout.", color:"from-[#1a0b2e] to-[#0f0f14]"},
    {name:"Eternal Atake", years:"2018 — 2020", desc:"Eternal Atake era — Deluxe, alternate mixes and holdovers.", color:"from-[#0f1a2e] to-[#0f0f14]"},
    {name:"Pink Tape", years:"2021 — 2023", desc:"Pink Tape — rage / rock / hyperpop experiments.", color:"from-[#2e0b1a] to-[#0f0f14]"},
    {name:"Loose Files", years:"2013 — present", desc:"Features, loosies, freestyles and session files.", color:"from-[#111] to-[#0f0f14]"},
  ];
  document.getElementById('erasGrid').innerHTML = eras.map(e=>{
    const count = TRACKS.filter(t=>t.era===e.name).length;
    return `
    <button onclick="setEraFilter('${e.name}')" class="text-left rounded-[20px] p-6 border border-white/10 bg-gradient-to-br ${e.color} hover:border-white/15 transition group">
      <p class="text-[11px] font-mono text-white/40 tracking-widest">${e.years} • ${count} files indexed</p>
      <h3 class="font-display font-800 text-[20px] mt-1 tracking-tight group-hover:text-[#ff90c2] transition">${e.name}</h3>
      <p class="text-[13px] text-white/55 mt-2 leading-relaxed font-body">${e.desc}</p>
      <span class="inline-block mt-4 text-[12px] font-600 border border-white/15 rounded-full px-4 py-1.5 bg-white/5">Browse →</span>
    </button>`;
  }).join('');
}

function renderCharts(){
  const el=document.getElementById('chartsList');
  if(TRACKS.length===0){ el.innerHTML = `<div class="rounded-xl border border-white/10 bg-[#020208]/65 p-8 text-center text-sm text-white/50 font-body">No plays yet — charts populate from local play counts.</div>`; return; }
  const sorted=[...TRACKS].sort((a,b)=> (state.playCounts[b.id]||0) - (state.playCounts[a.id]||0)).slice(0,10);
  if(sorted.every(t=>!state.playCounts[t.id])) sorted.sort((a,b)=> parseInt(b.year)-parseInt(a.year));
  el.innerHTML = sorted.map((t,i)=>`
    <div class="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#020208]/65 border border-white/5">
      <span class="w-7 text-center font-mono text-[13px] text-white/40">#${i+1}</span>
      <img src="${t.cover}" class="w-10 h-10 rounded-lg object-cover">
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-600 truncate tracking-tight">${t.title}</p>
        <p class="text-[12px] text-white/50 truncate font-body">${t.era} • ${state.playCounts[t.id]||0} plays</p>
      </div>
      <button onclick="playTrack('${t.id}')" class="w-8 h-8 rounded-full bg-white text-black grid place-items-center text-xs">▶</button>
    </div>
  `).join('');
}

function renderRadioQueue(){
  if(state.queue.length===0){
    document.getElementById('radioQueue').innerHTML=`<p class="text-white/40 text-sm py-6 text-center border border-dashed border-white/10 rounded-xl font-body">Queue empty — add tracks from the Vault or start Radio (needs indexed files).</p>`;
  } else {
    document.getElementById('radioQueue').innerHTML=state.queue.map((id,idx)=>{
      const t=TRACKS.find(x=>x.id===id);
      if(!t) return '';
      const liked=state.liked.includes(id); const disliked=state.disliked.includes(id);
      return `<div class="flex items-center gap-1.5 px-2 py-2 rounded-xl bg-[#020208]/65 border border-white/5 ${idx===0?'border-[#ff2e93]/30 bg-[#ff2e93]/10':''} ${disliked?'opacity-50':''}">
        <span class="text-[11px] font-mono text-white/40 w-5">${idx===0?'▶':idx+1}</span>
        <img src="${t.cover}" class="w-9 h-9 rounded-lg object-cover shrink-0">
        <div class="flex-1 min-w-0 cursor-pointer" onclick="playTrack('${id}')"><p class="text-[12px] font-600 truncate">${t.title}</p><p class="text-[11px] text-white/50 truncate font-body">${t.era}</p></div>
        <button onclick="toggleLike('${id}')" class="w-7 h-7 rounded-full ${liked?'bg-pink-500 text-white':'bg-white/5 text-white/60'} grid place-items-center text-[11px]" title="Like">♥</button>
        <button onclick="toggleDislike('${id}')" class="w-7 h-7 rounded-full ${disliked?'bg-red-500 text-white':'bg-white/5 text-white/60'} grid place-items-center text-[11px]" title="Dislike">👎</button>
        <button onclick="grabTrack('${id}')" class="w-7 h-7 rounded-full bg-white/5 text-white/60 grid place-items-center text-[10px] hover:bg-emerald-500/20 hover:text-emerald-300" title="Grab">⬇</button>
        <button onclick="addToQueue('${id}')" class="hidden sm:grid w-7 h-7 rounded-full bg-white/5 text-white/60 grid place-items-center text-[10px]" title="Add to queue">＋</button>
        <button onclick="removeFromQueue(${idx})" class="w-7 h-7 rounded-full hover:bg-white/10 grid place-items-center text-white/40">✕</button>
      </div>`;
    }).join('');
  }
  var _nxt=state.queue[1] ? TRACKS.find(t=>t.id===state.queue[1]) : null; var next = state.queue[1] ? ((_nxt && _nxt.title) || '—') : '—';
  var _rqi=document.getElementById('radioQueueInfo'); if(_rqi) _rqi.textContent = `Queue: ${state.queue.length} • Up next: ${next}`;
  // update current radio like button
  const likeBtn=document.getElementById('radioLikeBtn'); if(likeBtn && state.currentTrack) likeBtn.textContent = state.liked.includes(state.currentTrack.id) ? '♥ Liked' : '♡ Like';
}
function toggleDislike(id){
  if(state.disliked.includes(id)) state.disliked=state.disliked.filter(x=>x!==id);
  else {
    state.disliked.push(id);
    // auto-skip if current
    if(state.currentTrack && state.currentTrack.id===id) nextTrack();
    // remove from queue
    state.queue=state.queue.filter(x=>x!==id);
  }
  localStorage.setItem(dislikedKey(), JSON.stringify(state.disliked));
  renderRadioQueue(); renderQueueDrawer(); renderVault();
}
function grabTrack(id){
  // Grab = add to Liked + dedicated Grabbed playlist
  if(!state.liked.includes(id)) toggleLike(id);
  PLAYLISTS=loadPlaylists();
  let grabbed=PLAYLISTS.find(p=>p.name==='Grabbed');
  if(!grabbed){ grabbed={id:'PL-GRABBED', name:'Grabbed', tracks:[], by: state.user?state.user.email:'guest@local'}; PLAYLISTS.push(grabbed); }
  if(!grabbed.tracks.includes(id)) grabbed.tracks.push(id);
  savePlaylists(PLAYLISTS); renderPlaylists();
  // toast
  const t=TRACKS.find(x=>x.id===id); if(t) showAdminMsg('Grabbed: '+t.title);
}
function likeCurrentRadio(){ if(state.currentTrack) toggleLike(state.currentTrack.id); renderRadioQueue(); }
function dislikeCurrentRadio(){ if(state.currentTrack) toggleDislike(state.currentTrack.id); }
function grabCurrentRadio(){ if(state.currentTrack) grabTrack(state.currentTrack.id); }
function queueCurrentRadio(){ if(state.currentTrack) addToQueue(state.currentTrack.id); }

function renderQueueDrawer(){
  document.getElementById('queueList').innerHTML = state.queue.length ? state.queue.map((id,idx)=>{
    const t=TRACKS.find(x=>x.id===id);
    if(!t) return '';
    return `<div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
      <img src="${t.cover}" class="w-10 h-10 rounded-lg object-cover">
      <div class="flex-1 min-w-0"><p class="text-[13px] font-600 truncate">${t.title}</p><p class="text-[12px] text-white/50 font-body">${t.era}</p></div>
      <button onclick="playTrack('${t.id}')" class="w-8 h-8 rounded-full bg-white text-black grid place-items-center text-xs">▶</button>
      <button onclick="removeFromQueue(${idx}); renderQueueDrawer()" class="w-8 h-8 grid place-items-center text-white/40">✕</button>
    </div>`;
  }).join('') : `<p class="text-white/40 text-sm py-8 text-center font-body">No tracks in queue.</p>`;
  document.getElementById('queueCount').textContent = state.queue.length;
}

function updateVaultStats(){
  const total=TRACKS.length;
  const erasSet = total===0 ? 0 : new Set(TRACKS.map(t=>t.era)).size;
  const likedCount = state.liked.length;
  ['statTotal','statFiles','statTotal2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent = String(total);
  });
  const e1=document.getElementById('statEras'); if(e1) e1.textContent = String(erasSet);
  const e2=document.getElementById('statEras2'); if(e2) e2.textContent = String(erasSet);
  const g1=document.getElementById('statGrails'); if(g1) g1.textContent = String(likedCount);
  const l2=document.getElementById('statLiked2'); if(l2) l2.textContent = String(likedCount);
  const ff=document.getElementById('filterAllCount'); if(ff) ff.textContent = String(total);
}
function renderHistory(){
  const el=document.getElementById('historyList'); if(!el) return;
  if(state.history.length===0) el.innerHTML=`<div class="rounded-xl border border-white/[0.08] bg-[#020208]/65 p-8 text-center text-sm text-white/40">No history yet — play something (guests included)</div>`;
  else el.innerHTML=state.history.map(id=>{
    const t=TRACKS.find(x=>x.id===id); if(!t) return '';
    return renderRow(t);
  }).join('');
}
function clearHistory(){ state.history=[]; localStorage.setItem(historyKey(),'[]'); renderHistory(); }

// Suggestions (non-owners → pending queue for owners)
function loadSuggestions(){ try{return JSON.parse(localStorage.getItem('uzi_suggestions')||'[]')}catch(e){return []} }
function saveSuggestions(list){ localStorage.setItem('uzi_suggestions', JSON.stringify(list)); }
let SUGGESTIONS = loadSuggestions();
function submitSuggestion(){
  const title=document.getElementById('suggTitle').value.trim();
  const era=document.getElementById('suggEra').value.trim()||'Loose Files';
  const year=document.getElementById('suggYear').value.trim()||new Date().getFullYear().toString();
  const duration=document.getElementById('suggDuration').value.trim()||'--:--';
  const cover=document.getElementById('suggCover').value.trim()||'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80';
  const src=document.getElementById('suggSrc').value.trim()||'';
  const type=document.getElementById('suggType').value;
  const id=document.getElementById('suggId').value.trim()||'SUG-'+Date.now().toString().slice(-5);
  if(!title) return showSuggMsg('Title required', true);
  if(TRACKS.some(t=>t.id===id) || SUGGESTIONS.some(s=>s.id===id)) return showSuggMsg('ID already exists', true);
  const sugg={id, title, era, year, duration, type, status:type.charAt(0).toUpperCase()+type.slice(1)+' (suggestion)', cover, src: src||'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', by: state.user ? state.user.email : 'Guest', at: Date.now()};
  SUGGESTIONS.push(sugg); saveSuggestions(SUGGESTIONS);
  showSuggMsg('Sent for review → owners will approve');
  ['suggTitle','suggEra','suggYear','suggDuration','suggCover','suggSrc','suggId'].forEach(i=>{const e=document.getElementById(i); if(e) e.value='';});
  renderAdmin();
}
function approveSuggestion(id){
  if(!isOwner()) return;
  const idx=SUGGESTIONS.findIndex(s=>s.id===id); if(idx<0) return;
  const sugg=SUGGESTIONS[idx];
  const track={id:sugg.id.replace('SUG-','UV-'), title:sugg.title, era:sugg.era, year:sugg.year, duration:sugg.duration, type:sugg.type, status:sugg.type.charAt(0).toUpperCase()+sugg.type.slice(1), cover:sugg.cover, src:sugg.src};
  if(TRACKS.some(t=>t.id===track.id)) track.id='UV-'+Date.now().toString().slice(-4);
  CUSTOM_TRACKS.push(track); saveCustomTracks(CUSTOM_TRACKS); TRACKS=[...BASE_TRACKS,...CUSTOM_TRACKS];
  SUGGESTIONS.splice(idx,1); saveSuggestions(SUGGESTIONS);
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
}
function rejectSuggestion(id){
  if(!isOwner()) return;
  SUGGESTIONS=SUGGESTIONS.filter(s=>s.id!==id); saveSuggestions(SUGGESTIONS); renderAdmin();
}
function showSuggMsg(msg,isErr){
  const el=document.getElementById('suggMsg'); if(!el) return;
  el.textContent=msg; el.className='text-[12px] font-mono mt-2 '+(isErr?'text-red-300':'text-emerald-300'); el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 2600);
}

// Admin Panel — owner/admin only, no public suggestion form inside
function getUsernameForEmail(email){
  try{
    const key='uzi_profile_'+email.toLowerCase();
    const raw=localStorage.getItem(key);
    if(raw){
      const p=JSON.parse(raw);
      if(p && p.displayName) return p.displayName;
    }
  }catch(e){}
  return email.split('@')[0];
}
function updateOwnerNames(){
  const o1=document.getElementById('owner1Name'); const o2=document.getElementById('owner2Name');
  if(!isOwner()){
    if(o1) o1.textContent='—';
    if(o2) o2.textContent='—';
    return;
  }
  if(o1) o1.textContent=getUsernameForEmail(_b64dec('b3Bzc3ByYXl5ZWRAZ21haWwuY29t'));
  if(o2) o2.textContent=getUsernameForEmail(_b64dec('dm9pZGZlNHJAZ21haWwuY29t'));
}
function switchAdminTab(tab){
  ['tracks','appearance','users','moderation','shop'].forEach(t=>{
    var p=document.getElementById('admPanel-'+t);
    var b=document.getElementById('admTab-'+t);
    if(p) p.classList.toggle('hidden', t!==tab);
    if(b){ b.className = t===tab ? 'h-7 px-4 rounded-full bg-white text-black text-xs font-bold' : 'h-7 px-4 rounded-full text-white/60 text-xs'; }
  });
  if(tab==='users') try{ renderAdmin(); }catch(e){}
  if(tab==='moderation') try{ renderAdmin(); }catch(e){}
  if(tab==='shop') renderShopAdmin();
  if(tab==='appearance') loadCustomAppearance();
}
function loadCustomAppearance(){
  try{
    var data=JSON.parse(localStorage.getItem('vault_custom')||'{}');
    if(data.primary) document.getElementById('customPrimary').value=data.primary;
    if(data.bg) document.getElementById('customBg').value=data.bg;
    if(data.radius) { document.getElementById('customRadius').value=data.radius; var rv=document.getElementById('radiusVal2'); if(rv) rv.textContent=data.radius+'px'; }
    if(data.font) document.getElementById('customFont').value=data.font;
    if(data.density) document.getElementById('customDensity').value=data.density;
  }catch(e){}
}
function renderAdminUsers(){ try{ renderAdmin(); }catch(e){} }
function renderAdminModeration(){ try{ renderAdmin(); }catch(e){} }
function renderAdminTracks(){
  var listEl=document.getElementById('adminTrackList'); if(!listEl) return;
  var q=(document.getElementById('adminSearch')?.value||'').toLowerCase();
  var sort=document.getElementById('adminSort')?.value||'newest';
  var list=TRACKS.filter(t=> !q || (t.title+t.id+t.era).toLowerCase().includes(q));
  if(sort==='az') list=list.slice().sort((a,b)=>a.title.localeCompare(b.title));
  if(!list.length) listEl.innerHTML='<p class="text-xs opacity-40 py-4 text-center">No tracks match search</p>';
  else listEl.innerHTML=list.map(t=>'<div class="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/5"><img src="'+t.cover+'" class="w-8 h-8 rounded object-cover"><div class="flex-1 min-w-0"><p class="text-xs font-bold truncate">'+escapeHtml(t.title)+'</p><p class="text-[11px] opacity-40 truncate">'+t.id+' • '+t.era+'</p></div><button onclick="adminDeleteTrack(\''+t.id+'\')" class="w-7 h-7 rounded-full bg-red-500/20 text-red-300 grid place-items-center text-xs">✕</button></div>').join('');
  var s1=document.getElementById('adminStatTracks'); if(s1) s1.textContent=String(TRACKS.length);
  var s2=document.getElementById('adminStatPending'); if(s2) s2.textContent=String((typeof SUGGESTIONS!=='undefined'?SUGGESTIONS.length:0));
  var s3=document.getElementById('adminStatUsers'); if(s3) s3.textContent=String(Object.keys(getUsers()).length);
  var s4=document.getElementById('adminStatPlays'); if(s4) s4.textContent=String(Object.values(state.playCounts).reduce((a,b)=>a+b,0));
}
function customizeVault(){
  var primary=document.getElementById('customPrimary')?.value;
  var bg=document.getElementById('customBg')?.value;
  var radius=document.getElementById('customRadius')?.value;
  var font=document.getElementById('customFont')?.value;
  var density=document.getElementById('customDensity')?.value;
  if(primary) document.documentElement.style.setProperty('--vault-primary', primary);
  if(bg) document.body.style.backgroundColor=bg;
  if(radius){ document.documentElement.style.setProperty('--vault-radius', radius+'px'); var rv=document.getElementById('radiusVal2'); if(rv) rv.textContent=radius+'px'; }
  if(font) document.body.style.fontFamily=font+', system-ui, sans-serif';
  if(density){
    var pad=density==='compact'?'8px':density==='spacious'?'24px':'16px';
    document.querySelectorAll('.card').forEach(el=> el.style.padding=pad);
  }
  try{ localStorage.setItem('vault_custom', JSON.stringify({primary:bg?bg:primary, bg, radius, font, density})); }catch(e){}
}
function saveCustom(){ customizeVault(); showAdminMsg('Saved — reload to see full'); }
function resetCustom(){ try{ localStorage.removeItem('vault_custom'); }catch(e){} location.reload(); }
function adminClearHistory(){ if(!isOwner()) return; if(!confirm('Clear all history?')) return; state.history=[]; localStorage.setItem(historyKey(),'[]'); renderHistory(); renderAdminTracks(); }
function renderAdmin(){
  updateOwnerNames();
  const gate=document.getElementById('adminGate');
  const content=document.getElementById('adminContent');
  const who=document.getElementById('adminWho');
  const owner=isOwner();
  // Strict gate — only owners/admins see content
  if(!owner){
    if(gate) gate.classList.remove('hidden');
    if(content) content.classList.add('hidden');
    if(who) who.textContent = state.user ? `Logged in as ${state.user.email} — not an owner (admin required)` : 'Not logged in — owner required';
    if(gate){
      gate.innerHTML=`<p class="font-display font-700">Owner access required</p><p class="text-[13px] text-white/60 mt-1 font-body">Admin panel is owners only — log in with an owner account.</p><button onclick="openAuth('login')" class="mt-4 h-10 px-6 rounded-full bg-white text-black text-[13px] font-700">Log in</button>`;
    }
    return;
  }
  if(gate) gate.classList.add('hidden');
  if(content) content.classList.remove('hidden');
  if(who) who.textContent=`Logged in as ${state.user.email} ● OWNER`;
  try{ renderAdminTracks(); }catch(e){}
  // owner sees everything
  const countEl=document.getElementById('adminCount');
  if(countEl) countEl.textContent = String(TRACKS.length);
  const suggEl=document.getElementById('suggestionsList');
  const suggCount=document.getElementById('suggCount');
  if(suggCount) suggCount.textContent=String(SUGGESTIONS.length);
  if(suggEl){
    if(SUGGESTIONS.length===0) suggEl.innerHTML=`<p class="text-sm text-white/40 py-6 text-center border border-dashed border-white/10 rounded-xl">No pending suggestions</p>`;
    else suggEl.innerHTML=SUGGESTIONS.map(s=>`
      <div class="flex items-center gap-3 p-3 rounded-xl bg-[#020208]/65 border border-white/5">
        <img src="${s.cover}" class="w-10 h-10 rounded-lg object-cover">
        <div class="flex-1 min-w-0"><p class="text-[13px] font-600 truncate">${s.title}</p><p class="text-[11px] font-mono text-white/40 truncate">${s.id} • ${s.era} • ${s.year} • by ${s.by}</p></div>
        <button onclick="approveSuggestion('${s.id}')" class="h-7 px-3 rounded-full bg-emerald-500 text-white text-[11px] font-700">Approve</button><button onclick="rejectSuggestion('${s.id}')" class="w-7 h-7 rounded-full bg-white/10 grid place-items-center text-xs">✕</button>
      </div>
    `).join('');
  }
  // analytics
  const statTracks=document.getElementById('adminStatTracks'); if(statTracks) statTracks.textContent=String(TRACKS.length);
  const statPending=document.getElementById('adminStatPending'); if(statPending) statPending.textContent=String(SUGGESTIONS.length);
  const statUsers=document.getElementById('adminStatUsers'); if(statUsers) statUsers.textContent=String(Object.keys(getUsers()).length);
  const statChat=document.getElementById('adminStatChat'); if(statChat) statChat.textContent=String(chatMessages.length);
  // albums grouped
  const albumEl=document.getElementById('adminAlbumList');
  if(albumEl){
    const albums=[...new Set(CUSTOM_TRACKS.filter(t=>t.album).map(t=>t.album))];
    if(albums.length===0) albumEl.innerHTML='<p class="text-xs opacity-40 py-2">No albums — add one via folder import</p>';
    else albumEl.innerHTML='<p class="text-[11px] font-mono tracking-widest text-white/30 mt-2">ALBUMS — tap to delete</p><div class="mt-2 space-y-1">'+albums.map(function(al){
      var count=CUSTOM_TRACKS.filter(function(t){return t.album===al;}).length;
      var cover=(CUSTOM_TRACKS.find(function(t){return t.album===al;})||{}).cover||'';
      var safeId=btoa(unescape(encodeURIComponent(al)));
      return '<div class="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10"><img src="'+cover+'" class="w-10 h-10 rounded-lg object-cover"><div class="flex-1 min-w-0"><p class="text-sm font-bold truncate">'+escapeHtml(al)+'</p><p class="text-xs opacity-50">'+count+' tracks</p></div><button onclick="adminDeleteAlbumById(\''+safeId+'\')" class="h-8 px-3 rounded-full bg-red-500 text-white text-xs font-bold">Delete</button></div>';
    }).join('')+'</div>';
  }
  const userEl=document.getElementById('adminUserList');
  if(userEl){
    const users=getUsers();
    const entries=Object.keys(users);
    if(entries.length===0) userEl.innerHTML=`<p class="text-sm text-white/40 py-4 text-center">No registered users yet</p>`;
    else userEl.innerHTML=entries.map(email=>{
      const ownerBadge=isOwnerEmail(email)?`<span class="ml-2 text-[9px] font-700 bg-amber-300 text-black px-1.5 py-0.5 rounded-full">OWNER</span>`:'';
      return `<div class="flex items-center justify-between p-2 rounded-xl bg-[#020208]/65 border border-white/5"><span class="text-[13px] font-mono truncate">${email}${ownerBadge}</span><button onclick="adminDeleteUser('${email}')" class="text-[11px] text-red-300/70 hover:text-red-300">Remove</button></div>`;
    }).join('');
  }
}
function switchAddTab(tab){
  document.getElementById('add-songs-panel').classList.toggle('hidden', tab!=='songs');
  document.getElementById('add-albums-panel').classList.toggle('hidden', tab!=='albums');
  document.getElementById('tab-add-songs').className = tab==='songs' ? 'h-8 px-5 rounded-full bg-white text-black text-[12px] font-700' : 'h-8 px-5 rounded-full text-white/60 text-[12px] font-600 hover:bg-white/10';
  document.getElementById('tab-add-albums').className = tab==='albums' ? 'h-8 px-5 rounded-full bg-amber-300 text-black text-[12px] font-700' : 'h-8 px-5 rounded-full text-white/60 text-[12px] font-600 hover:bg-white/10';
}

let _albumFiles=[];
document.addEventListener('change', e=>{
  if(e.target && e.target.id==='siteBgFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>6*1024*1024) return alert('Background too large — max 6MB');
    const r=new FileReader(); r.onload=()=>{ localStorage.setItem('uzi_custom_bg', r.result); applyArtistUI(); showAdminMsg('Background updated'); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='defaultCoverFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>2*1024*1024) return alert('Cover too large — max 2MB');
    const r=new FileReader(); r.onload=()=>{ localStorage.setItem('uzi_default_cover', r.result); showAdminMsg('Default cover updated'); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='uziSideFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>3*1024*1024) return alert('Image too large — max 3MB');
    const r=new FileReader(); r.onload=()=>{ localStorage.setItem('uzi_sidebar_bg', r.result); applyArtistUI(); showAdminMsg('Uzi side image updated'); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='juiceSideFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>3*1024*1024) return alert('Image too large — max 3MB');
    const r=new FileReader(); r.onload=()=>{ localStorage.setItem('juice_sidebar_bg', r.result); applyArtistUI(); showAdminMsg('Juice side image updated'); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='admCoverFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>2*1024*1024) return alert('Cover too large — max 2MB');
    const r=new FileReader(); r.onload=()=>{ document.getElementById('admCover').value=r.result; showAdminMsg('Cover attached: '+f.name); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='albumCoverFile'){
    const f=e.target.files[0]; if(!f) return;
    if(f.size>2*1024*1024) return alert('Cover too large — max 2MB');
    const r=new FileReader(); r.onload=()=>{ document.getElementById('albumCover').value=r.result; showAdminMsg('Album cover attached: '+f.name); }; r.readAsDataURL(f);
  }
  if(e.target && e.target.id==='admSrcFile'){
    const f=e.target.files[0]; if(!f) return;
    const url=URL.createObjectURL(f);
    document.getElementById('admSrc').value=url;
    document.getElementById('admTitle').value = document.getElementById('admTitle').value || f.name.replace(/\.[^/.]+$/,'');
    showAdminMsg('File attached: '+f.name);
  }
  if(e.target && e.target.id==='albumFolder'){
    _albumFiles=Array.from(e.target.files).filter(f=>f.type.startsWith('audio/')||/\.(mp3|wav|m4a|flac|ogg)$/i.test(f.name));
    const preview=document.getElementById('albumFolderPreview');
    if(!preview) return;
    if(_albumFiles.length===0) preview.innerHTML=`<p class="text-[11px] text-red-300">No audio files found in folder</p>`;
    else preview.innerHTML=`<p class="text-[11px] font-mono text-white/40 mb-1">${_albumFiles.length} files detected:</p>`+_albumFiles.slice(0,12).map(f=>`<div class="text-[11px] font-mono bg-[#020208]/65 border border-white/[0.08] rounded-lg px-2 py-1 truncate">${f.name} • ${(f.size/1024/1024).toFixed(1)}MB</div>`).join('')+(_albumFiles.length>12?`<p class="text-[10px] text-white/30">+${_albumFiles.length-12} more…</p>`:'');
  }
});
function adminAddTrack(){
  if(!isOwner()) return showAdminMsg('Owner only', true);
  let title=document.getElementById('admTitle').value.trim();
  const id=document.getElementById('admId').value.trim()||'UV-'+Date.now().toString().slice(-4);
  const era=document.getElementById('admEra').value;
  const year=document.getElementById('admYear').value.trim()||new Date().getFullYear();
  const duration=document.getElementById('admDuration').value.trim()||'--:--';
  const type=document.getElementById('admType').value;
  const cover=document.getElementById('admCover').value.trim()||'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80';
  let src=document.getElementById('admSrc').value.trim();
  const fileInput=document.getElementById('admSrcFile');
  if(!src && fileInput && fileInput.files[0]) src=URL.createObjectURL(fileInput.files[0]);
  if(!src) src='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  if(!title){
    const f=fileInput && fileInput.files[0];
    if(f) title=f.name.replace(/\.[^/.]+$/,'');
    else return showAdminMsg('Title required', true);
  }
  if(TRACKS.some(t=>t.id===id)) return showAdminMsg('ID already exists', true);
  const track={id, title, era, year, duration, type, status: type.charAt(0).toUpperCase()+type.slice(1), cover, src};
  CUSTOM_TRACKS.push(track);
  saveCustomTracks(CUSTOM_TRACKS);
  TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
  showAdminMsg('Added song: '+title);
  ['admTitle','admId','admYear','admDuration','admCover','admSrc'].forEach(i=>{const e=document.getElementById(i); if(e) e.value='';});
  if(fileInput) fileInput.value='';
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
}
function adminAddAlbum(){
  if(!isOwner()) return showAdminMsg('Owner only', true);
  const albumName=document.getElementById('albumName').value.trim();
  const albumYear=document.getElementById('albumYear').value.trim()||new Date().getFullYear().toString();
  const albumEra=document.getElementById('albumEra').value;
  const albumType=document.getElementById('albumType').value;
  const albumCover=document.getElementById('albumCover').value.trim()||'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80';
  if(!albumName) return showAdminMsg('Album/EP name required', true);
  if(_albumFiles.length===0) return showAdminMsg('Select a folder with audio files', true);
  let added=0;
  _albumFiles.forEach(file=>{
    const baseTitle=file.name.replace(/\.[^/.]+$/,'');
    const id='UV-'+Date.now().toString().slice(-4)+'-'+added;
    const track={
      id,
      title: baseTitle,
      era: albumEra,
      year: albumYear,
      duration: '--:--',
      type: albumType,
      status: albumType.charAt(0).toUpperCase()+albumType.slice(1),
      cover: albumCover,
      src: URL.createObjectURL(file),
      album: albumName
    };
    CUSTOM_TRACKS.push(track); added++;
  });
  saveCustomTracks(CUSTOM_TRACKS);
  TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
  showAdminMsg('Added album/EP "'+albumName+'" — '+added+' tracks indexed');
  document.getElementById('albumName').value=''; document.getElementById('albumFolder').value=''; document.getElementById('albumFolderPreview').innerHTML=''; _albumFiles=[];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
}
function adminDeleteTrack(id){
  if(!isOwner()) return;
  CUSTOM_TRACKS=CUSTOM_TRACKS.filter(t=>t.id!==id);
  saveCustomTracks(CUSTOM_TRACKS);
  TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats(); renderRadioQueue();
  showAdminMsg('Removed '+id);
}
function adminClearTracks(){
  if(!isOwner()) return;
  if(!confirm('Clear all custom indexed tracks?')) return;
  CUSTOM_TRACKS=[]; saveCustomTracks([]); TRACKS=[...BASE_TRACKS];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
}
function adminClearAlbums(){
  if(!isOwner()) return;
  const albums=[...new Set(CUSTOM_TRACKS.filter(t=>t.album).map(t=>t.album))];
  if(albums.length===0) return showAdminMsg('No albums to clear', true);
  if(!confirm('Clear all albums? ('+albums.join(', ')+')')) return;
  CUSTOM_TRACKS=CUSTOM_TRACKS.filter(t=>!t.album);
  saveCustomTracks(CUSTOM_TRACKS); TRACKS=[...BASE_TRACKS,...CUSTOM_TRACKS];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
}
function adminDeleteAlbum(album){
  if(!isOwner()) return;
  if(!confirm('Remove entire album "'+album+'"?')) return;
  CUSTOM_TRACKS=CUSTOM_TRACKS.filter(t=>t.album!==album);
  saveCustomTracks(CUSTOM_TRACKS); TRACKS=[...BASE_TRACKS,...CUSTOM_TRACKS];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
  showAdminMsg('Removed album '+album);
}
function adminDeleteAlbumById(safeId){
  try{
    var album=decodeURIComponent(escape(atob(safeId)));
    adminDeleteAlbum(album);
  }catch(e){ alert('Delete failed'); }
}
function adminChangeCover(id){
  if(!isOwner()) return;
  const input=document.createElement('input'); input.type='file'; input.accept='image/*';
  input.onchange=()=>{
    const f=input.files[0]; if(!f) return;
    if(f.size>2*1024*1024) return alert('Cover too large — max 2MB');
    const r=new FileReader(); r.onload=()=>{
      const t=CUSTOM_TRACKS.find(x=>x.id===id) || TRACKS.find(x=>x.id===id);
      if(t) t.cover=r.result;
      // persist if custom
      const ct=CUSTOM_TRACKS.find(x=>x.id===id);
      if(ct) ct.cover=r.result;
      saveCustomTracks(CUSTOM_TRACKS); TRACKS=[...getBaseTracks(),...CUSTOM_TRACKS];
      renderVault(); renderAdmin(); showAdminMsg('Cover updated');
    }; r.readAsDataURL(f);
  };
  input.click();
}
function resetSiteImages(){
  if(!isOwner()) return;
  localStorage.removeItem('uzi_custom_bg');
  localStorage.removeItem('uzi_default_cover');
  localStorage.removeItem('uzi_sidebar_bg');
  localStorage.removeItem('juice_sidebar_bg');
  applyArtistUI(); showAdminMsg('Site images reset');
}
function adminDeleteUser(email){
  if(!isOwner()) return;
  if(isOwnerEmail(email)) return showAdminMsg('Cannot remove owner', true);
  const users=getUsers(); delete users[email]; saveUsers(users); renderAdmin();
}
function adminExport(){
  const blob=new Blob([JSON.stringify(CUSTOM_TRACKS, null, 2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='uzivault-tracks.json'; a.click();
}
function adminImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error('Invalid');
      CUSTOM_TRACKS=data; saveCustomTracks(CUSTOM_TRACKS); TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
      renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
      showAdminMsg('Imported '+data.length+' tracks');
    }catch(err){ showAdminMsg('Import failed', true); }
  };
  reader.readAsText(file);
}
function adminFolderImport(e){
  if(!isOwner()) return showAdminMsg('Owner only', true);
  var files=Array.from(e.target.files).filter(function(f){ return /\.(mp3|wav|m4a|flac|ogg)$/i.test(f.name); });
  if(!files.length) return showAdminMsg('No audio files in folder', true);
  var folderName=(files[0].webkitRelativePath||files[0].name).split('/')[0]||'New Album';
  var added=0;
  files.forEach(function(file){
    var title=file.name.replace(/\.[^/.]+$/,'');
    var id='UV-'+Date.now().toString().slice(-4)+'-'+added;
    var track={id:id, title:title, era:document.getElementById('admEra')?.value||'Loose Files', year:new Date().getFullYear().toString(), duration:'--:--', type:'unreleased', status:'Unreleased', cover:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', src:URL.createObjectURL(file), album:folderName};
    CUSTOM_TRACKS.push(track); added++;
  });
  saveCustomTracks(CUSTOM_TRACKS);
  TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
  renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
  showAdminMsg('Imported folder "'+folderName+'" — '+added+' tracks');
  e.target.value='';
}
let _simpleAlbumFiles=[];
let _simpleAlbumCover=null;
document.addEventListener('change', function(e){
  if(e.target && e.target.id==='simpleAlbumFolder'){
    var files=Array.from(e.target.files);
    _simpleAlbumFiles=files.filter(function(f){ return /\.(mp3|wav|m4a|flac|ogg)$/i.test(f.name); });
    var imgs=files.filter(function(f){ return /\.(jpg|jpeg|png|webp)$/i.test(f.name); });
    _simpleAlbumCover=imgs[0]||null;
    var preview=document.getElementById('simpleAlbumPreview');
    if(!preview) return;
    if(!_simpleAlbumFiles.length){ preview.classList.add('hidden'); return; }
    var folderName=(_simpleAlbumFiles[0].webkitRelativePath||_simpleAlbumFiles[0].name).split('/')[0]||'New Album';
    preview.classList.remove('hidden');
    preview.innerHTML='<p class="font-bold">'+_simpleAlbumFiles.length+' songs — Album: '+folderName+'</p><p class="opacity-60">Cover: '+(_simpleAlbumCover? _simpleAlbumCover.name : 'none — will use default')+'</p><div class="mt-1 max-h-[80px] overflow-auto">'+_simpleAlbumFiles.slice(0,5).map(function(f){return '<div class="truncate">'+f.name+'</div>';}).join('')+( _simpleAlbumFiles.length>5 ? '<p> +'+(_simpleAlbumFiles.length-5)+' more</p>' : '')+'</div>';
  }
});
function simpleAlbumPublish(){
  if(!isOwner()) return showAdminMsg('Owner only', true);
  if(!_simpleAlbumFiles.length) return showAdminMsg('Pick a folder first', true);
  var artist=document.getElementById('simpleAlbumArtist')?.value.trim()||'Lil Uzi Vert';
  var folderName=(_simpleAlbumFiles[0].webkitRelativePath||_simpleAlbumFiles[0].name).split('/')[0]||'New Album';
  var coverPromise = _simpleAlbumCover ? new Promise(function(res){
    var r=new FileReader(); r.onload=function(){ res(r.result); }; r.readAsDataURL(_simpleAlbumCover);
  }) : Promise.resolve('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80');
  coverPromise.then(function(coverData){
    var added=0;
    _simpleAlbumFiles.forEach(function(file){
      var title=file.name.replace(/\.[^/.]+$/,'');
      var id='UV-'+Date.now().toString().slice(-4)+'-'+added;
      var track={id:id, title:title, artist:artist, era:document.getElementById('admEra')?.value||'Loose Files', year:new Date().getFullYear().toString(), duration:'--:--', type:'unreleased', status:'Unreleased', cover:coverData, src:URL.createObjectURL(file), album:folderName};
      CUSTOM_TRACKS.push(track); added++;
    });
    saveCustomTracks(CUSTOM_TRACKS);
    TRACKS=[...BASE_TRACKS, ...CUSTOM_TRACKS];
    renderVault(); renderLatest(); renderEras(); renderAdmin(); updateVaultStats();
    showAdminMsg('Published album "'+folderName+'" — '+added+' tracks by '+artist);
    document.getElementById('simpleAlbumFolder').value=''; document.getElementById('simpleAlbumArtist').value=''; document.getElementById('simpleAlbumPreview').classList.add('hidden'); _simpleAlbumFiles=[]; _simpleAlbumCover=null;
  });
}
function showAdminMsg(msg,isErr){
  const el=document.getElementById('adminMsg'); if(!el) return;
  el.textContent=msg; el.className='text-[12px] font-mono mt-2 '+(isErr?'text-red-300':'text-emerald-300');
  el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 2500);
}
function adminClearChat(){ if(!isOwner()) return; if(!confirm('Clear all live chat messages?')) return; chatMessages=[]; saveChat(); renderChat(); renderAdmin(); }
function adminClearSuggestions(){ if(!isOwner()) return; if(!confirm('Clear all pending suggestions?')) return; SUGGESTIONS=[]; saveSuggestions(SUGGESTIONS); renderAdmin(); }
function adminNukeBlocked(){ if(!isOwner()) return; alert('No blocked IDs — clean.'); }
function adminBroadcast(){
  if(!isOwner()) return;
  const msg=prompt('Broadcast message to chat as OWNER:');
  if(!msg) return;
  chatMessages.push({user: state.user.name, text: msg, time: Date.now(), owner:true});
  saveChat(); renderChat(); renderAdmin();
}

// Controls — vault is now Spotify-like
function onSearch(v){ state.search=v; if(state.view!=='vault') navigate('vault'); renderVault(); }
function vaultSearch(v){
  state.search=v;
  var hdr=document.getElementById('searchInput'); if(hdr) hdr.value=v;
  renderVault();
  // also filter albums preview in vault
  renderAlbums();
  var vs=document.getElementById('vaultSearch'); if(vs && vs.value!==v) vs.value=v;
}
function vaultCreatePlaylist(){
  var input=document.getElementById('vaultPlaylistName');
  var name=(input && input.value.trim()) || 'My Playlist';
  if(name.length<2) return;
  var list=getFiltered();
  if(!list.length) list=TRACKS.slice(0,5);
  PLAYLISTS=loadPlaylists();
  var pl={id:'PL-'+Date.now(), name:name.slice(0,20), tracks:list.map(t=>t.id).slice(0,20), by: state.user?state.user.email:'guest@local'};
  PLAYLISTS.push(pl); savePlaylists(PLAYLISTS); if(input) input.value='';
  renderPlaylists(); renderVaultPlaylistsPreview();
  // preview feedback
  var box=document.getElementById('vaultPlaylistsPreview');
  if(box){ box.innerHTML='<p class="text-xs text-[#1DB954]">Created “'+escapeHtml(name)+'” with '+pl.tracks.length+' tracks</p>'; setTimeout(()=>renderVaultPlaylistsPreview(),2000); }
}
function renderVaultPlaylistsPreview(){
  var box=document.getElementById('vaultPlaylistsPreview'); if(!box) return;
  PLAYLISTS=loadPlaylists();
  if(!PLAYLISTS.length){ box.innerHTML=''; return; }
  box.innerHTML='<div class="flex gap-2 overflow-x-auto pb-1">'+PLAYLISTS.slice(-4).map(pl=>'<span class="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs whitespace-nowrap">'+escapeHtml(pl.name)+' • '+pl.tracks.length+'</span>').join('')+'</div>';
}
function syncVaultPlayer(){
  var t=state.currentTrack;
  var art=document.getElementById('vaultPlayerArt');
  var title=document.getElementById('vaultPlayerTitle');
  var sub=document.getElementById('vaultPlayerSub');
  if(!t){
    if(title) title.textContent='Not playing';
    if(sub) sub.textContent='Pick a song';
    return;
  }
  if(art) art.src=t.cover;
  if(title) title.textContent=t.title;
  if(sub) sub.textContent=(t.album||t.era||'Vault')+' • '+t.year;
}
function renderVaultRecents(){
  var vr=document.getElementById('vaultRecent');
  var rr=document.getElementById('vaultRadioRecent');
  if(vr){
    if(!state.history.length) vr.innerHTML='<p class="text-xs opacity-40">No recently played — play something and it shows here</p>';
    else {
      var recent=state.history.slice(0,5).map(function(id){ var t=TRACKS.find(function(x){return x.id===id}); if(!t) return ''; return '<div class="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/5"><img src="'+t.cover+'" class="w-8 h-8 rounded object-cover"><div class="flex-1 min-w-0"><p class="text-xs font-bold truncate">'+escapeHtml(t.title)+'</p><p class="text-[11px] opacity-50 truncate">'+escapeHtml(t.era||'')+' • '+escapeHtml(t.id)+'</p></div><button onclick="playTrack(\''+t.id+'\')" class="w-7 h-7 rounded-full bg-white text-black grid place-items-center text-xs">▶</button></div>'; }).join('');
      vr.innerHTML=recent || '<p class="text-xs opacity-40">No valid tracks in history</p>';
    }
  }
  if(rr){
    // radio recently played — same history for now, but filtered to show last 5
    if(!state.history.length) rr.innerHTML='<p class="text-xs opacity-40">Radio has no recently played — start Radio</p>';
    else {
      var recent2=state.history.slice(0,5).map(function(id){ var t=TRACKS.find(function(x){return x.id===id}); if(!t) return ''; return '<div class="flex items-center gap-2 p-2 rounded-xl bg-[#ff2e93]/10 border border-[#ff2e93]/20"><img src="'+t.cover+'" class="w-8 h-8 rounded object-cover"><div class="flex-1 min-w-0"><p class="text-xs font-bold truncate">'+escapeHtml(t.title)+'</p><p class="text-[11px] opacity-50 truncate">Radio • '+escapeHtml(t.era||'')+'</p></div><button onclick="playTrack(\''+t.id+'\')" class="w-7 h-7 rounded-full bg-[#ff2e93] text-white grid place-items-center text-xs">▶</button></div>'; }).join('');
      rr.innerHTML=recent2;
    }
  }
}
function setFilter(f){ state.filter=f; renderVault(); if(state.view!=='vault') navigate('vault'); }
function setEraFilter(era){ state.era=era; const sel=document.getElementById('eraSelect'); if(sel) sel.value=era; navigate('vault'); renderVault(); }
function filterLiked(){
  const likedTracks = TRACKS.filter(t=> state.liked.includes(t.id));
  document.getElementById('vaultGrid').innerHTML = likedTracks.length ? likedTracks.map(t=>renderCard(t)).join('') : `<p class="col-span-full text-center text-white/40 py-16 font-body">No liked songs yet — hit ♡ on any track.</p>`;
  navigate('vault');
  const vc=document.getElementById('vaultCount'); if(vc) vc.textContent = likedTracks.length + ' liked';
}
function showQueue(){
  const d=document.getElementById('queueDrawer');
  if(!d) return;
  d.classList.toggle('hidden');
  renderQueueDrawer();
}
function toggleQueue(){ return showQueue(); }
function toggleLike(id){
  if(state.liked.includes(id)) state.liked=state.liked.filter(x=>x!==id);
  else state.liked.push(id);
  localStorage.setItem(likedKey(), JSON.stringify(state.liked));
  document.getElementById('likedCount').textContent=state.liked.length;
  updateLikeBtn();
  renderVault(); renderLatest(); renderQueueDrawer(); updateVaultStats();
}
function toggleLikeCurrent(){ if(state.currentTrack) toggleLike(state.currentTrack.id); }
function updateLikeBtn(){
  const btn=document.getElementById('likeBtn');
  if(!btn) return;
  if(!state.currentTrack) {btn.textContent='♡'; btn.classList.remove('text-[#ff2e93]'); return;}
  const liked=state.liked.includes(state.currentTrack.id);
  btn.textContent = liked ? '♥' : '♡';
  btn.classList.toggle('text-[#ff2e93]', liked);
  btn.classList.toggle('text-white/60', !liked);
}
function addToQueue(id){
  state.queue.push(id);
  localStorage.setItem(queueKey(), JSON.stringify(state.queue));
  renderRadioQueue(); renderQueueDrawer();
  if(!state.currentTrack) playTrack(id);
}
function removeFromQueue(idx){ state.queue.splice(idx,1); localStorage.setItem(queueKey(), JSON.stringify(state.queue)); renderRadioQueue(); renderQueueDrawer(); }
function clearQueue(){ state.queue=[]; localStorage.setItem(queueKey(), JSON.stringify(state.queue)); renderRadioQueue(); renderQueueDrawer(); }
function shuffleAll(){
  if(TRACKS.length===0) return;
  const shuffled=[...TRACKS].sort(()=>Math.random()-0.5).map(t=>t.id);
  state.queue=shuffled;
  localStorage.setItem(queueKey(), JSON.stringify(state.queue));
  renderRadioQueue(); renderQueueDrawer();
  playTrack(shuffled[0]);
}
function startRadio(){
  if(TRACKS.length===0) return;
  const pool = getFiltered().length ? getFiltered() : TRACKS;
  const shuffled=[...pool].sort(()=>Math.random()-0.5).map(t=>t.id);
  state.queue=shuffled;
  localStorage.setItem(queueKey(), JSON.stringify(state.queue));
  renderRadioQueue();
  playTrack(shuffled[0]);
  navigate('radio');
}
function startRadioEra(era){
  state.era=era; startRadio();
}
function toggleShuffle(){
  if(!isOwner()) return;
  state.shuffle=!state.shuffle;
  const b=document.getElementById('shuffleBtn'); if(b) b.textContent='Shuffle: '+(state.shuffle?'ON':'OFF');
}
function toggleRepeat(){
  state.repeat=!state.repeat;
  document.getElementById('repeatBtn').classList.toggle('text-[#ff2e93]', state.repeat);
}

function playTrack(id){
  const track=TRACKS.find(t=>t.id===id);
  if(!track) return;
  state.currentTrack=track;
  state.playCounts[id]=(state.playCounts[id]||0)+1;
  localStorage.setItem(countsKey(), JSON.stringify(state.playCounts));
  // history — general feature for all users including guests
  state.history = [id, ...state.history.filter(x=>x!==id)].slice(0,30);
  localStorage.setItem(historyKey(), JSON.stringify(state.history));
  if(!state.queue.includes(id)) state.queue.unshift(id);
  else state.queue = [id, ...state.queue.filter(x=>x!==id)];
  const _els = {
    playerArt: document.getElementById('playerArt'),
    sideArt: document.getElementById('sideArt'),
    playerTitle: document.getElementById('playerTitle'),
    playerMeta: document.getElementById('playerMeta'),
    sideTitle: document.getElementById('sideTitle'),
    sideEra: document.getElementById('sideEra'),
    radioArt: document.getElementById('radioArt'),
    radioTitle: document.getElementById('radioTitle'),
    radioMeta: document.getElementById('radioMeta'),
  };
  if(_els.playerArt) _els.playerArt.src=track.cover;
  if(_els.sideArt) _els.sideArt.src=track.cover;
  if(_els.playerTitle) _els.playerTitle.textContent=track.title;
  if(_els.playerMeta) _els.playerMeta.textContent=`${track.era} • ${track.year} • ${track.id}`;
  if(_els.sideTitle) _els.sideTitle.textContent=track.title;
  if(_els.sideEra) _els.sideEra.textContent=`${track.era} • ${track.duration}`;
  if(_els.radioArt) _els.radioArt.src=track.cover;
  if(_els.radioTitle) _els.radioTitle.textContent=track.title;
  if(_els.radioMeta) _els.radioMeta.textContent=`${track.era} • ${track.year} • ${track.status} • ${track.duration}`;
  updateLikeBtn();
  if(audio){
    audio.src=track.src;
    try{
      const p = audio.play();
      if(p && typeof p.then === 'function'){
        p.then(()=>{ state.isPlaying=true; updatePlayBtn(); }).catch(()=>{ state.isPlaying=false; updatePlayBtn(); });
      } else {
        state.isPlaying=true; updatePlayBtn();
      }
    }catch(e){ state.isPlaying=true; updatePlayBtn(); }
  }
  renderVault(); renderLatest(); renderRadioQueue(); renderQueueDrawer(); renderCharts();
}
function updatePlayBtn(){
  if(playBtn) playBtn.textContent = state.isPlaying ? '❚❚' : '▶';
  var _v=document.getElementById('visualizer'); if(_v && _v.parentElement) _v.parentElement.classList.toggle('paused', !state.isPlaying);
  try{ updateRadioOwnerUI(); }catch(e){}
}
function togglePlay(){
  if(TRACKS.length===0) return;
  // owner-only pause on radio
  if(state.isPlaying && state.view==='radio' && !isOwner()) return;
  if(!state.currentTrack){
    if(state.queue.length) playTrack(state.queue[0]);
    else shuffleAll();
    return;
  }
  if(state.isPlaying){ try{ audio && audio.pause(); }catch(e){} state.isPlaying=false; }
  else {
    try{
      const p = audio && audio.play();
      if(p && typeof p.then === 'function'){ p.catch(()=>{}); }
    }catch(e){}
    state.isPlaying=true;
  }
  updatePlayBtn();
  updateRadioOwnerUI();
}
function nextTrack(){
  if(!isOwner()) return;
  if(state.queue.length===0) return;
  var curIdx=state.queue.indexOf(state.currentTrack && state.currentTrack.id);
  const nxt = curIdx>=0 ? state.queue[curIdx+1] : state.queue[0];
  if(nxt) playTrack(nxt);
  else if(state.repeat && state.currentTrack) playTrack(state.currentTrack.id);
  else if(state.shuffle) shuffleAll();
}
function prevTrack(){
  if(!audio) return;
  if(audio.currentTime>3){ audio.currentTime=0; return; }
  var curIdx=state.queue.indexOf(state.currentTrack && state.currentTrack.id);
  if(curIdx>0) playTrack(state.queue[curIdx-1]);
}
function seek(e){
  if(!audio || !audio.duration) return;
  const rect=e.currentTarget.getBoundingClientRect();
  const pct=(e.clientX-rect.left)/rect.width;
  if(audio.duration) audio.currentTime=pct*audio.duration;
}
let _prevVolume=80;
function setVolume(v){
  if(!audio) return;
  v=parseInt(v); audio.volume=v/100; audio.muted=v==0;
  const fill=document.getElementById('volumeFill'); if(fill) fill.style.width=v+'%';
  const thumb=document.getElementById('volumeThumb'); if(thumb) thumb.style.left=v+'%';
  const slider=document.getElementById('volumeSlider'); if(slider) slider.value=v;
  const muteBtn=document.getElementById('muteBtn'); if(muteBtn) muteBtn.textContent = v==0 ? '🔇' : v<40 ? '🔈' : v<75 ? '🔉' : '🔊';
  if(v>0) _prevVolume=v;
}
function toggleMute(){
  if(!audio) return;
  const cur= Math.round(audio.volume*100);
  if(cur>0){ _prevVolume=cur; setVolume(0); }
  else setVolume(_prevVolume||80);
}

if(audio){
  audio.addEventListener('timeupdate', ()=>{
    const pct= audio.duration ? (audio.currentTime/audio.duration)*100 : 0;
    const p=document.getElementById('progress'); if(p) p.style.width=pct+'%';
    const h=document.getElementById('progressHandle'); if(h) h.style.left=pct+'%';
    const ct=document.getElementById('curTime'); if(ct) ct.textContent=formatTime(audio.currentTime);
    const dt=document.getElementById('durTime'); if(dt) dt.textContent=formatTime(audio.duration||0);
    const vp=document.getElementById('vaultPlayerBar'); if(vp) vp.style.width=pct+'%';
  });
  audio.addEventListener('ended', ()=> { try{ nextTrack(); }catch(e){} });
  audio.addEventListener('play', ()=>{ state.isPlaying=true; try{ updatePlayBtn(); }catch(e){} try{ syncVaultPlayer(); }catch(e){} });
  audio.addEventListener('pause', ()=>{ state.isPlaying=false; try{ updatePlayBtn(); }catch(e){} try{ syncVaultPlayer(); }catch(e){} });
}

function formatTime(s){
  if(isNaN(s)) return "0:00";
  const m=Math.floor(s/60), sec=Math.floor(s%60);
  return m+":"+(sec<10?"0"+sec:sec);
}

// --- Online Indicator (honest: no fake numbers) — green LIVE pill ---
function updateOnlineIndicators(){
  // Honest: just shows LIVE status, no inflated counts. Pill is green-highlighted via CSS.
  const o1=document.getElementById('onlineCount'); if(o1) o1.textContent='LIVE';
  const o2=document.getElementById('radioOnlineCount'); if(o2) o2.textContent='LIVE';
  const o3=document.getElementById('chatOnline'); if(o3) o3.textContent='LIVE';
}
updateOnlineIndicators();

// --- Live Chat (Radio Tab) — real messages only, no fakes ---
let _rawChat = _safeJSON(chatKey(), []);
// purge any old fake chats (RadioBot, welcome spam, simulated lines) that were stored before
const _fakeTexts = ['Welcome to UZI VERT FM','Tip: add tracks','Eternal Atake still','Pink Tape FM','need Luv Is Rage','who got the new snippet','this radio never misses','UZI VERT FM on repeat','space vibes are insane','play that unreleased','chat is alive rn','owners cooking','inShadeArtz'];
let _needsPurge = _rawChat.some(m => !m || m.user==='RadioBot' || m.user==='voidfe4r' && m.text.includes('Welcome') || _fakeTexts.some(t=> (m.text||'').includes(t)) );
if(_needsPurge){ _rawChat=[]; localStorage.setItem(chatKey(), JSON.stringify(_rawChat)); }
let chatMessages = _rawChat;
function saveChat(){ localStorage.setItem(chatKey(), JSON.stringify(chatMessages.slice(-200))); }
function renderChat(){
  const box=document.getElementById('chatMessages'); if(!box) return;
  if(chatMessages.length===0){
    box.innerHTML=`<div class="py-10 text-center"><p class="text-[13px] text-white/40 font-body">No messages yet — be the first.</p><p class="text-[11px] font-mono text-white/25 mt-1">Real chat only, no bots.</p></div>`;
    return;
  }
  box.innerHTML = chatMessages.slice(-60).map((m,idx)=>{
    const isOwn = state.user && m.user===state.user.name;
    const ownerBadge = m.owner ? `<span class="ml-1 text-[8px] font-800 bg-amber-300 text-black px-1 py-0.5 rounded-full">OWNER</span>` : '';
    const del = isOwner() ? `<button onclick="deleteChat(${chatMessages.length-60+idx})" class="ml-auto text-[10px] text-red-300/60 hover:text-red-300">✕</button>` : '';
    const time = new Date(m.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    return `<div class="flex gap-2 items-start ${isOwn?'bg-[#020208]/65 border border-white/5':''} rounded-xl px-2.5 py-2">
      <span class="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff2e93]/60 to-[#a855f7]/60 grid place-items-center text-[10px] font-700 shrink-0">${m.user[0].toUpperCase()}</span>
      <div class="min-w-0 flex-1"><p class="text-[12px] leading-tight"><span class="font-600">${m.user}</span>${ownerBadge} <span class="text-white/40 font-mono text-[10px]">${time}</span></p><p class="text-[13px] text-white/80 leading-snug break-words">${escapeHtml(m.text)}</p></div>
      ${del}
    </div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
  // also mirror to history chat
  renderHistoryChat();
}
function renderHistoryChat(){
  var box=document.getElementById('historyChatMessages'); if(!box) return;
  if(chatMessages.length===0){
    box.innerHTML='<div class="py-6 text-center text-xs opacity-40">No messages yet — history chat mirrors Radio chat</div>';
    return;
  }
  box.innerHTML = chatMessages.slice(-30).map(function(m){
    var time=new Date(m.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    var badge=m.owner ? ' <span class="ml-1 text-[8px] bg-amber-300 text-black px-1 rounded-full">OWNER</span>' : '';
    return '<div class="flex gap-2 py-1 text-xs"><span class="opacity-40">'+time+'</span><span class="font-bold">'+escapeHtml(m.user)+badge+'</span><span>'+escapeHtml(m.text)+'</span></div>';
  }).join('');
  box.scrollTop=box.scrollHeight;
}
function escapeHtml(s){ return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function sendChat(){
  // guests explicitly allowed — no login gate
  const input=document.getElementById('chatInput'); if(!input) return;
  const text=input.value.trim(); if(!text) return;
  if(text.length>200) return;
  const user = state.user ? state.user.name : 'Guest';
  const isOwnOwner = isOwner();
  chatMessages.push({user, text, time: Date.now(), owner: isOwnOwner});
  saveChat(); renderChat(); renderHistoryChat(); input.value='';
}
function sendHistoryChat(){
  const input=document.getElementById('historyChatInput'); if(!input) return;
  const text=input.value.trim(); if(!text) return;
  if(text.length>200) return;
  const user = state.user ? state.user.name : 'Guest';
  chatMessages.push({user, text, time: Date.now(), owner: isOwner()});
  saveChat(); renderChat(); renderHistoryChat(); input.value='';
}
function radioAddToQueue(){
  var input=document.getElementById('radioQueueAddInput'); if(!input) return;
  var id=input.value.trim(); if(!id) return;
  var t=TRACKS.find(function(x){return x.id===id});
  if(!t) { alert('Track ID not found: '+id); return; }
  addToQueue(id); input.value='';
  // feedback
  var box=document.getElementById('radioQueue'); if(box) box.scrollTop=0;
}
function deleteChat(idx){
  if(!isOwner()) return;
  const realIdx = Math.max(0, idx);
  if(realIdx <0 || realIdx >= chatMessages.length) return;
  chatMessages.splice(realIdx,1); saveChat(); renderChat();
}
renderChat();

// --- Profile Customization (vibey, localStorage, per-account) — handles removed, username unique ---
function getProfileKey(){ return 'uzi_profile_' + (state.user ? state.user.email : 'guest'); }
function defaultProfile(){
  const name = state.user ? state.user.name : 'UZI';
  return { displayName: name, bio: state.user ? 'No bio yet — make it vibey.' : 'UZI Vault • Archive', avatar: '', banner: 'uzi', accent: '#ff2e93' };
}
function loadProfile(){
  try{
    const raw=localStorage.getItem(getProfileKey());
    if(raw){
      const parsed=JSON.parse(raw);
      // migrate old handle profiles
      if(parsed.handle && !parsed.displayName) parsed.displayName=parsed.handle;
      delete parsed.handle;
      return {...defaultProfile(), ...parsed};
    }
  }catch(e){}
  return defaultProfile();
}
function persistProfile(p){ localStorage.setItem(getProfileKey(), JSON.stringify(p)); }
let currentProfile = loadProfile();
const bannerMap={
  uzi: 'linear-gradient(135deg, #ff2e93 0%, #a855f7 55%, #06b6d4 100%)',
  eternal: 'linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 50%, #06b6d4 100%)',
  rage: 'linear-gradient(135deg, #2e0b1a 0%, #ff2e93 55%, #ff6b35 100%)',
  void: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 55%, #2a2a3a 100%)',
  neon: 'linear-gradient(135deg, #ff2e93 0%, #00e5ff 50%, #a855f7 100%)'
};
function renderProfile(){
  currentProfile = loadProfile();
  const p=currentProfile;
  const nameEl=document.getElementById('profileName'); if(nameEl) nameEl.textContent=p.displayName;
  const bioEl=document.getElementById('profileBio'); if(bioEl) bioEl.textContent=p.bio||'No bio yet — make it vibey.';
  const bannerEl=document.getElementById('profileBanner'); if(bannerEl) bannerEl.style.background = bannerMap[p.banner] || bannerMap.uzi;
  const accentDot=document.getElementById('profileAccentDot'); if(accentDot) accentDot.style.background=p.accent;
  const accentText=document.getElementById('profileAccentText'); if(accentText) accentText.textContent=p.accent;
  const roleEl=document.getElementById('profileRolePill'); if(roleEl) roleEl.textContent = isOwner() ? 'OWNER' : (state.user && !state.user.guest ? 'MEMBER' : 'GUEST');
  const avatarEl=document.getElementById('profileAvatar'); const avatarFb=document.getElementById('profileAvatarFallback');
  if(p.avatar){ if(avatarEl){ avatarEl.src=p.avatar; avatarEl.classList.remove('hidden'); } if(avatarFb) avatarFb.classList.add('hidden'); } else { if(avatarEl) avatarEl.classList.add('hidden'); if(avatarFb){ avatarFb.classList.remove('hidden'); avatarFb.textContent=(p.displayName||'?')[0].toUpperCase(); avatarFb.style.background=bannerMap[p.banner]||bannerMap.uzi; } }
  // sidebar
  const sAvatar=document.getElementById('sidebarAvatar'); const sFb=document.getElementById('sidebarAvatarFallback');
  const sName=document.getElementById('sidebarName');
  if(sName) sName.textContent=p.displayName;
  if(p.avatar){ if(sAvatar){ sAvatar.src=p.avatar; sAvatar.classList.remove('hidden'); } if(sFb) sFb.classList.add('hidden'); } else { if(sAvatar) sAvatar.classList.add('hidden'); if(sFb){ sFb.classList.remove('hidden'); sFb.textContent=(p.displayName||'?')[0].toUpperCase(); } }
  // stats
  const likedEl=document.getElementById('profileStatLiked'); if(likedEl) likedEl.textContent=String(state.liked.length);
  const queueEl=document.getElementById('profileStatQueue'); if(queueEl) queueEl.textContent=String(state.queue.length);
  const playsEl=document.getElementById('profileStatPlays'); if(playsEl) playsEl.textContent=String(Object.values(state.playCounts).reduce((a,b)=>a+b,0));
}
function openProfileEdit(){
  currentProfile=loadProfile();
  const p=currentProfile;
  const map={displayName:'editDisplayName', bio:'editBio', avatar:'editAvatar', banner:'editBanner', accent:'editAccent'};
  Object.keys(map).forEach(k=>{ const el=document.getElementById(map[k]); if(el) el.value=p[k]||''; });
  const fileInput=document.getElementById('editAvatarFile'); if(fileInput) fileInput.value='';
  document.getElementById('profileModal').classList.remove('hidden');
}
// pfps — file upload → data URL → avatar field
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id==='editAvatarFile'){
    const file=e.target.files[0]; if(!file) return;
    if(file.size> 1.5*1024*1024) return alert('Image too large — max 1.5MB');
    if(!file.type.startsWith('image/')) return alert('Use an image file');
    const reader=new FileReader();
    reader.onload=()=>{ const url=reader.result; const input=document.getElementById('editAvatar'); if(input) input.value=url; };
    reader.readAsDataURL(file);
  }
});
function closeProfileEdit(){ document.getElementById('profileModal').classList.add('hidden'); }
function saveProfile(){
  const rawName=document.getElementById('editDisplayName').value.trim();
  const displayName = rawName || defaultProfile().displayName;
  if(displayName.length<2) return alert('Username too short');
  if(isUsernameTaken(displayName, state.user ? state.user.email : null)) return alert('Username taken — only one per name');
  const p={
    displayName: displayName,
    bio: document.getElementById('editBio').value.trim().slice(0,120) || 'No bio yet — make it vibey.',
    avatar: document.getElementById('editAvatar').value.trim(),
    banner: document.getElementById('editBanner').value,
    accent: document.getElementById('editAccent').value
  };
  // persist displayName uniqueness: also update state.user.name for header/chat
  if(state.user && !state.user.guest){
    state.user.name = displayName;
    localStorage.setItem('uzi_user', JSON.stringify(state.user));
  }
  persistProfile(p); currentProfile=p; renderProfile(); updateAuthUI(); closeProfileEdit();
}
function applyPreset(preset){
  const map={uzi:'#ff2e93', eternal:'#06b6d4', rage:'#ff2e93', void:'#a855f7', neon:'#ff2e93'};
  currentProfile.banner=preset; currentProfile.accent=map[preset]||'#ff2e93';
  persistProfile(currentProfile); renderProfile();
  // also update banner live if on profile
  const bannerEl=document.getElementById('profileBanner'); if(bannerEl) bannerEl.style.background=bannerMap[preset];
}
function copyUsername(){
  const h=loadProfile().displayName;
  navigator.clipboard.writeText(h).then(()=>{ const el=document.getElementById('profileName'); if(el){ const old=el.textContent; el.textContent='Copied!'; setTimeout(()=>el.textContent=loadProfile().displayName, 1200); }});
}
function copyHandle(){ copyUsername(); }
// hook profile render into nav
const _origNavigate = navigate;
navigate = function(view){
  if(view==='profile'){ try{ renderProfile(); }catch(e){} }
  if(view==='shop'){ try{ renderShop(); }catch(e){} }
  if(view==='admin'){ try{ renderAdmin(); }catch(e){} }
  return _origNavigate(view);
};

// Playlists — guests allowed, localStorage per-account (guest@local works too)
function getPlaylistKey(){ return 'uzi_playlists_' + (state.user ? state.user.email : 'guest@local'); }
function loadPlaylists(){ try{ return JSON.parse(localStorage.getItem(getPlaylistKey())||'[]')}catch(e){return []} }
function savePlaylists(list){ localStorage.setItem(getPlaylistKey(), JSON.stringify(list)); }
let PLAYLISTS = loadPlaylists();
function renderPlaylists(){
  PLAYLISTS = loadPlaylists();
  const el=document.getElementById('playlistsList'); if(!el) return;
  if(PLAYLISTS.length===0) el.innerHTML=`<p class="text-[11px] text-white/30 py-2 text-center border border-dashed border-white/10 rounded-xl">No playlists — create one</p>`;
  else el.innerHTML=PLAYLISTS.map(pl=>`
    <div class="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#020208]/65 border border-white/[0.08] group">
      <span class="w-6 h-6 rounded-lg bg-gradient-to-br from-[#ff2e93]/40 to-[#a855f7]/40 grid place-items-center text-[10px]">♫</span>
      <div class="flex-1 min-w-0 cursor-pointer" onclick="openPlaylist('${pl.id}')"><p class="text-[12px] font-600 truncate">${pl.name}</p><p class="text-[10px] font-mono text-white/40">${pl.tracks.length} tracks</p></div>
      <button onclick="playPlaylist('${pl.id}')" class="w-6 h-6 rounded-full bg-white text-black grid place-items-center text-[9px]">▶</button>
      <button onclick="deletePlaylist('${pl.id}')" class="w-6 h-6 rounded-full hover:bg-white/10 grid place-items-center text-[10px] text-white/40">✕</button>
    </div>
  `).join('');
}
function createPlaylist(){
  const input=document.getElementById('newPlaylistName'); const name=(input?input.value.trim():'') || 'New Playlist';
  if(name.length<2) return;
  PLAYLISTS=loadPlaylists();
  const pl={id:'PL-'+Date.now(), name: name.slice(0,20), tracks:[], by: state.user?state.user.email:'guest@local'};
  PLAYLISTS.push(pl); savePlaylists(PLAYLISTS); if(input) input.value=''; renderPlaylists();
}
function deletePlaylist(id){
  PLAYLISTS=loadPlaylists().filter(p=>p.id!==id); savePlaylists(PLAYLISTS); renderPlaylists();
}
function addToPlaylistPrompt(trackId){
  PLAYLISTS=loadPlaylists();
  if(PLAYLISTS.length===0){
    const name=prompt('No playlists — name one to create:','My Vibe');
    if(!name) return;
    const pl={id:'PL-'+Date.now(), name:name.slice(0,20), tracks:[trackId], by: state.user?state.user.email:'guest@local'};
    PLAYLISTS.push(pl); savePlaylists(PLAYLISTS); renderPlaylists(); alert('Added to '+name);
    return;
  }
  const names=PLAYLISTS.map((p,i)=>`${i+1}. ${p.name} (${p.tracks.length})`).join('\n');
  const choice=prompt('Add to which playlist? Enter number:\n'+names);
  const idx=parseInt(choice)-1;
  if(isNaN(idx) || !PLAYLISTS[idx]) return;
  if(PLAYLISTS[idx].tracks.includes(trackId)) return alert('Already in that playlist');
  PLAYLISTS[idx].tracks.push(trackId); savePlaylists(PLAYLISTS); renderPlaylists(); alert('Added to '+PLAYLISTS[idx].name);
}
function openPlaylist(id){
  PLAYLISTS=loadPlaylists();
  const pl=PLAYLISTS.find(p=>p.id===id); if(!pl) return;
  const tracks=pl.tracks.map(tid=>TRACKS.find(t=>t.id===tid)).filter(Boolean);
  const html=tracks.length ? tracks.map(t=>renderRow(t)).join('') : `<p class="text-sm text-white/40 py-6 text-center">Empty playlist</p>`;
  document.getElementById('vaultGrid').innerHTML = `<div class="col-span-full mb-4 flex items-center justify-between"><h3 class="font-display font-700 text-[18px]">♫ ${pl.name}</h3><button onclick="playPlaylist('${pl.id}')" class="h-8 px-4 rounded-full bg-white text-black text-[12px] font-700">Play all</button></div>` + html;
  navigate('vault');
}
function playPlaylist(id){
  PLAYLISTS=loadPlaylists();
  const pl=PLAYLISTS.find(p=>p.id===id); if(!pl || pl.tracks.length===0) return;
  state.queue=[...pl.tracks]; renderRadioQueue(); renderQueueDrawer(); playTrack(pl.tracks[0]);
}
const _origUpdateAuthUI2 = updateAuthUI;
updateAuthUI = function(){
  _origUpdateAuthUI2();
  PLAYLISTS=loadPlaylists(); renderPlaylists();
  try{ renderShop(); }catch(e){}
  // ensure chat placeholder reflects guest status
  const ci=document.getElementById('chatInput'); if(ci) ci.placeholder = state.user && !state.user.guest ? 'Send a message — be respectful' : 'Send as Guest — be respectful (guest OK)';
};

// --- Shop PFPS ---
const SHOP_PREMADE = [
  {id:'pfp1', name:'Neon Uzi', img:'https://picsum.photos/200/200?random=101', price:0},
  {id:'pfp2', name:'Eternal Ice', img:'https://picsum.photos/200/200?random=102', price:50},
  {id:'pfp3', name:'Rage Red', img:'https://picsum.photos/200/200?random=103', price:100},
  {id:'pfp4', name:'Void Black', img:'https://picsum.photos/200/200?random=104', price:75},
  {id:'pfp5', name:'Pink Tape', img:'https://picsum.photos/200/200?random=105', price:120},
  {id:'pfp6', name:'Space Cow', img:'https://picsum.photos/200/200?random=106', price:60},
  {id:'pfp7', name:'Galaxy', img:'https://picsum.photos/200/200?random=107', price:90},
  {id:'pfp8', name:'Juice WRLD', img:'https://picsum.photos/200/200?random=108', price:150},
];
function shopKey(){ return 'vault_shop_'+(state.user ? state.user.email : 'guest'); }
function shopAdminKey(){ return 'vault_shop_admin'; }
function loadShopCustom(){ try{ return JSON.parse(localStorage.getItem(shopAdminKey())||'[]'); }catch(e){ return []; } }
function saveShopCustom(list){ localStorage.setItem(shopAdminKey(), JSON.stringify(list)); }
function loadShopOwned(){ try{ return JSON.parse(localStorage.getItem(shopKey())||'[]'); }catch(e){ return []; } }
function getCoins(){ try{ return parseInt(localStorage.getItem('vault_coins_'+(state.user?state.user.email:'guest'))||'200'); }catch(e){ return 200; } }
function setCoins(v){ localStorage.setItem('vault_coins_'+(state.user?state.user.email:'guest'), String(v)); }
function shopAddCoins(n){ setCoins(getCoins()+n); renderShop(); }
function adminAddShopPfp(){
  if(!isOwner()) return showAdminMsg('Owner only', true);
  var file=document.getElementById('shopUpload')?.files[0];
  var price=parseInt(document.getElementById('shopPrice')?.value||'100');
  if(!file) return showAdminMsg('Pick an image', true);
  var r=new FileReader(); r.onload=function(){
    var list=loadShopCustom(); list.push({id:'shop'+Date.now(), name:file.name.replace(/\.[^/.]+$/,''), img:r.result, price:price});
    saveShopCustom(list); renderShopAdmin(); renderShop(); showAdminMsg('PFP added to shop');
  }; r.readAsDataURL(file);
}
function shopBuy(id){
  var all=[...SHOP_PREMADE, ...loadShopCustom()];
  var item=all.find(x=>x.id===id); if(!item) return;
  var owned=loadShopOwned(); if(owned.includes(id)) return shopEquip(id);
  var coins=getCoins(); if(coins < item.price) return alert('Not enough coins ('+coins+' < '+item.price+')');
  setCoins(coins-item.price); owned.push(id); localStorage.setItem(shopKey(), JSON.stringify(owned)); renderShop(); alert('Bought '+item.name);
}
function shopEquip(id){
  var all=[...SHOP_PREMADE, ...loadShopCustom()];
  var item=all.find(x=>x.id===id); if(!item) return;
  // equip as avatar
  var p=loadProfile(); p.avatar=item.img; persistProfile(p); renderProfile(); updateAuthUI(); alert('Equipped '+item.name);
}
function renderShop(){
  var grid=document.getElementById('shopGrid'); if(grid){
    var all=[...SHOP_PREMADE, ...loadShopCustom()];
    var owned=loadShopOwned();
    grid.innerHTML=all.map(it=>'<div class="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><img src="'+it.img+'" class="w-20 h-20 rounded-xl object-cover mx-auto"><p class="text-xs font-bold mt-2 truncate">'+escapeHtml(it.name)+'</p><p class="text-[11px] opacity-50">'+it.price+' coins</p>'+(owned.includes(it.id) ? '<button onclick="shopEquip(\''+it.id+'\')" class="mt-2 w-full h-7 rounded-full bg-white text-black text-xs font-bold">Equip</button><button onclick="shopBuy(\''+it.id+'\')" class="mt-1 w-full h-7 rounded-full bg-white/10 text-xs">Owned</button>' : '<button onclick="shopBuy(\''+it.id+'\')" class="mt-2 w-full h-7 rounded-full bg-[#ff2e93] text-white text-xs font-bold">Buy</button>')+'</div>').join('');
  }
  var ownedEl=document.getElementById('shopOwned'); if(ownedEl){
    var owned=loadShopOwned(); var all=[...SHOP_PREMADE, ...loadShopCustom()];
    var items=all.filter(x=> owned.includes(x.id));
    if(!items.length) ownedEl.innerHTML='<p class="text-xs opacity-40 col-span-4 text-center py-4">No PFPS owned yet — buy one above</p>';
    else ownedEl.innerHTML=items.map(it=>'<div class="rounded-xl border border-white/10 bg-white/5 p-2 text-center"><img src="'+it.img+'" class="w-16 h-16 rounded-xl object-cover mx-auto"><p class="text-xs font-bold mt-1 truncate">'+escapeHtml(it.name)+'</p><button onclick="shopEquip(\''+it.id+'\')" class="mt-1 w-full h-6 rounded-full bg-white text-black text-[11px]">Equip</button></div>').join('');
  }
  var coinsEl=document.getElementById('shopCoins'); if(coinsEl) coinsEl.textContent=getCoins();
  renderShopAdmin();
}
function renderShopAdmin(){
  var list=document.getElementById('shopAdminList'); if(list){
    var custom=loadShopCustom();
    if(!custom.length) list.innerHTML='<p class="text-xs opacity-40 py-2">No custom PFPS — upload above</p>';
    else list.innerHTML=custom.map(it=>'<div class="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/5"><img src="'+it.img+'" class="w-10 h-10 rounded-lg object-cover"><div class="flex-1 min-w-0"><p class="text-xs font-bold truncate">'+escapeHtml(it.name)+'</p><p class="text-[11px] opacity-40">'+it.price+' coins</p></div><button onclick="shopDelete(\''+it.id+'\')" class="w-7 h-7 rounded-full bg-red-500/20 text-red-300 text-xs">✕</button></div>').join('');
  }
  var prem=document.getElementById('shopPremadeAdmin'); if(prem){
    prem.innerHTML=SHOP_PREMADE.map(it=>'<div class="rounded-xl border border-white/10 bg-white/5 p-2 text-center"><img src="'+it.img+'" class="w-12 h-12 rounded-xl object-cover mx-auto"><p class="text-[11px] font-bold truncate mt-1">'+escapeHtml(it.name)+'</p><p class="text-[10px] opacity-40">'+it.price+'c</p></div>').join('');
  }
}
function shopDelete(id){
  if(!isOwner()) return;
  var list=loadShopCustom().filter(x=>x.id!==id); saveShopCustom(list); renderShopAdmin(); renderShop();
}

// Home dynamic stars — twinkle + move
function initHomeStars(){
  const container=document.getElementById('homeStars'); if(!container) return;
  container.innerHTML='';
  for(let i=0;i<44;i++){
    const s=document.createElement('span');
    s.className='home-star';
    s.style.left=(Math.random()*100)+'%';
    s.style.top=(Math.random()*100)+'%';
    s.style.setProperty('--d', (1.6+Math.random()*2.8).toFixed(1)+'s');
    s.style.setProperty('--m', (7+Math.random()*10).toFixed(1)+'s');
    s.style.animationDelay=(Math.random()*4).toFixed(2)+'s, '+(Math.random()*5).toFixed(2)+'s';
    s.style.opacity=(0.3+Math.random()*0.7).toFixed(2);
    s.style.width=(1.2+Math.random()*1.6).toFixed(1)+'px';
    s.style.height=s.style.width;
    container.appendChild(s);
  }
}
initHomeStars();



// init — apply artist (Uzi vs Juice) before first render
try{ applyArtistUI(); }catch(e){ console.error('applyArtistUI failed', e); }
// init
try{ const lc=document.getElementById('likedCount'); if(lc) lc.textContent=state.liked.length; }catch(e){}
try{ renderLatest(); }catch(e){ console.error(e); }
try{ renderVault(); }catch(e){ console.error(e); }
try{ renderAlbums(); }catch(e){ console.error(e); }
try{ renderCharts(); }catch(e){ console.error(e); }
try{ renderRadioQueue(); }catch(e){ console.error(e); }
try{ updateVaultStats(); }catch(e){ console.error(e); }
try{ updateAuthUI(); }catch(e){ console.error(e); }
try{ renderProfile(); }catch(e){ console.error(e); }
try{ renderAnnouncement(); }catch(e){ console.error(e); }
try{ renderHistory(); }catch(e){ console.error(e); }
if(!state.user) setTimeout(()=>{ try{ openAuth('guest'); }catch(e){} }, 600);
var _ss=document.getElementById('sortSelect'); if(_ss) _ss.addEventListener('change', function(e){ state.sort=e.target.value; renderVault(); });
var _es=document.getElementById('eraSelect'); if(_es) _es.addEventListener('change', function(e){ state.era=e.target.value; renderVault(); });
document.addEventListener('keydown', e=>{
  if(e.code==='Space' && e.target.tagName!=='INPUT'){ e.preventDefault(); togglePlay(); }
});
// fallback: nav clicks always work even if inline handler blocked by overlay
document.addEventListener('click', e=>{
  const navEl=e.target.closest('.nav-link[data-nav]');
  if(navEl && navEl.dataset.nav){
    e.preventDefault();
    const v=navEl.dataset.nav;
    if(v==='admin') openAdmin(); else navigate(v);
    return;
  }
  // sidebar vault/charts/profile links that also use navigate
  const sb=e.target.closest('.sidebar-link');
  if(sb){
    const oc=sb.getAttribute('onclick')||'';
    const m=oc.match(/navigate\('([^']+)'\)/);
    if(m){ e.preventDefault(); navigate(m[1]); return; }
    if(oc.includes('filterLiked')){ e.preventDefault(); filterLiked(); return; }
    if(oc.includes('showQueue')){ e.preventDefault(); showQueue(); return; }
  }
});