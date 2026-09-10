const modules = [
  {id:'dashboard',label:'Visão geral',group:'Principal',icon:'OV',title:'Visão geral',desc:'O centro de comando da operação.'},
  {id:'commercial',label:'Comercial',group:'Operação',icon:'CO',title:'Comercial',desc:'Clientes, orçamentos, pedidos e vendas.'},
  {id:'purchases',label:'Compras',group:'Operação',icon:'CP',title:'Compras',desc:'Fornecedores, cotações, pedidos e recebimentos.'},
  {id:'stock',label:'Estoque',group:'Operação',icon:'ES',title:'Estoque',desc:'Produtos, saldos, movimentações e inventário.'},
  {id:'financial',label:'Financeiro',group:'Gestão',icon:'FI',title:'Financeiro',desc:'Contas a pagar, receber, caixa e conciliação.'},
  {id:'fiscal',label:'Fiscal',group:'Gestão',icon:'FC',title:'Fiscal',desc:'Documentos fiscais simulados e seus eventos.'},
  {id:'logistics',label:'Logística',group:'Operação',icon:'LO',title:'Logística',desc:'Transportes, cargas, viagens e entregas.'},
  {id:'registrations',label:'Cadastros',group:'Base',icon:'CA',title:'Cadastros',desc:'Dados mestres compartilhados pelo ERP.'},
  {id:'reports',label:'Relatórios',group:'Gestão',icon:'RE',title:'Relatórios',desc:'Indicadores e análises operacionais.'},
  {id:'users',label:'Usuários e permissões',group:'Administração',icon:'US',title:'Usuários e permissões',desc:'Perfis, acessos e trilha de auditoria.'},
  {id:'settings',label:'Configurações',group:'Administração',icon:'SE',title:'Configurações',desc:'Empresa, aparência e parâmetros do sistema.'}
];

let current = localStorage.getItem('oculto-route') || 'dashboard';
let searchOpen = false;

const activity = [
  ['Pedido #000184','Cliente de Estudo LTDA','R$ 4.850,00','Em andamento','commercial'],
  ['NF-e #000183','Empresa Modelo LTDA','R$ 2.340,00','Emitida','fiscal'],
  ['CT-e #000072','Cliente Logística LTDA','R$ 780,00','Em transporte','logistics'],
  ['Compra #000041','Fornecedor Modelo','R$ 6.210,00','Aguardando','purchases']
];

function icon(text){ return `<span class="module-icon">${text}</span>`; }
function formatBRL(value){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value); }

function nav(){
  const groups = {};
  modules.forEach(m => (groups[m.group] ??= []).push(m));
  return Object.entries(groups).map(([group,items]) => `
    <div class="nav-label">${group}</div>
    <div class="nav">
      ${items.map(m => `<button class="${current===m.id?'active':''}" onclick="route('${m.id}')">${icon(m.icon)}<span>${m.label}</span></button>`).join('')}
    </div>`).join('');
}

function shell(){
  const active = modules.find(m=>m.id===current) || modules[0];
  return `<div class="shell">
    <aside class="sidebar">
      <button class="brand" onclick="route('dashboard')" aria-label="Ir para visão geral">
        <div class="mark">E</div>
        <div><strong>ESTELAR</strong><span>ERP</span></div>
      </button>
      <div class="sidebar-search" onclick="toggleSearch(true)"><span>⌕</span><span>Pesquisar no ESTELAR</span><kbd>⌘ K</kbd></div>
      <div class="sidebar-nav">${nav()}</div>
      <div class="side-bottom">
        <div class="environment"><i></i><span>Ambiente de estudo</span></div>
        <small>Fiscal sem transmissão à SEFAZ</small>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="breadcrumbs"><span>ESTELAR ERP</span><b>/</b><strong>${active.title}</strong></div>
        <div class="actions">
          <button class="search-top" onclick="toggleSearch(true)"><span>Pesquisar</span><kbd>⌘ K</kbd></button>
          <button class="theme-btn" onclick="route('settings')">Aparência</button>
          <button class="icon-btn" aria-label="Notificações">◌</button>
          <button class="avatar">MV</button>
        </div>
      </header>
      <section class="content">${view()}</section>
    </main>

    <nav class="mobile-nav">
      ${[['dashboard','OV','Início'],['commercial','CO','Comercial'],['stock','ES','Estoque'],['financial','FI','Financeiro'],['fiscal','FC','Fiscal']].map(([id,i,l])=>`<button class="${current===id?'active':''}" onclick="route('${id}')"><b>${i}</b><span>${l}</span></button>`).join('')}
    </nav>

    ${searchOpen ? searchOverlay() : ''}
  </div>`;
}

function view(){
  if(current==='dashboard') return dashboard();
  if(current==='settings') return settings();
  const m = modules.find(x=>x.id===current) || modules[0];
  return moduleView(m);
}

function dashboard(){
  return `<div class="dashboard-head">
    <div>
      <div class="eyebrow">TERÇA-FEIRA · VISÃO EXECUTIVA</div>
      <h1>Bom dia, Marcus.</h1>
      <p>Uma leitura rápida da operação. Os indicadores desta fase são demonstrativos e serão conectados aos dados reais durante a implementação dos módulos.</p>
    </div>
    <div class="head-actions"><button class="btn ghost" onclick="route('reports')">Ver relatórios</button><button class="btn primary" onclick="openQuickActions()">+ Nova operação</button></div>
  </div>

  <div class="kpis dashboard-kpis">
    ${kpi('Receita','R$ 128.450','+12,4%','vs. mês anterior','up')}
    ${kpi('A receber','R$ 42.780','12','títulos em aberto','neutral')}
    ${kpi('Estoque','R$ 86.210','1.248','itens cadastrados','neutral')}
    ${kpi('Pedidos','184','+8,1%','este mês','up')}
  </div>

  <div class="dashboard-layout">
    <article class="card financial-card">
      <div class="card-head"><div><span class="section-label">FINANCEIRO</span><h2>Fluxo de caixa</h2></div><button class="select-btn">Este mês <span>⌄</span></button></div>
      <div class="financial-total"><strong>R$ 128.450</strong><span class="positive">↑ 12,4%</span></div>
      <div class="chart"><div class="chart-y"><span>150k</span><span>100k</span><span>50k</span><span>0</span></div><div class="chart-area">
        <div class="grid-line g1"></div><div class="grid-line g2"></div><div class="grid-line g3"></div><div class="grid-line g4"></div>
        <svg viewBox="0 0 700 210" preserveAspectRatio="none" aria-label="Gráfico demonstrativo de fluxo de caixa"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#AFC9DC" stop-opacity=".55"/><stop offset="1" stop-color="#AFC9DC" stop-opacity="0"/></linearGradient></defs><path d="M0,166 C65,150 80,145 125,150 S205,112 250,124 S315,96 355,105 S430,70 475,86 S550,45 585,58 S650,30 700,38 L700,210 L0,210Z" fill="url(#area)"/><path d="M0,166 C65,150 80,145 125,150 S205,112 250,124 S315,96 355,105 S430,70 475,86 S550,45 585,58 S650,30 700,38" fill="none" stroke="#115674" stroke-width="4" stroke-linecap="round"/></svg>
        <div class="chart-tooltip"><small>Junho</small><strong>R$ 38.420</strong></div>
      </div></div>
      <div class="chart-x"><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span></div>
    </article>

    <article class="card operations-card">
      <div class="card-head"><div><span class="section-label">OPERAÇÃO</span><h2>Status hoje</h2></div><button class="link-btn" onclick="route('reports')">Ver tudo →</button></div>
      <div class="status-list">
        ${status('Pedidos','32','Em andamento','blue')}
        ${status('Faturamento','18','Documentos','gold')}
        ${status('Entregas','11','Em transporte','teal')}
        ${status('Compras','7','Aguardando','soft')}
      </div>
      <div class="operation-footer"><span>Atualização demonstrativa</span><b>Agora</b></div>
    </article>
  </div>

  <div class="dashboard-layout lower">
    <article class="card activity-card">
      <div class="card-head"><div><span class="section-label">MOVIMENTAÇÕES</span><h2>Atividade recente</h2></div><button class="link-btn" onclick="route('reports')">Ver histórico →</button></div>
      <div class="activity-table"><div class="table-head"><span>Documento</span><span>Cliente / parceiro</span><span>Valor</span><span>Status</span></div>${activity.map(r=>`<button class="activity-row" onclick="route('${r[4]}')"><span><b>${r[0]}</b><small>${r[4]}</small></span><span>${r[1]}</span><strong>${r[2]}</strong><em>${r[3]}</em></button>`).join('')}</div>
    </article>

    <article class="card shortcuts-card">
      <div class="card-head"><div><span class="section-label">ACESSO RÁPIDO</span><h2>Operações</h2></div></div>
      <div class="shortcut-grid">
        ${shortcut('CO','Novo pedido','commercial')}
        ${shortcut('PR','Novo produto','stock')}
        ${shortcut('CR','Lançar recebimento','financial')}
        ${shortcut('NF','Documento fiscal','fiscal')}
      </div>
    </article>
  </div>

  <div class="module-strip"><div><span class="section-label">ECOSSISTEMA</span><h2>Módulos do ESTELAR</h2></div><span class="module-count">11 módulos estruturados</span></div>
  <div class="module-overview">${modules.filter(m=>!['dashboard','settings'].includes(m.id)).map(m=>`<button class="module-tile" onclick="route('${m.id}')">${icon(m.icon)}<span><b>${m.label}</b><small>${m.desc}</small></span><i>↗</i></button>`).join('')}</div>`;
}

function kpi(label,value,change,foot,type){return `<article class="card kpi"><div class="kpi-top"><span>${label}</span><span class="kpi-dot ${type}"></span></div><strong>${value}</strong><div class="kpi-bottom"><b class="${type==='up'?'positive':''}">${change}</b><span>${foot}</span></div></article>`;}
function status(title,value,desc,tone){return `<div class="status-item"><div class="status-icon ${tone}"></div><div><b>${title}</b><span>${desc}</span></div><strong>${value}</strong></div>`;}
function shortcut(code,label,target){return `<button class="shortcut" onclick="route('${target}')">${icon(code)}<span>${label}</span><i>+</i></button>`;}

function moduleView(m){
  return `<div class="module-head"><div><div class="eyebrow">MÓDULO · ${m.group.toUpperCase()}</div><h1>${m.title}</h1><p>${m.desc}</p></div><div class="head-actions"><button class="btn ghost">Exportar</button><button class="btn primary" onclick="notifyDemo()">+ Novo registro</button></div></div>
  <div class="module-kpis"><article class="card"><span>Total</span><strong>0</strong><small>Aguardando dados reais</small></article><article class="card"><span>Ativos</span><strong>0</strong><small>Estrutura preparada</small></article><article class="card"><span>Hoje</span><strong>0</strong><small>Nenhuma movimentação</small></article></div>
  <div class="module-grid">${cardsFor(current).map(c=>`<article class="card module-card">${icon(c.i)}<div><h3>${c.t}</h3><p>${c.p}</p></div><button class="btn ghost" onclick="notifyDemo()">Acessar →</button></article>`).join('')}</div>`;
}

function cardsFor(id){
  const map={
    commercial:[['CL','Clientes','Base comercial e relacionamento.'],['PD','Pedidos','Pedidos de venda e acompanhamento.'],['OR','Orçamentos','Propostas e oportunidades.']],
    purchases:[['FO','Fornecedores','Cadastro e relacionamento.'],['CO','Cotações','Cotações e comparativos.'],['PC','Pedidos de compra','Compras e recebimentos.']],
    stock:[['PR','Produtos','Catálogo e dados fiscais.'],['SA','Saldos','Posição de estoque.'],['MV','Movimentações','Entradas, saídas e ajustes.']],
    financial:[['CP','Contas a pagar','Obrigações e pagamentos.'],['CR','Contas a receber','Recebimentos e cobranças.'],['CX','Caixa','Fluxo e posição financeira.']],
    fiscal:[['NF','NF-e','Documentos fiscais simulados.'],['CT','CT-e','Conhecimentos de transporte simulados.'],['MD','MDF-e','Manifestos eletrônicos simulados.']],
    logistics:[['TR','Transportes','Operações e cargas.'],['VI','Viagens','Planejamento e acompanhamento.'],['EN','Entregas','Status e ocorrências.']],
    registrations:[['CL','Clientes','Cadastros de clientes.'],['FO','Fornecedores','Cadastros de fornecedores.'],['PR','Produtos','Produtos e serviços.']],
    reports:[['BI','Indicadores','Visão gerencial.'],['OP','Operacional','Relatórios de operação.'],['FI','Financeiro','Análises financeiras.']],
    users:[['US','Usuários','Usuários do sistema.'],['PF','Perfis','Perfis de acesso.'],['LG','Auditoria','Histórico de ações.']]
  };
  return (map[id]||[]).map(x=>({i:x[0],t:x[1],p:x[2]}));
}

function settings(){
  const theme=localStorage.getItem('oculto-theme')||'system';
  return `<div class="module-head"><div><div class="eyebrow">ADMINISTRAÇÃO</div><h1>Configurações</h1><p>Preferências gerais do ESTELAR ERP.</p></div></div>
  <article class="card settings-card">
    <div class="setting"><div><strong>Aparência</strong><span>Escolha como o ESTELAR deve aparecer.</span></div><div class="theme-options">${['light','dark','system'].map(t=>`<button class="${theme===t?'active':''}" onclick="setTheme('${t}')">${t==='light'?'Claro':t==='dark'?'Escuro':'Sistema'}</button>`).join('')}</div></div>
    <div class="setting"><div><strong>Empresa</strong><span>Empresa principal e parâmetros operacionais.</span></div><button class="btn ghost" onclick="notifyDemo()">Configurar</button></div>
    <div class="setting"><div><strong>Ambiente fiscal</strong><span>Simulação educacional. Nenhuma informação é transmitida à SEFAZ.</span></div><span class="setting-badge">SIMULADO</span></div>
  </article>`;
}

function searchOverlay(){
  return `<div class="search-overlay" onclick="if(event.target===this)toggleSearch(false)"><div class="search-panel"><div class="search-input"><span>⌕</span><input id="globalSearch" autofocus placeholder="Pesquisar módulos, documentos e cadastros..." oninput="filterSearch(this.value)"><kbd>ESC</kbd></div><div id="searchResults">${searchResults('')}</div><div class="search-foot">Use ↑ ↓ para navegar · Enter para abrir</div></div></div>`;
}
function searchResults(term){
  const q=term.trim().toLowerCase();
  const list=modules.filter(m=>!q||`${m.label} ${m.desc}`.toLowerCase().includes(q));
  return list.length?list.map(m=>`<button class="search-result" onclick="route('${m.id}');toggleSearch(false)">${icon(m.icon)}<span><b>${m.label}</b><small>${m.desc}</small></span><i>↵</i></button>`).join(''):`<div class="no-results">Nenhum resultado encontrado.</div>`;
}
function filterSearch(value){const el=document.getElementById('searchResults');if(el)el.innerHTML=searchResults(value);}
function toggleSearch(open){searchOpen=open;render();if(open){setTimeout(()=>document.getElementById('globalSearch')?.focus(),50);}}
function openQuickActions(){route('commercial');}
function notifyDemo(){window.alert('A estrutura desta operação está preparada. A funcionalidade transacional entra na implementação do módulo.');}
function route(id){current=id;localStorage.setItem('oculto-route',id);searchOpen=false;render();window.scrollTo({top:0,behavior:'smooth'});}
function setTheme(t){localStorage.setItem('oculto-theme',t);applyTheme();render();}
function applyTheme(){const t=localStorage.getItem('oculto-theme')||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',document.documentElement.dataset.theme==='dark'?'#002147':'#F0F4F8');}
function render(){document.getElementById('app').innerHTML=shell();applyTheme();}

window.route=route;window.setTheme=setTheme;window.toggleSearch=toggleSearch;window.filterSearch=filterSearch;window.openQuickActions=openQuickActions;window.notifyDemo=notifyDemo;
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();toggleSearch(true);}if(e.key==='Escape'&&searchOpen)toggleSearch(false);});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem('oculto-theme')||'system')==='system')applyTheme();});
applyTheme();render();
