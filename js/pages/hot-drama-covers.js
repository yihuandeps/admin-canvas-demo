// 热剧封面 — 运营管理
window.Pages['hot-drama-covers'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const STATUS = { online:{text:'上架',color:'#4ade80'}, offline:{text:'下架',color:'#6e6e6e'} };

    // 无对应 MOCK 数据：按真实样例(共 11 条)构造本地列表
    function uuid(){ return '019d'+Math.random().toString(16).slice(2,6)+'-'+Math.random().toString(16).slice(2,6)+'-7'+Math.random().toString(16).slice(2,5)+'-'+Math.random().toString(16).slice(2,6)+'-'+Math.random().toString(16).slice(2,14); }
    let all = [
      { id:'019d2471-5533-7d76-bebf-2a1b3c4d5e6f', cover:'', maker:'test😄', sortOrder:1, status:'online' },
    ];
    for(let i=2;i<=11;i++){
      all.push({ id:uuid(), cover:'', maker:'creator'+i, sortOrder:i, status: i%4===0?'offline':'online' });
    }

    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','热剧封面'], title:'热剧封面',
      desc:'管理热剧封面图的新增、上下架与展示排序',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>edit(null)},['+ 新增热剧封面']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function render(){
      container.innerHTML='';
      all.sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
      const rows = all.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'排序', width:80, align:'center', render:r=>String(r.sortOrder||'—') },
          { title:'热剧图片ID', width:200, align:'center', render:r=>ctx.IdCell(r.id,18) },
          { title:'封面图', width:120, align:'center', render:r=> r.cover? h('img',{class:'cell-img',src:r.cover}) : h('span',{class:'cell-muted'},['无封面']) },
          { title:'制作方昵称', render:r=>r.maker||'—' },
          { title:'状态', width:90, align:'center', render:r=>Tag(STATUS[r.status].text, STATUS[r.status].color) },
          { title:'操作', width:220, align:'center', render:r=>actionCell(r) },
        ],
        rows,
        empty:'暂无热剧封面',
        pager:{ page, pageSize, total:all.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
        h('button',{class:'btn btn-sm',onclick:()=>{
          r.status = r.status==='online'?'offline':'online';
          ctx.toast('success', r.status==='online'?'已上架':'已下架'); render();
        }},[r.status==='online'?'下架':'上架']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
      ]);
    }

    function edit(r){
      const isNew = !r;
      const makerIn = h('input',{class:'input',placeholder:'制作方昵称',value:r?r.maker:''});
      const coverIn = h('input',{class:'input',placeholder:'封面图 URL',value:r?r.cover:''});
      const sortIn = h('input',{class:'input',type:'number',value:r?r.sortOrder:(all.length+1)});
      const m = ctx.modal({ title:isNew?'新增热剧封面':'编辑热剧封面', body:[
        h('div',{class:'field'},[h('label',{},['封面图 URL']), coverIn]),
        h('div',{class:'field'},[h('label',{},['制作方昵称']), makerIn]),
        h('div',{class:'field'},[h('label',{},['排序（越小越靠前）']), sortIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(isNew){
            all.push({ id:uuid(), cover:coverIn.value.trim(), maker:makerIn.value.trim()||'—',
              sortOrder:Number(sortIn.value)||all.length+1, status:'online' });
            ctx.toast('success','已新增');
          } else {
            r.cover=coverIn.value.trim(); r.maker=makerIn.value.trim()||'—'; r.sortOrder=Number(sortIn.value)||r.sortOrder;
            ctx.toast('success','已保存');
          }
          m.close(); render();
        }},['保存']),
      ]});
    }

    function del(r){
      const m = ctx.modal({ title:'删除热剧封面', body:[h('div',{},['确定删除该热剧封面？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ all=all.filter(x=>x.id!==r.id); ctx.toast('success','删除成功'); m.close(); render(); }},['确认删除']),
      ]});
    }

    render();
  }
};
