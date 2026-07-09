/* ============================================================
   core.js — 复刻版运行核心
   职责：DOM 工具、登录态、hash 路由、侧边栏渲染、顶栏、
        以及给页面模块复用的共享组件（PageHeader/DataTable/
        FilterBar/Tag/Modal/Toast/Pager/Segmented 等）。
   页面模块约定：window.Pages['<key>'] = { title, breadcrumb, desc, render(root, ctx) }
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM 工具 h() ---------- */
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v);
    }
    if (children != null) appendChildren(el, children);
    return el;
  }
  function appendChildren(el, c) {
    if (Array.isArray(c)) c.forEach(x => appendChildren(el, x));
    else if (c == null || c === false) return;
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  const $ = (sel, root) => (root || document).querySelector(sel);

  /* ---------- 图标（精简 lucide 子集） ---------- */
  const ICONS = {
    home:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    file:'<path d="M14 3v5h5"/><path d="M5 3h9l5 5v13H5z"/>',
    bag:'<path d="M6 2 3 6v14h18V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    package:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    building:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M10 21v-4h4v4"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M21 20c0-2-1.5-4-4-4.5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 4 4M20 20l-1-1M5 19l-1 1M20 4l-1 1"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    chevron:'<path d="m9 6 6 6-6 6"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    ban:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    trash:'<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/>',
    lock:'<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  };
  function icon(name, size) {
    const s = size || 18;
    return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
  }

  /* ---------- 登录态 ---------- */
  const AUTH = {
    USER:{ username:'admin', nick:'管理员', role:'管理员' },
    PASS:'Knight@123456',
    isLoggedIn(){ return localStorage.getItem('ac_replica_login') === '1'; },
    login(u,p){ if(u==='admin'&&p===this.PASS){ localStorage.setItem('ac_replica_login','1'); return true;} return false; },
    logout(){ localStorage.removeItem('ac_replica_login'); location.hash='#/login'; renderApp(); },
  };

  /* ---------- 主题 ---------- */
  function getTheme(){ return localStorage.getItem('ac-theme')==='light'?'light':'dark'; }
  function applyTheme(m){
    const root=document.documentElement;
    root.classList.remove('ac-dark','ac-light');
    root.classList.add(m==='light'?'ac-light':'ac-dark');
    localStorage.setItem('ac-theme',m);
  }

  /* ---------- Toast ---------- */
  let toastWrap;
  function toast(type, msg){
    if(!toastWrap){ toastWrap=h('div',{class:'toast-wrap'}); document.body.appendChild(toastWrap); }
    const t=h('div',{class:'toast '+(type||'info')},[msg]);
    toastWrap.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 2200);
  }

  /* ---------- Modal ---------- */
  function modal(opts){
    // opts: { title, body(node), footer(node|array), size }
    const mask=h('div',{class:'modal-mask', onclick:e=>{ if(e.target===mask) close(); }});
    const box=h('div',{class:'modal'+(opts.size==='lg'?' lg':'')});
    box.appendChild(h('div',{class:'modal-head'},[h('h3',{},[opts.title||'']),
      h('button',{class:'icon-btn right', onclick:close, html:'✕'})]));
    const body=h('div',{class:'modal-body'});
    appendChildren(body, typeof opts.body==='function'?opts.body():opts.body);
    box.appendChild(body);
    if(opts.footer){ const f=h('div',{class:'modal-foot'}); appendChildren(f, opts.footer); box.appendChild(f); }
    mask.appendChild(box); document.body.appendChild(mask);
    function close(){ mask.remove(); opts.onClose&&opts.onClose(); }
    return { close, mask, box };
  }

  /* ---------- 共享组件 ---------- */
  function PageHeader(o){
    // o: { title, desc, breadcrumb:[...], actions:[node] }
    const bc = o.breadcrumb && o.breadcrumb.length
      ? h('div',{class:'breadcrumb'}, o.breadcrumb.flatMap((b,i)=> i? [h('span',{class:'sep'},['>']), h('span',{},[b])] : [h('span',{},[b])]))
      : null;
    return h('div',{class:'page-header'},[
      bc,
      h('div',{class:'row'},[
        h('div',{class:'flex1'},[
          h('div',{class:'page-title'},[o.title]),
          o.desc? h('div',{class:'page-desc'},[o.desc]) : null,
        ]),
        o.actions? h('div',{class:'row gap10'}, o.actions): null,
      ]),
    ]);
  }

  function Tag(text, color){
    // color: hex 或 预设名
    const map={ blue:'#60a5fa', green:'#4ade80', red:'#f87171', gray:'#6e6e6e', amber:'#f59e0b', purple:'#a78bfa' };
    const c = map[color] || color || '#8c8c8c';
    return h('span',{class:'tag', style:{ color:c, background:c+'1f', borderColor:c+'40' }},[text]);
  }

  function Segmented(options, value, onChange){
    // options: [{label,value}]
    const wrap=h('div',{class:'segmented'});
    options.forEach(o=>{
      wrap.appendChild(h('button',{class: o.value===value?'active':'', onclick:()=>onChange(o.value)},[o.label]));
    });
    return wrap;
  }

  function Pager(state, onPage, onPageSize){
    // state: { page, pageSize, total }；与源站一致：共 N 条 每页[10/20/50/100]条 … X / Y
    const ps=state.pageSize||10;
    const totalPages=Math.max(1, Math.ceil((state.total||0)/ps));
    const sizeSel=h('select',{class:'select', style:{width:'auto',minWidth:'68px',padding:'4px 8px'},
      onchange:e=>onPageSize&&onPageSize(parseInt(e.target.value,10))},
      [10,20,50,100].map(n=>h('option',{value:n},[String(n)])));
    sizeSel.value=String(ps);
    return h('div',{class:'table-foot'},[
      h('span',{},['共 ', String(state.total||0),' 条']),
      h('span',{class:'row gap6',style:{alignItems:'center'}},['每页 ', sizeSel, ' 条']),
      h('span',{class:'spacer'}),
      h('div',{class:'pager'},[
        h('button',{disabled: state.page<=1, onclick:()=>onPage(state.page-1), html:'‹'}),
        h('span',{style:{padding:'0 8px'}},[state.page+' / '+totalPages]),
        h('button',{disabled: state.page>=totalPages, onclick:()=>onPage(state.page+1), html:'›'}),
      ]),
    ]);
  }

  function DataTable(o){
    // o: { columns:[{key,title,width,align,render(row)}], rows:[], empty }
    const wrap=h('div',{class:'table-wrap'});
    const table=h('table',{class:'dt'});
    const thead=h('thead',{},[h('tr',{}, o.columns.map(c=>
      h('th',{class: c.align==='center'?'center':'', style: c.width?{width:c.width+'px'}:null},[c.title])))]);
    table.appendChild(thead);
    const tbody=h('tbody');
    if(!o.rows || !o.rows.length){
      tbody.appendChild(h('tr',{},[h('td',{colspan:o.columns.length},[h('div',{class:'empty-state'},[o.empty||'暂无数据'])])]));
    } else {
      o.rows.forEach(row=>{
        tbody.appendChild(h('tr',{}, o.columns.map(c=>{
          const td=h('td',{class: c.align==='center'?'center':''});
          const content = c.render? c.render(row) : (row[c.key] ?? '—');
          appendChildren(td, content==null||content===''? '—' : content);
          return td;
        })));
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    if(o.pager) wrap.appendChild(Pager(o.pager, o.onPage||(()=>{}), o.onPageSize));
    return wrap;
  }

  // ID 单元格：等宽截断 + 复制按钮（源站多处用）
  function IdCell(id, len){
    if(id==null||id==='') return '—';
    const s=String(id); const show = (len&&s.length>len)? s.slice(0,len)+'…' : s;
    return h('span',{class:'id-cell'},[
      h('span',{class:'mono small'},[show]),
      h('button',{class:'copy-btn', title:'复制', html:'⧉', onclick:()=>{
        (navigator.clipboard?navigator.clipboard.writeText(s):Promise.resolve()).then(()=>toast('success','已复制')).catch(()=>toast('success','已复制'));
      }}),
    ]);
  }

  function FilterBar(children){ return h('div',{class:'filter-bar'}, children); }
  function StatCard(o){
    return h('div',{class:'stat-card'},[
      h('div',{class:'stat-label'},[o.label]),
      h('div',{class:'stat-value'},[o.value]),
      o.sub? h('div',{class:'stat-sub'},[o.sub]):null,
    ]);
  }
  function Toggle(on, onChange){
    const t=h('div',{class:'toggle'+(on?' on':''), onclick:()=>{ const nv=!t.classList.contains('on'); t.classList.toggle('on',nv); onChange&&onChange(nv); }});
    return t;
  }

  /* ---------- 时间格式化 ----------
     源站多数页面用「YYYY-MM-DD HH:mm:ss」(横杠+秒)，少数(视频审核/邀请历史/商单)用「YYYY/MM/DD HH:mm」。
     默认 fmt* 输出横杠带秒；需要斜杠分钟粒度时用 *Slash。 */
  const p2=n=>String(n).padStart(2,'0');
  function dash(d,sec){ if(isNaN(+d)) return '—'; const b=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; return sec===false?b:b+':'+p2(d.getSeconds()); }
  function slash(d){ if(isNaN(+d)) return '—'; return `${d.getFullYear()}/${p2(d.getMonth()+1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; }
  function fmtUnix(sec){ if(!sec) return '—'; return dash(new Date(sec*1000)); }            // YYYY-MM-DD HH:mm:ss
  function fmtISO(iso){ if(!iso) return '—'; return dash(new Date(iso)); }                   // YYYY-MM-DD HH:mm:ss
  function fmtUnixMin(sec){ if(!sec) return '—'; return dash(new Date(sec*1000),false); }    // YYYY-MM-DD HH:mm
  function fmtISOMin(iso){ if(!iso) return '—'; return dash(new Date(iso),false); }          // YYYY-MM-DD HH:mm
  function fmtDateOnly(v){ const d=typeof v==='number'?new Date(v*1000):new Date(v); if(isNaN(+d)) return '—'; return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`; }
  function fmtUnixSlash(sec){ if(!sec) return '—'; return slash(new Date(sec*1000)); }        // YYYY/MM/DD HH:mm
  function fmtISOSlash(iso){ if(!iso) return '—'; return slash(new Date(iso)); }
  function fmtDate(d){ return slash(d); } // 兼容旧调用（视频审核用斜杠）

  /* ---------- 提供给页面模块的 ctx ---------- */
  const ctx = {
    h, $, icon, toast, modal, PageHeader, Tag, Segmented, Pager, DataTable, IdCell,
    FilterBar, StatCard, Toggle,
    fmtUnix, fmtISO, fmtUnixMin, fmtISOMin, fmtDateOnly, fmtUnixSlash, fmtISOSlash, fmtDate,
    get data(){ return window.MOCK || {}; },
    navigate(path){ location.hash='#'+path; },
    notImpl(name){ return h('div',{class:'panel'},[h('div',{class:'muted'},['「'+name+'」页面占位 —— 已接入路由与菜单，页面明细可按需补全。'])]); },
  };
  window.AC = { ctx, toast, modal, h, icon };

  /* ---------- 侧边栏 ---------- */
  function renderSidebar(activePath){
    const nav=h('div',{class:'sidebar-nav'});
    window.MENU.forEach(group=>{
      if(group.title) nav.appendChild(h('div',{class:'nav-group-label'},[group.title]));
      group.items.forEach(item=>{
        if(item.children){
          const open = item.children.some(c=>c.path===activePath);
          const groupEl=h('div',{class:'nav-group'+(open?' open':'')});
          const header=h('div',{class:'nav-item', onclick:()=>groupEl.classList.toggle('open')},[
            h('span',{class:'ic', html:icon(item.icon)}),
            h('span',{},[item.label]),
            h('span',{class:'chev', html:icon('chevron',14)}),
          ]);
          groupEl.appendChild(header);
          const kids=h('div',{class:'nav-children'});
          item.children.forEach(c=>{
            kids.appendChild(h('div',{class:'nav-item'+(c.path===activePath?' active':''), onclick:()=>{ location.hash='#'+c.path; }},[c.label]));
          });
          groupEl.appendChild(kids);
          nav.appendChild(groupEl);
        } else {
          nav.appendChild(h('div',{class:'nav-item'+(item.path===activePath?' active':''), onclick:()=>{ location.hash='#'+item.path; }},[
            h('span',{class:'ic', html:icon(item.icon)}),
            h('span',{},[item.label]),
          ]));
        }
      });
    });

    const theme=getTheme();
    return h('div',{class:'sidebar'},[
      h('div',{class:'sidebar-brand'},[
        h('div',{class:'brand-logo'},['S']),
        h('div',{class:'brand-name'},['Admin Canvas']),
        h('div',{class:'brand-badge'},['测试']),
      ]),
      nav,
      h('div',{class:'sidebar-foot'},[
        h('img',{class:'avatar', src:'https://qmplusimg.henrongyi.top/gva_header.jpg'}),
        h('div',{class:'flex1'},[
          h('div',{class:'foot-name'},['管理员']),
          h('div',{class:'foot-role'},['admin']),
        ]),
        h('button',{class:'icon-btn', title:'切换主题', html:icon(theme==='dark'?'sun':'moon'),
          onclick:()=>{ applyTheme(getTheme()==='dark'?'light':'dark'); renderApp(); }}),
        h('button',{class:'icon-btn', title:'退出登录', html:icon('logout'), onclick:()=>AUTH.logout()}),
      ]),
    ]);
  }

  /* ---------- 登录页 ---------- */
  function renderLogin(mount){
    let err='';
    const errEl=h('div',{class:'login-err'},[err]);
    const uIn=h('input',{class:'input', placeholder:'用户名', value:'admin'});
    const pIn=h('input',{class:'input', type:'password', placeholder:'密码'});
    function submit(){
      if(AUTH.login(uIn.value.trim(), pIn.value)){ location.hash='#/home'; renderApp(); }
      else { errEl.textContent='用户名或密码错误'; }
    }
    pIn.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
    mount.appendChild(h('div',{class:'login-wrap'},[
      h('div',{class:'login-card'},[
        h('div',{class:'login-logo'},['S']),
        h('div',{class:'login-title'},['Admin Canvas']),
        h('div',{class:'login-sub'},['canvas 运营管理后台 · 本地复刻版']),
        h('div',{class:'col gap14'},[
          h('div',{class:'field'},[h('label',{},['用户名']), uIn]),
          h('div',{class:'field'},[h('label',{},['密码']), pIn]),
          errEl,
          h('button',{class:'btn btn-primary', style:{width:'100%',padding:'10px'}, onclick:submit},['登 录']),
          h('div',{class:'small muted', style:{textAlign:'center'}},['admin / Knight@123456']),
        ]),
      ]),
    ]));
  }

  /* ---------- 主框架渲染 ---------- */
  function renderApp(){
    applyTheme(getTheme());
    const app=$('#app');
    app.innerHTML='';
    let hash=location.hash.replace(/^#/,'')||'/home';
    if(hash==='/'||hash==='') hash='/home';

    if(!AUTH.isLoggedIn() && hash!=='/login'){ location.hash='#/login'; hash='/login'; }
    if(hash==='/login'){ if(AUTH.isLoggedIn()){ location.hash='#/home'; hash='/home'; } else { renderLogin(app); return; } }

    const shell=h('div',{class:'app-shell'});
    shell.appendChild(renderSidebar(hash));
    const main=h('div',{class:'main'});
    const inner=h('div',{class:'main-inner'});
    main.appendChild(inner);
    shell.appendChild(main);
    app.appendChild(shell);

    const key = window.ROUTE_KEY[hash];
    const page = key && window.Pages && window.Pages[key];
    if(page){
      try { page.render(inner, ctx); }
      catch(e){ console.error(e); inner.appendChild(h('div',{class:'panel'},['页面渲染出错：'+e.message])); }
    } else {
      // 找菜单 label 作占位
      let label=hash;
      window.MENU.forEach(g=>g.items.forEach(it=>{
        if(it.path===hash) label=it.label;
        (it.children||[]).forEach(c=>{ if(c.path===hash) label=c.label; });
      }));
      inner.appendChild(PageHeader({title:label}));
      inner.appendChild(ctx.notImpl(label));
    }
    main.scrollTop=0;
  }

  window.addEventListener('hashchange', renderApp);
  window.renderApp = renderApp;
  document.addEventListener('DOMContentLoaded', renderApp);
  if(document.readyState!=='loading') renderApp();
})();
