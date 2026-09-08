(function(){
  function collectionGroup(group){
    const series=String(group.series||'').trim();
    const mains=group.works.filter(work=>!work.detail&&!work.installation);
    return Boolean(series)&&(mains.length>1||group.works.some(work=>work.detail));
  }

  function previewWork(group){
    return group.works.find(work=>!work.detail&&!work.installation)||null;
  }

  function workTags(work){
    return work.tags.filter(tag=>!['detail','installation'].includes(tag)).map(tag=>`<span class="tag static-tag">#${safeHtml(tag)}</span>`).join('');
  }

  function renderStandaloneWork(work){
    return `<article class="series-card standalone-card series-work" data-image="${safeHtml(work.path)}"><div class="series-preview-grid single"><div class="series-preview-shot"><img src="${pathUrl(work.path)}" alt="${safeHtml(work.title)}" loading="lazy"></div></div><div class="series-card-info standalone-card-info"><div class="series-card-top"><div><p class="eyebrow">${safeHtml(work.year||'archive')}</p><h2>${safeHtml(work.title)}</h2></div></div><div class="series-tags">${workTags(work)}</div><div class="series-foot standalone-card-foot"><span>${safeHtml(work.metadata||'')}</span></div></div></article>`;
  }

  function renderCollectionCard(group){
    const info=matchSeriesMeta(group.series),concept=matchConcept(group.series),details=group.works.filter(work=>work.detail).length;
    const tags=[...(info?.tags||[]),...group.works.flatMap(work=>work.tags)].filter((value,index,array)=>value&&array.indexOf(value)===index&&value!=='detail'&&value!=='installation');
    const preview=previewWork(group);if(!preview)return '';
    return `<article class="series-card collection-card" data-series-key="${safeHtml(group.year+'|||'+(group.series||''))}"><div class="series-preview-grid single"><div class="series-preview-shot"><img src="${pathUrl(preview.path)}" alt="${safeHtml(preview.title)}" loading="lazy"></div></div><div class="series-card-info"><div class="series-card-top"><div><p class="eyebrow">${safeHtml(group.year||'archive')}</p><h2>${safeHtml(displaySeries(group.series))}</h2></div><span class="series-count">${group.works.length} works</span></div><div class="series-tags">${tags.slice(0,10).map(tag=>`<span class="tag static-tag">#${safeHtml(tag)}</span>`).join('')}</div><div class="series-foot"><span>${details?`${details} details`:''}</span><span>${concept||info?.concept?'concept ↗':''}</span></div></div></article>`;
  }

  function renderArchiveV2(){
    if(!archiveRoot)return;
    const groups=seriesGroups(),collections=groups.filter(collectionGroup),standalone=groups.filter(group=>!collectionGroup(group)).flatMap(group=>group.works);
    const years=[...new Set(groups.map(group=>String(group.year||'Archive')))].sort((a,b)=>{const na=Number(a),nb=Number(b);return (Number.isFinite(nb)?nb:-1)-(Number.isFinite(na)?na:-1);});
    const html=years.map(year=>{
      const items=[...collections.filter(group=>String(group.year||'Archive')===year).map(renderCollectionCard),...standalone.filter(work=>String(work.year||'Archive')===year).map(renderStandaloneWork)].join('');
      return items?`<section class="year-section"><div class="year-heading"><span class="year-big">${safeHtml(year)}</span></div><div class="series-grid archive-grid">${items}</div></section>`:'';
    }).join('');
    archiveRoot.innerHTML=html||'<div class="archive-empty">No works match this filter.</div>';
  }

  window.renderArchive=renderArchiveV2;
  renderArchiveV2();
  document.addEventListener('click',event=>{
    const card=event.target.closest('.standalone-card');
    if(!card||!lightboxCaption)return;
    const lines=(card.querySelector('.series-card-info')?.innerText||'').split('\n').map(value=>value.trim()).filter(Boolean);
    lightboxCaption.textContent=lines.join(' · ');
  });
})();
