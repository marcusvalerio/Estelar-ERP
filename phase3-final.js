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
  const COM_KEYS={customers:'oculto-commercial-customers-v1',orders:'oculto-commercial-orders-v1',quotes:'oculto-commercial-quotes-v1'};
  function readArr(k){try{const x=JSON.parse(localStorage.getItem(k));return Array.isArray(x)?x:[]}catch{return[]}}

  /* ---- período: aritmética por string ISO (YYYY-MM-DD), sem fuso a resolver ---- */
  function isoDate(d){return d.toISOString().slice(0,10)}
  function addDays(s,n){const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return isoDate(d)}
  function todayISO(){return isoDate(new Date())}
  function periodBounds(key){
    const today=todayISO();
    if(key==='today')return{start:today,end:today,label:'Hoje'};
    if(key==='7d')return{start:addDays(today,-6),end:today,label:'Últimos 7 dias'};
    if(key==='30d')return{start:addDays(today,-29),end:today,label:'Últimos 30 dias'};
    if(key==='month')return{start:today.slice(0,7)+'-01',end:today,label:'Este mês'};
    return{start:null,end:null,label:'Todo o período'};
  }
  function lastMonthBounds(){
    const now=new Date(),y=now.getFullYear(),m=now.getMonth();
    return{start:isoDate(new Date(y,m-1,1)),end:isoDate(new Date(y,m,0))};
  }
  function inRange(dateStr,b){if(!dateStr)return false;if(b.start&&dateStr<b.start)return false;if(b.end&&dateStr>b.end)return false;return true}
  function sumFinance(fin,pred,b){return fin.filter(x=>pred(x)&&inRange(x.date,b)).reduce((s,x)=>s+Number(x.value||0),0)}
  function countOrders(orders,b){return orders.filter(o=>inRange(o.created,b)).length}
  function trendPct(cur,prev){return prev>0?((cur-prev)/prev*100):null}
  function weekdayLabel(){return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(new Date()).toUpperCase()}

  let period=window.__dashPeriod||'month';
  window.dashSetPeriod=function(k){period=k;window.__dashPeriod=k;render()};

  function kpi(label,value,foot,tone,route,trend){
    const trendHtml=trend!=null?` <span class="kpi-trend ${trend>=0?'up':'down'}">${trend>=0?'↑':'↓'} ${Math.abs(trend).toFixed(1)}%</span>`:'';
    const tag=route?'button':'article';
    const click=route?` onclick="window.route('${route}')"`:'';
    return `<${tag} class="card kpi tone-${tone}${route?' kpi-link':''}"${click}><span class="kpi-label">${label}</span><strong>${value}</strong><span class="kpi-foot">${foot}${trendHtml}</span></${tag}>`;
  }
  function titleRows(list){
    const today=todayISO();
    const open=list.filter(x=>x.status==='open').sort((a,b)=>(a.due||'').localeCompare(b.due||'')).slice(0,5);
    if(!open.length)return '<div class="empty-state">Nenhum título em aberto.</div>';
    return `<div class="mini-table-head"><span>Parceiro</span><span>Vencimento</span><span>Valor</span><span>Status</span></div>${open.map(x=>{const overdue=x.due&&x.due<today;return `<button class="mini-row" onclick="window.route('financial')"><span>${esc(x.party)}</span><span>${new Intl.DateTimeFormat('pt-BR').format(new Date(x.due+'T12:00:00'))}</span><strong>${money(x.value)}</strong><em class="status-pill ${overdue?'overdue':'open'}">${overdue?'Vencido':'Em aberto'}</em></button>`}).join('')}`;
  }
  function orderRows(list){
    const rows=list.slice(0,5);
    if(!rows.length)return '<div class="empty-state">Nenhum pedido registrado ainda.</div>';
    return `<div class="mini-table-head"><span>Pedido</span><span>Cliente</span><span>Valor</span><span>Status</span></div>${rows.map(o=>`<button class="mini-row" onclick="window.route('commercial')"><span>${esc(o.id)}</span><span>${esc(o.customerName)||'—'}</span><strong>${money(o.total)}</strong><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></button>`).join('')}`;
  }
  function alerts(fin){
    const today=todayISO(),soonEnd=addDays(today,5);
    const overdue=fin.filter(x=>x.status==='open'&&x.due&&x.due<today);
    const dueSoon=fin.filter(x=>x.status==='open'&&x.due&&x.due>=today&&x.due<=soonEnd);
    return{overdueCount:overdue.length,overdueValue:overdue.reduce((s,x)=>s+Number(x.value||0),0),dueSoonCount:dueSoon.length,dueSoonValue:dueSoon.reduce((s,x)=>s+Number(x.value||0),0)};
  }
  function attentionBlock(fin){
    const a=alerts(fin),rows=[];
    if(a.overdueCount>0)rows.push(`<button class="alert-row tone-danger" onclick="window.route('financial')"><span class="alert-dot"></span><div><b>Títulos vencidos</b><span>${a.overdueCount} título(s) em atraso</span></div><strong>${money(a.overdueValue)}</strong></button>`);
    if(a.dueSoonCount>0)rows.push(`<button class="alert-row tone-warning" onclick="window.route('financial')"><span class="alert-dot"></span><div><b>Vencendo em breve</b><span>${a.dueSoonCount} título(s) nos próximos 5 dias</span></div><strong>${money(a.dueSoonValue)}</strong></button>`);
    if(!rows.length)return `<div class="state-block success"><b>Tudo certo por aqui</b>Nenhuma pendência financeira identificada no momento.</div>`;
    return `<div class="alert-list">${rows.join('')}</div>`;
  }
  function activities(fin,orders,quotes){
    const items=[];
    fin.forEach(x=>items.push({date:x.date,label:(x.type==='receivable'?'Conta a receber criada — ':'Conta a pagar criada — ')+x.description,detail:x.party,route:'financial',tone:x.type==='receivable'?'success':'warning'}));
    orders.forEach(o=>items.push({date:o.created,label:'Pedido '+o.id+' criado',detail:o.customerName,route:'commercial',tone:'info'}));
    quotes.forEach(q=>items.push({date:q.created,label:'Orçamento '+q.id+' criado',detail:q.customerName,route:'commercial',tone:'neutral'}));
    return items.filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  }
  function activityRows(fin,orders,quotes){
    const items=activities(fin,orders,quotes);
    if(!items.length)return '<div class="empty-state">Nenhuma atividade registrada ainda.</div>';
    return `<div class="activity-feed">${items.map(x=>`<button class="activity-feed-row" onclick="window.route('${x.route}')"><span class="activity-dot tone-${x.tone}"></span><div><b>${esc(x.label)}</b><span>${esc(x.detail||'')}</span></div><small>${new Intl.DateTimeFormat('pt-BR').format(new Date(x.date+'T12:00:00'))}</small></button>`).join('')}</div>`;
  }
  function periodBar(){
    const opts=[['today','Hoje'],['7d','7 dias'],['30d','30 dias'],['month','Este mês'],['all','Tudo']];
    return `<div class="filter-bar">${opts.map(([k,l])=>`<button class="filter ${period===k?'active':''}" onclick="dashSetPeriod('${k}')">${l}</button>`).join('')}<button class="btn tertiary" onclick="render()">↻ Atualizar</button></div>`;
  }
  window.dashboard=function(){
    const t=summary(),net=t.received-t.paid,fin=records();
    const customers=readArr(COM_KEYS.customers),orders=readArr(COM_KEYS.orders),quotes=readArr(COM_KEYS.quotes);
    const bounds=periodBounds(period);
    const receitaPeriodo=sumFinance(fin,x=>x.type==='receivable'&&x.status==='paid',bounds);
    const pagoPeriodo=sumFinance(fin,x=>x.type==='payable'&&x.status==='paid',bounds);
    const resultadoPeriodo=receitaPeriodo-pagoPeriodo;
    const pedidosPeriodo=countOrders(orders,bounds);
    let trendReceita=null,trendResultado=null;
    if(period==='month'){
      const lm=lastMonthBounds();
      const recPrev=sumFinance(fin,x=>x.type==='receivable'&&x.status==='paid',lm);
      const payPrev=sumFinance(fin,x=>x.type==='payable'&&x.status==='paid',lm);
      trendReceita=trendPct(receitaPeriodo,recPrev);
      trendResultado=trendPct(resultadoPeriodo,recPrev-payPrev);
    }
    const isEmptyEnvironment=customers.length===0&&orders.length===0;
    return `<div class="dashboard-head"><div><div class="eyebrow">${weekdayLabel()} · VISÃO EXECUTIVA</div><h1>Visão geral</h1><p>Bom dia, Marcus — panorama operacional da empresa.</p></div><div class="head-actions"><button class="btn ghost" onclick="route('reports')">Ver relatórios</button><button class="btn primary" onclick="route('financial')">${icon('plus')} Nova operação</button></div></div>
    ${periodBar()}
    ${isEmptyEnvironment?`<article class="card empty-hero"><b>Seu ambiente está pronto.</b><p>Comece cadastrando clientes, produtos ou criando seu primeiro pedido.</p><div class="head-actions"><button class="btn secondary" onclick="phase4Customer()">+ Cadastrar cliente</button><button class="btn secondary" onclick="phase4Product()">+ Cadastrar produto</button><button class="btn primary" onclick="phase4Quote()">+ Criar pedido</button></div></article>`:''}
    <div class="kpis dashboard-kpis">
      ${kpi('Receita',money(receitaPeriodo),bounds.label,'success','financial',trendReceita)}
      ${kpi('A receber',money(t.receivable),t.openReceivable+' títulos · saldo atual','warning','financial')}
      ${kpi('A pagar',money(t.payable),'saldo atual em aberto','info','financial')}
      ${kpi('Resultado',money(resultadoPeriodo),bounds.label,'neutral','financial',trendResultado)}
      ${kpi('Pedidos',String(pedidosPeriodo),bounds.label,'neutral','commercial')}
      ${kpi('Clientes',String(customers.length),'base comercial total','neutral','commercial')}
    </div>
    <div class="dashboard-layout">
      <article class="card financial-card"><div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Fluxo de caixa</h2></div><button class="select-btn" onclick="route('financial')">Abrir financeiro <span>→</span></button></div><div class="financial-total"><strong>${money(net)}</strong><span>resultado realizado (todo o período)</span></div><div class="phase3-ab-chart">${chart()}</div></article>
      <article class="card"><div class="card-head"><div><span class="section-label">ATENÇÃO</span><h2>Exige atenção</h2></div></div>${attentionBlock(fin)}</article>
    </div>
    <div class="dashboard-layout lower">
      <article class="card mini-table-card"><div class="card-head"><div><span class="section-label">COMERCIAL</span><h2>Pedidos recentes</h2></div><button class="link-btn" onclick="route('commercial')">Ver todos →</button></div><div class="mini-table">${orderRows(orders)}</div></article>
      <article class="card mini-table-card"><div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Títulos em aberto</h2></div><button class="link-btn" onclick="route('financial')">Ver todos →</button></div><div class="mini-table">${titleRows(fin)}</div></article>
    </div>
    <div class="dashboard-layout lower">
      <article class="card"><div class="card-head"><div><span class="section-label">ESTOQUE</span><h2>Estoque crítico</h2></div></div><div class="state-block"><b>Estoque ainda não está ativo</b>Cadastre produtos e ative o controle de saldo para ver itens críticos aqui.<button class="btn tertiary" onclick="route('stock')">Ir para Estoque →</button></div></article>
      <article class="card"><div class="card-head"><div><span class="section-label">MOVIMENTAÇÕES</span><h2>Atividades recentes</h2></div></div>${activityRows(fin,orders,quotes)}</article>
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
