const NEWS_DATA_URL =
  'https://digitalgojp.sharepoint.com/sites/NTA_IBHub12/SiteAssets/news/news-data.js';

const NEW_DAYS = 3;
const REFRESH_INTERVAL = 5000;

const AUTO_SCROLL_SPEED = 0.35;
const AUTO_SCROLL_INTERVAL = 16;

const app = document.getElementById('newsV2');

let currentKeys = new Set();
let isRefreshing = false;
let autoScrollTimer = null;
let autoScrollDirection = 1;

function formatDate(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function diffDays(value) {
  if (!value) return 999999;
  return (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24);
}

function isNew(value) {
  return diffDays(value) <= NEW_DAYS;
}

function getNewOpacity(value) {
  const diff = diffDays(value);
  if (diff <= 0) return 1;
  if (diff >= NEW_DAYS) return 0.35;

  const ratio = 1 - diff / NEW_DAYS;
  return 0.35 + ratio * 0.65;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getItemKey(item) {
  return item.sourceUrl || `${item.title}_${item.publicationDate}`;
}

function createItemElement(item, index) {
  const date = item.publicationDate || item.created;
  const important = item.important === true;
  const newItem = isNew(date);

  const a = document.createElement('a');
  a.className = `item ${important ? 'importantItem' : ''}`;
  a.href = item.sourceUrl || '#';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.dataset.key = getItemKey(item);
  a.style.animationDelay = `${index * 0.06}s`;

  a.innerHTML = `
    ${important ? '<span class="importantBar"></span>' : ''}

    <div class="topRow">
      <span class="date">${formatDate(date)}</span>
      ${item.department ? `<span class="department">${escapeHtml(item.department)}</span>` : ''}
      ${important ? '<span class="important">重要</span>' : ''}
      ${
        newItem
          ? `<span class="newBadge" style="opacity:${getNewOpacity(date)}">NEW</span>`
          : ''
      }
    </div>

    <div class="title">${escapeHtml(item.title)}</div>
    <div class="hoverLine"></div>
  `;

  return a;
}

function render(items) {
  if (!Array.isArray(items)) return;

  app.innerHTML = '';
  currentKeys = new Set();

  items.forEach((item, index) => {
    currentKeys.add(getItemKey(item));
    app.appendChild(createItemElement(item, index));
  });

  startAutoScroll();
}

function updateDiff(items) {
  if (!Array.isArray(items)) return;
  if (items.length === 0 && currentKeys.size > 0) return;

  const nextKeys = new Set(items.map(getItemKey));

  Array.from(app.querySelectorAll('.item')).forEach((el) => {
    const key = el.dataset.key;
    if (!nextKeys.has(key)) {
      el.remove();
    }
  });

  items.forEach((item, index) => {
    const key = getItemKey(item);
    const existing = app.querySelector(`.item[data-key="${CSS.escape(key)}"]`);

    if (!existing) {
      const el = createItemElement(item, index);
      app.insertBefore(el, app.children[index] || null);
    }
  });

  currentKeys = nextKeys;
}

function loadNewsData() {
  return new Promise((resolve, reject) => {
    const oldScript = document.getElementById('newsDataScript');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'newsDataScript';
    script.src = `${NEWS_DATA_URL}?v=${Date.now()}`;

    script.onload = () => {
      setTimeout(() => {
        resolve(window.newsV2Data || []);
      }, 50);
    };

    script.onerror = () => {
      reject(new Error('news-data.js load failed'));
    };

    document.body.appendChild(script);
  });
}

async function refreshNews() {
  if (isRefreshing) return;

  isRefreshing = true;

  try {
    const items = await loadNewsData();

    if (!Array.isArray(items)) return;
    if (items.length === 0 && currentKeys.size > 0) return;

    updateDiff(items);
  } catch (err) {
    console.error('[NewsV2] refresh error', err);
  } finally {
    isRefreshing = false;
  }
}

function startAutoScroll() {
  if (!app) return;
  if (autoScrollTimer) return;

  autoScrollTimer = setInterval(() => {
    const maxScrollTop = app.scrollHeight - app.clientHeight;

    if (maxScrollTop <= 0) return;

    if (app.scrollTop >= maxScrollTop) {
      autoScrollDirection = -1;
    }

    if (app.scrollTop <= 0) {
      autoScrollDirection = 1;
    }

    app.scrollTop += autoScrollDirection * AUTO_SCROLL_SPEED;
  }, AUTO_SCROLL_INTERVAL);
}

try {
  const items = window.newsV2Data || [];
  render(items);

  setInterval(refreshNews, REFRESH_INTERVAL);
} catch (err) {
  console.error('[NewsV2] load error', err);
  app.innerHTML = '<div class="error">ニュースを読み込めませんでした</div>';
}
