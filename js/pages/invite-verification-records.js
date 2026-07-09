// 验证码记录 — 邀请码
window.Pages['invite-verification-records'] = {
  render(root, ctx){
    const { h } = ctx;
    const mock = ctx.data.verification_codes || {};
    const all = (mock.list || mock.items || []).map(it=>({
      email:      it.email || '',
      inviteCode: it.inviteCode || it.code || '',
    }));

    let filter = { email:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['邀请码','验证码记录'], title:'验证码记录',
      desc:'查询用户邮箱与邀请码的绑定关系记录',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      const k = filter.email.toLowerCase();
      if(!k) return all;
      return all.filter(r=> (r.email||'').toLowerCase().includes(k));
    }

    function render(){
      container.innerHTML='';
      const emailIn = h('input',{class:'input',placeholder:'按邮箱查询',value:filter.email,style:{minWidth:'220px'}});
      container.appendChild(ctx.FilterBar([
        emailIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter.email=emailIn.value.trim(); page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={email:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'邮箱', render:r=>r.email||'—' },
          { title:'邀请码', render:r=>h('span',{class:'mono small'},[r.inviteCode||'—']) },
        ],
        rows:pageRows,
        empty:'暂无验证码记录',
        pager: rows.length ? { page, pageSize, total:rows.length } : undefined,
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
