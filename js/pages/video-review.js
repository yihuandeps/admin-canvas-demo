// 视频审核 — 内容管理（按 2026-07-08 源站截图 1:1 复刻:筛选两行 + 批量搜索创作者 + 17 列管理表）
// 列:提交时间(可排序,默认↓)/剧集ID/视频ID/标题/封面图/视频预览/创作者ID(可复制)/创作者/邮箱/商单试稿(是/否)/工作流/类型/审核状态/剧集过审/精选/拒审反馈/操作(✓通过 ✗不通过)
window.Pages['video-review'] = {
  render(root, ctx){
    const { h, Tag, IdCell } = ctx;

    // ---- 数据源:与源站截图逐行一致的 13 条待审核单视频(会话内可交互:通过/拒审即时生效) ----
    if(!ctx.data.video_review_list){
      const R=(t,dramaId,videoId,title,creatorId,creatorName,email,orderTrial)=>({
        submitAt:t, dramaId, videoId, title, creatorId, creatorName, email,
        orderTrial:!!orderTrial,   // 商单试稿:true=是 / false=否
        wfState:'none',            // 工作流:none=无项目
        type:'single',             // single=单视频 / drama=剧集
        status:'pending',          // pending/approved/rejected
        featured:false, feedbacks:[],
        dramaTotal:0, dramaApproved:0,
      });
      ctx.data.video_review_list=[
        R('2026/07/07 18:25','019f3c1c-1eeb-7830-82a1-53a0710cd005','019f3c1c-1ef0-75d4-83d7-07a9d93d1ba9',"The River's Vowed Bride",'019ef8d1-6848-7971-8dd1-ff3dc7644660','苏格拉没有底','user95@demo.test',true),
        R('2026/07/07 17:35','019f3bee-8315-7a16-93ef-9c7f0f5db9f3','019f3bee-831a-7aae-a261-c7fd3efe45f2',"The Dragon King's Sacrificial Bride",'019eed90-ce5c-7cdb-bd9a-45becc3c7db5','kangsir','user103@demo.test'),
        R('2026/07/07 16:42','019f3bbe-7efa-74b3-94ed-e5a3abd7e1e1','019f3bbe-7efd-75a1-867a-32d240ddde27','女团出场运镜','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:40','019f3bbc-1b4d-727b-aa13-18c4cb642787','019f3bbc-1b51-7e75-9fca-55bfad477733','恋与世界杯-哈兰德小卡上线','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:39','019f3bbb-2006-761d-ad2f-23d3aec9c4a2','019f3bbb-2009-7a2d-8217-68b972adc688','播放器环绕动画怎么做','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:38','019f3bba-2e22-7cb5-b03e-28d7b3b9051e','019f3bba-2e27-794d-b5ab-55b1efc8fb03','idol同款机场路透图','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:36','019f3bb9-1ac1-7abf-bee5-a5aa386c7210','019f3bb9-1ac4-7c50-a4b3-567179e06fc3','拍世界杯MV啦','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:33','019f3bb6-1d97-751a-8aae-419b42cc95f3','019f3bb6-1d9c-73bb-9d08-7e9774100723','毛孩子看球赛','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:30','019f3bb3-3d4d-73c8-9023-94670a411145','019f3bb3-3d50-7414-a092-85bfd82a505f','被世界杯直播拍到','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:29','019f3bb2-9faf-739c-8936-422992bf09ef','019f3bb2-9fb2-73d3-acc7-3860e5700941','偶遇《校园之外》男主','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:27','019f3bb0-1c39-76b4-939a-e9aca02832c2','019f3bb0-1c3e-71de-a1be-53131576a2d3','把自己照片做成爱豆打歌舞台','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:25','019f3bae-b257-79cb-8c48-9949d4b6d910','019f3bae-b25c-7661-b6c5-14a19d7c2b41','把自己照片做成游戏加载界面','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
        R('2026/07/07 16:23','019f3bac-dd7c-75ad-81c6-54fedb7213e2','019f3bac-dd81-76e1-bba7-6631157f7e09','穿越大裤衩','019d4781-177d-76d5-a010-65bec12ad93d','TiTi','user02@demo.test'),
      ];
    }
    const list=()=>ctx.data.video_review_list;

    const STATUS={ pending:{text:'待审核',color:'blue'}, approved:{text:'审核通过',color:'green'}, rejected:{text:'审核不通过',color:'red'} };
    const WF={ none:'无项目', all:'全剧关联', partial:'部分关联' };

    // ---- 缩略图:本地复刻无真实视频帧,用逐行不同的深色渐变占位(封面图/视频预览同源,预览带 ▶ 角标) ----
    const PAL=[['#16233a','#0b1120'],['#1f2937','#0b0f19'],['#3a2a3f','#141019'],['#233a33','#0e1714'],['#3a2f1f','#171208'],['#26303f','#0d1017'],['#3f2430','#170d12']];
    function thumbURI(i){
      const [a,b]=PAL[i%PAL.length];
      const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 96">'
        +'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        +'<stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient></defs>'
        +'<rect width="160" height="96" fill="url(#g)"/>'
        +'<circle cx="'+(30+(i*37)%100)+'" cy="'+(20+(i*23)%56)+'" r="26" fill="#ffffff" opacity="0.05"/>'
        +'<rect y="70" width="160" height="26" fill="#000000" opacity="0.28"/></svg>';
      return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    }
    const idx=r=>list().indexOf(r);
    function coverCell(r){
      return h('img',{src:thumbURI(idx(r)),title:r.title,
        style:{width:'44px',height:'26px',borderRadius:'4px',objectFit:'cover',display:'inline-block',cursor:'zoom-in',border:'1px solid var(--border)'},
        onclick:()=>ctx.modal({ size:'lg', title:'封面图 — '+r.title, body:[
          h('img',{src:thumbURI(idx(r)),style:{width:'100%',aspectRatio:'16/9',borderRadius:'10px',objectFit:'cover'}}),
          h('div',{class:'small muted',style:{marginTop:'8px'}},['本地复刻站为演示环境,封面为占位图。']) ] }) });
    }
    function previewCell(r){
      return h('div',{style:{position:'relative',display:'inline-block',cursor:'pointer'},onclick:()=>openPreview(r)},[
        h('img',{src:thumbURI(idx(r)),style:{width:'56px',height:'34px',borderRadius:'4px',objectFit:'cover',display:'block',border:'1px solid var(--border)'}}),
        h('span',{style:{position:'absolute',inset:'0',display:'flex',alignItems:'center',justifyContent:'center'}},[
          h('span',{style:{width:'18px',height:'18px',borderRadius:'50%',background:'rgba(0,0,0,.55)',border:'1px solid rgba(255,255,255,.7)',
            display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'8px',paddingLeft:'1px'}},['▶']) ]),
      ]);
    }
    function openPreview(r){
      ctx.modal({ size:'lg', title:'视频预览 — '+r.title, body:[
        h('div',{style:{position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:'10px',overflow:'hidden',background:'#000'}},[
          h('img',{src:thumbURI(idx(r)),style:{width:'100%',height:'100%',objectFit:'cover',opacity:'.85'}}),
          h('span',{style:{position:'absolute',inset:'0',display:'flex',alignItems:'center',justifyContent:'center'}},[
            h('span',{style:{width:'54px',height:'54px',borderRadius:'50%',background:'rgba(0,0,0,.55)',border:'2px solid rgba(255,255,255,.85)',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'20px',paddingLeft:'4px'}},['▶']) ]),
        ]),
        h('div',{class:'small muted',style:{marginTop:'10px'}},['视频ID ',h('span',{class:'mono'},[r.videoId]),' · 本地复刻站为演示环境,无真实视频流。']),
      ]});
    }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['内容管理','视频审核'], title:'视频审核',
      desc:'审核创作者提交的单视频与剧集内容，执行通过或拒审并记录反馈',
    }));

    // ---- 筛选(与源站同布局):第一行 6 输入框 + 4 下拉 + 提交时间范围 + 搜索/重置/导出;第二行 批量搜索创作者 大输入域 ----
    const blank=()=>({ creatorId:'', creatorKw:'', dramaId:'', videoId:'', title:'', keyword:'', status:'pending', type:'all', wf:'all', feat:'all', from:'', to:'', batch:[] });
    let filter=blank();
    const inCreatorId=h('input',{class:'input',placeholder:'创作者ID（UUID 精确匹配）',style:{minWidth:'190px'}});
    const inCreatorKw=h('input',{class:'input',placeholder:'创作者 / 邮箱',style:{minWidth:'130px'}});
    const inDramaId=h('input',{class:'input',placeholder:'剧集ID',style:{minWidth:'110px'}});
    const inVideoId=h('input',{class:'input',placeholder:'视频ID',style:{minWidth:'110px'}});
    const inTitle=h('input',{class:'input',placeholder:'标题',style:{minWidth:'110px'}});
    const inKeyword=h('input',{class:'input',placeholder:'关键词（标题/ID/创作者/审核状态）',style:{minWidth:'190px'}});
    const selStatus=h('select',{class:'select',style:{minWidth:'104px'}},[
      ['pending','待审核'],['all','全部状态'],['approved','审核通过'],['rejected','审核不通过']].map(([v,t])=>h('option',{value:v},[t])));
    const selType=h('select',{class:'select',style:{minWidth:'104px'}},[
      ['all','全部类型'],['single','单视频'],['drama','剧集']].map(([v,t])=>h('option',{value:v},[t])));
    const selWf=h('select',{class:'select',style:{minWidth:'116px'}},[
      ['all','全部工作流'],['has','全剧关联'],['partial','部分关联'],['none','全剧未关联']].map(([v,t])=>h('option',{value:v},[t])));
    const selFeat=h('select',{class:'select',style:{minWidth:'104px'}},[
      ['all','全部精选'],['yes','已精选'],['no','未精选']].map(([v,t])=>h('option',{value:v},[t])));

    // 提交时间范围:一个展示框 + 点开小面板选起止日期(确定/清除)
    const rangeShow=h('input',{class:'input',readonly:'',placeholder:'📅 选择日期范围',style:{minWidth:'168px',cursor:'pointer'},onclick:()=>{ pop.style.display = pop.style.display==='none'?'':'none'; }});
    const dFrom=h('input',{class:'input',type:'date'}), dTo=h('input',{class:'input',type:'date'});
    const pop=h('div',{style:{display:'none',position:'absolute',top:'calc(100% + 6px)',left:'0',zIndex:'60',background:'var(--card)',
      border:'1px solid var(--border)',borderRadius:'10px',padding:'12px',boxShadow:'0 8px 24px rgba(0,0,0,.45)'}},[
      h('div',{class:'row gap6',style:{alignItems:'center'}},[dFrom,h('span',{class:'muted'},['至']),dTo]),
      h('div',{class:'row gap6',style:{justifyContent:'flex-end',marginTop:'10px'}},[
        h('button',{class:'btn btn-sm',onclick:()=>{ dFrom.value=''; dTo.value=''; rangeShow.value=''; pop.style.display='none'; }},['清除']),
        h('button',{class:'btn btn-sm btn-primary',onclick:()=>{
          if(dFrom.value&&dTo.value&&dFrom.value>dTo.value){ ctx.toast('error','结束日期需不早于开始日期'); return; }
          rangeShow.value=(dFrom.value||dTo.value)? (dFrom.value||'…').replaceAll('-','/')+' ~ '+(dTo.value||'…').replaceAll('-','/') : '';
          pop.style.display='none';
        }},['确定']),
      ]),
    ]);
    const rangeWrap=h('div',{style:{position:'relative',display:'inline-flex'}},[rangeShow,pop]);

    const taBatch=h('textarea',{class:'textarea',placeholder:'批量搜索创作者：粘贴用户ID / 邮箱 / 用户名，换行或逗号分隔',
      style:{width:'600px',maxWidth:'100%',minHeight:'64px'}});

    function doSearch(){
      filter={ creatorId:inCreatorId.value.trim().toLowerCase(), creatorKw:inCreatorKw.value.trim().toLowerCase(),
        dramaId:inDramaId.value.trim().toLowerCase(), videoId:inVideoId.value.trim().toLowerCase(),
        title:inTitle.value.trim().toLowerCase(), keyword:inKeyword.value.trim().toLowerCase(),
        status:selStatus.value, type:selType.value, wf:selWf.value, feat:selFeat.value,
        from:dFrom.value?dFrom.value.replaceAll('-','/')+' 00:00':'', to:dTo.value?dTo.value.replaceAll('-','/')+' 23:59':'',
        batch:taBatch.value.split(/[\n,，]+/).map(s=>s.trim().toLowerCase()).filter(Boolean) };
      page=1; renderTable();
    }
    function doReset(){
      [inCreatorId,inCreatorKw,inDramaId,inVideoId,inTitle,inKeyword,taBatch,rangeShow,dFrom,dTo].forEach(el=>el.value='');
      selStatus.value='pending'; selType.value='all'; selWf.value='all'; selFeat.value='all'; pop.style.display='none';
      filter=blank(); page=1; renderTable();
    }
    function doExport(){
      const rows=applied();
      const head=['提交时间','剧集ID','视频ID','标题','创作者ID','创作者','邮箱','商单试稿','工作流','类型','审核状态','剧集过审','精选','拒审反馈'];
      const csv='\uFEFF'+[head.join(',')].concat(rows.map(r=>[
        r.submitAt, r.dramaId, r.videoId, '"'+r.title.replaceAll('"','""')+'"', r.creatorId, r.creatorName, r.email,
        r.orderTrial?'是':'否', WF[r.wfState]||'无项目', r.type==='drama'?'剧集':'单视频', STATUS[r.status].text,
        r.type==='drama'?(r.dramaApproved+'/'+r.dramaTotal):'—', r.featured?'已精选':'—',
        '"'+r.feedbacks.map(f=>f.reason).join('；').replaceAll('"','""')+'"',
      ].join(','))).join('\n');
      const a=h('a',{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'视频审核导出.csv'});
      document.body.appendChild(a); a.click(); a.remove();
      ctx.toast('success','已导出 '+rows.length+' 条');
    }

    root.appendChild(ctx.FilterBar([
      inCreatorId, inCreatorKw, inDramaId, inVideoId, inTitle, inKeyword,
      selStatus, selType, selWf, selFeat,
      h('span',{class:'small muted',style:{marginLeft:'2px'}},['提交时间']), rangeWrap,
      h('button',{class:'btn btn-primary',onclick:doSearch},['🔍 搜索']),
      h('button',{class:'btn',onclick:doReset},['↻ 重置']),
      h('button',{class:'btn',onclick:doExport},['⬇ 导出']),
      h('div',{style:{flexBasis:'100%'}},[taBatch]),
    ]));

    const tableWrap=h('div');
    root.appendChild(tableWrap);

    // ---- 过滤 + 排序(提交时间,默认由近到远↓) ----
    function applied(){
      return list().filter(r=>{
        if(filter.status!=='all' && r.status!==filter.status) return false;
        if(filter.type!=='all' && r.type!==filter.type) return false;
        if(filter.wf!=='all' && r.wfState!==filter.wf) return false;
        if(filter.feat!=='all' && (filter.feat==='yes')!==!!r.featured) return false;
        if(filter.creatorId && r.creatorId.toLowerCase()!==filter.creatorId) return false;
        if(filter.creatorKw && !(r.creatorName.toLowerCase().includes(filter.creatorKw)||r.email.toLowerCase().includes(filter.creatorKw))) return false;
        if(filter.dramaId && !r.dramaId.toLowerCase().includes(filter.dramaId)) return false;
        if(filter.videoId && !r.videoId.toLowerCase().includes(filter.videoId)) return false;
        if(filter.title && !r.title.toLowerCase().includes(filter.title)) return false;
        if(filter.keyword){
          const hay=(r.title+' '+r.dramaId+' '+r.videoId+' '+r.creatorId+' '+r.creatorName+' '+r.email+' '+STATUS[r.status].text).toLowerCase();
          if(!hay.includes(filter.keyword)) return false;
        }
        if(filter.batch.length && !filter.batch.some(t=> r.creatorId.toLowerCase()===t || r.creatorName.toLowerCase().includes(t) || r.email.toLowerCase().includes(t))) return false;
        if(filter.from && r.submitAt<filter.from) return false;
        if(filter.to && r.submitAt>filter.to) return false;
        return true;
      });
    }
    let sortDir='desc', page=1, pageSize=20;
    const timeHead=()=>h('span',{style:{display:'inline-flex',alignItems:'center',gap:'4px',cursor:'pointer',userSelect:'none'},
      title:'点击切换排序:提交时间由近到远 / 由远到近',
      onclick:()=>{ sortDir=sortDir==='desc'?'asc':'desc'; renderTable(); }},
      ['提交时间', h('span',{},[sortDir==='desc'?'↓':'↑'])]);

    function renderTable(){
      tableWrap.innerHTML='';
      const rows=applied().sort((a,b)=> sortDir==='desc'? b.submitAt.localeCompare(a.submitAt) : a.submitAt.localeCompare(b.submitAt));
      const pageRows=rows.slice((page-1)*pageSize, page*pageSize);
      tableWrap.appendChild(ctx.DataTable({
        columns:[
          { title:timeHead(), width:92, align:'center', render:r=>{ const [d,t]=r.submitAt.split(' ');
              return h('div',{},[h('div',{},[d]), h('div',{style:{marginTop:'2px'}},[t])]); } },
          { title:'剧集ID', width:144, align:'center', render:r=>h('span',{class:'mono small',style:{wordBreak:'break-all'}},[r.dramaId]) },
          { title:'视频ID', width:144, align:'center', render:r=>h('span',{class:'mono small',style:{wordBreak:'break-all'}},[r.videoId]) },
          { title:'标题', render:r=>h('div',{style:{minWidth:'150px'}},[r.title]) },
          { title:'封面图', width:60, align:'center', render:coverCell },
          { title:'视频预览', width:72, align:'center', render:previewCell },
          { title:'创作者ID', width:215, align:'center', render:r=>IdCell(r.creatorId) },
          { title:'创作者', width:76, align:'center', render:r=>r.creatorName||'—' },
          { title:'邮箱', width:132, align:'center', render:r=>h('span',{style:{wordBreak:'break-all'}},[r.email]) },
          { title:'商单试稿', width:66, align:'center', render:r=> r.orderTrial? Tag('是','purple') : h('span',{class:'cell-muted'},['否']) },
          { title:'工作流', width:66, align:'center', render:r=> r.wfState==='none'? h('span',{class:'cell-muted'},['无项目']) : Tag(WF[r.wfState],'blue') },
          { title:'类型', width:60, align:'center', render:r=> r.type==='drama'?'剧集':'单视频' },
          { title:'审核状态', width:76, align:'center', render:r=>Tag(STATUS[r.status].text, STATUS[r.status].color) },
          { title:'剧集过审', width:60, align:'center', render:r=> r.type==='drama'? h('span',{class:'small'},[r.dramaApproved+'/'+r.dramaTotal]) : '—' },
          { title:'精选', width:48, align:'center', render:r=> r.featured? Tag('精选','amber') : '—' },
          { title:'拒审反馈', width:64, align:'center', render:r=> r.feedbacks.length? h('button',{class:'btn btn-sm',onclick:()=>showFeedback(r)},[String(r.feedbacks.length)]) : '—' },
          { title:'操作', width:132, align:'center', render:actionCell },
        ],
        rows:pageRows, empty:'暂无待审核内容',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; renderTable(); },
        onPageSize:ps=>{ pageSize=ps; page=1; renderTable(); },
      }));
    }

    // ---- 行操作:✓通过 / ✗不通过(填写拒审反馈) ----
    function actionCell(r){
      if(r.status!=='pending') return h('span',{class:'cell-muted'},['—']);
      return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
        h('button',{class:'btn btn-sm',style:{color:'var(--primary)',borderColor:'#1f5a3a',background:'#12291d'},onclick:()=>{
          r.status='approved'; ctx.toast('success','已通过「'+r.title+'」'); renderTable();
        }},['✓ 通过']),
        h('button',{class:'btn btn-sm btn-danger',onclick:()=>reject(r)},['✗ 不通过']),
      ]);
    }
    function reject(r){
      const ta=h('textarea',{class:'textarea',placeholder:'请填写拒审原因,将作为反馈记录给创作者',style:{minHeight:'90px'}});
      const m=ctx.modal({ title:'拒审 — '+r.title, body:[h('div',{class:'field'},[h('label',{},['拒审原因']), ta])],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            if(!ta.value.trim()){ ctx.toast('warning','请填写拒审原因'); return; }
            r.status='rejected'; r.feedbacks.push({reason:ta.value.trim(), at:ctx.fmtDate(new Date())});
            ctx.toast('success','已标记为审核不通过'); m.close(); renderTable();
          }},['确认拒审']),
        ]});
    }
    function showFeedback(r){
      ctx.modal({ title:'拒审反馈 — '+r.title, body: r.feedbacks.map(f=>
        h('div',{class:'card-pad',style:{border:'1px solid var(--border)',borderRadius:'8px',marginBottom:'8px'}},[
          h('div',{},[f.reason]), h('div',{class:'small muted',style:{marginTop:'6px'}},[f.at])])) });
    }

    renderTable();
  }
};
