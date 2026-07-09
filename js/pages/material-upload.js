// 内容上传 — 运营管理
window.Pages['material-upload'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const STATUS = { online:{text:'上架',color:'#4ade80'}, offline:{text:'下架',color:'#6e6e6e'} };
    const catLabel = c => c && (c.secondName? c.firstName+' / '+c.secondName : c.firstName) || '—';

    const rawItems = (ctx.data.materials && ctx.data.materials.items) || [];
    let all = rawItems.map(m=>{
      const det = m.details||{}, folder = m.folder||{}, path = m.categoryPath||[];
      return {
        id:m.id,
        folderId: folder.id||'',
        folderName: folder.firstTitle ? (folder.firstTitle + (folder.secondTitle? ' '+folder.secondTitle : '')) : '—',
        materialCount: folder.materialCount||0,
        createdAt: m.createdAt,
        firstTitle: m.firstTitle||'—', secondTitle: m.secondTitle||'',
        mediaType: det.mediaType||'image', mediaUrl: det.mediaUrl||'',
        prompt: det.prompt||'', promptCn: det.promptCn||'',
        level1: path[0]? catLabel(path[0]) : '—',
        level2: path.slice(1).map(catLabel).join(' └ ') || '—',
        tags: (m.tags||[]).map(t=> t.secondName? t.firstName+' / '+t.secondName : t.firstName).filter(Boolean),
        status: m.status||'online',
      };
    });

    let filter = { folderName:'', folderId:'', materialName:'', materialId:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','内容上传'], title:'内容上传',
      desc:'以文件夹为单位上传图片/视频素材，并配置分类、标签与提示词后上下架管理',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>uploadModal()},['+ 上传文件夹']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.folderName){ const k=filter.folderName.toLowerCase(); if(!(r.folderName||'').toLowerCase().includes(k)) return false; }
        if(filter.folderId && String(r.folderId)!==filter.folderId) return false;
        if(filter.materialName){ const k=filter.materialName.toLowerCase(); if(!(r.firstTitle||'').toLowerCase().includes(k) && !(r.secondTitle||'').toLowerCase().includes(k)) return false; }
        if(filter.materialId && String(r.id)!==filter.materialId) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const folderNameIn = h('input',{class:'input',placeholder:'文件夹名称（中/英模糊）',value:filter.folderName,style:{minWidth:'180px'}});
      const folderIdIn = h('input',{class:'input',placeholder:'文件夹 ID（精确）',value:filter.folderId,style:{minWidth:'140px'}});
      const matNameIn = h('input',{class:'input',placeholder:'素材名称（中/英模糊）',value:filter.materialName,style:{minWidth:'180px'}});
      const matIdIn = h('input',{class:'input',placeholder:'素材 ID（精确）',value:filter.materialId,style:{minWidth:'140px'}});

      container.appendChild(ctx.FilterBar([
        folderNameIn, folderIdIn, matNameIn, matIdIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ folderName:folderNameIn.value.trim(), folderId:folderIdIn.value.trim(),
            materialName:matNameIn.value.trim(), materialId:matIdIn.value.trim() };
          page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={folderName:'',folderId:'',materialName:'',materialId:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'素材文件夹 ID', width:110, align:'center', render:r=>h('span',{class:'mono small'},[String(r.folderId||'—')]) },
          { title:'文件夹名称', width:180, render:r=>r.folderName },
          { title:'素材数', width:80, align:'center', render:r=>String(r.materialCount||0) },
          { title:'素材 ID', width:90, align:'center', render:r=>h('span',{class:'mono small'},[String(r.id)]) },
          { title:'上传时间', width:150, align:'center', render:r=>ctx.fmtISOMin(r.createdAt) },
          { title:'素材名称', width:180, render:r=>h('div',{},[h('div',{},[r.firstTitle]), r.secondTitle?h('div',{class:'small muted'},[r.secondTitle]):null]) },
          { title:'预览', width:80, align:'center', render:r=> r.mediaUrl? h('img',{class:'cell-img',src:r.mediaUrl,onclick:()=>preview(r)}) : h('span',{class:'cell-muted'},['无']) },
          { title:'一级', width:130, render:r=>h('span',{class:'small'},[r.level1]) },
          { title:'二级 Tab', width:160, render:r=>h('span',{class:'small'},[r.level2]) },
          { title:'提示词', width:90, align:'center', render:r=> (r.promptCn||r.prompt)? h('button',{class:'btn btn-sm',onclick:()=>showPrompt(r)},['查看']) : '—' },
          { title:'标签', width:180, render:r=> r.tags.length? h('div',{class:'row wrap gap6'}, r.tags.slice(0,3).map(t=>Tag(t,'gray'))) : '—' },
          { title:'状态', width:80, align:'center', render:r=>Tag(STATUS[r.status]?STATUS[r.status].text:r.status, STATUS[r.status]?STATUS[r.status].color:'gray') },
          { title:'操作', width:180, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无素材',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>preview(r)},['预览']),
        h('button',{class:'btn btn-sm',onclick:()=>{
          r.status = r.status==='online'?'offline':'online';
          ctx.toast('success', r.status==='online'?'已上架':'已下架'); render();
        }},[r.status==='online'?'下架':'上架']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
      ]);
    }

    function preview(r){
      const media = r.mediaType==='video'
        ? h('video',{src:r.mediaUrl,controls:'',style:{width:'100%',borderRadius:'8px',background:'#000'}})
        : h('img',{src:r.mediaUrl,style:{width:'100%',borderRadius:'8px'}});
      ctx.modal({ size:'lg', title:r.firstTitle, body:[
        r.mediaUrl? media : h('div',{class:'muted'},['无媒体文件']),
        h('div',{class:'kv mt16'},[
          h('dt',{},['中文名']), h('dd',{},[r.firstTitle]),
          h('dt',{},['英文名']), h('dd',{},[r.secondTitle||'—']),
          h('dt',{},['分类']), h('dd',{class:'small'},[r.level1+(r.level2!=='—'?' └ '+r.level2:'')]),
        ]),
      ]});
    }

    function showPrompt(r){
      ctx.modal({ size:'lg', title:'提示词 — '+r.firstTitle, body:[
        h('div',{class:'field'},[h('label',{},['中文提示词']), h('div',{class:'small'},[r.promptCn||'—'])]),
        h('div',{class:'field'},[h('label',{},['English Prompt']), h('div',{class:'small'},[r.prompt||'—'])]),
      ]});
    }

    function del(r){
      const m = ctx.modal({ title:'删除素材', body:[h('div',{},['确定删除素材「'+r.firstTitle+'」？此操作不可恢复。'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          all = all.filter(x=>x.id!==r.id);
          ctx.toast('success','删除成功'); m.close(); render();
        }},['确认删除']),
      ]});
    }

    function uploadModal(){
      const zhIn = h('input',{class:'input',placeholder:'文件夹中文标题'});
      const enIn = h('input',{class:'input',placeholder:'Folder English title'});
      const m = ctx.modal({ title:'上传素材文件夹', body:[
        h('div',{class:'small muted mb12'},['以文件夹为单位上传图片/视频素材，并配置分类、标签与提示词。（本地模拟）']),
        h('div',{class:'field'},[h('label',{},['文件夹标题（中文）*']), zhIn]),
        h('div',{class:'field'},[h('label',{},['文件夹标题（英文）']), enIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!zhIn.value.trim()){ ctx.toast('warning','请输入文件夹中文标题'); return; }
          ctx.toast('success','已提交上传（本地模拟，未实际发送）'); m.close();
        }},['提交上传']),
      ]});
    }

    render();
  }
};
