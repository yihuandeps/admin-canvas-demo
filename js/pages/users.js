// 后台用户管理 — 系统管理
window.Pages['users'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const src = (ctx.data.rbac_users && (ctx.data.rbac_users.users||ctx.data.rbac_users.list)) || [];
    let all = src.map(u=>Object.assign({}, u, { roles:(u.roles||[]).slice() }));

    let filter = { kw:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['系统管理','后台用户管理'], title:'后台用户管理',
      desc:'管理后台登录账号的增删改查、启停及角色权限分配',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>edit(null)},['新建用户']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          const hay=[(r.username||''),(r.nickName||''),(r.email||''),(r.phone||'')].join(' ').toLowerCase();
          if(!hay.includes(k)) return false;
        }
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn=h('input',{class:'input',placeholder:'用户名 / 昵称 / 邮箱 / 手机号',value:filter.kw,style:{minWidth:'260px'}});
      container.appendChild(ctx.FilterBar([
        kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kw:kwIn.value.trim()}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kw:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'用户名', render:r=>r.username||'—' },
          { title:'昵称', render:r=>r.nickName||'—' },
          { title:'手机号', width:140, align:'center', render:r=>r.phone||'—' },
          { title:'邮箱', render:r=>r.email||'—' },
          { title:'状态', width:90, align:'center', render:r=> r.enable===1?Tag('启用','green'):Tag('禁用','gray') },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtISO(r.createdAt) },
          { title:'操作', width:240, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      // admin 账号不可改 → 显示 —
      if(r.username==='admin') return h('span',{class:'muted'},['—']);
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
        h('button',{class:'btn btn-sm',onclick:()=>{ r.enable=r.enable===1?0:1; ctx.toast('success',r.enable===1?'已启用':'已禁用'); render(); }},[r.enable===1?'禁用':'启用']),
        h('button',{class:'btn btn-sm',onclick:()=>assignRoles(r)},['角色']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
      ]);
    }

    function roleOptions(){ return (ctx.data.rbac_roles && ctx.data.rbac_roles.roles) || []; }

    function edit(r){
      const isNew=!r;
      const u=h('input',{class:'input',value:r?r.username||'':''});
      const nk=h('input',{class:'input',value:r?r.nickName||'':''});
      const ph=h('input',{class:'input',value:r?r.phone||'':''});
      const em=h('input',{class:'input',value:r?r.email||'':''});
      const m=ctx.modal({ title:isNew?'新建用户':'编辑用户 — '+(r.username||''), body:[
        h('div',{class:'field'},[h('label',{},['用户名 *']), u]),
        h('div',{class:'field'},[h('label',{},['昵称']), nk]),
        h('div',{class:'field'},[h('label',{},['手机号']), ph]),
        h('div',{class:'field'},[h('label',{},['邮箱']), em]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!u.value.trim()){ ctx.toast('warning','请输入用户名'); return; }
          if(isNew){
            all.unshift({ id:Date.now(), username:u.value.trim(), nickName:nk.value.trim(), phone:ph.value.trim(), email:em.value.trim(), enable:1, roles:[], createdAt:new Date().toISOString() });
            ctx.toast('success','创建成功');
          } else {
            r.username=u.value.trim(); r.nickName=nk.value.trim(); r.phone=ph.value.trim(); r.email=em.value.trim();
            ctx.toast('success','保存成功');
          }
          m.close(); render();
        }},['确定']),
      ]});
    }

    function assignRoles(r){
      const opts=roleOptions();
      const owned=new Set((r.roles||[]).map(x=>x.id));
      const checks=opts.map(o=>{
        const cb=h('input',{type:'checkbox'}); cb.checked=owned.has(o.id);
        cb._rid=o.id;
        return h('label',{class:'row gap6',style:{padding:'4px 0',cursor:'pointer'}},[cb, o.displayName||o.name]);
      });
      const m=ctx.modal({ title:'分配角色 — '+(r.username||''), body:checks, footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          r.roles = checks.filter(c=>c.querySelector('input').checked).map(c=>{
            const id=c.querySelector('input')._rid; return opts.find(o=>o.id===id);
          });
          ctx.toast('success','角色已更新'); m.close(); render();
        }},['确定']),
      ]});
    }

    function del(r){
      const m=ctx.modal({ title:'删除用户', body:[h('div',{},['确定删除用户「'+(r.username||r.id)+'」？此操作不可恢复。'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ all=all.filter(x=>x!==r); ctx.toast('success','已删除'); m.close(); render(); }},['确认删除']),
      ]});
    }

    render();
  }
};
