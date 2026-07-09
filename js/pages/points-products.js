// 商品管理 — 商业化管理
window.Pages['points-products'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      GOODS_STATUS_ENABLED:{text:'启用',color:'green'},
      GOODS_STATUS_DISABLED:{text:'禁用',color:'gray'},
    };
    function statusInfo(s){ return STATUS[s] || {text:s||'—',color:'gray'}; }
    // price/salePrice 单位为「分」，展示折算为美元 → $24.90
    const usd = c => (c==null?'—':'$'+(c/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));

    let all = ((ctx.data.pay_goods && ctx.data.pay_goods.list) || []).map(g=>({
      id:g.id, name:g.name, nameEn:g.nameEn, description:g.description||'',
      status:g.status, price:g.price, salePrice:g.salePrice, points:g.points,
      currency:g.currency, payPlatform:g.payPlatform, thirdPartyProductId:g.thirdPartyProductId||'',
      createdAtUnixSecond:g.createdAtUnixSecond, updatedAtUnixSecond:g.updatedAtUnixSecond,
    }));

    let filter = { status:'all', kw:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','商品管理'], title:'商品管理',
      desc:'管理积分一次性商品与订阅商品的配置、定价及权益绑定',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>openEdit(null)},['新建商品']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.status!=='all' && r.status!==filter.status) return false;
        if(filter.kw && !((r.name||'').toLowerCase().includes(filter.kw.toLowerCase()))) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn = h('input',{class:'input',placeholder:'商品名称',value:filter.kw,style:{minWidth:'160px'}});
      const stSel = h('select',{class:'select'},[['all','全部状态'],['GOODS_STATUS_ENABLED','启用'],['GOODS_STATUS_DISABLED','禁用']
      ].map(([v,t])=>h('option',{value:v},[t])));
      stSel.value = filter.status;

      container.appendChild(ctx.FilterBar([
        kwIn, stSel,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={status:stSel.value,kw:kwIn.value.trim()}; page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={status:'all',kw:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'商品名称', render:r=>r.name||'—' },
          { title:'商品ID', width:200, render:r=>ctx.IdCell(r.id, 18) },
          { title:'原价', width:110, align:'center', render:r=>usd(r.price) },
          { title:'折扣价', width:110, align:'center', render:r=>r.salePrice!=null?usd(r.salePrice):h('span',{class:'small muted'},['—']) },
          { title:'商品三方平台IAP', width:160, render:r=>r.thirdPartyProductId?h('span',{class:'mono small'},[r.thirdPartyProductId]):h('span',{class:'small muted'},['—']) },
          { title:'状态', width:90, align:'center', render:r=>{ const i=statusInfo(r.status); return Tag(i.text,i.color); } },
          { title:'操作', width:180, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
            h('button',{class:'btn btn-sm',onclick:()=>openEdit(r)},['编辑']),
            h('button',{class:'btn btn-sm',onclick:()=>bindPerks(r)},['权益绑定']),
            h('button',{class:'btn btn-sm btn-danger',onclick:()=>confirmDel(r)},['删除']),
          ]) },
        ],
        rows:pageRows,
        empty:'暂无商品数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    function bindPerks(r){
      const ents = (ctx.data.entitlements && ctx.data.entitlements.list) || [];
      r._perks = r._perks || new Set();
      const m = ctx.modal({ size:'lg', title:'权益绑定 — '+(r.name||r.id),
        body:()=>{
          const grid = h('div',{class:'thumb-grid'}, ents.slice(0,40).map(e=>{
            const sel = r._perks.has(e.id);
            return h('div',{class:'model-card'+(sel?' sel':''),onclick:()=>{
              if(r._perks.has(e.id)) r._perks.delete(e.id); else r._perks.add(e.id);
              m.close(); bindPerks(r);
            }},[
              h('div',{class:'model-name'},[e.name||e.code]),
              h('div',{class:'model-check'},[sel?'✓':'']),
            ]);
          }));
          return [
            h('div',{class:'small muted mb12'},['勾选购买该商品后自动发放的权益项']),
            grid,
          ];
        },
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{ ctx.toast('success','已保存权益绑定，共 '+r._perks.size+' 项'); m.close(); }},['保存']),
        ],
      });
    }

    function openEdit(r){
      const isNew = !r;
      const nameIn = h('input',{class:'input',placeholder:'请输入商品名称',value:r?(r.name||''):''});
      const priceIn = h('input',{class:'input',placeholder:'原价（美元），如 24.90',value:r?(r.price/100):''});
      const saleIn = h('input',{class:'input',placeholder:'折扣价（美元），可留空',value:r&&r.salePrice!=null?(r.salePrice/100):''});
      const stSel = h('select',{class:'select'},[['GOODS_STATUS_ENABLED','启用'],['GOODS_STATUS_DISABLED','禁用']
      ].map(([v,t])=>h('option',{value:v},[t])));
      stSel.value = r?r.status:'GOODS_STATUS_ENABLED';
      const tppIn = h('input',{class:'input',placeholder:'三方平台 IAP 字段(可留空)',value:r?(r.thirdPartyProductId||''):''});

      const m = ctx.modal({
        title: isNew?'新建商品':'编辑商品',
        body:[
          h('div',{class:'field'},[h('label',{},['商品名称']), nameIn]),
          h('div',{class:'field'},[h('label',{},['原价（美元）']), priceIn]),
          h('div',{class:'field'},[h('label',{},['折扣价（美元）']), saleIn]),
          h('div',{class:'field'},[h('label',{},['商品三方平台 IAP']), tppIn]),
          h('div',{class:'field'},[h('label',{},['状态']), stSel]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            if(!nameIn.value.trim()){ ctx.toast('warning','请输入商品名称'); return; }
            const p = parseFloat(priceIn.value);
            if(isNaN(p) || p<=0){ ctx.toast('warning','请输入原价（须大于 0）'); return; }
            let sp = null;
            if(String(saleIn.value).trim()!==''){ const v=parseFloat(saleIn.value); if(isNaN(v)||v<=0){ ctx.toast('warning','折扣价须大于 0'); return; } sp=Math.round(v*100); }
            if(isNew){
              all.unshift({ id:'019'+Math.random().toString(16).slice(2,18), name:nameIn.value.trim(), nameEn:null,
                description:'', status:stSel.value, price:Math.round(p*100), salePrice:sp, points:0,
                currency:'USD', payPlatform:'PAY_PLATFORM_WAFFO', thirdPartyProductId:tppIn.value.trim(),
                createdAtUnixSecond:Math.floor(Date.now()/1000), updatedAtUnixSecond:Math.floor(Date.now()/1000) });
              ctx.toast('success','创建成功');
            } else {
              r.name=nameIn.value.trim(); r.price=Math.round(p*100);
              r.salePrice=sp; r.status=stSel.value; r.thirdPartyProductId=tppIn.value.trim();
              r.updatedAtUnixSecond=Math.floor(Date.now()/1000);
              ctx.toast('success','编辑成功');
            }
            m.close(); page=1; render();
          }},['确定']),
        ],
      });
    }

    function confirmDel(r){
      const m = ctx.modal({
        title:'确认删除商品',
        body:[h('div',{},['确认删除该商品「'+(r.name||r.id)+'」？'])],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            all = all.filter(x=>x.id!==r.id);
            ctx.toast('success','删除成功'); m.close(); render();
          }},['确认']),
        ],
      });
    }

    render();
  }
};
