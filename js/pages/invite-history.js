// 历史记录 — 邀请码
window.Pages['invite-history'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const mock = ctx.data.invite_history || {};
    // 斜杠带秒：2026/3/31 13:43:36（不补零，对齐源站样例）
    const slashSec = sec=>{
      if(!sec) return '—';
      const d = new Date(sec*1000);
      if(isNaN(+d)) return '—';
      const p2=n=>String(n).padStart(2,'0');
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    };
    const all = (mock.items || mock.list || []).map(it=>({
      code:    it.code || '',
      userId:  it.userId || '',
      username:it.username || '',           // 列「昵称」
      email:   it.email || '',              // 列「用户名」
      total:   it.availablePoints ?? it.totalPoints ?? '',
      recharge:it.rechargeAvailablePoints ?? it.rechargeTotalPoints ?? '',
      gift:    it.giftAvailablePoints ?? it.giftTotalPoints ?? '',
      isUsed:  !!it.isUsed,
      createdAtUnix: it.createdAtUnixSecond,
      updatedAtUnix: it.updatedAtUnixSecond,
    }));

    let filter = { codes:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['邀请码','历史记录'], title:'历史记录',
      desc:'批量查询邀请码的使用状态及持有人的积分余额明细',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      const codes = filter.codes.split(/[\r\n,，\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean);
      if(!codes.length) return all;
      return all.filter(r=> codes.includes((r.code||'').toUpperCase()));
    }

    function render(){
      container.innerHTML='';
      const codesIn = h('textarea',{class:'textarea',rows:'4',
        placeholder:'每行粘贴一个邀请码，或拖入 Excel 从首列批量带入；留空查询全部',
        style:{minWidth:'320px',minHeight:'88px'}, value:filter.codes});
      container.appendChild(ctx.FilterBar([
        codesIn,
        h('div',{class:'col gap6'},[
          h('button',{class:'btn btn-primary',onclick:()=>{ filter.codes=codesIn.value; page=1; render(); }},['🔍 查询']),
          h('button',{class:'btn',onclick:()=>{ filter={codes:''}; page=1; render(); }},['↻ 重置']),
        ]),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'邀请码', width:120, render:r=>h('span',{class:'mono small'},[r.code||'—']) },
          { title:'用户ID', width:180, render:r=>ctx.IdCell(r.userId,18) },
          { title:'用户名', render:r=>r.email||'—' },
          { title:'昵称', render:r=>r.username||'—' },
          { title:'剩余总积分', width:100, align:'center', render:r=>h('span',{class:'mono small'},[String(r.total)]) },
          { title:'剩余购买积分', width:110, align:'center', render:r=>h('span',{class:'mono small'},[String(r.recharge)]) },
          { title:'剩余赠送积分', width:110, align:'center', render:r=>h('span',{class:'mono small'},[String(r.gift)]) },
          { title:'是否使用', width:100, align:'center', render:r=>Tag(r.isUsed?'已使用':'未使用', r.isUsed?'green':'gray') },
          { title:'创建时间', width:170, align:'center', render:r=>slashSec(r.createdAtUnix) },
          { title:'更新时间', width:170, align:'center', render:r=>slashSec(r.updatedAtUnix) },
        ],
        rows:pageRows,
        empty:'暂无历史记录',
        pager: rows.length ? { page, pageSize, total:rows.length } : undefined,
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
