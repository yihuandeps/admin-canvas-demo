// 角色管理 — 系统管理
window.Pages['roles'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const src = (ctx.data.rbac_roles && (ctx.data.rbac_roles.roles||ctx.data.rbac_roles.list)) || [];
    let all = src.map(r=>Object.assign({}, r));

    let filter = { kw:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['系统管理','角色管理'], title:'角色管理',
      desc:'管理系统 RBAC 角色的增删改与权限分配',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>edit(null)},['新建角色']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          if(!((r.name||'').toLowerCase().includes(k) || (r.displayName||'').toLowerCase().includes(k))) return false;
        }
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn=h('input',{class:'input',placeholder:'角色英文标识 / 显示名',value:filter.kw,style:{minWidth:'240px'}});
      container.appendChild(ctx.FilterBar([
        kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kw:kwIn.value.trim()}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kw:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'角色英文标识', width:160, render:r=>h('span',{class:'mono small'},[r.name||'—']) },
          { title:'显示名', width:120, render:r=>r.displayName||'—' },
          { title:'角色描述', render:r=>r.description||'—' },
          { title:'排序值', width:80, align:'center', render:r=> (r.sortOrder!=null?r.sortOrder:'—') },
          { title:'状态', width:90, align:'center', render:r=> r.enable===1?Tag('启用','green'):Tag('禁用','gray') },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtISO(r.createdAt) },
          { title:'操作', width:220, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      // admin 角色不可改 → 显示 —
      if(r.name==='admin') return h('span',{class:'muted'},['—']);
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
        h('button',{class:'btn btn-sm',onclick:()=>assignPerms(r)},['权限分配']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
      ]);
    }

    function edit(r){
      const isNew=!r;
      const nm=h('input',{class:'input',value:r?r.name||'':''});
      const dn=h('input',{class:'input',value:r?r.displayName||'':''});
      const ds=h('textarea',{class:'textarea',value:r?r.description||'':''});
      const so=h('input',{class:'input',type:'number',value:r?(r.sortOrder!=null?r.sortOrder:0):0});
      const m=ctx.modal({ title:isNew?'新建角色':'编辑角色 — '+(r.displayName||''), body:[
        h('div',{class:'field'},[h('label',{},['角色英文标识 *']), nm]),
        h('div',{class:'field'},[h('label',{},['显示名 *']), dn]),
        h('div',{class:'field'},[h('label',{},['角色描述']), ds]),
        h('div',{class:'field'},[h('label',{},['排序值']), so]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!nm.value.trim()||!dn.value.trim()){ ctx.toast('warning','请填写标识与显示名'); return; }
          if(isNew){
            all.unshift({ id:Date.now(), name:nm.value.trim(), displayName:dn.value.trim(), description:ds.value.trim(), sortOrder:Number(so.value)||0, enable:1, createdAt:new Date().toISOString() });
            ctx.toast('success','创建成功');
          } else {
            r.name=nm.value.trim(); r.displayName=dn.value.trim(); r.description=ds.value.trim(); r.sortOrder=Number(so.value)||0;
            ctx.toast('success','保存成功');
          }
          m.close(); render();
        }},['确定']),
      ]});
    }

    function assignPerms(r){
      const perms=(ctx.data.rbac_permissions && (ctx.data.rbac_permissions.permissions||ctx.data.rbac_permissions.list)) || [];
      const groups={};
      perms.forEach(p=>{ (groups[p.module]=groups[p.module]||[]).push(p); });
      r._perms = r._perms || new Set();
      const body=Object.keys(groups).map(mod=>h('div',{class:'mb12'},[
        h('div',{class:'bold mb12'},[mod]),
        h('div',{class:'row wrap gap10'}, groups[mod].map(p=>{
          const cb=h('input',{type:'checkbox'}); cb.checked=r._perms.has(p.id); cb._pid=p.id;
          return h('label',{class:'row gap6',style:{cursor:'pointer'}},[cb, p.name]);
        })),
      ]));
      const m=ctx.modal({ size:'lg', title:'权限分配 — '+(r.displayName||''), body, footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          const sel=new Set();
          m && document.querySelectorAll('.modal input[type=checkbox]:checked').forEach(c=>{ if(c._pid!=null) sel.add(c._pid); });
          r._perms=sel; ctx.toast('success','权限已保存（共'+sel.size+'项）'); m.close();
        }},['确定']),
      ]});
    }

    function del(r){
      const m=ctx.modal({ title:'删除角色', body:[h('div',{},['确定删除角色「'+(r.displayName||r.name)+'」？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ all=all.filter(x=>x!==r); ctx.toast('success','已删除'); m.close(); render(); }},['确认删除']),
      ]});
    }

    render();
  }
};
