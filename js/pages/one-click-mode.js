// 一键模式配置 — 产品管理
window.Pages['one-click-mode'] = {
  render(root, ctx){
    const { h } = ctx;

    const src = ctx.data.one_click_mode || {};
    // 构建内存副本：每个模型带 selected 标记
    function buildSection(sec){
      const s = (src && src[sec]) || {};
      const selected = new Set((s.selectedModelIds) || []);
      const models = (s.models || []).map(m=>({
        modelId: m.modelId,
        name: m.modelName || m.displayName || m.name || '未命名模型',
        selected: selected.has(m.modelId),
      }));
      return models;
    }
    const state = {
      video: buildSection('video'),
      image: buildSection('image'),
    };

    let tab = 'video';
    const TAB_LABEL = { video:'视频', image:'图片' };

    // 根据名称生成稳定的渐变色（缩略图背景）
    function gradientFor(seed){
      let hash = 0;
      for(let i=0;i<seed.length;i++){ hash = (hash*31 + seed.charCodeAt(i)) >>> 0; }
      const a = hash % 360;
      const b = (a + 40 + (hash >> 8) % 80) % 360;
      return `linear-gradient(135deg, hsl(${a} 65% 52%), hsl(${b} 60% 42%))`;
    }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['产品管理','一键模式配置'], title:'一键模式配置',
      desc:'为视频 / 图片的一键模式各勾选若干候选模型，用户在 App 内一键生成时将从所选模型中调度',
    }));
    const container = h('div');
    root.appendChild(container);

    function models(){ return state[tab]; }
    function selCount(t){ return state[t].filter(m=>m.selected).length; }

    function render(){
      container.innerHTML='';

      // 顶部：Segmented 切视频/图片 + 右上角 已选/全选/清空
      const list = models();
      const sel = list.filter(m=>m.selected).length;
      const total = list.length;

      const head = h('div',{class:'row',style:{alignItems:'center',marginBottom:'14px'}},[
        ctx.Segmented(
          [{label:'视频',value:'video'},{label:'图片',value:'image'}],
          tab,
          v=>{ tab=v; render(); }
        ),
        h('div',{class:'flex1'}),
        h('span',{class:'muted small',style:{marginRight:'12px'}},[`已选 ${sel}/${total}`]),
        h('button',{class:'btn btn-sm',onclick:()=>{ list.forEach(m=>m.selected=true); render(); }},['全选']),
        h('button',{class:'btn btn-sm',style:{marginLeft:'8px'},onclick:()=>{ list.forEach(m=>m.selected=false); render(); }},['清空']),
      ]);
      container.appendChild(head);

      // 模型卡片网格
      if(!total){
        container.appendChild(h('div',{class:'panel card-pad muted',style:{textAlign:'center'}},['暂无可配置模型']));
      } else {
        const grid = h('div',{class:'thumb-grid'}, list.map(m=>{
          const card = h('div',{class:'model-card'+(m.selected?' sel':''),onclick:()=>{ m.selected=!m.selected; render(); }},[
            h('div',{class:'model-thumb',style:{background:gradientFor(m.name||m.modelId||'')}},[ (m.name||'?').trim().charAt(0).toUpperCase() ]),
            h('div',{class:'model-name'},[ m.name ]),
            m.selected ? h('div',{class:'model-check'},['✓']) : null,
          ]);
          return card;
        }));
        container.appendChild(grid);
      }

      // 底部：左下"X已选 N 个模型" + 保存按钮
      const footer = h('div',{class:'row',style:{alignItems:'center',marginTop:'18px'}},[
        h('span',{class:'muted small'},[`${TAB_LABEL[tab]}已选 ${sel} 个模型`]),
        h('div',{class:'flex1'}),
        h('button',{class:'btn btn-primary',onclick:()=>{
          ctx.toast('success','一键模式配置已保存');
        }},['保存']),
      ]);
      container.appendChild(footer);
    }

    render();
  }
};
