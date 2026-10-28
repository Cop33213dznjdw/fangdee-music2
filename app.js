const STORAGE = { key: 'fangdee.youtubeApiKey', liked: 'fangdee.likedTracks' };
const demoTracks = [
  { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
  { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', thumbnail: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg' },
  { id: 'fRh_vgS2dFE', title: 'Sorry', artist: 'Justin Bieber', thumbnail: 'https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg' }
];
const state = { apiKey: localStorage.getItem(STORAGE.key) || '', liked: readLiked(), current: null, repeat: false, player: null, playerReady: false, pendingTrack: null, toastTimer: null, searchResults: [] };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function readLiked() {
  try { return JSON.parse(localStorage.getItem(STORAGE.liked) || '[]'); }
  catch { return []; }
}
function saveLiked() { localStorage.setItem(STORAGE.liked, JSON.stringify(state.liked)); }
function esc(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function isLiked(id) { return state.liked.some(track => track.id === id); }
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function setView(name) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
  $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  if (name === 'liked') renderLiked();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderSuggestions() {
  $('#suggestion-grid').innerHTML = demoTracks.map(track => trackCard(track)).join('');
}
function trackCard(track) {
  const liked = isLiked(track.id);
  return `<article class="track-card" data-track="${esc(track.id)}" tabindex="0" role="button" aria-label="เล่น ${esc(track.title)}">
    <div class="cover-wrap"><img src="${esc(track.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(track.id)}/hqdefault.jpg`)}" alt="ภาพปก ${esc(track.title)}" loading="lazy"><span class="cover-gradient"></span><button class="card-heart ${liked ? 'liked' : ''}" data-like="${esc(track.id)}" aria-label="${liked ? 'นำออกจาก' : 'เพิ่มใน'}เพลงที่ชอบ">${liked ? '♥' : '♡'}</button><span class="cover-play">▶</span></div>
    <h3>${esc(track.title)}</h3><p>${esc(track.artist || track.channelTitle || 'YouTube')}</p>
  </article>`;
}
function trackRow(track) {
  const liked = isLiked(track.id);
  return `<div class="track-row" data-row="${esc(track.id)}"><img class="row-cover" src="${esc(track.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(track.id)}/mqdefault.jpg`)}" alt="" loading="lazy"><button class="row-play" data-play="${esc(track.id)}" aria-label="เล่น ${esc(track.title)}">▶</button><div class="row-info"><h3>${esc(track.title)}</h3><p>${esc(track.artist || track.channelTitle || 'YouTube')}</p></div><span class="row-source">YOUTUBE</span><button class="row-like ${liked ? 'liked' : ''}" data-like="${esc(track.id)}" aria-label="${liked ? 'นำออกจาก' : 'เพิ่มใน'}เพลงที่ชอบ">${liked ? '♥' : '♡'}</button></div>`;
}
function updateLikedCount() {
  const count = state.liked.length;
  $('#liked-count').textContent = `${count} เพลงในลิสต์`;
  $('#play-liked').disabled = count === 0;
  $('#liked-empty').style.display = count ? 'none' : 'block';
}
function renderLiked() {
  $('#liked-results').innerHTML = state.liked.map(trackRow).join('');
  updateLikedCount();
}
function toggleLike(track) {
  if (!track?.id) return;
  if (isLiked(track.id)) {
    state.liked = state.liked.filter(item => item.id !== track.id);
    toast('นำเพลงออกจากเพลงที่ชอบแล้ว');
  } else {
    state.liked.unshift(track);
    toast('เพิ่มเพลงในเพลงที่ชอบแล้ว');
  }
  saveLiked(); renderSuggestions(); renderLiked(); renderSearchResults(); updateCurrentLike();
}
function getTrackById(id) {
  return [...demoTracks, ...state.searchResults, ...state.liked].find(track => track.id === id) || state.current;
}
function updateCurrentLike() {
  const button = $('#now-like');
  const liked = state.current && isLiked(state.current.id);
  button.disabled = !state.current;
  button.classList.toggle('liked', !!liked);
  button.textContent = liked ? '♥' : '♡';
  button.setAttribute('aria-label', liked ? 'นำเพลงออกจากเพลงที่ชอบ' : 'เพิ่มเพลงในเพลงที่ชอบ');
}
function loadYouTubeAPI() {
  if (window.YT?.Player) { createPlayer(); return; }
  if ($('#yt-api-script')) return;
  const script = document.createElement('script'); script.id = 'yt-api-script'; script.src = 'https://www.youtube.com/iframe_api';
  document.head.append(script);
  window.onYouTubeIframeAPIReady = createPlayer;
}
function createPlayer() {
  if (state.player || !window.YT?.Player) return;
  state.player = new YT.Player('youtube-player', {
    width: '100%', height: '100%', videoId: state.pendingTrack?.id || undefined,
    playerVars: { playsinline: 1, controls: 1, rel: 0, modestbranding: 1, origin: location.origin },
    events: {
      onReady: () => { state.playerReady = true; if (state.pendingTrack) playTrack(state.pendingTrack); },
      onStateChange: event => { if (event.data === YT.PlayerState.ENDED && state.repeat && state.current) { state.player.seekTo(0, true); state.player.playVideo(); } },
      onAutoplayBlocked: () => toast('แตะปุ่มเล่นใน YouTube player เพื่อเริ่มเพลง'),
      onError: event => toast(event.data === 101 || event.data === 150 ? 'วิดีโอนี้ไม่อนุญาตให้ฝัง ลองเลือกเพลงอื่น' : 'เล่นวิดีโอไม่ได้ ลองใหม่อีกครั้ง')
    }
  });
}
function playTrack(track) {
  if (!track?.id) return;
  state.current = track; state.pendingTrack = track;
  $('#now-title').textContent = track.title || 'เพลงจาก YouTube';
  $('#now-artist').textContent = track.artist || track.channelTitle || 'YouTube';
  $('#similar-button').disabled = false;
  $('#player-placeholder').style.display = 'none';
  $('#youtube-link').href = `https://music.youtube.com/watch?v=${encodeURIComponent(track.id)}`;
  updateCurrentLike();
  loadYouTubeAPI();
  if (state.playerReady) {
    try { state.player.loadVideoById(track.id); }
    catch { state.pendingTrack = track; }
  }
  if (!$('#view-home').classList.contains('active')) setView('home');
}
async function searchYouTube(query, { related = false } = {}) {
  const normalized = query.trim();
  if (!normalized) return;
  if (!state.apiKey) {
    $('#search-status').innerHTML = 'ต้องเพิ่ม YouTube API key ก่อนค้นหาเพลง <button class="text-button" id="search-settings">ตั้งค่าตอนนี้ →</button>';
    $('#search-results').innerHTML = '';
    $('#search-settings')?.addEventListener('click', openSettings);
    if (related) toast('ตั้งค่า YouTube API key ก่อนสุ่มเพลงใกล้เคียง');
    else openSettings();
    return;
  }
  setView('search');
  $('#search-status').textContent = related ? `กำลังหาเพลงที่ใกล้เคียงกับ “${normalized}”...` : `กำลังค้นหา “${normalized}”...`;
  $('#search-results').innerHTML = '';
  try {
    const params = new URLSearchParams({ part: 'snippet', type: 'video', videoCategoryId: '10', maxResults: '20', q: normalized, key: state.apiKey });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'YouTube API error');
    let tracks = (data.items || []).map(item => ({
      id: item.id?.videoId,
      title: item.snippet?.title || 'Untitled',
      artist: item.snippet?.channelTitle || 'YouTube',
      channelTitle: item.snippet?.channelTitle || 'YouTube',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ''
    })).filter(track => track.id);
    if (related && state.current) tracks = tracks.filter(track => track.id !== state.current.id);
    state.searchResults = tracks;
    if (related && tracks.length) {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      playTrack(randomTrack);
      toast(`สุ่มได้ “${randomTrack.title}”`);
      return;
    }
    renderSearchResults();
    $('#search-status').textContent = tracks.length ? `พบ ${tracks.length} เพลงที่ตรงกับ “${normalized}”` : `ไม่พบเพลงที่ตรงกับ “${normalized}”`;
  } catch (error) {
    const msg = error.message || 'เกิดข้อผิดพลาด';
    $('#search-status').textContent = /quota|key|API key|referer|API has not been used/i.test(msg) ? 'ตรวจสอบ API key และโควตา YouTube Data API ใน Google Cloud Console' : `ค้นหาไม่สำเร็จ: ${msg}`;
    $('#search-results').innerHTML = '';
  }
}
function renderSearchResults() {
  $('#search-results').innerHTML = state.searchResults.map(trackRow).join('') || '<div class="empty-search"><strong>ยังไม่มีผลการค้นหา</strong>ลองพิมพ์ชื่อเพลงหรือศิลปินที่ต้องการ</div>';
}
function openSettings() {
  $('#api-key-input').value = state.apiKey;
  $('#settings-dialog').showModal();
}
function updateApiStatus() {
  const button = $('#api-status');
  button.classList.toggle('connected', !!state.apiKey);
  button.querySelector('span:last-child').textContent = state.apiKey ? 'API พร้อมใช้' : 'ตั้งค่า API';
}
function startSearch(value) {
  const query = value.trim();
  if (!query) return;
  $('#search-input').value = query; $('#large-search-input').value = query;
  searchYouTube(query);
}

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { setView(viewButton.dataset.view); return; }
  const likeButton = event.target.closest('[data-like]');
  if (likeButton) { event.stopPropagation(); const track = getTrackById(likeButton.dataset.like); if (track) toggleLike(track); return; }
  const playButton = event.target.closest('[data-play]');
  if (playButton) { const track = getTrackById(playButton.dataset.play); if (track) playTrack(track); return; }
  const card = event.target.closest('[data-track]');
  if (card) { const track = getTrackById(card.dataset.track); if (track) playTrack(track); }
});
document.addEventListener('keydown', event => {
  const card = event.target.closest?.('[data-track]');
  if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); playTrack(getTrackById(card.dataset.track)); }
});
$('#search-form').addEventListener('submit', event => { event.preventDefault(); startSearch($('#search-input').value); });
$('#search-form-large').addEventListener('submit', event => { event.preventDefault(); startSearch($('#large-search-input').value); });
$('#search-input').addEventListener('focus', () => { if (!$('#view-search').classList.contains('active')) setView('search'); });
$('#open-settings').addEventListener('click', openSettings);
$('#footer-settings').addEventListener('click', openSettings);
$('#api-status').addEventListener('click', openSettings);
$('#save-key').addEventListener('click', () => {
  state.apiKey = $('#api-key-input').value.trim();
  if (state.apiKey) localStorage.setItem(STORAGE.key, state.apiKey); else localStorage.removeItem(STORAGE.key);
  updateApiStatus(); $('#settings-dialog').close(); toast(state.apiKey ? 'บันทึก API key แล้ว' : 'ลบ API key แล้ว');
});
$('#clear-key').addEventListener('click', () => { $('#api-key-input').value = ''; state.apiKey = ''; localStorage.removeItem(STORAGE.key); updateApiStatus(); $('#settings-dialog').close(); toast('ลบ API key แล้ว'); });
$('#toggle-key').addEventListener('click', event => { const input = $('#api-key-input'); input.type = input.type === 'password' ? 'text' : 'password'; event.currentTarget.textContent = input.type === 'password' ? 'แสดง' : 'ซ่อน'; });
$('#now-like').addEventListener('click', () => state.current && toggleLike(state.current));
$('#repeat-button').addEventListener('click', () => { state.repeat = !state.repeat; $('#repeat-button').classList.toggle('enabled', state.repeat); $('#repeat-button').setAttribute('aria-pressed', String(state.repeat)); toast(state.repeat ? 'เปิดเล่นวนเพลงเดิมแล้ว' : 'ปิดเล่นวนแล้ว'); });
$('#similar-button').addEventListener('click', () => state.current ? searchYouTube(`${state.current.title} ${state.current.artist} similar music`, { related: true }) : toast('เลือกเพลงก่อน เพื่อหาเพลงใกล้เคียง'));
$('#hero-similar').addEventListener('click', () => state.current ? searchYouTube(`${state.current.title} ${state.current.artist} similar music`, { related: true }) : (setView('search'), toast('ค้นหาเพลงที่ชอบก่อน แล้วค่อยสุ่มเพลงใกล้เคียง')));
$('#play-liked').addEventListener('click', () => state.liked[0] && playTrack(state.liked[0]));

renderSuggestions(); renderLiked(); updateApiStatus();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
