/* ESTELAR-ERP — Fase 3 finalization layer */
(function(){
  const FIN_KEY='oculto-finance-v1';
  const svg={dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',commercial:'<path d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5"/>',purchases:'<path d="M4 6h16v14H4zM8 6V4h8v2M8 10h8M8 14h5"/>',stock:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9"/>',financial:'<path d="M4 7h16v13H4zM4 7V5h13a3 3 0 0 1 3 3M15 13h5"/><circle cx="15" cy="13" r="1"/>',fiscal:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6"/>',logistics:'<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',registrations:'<path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5"/>',reports:'<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.4-5 6-5s6 1.7 6 5M17 5.5a3 3 0 0 1 0 5.8M17 15c2.7.3 4 1.9 4 5"/>',settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M4.9 4.9 7 7M17 17l2.1 2.1M4 12H1M23 12h-3M12 4V1M12 23v-3M4.9 19.1 7 17M17 7l2.1-2.1"/>',plus:'<path d="M12 5v14M5 12h14"/>'};
  const aliases={OV:'dashboard',CO:'commercial',CP:'purchases',ES:'stock',FI:'financial',FC:'fiscal',LO:'logistics',CA:'registrations',RE:'reports',US:'users',SE:'settings',NF:'fiscal',PR:'stock',CR:'financial',BI:'reports',OP:'reports',CT:'fiscal',MD:'fiscal',TR:'logistics',VI:'logistics',EN:'logistics',FO:'purchases',PC:'purchases',PD:'commercial',OR:'commercial',CL:'registrations',SA:'stock',MV:'stock',CX:'financial',LG:'users',PF:'users'};
  function icon(name){const key=aliases[name]||name;return `<span class="module-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${svg[key]||svg.dashboard}</svg></span>`}
  window.ocultoIcon=icon;window.icon=icon;
  function records(){try{const x=JSON.parse(localStorage.getItem(FIN_KEY));return Array.isArray(x)?x:[]}catch{return[]}}
  function money(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)}
  function summary(){const a=records(),sum=(fn)=>a.filter(fn).reduce((s,x)=>s+Number(x.value||0),0);return {receivable:sum(x=>x.type==='receivable'&&x.status==='open'),payable:sum(x=>x.type==='payable'&&x.status==='open'),received:sum(x=>x.type==='receivable'&&x.status==='paid'),paid:sum(x=>x.type==='payable'&&x.status==='paid'),open:a.filter(x=>x.status==='open').length,openReceivable:a.filter(x=>x.type==='receivable'&&x.status==='open').length,total:a.length}}
  window.ocultoData={finance:summary,financeRecords:records};
  function chart(){return typeof window.financeDashboardChart==='function'?window.financeDashboardChart():''}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const COM_KEYS={customers:'oculto-commercial-customers-v1',orders:'oculto-commercial-orders-v1'};
  function readArr(k){try{const x=JSON.parse(localStorage.getItem(k));return Array.isArray(x)?x:[]}catch{return[]}}
  function kpi(label,value,foot,tone){return `<article class="card kpi tone-${tone}"><span class="kpi-label">${label}</span><strong>${value}</strong><span class="kpi-foot">${foot}</span></article>`}
  function titleRows(list){
    const today=new Date().toISOString().slice(0,10);
    const open=list.filter(x=>x.status==='open').sort((a,b)=>(a.due||'').localeCompare(b.due||'')).slice(0,5);
    if(!open.length)return '<div class="empty-state">Nenhum título em aberto.</div>';
    return `<div class="mini-table-head"><span>Parceiro</span><span>Vencimento</span><span>Valor</span><span>Status</span></div>${open.map(x=>{const overdue=x.due&&x.due<today;return `<div class="mini-row"><span>${esc(x.party)}</span><span>${new Intl.DateTimeFormat('pt-BR').format(new Date(x.due+'T12:00:00'))}</span><strong>${money(x.value)}</strong><em class="status-pill ${overdue?'overdue':'open'}">${overdue?'Vencido':'Em aberto'}</em></div>`}).join('')}`;
  }
  function orderRows(list){
    const rows=list.slice(0,5);
    if(!rows.length)return '<div class="empty-state">Nenhum pedido registrado ainda.</div>';
    return `<div class="mini-table-head"><span>Pedido</span><span>Cliente</span><span>Valor</span><span>Status</span></div>${rows.map(o=>`<div class="mini-row"><span>${esc(o.id)}</span><span>${esc(o.customerName)||'—'}</span><strong>${money(o.total)}</strong><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></div>`).join('')}`;
  }
  window.dashboard=function(){
    const t=summary(),net=t.received-t.paid,fin=records();
    const customers=readArr(COM_KEYS.customers),orders=readArr(COM_KEYS.orders);
    return `<div class="dashboard-head"><div><div class="eyebrow">VISÃO EXECUTIVA</div><h1>Bom dia, Marcus.</h1></div><div class="head-actions"><button class="btn ghost" onclick="route('reports')">Relatórios</button><button class="btn primary" onclick="route('financial')">${icon('plus')} Nova operação</button></div></div>
    <div class="kpis dashboard-kpis">
      ${kpi('Receita',money(t.received),'realizado','success')}
      ${kpi('A receber',money(t.receivable),t.openReceivable+' títulos em aberto','warning')}
      ${kpi('A pagar',money(t.payable),'em aberto','info')}
      ${kpi('Resultado',money(net),'entradas − saídas','neutral')}
      ${kpi('Pedidos',String(orders.length),orders.filter(o=>o.status!=='invoiced').length+' em aberto','neutral')}
      ${kpi('Clientes',String(customers.length),'base comercial','neutral')}
    </div>
    <div class="dashboard-layout">
      <article class="card financial-card"><div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Fluxo de caixa</h2></div><button class="select-btn" onclick="route('financial')">Abrir financeiro <span>→</span></button></div><div class="financial-total"><strong>${money(net)}</strong><span>resultado realizado</span></div><div class="phase3-ab-chart">${chart()}</div></article>
      <article class="card operations-card"><div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Status</h2></div><button class="link-btn" onclick="route('financial')">Ver tudo →</button></div><div class="status-list"><div class="status-item"><div class="status-icon blue"></div><div><b>A receber</b><span>Em aberto</span></div><strong>${money(t.receivable)}</strong></div><div class="status-item"><div class="status-icon gold"></div><div><b>A pagar</b><span>Em aberto</span></div><strong>${money(t.payable)}</strong></div><div class="status-item"><div class="status-icon teal"></div><div><b>Recebimentos</b><span>Realizados</span></div><strong>${money(t.received)}</strong></div><div class="status-item"><div class="status-icon soft"></div><div><b>Pagamentos</b><span>Realizados</span></div><strong>${money(t.paid)}</strong></div></div></article>
    </div>
    <div class="dashboard-layout lower">
      <article class="card mini-table-card"><div class="card-head"><div><span class="section-label">COMERCIAL</span><h2>Pedidos recentes</h2></div><button class="link-btn" onclick="route('commercial')">Ver todos →</button></div><div class="mini-table">${orderRows(orders)}</div></article>
      <article class="card mini-table-card"><div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Títulos em aberto</h2></div><button class="link-btn" onclick="route('financial')">Ver todos →</button></div><div class="mini-table">${titleRows(fin)}</div></article>
    </div>`;
  }
  const moduleSchemas={
    purchases:{kpis:[['Pedidos de compra','0','nenhum registrado'],['Fornecedores','0','cadastro pendente'],['Em recebimento','0','aguardando']],columns:['Pedido','Fornecedor','Itens','Valor','Status']},
    stock:{kpis:[['Produtos','0','catálogo vazio'],['Estoque crítico','0','abaixo do mínimo'],['Movimentações hoje','0','entradas e saídas']],columns:['Produto','SKU','Saldo','Disponível','Mínimo','Status']},
    fiscal:{kpis:[['Documentos','0','emitidos'],['Pendentes','0','aguardando emissão'],['Cancelados','0','este mês']],columns:['Documento','Tipo','Cliente/Fornecedor','Valor','Status']},
    logistics:{kpis:[['Entregas','0','em rota'],['Rotas ativas','0','planejadas'],['Ocorrências','0','registradas']],columns:['Pedido','Rota','Motorista','Previsão','Status']},
    registrations:{kpis:[['Cadastros','0','base compartilhada'],['Pendentes de revisão','0','sem itens'],['Duplicados','0','nenhum encontrado']],columns:['Nome','Tipo','Documento','Status']},
    reports:{kpis:[['Relatórios salvos','0','nenhum criado'],['Exportações','0','este mês'],['Agendados','0','nenhum ativo']],columns:['Relatório','Período','Módulo','Gerado em']},
    users:{kpis:[['Usuários','0','cadastrados'],['Perfis','0','configurados'],['Sessões ativas','0','agora']],columns:['Usuário','Perfil','Último acesso','Status']}
  };
  const originalModuleView=window.moduleView;window.moduleView=function(m){
    if(m.id==='financial')return originalModuleView(m);
    const s=moduleSchemas[m.id]||{kpis:[['Registros','0','base preparada'],['Ativos','0','sem dados cadastrados'],['Hoje','0','nenhuma movimentação']],columns:['Item','Status']};
    return `<div class="module-head"><div><div class="eyebrow">MÓDULO · ${esc(m.group.toUpperCase())}</div><h1>${esc(m.title)}</h1><p>${esc(m.desc)}</p></div><div class="head-actions"><button class="btn ghost">Exportar</button><button class="btn primary" onclick="notifyDemo()">${icon('plus')} Novo registro</button></div></div>
    <div class="kpis module-kpis-row">${s.kpis.map(([label,value,foot])=>kpi(label,value,foot,'neutral')).join('')}</div>
    <article class="card">
      <div class="card-head"><div><span class="section-label">${esc(m.title.toUpperCase())}</span><h2>Registros</h2></div></div>
      <div class="filter-bar"><input type="search" placeholder="Pesquisar..." disabled><button class="filter" disabled>Status</button><button class="filter" disabled>Período</button><span class="filter-bar-hint">Filtros disponíveis após o primeiro cadastro</span></div>
      <div class="data-table"><div class="data-table-head cols-${s.columns.length}">${s.columns.map(c=>`<span>${esc(c)}</span>`).join('')}</div><div class="empty-state">Nenhum registro cadastrado ainda.</div></div>
    </article>`;
  };
  const originalRender=window.render;window.render=function(){originalRender();document.querySelectorAll('.module-icon').forEach(el=>{if(!el.querySelector('svg'))el.outerHTML=icon(el.textContent.trim())});document.querySelectorAll('.mobile-nav button').forEach(b=>{const label=b.querySelector('span')?.textContent;const map={Início:'dashboard',Comercial:'commercial',Estoque:'stock',Financeiro:'financial',Fiscal:'fiscal'};const strong=b.querySelector('b');if(map[label]&&strong)strong.outerHTML=icon(map[label])})};
})();
