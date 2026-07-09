// 积分消耗 — 运营管理
window.Pages['points-consumption'] = {
  render(root, ctx){
    const { h } = ctx;
    const src=ctx.data.points_consumption||{};
    // 真实接口该账号无权限(_error: FORBIDDEN) → 数据空
    const raw=(src.list)||(src.items)||(src.records)||(src.data&&src.data.list)||[];
    let all=Array.isArray(raw)?raw.slice():[];

    let filter={ userType:'all' };
    let page=1, pageSize=10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','积分消耗'], title:'积分消耗',
      desc:'按用户统计积分消耗，展开行可见各模型的消耗明细',
    }));
    const container=h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.userType!=='all' && r.accountType!==filter.userType) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const typeSel=h('select',{class:'select'},[
        ['all','全部用户'],['internal','内部用户'],['external','外部用户'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      typeSel.value=filter.userType;

      container.appendChild(ctx.FilterBar([
        typeSel,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={ userType:typeSel.value }; page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={userType:'all'}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'用户ID', width:200, align:'center', render:r=>ctx.IdCell(r.userId, 18) },
          { title:'用户名', render:r=>r.username||'—' },
          { title:'用户邮箱', render:r=>r.email||'—' },
          { title:'账号类型', width:110, align:'center', render:r=>r.accountTypeText||r.accountType||'—' },
          { title:'积分消耗总量', width:130, align:'center', render:r=> r.totalConsumed!=null? String(r.totalConsumed) : '—' },
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
