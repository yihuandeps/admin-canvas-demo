// 全员消息通知 — 运营管理
window.Pages['broadcast-message'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const MEMBER = {
      member:{text:'会员',color:'#4ade80'},
      expired:{text:'过期会员',color:'#f5b544'},
      non_member:{text:'非会员',color:'#6e6e6e'},
    };
    function mapMember(u){
      // 真实接口 membershipStatus；本地样例无会员标识，默认非会员
      const m=u.membershipStatus;
      if(m==='member'||m==='expired'||m==='non_member') return m;
      return 'non_member';
    }

    const total=(ctx.data.users_list&&ctx.data.users_list.registeredCount)||225;
    const raw=(ctx.data.users_list&&ctx.data.users_list.users)||[];
    let all=raw.map(u=>({ id:u.id, username:u.username, email:u.email, member:mapMember(u) }));

    let filter={ member:'all', goods:'', daysMin:'', daysMax:'', payTimes:'' };
    const selected=new Set();
    let page=1, pageSize=10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','全员消息通知'], title:'全员消息通知',
      desc:'按会员状态 / 订阅商品 / 注册天数筛选用户,勾选后群发站内消息',
    }));
    const container=h('div');
    root.appendChild(container);

    const goods=(ctx.data.broadcast_goods&&ctx.data.broadcast_goods.goods)||[];

    function applied(){
      return all.filter(r=>{
        if(filter.member!=='all' && r.member!==filter.member) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const memberSel=h('select',{class:'select'},[
        ['all','全员'],['member','会员'],['expired','过期会员'],['non_member','非会员'],
      ].map(([v,t])=>h('option',{value:v},[t])));
      memberSel.value=filter.member;
      const goodsSel=h('select',{class:'select'},[h('option',{value:''},['全部订阅商品'])].concat(
        goods.map(g=>h('option',{value:g.goodsId},[g.name||g.goodsId]))));
      goodsSel.value=filter.goods;
      const minIn=h('input',{class:'input',placeholder:'≥',value:filter.daysMin,style:{width:'70px'}});
      const maxIn=h('input',{class:'input',placeholder:'≤',value:filter.daysMax,style:{width:'70px'}});
      const timesIn=h('input',{class:'input',placeholder:'次数',value:filter.payTimes,style:{width:'80px'}});

      container.appendChild(ctx.FilterBar([
        h('span',{class:'muted small'},['会员状态']), memberSel,
        h('span',{class:'muted small'},['订阅商品']), goodsSel,
        h('span',{class:'muted small'},['注册天数']), minIn, h('span',{class:'muted'},['~']), maxIn, h('span',{class:'muted small'},['天']),
        h('span',{class:'muted small'},['付费次数']), timesIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ member:memberSel.value, goods:goodsSel.value, daysMin:minIn.value.trim(),
            daysMax:maxIn.value.trim(), payTimes:timesIn.value.trim() }; page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={member:'all',goods:'',daysMin:'',daysMax:'',payTimes:''}; page=1; render(); }},['↻ 重置']),
      ]));

      // 群发操作条
      container.appendChild(h('div',{class:'row gap10 mb12',style:{alignItems:'center'}},[
        h('span',{class:'muted small'},['已选 '+selected.size+' 个用户']),
        h('button',{class:'btn btn-primary',onclick:()=>send()},['群发站内消息']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'', width:44, align:'center', render:r=>{
            const cb=h('input',{type:'checkbox'});
            cb.checked=selected.has(r.id);
            cb.onchange=()=>{ if(cb.checked) selected.add(r.id); else selected.delete(r.id); render(); };
            return cb;
          } },
          { title:'用户 ID', width:200, align:'center', render:r=>ctx.IdCell(r.id, 18) },
          { title:'用户名称', render:r=>r.username||'—' },
          { title:'邮箱', render:r=>r.email||'—' },
          { title:'会员状态', width:110, align:'center', render:r=>Tag(MEMBER[r.member].text, MEMBER[r.member].color) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:total },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function send(){
      if(!selected.size){ ctx.toast('warning','请先勾选用户'); return; }
      const ta=h('textarea',{class:'textarea',placeholder:'请输入消息内容',style:{minHeight:'120px'}});
      const m=ctx.modal({ title:'群发站内消息（已选 '+selected.size+' 个用户）', body:[
        h('div',{class:'field'},[h('label',{},['消息内容']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!ta.value.trim()){ ctx.toast('warning','请输入消息内容'); return; }
          ctx.toast('success','已向 '+selected.size+' 个用户群发站内消息'); m.close();
        }},['确认群发']),
      ]});
    }

    render();
  }
};
