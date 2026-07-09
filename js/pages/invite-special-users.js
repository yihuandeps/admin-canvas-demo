// 特殊用户 — 邀请码
window.Pages['invite-special-users'] = {
  render(root, ctx){
    const { h } = ctx;
    const mock = ctx.data.invite_whitelist || {};
    let all = (mock.items || mock.list || []).map(it=>({
      userId:   it.userId || it.id || '',
      username: it.username || '',
      email:    it.email || '',
      remark:   it.remark || '',
      createdAt:it.createdAt || '',
      createdAtUnix: it.createdAtUnixSecond,
    }));

    let filter = { keyword:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['邀请码','特殊用户'], title:'特殊用户',
      desc:'管理邀请码白名单用户，名单内邀请人的被邀请人首充返佣仅记录不发放',
      actions:[ h('button',{class:'btn btn-primary',onclick:add},['+ 新增特殊用户']) ],
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
      const remarkIn= h('input',{class:'input',placeholder:'选填'});
      const m = ctx.modal({ title:'新增特殊用户', body:[
        h('div',{class:'field'},[h('label',{},['用户名']), unameIn]),
        h('div',{class:'field'},[h('label',{},['用户邮箱']), emailIn]),
        h('div',{class:'field'},[h('label',{},['备注']), remarkIn]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!unameIn.value.trim() && !emailIn.value.trim()){ ctx.toast('warning','请填写用户名或邮箱'); return; }
          all.unshift({ userId:'local-'+Date.now(), username:unameIn.value.trim(), email:emailIn.value.trim(),
            remark:remarkIn.value.trim(), createdAt:new Date().toISOString(), createdAtUnix:Math.floor(Date.now()/1000) });
          ctx.toast('success','已新增'); m.close(); page=1; render();
        }},['确定']),
      ]});
    }

    function del(r){
      const m = ctx.modal({ title:'删除特殊用户', body:[
        h('div',{},['确定将 ', h('b',{},[r.username||r.email||'该用户']), ' 移出白名单？']),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{
          all = all.filter(x=>x!==r); ctx.toast('success','已删除'); m.close(); render();
        }},['确认删除']),
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
          { title:'备注', render:r=>r.remark||'—' },
          { title:'新增时间', width:180, align:'center', render:r=>r.createdAtUnix?ctx.fmtUnix(r.createdAtUnix):(r.createdAt?ctx.fmtISO(r.createdAt):'—') },
          { title:'操作', width:100, align:'center', render:r=>h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']) },
        ],
        rows:pageRows,
        empty:'暂无特殊用户',
        pager: rows.length ? { page, pageSize, total:rows.length } : undefined,
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
