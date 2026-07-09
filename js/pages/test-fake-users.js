// 测试用户 — 测试 Portal
window.Pages['test-fake-users'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const STATUS = {
      USER_STATUS_NORMAL:{text:'正常', color:'green'},
      USER_STATUS_BANNED:{text:'已封禁', color:'red'},
      USER_STATUS_DELETED:{text:'已删除', color:'gray'},
    };

    // fake_users 接口 NOT_FOUND → 回落到 users_list（C 端用户）作为测试用户数据源
    const fu = ctx.data.fake_users || {};
    let src = (fu.list || fu.items || fu.users || []);
    let total;
    if(!src.length){
      const ul = ctx.data.users_list || {};
      src = (ul.users || ul.list || []);
      total = (ul.pagination && ul.pagination.total) || 225;
    } else {
      total = fu.total || src.length;
    }
    let all = src.map(u=>Object.assign({}, u));

    let filter = { name:'' };
    let page = 1; let pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['测试 Portal','测试用户'], title:'测试用户',
      desc:'创建与管理 C 端测试用户,新建默认密码 123456,可直接登录 C 端验证(仅 fat/local,prod 不可见)',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>create()},['新建测试用户']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=> !filter.name || (r.username||'').toLowerCase().includes(filter.name.toLowerCase()));
    }
    function realTotal(rows){ return (!filter.name) ? total : rows.length; }

    function statusTag(u){
      const base = STATUS[u.status] || {text:'正常', color:'green'};
      return Tag(base.text, base.color);
    }

    function render(){
      container.innerHTML='';
      const nameIn=h('input',{class:'input',placeholder:'按用户名模糊搜索',value:filter.name,style:{minWidth:'220px'}});
      container.appendChild(ctx.FilterBar([
        nameIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={name:nameIn.value.trim()}; page=1; render(); }},['搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={name:''}; page=1; render(); }},['重置']),
      ]));

      const rows=applied();
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'用户名', render:r=>r.username||'—' },
          { title:'邮箱', render:r=>r.email||'—' },
          { title:'ID', width:130, render:r=>ctx.IdCell(r.id,8) },
          { title:'状态', width:90, align:'center', render:r=>statusTag(r) },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtISO(r.createdAt) },
          { title:'操作', width:140, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
            h('button',{class:'btn btn-sm',onclick:()=>edit(r)},['编辑']),
            h('button',{class:'btn btn-sm btn-danger',onclick:()=>del(r)},['删除']),
          ]) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:realTotal(rows) },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function create(){
      const u=h('input',{class:'input'});
      const em=h('input',{class:'input'});
      const m=ctx.modal({ title:'新建测试用户', body:[
        h('div',{class:'field'},[h('label',{},['用户名 *']), u]),
        h('div',{class:'field'},[h('label',{},['邮箱']), em]),
        h('div',{class:'small muted'},['默认密码：123456']),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!u.value.trim()){ ctx.toast('warning','请输入用户名'); return; }
          all.unshift({ id:'01'+Date.now().toString(16), username:u.value.trim(), email:em.value.trim(), status:'USER_STATUS_NORMAL', createdAt:new Date().toISOString() });
          total++; ctx.toast('success','创建成功（默认密码 123456）'); m.close(); render();
        }},['确定']),
      ]});
    }

    function edit(r){
      const u=h('input',{class:'input',value:r.username||''});
      const em=h('input',{class:'input',value:r.email||''});
      const m=ctx.modal({ title:'编辑测试用户 — '+(r.username||''), body:[
        h('div',{class:'field'},[h('label',{},['用户名 *']), u]),
        h('div',{class:'field'},[h('label',{},['邮箱']), em]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!u.value.trim()){ ctx.toast('warning','请输入用户名'); return; }
          r.username=u.value.trim(); r.email=em.value.trim(); ctx.toast('success','保存成功'); m.close(); render();
        }},['确定']),
      ]});
    }

    function del(r){
      const m=ctx.modal({ title:'删除测试用户', body:[h('div',{},['确定删除测试用户「'+(r.username||r.id)+'」？'])], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-danger',onclick:()=>{ all=all.filter(x=>x!==r); total=Math.max(0,total-1); ctx.toast('success','已删除'); m.close(); render(); }},['确认删除']),
      ]});
    }

    render();
  }
};
