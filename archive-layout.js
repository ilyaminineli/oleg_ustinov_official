(function () {
  function collectionGroup(group) {
    const series = String(group.series || '').trim();
    const mains = group.works.filter(work => !work.detail && !work.installation);
    return Boolean(series) && (mains.length > 1 || group.works.some(work => work.detail));
  }

  function previewWork(group) {
    return group.works.find(work => !work.detail && !work.installation) || group.works[0] || null;
  }

  function workTags(work) {
    return work.tags
      .filter(tag => !['detail', 'installation'].includes(tag))
      .map(tag => `<span class="tag static-tag">#${safeHtml(tag)}</span>`)
      .join('');
  }

  function renderStandaloneWork(group) {
    const main = previewWork(group);
    if (!main) return '';

    const details = group.works.filter(work => work.detail).length;

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
            <p class="eyebrow">${safeHtml(main.year || group.year || 'archive')}</p>
            <h2>${safeHtml(main.title)}</h2>
          </div>
        </div>
        <div class="series-tags">${workTags(main)}</div>
        <div class="series-foot standalone-card-foot">
          <span>${safeHtml(main.metadata || '')}</span>
          <span>${details ? `${details} details ↗` : 'view ↗'}</span>
        </div>
      </div>
    </article>`;
  }

  function renderCollectionCard(group) {
    const info = matchSeriesMeta(group.series);
    const concept = matchConcept(group.series);
    const details = group.works.filter(work => work.detail).length;
    const mains = group.works.filter(work => !work.detail && !work.installation);
    const preview = mains[0];
    if (!preview) return '';

    const tags = [...new Set([
      ...(info?.tags || []),
      ...group.works.flatMap(work => work.tags)
    ])].filter(tag => tag !== 'detail' && tag !== 'installation');

    const previewShots = group.works
      .filter(work => !work.installation)
      .slice(0, 3);

    return `<article class="series-card collection-card" data-series-key="${safeHtml(group.key)}">
      <div class="series-preview-grid">
        ${previewShots.map(work => `
          <div class="series-preview-shot ${work.detail ? 'detail-shot' : ''}">
            <img src="${pathUrl(work.path)}" alt="${safeHtml(work.title)}" loading="lazy">
            ${work.detail ? '<span class="preview-label">detail</span>' : ''}
          </div>
        `).join('')}
      </div>
      <div class="series-card-info">
        <div class="series-card-top">
          <div>
            <p class="eyebrow">${safeHtml(group.year || 'archive')}</p>
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
  }

  function renderArchiveV2() {
    if (!archiveRoot) return;

    const groups = seriesGroups();
    const collections = groups.filter(collectionGroup);
    const standalone = groups.filter(group => !collectionGroup(group));

    const years = [...new Set(
      groups.map(group => String(group.year || 'Archive'))
    )].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return (Number.isFinite(nb) ? nb : -1) - (Number.isFinite(na) ? na : -1);
    });

    const html = years.map(year => {
      const items = [
        ...collections
          .filter(group => String(group.year || 'Archive') === year)
          .map(renderCollectionCard),
        ...standalone
          .filter(group => String(group.year || 'Archive') === year)
          .map(renderStandaloneWork)
      ].join('');

      return items
        ? `<section class="year-section">
            <div class="year-heading">
              <span class="year-big">${safeHtml(year)}</span>
            </div>
            <div class="series-grid archive-grid">${items}</div>
          </section>`
        : '';
    }).join('');

    archiveRoot.innerHTML = html || '<div class="archive-empty">No works match this filter.</div>';
  }

  window.renderArchive = renderArchiveV2;
  renderArchiveV2();
})();