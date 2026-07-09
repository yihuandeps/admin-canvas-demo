// 非会员权益 — 商业化管理
window.Pages['non-member-entitlements'] = {
  render(root, ctx){
    const { h } = ctx;
    const perks = (ctx.data.free_perks && ctx.data.free_perks.perks) || {};
    // 本地副本
    let selected = new Set((perks.models||[]).map(m=>m.id));
    let concurrency = perks.concurrency != null ? perks.concurrency : 1;

    // 可选模型池：以 free_perks 自带为基础，并补充 organizations 里出现过的模型，去重
    const pool = {};
    (perks.models||[]).forEach(m=>{ pool[m.id]=m.name; });
    const orgs = (ctx.data.organizations && ctx.data.organizations.list) || [];
    orgs.forEach(o=>((o.perks&&o.perks.models)||[]).forEach(m=>{ if(!pool[m.id]) pool[m.id]=m.name; }));
    const allModels = Object.keys(pool).map(id=>({id,name:pool[id]}));

    function gradientFor(s){
      let n=0; for(let i=0;i<s.length;i++) n=(n*31+s.charCodeAt(i))>>>0;
      const a=n%360, b=(a+40)%360;
      return `linear-gradient(135deg,hsl(${a},60%,55%),hsl(${b},60%,45%))`;
    }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','非会员权益'], title:'非会员权益',
      desc:'配置非会员（未购买订阅或未绑定企业）可使用的 AI 模型范围与并发上限',
    }));
    const container = h('div');
    root.appendChild(container);

    function render(){
      container.innerHTML='';

      const grid = h('div',{class:'thumb-grid'}, allModels.map(m=>{
        const sel = selected.has(m.id);
        return h('div',{class:'model-card'+(sel?' sel':''),onclick:()=>{
          if(selected.has(m.id)) selected.delete(m.id); else selected.add(m.id);
          render();
        }},[
          h('div',{class:'model-thumb',style:{background:gradientFor(m.name||m.id||'')}},[ (m.name||'?').trim().charAt(0).toUpperCase() ]),
          h('div',{class:'model-name'},[m.name]),
          sel? h('div',{class:'model-check'},['✓']) : null,
        ]);
      }));

      const concIn = h('input',{class:'input',value:String(concurrency),style:{maxWidth:'160px'}});

      container.appendChild(h('div',{class:'panel card-pad'},[
        h('div',{class:'row',style:{justifyContent:'space-between',alignItems:'center'}},[
          h('div',{class:'bold'},['可用模型']),
          h('span',{class:'small muted'},['已选 '+selected.size+' 个模型']),
        ]),
        h('div',{class:'small muted mb12 mt8'},['勾选非会员用户在画布中可使用的 AI 模型']),
        grid,
        h('div',{class:'divider mt16 mb12'}),
        h('div',{class:'field',style:{maxWidth:'320px'}},[
          h('label',{},['并发上限']),
          concIn,
          h('div',{class:'small muted mt8'},['非会员同一时刻最多并发的模型请求数（1-100）']),
        ]),
        h('div',{class:'row mt16',style:{alignItems:'center'}},[
          h('button',{class:'btn btn-primary',onclick:()=>{
            const c = parseInt(concIn.value,10);
            if(isNaN(c) || c<1 || c>100){ ctx.toast('warning','并发上限需为 1-100 的整数'); return; }
            concurrency = c;
            const list = allModels.filter(m=>selected.has(m.id));
            if(ctx.data.free_perks) ctx.data.free_perks.perks = { models:list, concurrency:c };
            ctx.toast('success','已保存');
          }},['保存']),
          h('span',{class:'small muted',style:{marginLeft:'12px'}},['保存后立即生效，覆盖此前的非会员权益配置']),
        ]),
      ]));
    }

    render();
  }
};
