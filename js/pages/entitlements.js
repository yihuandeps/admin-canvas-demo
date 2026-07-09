// 权益管理 — 商业化管理
window.Pages['entitlements'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const KIND = {
      point:{text:'每月赠送积分',color:'green'},
      commission_points:{text:'返佣积分',color:'amber'},
      model_access:{text:'可用模型',color:'blue'},
      model_concurrency:{text:'模型并发数',color:'purple'},
    };
    const CADENCE = {
      monthly_grant:'每月发放',
      one_time:'一次性发放',
      persistent:'长期生效',
    };
    function kindInfo(k){ return KIND[k] || {text:k||'—',color:'gray'}; }

    let all = ((ctx.data.entitlements && ctx.data.entitlements.list) || []).map(e=>({
      id:e.id, code:e.code, name:e.name, kind:e.kind, value:e.value,
      grantCadence:e.grantCadence, createdAtUnixSecond:e.createdAtUnixSecond,
      extra:e.extra || {},
    }));

    let filter = { kind:'' };   // 单输入框「按权益类型筛选」
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','权益管理'], title:'权益管理',
      desc:'管理订阅商品可附加的权益项，包括积分发放、模型访问与服务开通',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>openEdit(null)},['新建权益']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.kind){
          const t = kindInfo(r.kind).text;
          const k = filter.kind.toLowerCase();
          if(!(t.toLowerCase().includes(k) || (r.kind||'').toLowerCase().includes(k))) return false;
        }
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kindIn = h('input',{class:'input',placeholder:'按权益类型筛选',value:filter.kind,style:{minWidth:'200px'}});

      container.appendChild(ctx.FilterBar([
        kindIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kind:kindIn.value.trim()}; page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kind:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'权益码', width:140, render:r=>h('span',{class:'mono small'},[r.code||'—']) },
          { title:'权益名称', render:r=>r.name||'—' },
          { title:'权益类型', width:120, align:'center', render:r=>{ const i=kindInfo(r.kind); return Tag(i.text,i.color); } },
          { title:'权益值', width:160, render:r=>h('span',{class:'small'},[String(r.value??'—')]) },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtUnix(r.createdAtUnixSecond) },
          { title:'操作', width:120, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
            h('button',{class:'btn btn-sm',onclick:()=>openEdit(r)},['编辑']),
            h('button',{class:'btn btn-sm btn-danger',onclick:()=>confirmDel(r)},['删除']),
          ]) },
        ],
        rows:pageRows,
        empty:'暂无权益数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    function openEdit(r){
      const isNew = !r;
      const nameIn = h('input',{class:'input',placeholder:'展示用，如「基础版每月 1000 积分」',value:r?(r.name||''):''});
      const kindSel = h('select',{class:'select'},[
        ['point','每月赠送积分'],['commission_points','返佣积分'],
        ['model_access','可用模型'],['model_concurrency','模型并发数']
      ].map(([v,t])=>h('option',{value:v},[t])));
      kindSel.value = r?r.kind:'point';
      const valIn = h('input',{class:'input',placeholder:'权益值（积分数 / 并发数 / 模型名）',value:r?(r.value??''):''});
      const cadSel = h('select',{class:'select'},[
        ['monthly_grant','每月发放'],['one_time','一次性发放'],['persistent','长期生效']
      ].map(([v,t])=>h('option',{value:v},[t])));
      cadSel.value = r?r.grantCadence:'monthly_grant';

      const m = ctx.modal({
        title: isNew?'新建权益':'编辑权益',
        body:[
          h('div',{class:'field'},[h('label',{},['权益名称']), nameIn]),
          h('div',{class:'field'},[h('label',{},['权益类型']), kindSel]),
          h('div',{class:'field'},[h('label',{},['权益值']), valIn]),
          h('div',{class:'field'},[h('label',{},['发放节奏']), cadSel]),
          isNew? h('div',{class:'small muted'},['权益码由系统自动生成（QY- + 6 位随机码），不可修改'])
               : h('div',{class:'field'},[h('label',{},['权益码']), (()=>{ const c=h('input',{class:'input',value:r.code||''}); c.disabled=true; return c; })()]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            if(!nameIn.value.trim()){ ctx.toast('warning','请输入权益名称'); return; }
            if(isNew){
              const code = 'QY-' + Array.from({length:6},()=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join('');
              all.unshift({ id:'local-'+Date.now(), code, name:nameIn.value.trim(),
                kind:kindSel.value, value:valIn.value.trim(), grantCadence:cadSel.value,
                createdAtUnixSecond:Math.floor(Date.now()/1000), extra:{} });
              ctx.toast('success','创建成功');
            } else {
              r.name=nameIn.value.trim(); r.kind=kindSel.value; r.value=valIn.value.trim(); r.grantCadence=cadSel.value;
              ctx.toast('success','编辑成功');
            }
            m.close(); page=1; render();
          }},['确定']),
        ],
      });
    }

    function confirmDel(r){
      const m = ctx.modal({
        title:'确认删除权益',
        body:[h('div',{},['确认删除该权益「'+(r.name||r.code)+'」？']),
              h('div',{class:'small muted mt8'},['删除后不可恢复'])],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            all = all.filter(x=>x.id!==r.id);
            ctx.toast('success','删除成功'); m.close(); render();
          }},['确认']),
        ],
      });
    }

    render();
  }
};
