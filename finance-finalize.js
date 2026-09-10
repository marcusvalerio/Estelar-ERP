/* ESTELAR-ERP — Fase 3: acabamento funcional do Financeiro */
(function(){
  const KEY='oculto-finance-v1';
  const getData=()=>{try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:[]}catch{return[]}};
  const saveData=data=>localStorage.setItem(KEY,JSON.stringify(data));
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const today=()=>new Date().toISOString().slice(0,10);
  function enhance(){
    const page=document.querySelector('.finance-page'); if(!page||page.dataset.finalized==='1')return;
    page.dataset.finalized='1';
    const list=page.querySelector('.finance-list'); if(!list)return;
    const head=list.querySelector('.card-head'); const filters=list.querySelector('.finance-filters');
    if(!head)return;
    const search=document.createElement('input'); search.className='finance-search'; search.type='search'; search.placeholder='Pesquisar lançamento...'; search.setAttribute('aria-label','Pesquisar lançamento');
    head.insertBefore(search,filters||null);
    const rows=[...list.querySelectorAll('.finance-row')];
    const decorate=()=>{
      const data=getData();
      rows.forEach(r=>{
        const id=(r.children[0]?.querySelector('small')?.textContent||'').split(' · ')[0];
        const item=data.find(x=>x.id===id); if(!item)return;
        if(item.status==='open'&&item.due&&item.due<today()){const pill=r.querySelector('.status-pill');if(pill){pill.textContent='Vencido';pill.classList.add('overdue')}}
        const action=r.querySelector('.row-action');
        if(action&&!r.querySelector('.row-delete')){
          const remove=document.createElement('button');remove.className='row-delete';remove.type='button';remove.textContent='Excluir';remove.setAttribute('aria-label','Excluir lançamento');
          remove.onclick=()=>{if(!confirm('Excluir este lançamento?'))return;const next=getData().filter(x=>x.id!==id);saveData(next);window.render()};action.after(remove);
        }
      });
    };
    const apply=()=>{const q=search.value.trim().toLowerCase();rows.forEach(r=>{r.style.display=!q||r.textContent.toLowerCase().includes(q)?'grid':'none'})};
    search.addEventListener('input',apply); decorate();
    const footer=document.createElement('div');footer.className='finance-summary';
    const data=getData(),open=data.filter(x=>x.status==='open').reduce((s,x)=>s+Number(x.value||0),0),overdue=data.filter(x=>x.status==='open'&&x.due&&x.due<today()).reduce((s,x)=>s+Number(x.value||0),0);
    footer.innerHTML=`<span><b>${data.length}</b> lançamentos</span><span>Em aberto <b>${money(open)}</b></span><span>Vencido <b>${money(overdue)}</b></span>`;list.appendChild(footer);
  }
  const originalRender=window.render;
  window.render=function(){originalRender();setTimeout(enhance,0)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,50));else setTimeout(enhance,50);
})();
