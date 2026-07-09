// 黑白名单 — 运营管理
window.Pages['risk-list'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    // 映射（对齐源站 node_34）
    function listKindText(k){ return k==='black'?'黑名单':k==='white'?'白名单':k; }
    function listKindColor(k){ return k==='black'?'#f87171':'#60a5fa'; }
    function typeText(t){ return {ip:'IP',device:'设备',email_domain:'邮箱域名',user:'用户'}[t] || t; }
    function statusText(s){ return s==='active'?'生效中':s==='revoked'?'已撤销':s; }
    function statusColor(s){ return s==='active'?'#4ade80':'gray'; }
    function sourceText(s){ return s==='auto'?'自动':s==='manual'?'手动':s; }
    const dash = v => (v==null || v==='') ? '—' : String(v);

    // 真实接口 NOT_FOUND（risk_list 为空）→ 用 REAL_SPEC 首行样例造种子数据，保证列结构可见
    const mock = (ctx.data.risk_list && ctx.data.risk_list.data && ctx.data.risk_list.data.items) || null;
    let all = (Array.isArray(mock) && mock.length) ? mock.slice() : [
      { id:33, listKind:'black', type:'device', value:'2fdba9d1d522cf4bb544ab46', reason:'auto_risk_ban: score=100', status:'active', source:'auto', createdBy:'', expiresAt:'', createdAt:'2026-06-11T04:33:10.000Z' },
      { id:31, listKind:'black', type:'ip', value:'203.0.113.45', reason:'auto_risk_ban: score=100', status:'active', source:'auto', createdBy:'', expiresAt:'', createdAt:'2026-06-10T08:12:44.000Z' },
      { id:28, listKind:'white', type:'email_domain', value:'gettranslation.app', reason:'内部测试域名', status:'active', source:'manual', createdBy:'admin', expiresAt:'', createdAt:'2026-06-08T02:20:01.000Z' },
      { id:22, listKind:'black', type:'email_domain', value:'tempmail.com', reason:'一次性邮箱域名', status:'revoked', source:'manual', createdBy:'admin', expiresAt:'', createdAt:'2026-06-05T15:40:30.000Z' },
    ];

    let filter = { listKind:'', type:'', value:'', status:'active' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['风控','黑白名单'], title:'黑白名单',
      desc:'管理 IP / 设备 / 邮箱域名 / 用户维度的黑白名单，实时影响风控引擎决策',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>openCreate()},['＋ 新增']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.listKind && r.listKind!==filter.listKind) return false;
        if(filter.type && r.type!==filter.type) return false;
        if(filter.value && !String(r.value||'').toLowerCase().includes(filter.value.toLowerCase())) return false;
        if(filter.status && r.status!==filter.status) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';

      const typeKindSel = h('select',{class:'select'},[
        ['','全部类型'],['black','黑名单'],['white','白名单']
      ].map(([v,t])=>h('option',{value:v},[t])));
      typeKindSel.value = filter.listKind;
      const dimSel = h('select',{class:'select'},[
        ['','全部维度'],['ip','IP'],['device','设备'],['email_domain','邮箱域名'],['user','用户']
      ].map(([v,t])=>h('option',{value:v},[t])));
      dimSel.value = filter.type;
      const valIn = h('input',{class:'input',placeholder:'搜索值',value:filter.value,style:{minWidth:'160px'}});
      const statusSel = h('select',{class:'select'},[
        ['active','生效中'],['revoked','已撤销'],['','全部状态']
      ].map(([v,t])=>h('option',{value:v},[t])));
      statusSel.value = filter.status;

      container.appendChild(ctx.FilterBar([
        typeKindSel, dimSel, valIn, statusSel,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ listKind:typeKindSel.value, type:dimSel.value, value:valIn.value.trim(), status:statusSel.value };
          page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{
          filter={ listKind:'', type:'', value:'', status:'active' };
          page=1; render();
        }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'ID', width:70, render:r=>ctx.IdCell(r.id, 18) },
          { title:'名单类型', width:100, align:'center', render:r=>Tag(listKindText(r.listKind), listKindColor(r.listKind)) },
          { title:'维度', width:100, render:r=>typeText(r.type) },
          { title:'值', width:200, render:r=>h('span',{class:'mono small',title:String(r.value||'')},[dash(r.value)]) },
          { title:'原因', width:180, render:r=>h('span',{class:'small',title:String(r.reason||'')},[dash(r.reason)]) },
          { title:'状态', width:90, align:'center', render:r=>Tag(statusText(r.status), statusColor(r.status)) },
          { title:'来源', width:70, render:r=>sourceText(r.source) },
          { title:'操作人', width:100, render:r=>dash(r.createdBy) },
          { title:'过期时间', width:170, render:r=>r.expiresAt?ctx.fmtISO(r.expiresAt):'—' },
          { title:'创建时间', width:170, render:r=>ctx.fmtISO(r.createdAt) },
          { title:'操作', width:100, align:'center', render:r=>
              r.status==='active'
                ? h('button',{class:'btn btn-sm btn-danger',onclick:()=>revoke(r)},['撤销'])
                : h('span',{class:'cell-muted'},['已撤销']) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    function revoke(r){
      const m = ctx.modal({
        title:'确认撤销？',
        body:[ h('div',{},[`将撤销 ${listKindText(r.listKind)} 中的 ${typeText(r.type)}「${r.value}」，撤销后该条目不再生效。`]) ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            r.status='revoked'; ctx.toast('success','已撤销'); m.close(); render();
          }},['确认撤销']),
        ],
      });
    }

    function openCreate(){
      const kindSel = h('select',{class:'select'},[
        ['black','黑名单'],['white','白名单']
      ].map(([v,t])=>h('option',{value:v},[t])));
      const dimSel = h('select',{class:'select'},[
        ['ip','IP'],['device','设备'],['email_domain','邮箱域名'],['user','用户']
      ].map(([v,t])=>h('option',{value:v},[t])));
      const valIn = h('input',{class:'input',placeholder:'IP 地址 / 设备 ID / 邮箱域名 / 用户 ID'});
      const reasonIn = h('input',{class:'input',placeholder:'加入原因（可选）'});
      const expIn = h('input',{class:'input',type:'date'});

      const field = (label, ctrl, hint) => h('div',{class:'field'},[
        h('label',{},[label]), ctrl, hint? h('span',{class:'small muted'},[hint]) : null,
      ]);

      const m = ctx.modal({
        title:'新增名单条目',
        body:[
          field('名单类型', kindSel),
          field('维度', dimSel),
          field('值 *', valIn),
          field('原因', reasonIn),
          field('过期时间', expIn, '留空表示永不过期'),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            if(!valIn.value.trim()){ ctx.toast('warning','请输入值'); return; }
            const nextId = (all.reduce((mx,r)=>Math.max(mx, Number(r.id)||0), 0) || 0) + 1;
            all.unshift({
              id:nextId, listKind:kindSel.value, type:dimSel.value, value:valIn.value.trim(),
              reason:reasonIn.value.trim(), status:'active', source:'manual', createdBy:'admin',
              expiresAt: expIn.value ? expIn.value+'T00:00:00.000Z' : '', createdAt:new Date().toISOString(),
            });
            ctx.toast('success','添加成功'); m.close(); page=1; render();
          }},['添加']),
        ],
      });
    }

    render();
  }
};
