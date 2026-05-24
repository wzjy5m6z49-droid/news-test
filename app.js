const NEW_DAYS = 3;

const app = document.getElementById('newsV2');

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

function render(items) {
  app.innerHTML = '';

  items.forEach((item, index) => {
    const date = item.publicationDate || item.created;
    const important = item.important === true;
    const newItem = isNew(date);

    const a = document.createElement('a');
    a.className = `item ${important ? 'importantItem' : ''}`;
    a.href = item.sourceUrl || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
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

    app.appendChild(a);
  });
}

try {
  const items = window.newsV2Data || [];
  render(items);
} catch (err) {
  console.error('[NewsV2] load error', err);
  app.innerHTML = '<div class="error">ニュースを読み込めませんでした</div>';
}
