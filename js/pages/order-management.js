// 订单管理 — 商业化管理
window.Pages['order-management'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      PENDING:{text:'待支付',color:'amber'},
      PAID:{text:'已付款',color:'green'},
      DELIVERED:{text:'已交付',color:'blue'},
      CANCELED:{text:'已取消',color:'gray'},
      REFUNDED:{text:'已退款',color:'red'},
    };
    function statusInfo(s){ return STATUS[s] || {text:s||'未知',color:'gray'}; }
    const PLATFORM = {
      PAY_PLATFORM_WAFFO:{text:'Waffo',color:'green'},
      PAY_PLATFORM_STRIPE:{text:'Stripe',color:'purple'},
    };
    function platformInfo(p){ return PLATFORM[p] || {text:(p||'').replace('PAY_PLATFORM_','')||'—',color:'gray'}; }
    const USERTYPE = {
      PAY_ORDER_USER_TYPE_INTERNAL:'内部用户',
      PAY_ORDER_USER_TYPE_EXTERNAL:'外部用户',
    };
    // goodsPrice 单位为「分」 → 展示「USD 19.90」
    const money = (c,cur) => (c==null?'—':(cur||'USD')+' '+(c/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));

    const src = (ctx.data.pay_orders) || {};
    let all = (src.payOrders || []).map(o=>({
      id:o.id, userId:o.userId, goodsId:o.goodsId, goodsName:o.goodsName, status:o.status,
      goodsPrice:o.goodsPrice, refundedAmount:o.refundedAmount||0, currency:o.currency,
      payPlatform:o.payPlatform, payType:o.payType, email:o.email, username:o.username,
      userType:o.userType, createdAtUnixSecond:o.createdAtUnixSecond,
      acquiringOrderId:o.acquiringOrderId||'', paymentRequestId:o.paymentRequestId||'',
      subscriptionId:o.subscriptionId||'',
    }));
    const stat = src.payOrderStat || {};

    let filter = { tab:'ONE_TIME', status:'all', platform:'all', userType:'all', userId:'', kw:'', from:'', to:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','订单管理'], title:'订单管理',
      desc:'查看一次性与订阅订单的支付状态，并对已付款订单发起退款或关单',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.tab==='ONE_TIME' && r.payType!=='ONE_TIME') return false;
        if(filter.tab==='SUBSCRIPTION' && r.payType!=='SUBSCRIPTION') return false;
        if(filter.status!=='all' && r.status!==filter.status) return false;
        if(filter.platform!=='all' && r.payPlatform!==filter.platform) return false;
        if(filter.userType!=='all' && r.userType!==filter.userType) return false;
        if(filter.userId && String(r.userId)!==filter.userId) return false;
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          if(!((r.username||'').toLowerCase().includes(k) || (r.email||'').toLowerCase().includes(k))) return false;
        }
        if(filter.from){ const f=Math.floor(new Date(filter.from+'T00:00:00').getTime()/1000); if(r.createdAtUnixSecond<f) return false; }
        if(filter.to){ const t=Math.floor(new Date(filter.to+'T23:59:59').getTime()/1000); if(r.createdAtUnixSecond>t) return false; }
        return true;
      });
    }

    function render(){
      container.innerHTML='';

      // 筛选栏（最上：状态/平台/用户类型 + 日期范围 + 搜索 + 下载Excel）
      const stSel = h('select',{class:'select'},[['all','全部状态'],['PENDING','待支付'],['PAID','已付款'],
        ['DELIVERED','已交付'],['CANCELED','已取消'],['REFUNDED','已退款']
      ].map(([v,t])=>h('option',{value:v},[t])));
      stSel.value = filter.status;
      const plSel = h('select',{class:'select'},[['all','全部平台'],['PAY_PLATFORM_WAFFO','Waffo'],['PAY_PLATFORM_STRIPE','Stripe']
      ].map(([v,t])=>h('option',{value:v},[t])));
      plSel.value = filter.platform;
      const utSel = h('select',{class:'select'},[['all','全部用户'],['PAY_ORDER_USER_TYPE_INTERNAL','内部用户'],['PAY_ORDER_USER_TYPE_EXTERNAL','外部用户']
      ].map(([v,t])=>h('option',{value:v},[t])));
      utSel.value = filter.userType;
      const uidIn = h('input',{class:'input',placeholder:'订单ID',value:filter.orderId||'',style:{minWidth:'160px'}});
      const userIdIn = h('input',{class:'input',placeholder:'用户ID（UUID 精确匹配）',value:filter.userId,style:{minWidth:'200px'}});
      const kwIn = h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.kw,style:{minWidth:'160px'}});
      const fromIn = h('input',{class:'input',type:'date',value:filter.from,style:{minWidth:'140px'}});
      const toIn = h('input',{class:'input',type:'date',value:filter.to,style:{minWidth:'140px'}});

      container.appendChild(ctx.FilterBar([
        stSel, plSel, utSel, uidIn, userIdIn, kwIn,
        h('span',{class:'small muted'},['日期']), fromIn, h('span',{class:'small muted'},['至']), toIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          const uid = userIdIn.value.trim();
          if(uid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)){
            ctx.toast('warning','用户ID 格式不正确：需为完整 UUID'); return;
          }
          filter.status=stSel.value; filter.platform=plSel.value; filter.userType=utSel.value;
          filter.orderId=uidIn.value.trim(); filter.userId=uid; filter.kw=kwIn.value.trim();
          filter.from=fromIn.value; filter.to=toIn.value; page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={tab:filter.tab,status:'all',platform:'all',userType:'all',userId:'',kw:'',from:'',to:''}; page=1; render(); }},['↻ 重置']),
        h('button',{class:'btn',onclick:()=>ctx.toast('success','下载 Excel（本地模拟，未发起请求）')},['下载 Excel']),
      ]));

      // 分段 Tab
      container.appendChild(h('div',{class:'tabs mb12'},[
        h('button',{class:filter.tab==='ONE_TIME'?'active':'',onclick:()=>{ filter.tab='ONE_TIME'; page=1; render(); }},['一次性订单']),
        h('button',{class:filter.tab==='SUBSCRIPTION'?'active':'',onclick:()=>{ filter.tab='SUBSCRIPTION'; page=1; render(); }},['订阅订单']),
      ]));

      const rows = applied();

      // 统计卡（基于筛选后结果）
      const paidCount = rows.filter(r=>r.status==='PAID'||r.status==='DELIVERED').length;
      const income = rows.filter(r=>r.status==='PAID'||r.status==='DELIVERED').reduce((s,r)=>s+(r.goodsPrice||0)/100,0);
      container.appendChild(h('div',{class:'stat-grid mb18'},[
        ctx.StatCard({ label:'订单数', value:String(rows.length) }),
        ctx.StatCard({ label:'已付款 / 已交付', value:String(paidCount) }),
        ctx.StatCard({ label:'收入(USD)', value:income.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) }),
      ]));

      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'日期', width:170, align:'center', render:r=>ctx.fmtUnix(r.createdAtUnixSecond) },
          { title:'订单ID', width:200, render:r=>ctx.IdCell(r.id, 18) },
          { title:'用户ID', width:200, render:r=>ctx.IdCell(r.userId, 18) },
          { title:'用户名', width:110, render:r=>r.username||'—' },
          { title:'邮箱', render:r=>h('span',{class:'small'},[r.email||'—']) },
          { title:'用户类型', width:100, align:'center', render:r=>Tag(USERTYPE[r.userType]||'—','gray') },
          { title:'商品名称', width:120, render:r=>r.goodsName||'—' },
          { title:'金额', width:120, align:'center', render:r=>money(r.goodsPrice, r.currency) },
          { title:'支付平台', width:100, align:'center', render:r=>{ const i=platformInfo(r.payPlatform); return Tag(i.text,i.color); } },
          { title:'状态', width:90, align:'center', render:r=>{ const i=statusInfo(r.status); return Tag(i.text,i.color); } },
          { title:'操作', width:180, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无订单数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    function actionCell(r){
      const btns = [];
      if(r.status==='PENDING'){
        btns.push(h('button',{class:'btn btn-sm',onclick:()=>showInfo(r)},['详情']));
        btns.push(h('button',{class:'btn btn-sm btn-danger',onclick:()=>closeOrder(r)},['关闭订单']));
      } else if(r.status==='PAID' || r.status==='DELIVERED'){
        btns.push(h('button',{class:'btn btn-sm',onclick:()=>showInfo(r)},['详情']));
        btns.push(h('button',{class:'btn btn-sm btn-danger',onclick:()=>refund(r)},['退款']));
      } else {
        btns.push(h('button',{class:'btn btn-sm',onclick:()=>showInfo(r)},['详情']));
      }
      return h('div',{class:'row gap6',style:{justifyContent:'center'}}, btns);
    }

    function showInfo(r){
      ctx.modal({ title:'订单详情 — 支付平台信息', body:[
        h('div',{class:'kv'},[
          h('dt',{},['订单ID']), h('dd',{class:'mono small'},[r.id]),
          h('dt',{},['用户ID']), h('dd',{class:'mono small'},[r.userId||'—']),
          h('dt',{},['用户类型']), h('dd',{},[USERTYPE[r.userType]||'—']),
          h('dt',{},['支付平台']), h('dd',{},[platformInfo(r.payPlatform).text]),
          h('dt',{},['金额']), h('dd',{},[money(r.goodsPrice,r.currency)]),
          h('dt',{},['已退款']), h('dd',{},[money(r.refundedAmount,r.currency)]),
          h('dt',{},['订阅来源ID']), h('dd',{class:'mono small'},[r.subscriptionId||'—']),
        ]),
      ]});
    }

    function refund(r){
      const amtIn = h('input',{class:'input',placeholder:'退款金额(USD)，留空=全额退款'});
      const reasonIn = h('input',{class:'input',placeholder:'退款原因(可选)'});
      const m = ctx.modal({ title:'发起退款',
        body:[
          h('div',{class:'small muted mb12'},['退款将调用支付平台，最终状态以平台回调为准']),
          h('div',{class:'field'},[h('label',{},['退款金额(USD)']), amtIn, h('div',{class:'small muted mt8'},['留空全额退款'])]),
          h('div',{class:'field'},[h('label',{},['退款原因']), reasonIn]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            r.status='REFUNDED'; r.refundedAmount=r.goodsPrice;
            ctx.toast('success','已发起退款，最终状态以支付平台回调为准'); m.close(); render();
          }},['确认退款']),
        ]});
    }

    function closeOrder(r){
      const m = ctx.modal({ title:'关闭订单',
        body:[h('div',{},['将调用支付平台关闭该订单并置为已取消，确认？'])],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            r.status='CANCELED'; ctx.toast('success','已关闭订单'); m.close(); render();
          }},['确认']),
        ]});
    }

    render();
  }
};
