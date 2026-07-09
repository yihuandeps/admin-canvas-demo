// 项目管理 — 内容管理
window.Pages['projects'] = {
  render(root, ctx){
    const { h } = ctx;
    const clean = s => (s||'').trim().replace(/^`\s*|\s*`$/g,'');

    // 与视频审核同源(episodes)，按「项目」维度展示
    const raw = (ctx.data.episodes && ctx.data.episodes.episodes) || [];
    let all = raw.map(e=>{
      const n = e.episode || {}, d = n.drama || {}, u = n.user || {};
      return {
        title: n.title || (d.title||'') || '—',
        creatorName: u.username || '—',
        creatorEmail: u.email || (u.username? u.username+'@storeel.com' : '—'),
        seriesId: n.dramaId || '',
        videoId: n.id || '',
        projectUrl: clean(n.relationProjectId),
        createdAt: n.createdAtUnixSecond,
      };
    });

    let filter = { keyword:'', seriesId:'', videoId:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['内容管理','项目管理'], title:'项目管理',
      desc:'查看用户在 Canvas 上创建的项目，并可向创作者发送站内消息',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.keyword){
          const kw = filter.keyword.toLowerCase();
          if(!(r.creatorName||'').toLowerCase().includes(kw) && !(r.creatorEmail||'').toLowerCase().includes(kw)) return false;
        }
        if(filter.seriesId && !String(r.seriesId).includes(filter.seriesId)) return false;
        if(filter.videoId && !String(r.videoId).includes(filter.videoId)) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn = h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.keyword,style:{minWidth:'160px'}});
      const seriesIn = h('input',{class:'input',placeholder:'剧集ID',value:filter.seriesId,style:{minWidth:'130px'}});
      const videoIn = h('input',{class:'input',placeholder:'视频ID',value:filter.videoId,style:{minWidth:'130px'}});

      container.appendChild(ctx.FilterBar([
        kwIn, seriesIn, videoIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ keyword:kwIn.value.trim(), seriesId:seriesIn.value.trim(), videoId:videoIn.value.trim() };
          page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={keyword:'',seriesId:'',videoId:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'创建日期', width:170, align:'center', render:r=>ctx.fmtUnix(r.createdAt) },
          { title:'关联剧集ID', width:200, align:'center', render:r=> r.seriesId? ctx.IdCell(r.seriesId,18) : '—' },
          { title:'关联视频ID', width:200, align:'center', render:r=> r.videoId? ctx.IdCell(r.videoId,18) : '—' },
          { title:'项目标题', render:r=>r.title },
          { title:'创作者昵称', width:130, align:'center', render:r=>r.creatorName },
          { title:'创作者邮箱', width:200, render:r=>h('span',{class:'small'},[r.creatorEmail]) },
          { title:'项目URL', width:100, align:'center', render:r=> h('a',{class:'btn btn-sm',href:'#',onclick:e=>{ e.preventDefault(); viewProject(r); }},['查看项目']) },
          { title:'操作', width:130, align:'center', render:r=> h('button',{class:'btn btn-sm btn-primary',onclick:()=>contact(r)},['联系创作者']) },
        ],
        rows:pageRows,
        empty:'暂无项目数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function viewProject(r){
      ctx.modal({ title:'项目详情 — '+r.title, body:[
        h('div',{class:'kv'},[
          h('dt',{},['项目标题']), h('dd',{},[r.title]),
          h('dt',{},['创作者昵称']), h('dd',{},[r.creatorName]),
          h('dt',{},['创作者邮箱']), h('dd',{},[r.creatorEmail]),
          h('dt',{},['关联剧集ID']), h('dd',{class:'mono small'},[String(r.seriesId||'—')]),
          h('dt',{},['关联视频ID']), h('dd',{class:'mono small'},[String(r.videoId||'—')]),
          h('dt',{},['项目URL']), h('dd',{class:'mono small'},[r.projectUrl||'—']),
          h('dt',{},['创建日期']), h('dd',{},[ctx.fmtUnix(r.createdAt)]),
        ])
      ]});
    }

    function contact(r){
      const ta = h('textarea',{class:'textarea',placeholder:'请输入消息内容',maxlength:100,rows:4});
      const m = ctx.modal({ title:'联系创作者 — '+r.creatorName, body:[
        h('div',{class:'small muted mb12'},['将以站内信形式发送给创作者：'+r.creatorName+'（'+r.creatorEmail+'）']),
        h('div',{class:'field'},[h('label',{},['消息内容 *']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!ta.value.trim()){ ctx.toast('warning','请输入消息内容'); return; }
          ctx.toast('success','消息发送成功'); m.close();
        }},['发送']),
      ]});
    }

    render();
  }
};
