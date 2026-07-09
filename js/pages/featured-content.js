// 精选内容 — 运营管理
window.Pages['featured-content'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const cfg = ctx.data.featured_config || {};
    let tabs = ((cfg.tabs)||[]).map(t=>({
      id:t.id, nameZh:t.nameZh||'', nameEn:t.nameEn||'',
      isDefault: t.id==='1' || !!t.isDefault,
      sortOrder: t.sortOrder||0,
    })).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));

    // 各 Tab 下的强推内容 / 内容池（真实数据为空，按 Tab 维护本地副本）
    const pinnedByTab = {};   // { tabId: [{type,dramaId,videoId,workflowUrl}] }
    const poolByTab = {};     // { tabId: [{addedAt,videoId,dramaId,projectId,name,heat}] }

    let activeId = tabs[0] ? tabs[0].id : null;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','精选内容'], title:'精选内容',
      desc:'按分类 Tab 配置首页精选推荐内容，支持强推置顶与内容池热度值调整',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>editTab(null)},['+ 新增 Tab']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    const CONTENT_TYPES = [['CONTENT_TYPE_VIDEO','视频'],['CONTENT_TYPE_SERIES','剧集'],['CONTENT_TYPE_WORKFLOW','工作流']];
    const typeText = v => (CONTENT_TYPES.find(x=>x[0]===v)||[null,v])[1];

    function render(){
      container.innerHTML='';

      // ① Tab 配置（分段切换 + 编辑/删除当前 Tab）
      const tabBar = h('div',{class:'tabs mb12'}, tabs.map(t=>
        h('button',{class: t.id===activeId?'active':'', onclick:()=>{ activeId=t.id; render(); }},[t.nameZh||t.nameEn||('Tab '+t.id)])
      ));
      const cur = tabs.find(t=>t.id===activeId);
      container.appendChild(h('div',{class:'panel card-pad mb18'},[
        h('div',{class:'row',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'bold'},['分类 Tab 配置']),
          cur? h('div',{class:'row gap6'},[
            h('button',{class:'btn btn-sm',onclick:()=>editTab(cur)},['编辑当前 Tab']),
            cur.isDefault? h('button',{class:'btn btn-sm',disabled:'',title:'默认 Tab 不可删除'},['删除'])
              : h('button',{class:'btn btn-sm btn-danger',onclick:()=>delTab(cur)},['删除']),
          ]) : null,
        ]),
        h('div',{class:'mt8'},[tabBar]),
        cur? h('div',{class:'small muted'},['当前 Tab：'+(cur.nameZh||'—')+' / '+(cur.nameEn||'—')+(cur.isDefault?'（默认）':'')]) : null,
      ]));

      if(!activeId){ container.appendChild(h('div',{class:'panel card-pad muted'},['暂无 Tab，请先新增 Tab'])); return; }

      const pinned = pinnedByTab[activeId] || (pinnedByTab[activeId]=[]);
      const pool = poolByTab[activeId] || (poolByTab[activeId]=[]);
      pinned.forEach((p,i)=>p._idx=i+1);

      // ② 强推内容区块
      container.appendChild(h('div',{class:'panel card-pad mb18'},[
        h('div',{class:'row mb12',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'bold'},['强推内容（置顶）']),
          h('button',{class:'btn btn-sm btn-primary',onclick:()=>addPinned()},['+ 添加强推内容']),
        ]),
        ctx.DataTable({
          columns:[
            { title:'排序', width:70, align:'center', render:r=>String(r._idx||'') },
            { title:'内容类型', width:100, align:'center', render:r=>Tag(typeText(r.type),'blue') },
            { title:'剧集ID', width:200, align:'center', render:r=> r.dramaId? ctx.IdCell(r.dramaId,18) : '—' },
            { title:'视频ID', width:200, align:'center', render:r=> r.videoId? ctx.IdCell(r.videoId,18) : '—' },
            { title:'工作流URL', render:r=>r.workflowUrl||'—' },
            { title:'操作', width:120, align:'center', render:(r)=>h('button',{class:'btn btn-sm btn-danger',onclick:()=>{ pinned.splice(pinned.indexOf(r),1); render(); }},['移除']) },
          ],
          rows:pinned,
          empty:'暂无数据',
        }),
      ]));

      // ③ 内容池区块
      container.appendChild(h('div',{class:'panel card-pad mb18'},[
        h('div',{class:'row mb12',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'bold'},['内容池']),
          h('button',{class:'btn btn-sm btn-primary',onclick:()=>addPool()},['+ 添加内容']),
        ]),
        ctx.DataTable({
          columns:[
            { title:'内容添加时间', width:160, align:'center', render:r=>ctx.fmtISO(r.addedAt) },
            { title:'视频 ID', width:200, align:'center', render:r=> r.videoId? ctx.IdCell(r.videoId,18) : '—' },
            { title:'剧集 ID', width:200, align:'center', render:r=> r.dramaId? ctx.IdCell(r.dramaId,18) : '—' },
            { title:'项目 ID', width:200, align:'center', render:r=> r.projectId? ctx.IdCell(r.projectId,18) : '—' },
            { title:'内容名称', render:r=>r.name||'—' },
            { title:'热度值', width:120, align:'center', render:r=>{
                const inp=h('input',{class:'input',type:'number',value:r.heat,placeholder:'输入热度值',style:{width:'90px'}});
                inp.addEventListener('input',e=>{ r.heat=e.target.value; });
                return inp;
              } },
            { title:'操作', width:120, align:'center', render:(r)=>h('button',{class:'btn btn-sm btn-danger',onclick:()=>{ pool.splice(pool.indexOf(r),1); render(); }},['移除']) },
          ],
          rows:pool,
          empty:'暂无数据',
        }),
      ]));

      // ④ 底部上线按钮
      container.appendChild(h('div',{class:'panel card-pad'},[
        h('div',{class:'row',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'small muted'},['发布后立即生效,仅作用于当前 Tab']),
          h('button',{class:'btn btn-primary',onclick:()=>ctx.toast('success','已更新上线（本地模拟，仅作用于当前 Tab）')},['更新上线']),
        ]),
      ]));
    }

    function addPinned(){
      const pinned = pinnedByTab[activeId];
      const typeSel = h('select',{class:'select'}, CONTENT_TYPES.map(([v,t])=>h('option',{value:v},[t])));
      const dramaIn = h('input',{class:'input',placeholder:'剧集ID'});
      const videoIn = h('input',{class:'input',placeholder:'视频ID'});
      const wfIn = h('input',{class:'input',placeholder:'工作流URL'});
      const m = ctx.modal({ title:'添加强推内容', body:[
        h('div',{class:'field'},[h('label',{},['内容类型']), typeSel]),
        h('div',{class:'field'},[h('label',{},['剧集ID']), dramaIn]),
        h('div',{class:'field'},[h('label',{},['视频ID']), videoIn]),
        h('div',{class:'field'},[h('label',{},['工作流URL']), wfIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          pinned.push({ type:typeSel.value, dramaId:dramaIn.value.trim(), videoId:videoIn.value.trim(), workflowUrl:wfIn.value.trim() });
          ctx.toast('success','已添加'); m.close(); render();
        }},['确认']),
      ]});
    }

    function addPool(){
      const pool = poolByTab[activeId];
      const nameIn = h('input',{class:'input',placeholder:'内容名称'});
      const videoIn = h('input',{class:'input',placeholder:'视频 ID'});
      const dramaIn = h('input',{class:'input',placeholder:'剧集 ID'});
      const projIn = h('input',{class:'input',placeholder:'项目 ID'});
      const heatIn = h('input',{class:'input',type:'number',placeholder:'输入热度值'});
      const m = ctx.modal({ title:'添加内容池内容', body:[
        h('div',{class:'field'},[h('label',{},['内容名称']), nameIn]),
        h('div',{class:'field'},[h('label',{},['视频 ID']), videoIn]),
        h('div',{class:'field'},[h('label',{},['剧集 ID']), dramaIn]),
        h('div',{class:'field'},[h('label',{},['项目 ID']), projIn]),
        h('div',{class:'field'},[h('label',{},['热度值']), heatIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          pool.push({ addedAt:new Date().toISOString(), videoId:videoIn.value.trim(), dramaId:dramaIn.value.trim(),
            projectId:projIn.value.trim(), name:nameIn.value.trim(), heat:heatIn.value.trim()||'0' });
          ctx.toast('success','已添加'); m.close(); render();
        }},['确认']),
      ]});
    }

    function editTab(r){
      const isNew = !r;
      const zhIn = h('input',{class:'input',placeholder:'请输入中文标题',maxlength:30,value:r?r.nameZh:''});
      const enIn = h('input',{class:'input',placeholder:'请输入英文标题',maxlength:30,value:r?r.nameEn:''});
      const m = ctx.modal({ title:isNew?'新增 Tab':'编辑 Tab', body:[
        h('div',{class:'field'},[h('label',{},['名称（中文）*']), zhIn]),
        h('div',{class:'field'},[h('label',{},['名称（英文）']), enIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          const zh=zhIn.value.trim();
          if(!zh){ ctx.toast('warning','请输入中文标题'); return; }
          if(isNew){
            const id = String(Date.now());
            tabs.push({ id, nameZh:zh, nameEn:enIn.value.trim(), isDefault:false, sortOrder: tabs.length+1 });
            activeId=id; ctx.toast('success','创建成功');
          } else {
            r.nameZh=zh; r.nameEn=enIn.value.trim(); ctx.toast('success','已保存');
          }
          m.close(); render();
        }},['确认']),
      ]});
    }

    function delTab(r){
      const m = ctx.modal({ title:'删除 Tab', body:[h('div',{},['确认删除该 Tab「'+(r.nameZh||r.id)+'」？该 Tab 下的强推与内容池配置将一并失效。'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          tabs = tabs.filter(x=>x.id!==r.id);
          if(activeId===r.id) activeId = tabs[0]? tabs[0].id : null;
          ctx.toast('success','删除成功'); m.close(); render();
        }},['确认删除']),
      ]});
    }

    render();
  }
};
