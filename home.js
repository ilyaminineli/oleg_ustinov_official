const REPO='ilyaminineli/oleg_ustinov_official';
const BRANCH='main';
const TREE_URL=`https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_ROOT=`https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const target=document.getElementById('latest-work');
function pathUrl(path){return RAW_ROOT+path.split('/').map(encodeURIComponent).join('/');}
function firstYear(text){const m=String(text).match(/\b(?:19|20)\d{2}\b/);return m?Number(m[0]):0;}
function parseYear(path){return firstYear(path)||0;}
async function loadLatest(){
  if(!target)return;
  try{
    const r=await fetch(TREE_URL,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error(r.status);
    const data=await r.json();
    const images=(data.tree||[]).filter(i=>i.type==='blob'&&i.path.startsWith('img/')&&!i.path.includes('/VLADEY/')&&!/\.(jpe?g|png|webp|gif)$/i.test(i.path)===false&&!/\bdetail\b|details|детал/i.test(i.path));
    images.sort((a,b)=>parseYear(b.path)-parseYear(a.path)||b.path.localeCompare(a.path));
    const latest=images[0];if(!latest)return;
    const name=latest.path.split('/').pop().replace(/\.[^.]+$/,'');
    target.innerHTML=`<img src="${pathUrl(latest.path)}" alt="Latest work: ${name.replace(/"/g,'&quot;')}" loading="eager"><span class="latest-label">latest work · ${parseYear(latest.path)||'—'}</span>`;
    target.dataset.image=latest.path;
  }catch(error){console.error(error);}
}
target?.addEventListener('click',()=>{if(target.dataset.image)window.location.href=`works.html#latest`});
loadLatest();