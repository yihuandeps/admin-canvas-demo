// SKU 管理 — 商业化管理
// 源站(node_39)：非表格，分「一次性商品 / 订阅商品」Tab；卡片网格 + 拖拽排序 + 增删。
window.Pages['sku-management'] = {
  render(root, ctx){
    const { h } = ctx;
    // 价格：源站把分先 /100 再以 $X.XX 展示
    const usd = c => '$'+(((c==null?0:c)/100)).toFixed(2);
    const ENABLED='GOODS_STATUS_ENABLED', DISABLED='GOODS_STATUS_DISABLED';

    const goods = (ctx.data.pay_goods && ctx.data.pay_goods.list) || [];
    const subs  = (ctx.data.pay_sub_goods && ctx.data.pay_sub_goods.list) || [];
    const isYearly = g => !!(g.subscriptionPlan && g.subscriptionPlan.periodType==='MONTHLY' && g.subscriptionPlan.periodInterval>=12);

    // 在售 SKU = 已启用商品（本地副本）
    let credit  = goods.filter(g=>g.status===ENABLED).map(g=>({...g}));
    let monthly = subs.filter(g=>g.status===ENABLED && !isYearly(g)).map(g=>({...g}));
    let yearly  = subs.filter(g=>g.status===ENABLED && isYearly(g)).map(g=>({...g}));

    let tab = 'once';

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','SKU 管理'], title:'SKU 管理',
      desc:'配置用户端在售的积分商品与订阅套餐，支持增删及拖拽排序',
    }));
    const container = h('div');
    root.appendChild(container);

    function card(item, meta, onDel, onMove, idx, listLen){
      return h('div',{class:'sku-card'},[
        h('div',{class:'sku-card-content'},[
          h('div',{class:'sku-card-name bold'},[item.name||'—']),
          h('div',{class:'sku-card-meta small muted'},[meta]),
        ]),
        h('div',{class:'sku-card-actions row gap6'},[
          h('button',{class:'btn btn-sm',disabled:idx<=0,title:'上移',onclick:()=>onMove(idx,-1)},['↑']),
          h('button',{class:'btn btn-sm',disabled:idx>=listLen-1,title:'下移',onclick:()=>onMove(idx,1)},['↓']),
          h('button',{class:'btn btn-sm btn-danger',title:'移除商品',onclick:()=>onDel(item)},['移除']),
        ]),
      ]);
    }

    function section(title, items, cap, addText, onAdd, onDel, onMove, metaFn){
      const grid = h('div',{class:'sku-card-grid thumb-grid'}, items.length
        ? items.map((it,i)=>card(it, metaFn(it), onDel, onMove, i, items.length))
        : [h('div',{class:'muted small',style:{padding:'8px'}},['暂无商品'])]);
      const addBtn = h('button',{class:'btn card-add',disabled: cap!=null && items.length>=cap, onclick:onAdd},['＋ '+addText]);
      return h('section',{class:'sku-section panel card-pad mb18'},[
        h('h3',{class:'sku-section-title bold mb12'},[title]),
        grid,
        h('div',{class:'mt16'},[addBtn]),
      ]);
    }

    function move(list, idx, dir){ const j=idx+dir; if(j<0||j>=list.length) return; const t=list[idx]; list[idx]=list[j]; list[j]=t; render(); }

    function render(){
      container.innerHTML='';
      // Tab
      container.appendChild(h('div',{class:'tabs mb18'},[
        h('button',{class:tab==='once'?'active':'',onclick:()=>{ tab='once'; render(); }},['一次性商品']),
        h('button',{class:tab==='subscription'?'active':'',onclick:()=>{ tab='subscription'; render(); }},['订阅商品']),
      ]));

      if(tab==='once'){
        container.appendChild(section('积分商品(在售)', credit, null, '添加积分商品',
          ()=>addCredit(),
          (it)=>removeFrom(()=>{ credit=credit.filter(x=>x!==it); }),
          (i,d)=>move(credit,i,d),
          (it)=>`${it.points??0} 积分 · ${usd(it.price)}`,
        ));
      } else {
        container.appendChild(section('月付订阅(最多 4 个)', monthly, 4, '添加月付订阅',
          ()=>addSub('monthly'),
          (it)=>removeFrom(()=>{ monthly=monthly.filter(x=>x!==it); }),
          (i,d)=>move(monthly,i,d),
          (it)=>`月付 · ${usd(it.price)}`,
        ));
        container.appendChild(section('年付订阅(最多 4 个)', yearly, 4, '添加年付订阅',
          ()=>addSub('yearly'),
          (it)=>removeFrom(()=>{ yearly=yearly.filter(x=>x!==it); }),
          (i,d)=>move(yearly,i,d),
          (it)=>`年付 · ${usd(it.price)}`,
        ));
      }
    }

    function removeFrom(fn){
      const m = ctx.modal({ title:'确认从 SKU 移除该商品?',
        body:[h('div',{},['移除后该商品将设为「禁用」，商品本身保留。']),],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{ fn(); ctx.toast('success','已移除'); m.close(); render(); }},['确认移除']),
        ]});
    }

    // 候选 = 当前「禁用」状态、对应类型/周期匹配的商品
    function addCredit(){
      const cand = goods.filter(g=>g.status===DISABLED && !credit.find(c=>c.id===g.id));
      pickModal('选择一次性商品', cand,
        '无可选商品(当前没有处于「禁用」状态的一次性商品)',
        g=>`${g.name} · ${usd(g.price)}`,
        g=>{ credit.push({...g, status:ENABLED}); ctx.toast('success','已添加'); render(); });
    }
    function addSub(slot){
      const cap = slot==='monthly'?'月付':'年付';
      const cur = slot==='monthly'?monthly:yearly;
      const cand = subs.filter(g=>g.status===DISABLED && (slot==='monthly'? !isYearly(g) : isYearly(g)) && !cur.find(c=>c.id===g.id));
      pickModal('选择'+cap+'订阅商品', cand,
        '没有可选的订阅商品(候选 = 当前禁用且周期匹配的订阅商品)',
        g=>g.salePrice!=null?`${g.name} · ${usd(g.price)} → 折后 ${usd(g.salePrice)}`:`${g.name} · ${usd(g.price)}`,
        g=>{ (slot==='monthly'?monthly:yearly).push({...g, status:ENABLED}); ctx.toast('success','已添加'); render(); });
    }

    function pickModal(title, cand, emptyMsg, labelFn, onPick){
      let chosen = '';
      const sel = h('select',{class:'select',style:{width:'100%'}},[
        h('option',{value:''},['搜索 / 选择商品']),
        ...cand.map(g=>h('option',{value:g.id},[labelFn(g)]))
      ]);
      sel.onchange=()=>{ chosen=sel.value; };
      const body = cand.length
        ? [ h('label',{class:'field'},[h('label',{},['商品名称 *']), sel]) ]
        : [ h('div',{class:'muted',style:{padding:'12px 0'}},[emptyMsg]) ];
      const m = ctx.modal({ title, body,
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',disabled:!cand.length,onclick:()=>{
            const g = cand.find(x=>x.id===chosen);
            if(!g){ ctx.toast('error','请选择商品'); return; }
            onPick(g); m.close();
          }},['确定']),
        ]});
    }

    render();
  }
};
