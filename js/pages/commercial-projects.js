// 商单管理 — 运营管理
window.Pages['commercial-projects'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      PROJECT_STATUS_ONLINE:{text:'上架',color:'#4ade80'},
      PROJECT_STATUS_OFFLINE:{text:'下架',color:'#6e6e6e'},
    };
    const TYPE = {
      PROJECT_TYPE_ENTRY:'入门级 / Entry',
      PROJECT_TYPE_STANDARD:'普通 / Standard',
      PROJECT_TYPE_PREMIUM:'精品 / Premium',
      PROJECT_TYPE_ULTRA:'超精品 / Ultra',
    };
    const CURR = { CURRENCY_CNY:'¥', CURRENCY_USD:'$' };

    const raw=(ctx.data.commercial_projects&&ctx.data.commercial_projects.projects)||[];
    let all=raw.map(p=>({ ...p }));

    let filter={ id:'', title:'' };
    let page=1, pageSize=10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','商单管理'], title:'商单管理',
      desc:'管理商单项目的创建、编辑、报名周期及上下架状态',
    }));
    const container=h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.id && !String(r.id).includes(filter.id)) return false;
        if(filter.title && !(r.title||'').toLowerCase().includes(filter.title.toLowerCase())) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const idIn=h('input',{class:'input',placeholder:'商单 ID',value:filter.id,style:{minWidth:'120px'}});
      const titleIn=h('input',{class:'input',placeholder:'项目名称',value:filter.title,style:{minWidth:'160px'}});
      container.appendChild(ctx.FilterBar([
        idIn, titleIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ id:idIn.value.trim(), title:titleIn.value.trim() }; page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={id:'',title:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'创建日期', width:120, align:'center', render:r=>ctx.fmtISOSlash(r.createdAt) },
          { title:'商单ID', width:90, align:'center', render:r=>ctx.IdCell(r.id, 18) },
          { title:'项目名称', render:r=>r.title||'—' },
          { title:'项目发单方', width:120, align:'center', render:r=>r.issuerName||'—' },
          { title:'商单类型', width:130, align:'center', render:r=> r.projectType? Tag(TYPE[r.projectType]||r.projectType,'purple') : '—' },
          { title:'封面图', width:80, align:'center', render:r=>r.coverUrl?h('img',{class:'cell-img',src:r.coverUrl}):h('span',{class:'cell-muted'},['无封面']) },
          { title:'报名开始时间', width:120, align:'center', render:r=>ctx.fmtISOSlash(r.signupStartAt) },
          { title:'报名结束时间', width:120, align:'center', render:r=>ctx.fmtISOSlash(r.signupEndAt) },
          { title:'算力补贴', width:90, align:'center', render:r=> r.subsidyPoints!=null? String(r.subsidyPoints) : '—' },
          { title:'保底奖励', width:100, align:'center', render:r=> r.guaranteedRewardAmountMinor!=null? (CURR[r.guaranteedRewardCurrency]||'')+r.guaranteedRewardAmountMinor : '—' },
          { title:'状态', width:90, align:'center', render:r=>Tag(STATUS[r.status]?STATUS[r.status].text:r.status, STATUS[r.status]?STATUS[r.status].color:'#6e6e6e') },
          { title:'操作', width:160, align:'center', render:r=> actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      const online=r.status==='PROJECT_STATUS_ONLINE';
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>detail(r)},['编辑']),
        h('button',{class:'btn btn-sm',onclick:()=>{
          r.status=online?'PROJECT_STATUS_OFFLINE':'PROJECT_STATUS_ONLINE';
          ctx.toast('success', online?'已下架':'已上架'); render();
        }},[online?'下架':'上架']),
      ]);
    }
    function detail(r){
      ctx.modal({ size:'lg', title:'商单详情 — '+(r.title||''), body:[
        h('div',{class:'kv'},[
          h('dt',{},['商单ID']), h('dd',{class:'mono small'},[String(r.id)]),
          h('dt',{},['项目名称']), h('dd',{},[r.title||'—']),
          h('dt',{},['项目发单方']), h('dd',{},[r.issuerName||'—']),
          h('dt',{},['商单类型']), h('dd',{},[TYPE[r.projectType]||r.projectType||'—']),
          h('dt',{},['报名周期']), h('dd',{},[ctx.fmtISOSlash(r.signupStartAt)+' ~ '+ctx.fmtISOSlash(r.signupEndAt)]),
          h('dt',{},['保底奖励']), h('dd',{},[r.guaranteedRewardAmountMinor!=null?(CURR[r.guaranteedRewardCurrency]||'')+r.guaranteedRewardAmountMinor:'—']),
          h('dt',{},['状态']), h('dd',{},[STATUS[r.status]?STATUS[r.status].text:r.status]),
        ]),
        r.coverUrl? h('img',{src:r.coverUrl,style:{width:'100%',marginTop:'12px',borderRadius:'8px'}}) : null,
      ]});
    }

    render();
  }
};
