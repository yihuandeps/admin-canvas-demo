// 用户积分报表（财务） — 商业化管理
// 依据 ~/Desktop/财务后台需求.md（2026-06-12）：期间筛选 + 内/外部 tab + 每用户充值/非充值两行
// 等式口径：期初 + 本期增加 − 本期消耗 − 本期过期 = 期末
window.Pages['finance-points-report'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    // —— 本地 Mock：按"期初固定 + 日均流量 × 期间天数"推算，保证任意期间等式恒成立 ——
    const USERS = [
      // 外部 · 个人
      { id:'7f3ad2c4-9b1e-4f6a-8c2d-0e5b9a31d7f2', name:'林夏', email:'user63@demo.test', type:'personal', scope:'external',
        open:{ r:2400, n:300 }, daily:{ r:{add:200,use:180,exp:0}, n:{add:10,use:12,exp:5} } },
      { id:'b2c91e07-44d8-4a3b-9f60-2a8d7c5e1b43', name:'晚风工作室', email:'user94@demo.test', type:'personal', scope:'external',
        open:{ r:12800, n:500 }, daily:{ r:{add:1000,use:920,exp:0}, n:{add:0,use:10,exp:0} } },
      { id:'e5d20a96-7c31-48be-b1f4-9d6e0c82a715', name:'Kevin Zhang', email:'user60@demo.test', type:'personal', scope:'external',
        open:{ r:0, n:1200 }, daily:{ r:{add:100,use:80,exp:0}, n:{add:20,use:50,exp:10} } },
      { id:'06f8b3d1-25ae-4c97-8e02-c4b7d9163fa8', name:'阿芒影像', email:'user33@demo.test', type:'personal', scope:'external',
        open:{ r:5600, n:800 }, daily:{ r:{add:600,use:540,exp:20}, n:{add:30,use:40,exp:0} } },
      { id:'93ac57e2-d0f4-4b18-a6c9-1e8f25b07d36', name:'Momo Motion', email:'user70@demo.test', type:'personal', scope:'external',
        open:{ r:320, n:150 }, daily:{ r:{add:0,use:8,exp:2}, n:{add:5,use:6,exp:0} } },
      { id:'4d17c9f5-8b2a-4e60-93d8-7a05e1c64b29', name:'老周说剧', email:'user108@demo.test', type:'personal', scope:'external',
        open:{ r:0, n:600 }, daily:{ r:{add:0,use:0,exp:0}, n:{add:0,use:15,exp:5} } },
      // 企业（总账号，子账号已汇总；按人民币结算）
      // modelUse 为各模型消耗的相对权重，详情里按当前期间的本期消耗总量等比分摊
      { id:'org-a1f62d8b-3c54-4970-b8e1-d29c70f5a463', name:'星澜文化（总账号）', email:'user53@demo.test', type:'enterprise', scope:'external',
        currency:'RMB', remark:'按月对账；子账号 12 个；联系人：王会计',
        profit:{ '可灵':20, 'Seedance':12, 'Veo':20, 'Vidu':20, '即梦':20 },
        modelUse:{ 'GPT Image 2':403, 'Gemini 3 Flash':1561, 'Kling o3 Pro':900, 'Kling o3 Standard':1152,
          'Kling v3 Pro':3600, 'Kling v3 Standard':630, 'Nano banana 2':1016, 'Nano banana Pro':3900,
          'Seedance 2.0 fast':620, 'Seedance 2.0 pro':160477, 'Sora 2':440, 'Sora 2 Pro':1560,
          'Veo 3.1':19600, 'Veo 3.1 Fast':1680, 'Vidu q2 Pro':160, 'Vidu q3 Mix':2120, 'Vidu q3 Pro':4580, 'Vidu q3 Turbo':3680 },
        open:{ r:250000, n:0 }, daily:{ r:{add:20000,use:17600,exp:0}, n:{add:0,use:0,exp:0} } },
      { id:'org-c7e94b20-6d18-4f3a-a5c2-08b1f6d73e95', name:'山海互娱（总账号）', email:'user34@demo.test', type:'enterprise', scope:'external',
        currency:'RMB', remark:'新签客户，2026-06 起结算；子账号 5 个',
        profit:{ '可灵':20, 'Seedance':18, 'Veo':20, 'Vidu':20, '即梦':20 },
        modelUse:{ 'Gemini 3 Flash':820, 'Kling o3 Pro':2400, 'Kling o3 Standard':1850, 'Kling v3 Pro':21600,
          'Kling v3 Standard':5200, 'Nano banana Pro':1300, 'Seedance 2.0 pro':9800, 'Sora 2 Pro':3100,
          'Veo 3.1':7400, 'Veo 3.1 Fast':2600, 'Vidu q3 Pro':1900, 'Vidu q3 Turbo':1030 },
        open:{ r:88000, n:0 }, daily:{ r:{add:6000,use:6200,exp:0}, n:{add:0,use:0,exp:0} } },
      // 内部
      { id:'1c5e8a37-f29b-4d06-b743-a90d2e61c584', name:'内容运营-测试号', email:'user80@demo.test', type:'personal', scope:'internal',
        open:{ r:0, n:5000 }, daily:{ r:{add:0,use:0,exp:0}, n:{add:200,use:230,exp:0} } },
      { id:'82d4f6b9-0a73-4e51-9c28-5b1e94d07a36', name:'模型评测组', email:'user69@demo.test', type:'personal', scope:'internal',
        open:{ r:0, n:20000 }, daily:{ r:{add:0,use:0,exp:0}, n:{add:1000,use:990,exp:0} } },
      { id:'f0b73c28-65d1-4a94-8e07-3c2a91d5e6b8', name:'QA-自动化', email:'user85@demo.test', type:'personal', scope:'internal',
        open:{ r:0, n:1000 }, daily:{ r:{add:0,use:0,exp:0}, n:{add:0,use:20,exp:0} } },
    ];

    // 外部/内部 tab 的「模型消耗总览」分布权重：当前 tab 的本期消耗合计按此等比分摊
    const MODEL_MIX={
      external:{ 'GPT Image 2':2200, 'Gemini 3 Flash':4800, 'Kling o3 Pro':1500, 'Kling o3 Standard':2300,
        'Kling v3 Pro':9600, 'Kling v3 Standard':3100, 'Nano banana 2':2800, 'Nano banana Pro':6400,
        'Seedance 2.0 fast':1900, 'Seedance 2.0 pro':24500, 'Sora 2':1200, 'Sora 2 Pro':3400,
        'Veo 3.1':8800, 'Veo 3.1 Fast':2600, 'Vidu q2 Pro':600, 'Vidu q3 Mix':1700, 'Vidu q3 Pro':3900, 'Vidu q3 Turbo':2700 },
      internal:{ 'GPT Image 2':900, 'Gemini 3 Flash':3600, 'Kling o3 Pro':800, 'Kling o3 Standard':1200,
        'Kling v3 Pro':2400, 'Kling v3 Standard':1600, 'Nano banana 2':1100, 'Nano banana Pro':1400,
        'Seedance 2.0 fast':1300, 'Seedance 2.0 pro':3800, 'Sora 2':700, 'Sora 2 Pro':900,
        'Veo 3.1':2100, 'Veo 3.1 Fast':1500, 'Vidu q2 Pro':400, 'Vidu q3 Mix':800, 'Vidu q3 Pro':1200, 'Vidu q3 Turbo':1000 },
    };

    let scope='external';                                   // F2：默认外部；F5：企业用户单独成 tab
    let period={ start:'2026-06-01', end:'2026-06-30' };    // F1：期间是整张表的统计基准
    let filter={ q:'', source:'all' };                      // F3 搜索 / F4 充值非充值
    const SCOPE_LABEL={ external:'外部', internal:'内部', enterprise:'企业' };
    let page=1, pageSize=10;

    const fmtNum=n=>n.toLocaleString('en-US');

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','用户积分报表'],
      title:'用户积分报表（财务）',
      desc:'任选期间查看每个用户的期初 / 本期增加 / 本期消耗 / 本期过期 / 期末积分（每用户固定充值、非充值两行）。等式：期初 + 本期增加 − 本期消耗 − 本期过期 = 期末',
    }));
    const container=h('div');
    root.appendChild(container);

    function periodDays(){
      const s=new Date(period.start+'T00:00:00'), e=new Date(period.end+'T00:00:00');
      if(isNaN(+s)||isNaN(+e)) return 0;
      return Math.round((e-s)/86400000)+1;  // 期初=首日0:00:00，期末=末日23:59:59，天数含两端
    }

    function scopeUsers(){
      // 企业用户单独成 tab：外部/内部 tab 只含个人账号，企业 tab 只含企业总账号
      if(scope==='enterprise') return USERS.filter(u=>u.type==='enterprise');
      return USERS.filter(u=>u.scope===scope && u.type!=='enterprise');
    }

    function buildRows(){
      const days=periodDays();
      const out=[];
      scopeUsers().forEach(u=>{
        [['r','充值'],['n','非充值']].forEach(([k,label])=>{
          const d=u.daily[k], open=u.open[k]||0;
          const add=d.add*days, use=d.use*days, exp=d.exp*days;
          out.push({ u, source:k, sourceLabel:label, open, add, use, exp, close:open+add-use-exp });
        });
      });
      return out;
    }

    function applied(){
      const q=filter.q.trim().toLowerCase();
      return buildRows().filter(r=>{
        if(q && !(r.u.id.toLowerCase().includes(q)||r.u.name.toLowerCase().includes(q)||r.u.email.toLowerCase().includes(q))) return false;
        if(filter.source!=='all' && r.source!==filter.source) return false;
        return true;
      });
    }

    // E1/E3：导出当前 tab + 当前筛选结果的全部行列（含充值/非充值标签列），文件名带期间区间
    // 尾部附加模型积分消耗明细：三个 tab 都带总览段，企业 tab 再按企业逐家附明细段
    function exportExcel(rows){
      if(!rows.length){ ctx.toast('warning','当前筛选结果为空，无可导出数据'); return; }
      const head=['用户ID','用户名','邮箱','账号类型','充值/非充值','期初积分','本期增加','本期消耗','本期过期','期末积分','备注'];
      const esc=v=>{ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
      const lines=[head.join(',')].concat(rows.map(r=>[
        r.u.id, r.u.name, r.u.email,
        r.u.type==='enterprise'?'企业（总账号）':'个人',
        r.sourceLabel, r.open, r.add, r.use, r.exp, r.close,
        r.u.type==='enterprise'?(r.u.remark||''):'',
      ].map(esc).join(',')));
      lines.push('');
      lines.push(esc(`模型消耗总览（${SCOPE_LABEL[scope]}用户 · 期间 ${period.start} 至 ${period.end} · 当前筛选范围）`));
      lines.push('模型名称,消耗量');
      overviewItems(rows).forEach(([n,v])=>lines.push(esc(n)+','+v));
      if(scope==='enterprise'){
        enterpriseGroups(rows).forEach(g=>{
          lines.push('');
          lines.push(esc(`积分消耗明细 — ${g.u.name}`));
          lines.push('模型名称,消耗量');
          allocateByWeight(g.u.modelUse, g.use).forEach(([n,v])=>lines.push(esc(n)+','+v));
        });
      }
      const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`用户积分报表_${period.start.replace(/-/g,'')}-${period.end.replace(/-/g,'')}.csv`;
      a.click(); URL.revokeObjectURL(a.href);
      ctx.toast('success',`已导出 ${rows.length} 行（${SCOPE_LABEL[scope]}用户）`);
    }

    // —— 各模型消耗明细：权重等比分摊（最后一行兜差额，明细合计恒等于总量）+ 参考稿样式列表 ——
    function allocateByWeight(weights, total){
      const names=Object.keys(weights||{});  // 按定义顺序展示（与参考稿一致）
      const sumW=names.reduce((a,n)=>a+weights[n],0)||1;
      let allocated=0;
      return names.map((n,i)=>{
        const v=(i===names.length-1)? total-allocated : Math.round(total*weights[n]/sumW);
        allocated+=v;
        return [n,v];
      });
    }
    function consumptionLine(left,right,head){
      return h('div',{class:'row',style:{
        padding:'9px 14px', alignItems:'center',
        borderTop:head?'none':'1px solid var(--border)',
      }},[
        h('span',{class:(head?'muted small ':'')+'flex1'},[left]),
        h('span',{class:head?'muted small':'mono'},[right]),
      ]);
    }
    function consumptionList(items){
      return h('div',{class:'mt16',style:{border:'1px solid var(--border)',borderRadius:'10px',overflow:'hidden'}},[
        consumptionLine('模型名称','消耗量',true),
        h('div',{style:{maxHeight:'420px',overflowY:'auto'}}, items.map(([n,v])=>consumptionLine(n,fmtNum(v)))),
      ]);
    }

    // 企业积分消耗详情 —— 当前期间内该企业各模型的消耗量（合计=该企业本期消耗）
    function openConsumptionModal(u){
      const days=periodDays();
      const totalUse=(u.daily.r.use+u.daily.n.use)*days;
      ctx.modal({
        title:`积分消耗详情 — ${u.name}`,
        body:[
          h('div',{class:'row gap10',style:{alignItems:'center'}},[
            h('span',{class:'muted small'},['用户ID']), ctx.IdCell(u.id, 30),
          ]),
          h('div',{class:'muted small mt8'},[`期间 ${period.start} 至 ${period.end} · 本期消耗合计 ${fmtNum(totalUse)}（充值+非充值，含全部子账号）`]),
          consumptionList(allocateByWeight(u.modelUse, totalUse)),
        ],
        footer:[],
      });
    }

    // 当前筛选行按企业归组（企业 tab 用：总览合并、导出分企业明细）
    function enterpriseGroups(rows){
      const m=new Map();
      rows.forEach(r=>{ const g=m.get(r.u.id)||{u:r.u,use:0}; g.use+=r.use; m.set(r.u.id,g); });
      return [...m.values()];
    }

    // 各模型消耗总览：外部/内部按 tab 分布权重分摊；企业=各企业明细逐家分摊后合并（口径与「详情」一致）
    function overviewItems(rows){
      if(scope!=='enterprise') return allocateByWeight(MODEL_MIX[scope], rows.reduce((a,r)=>a+r.use,0));
      const map=new Map();
      enterpriseGroups(rows).forEach(g=>{
        allocateByWeight(g.u.modelUse, g.use).forEach(([n,v])=>map.set(n,(map.get(n)||0)+v));
      });
      return [...map.entries()];
    }

    // 模型消耗总览（三个 tab 通用）—— 当前 tab + 当前筛选范围内全部用户的各模型消耗汇总
    function openOverviewModal(){
      const rows=applied();
      const totalUse=rows.reduce((a,r)=>a+r.use,0);
      ctx.modal({
        title:`模型消耗总览 — ${SCOPE_LABEL[scope]}用户`,
        body:[
          h('div',{class:'muted small'},[`期间 ${period.start} 至 ${period.end} · 本期消耗合计 ${fmtNum(totalUse)}（当前筛选范围，充值+非充值${scope==='enterprise'?'，含全部子账号':''}）`]),
          consumptionList(overviewItems(rows)),
        ],
        footer:[],
      });
    }

    // §4.3：企业详情 —— 可编辑备注 + 模型系列级利润率 + 结算币种
    function openEnterpriseModal(u){
      const remarkInput=h('textarea',{class:'textarea',rows:'3',value:u.remark||''});
      remarkInput.value=u.remark||'';
      const profitInputs={};
      const profitRows=Object.keys(u.profit).map(series=>{
        const ipt=h('input',{class:'input',type:'number',min:'0',max:'100',value:String(u.profit[series]),style:{width:'90px'}});
        profitInputs[series]=ipt;
        return h('div',{class:'row gap10 mt8',style:{alignItems:'center'}},[
          h('span',{style:{width:'110px'}},[series]),
          ipt, h('span',{class:'muted small'},['%']),
        ]);
      });
      const m=ctx.modal({
        title:`企业详情 — ${u.name}`,
        body:[
          h('div',{class:'row gap10',style:{alignItems:'center'}},[
            h('span',{class:'muted small'},['结算币种']), Tag('人民币 RMB','amber'),
            h('span',{class:'muted small',style:{marginLeft:'14px'}},['子账号数据已汇总至本总账号']),
          ]),
          h('div',{class:'field mt16'},[ h('label',{},['备注（财务/运营可编辑）']), remarkInput ]),
          h('div',{class:'field mt16'},[
            h('label',{},['各模型利润率（模型系列级，不细分版本）']),
            h('div',{},profitRows),
          ]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            u.remark=remarkInput.value.trim();
            Object.keys(profitInputs).forEach(s=>{ const v=Number(profitInputs[s].value); if(!isNaN(v)) u.profit[s]=v; });
            m.close(); ctx.toast('success','企业备注与利润率已保存'); render();
          }},['保存']),
        ],
      });
    }

    function render(){
      container.innerHTML='';

      // F2 内/外部 tab + F5 企业用户独立 tab；期间、搜索、导出均只作用于当前 tab
      container.appendChild(h('div',{class:'mb12'},[
        ctx.Segmented([
          {label:'外部用户',value:'external'},
          {label:'内部用户',value:'internal'},
          {label:'企业用户',value:'enterprise'},
        ], scope, v=>{ scope=v; page=1; render(); }),
      ]));

      const startIpt=h('input',{class:'input',type:'date',value:period.start,style:{width:'150px'}});
      const endIpt=h('input',{class:'input',type:'date',value:period.end,style:{width:'150px'}});
      startIpt.value=period.start; endIpt.value=period.end;
      const qIpt=h('input',{class:'input',placeholder:'用户ID / 用户名 / 邮箱',style:{width:'220px'},value:filter.q});
      const srcSel=h('select',{class:'select'},[
        ['all','充值/非充值：全部'],['r','仅充值'],['n','仅非充值'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      srcSel.value=filter.source;

      const doSearch=()=>{
        if(startIpt.value && endIpt.value && startIpt.value>endIpt.value){ ctx.toast('error','期间起始日期不能晚于结束日期'); return; }
        period={ start:startIpt.value||period.start, end:endIpt.value||period.end };
        filter={ q:qIpt.value, source:srcSel.value };
        page=1; render();
      };

      container.appendChild(ctx.FilterBar([
        h('span',{class:'muted small'},['期间']), startIpt, h('span',{class:'muted small'},['至']), endIpt,
        qIpt, srcSel,
        h('button',{class:'btn btn-primary',onclick:doSearch},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ period={start:'2026-06-01',end:'2026-06-30'}; filter={q:'',source:'all'}; page=1; render(); }},['↻ 重置']),
        h('div',{class:'flex1'}),
        h('button',{class:'btn',onclick:openOverviewModal},['📊 模型消耗总览']),
        h('button',{class:'btn',onclick:()=>exportExcel(applied())},['⬇ 导出 Excel']),
      ]));

      const rows=applied();
      const sum=k=>rows.reduce((a,r)=>a+r[k],0);
      container.appendChild(h('div',{class:'stat-grid mb18'},[
        ctx.StatCard({label:'期初积分合计', value:fmtNum(sum('open')), sub:`${period.start} 0:00:00`}),
        ctx.StatCard({label:'本期增加合计', value:fmtNum(sum('add'))}),
        ctx.StatCard({label:'本期消耗合计', value:fmtNum(sum('use'))}),
        ctx.StatCard({label:'本期过期合计', value:fmtNum(sum('exp'))}),
        ctx.StatCard({label:'期末积分合计', value:fmtNum(sum('close')), sub:`${period.end} 23:59:59`}),
      ]));

      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);
      const columns=[
        { title:'用户ID', width:190, align:'center', render:r=>ctx.IdCell(r.u.id, 18) },
        { title:'用户名', render:r=>r.u.name },
        { title:'邮箱', render:r=>r.u.email },
        { title:'账号类型', width:130, align:'center', render:r=> r.u.type==='enterprise'
            ? h('div',{class:'row gap6',style:{justifyContent:'center'}},[Tag('企业·总账号','purple'), Tag('RMB','amber')])
            : Tag('个人','gray') },
        { title:'充值/非充值', width:100, align:'center', render:r=> Tag(r.sourceLabel, r.source==='r'?'green':'blue') },
        { title:'期初积分', width:100, align:'center', render:r=>fmtNum(r.open) },
        { title:'本期增加', width:100, align:'center', render:r=>fmtNum(r.add) },
        { title:'本期消耗', width:100, align:'center', render:r=>fmtNum(r.use) },
        { title:'本期过期', width:100, align:'center', render:r=>fmtNum(r.exp) },
        { title:'期末积分', width:110, align:'center', render:r=>fmtNum(r.close) },
      ];
      if(scope==='enterprise'){
        columns.push(
          { title:'备注', width:180, render:r=> h('span',{class:'muted small'},[r.u.remark||'—']) },
          { title:'操作', width:185, align:'center', render:r=> r.source==='r'
              ? h('div',{class:'row gap6',style:{justifyContent:'center'}},[
                  h('button',{class:'btn btn-sm',onclick:()=>openConsumptionModal(r.u)},['详情']),
                  h('button',{class:'btn btn-sm',onclick:()=>openEnterpriseModal(r.u)},['备注/利润率']),
                ])
              : h('span',{class:'muted'},['—']) },
        );
      }
      container.appendChild(ctx.DataTable({
        columns,
        rows:pageRows,
        empty:'当前筛选条件下暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    render();
  }
};
