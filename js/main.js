/* =========================================================
 *  하이론 Official Page · Purple Theme
 *  - Nav: 스크롤 감지, 활성 섹션 강조, 모바일 토글
 *  - Feeds: YouTube(공식 RSS) / IG · TikTok(RSSHub)
 *    ※ IG/TikTok 자동 반영은 공용 인스턴스가 차단되면 실패할 수 있음.
 *      그 경우 "바로가기" 버튼으로 자연스럽게 대체됨.
 * ========================================================= */

const CFG = {
  ytChannelId: 'UCKaOOqrNTBu2R3IXTytSmlw',
  igUser: '_hi_ron',
  ttUser: '_hi_ron',

  // ★ RSS.app으로 생성한 피드 URL (여기만 바꾸면 IG/TikTok 자동 갱신됨)
  igRssUrl: 'https://rss.app/feeds/p8CTG1jfNagXzbZ0.xml',
  ttRssUrl: 'https://rss.app/feeds/JAjYlz5tbk87PLQk.xml',

  // RSSHub 백업 (RSS.app URL이 비어있을 때만 사용)
  rsshubHosts: [
    'https://rsshub.app',
    'https://rss.shab.fun',
    'https://rsshub.rssforever.com',
  ],
};

const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const fmtDate = (iso) => {
  try{const d=new Date(iso);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;}catch{return ''}
};
const escHTML = (s='') => s.replace(/[&<>"']/g,(c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* =============== FIXED NAV =============== */
(function initNav(){
  const nav   = $('#nav');
  const links = $$('.nav__menu a');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 20);
    const pos = window.scrollY + 80;
    let current = 'top';
    $$('section[id], header[id]').forEach(sec => {
      if (sec.offsetTop <= pos) current = sec.id;
    });
    links.forEach(a => {
      const active = a.dataset.target === current;
      a.classList.toggle('is-active', active);
      // 활성 항목이 모바일 가로 스크롤 메뉴의 밖에 있으면 보이게
      if (active && window.innerWidth <= 900 && a.scrollIntoView){
        a.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

/* =============== GO TO TOP =============== */
(function initGoTop(){
  const btn = $('#gotop');
  if (!btn) return;
  const onScroll = () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top:0, behavior:'smooth' });
  });
  onScroll();
})();

/* =============== RSS FETCH =============== */
/** 여러 CORS 프록시를 순차 시도해 RSS/Atom 피드 파싱 */
async function fetchRSS(rssUrl, timeout = 18000) {
  // 1) 직접 XML 가져오기 → 2) CORS 프록시 체인
  const xmlEndpoints = [
    `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    `https://cors.eu.org/${rssUrl}`,
  ];
  for (const url of xmlEndpoints) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/xml,text/xml,*/*' } });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error('empty response');
      const parsed = parseRSSXML(text);
      if (parsed.length) return parsed;
      throw new Error('no items parsed');
    } catch (e) {
      console.warn('[fetchRSS fail]', url.split('?')[0], e.message);
    }
  }
  // 마지막 폴백: rss2json (쿼터 제한 있을 수 있음)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    if (data.status === 'ok' && data.items) return data.items;
  } catch (e) { console.warn('[rss2json]', e.message); }
  throw new Error('All RSS proxies failed');
}

function parseRSSXML(xmlStr){
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  // Atom (YouTube) and RSS 2.0 지원
  const atomEntries = [...doc.querySelectorAll('entry')];
  if (atomEntries.length){
    return atomEntries.map(e => ({
      title: e.querySelector('title')?.textContent || '',
      link:  e.querySelector('link')?.getAttribute('href') || '',
      pubDate: e.querySelector('published')?.textContent || '',
      guid:  e.querySelector('id')?.textContent || '',
      thumbnail: e.getElementsByTagNameNS('*','thumbnail')[0]?.getAttribute('url') || '',
      description: e.getElementsByTagNameNS('*','description')[0]?.textContent || '',
    }));
  }
  const rssItems = [...doc.querySelectorAll('item')];
  return rssItems.map(i => {
    // media:content 태그 찾기 (RSS.app Instagram에서 핵심 이미지 URL)
    const mediaContent = i.getElementsByTagNameNS('*','content')[0];
    const mediaThumb = mediaContent?.getAttribute('url') || '';
    const encThumb = i.querySelector('enclosure')?.getAttribute('url') || '';
    return {
      title: i.querySelector('title')?.textContent || '',
      link:  i.querySelector('link')?.textContent || '',
      pubDate: i.querySelector('pubDate')?.textContent || '',
      guid: i.querySelector('guid')?.textContent || '',
      description: i.querySelector('description')?.textContent || '',
      thumbnail: mediaThumb || encThumb || '',
    };
  });
}

/** Instagram CDN 이미지는 403 방지용으로 weserv.nl 프록시 경유 */
function proxyImage(url) {
  if (!url) return '';
  // cdninstagram / fbcdn / tiktokcdn 등 hotlink 차단 CDN은 프록시 경유
  if (/cdninstagram|fbcdn|tiktokcdn|akamaized|ibyteimg/.test(url)) {
    // weserv는 http/https 모두 지원, 프로토콜 프리픽스 제거해서 전달
    const clean = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&w=600&output=jpg`;
  }
  return url;
}

async function fetchFromRsshub(pathname){
  let lastErr;
  for (const host of CFG.rsshubHosts){
    try { const items = await fetchRSS(`${host}${pathname}`); if (items?.length) return items; }
    catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('RSSHub all failed');
}

/* =============== CARD & FALLBACK =============== */
function card({href, thumb, title, date, badge, play}){
  return `
    <a class="item" href="${href}" target="_blank" rel="noopener">
      ${thumb ? `<img src="${thumb}" alt="${escHTML(title||'')}" loading="lazy" onerror="this.style.display='none'">` : ''}
      ${play ? `<span class="item__play"></span>` : ''}
      ${badge ? `<span class="item__badge">${badge}</span>` : ''}
      ${title ? `<div class="item__overlay"><div class="item__title">${escHTML(title)}</div>${date?`<div class="item__date">${fmtDate(date)}</div>`:''}</div>` : ''}
    </a>`;
}
function fallback(grid, label, url){
  grid.innerHTML = `
    <div class="fallback">
      <p>최신 피드를 자동으로 불러오지 못했어요.<br>${label}에서 바로 확인해 주세요 :)</p>
      <a class="btn" href="${url}" target="_blank" rel="noopener">${label} 열기 →</a>
    </div>`;
}

/* =============== LOADERS =============== */
async function loadYouTube(){
  const grid = $('#ytGrid');
  try{
    const items = await fetchRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${CFG.ytChannelId}`);
    if (!items?.length) throw new Error('empty');
    grid.innerHTML = items.slice(0,6).map(it => {
      const vid = (it.link.match(/[?&]v=([^&]+)/)||[])[1] || it.guid?.replace('yt:video:','') || '';
      const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : (it.thumbnail || '');
      return card({ href: it.link, thumb, title: it.title, date: it.pubDate, play:true });
    }).join('');
  }catch(e){
    console.warn('[YT]', e);
    fallback(grid, 'YouTube', `https://www.youtube.com/@${CFG.igUser}`);
  }
}

async function loadInstagram(){
  const grid = $('#igGrid');
  try{
    const items = CFG.igRssUrl
      ? await fetchRSS(CFG.igRssUrl)
      : await fetchFromRsshub(`/instagram/user/${CFG.igUser}`);
    grid.innerHTML = items.slice(0,6).map(it => {
      const raw = it.thumbnail
        || (it.description && (it.description.match(/<img[^>]+src="([^"]+)"/)||[])[1])
        || '';
      const thumb = proxyImage(raw);
      return card({ href: it.link, thumb, title:(it.title||'').slice(0,120), date: it.pubDate });
    }).join('');
    if (!grid.children.length) throw new Error('empty');
  }catch(e){
    console.warn('[IG]', e);
    fallback(grid, 'Instagram', `https://www.instagram.com/${CFG.igUser}/`);
  }
}

async function loadTikTok(){
  const grid = $('#ttGrid');
  try{
    const items = CFG.ttRssUrl
      ? await fetchRSS(CFG.ttRssUrl)
      : await fetchFromRsshub(`/tiktok/user/@${CFG.ttUser}`);
    grid.innerHTML = items.slice(0,8).map(it => {
      const raw = it.thumbnail
        || (it.description && (it.description.match(/<img[^>]+src="([^"]+)"/)||[])[1])
        || '';
      const thumb = proxyImage(raw);
      return card({ href: it.link, thumb, title:(it.title||'').slice(0,80), date: it.pubDate, play:true });
    }).join('');
    if (!grid.children.length) throw new Error('empty');
  }catch(e){
    console.warn('[TT]', e);
    fallback(grid, 'TikTok', `https://www.tiktok.com/@${CFG.ttUser}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadYouTube();
  loadInstagram();
  loadTikTok();
});
