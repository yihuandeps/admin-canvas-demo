// 配置项管理 — 系统管理
window.Pages['app-settings'] = {
  render(root, ctx){
    const { h } = ctx;
    const raw = ctx.data.app_settings || {};
    const forbidden = raw._error === 'FORBIDDEN';
    const src = (raw.list || raw.items || (Array.isArray(raw.data)?raw.data:[])) || [];
    let all = src.map(x=>Object.assign({}, x));

    let filter = { key:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['系统管理','配置项管理'], title:'配置项管理',
      desc:'管理系统全局运行时配置项，以 key-value 形式控制模型权益、商品列表、活动开关等运营参数',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>edit(null)},['新建配置项']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=> !filter.key || (r.key||'').toLowerCase().includes(filter.key.toLowerCase()));
    }

    function render(){
      container.innerHTML='';
      const keyIn=h('input',{class:'input',placeholder:'配置键',value:filter.key,style:{minWidth:'220px'}});
      container.appendChild(ctx.FilterBar([
        keyIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={key:keyIn.value.trim()}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={key:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'配置键', width:240, render:r=>h('span',{class:'mono small'},[r.key||'—']) },
          { title:'值', render:r=>h('span',{class:'mono small'},[typeof r.value==='object'?JSON.stringify(r.value):(r.value!=null?String(r.value):'—')]) },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtISO(r.createdAt) },
          { title:'更新时间', width:170, align:'center', render:r=>ctx.fmtISO(r.updatedAt) },
          { title:'操作', width:140, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
            h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
            h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
          ]) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function edit(r){
      const isNew=!r;
      const k=h('input',{class:'input',value:r?r.key||'':''});
      const v=h('textarea',{class:'textarea',value:r?(typeof r.value==='object'?JSON.stringify(r.value):(r.value!=null?String(r.value):'')):''});
      const m=ctx.modal({ title:isNew?'新建配置项':'编辑配置项 — '+(r.key||''), body:[
        h('div',{class:'field'},[h('label',{},['配置键 *']), k]),
        h('div',{class:'field'},[h('label',{},['值']), v]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!k.value.trim()){ ctx.toast('warning','请输入配置键'); return; }
          const now=new Date().toISOString();
          if(isNew){ all.unshift({ key:k.value.trim(), value:v.value, createdAt:now, updatedAt:now }); ctx.toast('success','创建成功'); }
          else { r.key=k.value.trim(); r.value=v.value; r.updatedAt=now; ctx.toast('success','保存成功'); }
          m.close(); render();
        }},['确定']),
      ]});
    }

    function del(r){
      const m=ctx.modal({ title:'删除配置项', body:[h('div',{},['确定删除配置键「'+(r.key)+'」？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ all=all.filter(x=>x!==r); ctx.toast('success','已删除'); m.close(); render(); }},['确认删除']),
      ]});
    }

    render();
  }
};
