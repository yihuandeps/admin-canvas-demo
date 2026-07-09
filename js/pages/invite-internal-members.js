// 内部会员 — 邀请码
window.Pages['invite-internal-members'] = {
  render(root, ctx){
    const { h } = ctx;
    // 接口可能 NOT_FOUND（internal_members._error），兜底空列表正常渲染骨架
    const mock = ctx.data.internal_members || {};
    let all = (mock.items || mock.list || (mock.data && (mock.data.items||mock.data.list)) || []).map(it=>({
      userId:   it.userId || it.id || '',
      username: it.username || '',
      email:    it.email || '',
      setAt:    it.createdAt || it.setAt || '',
      setAtUnix:it.createdAtUnixSecond || it.setAtUnixSecond,
    }));

    let filter = { keyword:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['邀请码','内部会员'], title:'内部会员',
      desc:'管理拥有内部会员权益的用户名单，支持按用户名或邮箱添加成员及关闭权益',
      actions:[ h('button',{class:'btn btn-primary',onclick:add},['+ 添加内部会员']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      const k = filter.keyword.toLowerCase();
      if(!k) return all;
      return all.filter(r=> (r.username||'').toLowerCase().includes(k) || (r.email||'').toLowerCase().includes(k));
    }

    function add(){
      const unameIn = h('input',{class:'input',placeholder:'请输入用户名'});
      const emailIn = h('input',{class:'input',placeholder:'请输入用户邮箱'});
      const m = ctx.modal({ title:'添加内部会员', body:[
        h('div',{class:'field'},[h('label',{},['用户名']), unameIn]),
        h('div',{class:'field'},[h('label',{},['用户邮箱']), emailIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!unameIn.value.trim() && !emailIn.value.trim()){ ctx.toast('warning','请填写用户名或邮箱'); return; }
          all.unshift({ userId:'local-'+Date.now(), username:unameIn.value.trim(), email:emailIn.value.trim(),
            setAt:new Date().toISOString(), setAtUnix:Math.floor(Date.now()/1000) });
          ctx.toast('success','已添加'); m.close(); page=1; render();
        }},['确定']),
      ]});
    }

    function close(r){
      const m = ctx.modal({ title:'关闭内部会员', body:[
        h('div',{},['确定关闭 ', h('b',{},[r.username||r.email||'该用户']), ' 的内部会员权益？']),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          all = all.filter(x=>x!==r); ctx.toast('success','已关闭'); m.close(); render();
        }},['确认关闭']),
      ]});
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
          { title:'用户名', render:r=>r.username||'—' },
          { title:'用户邮箱', render:r=>r.email||'—' },
          { title:'设置时间', width:180, align:'center', render:r=>r.setAtUnix?ctx.fmtUnix(r.setAtUnix):(r.setAt?ctx.fmtISO(r.setAt):'—') },
          { title:'操作', width:110, align:'center', render:r=>h('button',{class:'btn btn-sm btn-danger',onclick:()=>close(r)},['关闭会员']) },
        ],
        rows:pageRows,
        empty:'暂无内部会员',
        pager: rows.length ? { page, pageSize, total:rows.length } : undefined,
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
