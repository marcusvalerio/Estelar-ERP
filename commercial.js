/* ESTELAR-ERP — Comercial (módulo consolidado, Ciclo 4)
   Substitui commercial.js + commercial-phase4-fix.js + phase4-final.js (3 camadas
   sobrepostas, só a última realmente executava — ver auditoria do Ciclo 4). */
(function(){
  const K={customers:'oculto-commercial-customers-v1',products:'oculto-commercial-products-v1',quotes:'oculto-commercial-quotes-v1',orders:'oculto-commercial-orders-v1',finance:'oculto-finance-v1'};
  const read=k=>{try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch{return[]}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const uid=p=>p+'-'+String(Date.now()).slice(-7);
  const fmtDate=d=>d?new Intl.DateTimeFormat('pt-BR').format(new Date(d+'T12:00:00')):'—';
  function data(){return{customers:read(K.customers),products:read(K.products),quotes:read(K.quotes),orders:read(K.orders)}}
  function icon(name){return window.ocultoIcon?window.ocultoIcon(name):`<span class="module-icon">${esc(name)}</span>`}

  /* ---- feedback: toast + confirmação (componentes compartilhados, não módulo-específicos) ---- */
  function toast(msg,tone){
    let stack=document.getElementById('toast-stack');
    if(!stack){stack=document.createElement('div');stack.id='toast-stack';stack.className='toast-stack';document.body.appendChild(stack)}
    const el=document.createElement('div');el.className='toast '+(tone||'success');el.textContent=msg;stack.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),200)},2800);
  }
  window.estelarToast=toast;
  function confirmAction(title,message,confirmLabel,onConfirm){
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="confirm-modal"><div class="modal"><button class="modal-close" onclick="document.getElementById('confirm-modal').remove()">×</button><div class="section-label">CONFIRMAÇÃO</div><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="modal-actions"><button type="button" class="btn ghost" onclick="document.getElementById('confirm-modal').remove()">Cancelar</button><button type="button" class="btn danger primary" id="confirm-modal-yes">${esc(confirmLabel)}</button></div></div></div>`);
    document.getElementById('confirm-modal-yes').onclick=()=>{document.getElementById('confirm-modal')?.remove();onConfirm()};
  }
  window.estelarConfirm=confirmAction;

  /* ---- estado do módulo ---- */
  let tab='overview';
  let custSearch='',prodSearch='',quoteSearch='',orderSearch='',orderStatus='all';
  let detailOrderId=null, detailCustomerId=null;

  /* ---- travessia de dados reais (pedido não guarda customerId; deriva via a cotação de origem) ---- */
  function ordersByCustomer(d){
    const quoteMap={}; d.quotes.forEach(q=>quoteMap[q.id]=q);
    const map={};
    d.orders.forEach(o=>{const q=quoteMap[o.quoteId];const cid=q&&q.customerId;if(!cid)return;(map[cid]=map[cid]||[]).push(o)});
    return map;
  }
  function quoteOf(d,order){return order&&order.quoteId?d.quotes.find(q=>q.id===order.quoteId):null}
  function customerOfOrder(d,order){const q=quoteOf(d,order);return q?d.customers.find(c=>c.id===q.customerId):null}

  function modal(title,body){return `<div class="modal-backdrop" id="commercial-modal"><div class="modal"><button class="modal-close" onclick="commercialClose()">×</button><div class="section-label">COMERCIAL</div><h2>${title}</h2>${body}</div></div>`}
  function k(label,value,detail,tone){return `<article class="card kpi tone-${tone||'neutral'}"><span class="kpi-label">${label}</span><strong>${value}</strong><span class="kpi-foot">${detail}</span></article>`}
  function shell(head,body){return `<div class="commercial-page phase4-page"><div class="module-head"><div><div class="eyebrow">COMERCIAL · OPERAÇÃO</div><h1>${head}</h1><p>Clientes, produtos, orçamentos e pedidos em um único fluxo comercial.</p></div><div class="head-actions"><button class="btn ghost" onclick="phase4Export()">Exportar</button><button class="btn primary" onclick="phase4New()">${icon('plus')} Nova operação</button></div></div><nav class="phase4-tabs" aria-label="Comercial"><button class="${tab==='overview'?'active':''}" onclick="phase4Tab('overview')">Visão geral</button><button class="${tab==='customers'?'active':''}" onclick="phase4Tab('customers')">Clientes</button><button class="${tab==='products'?'active':''}" onclick="phase4Tab('products')">Produtos</button><button class="${tab==='quotes'?'active':''}" onclick="phase4Tab('quotes')">Orçamentos</button><button class="${tab==='orders'?'active':''}" onclick="phase4Tab('orders')">Pedidos</button></nav>${body}${detailOrderId?orderDrawer(detailOrderId):''}${detailCustomerId?customerDrawer(detailCustomerId):''}</div>`}

  /* ================= VISÃO GERAL ================= */
  function overview(){
    const d=data(),approved=d.quotes.filter(x=>x.status==='approved').length,open=d.orders.filter(x=>x.status!=='invoiced').length,value=d.orders.reduce((s,x)=>s+Number(x.total||0),0);
    return shell('Comercial',`<div class="phase4-kpis">${k('Clientes',d.customers.length,'cadastros comerciais')}${k('Produtos',d.products.length,'itens no catálogo')}${k('Orçamentos',d.quotes.length,'propostas registradas')}${k('Pedidos',d.orders.length,money(value)+' em vendas')}</div><div class="phase4-overview-grid"><article class="card phase4-flow"><div class="card-head"><div><span class="section-label">FLUXO COMERCIAL</span><h2>Do contato ao recebimento</h2></div></div><div class="flow-steps"><div><b>01</b><strong>Cliente</strong><small>Cadastro comercial</small></div><i>→</i><div><b>02</b><strong>Orçamento</strong><small>Proposta e validade</small></div><i>→</i><div><b>03</b><strong>Pedido</strong><small>Venda aprovada</small></div><i>→</i><div><b>04</b><strong>Financeiro</strong><small>Conta a receber</small></div></div></article><article class="card phase4-status"><div class="card-head"><div><span class="section-label">PIPELINE</span><h2>Status</h2></div></div><div class="phase4-stat-row"><span>Orçamentos aprovados</span><strong>${approved}</strong></div><div class="phase4-stat-row"><span>Pedidos em aberto</span><strong>${open}</strong></div><div class="phase4-stat-row"><span>Pedidos faturados</span><strong>${d.orders.filter(x=>x.status==='invoiced').length}</strong></div></article></div><article class="card commercial-list"><div class="card-head"><div><span class="section-label">ÚLTIMAS OPERAÇÕES</span><h2>Pedidos de venda</h2></div><button class="link-btn" onclick="phase4Tab('orders')">Ver todos →</button></div>${orderRows(d.orders.slice(0,5))}</article>`);
  }
  function orderRows(rows){return rows.length?`<div class="commercial-table-head"><span>Pedido</span><span>Cliente</span><span>Data</span><span>Total</span><span>Status</span></div>${rows.map(o=>`<button class="commercial-row" onclick="openOrderDrawer('${esc(o.id)}')"><span><b>${esc(o.id)}</b><small>${fmtDate(o.created)}</small></span><span>${esc(o.customerName)}</span><span>${fmtDate(o.created)}</span><strong>${money(o.total)}</strong><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></button>`).join('')}`:'<div class="empty-state">Nenhum pedido de venda registrado.</div>'}

  /* ================= CLIENTES ================= */
  function customers(){
    const d=data(),q=custSearch.trim().toLowerCase();
    const filtered=d.customers.filter(x=>!q||`${x.name} ${x.document||''} ${x.email||''}`.toLowerCase().includes(q));
    let body;
    if(!d.customers.length)body=`<div class="empty-state"><b>Nenhum cliente cadastrado.</b><button class="btn primary" onclick="phase4Customer()">+ Cadastrar cliente</button></div>`;
    else if(!filtered.length)body=`<div class="empty-state">Nenhum cliente encontrado para "${esc(custSearch)}".<button class="btn tertiary" onclick="commercialClearCustomerSearch()">Limpar busca</button></div>`;
    else body=`<div class="commercial-table-head"><span>Cliente</span><span>Documento</span><span>Contato</span><span>Status</span><span></span></div>${filtered.map(x=>`<div class="commercial-row"><span><b>${esc(x.name)}</b><small>${esc(x.email||'')}</small></span><span>${esc(x.document||'—')}</span><span>${esc(x.phone||'—')}</span><em class="status-pill ${x.active===false?'inactive':'active'}">${x.active===false?'Inativo':'Ativo'}</em><span class="phase4-row-actions"><button class="row-action" onclick="openCustomerDrawer('${esc(x.id)}')">Ver</button><button class="row-action" onclick="phase4Customer('${esc(x.id)}')">Editar</button><button class="row-action danger" onclick="deleteCustomer('${esc(x.id)}')">Excluir</button></span></div>`).join('')}`;
    return shell('Clientes',`<article class="card commercial-list"><div class="card-head"><div><span class="section-label">BASE COMERCIAL</span><h2>Clientes</h2></div><button class="btn primary" onclick="phase4Customer()">+ Novo cliente</button></div><div class="filter-bar"><input type="search" placeholder="Buscar por nome, documento ou e-mail..." value="${esc(custSearch)}" oninput="commercialSetCustSearch(this.value)"></div>${body}</article>`);
  }

  /* ================= PRODUTOS ================= */
  function products(){
    const d=data(),q=prodSearch.trim().toLowerCase();
    const filtered=d.products.filter(x=>!q||`${x.name} ${x.sku||''} ${x.category||''}`.toLowerCase().includes(q));
    let body;
    if(!d.products.length)body=`<div class="empty-state"><b>Nenhum produto cadastrado.</b><button class="btn primary" onclick="phase4Product()">+ Cadastrar produto</button></div>`;
    else if(!filtered.length)body=`<div class="empty-state">Nenhum produto encontrado para "${esc(prodSearch)}".<button class="btn tertiary" onclick="commercialClearProdSearch()">Limpar busca</button></div>`;
    else body=`<div class="commercial-table-head"><span>Produto</span><span>SKU</span><span>Categoria</span><span>Preço</span><span></span></div>${filtered.map(x=>`<div class="commercial-row"><span><b>${esc(x.name)}</b><small>${esc(x.unit||'UN')}</small></span><span>${esc(x.sku||'—')}</span><span>${esc(x.category||'—')}</span><strong>${money(x.price)}</strong><span class="phase4-row-actions"><button class="row-action" onclick="phase4Product('${esc(x.id)}')">Editar</button><button class="row-action danger" onclick="deleteProduct('${esc(x.id)}')">Excluir</button></span></div>`).join('')}`;
    return shell('Produtos e serviços',`<article class="card commercial-list"><div class="card-head"><div><span class="section-label">CATÁLOGO</span><h2>Produtos</h2></div><button class="btn primary" onclick="phase4Product()">+ Novo produto</button></div><div class="filter-bar"><input type="search" placeholder="Buscar por nome, SKU ou categoria..." value="${esc(prodSearch)}" oninput="commercialSetProdSearch(this.value)"></div>${body}</article>`);
  }

  /* ================= ORÇAMENTOS ================= */
  function quotes(){
    const d=data(),q=quoteSearch.trim().toLowerCase();
    const filtered=d.quotes.filter(x=>!q||`${x.id} ${x.customerName}`.toLowerCase().includes(q));
    let body;
    if(!d.quotes.length)body=`<div class="empty-state"><b>Nenhum orçamento criado.</b><button class="btn primary" onclick="phase4Quote()">+ Criar orçamento</button></div>`;
    else if(!filtered.length)body=`<div class="empty-state">Nenhum orçamento encontrado para "${esc(quoteSearch)}".<button class="btn tertiary" onclick="commercialClearQuoteSearch()">Limpar busca</button></div>`;
    else body=`<div class="commercial-table-head"><span>Orçamento</span><span>Cliente</span><span>Validade</span><span>Total</span><span>Status</span></div>${filtered.map(x=>`<div class="commercial-row"><span><b>${esc(x.id)}</b><small>${fmtDate(x.created)}</small></span><span>${esc(x.customerName)}</span><span>${fmtDate(x.validUntil)}</span><strong>${money(x.total)}</strong><span class="phase4-row-actions"><em class="status-pill ${esc(x.status)}">${esc(x.statusLabel||'Enviado')}</em>${x.status!=='approved'?`<button class="row-action" onclick="phase4Approve('${esc(x.id)}')">Aprovar</button><button class="row-action danger" onclick="deleteQuote('${esc(x.id)}')">Excluir</button>`:''}</span></div>`).join('')}`;
    return shell('Orçamentos',`<article class="card commercial-list"><div class="card-head"><div><span class="section-label">PIPELINE DE VENDAS</span><h2>Orçamentos</h2></div><button class="btn primary" onclick="phase4Quote()">+ Novo orçamento</button></div><div class="filter-bar"><input type="search" placeholder="Buscar por número ou cliente..." value="${esc(quoteSearch)}" oninput="commercialSetQuoteSearch(this.value)"></div>${body}</article>`);
  }

  /* ================= PEDIDOS ================= */
  function orders(){
    const d=data(),q=orderSearch.trim().toLowerCase();
    let filtered=d.orders.filter(o=>!q||`${o.id} ${o.customerName}`.toLowerCase().includes(q));
    if(orderStatus!=='all')filtered=filtered.filter(o=>(o.status||'open')===orderStatus);
    const total=d.orders.length,openCount=d.orders.filter(o=>o.status!=='invoiced').length,invoicedCount=d.orders.filter(o=>o.status==='invoiced').length;
    const summary=`<div class="phase4-kpis">${k('Total de pedidos',total,'todos os registros')}${k('Em aberto',openCount,'aguardando faturamento','warning')}${k('Faturados',invoicedCount,'convertidos em conta a receber','success')}</div>`;
    const filterBar=`<div class="filter-bar"><input type="search" placeholder="Buscar por número ou cliente..." value="${esc(orderSearch)}" oninput="commercialSetOrderSearch(this.value)"><button class="filter ${orderStatus==='all'?'active':''}" onclick="commercialSetOrderStatus('all')">Todos</button><button class="filter ${orderStatus==='open'?'active':''}" onclick="commercialSetOrderStatus('open')">Em aberto</button><button class="filter ${orderStatus==='invoiced'?'active':''}" onclick="commercialSetOrderStatus('invoiced')">Faturados</button>${(orderSearch||orderStatus!=='all')?`<button class="clear-filters" onclick="commercialClearOrderFilters()">Limpar filtros</button>`:''}</div>`;
    let body;
    if(!total)body=`<div class="empty-state"><b>Você ainda não possui pedidos.</b><button class="btn primary" onclick="phase4Quote()">+ Criar pedido</button></div>`;
    else if(!filtered.length)body=`<div class="empty-state">Nenhum pedido encontrado com estes filtros.<button class="btn tertiary" onclick="commercialClearOrderFilters()">Limpar filtros</button></div>`;
    else body=`<div class="commercial-table-head"><span>Pedido</span><span>Cliente</span><span>Data</span><span>Total</span><span>Status</span></div>${filtered.map(o=>`<button class="commercial-row" onclick="openOrderDrawer('${esc(o.id)}')"><span><b>${esc(o.id)}</b><small>${fmtDate(o.created)}</small></span><span>${esc(o.customerName)}</span><span>${fmtDate(o.created)}</span><strong>${money(o.total)}</strong><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></button>`).join('')}`;
    return shell('Pedidos de venda',`${summary}<article class="card commercial-list"><div class="card-head"><div><span class="section-label">VENDAS</span><h2>Pedidos</h2></div></div>${filterBar}${body}</article>`);
  }

  /* ================= DRAWER: PEDIDO ================= */
  function orderDrawer(id){
    const d=data(),o=d.orders.find(x=>x.id===id);
    if(!o){detailOrderId=null;return '';}
    const q=quoteOf(d,o),customer=customerOfOrder(d,o),product=q?d.products.find(p=>p.id===q.productId):null;
    const canInvoice=o.status!=='invoiced';
    return `<div class="drawer-backdrop" onclick="if(event.target===this)closeOrderDrawer()"><aside class="drawer">
      <div class="drawer-header"><div><span class="section-label">PEDIDO</span><h2>${esc(o.id)}</h2></div><button class="drawer-close" onclick="closeOrderDrawer()" aria-label="Fechar">×</button></div>
      <div class="drawer-body">
        <div class="detail-grid">
          <div><span class="detail-label">Cliente</span><b>${esc(o.customerName)||'—'}</b>${customer?`<button class="btn tertiary" onclick="closeOrderDrawer();openCustomerDrawer('${esc(customer.id)}')">Ver cliente →</button>`:''}</div>
          <div><span class="detail-label">Data do pedido</span><b>${fmtDate(o.created)}</b></div>
          <div><span class="detail-label">Status</span><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></div>
          <div><span class="detail-label">Valor total</span><b>${money(o.total)}</b></div>
        </div>
        <h3 class="drawer-section-title">Itens</h3>
        ${product?`<div class="mini-table-head"><span>Produto</span><span>Qtd.</span><span>Preço unit.</span><span>Subtotal</span></div><div class="mini-row"><span>${esc(product.name)}</span><span>${esc(q.qty)}</span><span>${money(product.price)}</span><strong>${money(o.total)}</strong></div>`:'<div class="empty-state">Item de origem não encontrado.</div>'}
        <h3 class="drawer-section-title">Resumo financeiro</h3>
        <div class="detail-grid"><div><span class="detail-label">Total do pedido</span><b>${money(o.total)}</b></div></div>
        <h3 class="drawer-section-title">Histórico</h3>
        <ul class="detail-timeline"><li><b>${fmtDate(o.created)}</b> — Pedido criado a partir do orçamento ${esc(o.quoteId||'—')}</li>${o.status==='invoiced'?`<li><b>—</b> — Faturado: conta a receber gerada no Financeiro</li>`:''}</ul>
      </div>
      <div class="drawer-footer"><button class="btn ghost" onclick="closeOrderDrawer()">Fechar</button>${canInvoice?`<button class="btn primary" onclick="invoiceOrder('${esc(o.id)}')">Faturar pedido</button>`:`<button class="btn secondary" onclick="window.route('financial')">Ver no Financeiro →</button>`}</div>
    </aside></div>`;
  }

  /* ================= DRAWER: CLIENTE ================= */
  function customerDrawer(id){
    const d=data(),c=d.customers.find(x=>x.id===id);
    if(!c){detailCustomerId=null;return '';}
    const myOrders=(ordersByCustomer(d)[id]||[]).slice().sort((a,b)=>(b.created||'').localeCompare(a.created||''));
    return `<div class="drawer-backdrop" onclick="if(event.target===this)closeCustomerDrawer()"><aside class="drawer">
      <div class="drawer-header"><div><span class="section-label">CLIENTE</span><h2>${esc(c.name)}</h2></div><button class="drawer-close" onclick="closeCustomerDrawer()" aria-label="Fechar">×</button></div>
      <div class="drawer-body">
        <div class="detail-grid">
          <div><span class="detail-label">Documento</span><b>${esc(c.document)||'—'}</b></div>
          <div><span class="detail-label">Status</span><em class="status-pill ${c.active===false?'inactive':'active'}">${c.active===false?'Inativo':'Ativo'}</em></div>
          <div><span class="detail-label">E-mail</span><b>${esc(c.email)||'—'}</b></div>
          <div><span class="detail-label">Telefone</span><b>${esc(c.phone)||'—'}</b></div>
          <div style="grid-column:1/-1"><span class="detail-label">Endereço</span><b>${esc(c.address)||'—'}</b></div>
        </div>
        <h3 class="drawer-section-title">Pedidos deste cliente</h3>
        ${myOrders.length?`<div class="mini-table-head"><span>Pedido</span><span>Data</span><span>Valor</span><span>Status</span></div>${myOrders.map(o=>`<button class="mini-row" onclick="closeCustomerDrawer();openOrderDrawer('${esc(o.id)}')"><span>${esc(o.id)}</span><span>${fmtDate(o.created)}</span><strong>${money(o.total)}</strong><em class="status-pill ${esc(o.status||'open')}">${esc(o.statusLabel||'Em aberto')}</em></button>`).join('')}`:'<div class="empty-state">Nenhum pedido deste cliente ainda.</div>'}
      </div>
      <div class="drawer-footer"><button class="btn ghost" onclick="closeCustomerDrawer()">Fechar</button><button class="btn primary" onclick="closeCustomerDrawer();phase4Customer('${esc(c.id)}')">Editar cliente</button></div>
    </aside></div>`;
  }

  /* ================= FORMULÁRIOS (existentes, com validação inline) ================= */
  function fieldErr(msg){return msg?`<span class="field-message">${esc(msg)}</span>`:''}
  function customerForm(id,errors){
    const x=data().customers.find(v=>v.id===id)||{active:true};errors=errors||{};
    return modal(id?'Editar cliente':'Novo cliente',`<form onsubmit="phase4SaveCustomer(event,'${esc(id||'')}')" novalidate><label class="${errors.name?'field-error':''}">Nome / razão social<input name="name" value="${esc(x.name)}" required>${fieldErr(errors.name)}</label><div class="form-grid"><label>CPF / CNPJ<input name="document" value="${esc(x.document)}"></label><label>Telefone<input name="phone" value="${esc(x.phone)}"></label></div><label class="${errors.email?'field-error':''}">E-mail<input name="email" type="email" value="${esc(x.email)}">${fieldErr(errors.email)}</label><label>Endereço<input name="address" value="${esc(x.address)}"></label><label class="checkbox-field"><input type="checkbox" name="active" ${x.active!==false?'checked':''}> Cliente ativo</label><div class="modal-actions"><button type="button" class="btn ghost" onclick="commercialClose()">Cancelar</button><button class="btn primary">Salvar cliente</button></div></form>`);
  }
  function productForm(id,errors){
    const x=data().products.find(v=>v.id===id)||{};errors=errors||{};
    return modal(id?'Editar produto':'Novo produto',`<form onsubmit="phase4SaveProduct(event,'${esc(id||'')}')" novalidate><label class="${errors.name?'field-error':''}">Descrição<input name="name" value="${esc(x.name)}" required>${fieldErr(errors.name)}</label><div class="form-grid"><label>SKU<input name="sku" value="${esc(x.sku)}"></label><label>Unidade<input name="unit" value="${esc(x.unit||'UN')}"></label></div><div class="form-grid"><label>Categoria<input name="category" value="${esc(x.category)}"></label><label class="${errors.price?'field-error':''}">Preço de venda<input name="price" inputmode="decimal" value="${x.price||''}" required>${fieldErr(errors.price)}</label></div><div class="modal-actions"><button type="button" class="btn ghost" onclick="commercialClose()">Cancelar</button><button class="btn primary">Salvar produto</button></div></form>`);
  }
  function quoteForm(errors){
    const d=data();errors=errors||{};
    return modal('Novo orçamento',`<form onsubmit="phase4SaveQuote(event)" novalidate><label class="${errors.customer?'field-error':''}">Cliente<select name="customer" required>${d.customers.length?`<option value="">Selecione...</option>${d.customers.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}`:'<option value="">Cadastre um cliente primeiro</option>'}</select>${fieldErr(errors.customer)}</label><label class="${errors.product?'field-error':''}">Produto<select name="product" required>${d.products.length?`<option value="">Selecione...</option>${d.products.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} — ${money(x.price)}</option>`).join('')}`:'<option value="">Cadastre um produto primeiro</option>'}</select>${fieldErr(errors.product)}</label><div class="form-grid"><label>Quantidade<input name="qty" type="number" min="1" value="1" required></label><label>Validade<input name="validUntil" type="date" required></label></div><div class="quote-total-preview" id="quote-total-preview"></div><div class="modal-actions"><button type="button" class="btn ghost" onclick="commercialClose()">Cancelar</button><button class="btn primary">Criar orçamento</button></div></form>`);
  }

  /* ================= AÇÕES GLOBAIS ================= */
  window.phase4Tab=t=>{tab=t;detailOrderId=null;detailCustomerId=null;render()};
  window.phase4New=()=>tab==='customers'?window.phase4Customer():tab==='products'?window.phase4Product():window.phase4Quote();
  window.phase4Customer=id=>document.body.insertAdjacentHTML('beforeend',customerForm(id));
  window.phase4Product=id=>document.body.insertAdjacentHTML('beforeend',productForm(id));
  window.phase4Quote=()=>{document.body.insertAdjacentHTML('beforeend',quoteForm());wireQuotePreview()};
  window.commercialClose=()=>document.getElementById('commercial-modal')?.remove();

  window.commercialSetCustSearch=v=>{custSearch=v;render()};
  window.commercialClearCustomerSearch=()=>{custSearch='';render()};
  window.commercialSetProdSearch=v=>{prodSearch=v;render()};
  window.commercialClearProdSearch=()=>{prodSearch='';render()};
  window.commercialSetQuoteSearch=v=>{quoteSearch=v;render()};
  window.commercialClearQuoteSearch=()=>{quoteSearch='';render()};
  window.commercialSetOrderSearch=v=>{orderSearch=v;render()};
  window.commercialSetOrderStatus=s=>{orderStatus=s;render()};
  window.commercialClearOrderFilters=()=>{orderSearch='';orderStatus='all';render()};

  window.openOrderDrawer=id=>{detailOrderId=id;detailCustomerId=null;render()};
  window.closeOrderDrawer=()=>{detailOrderId=null;render()};
  window.openCustomerDrawer=id=>{detailCustomerId=id;detailOrderId=null;render()};
  window.closeCustomerDrawer=()=>{detailCustomerId=null;render()};

  window.phase4SaveCustomer=(e,id)=>{
    e.preventDefault();
    const f=new FormData(e.target),errors={};
    const name=String(f.get('name')||'').trim();
    if(!name)errors.name='Informe o nome ou razão social.';
    const email=String(f.get('email')||'').trim();
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.email='Informe um e-mail válido.';
    if(Object.keys(errors).length){commercialClose();document.body.insertAdjacentHTML('beforeend',customerForm(id,errors));return;}
    const a=data().customers,x={id:id||uid('CLI'),name,document:String(f.get('document')||'').trim(),email,phone:String(f.get('phone')||'').trim(),address:String(f.get('address')||'').trim(),active:f.get('active')==='on'};
    const i=a.findIndex(v=>v.id===id);i>=0?a[i]=x:a.unshift(x);
    write(K.customers,a);commercialClose();tab='customers';render();toast(id?'Cliente atualizado.':'Cliente criado.');
  };
  window.phase4SaveProduct=(e,id)=>{
    e.preventDefault();
    const f=new FormData(e.target),errors={};
    const name=String(f.get('name')||'').trim();
    if(!name)errors.name='Informe a descrição do produto.';
    const raw=String(f.get('price')||'').replace(/\./g,'').replace(',','.'),price=Number(raw);
    if(!Number.isFinite(price)||price<0)errors.price='Informe um preço válido.';
    if(Object.keys(errors).length){commercialClose();document.body.insertAdjacentHTML('beforeend',productForm(id,errors));return;}
    const a=data().products,x={id:id||uid('PRD'),name,sku:String(f.get('sku')||'').trim(),unit:String(f.get('unit')||'').trim()||'UN',category:String(f.get('category')||'').trim(),price};
    const i=a.findIndex(v=>v.id===id);i>=0?a[i]=x:a.unshift(x);
    write(K.products,a);commercialClose();tab='products';render();toast(id?'Produto atualizado.':'Produto criado.');
  };
  window.phase4SaveQuote=e=>{
    e.preventDefault();
    const f=new FormData(e.target),d=data(),errors={};
    const c=d.customers.find(x=>x.id===f.get('customer')),p=d.products.find(x=>x.id===f.get('product')),qty=Number(f.get('qty'));
    if(!c)errors.customer='Selecione um cliente.';
    if(!p)errors.product='Selecione um produto.';
    if(Object.keys(errors).length){commercialClose();document.body.insertAdjacentHTML('beforeend',quoteForm(errors));wireQuotePreview();return;}
    d.quotes.unshift({id:uid('ORC'),customerId:c.id,customerName:c.name,productId:p.id,productName:p.name,qty,total:qty*p.price,validUntil:f.get('validUntil'),created:new Date().toISOString().slice(0,10),status:'sent',statusLabel:'Enviado'});
    write(K.quotes,d.quotes);commercialClose();tab='quotes';render();toast('Orçamento criado.');
  };
  window.phase4Approve=id=>{
    const d=data(),q=d.quotes.find(x=>x.id===id);if(!q)return;
    q.status='approved';q.statusLabel='Aprovado';
    const order={id:uid('PED'),quoteId:q.id,customerName:q.customerName,total:q.total,created:new Date().toISOString().slice(0,10),status:'open',statusLabel:'Em aberto'};
    d.orders.unshift(order);write(K.quotes,d.quotes);write(K.orders,d.orders);tab='orders';render();toast('Orçamento aprovado — pedido '+order.id+' criado.');
  };
  window.invoiceOrder=id=>{
    const d=data(),o=d.orders.find(x=>x.id===id);
    if(!o||o.status==='invoiced')return;
    const finance=read(K.finance);
    if(!finance.some(x=>x.sourceId===id)){
      finance.unshift({id:uid('FIN'),sourceId:id,type:'receivable',description:'Pedido '+id,party:o.customerName,value:o.total,date:new Date().toISOString().slice(0,10),due:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:'open'});
      write(K.finance,finance);
    }
    o.status='invoiced';o.statusLabel='Faturado';write(K.orders,d.orders);
    render();toast('Pedido faturado — conta a receber criada no Financeiro.');
  };

  /* ---- exclusão: bloqueia quando existiria órfão (seção 32 do briefing) ---- */
  window.deleteCustomer=id=>{
    const d=data(),c=d.customers.find(x=>x.id===id);if(!c)return;
    if(d.quotes.some(q=>q.customerId===id)){toast('Não é possível excluir: existem orçamentos/pedidos vinculados a este cliente.','error');return;}
    confirmAction('Excluir cliente?','"'+c.name+'" será removido permanentemente.','Excluir',()=>{
      write(K.customers,d.customers.filter(x=>x.id!==id));render();toast('Cliente excluído.');
    });
  };
  window.deleteProduct=id=>{
    const d=data(),p=d.products.find(x=>x.id===id);if(!p)return;
    if(d.quotes.some(q=>q.productId===id)){toast('Não é possível excluir: existem orçamentos/pedidos com este produto.','error');return;}
    confirmAction('Excluir produto?','"'+p.name+'" será removido permanentemente.','Excluir',()=>{
      write(K.products,d.products.filter(x=>x.id!==id));render();toast('Produto excluído.');
    });
  };
  window.deleteQuote=id=>{
    const d=data(),q=d.quotes.find(x=>x.id===id);if(!q)return;
    if(q.status==='approved'){toast('Não é possível excluir um orçamento já aprovado.','error');return;}
    confirmAction('Excluir orçamento?','"'+q.id+'" será removido permanentemente.','Excluir',()=>{
      write(K.quotes,d.quotes.filter(x=>x.id!==id));render();toast('Orçamento excluído.');
    });
  };

  window.phase4Export=()=>{const d=data(),rows=[['tipo','id','cliente','valor','data','status'],...d.orders.map(x=>['pedido',x.id,x.customerName,x.total,x.created,x.status]),...d.quotes.map(x=>['orcamento',x.id,x.customerName,x.total,x.created,x.status])],csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='estelar-comercial.csv';a.click();URL.revokeObjectURL(u)};

  function wireQuotePreview(){
    const form=document.querySelector('#commercial-modal form');if(!form)return;
    const out=document.getElementById('quote-total-preview');
    const update=()=>{
      const d=data(),p=d.products.find(x=>x.id===form.product.value),qty=Number(form.qty.value)||0;
      out.innerHTML=p?`<span>${esc(p.name)}</span><span>${qty} × ${money(p.price)}</span><strong>${money(qty*p.price)}</strong>`:'';
    };
    form.product.addEventListener('change',update);form.qty.addEventListener('input',update);update();
  }

  const previous=window.moduleView;
  window.moduleView=function(m){if(m.id!=='commercial'){detailOrderId=null;detailCustomerId=null;return previous(m);}return tab==='customers'?customers():tab==='products'?products():tab==='quotes'?quotes():tab==='orders'?orders():overview()};
  const oldRender=window.render;
  window.render=function(){oldRender();document.querySelectorAll('.module-icon').forEach(el=>{if(!el.querySelector('svg')&&el.textContent.trim())el.outerHTML=icon(el.textContent.trim())});document.querySelectorAll('.mobile-nav button b').forEach(b=>{if(!b.querySelector('svg'))b.outerHTML=icon(b.textContent.trim())})};
  /* app.js pinta a tela de forma síncrona, antes destas camadas existirem — sem isto, o
     primeiro paint do usuário mostra o dashboard com números inventados e ícones em texto puro. */
  window.render();
})();
