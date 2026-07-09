// Banner 管理 — 运营管理
window.Pages['banners'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const TYPE = {
      BANNER_TYPE_VIDEO:'视频',
      BANNER_TYPE_SERIES:'剧集',
      BANNER_TYPE_WORKFLOW:'工作流',
      BANNER_TYPE_URL:'URL',
    };

    const raw=(ctx.data.banners&&ctx.data.banners.banners)||[];
    let all=raw.map(b=>({ ...b }));

    let filter={ type:'', status:'' };
    let page=1, pageSize=10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','Banner 管理'], title:'Banner 管理',
      desc:'管理首页 Banner 轮播位的增删改、上下架与展示排序',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>edit(null)},['+ 新增']) ],
    }));
    const container=h('div');
    root.appendChild(container);

    function applied(){
      let list=all.filter(r=>{
        if(filter.type && r.type!==filter.type) return false;
        if(filter.status!=='' && String(r.status)!==filter.status) return false;
        return true;
      });
      return list.slice().sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
    }

    function contentCell(r){
      if(r.type==='BANNER_TYPE_URL') return r.pageUrl? h('a',{href:r.pageUrl,target:'_blank',class:'link'},['查看链接']) : '—';
      if(r.type==='BANNER_TYPE_WORKFLOW') return r.projectId? h('span',{class:'link'},['查看项目']) : '—';
      if(r.type==='BANNER_TYPE_VIDEO') return r.videoId? h('span',{class:'link'},['查看视频']) : '—';
      if(r.type==='BANNER_TYPE_SERIES') return r.seriesId? h('span',{class:'link'},['查看剧集']) : '—';
      return '—';
    }

    function render(){
      container.innerHTML='';
      const typeSel=h('select',{class:'select'},[
        ['','全部类型'],['BANNER_TYPE_VIDEO','视频'],['BANNER_TYPE_SERIES','剧集'],
        ['BANNER_TYPE_WORKFLOW','工作流'],['BANNER_TYPE_URL','URL'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      typeSel.value=filter.type;
      const statusSel=h('select',{class:'select'},[
        ['','全部状态'],['1','上架'],['0','下架'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      statusSel.value=filter.status;

      container.appendChild(ctx.FilterBar([
        typeSel, statusSel,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ type:typeSel.value, status:statusSel.value }; page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={type:'',status:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'排序', width:70, align:'center', render:r=>String(r.sortOrder??'—') },
          { title:'标题', render:r=>r.title||'—' },
          { title:'英文标题', render:r=>r.titleEn||'—' },
          { title:'类型', width:100, align:'center', render:r=>Tag(TYPE[r.type]||r.type,'blue') },
          { title:'图片', width:90, align:'center', render:r=>r.imageUrl?h('img',{class:'cell-img',src:r.imageUrl}):h('span',{class:'cell-muted'},['无图']) },
          { title:'英文图片', width:90, align:'center', render:r=>r.imageUrlEn?h('img',{class:'cell-img',src:r.imageUrlEn}):'—' },
          { title:'内容', width:110, align:'center', render:r=>contentCell(r) },
          { title:'状态', width:90, align:'center', render:r=>r.status===1?Tag('上架','green'):Tag('下架','gray') },
          { title:'操作', width:180, align:'center', render:r=> actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      const online=r.status===1;
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>{ r.status=online?0:1; ctx.toast('success',online?'已下架':'已上架'); render(); }},[online?'下架':'上架']),
        h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
      ]);
    }
    function edit(r){
      const isNew=!r;
      const titleIn=h('input',{class:'input',value:r?r.title:''});
      const titleEnIn=h('input',{class:'input',value:r?r.titleEn:''});
      const sortIn=h('input',{class:'input',type:'number',value:r?String(r.sortOrder??''):''});
      const typeSel=h('select',{class:'select'},Object.entries(TYPE).map(([v,t])=>h('option',{value:v},[t])));
      if(r) typeSel.value=r.type;
      const m=ctx.modal({ title:isNew?'新增 Banner':'编辑 Banner', body:[
        h('div',{class:'field'},[h('label',{},['标题']), titleIn]),
        h('div',{class:'field'},[h('label',{},['英文标题']), titleEnIn]),
        h('div',{class:'field'},[h('label',{},['类型']), typeSel]),
        h('div',{class:'field'},[h('label',{},['排序']), sortIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(isNew){
            all.unshift({ id:Date.now(), title:titleIn.value.trim(), titleEn:titleEnIn.value.trim(),
              type:typeSel.value, imageUrl:'', imageUrlEn:'', status:0, sortOrder:Number(sortIn.value)||0 });
          } else {
            r.title=titleIn.value.trim(); r.titleEn=titleEnIn.value.trim();
            r.type=typeSel.value; r.sortOrder=Number(sortIn.value)||0;
          }
          ctx.toast('success',isNew?'已新增':'已保存'); m.close(); render();
        }},['保存']),
      ]});
    }
    function del(r){
      const m=ctx.modal({ title:'删除确认', body:[h('div',{},['确认删除 Banner「'+(r.title||r.id)+'」？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          all=all.filter(x=>x!==r); ctx.toast('success','已删除'); m.close(); render();
        }},['确认删除']),
      ]});
    }

    render();
  }
};
