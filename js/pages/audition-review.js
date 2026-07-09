// 试稿审核 — 运营管理
window.Pages['audition-review'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const REVIEW = {
      pending:{text:'待评分',color:'#60a5fa'},
      approved:{text:'通过',color:'#4ade80'},
      rejected:{text:'拒绝',color:'#f87171'},
    };
    function mapStatus(s){
      if(s==='REVIEW_STATUS_APPROVED') return 'approved';
      if(s==='REVIEW_STATUS_REJECTED') return 'rejected';
      return 'pending';
    }
    function creatorTypeText(t){
      if(t==='CREATOR_TYPE_PERSONAL') return '个人';
      if(t==='CREATOR_TYPE_COMPANY') return '公司';
      return '—';
    }
    const isVideo = u => u && ['.mp4','.mov','.avi','.mkv','.flv','.wmv'].some(x=>u.toLowerCase().split('?')[0].endsWith(x));

    const raw = (ctx.data.audition_applications && ctx.data.audition_applications.applications) || [];
    let all = raw.map(a=>{
      const st = mapStatus(a.reviewStatus);
      return {
        id:a.id, projectId:a.projectId, projectTitle:a.projectTitle||'—',
        userId:a.userId||'', username:a.username||'—',
        email:a.email||'—', phone:a.phone||'—', wechat:a.wechat||'—',
        creatorType:a.creatorType, creatorTypeText:creatorTypeText(a.creatorType),
        brandName:a.brandName||'—',
        pastWorkUrls:a.pastWorkUrls||[], trialWorkUrls:a.trialWorkUrls||[],
        reviewScore:a.reviewScore||0,
        createdAt:a.createdAt,
        status:st, statusText:REVIEW[st].text,
      };
    });

    let filter = { userId:'', keyword:'', projectId:'', projectName:'', brand:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','试稿审核'], title:'试稿审核',
      desc:'审核创作者提交的商单试稿作品并评分，决定是否通过其报名申请',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.userId && String(r.userId)!==filter.userId) return false;
        if(filter.keyword){ const k=filter.keyword.toLowerCase(); if(!(r.username||'').toLowerCase().includes(k) && !(r.email||'').toLowerCase().includes(k)) return false; }
        if(filter.projectId && !String(r.projectId).includes(filter.projectId)) return false;
        if(filter.projectName && !(r.projectTitle||'').toLowerCase().includes(filter.projectName.toLowerCase())) return false;
        if(filter.brand && !(r.brandName||'').toLowerCase().includes(filter.brand.toLowerCase())) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const userIn = h('input',{class:'input',placeholder:'用户ID（UUID 精确匹配）',value:filter.userId,style:{minWidth:'180px'}});
      const kwIn = h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.keyword,style:{minWidth:'140px'}});
      const projIdIn = h('input',{class:'input',placeholder:'商单ID',value:filter.projectId,style:{minWidth:'100px'}});
      const projNameIn = h('input',{class:'input',placeholder:'商单名称',value:filter.projectName,style:{minWidth:'140px'}});
      const brandIn = h('input',{class:'input',placeholder:'厂牌名称',value:filter.brand,style:{minWidth:'120px'}});

      container.appendChild(ctx.FilterBar([
        userIn, kwIn, projIdIn, projNameIn, brandIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          filter={ userId:userIn.value.trim(), keyword:kwIn.value.trim(),
            projectId:projIdIn.value.trim(), projectName:projNameIn.value.trim(), brand:brandIn.value.trim() };
          page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={userId:'',keyword:'',projectId:'',projectName:'',brand:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'申请提交时间', width:150, align:'center', render:r=>ctx.fmtISOMin(r.createdAt) },
          { title:'商单ID', width:80, align:'center', render:r=>String(r.projectId??'—') },
          { title:'商单名称', width:200, render:r=>r.projectTitle },
          { title:'用户ID', width:200, align:'center', render:r=> r.userId? ctx.IdCell(r.userId,18) : '—' },
          { title:'用户昵称', width:110, align:'center', render:r=>r.username },
          { title:'过往作品', width:100, align:'center', render:r=> r.pastWorkUrls.length? h('button',{class:'btn btn-sm',onclick:()=>preview(r.pastWorkUrls[0])},['查看']) : '—' },
          { title:'试稿作品', width:100, align:'center', render:r=> r.trialWorkUrls.length? h('button',{class:'btn btn-sm',onclick:()=>preview(r.trialWorkUrls[0])},['查看']) : '—' },
          { title:'邮箱', width:180, render:r=>h('span',{class:'small'},[r.email]) },
          { title:'手机', width:130, align:'center', render:r=>r.phone },
          { title:'微信', width:110, align:'center', render:r=>r.wechat },
          { title:'创作属性', width:90, align:'center', render:r=> r.creatorType? Tag(r.creatorTypeText, r.creatorType==='CREATOR_TYPE_COMPANY'?'purple':'gray') : '—' },
          { title:'厂牌名称', width:120, render:r=>r.brandName },
          { title:'操作', width:200, align:'center', render:r=>actionCell(r) },
        ],
        rows:pageRows,
        empty:'暂无试稿申请',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:s=>{ pageSize=s; page=1; render(); },
      }));
    }

    function actionCell(r){
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('span',{class:'small'},[ Tag(r.statusText, REVIEW[r.status].color) ]),
        h('button',{class:'btn btn-sm btn-primary',onclick:()=>scoreModal(r)},['评分']),
        h('button',{class:'btn btn-sm',onclick:()=>sendMessage(r)},['发消息']),
      ]);
    }

    function scoreModal(r){
      const sel = h('select',{class:'select'},[1,2,3,4,5].map(v=>h('option',{value:String(v)},[String(v)])));
      sel.value=String(r.reviewScore || 1);
      const m = ctx.modal({ title:'试稿作品评分', size:'lg', body:[
        h('div',{class:'kv mb12'},[
          h('dt',{},['商单ID']), h('dd',{},[String(r.projectId??'—')]),
          h('dt',{},['商单名称']), h('dd',{},[r.projectTitle]),
          h('dt',{},['用户昵称']), h('dd',{},[r.username]),
        ]),
        h('div',{class:'small muted mb12'},['1-2 分试稿不通过，3-5 分试稿通过']),
        h('div',{class:'field'},[h('label',{},['试稿作品得分']), sel]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          const sc = Number(sel.value);
          r.reviewScore = sc;
          if(sc>=3){ r.status='approved'; r.statusText='通过'; }
          else { r.status='rejected'; r.statusText='拒绝'; }
          ctx.toast('success','评分成功'); m.close(); render();
        }},['确定']),
      ]});
    }

    function sendMessage(r){
      const ta = h('textarea',{class:'textarea',placeholder:'请输入消息内容',rows:4});
      const m = ctx.modal({ title:'发送消息 — '+r.username, body:[
        h('div',{class:'field'},[h('label',{},['消息内容 *']), ta]),
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{
          if(!ta.value.trim()){ ctx.toast('warning','请输入消息内容'); return; }
          ctx.toast('success','消息发送成功'); m.close();
        }},['确定']),
      ]});
    }

    function preview(url){
      const body = isVideo(url)
        ? h('video',{src:url,controls:'',autoplay:'',style:{width:'100%',borderRadius:'8px',background:'#000'}})
        : h('img',{src:url,style:{width:'100%',borderRadius:'8px'}});
      ctx.modal({ size:'lg', title:'作品预览', body:[body] });
    }

    render();
  }
};
