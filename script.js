const REPO = 'ilyaminineli/oleg_ustinov_official';
const BRANCH = 'main';
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

const archiveRoot = document.getElementById('works-archive');
const yearRow = document.getElementById('year-row');
const filterRow = document.getElementById('filter-row');
const status = document.getElementById('archive-status');
const conceptionList = document.getElementById('conception-list');
const seriesModal = document.getElementById('series-modal');
const seriesModalContent = document.getElementById('series-modal-content');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');

let artworks = [];
let conceptions = [];
let activeYear = 'all';
let activeTags = [];
let sortMode = 'year';

const titleTranslations = {
  'Серия Caustic Window': 'Caustic Window',
  'Серия IDM': 'IDM',
  'Серия графики': 'Graphics',
  'Серия Сошествие': 'Descent',
  'Серия работ в Сфере': 'Works in the Sphere',
  'Серия UUuUU': 'UUuUU',
  'Серия Silent Mode (плохое качество)': 'Silent Mode',
  'Дорожные происшествия (совместно с Иваном Горшковым)': 'Road Accidents',
  'Львиный Хребет': 'Lion’s Spine',
  'Львиный хребет 2020': 'Lion’s Spine',
  'Без названия': 'Untitled'
};

const mediaTranslations = [
  [/\bхолст\b/gi, 'canvas'],
  [/\bакрил\b/gi, 'acrylic'],
  [/\bспрей\b/gi, 'spray paint'],
  [/\bмаркер\b/gi, 'marker'],
  [/многократная печать/gi, 'multilayer printing'],
  [/\bсмешанная техника\b/gi, 'mixed media'],
  [/\bкартон\b/gi, 'cardboard'],
  [/\bмасло\b/gi, 'oil'],
  [/\bдсп\b/gi, 'hardboard'],
  [/\bфанера\b/gi, 'plywood'],
  [/\bбумага\b/gi, 'paper'],
  [/\bкарандаш\b/gi, 'pencil'],
  [/\bпастель\b/gi, 'pastel'],
  [/\bштукатурка\b/gi, 'plaster'],
  [/\bколлаж\b/gi, 'collage'],
  [/детал[ьи]/gi, 'details']
];

function safeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

function pathUrl(path) {
  return RAW_ROOT + path.split('/').map(encodeURIComponent).join('/');
}

function githubFileUrl(path) {
  return `https://github.com/${REPO}/blob/${BRANCH}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[“”"'’]/g, '')
    .replace(/[()\[\]{}]/g, ' ')
    .replace(/\bсерия\b|\bконцепция\b|\bconcept\b|\bconception\b|\(\+concept\)/gi, ' ')
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function englishText(text = '') {
  let out = String(text);
  mediaTranslations.forEach(([re, value]) => {
    out = out.replace(re, value);
  });
  return titleTranslations[out] || out;
}

function firstYear(text) {
  const match = String(text).match(/\b(?:19|20)\d{2}\b/);
  return match ? Number(match[0]) : 9999;
}

function displaySeries(series) {
  let value = englishText(series || 'Independent works');
  value = value
    .replace(/^Series\s+/i, '')
    .replace(/\s*\(\+concept\)/i, '')
    .replace(/\s*\(\+conception\)/i, '')
    .trim();
  return value || 'Independent works';
}

function matchSeriesMeta(series) {
  const normalized = normalize(series);
  return Object.entries(typeof SERIES_META === 'object' ? SERIES_META : {})
    .find(([key]) => normalize(key) === normalized)?.[1] || null;
}

function matchConcept(series) {
  const normalized = normalize(series || '');
  return conceptions.find(concept => normalize(concept.folder) === normalized) || null;
}

function cleanDetailParent(folderName) {
  let value = englishText(folderName)
    .replace(/\s*,?\s*details[_-]*\s*$/i, '')
    .replace(/\s+details?\s*$/i, '')
    .trim();

  const yearMatch = value.search(/\b(?:19|20)\d{2}\b/);
  if (yearMatch > 0) {
    value = value.slice(0, yearMatch).replace(/[,\s-]+$/, '').trim();
  }

  return value;
}

function parseArtwork(entry) {
  const parts = entry.path.split('/');
  const filename = parts[parts.length - 1];
  const basename = filename.replace(/\.[^.]+$/, '');
  const bits = basename.split(',').map(value => value.trim()).filter(Boolean);
  const yearIndex = bits.findIndex(value => /(?:19|20)\d{2}/.test(value));

  const rawYear = yearIndex >= 0 ? bits[yearIndex] : (parts[1] || '');
  const sortYear = firstYear(rawYear);
  const metadata = yearIndex >= 0 ? bits.slice(yearIndex + 1).join(', ') : '';

  const folderSeries = parts.length >= 4 ? parts[2] : '';
  const lower = `${basename} ${metadata} ${folderSeries}`.toLowerCase();

  const detail = /\bdetail\b|details|деталь|детали/i.test(lower);
  const installation = /installation view|interior view/i.test(lower);

  const tags = new Set();
  if (/mixed media|mixed technique|смешан/.test(lower)) tags.add('mixed-media');
  if (/\bprint\b|printing|многократная печать/.test(lower)) tags.add('print');
  if (/canvas|холст/.test(lower)) tags.add('canvas');
  if (/paper|бумаг|картон/.test(lower)) tags.add(/картон/.test(lower) ? 'cardboard' : 'paper');
  if (/hardboard|дсп/.test(lower)) tags.add('hardboard');
  if (/plywood|фанер/.test(lower)) tags.add('plywood');
  if (/banner/.test(lower)) tags.add('banner');
  if (/collage|коллаж/.test(lower)) tags.add('collage');
  if (/reflective film/.test(lower)) tags.add('reflective-film');
  if (/acrylic|oil|spray|aerosol|marker|latex|pastel|pencil|pen|ink|enamel|акрил|масло|спрей|маркер/.test(lower)) tags.add('painting');
  if (detail) tags.add('detail');
  if (installation) tags.add('installation');
  if (/in progress|плохое качество|unfinished|не закон/.test(lower)) tags.add('in-progress');

  const meta = matchSeriesMeta(folderSeries);
  if (meta?.tags) meta.tags.forEach(tag => tags.add(tag));

  const titleBits = yearIndex > 0 ? bits.slice(0, yearIndex).join(', ') : basename;
  const title = englishText(titleBits);

  const independentDetailParent = detail && !folderSeries
    ? ''
    : detail && /details?/i.test(folderSeries)
      ? cleanDetailParent(folderSeries)
      : '';

  const isRootWork = parts.length === 3;
  let series = englishText(folderSeries);

  let groupKey;
  if (isRootWork) {
    groupKey = `work:${sortYear}:${normalize(title)}`;
    series = '';
  } else if (independentDetailParent) {
    groupKey = `work:${sortYear}:${normalize(independentDetailParent)}`;
    series = '';
  } else {
    groupKey = `series:${sortYear}:${normalize(series || 'Independent works')}`;
  }

  return {
    path: entry.path,
    title,
    year: rawYear,
    sortYear,
    metadata: englishText(metadata),
    series,
    groupKey,
    tags: [...tags],
    detail,
    installation
  };
}

function renderFilters() {
  const years = [...new Set(
    artworks.map(work => String(work.sortYear)).filter(year => year !== '9999')
  )].sort((a, b) => Number(b) - Number(a));

  if (yearRow) {
    yearRow.innerHTML = [
      `<button class="tag ${activeYear === 'all' ? 'active' : ''}" data-year="all">#all</button>`,
      ...years.map(year =>
        `<button class="tag ${activeYear === year ? 'active' : ''}" data-year="${year}">#${year}</button>`
      )
    ].join('');
  }

  const metaTags = Object.values(typeof SERIES_META === 'object' ? SERIES_META : {})
    .flatMap(meta => meta.tags || []);

  const tags = [...new Set([
    ...artworks.flatMap(work => work.tags),
    ...metaTags
  ].filter(tag => !['detail', 'installation'].includes(tag)))].sort();

  if (filterRow) {
    filterRow.innerHTML = [
      ...tags.map(tag =>
        `<button class="tag ${activeTags.includes(tag) ? 'active' : ''}" data-tag="${safeHtml(tag)}">#${safeHtml(tag)}</button>`
      ),
      `<button class="tag clear-tags ${activeTags.length ? 'visible' : ''}" data-clear-tags>clear</button>`
    ].join('');
  }
}

function filteredArtworks() {
  return artworks.filter(work =>
    (activeYear === 'all' || String(work.sortYear) === activeYear) &&
    (activeTags.length === 0 || activeTags.every(tag => work.tags.includes(tag)))
  );
}

function sortWorks(list) {
  return [...list].sort((a, b) =>
    sortMode === 'medium'
      ? a.metadata.localeCompare(b.metadata) || a.title.localeCompare(b.title)
      : b.sortYear - a.sortYear || a.title.localeCompare(b.title)
  );
}

function seriesGroups() {
  const groups = new Map();

  sortWorks(filteredArtworks()).forEach(work => {
    const key = work.groupKey || `${work.sortYear}:${normalize(work.series || work.title)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        year: work.sortYear,
        series: work.series,
        title: '',
        works: []
      });
    }

    groups.get(key).works.push(work);
  });

  return [...groups.values()];
}

function renderArchive() {
  if (!archiveRoot) return;

  const groups = seriesGroups();
  const byYear = new Map();

  groups.forEach(group => {
    const year = group.year || 'Archive';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(group);
  });

  archiveRoot.innerHTML = [...byYear.entries()]
    .map(([year, items]) => `<section class="year-section"><div class="year-heading"><span class="year-big">${safeHtml(year)}</span><span>${items.length} entries</span></div><div class="series-grid">${items.map(group => {
      const main = group.works.find(work => !work.detail) || group.works[0];
      const info = matchSeriesMeta(group.series);
      const concept = matchConcept(group.series);
      const details = group.works.filter(work => work.detail).length;

      const tags = [...new Set([
        ...(info?.tags || []),
        ...group.works.flatMap(work => work.tags)
      ])].filter(tag => !['detail', 'installation'].includes(tag));

      if (!group.series) {
        return `<article class="series-card standalone-card" data-series-key="${safeHtml(group.key)}" data-image="${safeHtml(main.path)}">
          <div class="series-preview-grid single">
            <div class="series-preview-shot">
              <img src="${pathUrl(main.path)}" alt="${safeHtml(main.title)}" loading="lazy">
              ${details ? `<span class="preview-label">${details} detail${details === 1 ? '' : 's'}</span>` : ''}
            </div>
          </div>
          <div class="series-card-info standalone-card-info">
            <div class="series-card-top">
              <div>
                <p class="eyebrow">${safeHtml(main.year || year)}</p>
                <h2>${safeHtml(main.title)}</h2>
              </div>
            </div>
            <div class="series-tags">
              ${tags.slice(0, 10).map(tag => `<span class="tag static-tag">#${safeHtml(tag)}</span>`).join('')}
            </div>
            <div class="series-foot standalone-card-foot">
              <span>${safeHtml(main.metadata || '')}</span>
              <span>${details ? `${details} details ↗` : 'view ↗'}</span>
            </div>
          </div>
        </article>`;
      }

      const mains = group.works.filter(work => !work.detail && !work.installation);
      const preview = mains[0] || main;

      return `<article class="series-card" data-series-key="${safeHtml(group.key)}">
        <div class="series-preview-grid">
          ${group.works.filter(work => !work.installation).slice(0, 3).map(work =>
            `<div class="series-preview-shot ${work.detail ? 'detail-shot' : ''}">
              <img src="${pathUrl(work.path)}" alt="${safeHtml(work.title)}" loading="lazy">
              ${work.detail ? '<span class="preview-label">detail</span>' : ''}
            </div>`
          ).join('')}
        </div>
        <div class="series-card-info">
          <div class="series-card-top">
            <div>
              <p class="eyebrow">${safeHtml(group.year || year)}</p>
              <h2>${safeHtml(displaySeries(group.series))}</h2>
            </div>
            <span class="series-count">${mains.length || group.works.length} works</span>
          </div>
          <div class="series-tags">
            ${tags.slice(0, 10).map(tag => `<span class="tag static-tag">#${safeHtml(tag)}</span>`).join('')}
          </div>
          <div class="series-foot">
            <span>${details ? `${details} details` : ''}</span>
            <span>${concept || info?.concept ? 'concept ↗' : ''}</span>
          </div>
        </div>
      </article>`;
    }).join('')}</div></section>`)
    .join('') || '<div class="archive-empty">No works match this filter.</div>';
}

function renderWorkCard(work) {
  return `<article class="series-work" data-image="${safeHtml(work.path)}">
    <div class="series-work-image">
      <img src="${pathUrl(work.path)}" alt="${safeHtml(work.title)}" loading="lazy">
    </div>
    <div class="series-work-meta">
      <strong>${safeHtml(work.title)}</strong>
      <span>${safeHtml(work.year)}</span>
      <span>${safeHtml(work.metadata)}</span>
      <div class="work-tags">
        ${work.tags.filter(tag => !['detail', 'installation'].includes(tag))
          .map(tag => `<span class="tag static-tag">#${safeHtml(tag)}</span>`).join('')}
      </div>
    </div>
  </article>`;
}

function safeLinkUrl(url = '') {
  const value = String(url).trim();
  if (/^(https?:|mailto:|\/)/i.test(value)) return value;
  return '';
}

function inlineMarkdown(text) {
  let html = safeHtml(text);

  html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const safeUrl = safeLinkUrl(url);
    return safeUrl
      ? `<a href="${safeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`
      : label;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return html;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = null;

  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`);
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length, 4);
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(?:---+|\*\*\*+|___+)$/.test(line.trim())) {
      flushParagraph();
      closeList();
      output.push('<hr>');
      continue;
    }

    const blockquote = line.match(/^>\s?(.*)$/);
    if (blockquote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(blockquote[1])}</blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        output.push('<ul>');
        listType = 'ul';
      }
      output.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        output.push('<ol>');
        listType = 'ol';
      }
      output.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    if (listType) closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return output.join('\n');
}

async function renderMarkdown(path, container) {
  if (!container || !path) return;

  container.innerHTML = '<span>loading text…</span>';

  try {
    const response = await fetch(pathUrl(path));
    if (!response.ok) throw new Error(`document ${response.status}`);
    const markdown = await response.text();
    container.innerHTML = `<div class="concept-content">${markdownToHtml(markdown)}</div>`;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="concept-error">Could not render this text here. <a href="${githubFileUrl(path)}" target="_blank" rel="noreferrer">Open the source ↗</a></div>`;
  }
}

function conceptFile(concept) {
  return concept?.files.find(file => /\.md$/i.test(file.name)) || null;
}

function conceptMarkup(concept) {
  const file = conceptFile(concept);
  if (!file) return '';

  return `<section class="series-conception">
    <div class="section-heading">
      <p class="eyebrow">text</p>
      <h2>conception</h2>
    </div>
    <div class="concept-actions">
      <span>embedded markdown</span>
      <a class="conception-link-inline" href="${githubFileUrl(file.path)}" target="_blank" rel="noreferrer">source ↗</a>
    </div>
    <div class="concept-preview" data-concept-preview><span>loading text…</span></div>
  </section>`;
}

function openConcept(path, title = 'Conception') {
  if (!seriesModal || !seriesModalContent) return;

  seriesModalContent.innerHTML = `<div class="series-modal-head">
    <div>
      <p class="eyebrow">text</p>
      <h1>${safeHtml(title)}</h1>
    </div>
    <div class="series-modal-stats"><span>markdown</span></div>
  </div>
  <section class="concept-reader">
    <div class="concept-reader-bar">
      <span>conception</span>
      <a href="${githubFileUrl(path)}" target="_blank" rel="noreferrer">source ↗</a>
    </div>
    <div class="concept-reader-body" data-concept-reader>loading text…</div>
  </section>`;

  seriesModal.classList.add('open');
  seriesModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  renderMarkdown(path, seriesModalContent.querySelector('[data-concept-reader]'));
}

function groupTitle(group) {
  if (group.series) return displaySeries(group.series);
  const main = group.works.find(work => !work.detail) || group.works[0];
  return main?.title || 'Independent work';
}

function openSeries(key) {
  const group = seriesGroups().find(item => item.key === key);
  if (!group || !seriesModal) return;

  const info = matchSeriesMeta(group.series);
  const concept = matchConcept(group.series);
  const mains = group.works.filter(work => !work.detail);
  const details = group.works.filter(work => work.detail);
  const title = groupTitle(group);

  seriesModalContent.innerHTML = `<div class="series-modal-head">
    <div>
      <p class="eyebrow">${safeHtml(group.year || 'archive')}</p>
      <h1>${safeHtml(title)}</h1>
    </div>
    <div class="series-modal-stats">
      <span>${mains.length} ${group.series ? 'works' : 'work'}</span>
      ${details.length ? `<span>${details.length} details</span>` : ''}
      ${concept || info?.concept ? '<span>concept</span>' : ''}
    </div>
  </div>
  ${conceptMarkup(concept)}
  ${mains.length ? `<section class="series-modal-section">
    <div class="section-heading"><p class="eyebrow">works</p><h2>main work${mains.length === 1 ? '' : 's'}</h2></div>
    <div class="series-work-grid">${mains.map(renderWorkCard).join('')}</div>
  </section>` : ''}
  ${details.length ? `<section class="series-modal-section">
    <div class="section-heading"><p class="eyebrow">details</p><h2>details / close-ups</h2></div>
    <div class="detail-scroll">${details.map(renderWorkCard).join('')}</div>
  </section>` : ''}`;

  seriesModal.classList.add('open');
  seriesModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const preview = seriesModalContent.querySelector('[data-concept-preview]');
  const file = conceptFile(concept);
  if (preview && file) renderMarkdown(file.path, preview);
}

function closeSeries() {
  seriesModal?.classList.remove('open');
  seriesModal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openLightbox(work) {
  if (!work || !lightbox || !lightboxImage) return;

  lightboxImage.src = pathUrl(work.path);
  lightboxImage.alt = work.title || '';
  if (lightboxCaption) {
    lightboxCaption.textContent = [work.title, work.year, work.metadata].filter(Boolean).join(' · ');
  }

  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function renderConceptions() {
  if (!conceptionList) return;

  if (!conceptions.length) {
    conceptionList.innerHTML = '<p class="projects-empty">No conception texts found.</p>';
    return;
  }

  conceptionList.innerHTML = conceptions.map(concept => {
    const file = conceptFile(concept);
    return `<article class="conception-card">
      <div>
        <p class="eyebrow">concept</p>
        <h3>${safeHtml(displaySeries(concept.folder))}</h3>
      </div>
      <div class="conception-files">
        ${file
          ? `<button class="conception-open-list" data-concept-path="${safeHtml(file.path)}" data-concept-title="${safeHtml(displaySeries(concept.folder))}">read on site ↗</button>`
          : concept.files.map(item =>
              `<a class="conception-link" href="${githubFileUrl(item.path)}" target="_blank" rel="noreferrer"><span>${safeHtml(item.name.replace(/\.[^.]+$/, ''))}</span><span>↗</span></a>`
            ).join('')}
      </div>
    </article>`;
  }).join('');
}

function handleLatestHash() {
  if (window.location.hash !== '#latest') return;

  const latest = sortWorks(artworks.filter(work => !work.detail && !work.installation))
    .sort((a, b) => b.sortYear - a.sortYear || b.path.localeCompare(a.path))[0];

  if (!latest) return;

  const group = seriesGroups().find(item => item.key === latest.groupKey);
  if (!group) return;

  const card = archiveRoot?.querySelector(`[data-series-key="${CSS.escape(group.key)}"]`);
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  if (group.works.some(work => work.detail)) {
    setTimeout(() => openSeries(group.key), 250);
  } else {
    setTimeout(() => openLightbox(latest), 250);
  }
}

async function loadArchive() {
  try {
    const response = await fetch(TREE_URL, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const data = await response.json();

    artworks = (data.tree || [])
      .filter(item =>
        item.type === 'blob' &&
        item.path.startsWith('img/') &&
        !/tags_n_meta\.ods$/i.test(item.path) &&
        !/\/VLADEY\//i.test(item.path) &&
        /\.(jpe?g|png|webp|gif)$/i.test(item.path)
      )
      .map(parseArtwork);

    const conceptMap = new Map();

    (data.tree || [])
      .filter(item =>
        item.type === 'blob' &&
        item.path.startsWith('txt/') &&
        /\.md$/i.test(item.path) &&
        !/text_files\.md$/i.test(item.path)
      )
      .forEach(item => {
        const parts = item.path.split('/');
        if (parts.length < 3) return;

        const folder = parts[1];
        if (!conceptMap.has(folder)) {
          conceptMap.set(folder, { folder, files: [] });
        }

        conceptMap.get(folder).files.push({
          name: parts[parts.length - 1],
          path: item.path
        });
      });

    conceptions = [...conceptMap.values()].filter(concept => concept.files.length);

    renderFilters();
    renderArchive();
    renderConceptions();

    if (status) {
      const mainWorks = artworks.filter(work => !work.detail).length;
      const detailImages = artworks.filter(work => work.detail).length;
      const seriesCount = new Set(
        artworks.map(work => work.series).filter(Boolean)
      ).size;

      status.textContent = `${artworks.length} images · ${mainWorks} works · ${seriesCount} series · ${detailImages} details · ${conceptions.length} conception groups`;
    }

    handleLatestHash();
  } catch (error) {
    console.error(error);
    if (status) status.textContent = 'Archive could not be loaded automatically.';
    if (archiveRoot) {
      archiveRoot.innerHTML = '<div class="archive-empty">The archive is temporarily unavailable. Please reload the page.</div>';
    }
  }
}

document.addEventListener('click', event => {
  const year = event.target.closest('[data-year]');
  const tag = event.target.closest('[data-tag]');
  const clear = event.target.closest('[data-clear-tags]');
  const sort = event.target.closest('[data-sort]');
  const conceptListButton = event.target.closest('.conception-open-list');
  const standalone = event.target.closest('.standalone-card');
  const seriesWork = event.target.closest('.series-work');
  const seriesCard = event.target.closest('.series-card');

  if (year) {
    activeYear = year.dataset.year;
    renderFilters();
    renderArchive();
    return;
  }

  if (tag) {
    const value = tag.dataset.tag;
    activeTags = activeTags.includes(value)
      ? activeTags.filter(item => item !== value)
      : [...activeTags, value];
    renderFilters();
    renderArchive();
    return;
  }

  if (clear) {
    activeTags = [];
    renderFilters();
    renderArchive();
    return;
  }

  if (sort) {
    sortMode = sort.dataset.sort;
    document.querySelectorAll('[data-sort]').forEach(button => {
      button.classList.toggle('active', button.dataset.sort === sortMode);
    });
    renderArchive();
    return;
  }

  if (conceptListButton) {
    openConcept(
      conceptListButton.dataset.conceptPath,
      conceptListButton.dataset.conceptTitle || 'Conception'
    );
    return;
  }

  if (standalone) {
    const key = standalone.dataset.seriesKey;
    const group = seriesGroups().find(item => item.key === key);

    if (group?.works.some(work => work.detail)) {
      openSeries(key);
    } else {
      const main = group?.works.find(work => !work.detail) || null;
      if (main) openLightbox(main);
    }
    return;
  }

  if (seriesWork) {
    const work = artworks.find(item => item.path === seriesWork.dataset.image);
    if (work) openLightbox(work);
    return;
  }

  if (seriesCard) {
    openSeries(seriesCard.dataset.seriesKey);
  }
});

document.getElementById('series-close')?.addEventListener('click', closeSeries);

seriesModal?.addEventListener('click', event => {
  if (event.target === seriesModal) closeSeries();
});

document.getElementById('lightbox-close')?.addEventListener('click', () => {
  lightbox?.classList.remove('open');
  lightbox?.setAttribute('aria-hidden', 'true');
});

lightbox?.addEventListener('click', event => {
  if (event.target === lightbox) {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (lightbox?.classList.contains('open')) {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  } else {
    closeSeries();
  }
});

loadArchive();
