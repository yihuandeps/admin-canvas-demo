// 系统权限 — 系统管理
window.Pages['permissions'] = {
  render(root, ctx){
    const { h } = ctx;
    const src = (ctx.data.rbac_permissions && (ctx.data.rbac_permissions.permissions||ctx.data.rbac_permissions.list)) || [];
    const all = src.map(p=>Object.assign({ code:(p.object||'')+':'+(p.action||'') }, p));
    const modules = Array.from(new Set(all.map(p=>p.module).filter(Boolean)));

    let filter = { kw:'', module:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['系统管理','系统权限'], title:'系统权限',
      desc:'浏览系统全部权限码及其归属模块，由后端统一维护，不可在此增删改',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(p=>{
        if(filter.module && p.module!==filter.module) return false;
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          if(!((p.code||'').toLowerCase().includes(k) || (p.name||'').toLowerCase().includes(k))) return false;
        }
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn=h('input',{class:'input',placeholder:'按权限码或名称搜索',value:filter.kw,style:{maxWidth:'320px',minWidth:'240px'}});
      const modSel=h('select',{class:'select'}, [h('option',{value:''},['全部模块'])].concat(modules.map(m=>h('option',{value:m},[m]))));
      modSel.value=filter.module;
      container.appendChild(ctx.FilterBar([
        kwIn, modSel,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kw:kwIn.value.trim(), module:modSel.value}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kw:'',module:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'模块', width:150, render:r=>r.module||'—' },
          { title:'权限码', width:260, render:r=>h('span',{class:'mono small'},[r.code||'—']) },
          { title:'权限名称', width:220, render:r=>r.name||'—' },
          { title:'描述', render:r=>r.description||'—' },
          { title:'更新时间', width:180, align:'center', render:r=>ctx.fmtISO(r.updatedAt) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    render();
  }
};
