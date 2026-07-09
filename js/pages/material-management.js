// 内容管理 — 运营管理
window.Pages['material-management'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const STATUS = { online:{text:'上架',color:'#4ade80'}, offline:{text:'下架',color:'#6e6e6e'} };
    const catLabel = c => c && (c.secondName? c.firstName+' / '+c.secondName : c.firstName) || '—';

    // 分类 Tab 结构（公共节点下的一级 / 二级）
    const catRoot = (ctx.data.material_categories && ctx.data.material_categories.items) || [];
    const publicNode = catRoot.find(c=>c.firstName==='公共') || catRoot[0] || {children:[]};
    const primaries = (publicNode.children||[]).slice().sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)); // 一级

    let activePrimary = primaries[0] ? String(primaries[0].id) : null;
    let activeSecondary = null;

    // 强推文件夹：真实数据为空，按二级 tab 维护本地副本
    const pushByTab = {}; // { secondaryId: [{id,folderName,status,sortOrder}] }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','内容管理'], title:'内容管理',
      desc:'管理公共素材库的分类 Tab 结构及各分类下的强推文件夹排序与上线',
    }));
    const container = h('div');
    root.appendChild(container);

    function secondariesOf(pid){
      const p = primaries.find(x=>String(x.id)===String(pid));
      return (p && p.children || []).slice().sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
    }

    function render(){
      container.innerHTML='';

      // ① 一级分类 Tab
      const primaryBar = h('div',{class:'tabs mb12'}, primaries.map(p=>
        h('button',{class: String(p.id)===activePrimary?'active':'', onclick:()=>{ activePrimary=String(p.id); activeSecondary=null; render(); }},[catLabel(p)])
      ));

      const secondaries = secondariesOf(activePrimary);
      if(activeSecondary===null && secondaries.length) activeSecondary = String(secondaries[0].id);

      // ② 二级分类 Tab
      const secondaryBar = secondaries.length
        ? h('div',{class:'tabs mb12'}, secondaries.map(s=>
            h('button',{class: String(s.id)===activeSecondary?'active':'', onclick:()=>{ activeSecondary=String(s.id); render(); }},[catLabel(s)])
          ))
        : h('div',{class:'small muted mb12'},['该一级分类下暂无二级 Tab']);

      container.appendChild(h('div',{class:'panel card-pad mb18'},[
        h('div',{class:'bold mb12'},['分类 Tab 结构']),
        h('div',{class:'small muted'},['一级分类']), primaryBar,
        h('div',{class:'small muted'},['二级 Tab']), secondaryBar,
      ]));

      // ③ 强推文件夹排序表
      const key = activeSecondary || ('p'+activePrimary);
      const list = pushByTab[key] || (pushByTab[key]=[]);

      container.appendChild(h('div',{class:'panel card-pad mb18'},[
        h('div',{class:'row mb12',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'bold'},['强推文件夹']),
          h('button',{class:'btn btn-sm btn-primary',onclick:()=>addPush(list)},['+ 添加强推内容']),
        ]),
        ctx.DataTable({
          columns:[
            { title:'排序', width:90, align:'center', render:r=>String(r.sortOrder||'—') },
            { title:'素材文件夹', render:r=>r.folderName||'—' },
            { title:'状态', width:100, align:'center', render:r=>Tag(STATUS[r.status]?STATUS[r.status].text:r.status, STATUS[r.status]?STATUS[r.status].color:'gray') },
            { title:'操作', width:220, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
                h('button',{class:'btn btn-sm',onclick:()=>{ moveUp(list,r); render(); }},['上移']),
                h('button',{class:'btn btn-sm',onclick:()=>{ r.status=r.status==='online'?'offline':'online'; ctx.toast('success',r.status==='online'?'已上架':'已下架'); render(); }},[r.status==='online'?'下架':'上架']),
                h('button',{class:'btn btn-sm btn-danger',onclick:()=>{ list.splice(list.indexOf(r),1); render(); }},['移除']),
              ]) },
          ],
          rows:list,
          empty:'暂无强推内容，点击下方「添加强推内容」',
        }),
      ]));

      // ④ 底部保存并上线
      container.appendChild(h('div',{class:'panel card-pad'},[
        h('div',{class:'row',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'small muted'},['保存后立即上线，仅作用于当前二级 tab']),
          h('button',{class:'btn btn-primary',onclick:()=>ctx.toast('success','已保存并上线（本地模拟，仅作用于当前二级 tab）')},['保存并上线']),
        ]),
      ]));
    }

    function moveUp(list,r){
      const i = list.indexOf(r);
      if(i>0){ list.splice(i,1); list.splice(i-1,0,r); reorder(list); }
    }
    function reorder(list){ list.forEach((x,i)=>x.sortOrder=i+1); }

    function addPush(list){
      const nameIn = h('input',{class:'input',placeholder:'素材文件夹名称'});
      const idIn = h('input',{class:'input',placeholder:'素材文件夹 ID'});
      const m = ctx.modal({ title:'添加强推内容', body:[
        h('div',{class:'field'},[h('label',{},['素材文件夹 ID']), idIn]),
        h('div',{class:'field'},[h('label',{},['素材文件夹名称']), nameIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!nameIn.value.trim() && !idIn.value.trim()){ ctx.toast('warning','请输入文件夹 ID 或名称'); return; }
          list.push({ id:idIn.value.trim()||String(Date.now()), folderName:nameIn.value.trim()||idIn.value.trim(), status:'online', sortOrder:list.length+1 });
          ctx.toast('success','已添加'); m.close(); render();
        }},['确认']),
      ]});
    }

    render();
  }
};
