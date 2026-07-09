// 订阅管理 — 测试 Portal
// 本期企业账号体系升级**不修改订阅管理**（保持原样）。
window.Pages['test-subscription-manage'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      active:{text:'活跃', color:'#4ade80'},
      in_progress:{text:'进行中', color:'#60a5fa'},
      authorization_required:{text:'待授权', color:'#f59e0b'},
      close:{text:'已关闭', color:'#9ca3af'},
      expired:{text:'已过期', color:'#9ca3af'},
    };
    const PLAT = { PAY_PLATFORM_WAFFO:'Waffo', PAY_PLATFORM_STRIPE:'Stripe' };
    const platName = p => PLAT[p] || p || '—';

    const src = (ctx.data.test_subscriptions && (ctx.data.test_subscriptions.list||ctx.data.test_subscriptions.items)) || [];
    const total = (ctx.data.test_subscriptions && ctx.data.test_subscriptions.total) || 384;
    let all = src.map(s=>Object.assign({}, s));

    let filter = { userId:'', status:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['测试 Portal','订阅管理'], title:'订阅管理',
      desc:'全局订阅列表,可按用户 ID / 状态筛选,支持跳转三方门户管理、取消或直接关闭订阅',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.userId && String(r.userId)!==filter.userId) return false;
        if(filter.status && r.status!==filter.status) return false;
        return true;
      });
    }
    function realTotal(rows){
      return (!filter.userId && !filter.status) ? total : rows.length;
    }
    function fmtAmount(r){
      if(r.amount==null) return '—';
      return (r.amount/100).toFixed(2)+' '+(r.currency||'');
    }

    function render(){
      container.innerHTML='';
      const idIn=h('input',{class:'input',placeholder:'用户ID',value:filter.userId,style:{minWidth:'260px'}});
      const stSel=h('select',{class:'select'},[
        ['','全部状态'],['active','活跃'],['in_progress','进行中'],['authorization_required','待授权'],['close','已关闭'],['expired','已过期'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      stSel.value=filter.status;
      container.appendChild(ctx.FilterBar([
        idIn, stSel,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={userId:idIn.value.trim(), status:stSel.value}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={userId:'',status:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'商品名称', width:120, render:r=>r.goodsName||'—' },
          { title:'用户ID', width:170, render:r=>ctx.IdCell(r.userId,18) },
          { title:'订阅状态', width:90, align:'center', render:r=>{ const s=STATUS[r.status]||{text:r.status||'—',color:'#9ca3af'}; return Tag(s.text, s.color); } },
          { title:'支付平台', width:90, align:'center', render:r=>platName(r.payPlatform) },
          { title:'金额', width:130, align:'center', render:r=>fmtAmount(r) },
          { title:'已扣款期数', width:100, align:'center', render:r=> (r.paidPeriodCount!=null?r.paidPeriodCount:0) },
          { title:'当前期到期', width:170, align:'center', render:r=> r.currentPeriodEndUnixSecond?ctx.fmtUnix(r.currentPeriodEndUnixSecond):'-' },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtUnix(r.createdAtUnixSecond) },
          { title:'操作', width:220, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:realTotal(rows) },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      const closed = r.status==='close' || r.status==='expired';
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>{
          if(r.managementUrl){ window.open(r.managementUrl,'_blank'); }
          else ctx.toast('info','无三方门户链接');
        }},['门户管理']),
        closed ? h('span',{class:'muted'},['—']) : h('div',{class:'row gap6'},[
          h('button',{class:'btn btn-sm',onclick:()=>confirmDo(r,'cancel')},['取消']),
          h('button',{class:'btn btn-sm btn-danger',onclick:()=>confirmDo(r,'close')},['关闭']),
        ]),
      ]);
    }

    function confirmDo(r, action){
      const word = action==='cancel'?'取消':'关闭';
      const m=ctx.modal({ title:word+'订阅', body:[h('div',{},['确定'+word+'用户「'+r.userId+'」的订阅「'+(r.goodsName||'')+'」？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ r.status='close'; ctx.toast('success','已'+word+'订阅'); m.close(); render(); }},['确认'+word]),
      ]});
    }

    render();
  }
};
