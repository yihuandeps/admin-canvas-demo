// 用户列表 — 用户管理
// 本期企业账号体系升级**不修改用户列表**（不展示团队类型 / 所属企业 / 身份 / 会员等级 / 用户详情）。
window.Pages['user-list'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      USER_STATUS_NORMAL:{text:'正常', color:'green'},
      USER_STATUS_BANNED:{text:'已封禁', color:'red'},
      USER_STATUS_DELETED:{text:'已删除', color:'gray'},
    };
    function statusTag(u){
      if(u.status==='USER_STATUS_BANNED'){
        return Tag(u.bannedRemainingDays<0?'永久封禁':'已封禁', 'red');
      }
      const base = STATUS[u.status] || {text:'未知', color:'gray'};
      return Tag(base.text, base.color);
    }

    const src = (ctx.data.users_list && (ctx.data.users_list.users||ctx.data.users_list.list)) || [];
    const total = (ctx.data.users_list && ctx.data.users_list.pagination && ctx.data.users_list.pagination.total) || src.length;
    let all = src.map(u=>Object.assign({}, u));

    let filter = { userId:'', kw:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['用户管理','用户列表'], title:'用户列表',
      desc:'查询注册用户信息，并对其执行送积分、发消息、封禁与解封等管理操作',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.userId && String(r.id)!==filter.userId) return false;
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          if(!((r.username||'').toLowerCase().includes(k) || (r.email||'').toLowerCase().includes(k))) return false;
        }
        return true;
      });
    }
    function realTotal(rows){
      return (!filter.userId && !filter.kw) ? total : rows.length;
    }

    function render(){
      container.innerHTML='';
      const idIn=h('input',{class:'input',placeholder:'用户ID（UUID 精确匹配）',value:filter.userId,style:{minWidth:'260px'}});
      const kwIn=h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.kw,style:{minWidth:'180px'}});
      container.appendChild(ctx.FilterBar([
        idIn, kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={userId:idIn.value.trim(), kw:kwIn.value.trim()}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={userId:'',kw:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'用户ID', width:170, render:r=>ctx.IdCell(r.id,18) },
          { title:'用户名', render:r=>r.username||'—' },
          { title:'邮箱', render:r=>r.email||'—' },
          { title:'注册时间', width:120, align:'center', render:r=>ctx.fmtDateOnly(r.createdAt) },
          { title:'剩余购买积分', width:110, align:'center', render:r=> (r.rechargeAvailablePoints!=null? r.rechargeAvailablePoints : 0) },
          { title:'剩余赠送积分', width:110, align:'center', render:r=> (r.giftAvailablePoints!=null? r.giftAvailablePoints : 0) },
          { title:'消耗记录', width:80, align:'center', render:r=>h('button',{class:'btn-ghost btn-sm',style:{color:'var(--primary,#3b82f6)'},onclick:()=>showRecords(r,'consume')},['查看']) },
          { title:'发放记录', width:80, align:'center', render:r=>h('button',{class:'btn-ghost btn-sm',style:{color:'var(--primary,#3b82f6)'},onclick:()=>showRecords(r,'grant')},['查看']) },
          { title:'状态', width:110, align:'center', render:r=>statusTag(r) },
          { title:'操作', width:240, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:realTotal(rows) },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function showRecords(r, kind){
      ctx.modal({ title:(kind==='consume'?'消耗记录':'发放记录')+' — '+(r.username||r.id), body:[
        h('div',{class:'empty-state'},['暂无'+(kind==='consume'?'消耗':'发放')+'记录']),
      ]});
    }

    function actionCell(r){
      const banned = r.status==='USER_STATUS_BANNED';
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',onclick:()=>grant(r)},['送积分']),
        h('button',{class:'btn btn-sm',onclick:()=>sendMsg(r)},['发消息']),
        banned
          ? h('button',{class:'btn btn-sm',onclick:()=>unban(r)},['解封'])
          : h('button',{class:'btn btn-sm btn-danger',onclick:()=>ban(r)},['封禁']),
      ]);
    }

    function grant(r){
      const typeSel=h('select',{class:'select'},[
        ['POINT_BUCKET_TYPE_GIFT','赠送积分'],['POINT_BUCKET_TYPE_RECHARGE','购买积分'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      const numIn=h('input',{class:'input',type:'number',placeholder:'发放积分',value:''});
      const ta=h('textarea',{class:'textarea',placeholder:'输入发放理由说明（必填）'});
      const m=ctx.modal({ title:'发放积分 — '+(r.username||r.id), body:[
        h('div',{class:'field'},[h('label',{},['积分类型']), typeSel]),
        h('div',{class:'field'},[h('label',{},['发放积分 *']), numIn]),
        h('div',{class:'field'},[h('label',{},['发放理由 *']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          const n=Number(numIn.value);
          if(!(n>0)){ ctx.toast('warning','积分必须大于0'); return; }
          if(!ta.value.trim()){ ctx.toast('warning','请输入发放理由说明'); return; }
          if(typeSel.value==='POINT_BUCKET_TYPE_GIFT'){
            r.giftAvailablePoints=(r.giftAvailablePoints||0)+n;
            r.giftTotalPoints=(r.giftTotalPoints||0)+n;
          } else {
            r.rechargeAvailablePoints=(r.rechargeAvailablePoints||0)+n;
            r.rechargeTotalPoints=(r.rechargeTotalPoints||0)+n;
          }
          ctx.toast('success','积分发放成功'); m.close(); render();
        }},['确定']),
      ]});
    }

    function sendMsg(r){
      const ta=h('textarea',{class:'textarea',placeholder:'输入消息内容'});
      const m=ctx.modal({ title:'发消息 — '+(r.username||r.id), body:[
        h('div',{class:'field'},[h('label',{},['消息内容']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!ta.value.trim()){ ctx.toast('warning','请输入消息内容'); return; }
          ctx.toast('success','消息发送成功'); m.close();
        }},['确定']),
      ]});
    }

    function ban(r){
      const timeSel=h('select',{class:'select'},[
        ['','请选择封禁时间'],['1','1天'],['7','7天'],['30','30天'],['-1','永久'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      const ta=h('textarea',{class:'textarea',placeholder:'输入封禁理由'});
      const m=ctx.modal({ title:'封禁用户 — '+(r.username||r.id), body:[
        h('div',{class:'field'},[h('label',{},['封禁时间']), timeSel]),
        h('div',{class:'field'},[h('label',{},['封禁理由']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          if(!timeSel.value){ ctx.toast('warning','请选择封禁时间'); return; }
          if(!ta.value.trim()){ ctx.toast('warning','请输入封禁理由'); return; }
          r.status='USER_STATUS_BANNED';
          r.bannedRemainingDays = Number(timeSel.value);
          ctx.toast('success','用户封禁成功'); m.close(); render();
        }},['确定']),
      ]});
    }

    function unban(r){
      const m=ctx.modal({ title:'解封用户', body:[
        h('div',{},['确定解封该用户「'+(r.username||r.id)+'」？']),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          r.status='USER_STATUS_NORMAL'; r.bannedRemainingDays=0;
          ctx.toast('success','用户解封成功'); m.close(); render();
        }},['确定']),
      ]});
    }

    render();
  }
};
