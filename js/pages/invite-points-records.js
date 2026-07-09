// 赠分记录 — 邀请码
window.Pages['invite-points-records'] = {
  render(root, ctx){
    const { h } = ctx;
    // 接口可能 NOT_FOUND（invite_points._error），兜底空列表正常渲染骨架
    const mock = ctx.data.invite_points || {};
    const raw = (mock.list || mock.items || mock.records || (mock.data && (mock.data.list||mock.data.items)) || []);
    const all = raw.map(it=>({
      receiveUsername: it.receiveUsername || it.username || it.getUsername || '',
      receiveEmail:    it.receiveEmail    || it.email    || it.getEmail    || '',
      inviteUsername:  it.inviteUsername  || it.inviteUserName  || '',
      inviteEmail:     it.inviteEmail     || it.inviteUserEmail || '',
      points:          it.points ?? it.giftPoints ?? it.amount ?? 0,
      grantedAt:       it.grantedAt || it.createdAt || '',
      grantedAtUnix:   it.grantedAtUnixSecond || it.createdAtUnixSecond,
    }));

    let filter = { keyword:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['邀请码','赠分记录'], title:'赠分记录',
      desc:'按赠送类型分类查看邀请码活动产生的积分发放流水与汇总统计',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      const k = filter.keyword.toLowerCase();
      if(!k) return all;
      return all.filter(r=>
        (r.receiveUsername||'').toLowerCase().includes(k) ||
        (r.receiveEmail||'').toLowerCase().includes(k) ||
        (r.inviteUsername||'').toLowerCase().includes(k) ||
        (r.inviteEmail||'').toLowerCase().includes(k));
    }

    function render(){
      container.innerHTML='';
      const kwIn = h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.keyword,style:{minWidth:'200px'}});
      container.appendChild(ctx.FilterBar([
        kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter.keyword=kwIn.value.trim(); page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={keyword:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'获取积分用户名称', render:r=>r.receiveUsername||'—' },
          { title:'获取积分用户邮箱', render:r=>r.receiveEmail||'—' },
          { title:'邀请用户名称', render:r=>r.inviteUsername||'—' },
          { title:'邀请用户邮箱', render:r=>r.inviteEmail||'—' },
          { title:'积分发放时间', width:170, align:'center', render:r=>r.grantedAtUnix?ctx.fmtUnix(r.grantedAtUnix):(r.grantedAt?ctx.fmtISO(r.grantedAt):'—') },
          { title:'获取积分数量', width:120, align:'center', render:r=>h('span',{class:'mono small'},[String(r.points)]) },
        ],
        rows:pageRows,
        empty:'暂无赠分记录',
        pager: rows.length ? { page, pageSize, total:rows.length } : undefined,
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
