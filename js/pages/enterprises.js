// 企业管理 — 商业化管理
// 【发放企业积分改名 2026-07-07】操作列「发放积分」按钮（含解约置灰态）与发放弹窗内逐成员「发积分」按钮
//   统一改名为「发放企业积分」；两处操作列宽随之放宽（470→500 / 180→220）。弹窗标题、表单字段、发放明细列名不动。
// 【企业剩余积分改名 2026-07-07】发放弹窗成员表列头「剩余积分」→「企业剩余积分」（宽 110→130）；
//   成员管理列表与明细页的同名列未圈选，维持「剩余积分」。
// 【成员管理删列 2026-07-07】成员管理弹窗删除「剩余积分」整列（红框标注），列表收为 成员/身份/所属组长/操作；
//   积分口径仍由发放弹窗承载（creditsOf 同源逻辑保留，仅此处不再展示）。
// 【发放明细加操作人 2026-07-07】发放明细弹窗在「发放时间」后新增「操作人」列（红框标注）；
//   发放记录落库时带 operator=当前登录管理员（复刻站固定「管理员」），旧记录无该字段显示「—」。
window.Pages['enterprises'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    // 【企业账号体系升级 2026-06-25】企业「模型上架状态」：与企业积分配置/团队模式同源(window.__ENT_MODEL_STATE)
    const _tpl=((ctx.data.templates&&ctx.data.templates.templates)||[]);
    const ENT_MODELS=_tpl.length?_tpl.map((t,i)=>({modelKey:t.templateKey||('model_'+i),name:t.displayName||t.templateKey||('模型'+(i+1))})):[
      {modelKey:'video_happyhorse',name:'HappyHorse'},{modelKey:'video_kling_v3_std',name:'Kling V3 标准'},
      {modelKey:'image_nano_banana',name:'Nano banana 2'},{modelKey:'upscale_topaz_video',name:'Topaz 视频高清'},
      {modelKey:'text_prompt_pro',name:'文本扩写 Pro'},
    ];
    const ENT_STATE=(window.__ENT_MODEL_STATE=window.__ENT_MODEL_STATE||{});
    // 【首次启用 2026-07-06】企业已完成首次启用的记录：{orgId:{at:unix}}；启用成功后按钮置灰不可再点
    const ACTIVATED=(window.__ENT_ACTIVATED=window.__ENT_ACTIVATED||{});
    function entStateFor(r){
      if(!ENT_STATE[r.id]){ const opened=new Set((((r.perks)||{}).models||[]).map(m=>m.name)); const s={}; ENT_MODELS.forEach(m=>{ s[m.modelKey]={status:opened.has(m.name)?'online':'off',override:null}; }); ENT_STATE[r.id]=s; }
      return ENT_STATE[r.id];
    }
    function visCount(r){ const s=entStateFor(r); return ENT_MODELS.filter(m=>s[m.modelKey].status==='online').length; }

    let all = ((ctx.data.organizations && ctx.data.organizations.list) || []).map(o=>({
      id:o.id, name:o.name, email:o.email, remark:o.remark||'',
      perks:o.perks || {models:[],concurrency:0},
      userCount:o.userCount||0, modelConfigCount:o.modelConfigCount||0,
      createdAtUnixSecond:o.createdAtUnixSecond, updatedAtUnixSecond:o.updatedAtUnixSecond,
    }));

    let filter = { kw:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['企业管理','企业管理'], title:'企业管理',
      desc:'管理企业组织的创建与维护，支持绑定成员用户并按身份配置企业权益',
      actions:[ h('button',{class:'btn btn-primary',onclick:()=>openEdit(null)},['新建企业']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.kw){
          const k=filter.kw.toLowerCase();
          if(!((r.name||'').toLowerCase().includes(k) || (r.email||'').toLowerCase().includes(k))) return false;
        }
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn = h('input',{class:'input',placeholder:'模糊匹配企业名称或邮箱',value:filter.kw,style:{minWidth:'240px'}});
      container.appendChild(ctx.FilterBar([
        kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kw:kwIn.value.trim()}; page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kw:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'企业名称', render:r=>r.name||'—' },
          // 【删列 2026-07-07】按红框删除「联系方式」列；邮箱仅从列表隐藏，数据保留（搜索 / 编辑弹窗仍可用）
          // 【存续/解约 2026-07-01】企业签约状态列：存续（在营）↔ 解约（已解约），驱动操作列的「解约 / 恢复存续」
          { title:'状态', width:104, align:'center', render:r=> r.status==='terminated'
              ? h('div',{},[ Tag('解约','gray'), r.terminatedAtUnixSecond? h('div',{class:'small muted',style:{marginTop:'2px'}},[ctx.fmtUnix(r.terminatedAtUnixSecond).slice(0,10)]) : null ].filter(Boolean))
              : Tag('存续','green') },
          { title:'用户数', width:90, align:'center', render:r=>Tag(String(r.userCount),'blue') },
          { title:'模型配置', width:110, align:'center', render:r=>h('span',{class:'small'},[String(r.modelConfigCount)+' 条']) },
          { title:'创建时间', width:170, align:'center', render:r=>ctx.fmtUnix(r.createdAtUnixSecond) },
          { title:'操作', width:500, align:'center', render:r=>{
            // 【存续/解约 2026-07-01】操作随状态切换：存续→「解约」（confirmTerminate）；解约→「恢复存续」（confirmRestore），且已解约企业冻结只读
            if(r.status==='terminated'){
              return h('div',{class:'row gap6',style:{justifyContent:'center',flexWrap:'wrap'}},[
                h('button',{class:'btn btn-sm',disabled:true,title:'企业已解约，冻结为只读，不可发放企业积分',style:{opacity:'.4',cursor:'not-allowed'}},['发放企业积分']),
                h('button',{class:'btn btn-sm',onclick:()=>showMembers(r,true)},['查看成员']),
                h('button',{class:'btn btn-sm',onclick:()=>showIdentityPerks(r,true)},['查看权益']),
                h('button',{class:'btn btn-sm',disabled:true,title:'企业已解约，冻结为只读，不可编辑',style:{opacity:'.4',cursor:'not-allowed'}},['编辑']),
                h('button',{class:'btn btn-sm btn-primary',onclick:()=>confirmRestore(r)},['恢复存续']),
              ]);
            }
            // 【首次启用 2026-07-06】启用按钮仅第一次企业配置时可点：成功启用一次后置灰不可再点
            const act = ACTIVATED[r.id];
            return h('div',{class:'row gap6',style:{justifyContent:'center',flexWrap:'wrap'}},[
              h('button',{class:'btn btn-sm',onclick:()=>openGrant(r)},['发放企业积分']),
              h('button',{class:'btn btn-sm',onclick:()=>showMembers(r)},['成员管理']),
              h('button',{class:'btn btn-sm',onclick:()=>showIdentityPerks(r)},['身份权益管理']),
              h('button',{class:'btn btn-sm',onclick:()=>openEdit(r)},['编辑']),
              h('button',{class:'btn btn-sm btn-danger',onclick:()=>confirmTerminate(r)},['解约']),
              act
                ? h('button',{class:'btn btn-sm',disabled:true,title:'已于 '+ctx.fmtUnix(act.at)+' 完成首次启用，启用仅可执行一次',style:{opacity:'.4',cursor:'not-allowed'}},['启用'])
                : h('button',{class:'btn btn-sm btn-primary',onclick:()=>openActivate(r)},['启用']),
            ]);
          } },
        ],
        rows:pageRows,
        empty:'暂无企业数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    // 【成员管理 2026-06-30】主/子身份 + 改角色/移除 + 批量添加（Demo 明细）
    //  · 操作列仅保留「改角色 / 移除」；移除按身份划分（见 showMembers · canRemove）。
    //  · 删除「会员等级 / 功能权限」两列与逐账号功能权限勾选、关联/解绑组长等入口。
    //  · 【主账号身份对调 2026-07-01】主账号「改角色」＝与一名组长对调身份（ownerSwap）：
    //    组长升为主账号、原主账号转为组长，并整组接管原组长名下全部组员（组员保留、归属自动更新）。
    function demoMembers(r){
      const names = ['张航','李墨','王竹','赵星','钱屿','孙澄'];
      const ids = ['zhang','li','wang','zhao','qian','sun'];
      const lvs = ['APEX','PRO','STAR','NONE','BASE','NONE'];
      const quotas = [5000,3000,2000,1000,800,500];
      const domain = (r.email||'corp.com').split('@')[1] || 'corp.com';
      const n = Math.max(3, Math.min(6, r.userCount||5));
      // 角色分布：第 1 个=企业主账号(唯一)、第 2 个=组长、其余=组员子账号
      const leaderEmail = ids[1]+'@'+domain;
      const arr = [];
      for(let i=0;i<n;i++){
        const role = i===0?'owner':(i===1?'leader':'sub');
        arr.push({
          name: names[i%names.length], email: ids[i%ids.length]+'@'+domain,
          role,
          level: lvs[i%lvs.length],
          unlimited: false, quota: quotas[i%quotas.length],
          // 子账号必须归属一个组长（不允许「未关联」）——演示统一挂到该组长
          leaderEmail: role==='sub' ? leaderEmail : null,
        });
      }
      return arr;
    }
    // 【成员剩余积分 2026-07-06】成员剩余积分统一口径（成员管理列表与「发放积分」弹窗同源）：
    //  已被发放过取 m.__credits（发积分即时累加），未初始化时回退成员额度 Mock（quota）
    const creditsOf = m => m.__credits==null ? (m.quota||0) : m.__credits;
    function showMembers(r, readonly){
      readonly=!!readonly;
      r.__members = r.__members || demoMembers(r);
      const ROLE = { owner:{text:'主账号',color:'amber'}, leader:{text:'组长',color:'green'}, sub:{text:'子账号',color:'blue'} };
      const box = h('div');
      function renderInner(){
        box.innerHTML='';
        if(readonly){ box.appendChild(h('div',{class:'small',style:{padding:'8px 10px',marginBottom:'10px',borderRadius:'8px',background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.35)',color:'#f59e0b'}},['该企业已解约，成员已转为独立个人账号，本弹窗仅供查看，不可增删改。'])); }
        const owners=r.__members.filter(x=>x.role==='owner').length, leaders=r.__members.filter(x=>x.role==='leader').length, subs=r.__members.filter(x=>x.role==='sub').length;
        box.appendChild(h('div',{class:'row mb12',style:{alignItems:'center'}},[
          h('span',{class:'muted'},['共 ']), h('span',{class:'bold'},[String(r.__members.length)]), h('span',{class:'muted'},[' 名成员（主账号 '+owners+' · 组长 '+leaders+' · 子账号 '+subs+'）']),
          readonly
            ? h('button',{class:'btn btn-sm',disabled:true,title:'企业已解约，成员已转为独立个人账号，不可添加',style:{marginLeft:'auto',opacity:'.4',cursor:'not-allowed'}},['+ 添加成员'])
            : h('button',{class:'btn btn-sm btn-primary',style:{marginLeft:'auto'},onclick:invite},['+ 添加成员']),
        ]));
        box.appendChild(ctx.DataTable({
          columns:[
            { title:'成员', render:m=>h('div',{},[h('div',{},[m.name]), h('div',{class:'small muted'},[m.email])]) },
            { title:'身份', width:84, align:'center', render:m=>{ const t=ROLE[m.role]; return Tag(t.text,t.color); } },
            { title:'所属组长', width:128, align:'center', render:m=>{
                if(m.role==='owner') return h('span',{class:'small muted'},['—']);
                if(m.role==='leader'){ const c=r.__members.filter(x=>x.role==='sub'&&x.leaderEmail===m.email).length; return h('span',{class:'small'},['组员 '+c+' 人']); }
                const ld=m.leaderEmail&&r.__members.find(x=>x.email===m.leaderEmail&&x.role==='leader');
                return ld? h('span',{class:'small'},[ld.name]) : h('span',{class:'small',style:{color:'#f59e0b'}},['未关联']);
            } },
            { title:'操作', width:160, align:'center', render:m=>actionsFor(m) },
          ],
          rows:r.__members, empty:'暂无成员',
        }));
      }
      // 移除权限划分：主账号可移除全部（自己除外）；组长仅自己名下组员子账号；子账号不可移除
      function canRemove(actor, m){
        if(!actor) return false;
        if(m.role==='owner') return false;                 // 企业唯一主账号恒不可移除
        if(m.email===actor.email) return false;            // 不能移除自己
        if(actor.role==='owner') return true;              // 主账号：可移除全部（自己除外）
        if(actor.role==='leader') return m.role==='sub' && m.leaderEmail===actor.email; // 组长：仅自己名下组员子账号
        return false;                                       // 子账号：不可移除任何账号
      }
      function removeBlockReason(actor, m){
        if(m.role==='owner') return '企业唯一主账号不可移除';
        if(actor && m.email===actor.email) return '不能移除自己';
        if(!actor || actor.role==='sub') return '子账号无移除权限';
        if(actor.role==='leader'){
          if(m.role==='leader') return '组长不能移除其他组长';
          if(m.role==='sub' && m.leaderEmail!==actor.email) return '只能移除自己名下的组员子账号';
        }
        return '无移除权限';
      }
      // 操作列：仅「改角色 / 移除」；主账号角色锁定；移除固定以企业主账号视角做权限划分（主账号行不可移除）
      function actionsFor(m){
        const actor = r.__members.find(x=>x.role==='owner');
        if(readonly){
          return h('div',{class:'row gap6',style:{justifyContent:'center',flexWrap:'wrap'}},[
            h('button',{class:'btn btn-sm',disabled:true,title:'企业已解约，成员已转为独立个人账号，不可操作',style:{opacity:'.4',cursor:'not-allowed'}},['改角色']),
            h('button',{class:'btn btn-sm btn-danger',disabled:true,title:'企业已解约，成员已转为独立个人账号，不可操作',style:{opacity:'.4',cursor:'not-allowed'}},['移除']),
          ]);
        }
        const btns=[];
        if(m.role==='owner') btns.push(h('button',{class:'btn btn-sm',title:'主账号改角色＝与一名组长「身份对调」：组长升为主账号、原主账号转为组长',onclick:()=>changeRole(m)},['改角色']));
        else btns.push(h('button',{class:'btn btn-sm',onclick:()=>changeRole(m)},['改角色']));
        if(canRemove(actor, m)){
          btns.push(h('button',{class:'btn btn-sm btn-danger',onclick:()=>{
            // 组长名下仍有组员时，先走「改派组员」流程（不允许出现未关联子账号），改派后再移除
            if(m.role==='leader'){ const subs=r.__members.filter(x=>x.leaderEmail===m.email); if(subs.length){ openReassign(m,'remove'); return; } }
            r.__members=r.__members.filter(x=>x!==m); ctx.toast('success','已移除 '+(m.name||'')); renderInner();
          }},['移除']));
        } else {
          btns.push(h('button',{class:'btn btn-sm btn-danger',disabled:true,title:removeBlockReason(actor,m),style:{opacity:'.4',cursor:'not-allowed'}},['移除']));
        }
        return h('div',{class:'row gap6',style:{justifyContent:'center',flexWrap:'wrap'}},btns);
      }
      // 改角色：组长 ↔ 子账号 直接切换；主账号走「身份对调」（ownerSwap，选一名组长对调身份）
      function changeRole(m){
        if(m.role==='owner'){ ownerSwap(m); return; }
        const sel=h('select',{class:'select'},[['leader','组长账号'],['sub','组员子账号']].map(([v,t])=>h('option',{value:v,selected:m.role===v},[t])));
        const cm=ctx.modal({ title:'改角色 — '+(m.name||''), body:[
          h('div',{class:'field'},[h('label',{},['角色']), sel]),
        ], footer:[
          h('button',{class:'btn',onclick:()=>cm.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const nr=sel.value; if(nr===m.role){ cm.close(); return; }
            // 组长→子账号：先把名下组员改派给其他组长，且本人改子账号后也需归属一名组长（不允许未关联）
            if(m.role==='leader'&&nr==='sub'){
              const otherLeaders=r.__members.filter(x=>x.role==='leader'&&x.email!==m.email);
              if(!otherLeaders.length){ ctx.toast('warning','企业内没有其他组长可接收，请先添加 / 指定另一名组长后再改为子账号'); return; }
              cm.close(); openReassign(m,'demote'); return;
            }
            if(nr==='leader') m.leaderEmail=null;
            m.role=nr; ctx.toast('success','已改为'+ROLE[nr].text); cm.close(); renderInner();
          }},['确定']),
        ]});
      }
      // 【主账号身份对调 2026-07-01】主账号改角色＝只能做身份替换：选择一名组长与其对调——
      //  该组长升为企业主账号；原主账号转为组长，并接管原组长名下的全部组员子账号（组员保留、归属自动更新）。
      function ownerSwap(m){
        const leaders = r.__members.filter(x=>x.role==='leader');
        if(!leaders.length){ ctx.toast('warning','企业内暂无组长，无法进行主账号身份对调——请先添加 / 指定一名组长'); return; }
        const sel = h('select',{class:'select'},[ h('option',{value:''},['请选择用于对调的组长…']), ...leaders.map(L=>h('option',{value:L.email},[L.name+'（'+L.email+'）'])) ]);
        const preview = h('div',{class:'small muted',style:{marginTop:'8px'}},['']);
        function paintPreview(){
          const L = leaders.find(x=>x.email===sel.value);
          if(!L){ preview.textContent='选择组长后，此处预览对调结果'; return; }
          const n = r.__members.filter(x=>x.role==='sub'&&x.leaderEmail===L.email).length;
          preview.textContent = '对调后：「'+L.name+'」→ 企业主账号；「'+(m.name||'')+'」→ 组长'+(n?('，接管「'+L.name+'」名下 '+n+' 名组员（组员全部保留，仅归属更新）'):('（「'+L.name+'」名下暂无组员）'));
        }
        sel.onchange = paintPreview; paintPreview();
        const cm = ctx.modal({ title:'改角色 — '+(m.name||'')+'（主账号身份对调）', body:[
          h('div',{class:'small muted mb12'},['企业主账号唯一，改角色**只能做身份替换**：选择一名组长与其对调——该组长升为企业主账号；原主账号转为组长，并接管原组长名下的**全部组员子账号**（组员一个不少，所属组长自动更新，不产生未关联）。']),
          h('div',{class:'field'},[h('label',{},['选择对调的组长账号 *']), sel, preview]),
        ], footer:[
          h('button',{class:'btn',onclick:()=>cm.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const L = r.__members.find(x=>x.role==='leader'&&x.email===sel.value);
            if(!L){ ctx.toast('warning','请选择用于对调的组长账号'); return; }
            const subs = r.__members.filter(x=>x.role==='sub'&&x.leaderEmail===L.email);
            subs.forEach(s=>{ s.leaderEmail = m.email; }); // 原组长名下组员整组保留，改归新组长（原主账号）
            L.role='owner'; L.leaderEmail=null;            // 组长 → 企业主账号
            m.role='leader'; m.leaderEmail=null;           // 原主账号 → 组长
            ctx.toast('success','已对调：「'+L.name+'」升为企业主账号，「'+(m.name||'')+'」转为组长'+(subs.length?('，接管组员 '+subs.length+' 人'):''));
            cm.close(); renderInner();
          }},['确认对调']),
        ]});
      }
      // 【改派组员 2026-07-01】移除组长 / 组长改子账号前，把其名下组员（改子账号时含本人）改派给其他组长
      // 【统一改派 2026-07-06】由逐人各选一次改为一次统一分配：一个下拉选定一名接收组长，名下组员（含本人）整批划转
      function openReassign(leaderMember, mode){
        const subs = r.__members.filter(x=>x.role==='sub' && x.leaderEmail===leaderMember.email);
        const otherLeaders = r.__members.filter(x=>x.role==='leader' && x.email!==leaderMember.email);
        if(!otherLeaders.length){ ctx.toast('warning','企业内没有其他组长可接收组员，请先添加 / 指定另一名组长后再操作'); return; }
        const accounts = subs.slice();
        if(mode==='demote') accounts.push(leaderMember); // 本人改子账号后也需归属一名组长
        const sel=h('select',{class:'select',style:{width:'100%'}},[ h('option',{value:''},['请选择接收组长…']), ...otherLeaders.map(L=>h('option',{value:L.email},[L.name+'（'+L.email+'）'])) ]);
        const rows = accounts.map(acc=>{
          const isSelf = acc===leaderMember;
          return h('div',{class:'row',style:{alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}},[
            h('div',{class:'flex1'},[ h('div',{},[ (acc.name||acc.email) + (isSelf?'　（本人 · 改为子账号）':'') ]), h('div',{class:'small muted'},[acc.email]) ]),
          ]);
        });
        const title = mode==='remove' ? ('移除组长 — '+(leaderMember.name||'')) : ('改为子账号 — '+(leaderMember.name||''));
        const intro = mode==='remove'
          ? ('移除组长「'+(leaderMember.name||'')+'」前，需将其名下 '+subs.length+' 名组员统一改派给一名其他组长（不允许出现未关联子账号）：')
          : (subs.length
              ? ('「'+(leaderMember.name||'')+'」改为子账号前，其名下 '+subs.length+' 名组员与其本人将统一划转给同一名新组长：')
              : ('「'+(leaderMember.name||'')+'」改为子账号后需归属一名组长，请为其指定：'));
        const tm = ctx.modal({ size:'lg', title, body:[
          h('div',{class:'small muted mb12'},[intro]),
          h('div',{class:'field'},[ h('label',{},['接收组长（统一分配）']), sel ]),
          h('div',{class:'small muted',style:{marginTop:'4px'}},['以下 '+accounts.length+' 个账号将整批划转：']),
          h('div',{class:'col'}, rows),
        ], footer:[
          h('button',{class:'btn',onclick:()=>tm.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            if(!sel.value){ ctx.toast('warning','请选择接收组长'); return; }
            accounts.forEach(a=>{ const mem=r.__members.find(x=>x.email===a.email); if(mem) mem.leaderEmail=sel.value; });
            if(mode==='remove'){
              r.__members = r.__members.filter(x=>x!==leaderMember);
              ctx.toast('success','已移除组长「'+(leaderMember.name||'')+'」，'+subs.length+' 名组员已统一改派');
            } else {
              leaderMember.role='sub';
              ctx.toast('success','「'+(leaderMember.name||'')+'」已改为子账号'+(subs.length?('，'+subs.length+' 名组员已统一改派'):''));
            }
            tm.close(); renderInner();
          }},[mode==='remove'?'确认移除并改派':'确认改为子账号']),
        ]});
      }
      // 添加成员：支持一次批量校验 + 添加多个账号；子账号必须先选所属组长
      // 【新增成员积分默认 0 · 2026-07-07】新加入账号尚未被发放过积分，剩余积分一律为 0（quota/__credits 置 0），
      //   需在企业操作列「发放积分」发放后才有余额；预置 Demo 成员的 quota Mock 不受影响
      function invite(){
        const roleSel=h('select',{class:'select'},[['sub','组员子账号'],['leader','组长账号']].map(([v,t])=>h('option',{value:v},[t])));
        const leaderSel=h('select',{class:'select'});
        const leaderField=h('div',{class:'field'},[h('label',{},['所属组长（添加子账号必选）']), leaderSel]);
        function paintLeaders(){
          leaderSel.innerHTML='';
          const lds=r.__members.filter(x=>x.role==='leader');
          if(!lds.length){ leaderSel.appendChild(h('option',{value:''},['（企业内暂无组长，请先添加组长账号）'])); }
          else { leaderSel.appendChild(h('option',{value:''},['请选择组长…'])); lds.forEach(L=> leaderSel.appendChild(h('option',{value:L.email},[L.name+'（'+L.email+'）']))); }
        }
        paintLeaders();
        const emailsIn=h('textarea',{class:'textarea',placeholder:'每行一个邮箱，或用空格 / 逗号分隔，可一次添加多个'});
        emailsIn.value='user107@demo.test\nuser79@demo.test';
        const resultBox=h('div',{class:'col',style:{gap:'4px',marginTop:'8px'}});
        let checked=[]; // [{email, ok, msg}]
        function parseEmails(){ return [...new Set(emailsIn.value.split(/[\s,;，；、]+/).map(s=>s.trim()).filter(Boolean))]; }
        function validateOne(e){
          if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { email:e, ok:false, msg:'邮箱格式不正确' };
          if(/(test|fake|xxx|invalid|错误)/i.test(e)) return { email:e, ok:false, msg:'该账号不存在 / 未注册' }; // demo：含这些字样视为未注册
          if(r.__members.some(x=>x.email.toLowerCase()===e.toLowerCase())) return { email:e, ok:false, msg:'已在企业内，请勿重复添加' };
          return { email:e, ok:true, msg:'可加入' };
        }
        function check(){
          const list=parseEmails();
          if(!list.length){ ctx.toast('warning','请先输入至少一个邮箱'); checked=[]; paintResult(); return; }
          checked=list.map(validateOne); paintResult();
        }
        function paintResult(){
          resultBox.innerHTML='';
          if(!checked.length) return;
          const okN=checked.filter(c=>c.ok).length, badN=checked.length-okN;
          resultBox.appendChild(h('div',{class:'small',style:{marginBottom:'2px'}},['校验结果：',
            h('span',{style:{color:'#4ade80'}},['✓ '+okN+' 个可加入']), '　',
            h('span',{style:{color: badN?'#f87171':'#6e6e6e'}},['✗ '+badN+' 个有误']) ]));
          checked.forEach(c=> resultBox.appendChild(h('div',{class:'row',style:{alignItems:'center',gap:'8px',padding:'2px 0'}},[
            h('span',{style:{width:'14px',flexShrink:'0',color:c.ok?'#4ade80':'#f87171'}},[c.ok?'✓':'✗']),
            h('span',{class:'small',style:{flex:'1',minWidth:'0',wordBreak:'break-all'}},[c.email]),
            h('span',{class:'small',style:{flexShrink:'0',color:c.ok?'#7e7e7e':'#f87171'}},[c.msg]),
          ])));
        }
        roleSel.addEventListener('change',()=>{ leaderField.style.display = roleSel.value==='sub' ? '' : 'none'; });
        leaderField.style.display = roleSel.value==='sub' ? '' : 'none';
        function submit(){
          if(roleSel.value==='sub'){
            const lds=r.__members.filter(x=>x.role==='leader');
            if(!lds.length){ ctx.toast('warning','企业内暂无组长，无法添加组员子账号——请先添加组长账号'); return; }
            if(!leaderSel.value){ ctx.toast('warning','添加组员子账号必须先选择「所属组长」'); return; }
          }
          if(!checked.length){ ctx.toast('warning','请先「校验」邮箱'); return; }
          const valid=checked.filter(c=>c.ok);
          if(!valid.length){ ctx.toast('error','没有可加入的有效账号，请修正后重试'); return; }
          const role=roleSel.value;
          valid.forEach(c=>{ r.__members.push({ name:c.email.split('@')[0], email:c.email, role, level:'PRO', unlimited:false, quota:0, __credits:0, leaderEmail: role==='sub'?leaderSel.value:null }); });
          const badN=checked.length-valid.length;
          ctx.toast('success','已加入 '+valid.length+' 个'+ROLE[role].text+(badN?'，'+badN+' 个有误已跳过':''));
          im.close(); renderInner();
        }
        const im=ctx.modal({ title:'添加成员加入 '+(r.name||''), body:[
          h('div',{class:'field'},[h('label',{},['账号角色']), roleSel]),
          h('div',{class:'small muted',style:{marginTop:'-4px',marginBottom:'6px'}},['可选「组长账号」或「组员子账号」；**企业主账号为唯一角色，不可在此新增**。支持一次批量添加多个（组长 / 子账号均可）。']),
          leaderField,
          h('div',{class:'field'},[h('label',{},['成员邮箱（可多个）']),
            h('div',{class:'row gap6',style:{alignItems:'flex-start'}},[emailsIn, h('button',{class:'btn',style:{flexShrink:'0'},onclick:check},['校验'])]),
            resultBox,
          ]),
          h('div',{class:'small muted'},['先「校验」再加入：逐个邮箱校验格式 / 是否注册 / 是否已在企业内，**有误的账号会单独提示**，加入时仅添加有效账号。添加**组员子账号必须先选所属组长**，否则不允许添加；添加组长账号支持一次填多个。新加入账号的**剩余积分默认为 0**（尚未发放积分），需在「发放积分」中发放后才有余额。']),
        ], footer:[
          h('button',{class:'btn',onclick:()=>im.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:submit},['校验通过并加入']),
        ]});
      }
      renderInner();
      ctx.modal({ size:'lg', title:(readonly?'查看成员（已解约）— ':'成员管理 — ')+(r.name||''), body:[box] });
    }

    // 【身份权益管理 2026-06-30】三种身份 × 权益勾选（当前权益仅「商单」，后续可扩展）
    // 默认沿用「企业子账号商单隔离」：主账号 / 组长 开通商单，组员子账号 商单隔离（不可见）
    const IDENTITY_ROLES = [
      { key:'owner',  name:'企业唯一主账号', hint:'企业唯一主账号，拥有最高权限' },
      { key:'leader', name:'组长账号',       hint:'分组管理者' },
      { key:'sub',    name:'组员子账号',     hint:'普通组员' },
    ];
    const IDENTITY_PERKS = [
      { key:'commercial', name:'商单', hint:'可见并参与企业商单' },
    ];
    function defaultIdentityPerks(roleKey){
      const d={}; IDENTITY_PERKS.forEach(p=>{ d[p.key] = p.key==='commercial' ? roleKey!=='sub' : false; }); return d;
    }
    function ensureIdentityPerks(r){
      const ST=(window.__ENT_IDENTITY_PERKS=window.__ENT_IDENTITY_PERKS||{});
      if(!ST[r.id]){ const s={}; IDENTITY_ROLES.forEach(ro=>{ s[ro.key]=defaultIdentityPerks(ro.key); }); ST[r.id]=s; }
      return ST[r.id];
    }
    function showIdentityPerks(r, readonly){
      readonly=!!readonly;
      const saved = ensureIdentityPerks(r);
      const draft = {}; IDENTITY_ROLES.forEach(ro=>{ draft[ro.key]=Object.assign({}, saved[ro.key]); });
      const box = h('div',{class:'col',style:{gap:'14px'}});
      IDENTITY_ROLES.forEach(ro=>{
        const grid = h('div',{class:'chk-grid'});
        IDENTITY_PERKS.forEach(p=>{
          const card = h('div',{class:'chk'+(draft[ro.key][p.key]?' on':'')},[
            h('span',{class:'chk-box'},['✓']),
            h('div',{style:{flex:'1',minWidth:'0'}},[
              h('div',{class:'chk-label'},[p.name]),
              p.hint? h('div',{class:'chk-hint'},[p.hint]):null,
            ].filter(Boolean)),
          ]);
          card.onclick=()=>{ if(readonly) return; const nv=!draft[ro.key][p.key]; draft[ro.key][p.key]=nv; card.classList.toggle('on',nv); };
          grid.appendChild(card);
        });
        box.appendChild(h('div',{class:'col',style:{gap:'6px'}},[
          h('div',{class:'chk-section-label'},[ro.name, h('span',{class:'small muted',style:{fontWeight:'400'}},['　'+ro.hint])]),
          grid,
        ]));
      });
      const m=ctx.modal({ size:'lg', title:(readonly?'查看身份权益（已解约）— ':'身份权益管理 — ')+(r.name||''), body:[
        h('div',{class:'small muted mb12'},[readonly?'该企业已解约，成员已转为独立个人账号，企业侧身份权益不再生效，本弹窗仅供查看。':'为企业内三种身份分别勾选可用权益，保存即时生效。当前可配置权益仅「商单」，后续新增权益将在此扩展。']),
        box,
      ], footer: readonly ? [
        h('button',{class:'btn',onclick:()=>m.close()},['关闭']),
      ] : [
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:()=>{ IDENTITY_ROLES.forEach(ro=>{ saved[ro.key]=Object.assign({},draft[ro.key]); }); ctx.toast('success','身份权益已保存'); m.close(); }},['保存']),
      ]});
    }

    function openEdit(r){
      const isNew = !r;
      const nameIn = h('input',{class:'input',placeholder:'如 Acme Inc',value:r?(r.name||''):''});
      const remarkIn = h('input',{class:'input',placeholder:'可选',value:r?(r.remark||''):''});

      if(isNew){
        // 新建：先搜索账号 → 确认为企业「唯一主账号」，再填名称 / 备注
        // 【搜索按钮 2026-07-07】主账号搜索框右侧新增「🔍 搜索」按钮（绿框标注处）：点击 / 回车显式触发搜索，
        //   空关键词点搜索给 warning 提示；原输入即搜行为保留（与成员管理「搜索子账号」同款并存样式）
        let owner=null; // 已选定的主账号 {email,name}
        const kwIn = h('input',{class:'input',style:{flex:'1'},placeholder:'输入邮箱 / 用户名搜索账号',oninput:()=>paintList(),onkeydown:e=>{ if(e.key==='Enter') doSearch(); }});
        const searchBtn = h('button',{class:'btn',style:{flexShrink:'0'},onclick:()=>doSearch()},['🔍 搜索']);
        const searchRow = h('div',{class:'row gap6',style:{alignItems:'center'}},[kwIn, searchBtn]);
        function doSearch(){
          if(!kwIn.value.trim()){ ctx.toast('warning','请输入邮箱 / 用户名后再搜索'); kwIn.focus(); return; }
          paintList();
        }
        const listBox = h('div',{style:{marginTop:'6px',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',maxHeight:'220px',overflowY:'auto',background:'#161616',display:'none'}});
        const ownerField = h('div',{class:'field'});
        function accountPool(){
          const src=(ctx.data.users_list && (ctx.data.users_list.users||ctx.data.users_list.list))||[];
          return src.filter(u=>u&&u.email).map(u=>({ email:u.email, name:u.username||u.nickName||u.email.split('@')[0] }));
        }
        function searchAccounts(kw){
          kw=(kw||'').trim().toLowerCase();
          let list=accountPool();
          if(kw) list=list.filter(a=> a.email.toLowerCase().includes(kw) || (a.name||'').toLowerCase().includes(kw));
          return list.slice(0,8);
        }
        function paintList(){
          const kw=kwIn.value.trim();
          listBox.innerHTML='';
          if(!kw){ listBox.style.display='none'; return; }
          listBox.style.display='';
          const cands=searchAccounts(kw);
          const isEmail=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(kw);
          if(isEmail && !cands.some(c=>c.email.toLowerCase()===kw.toLowerCase())) cands.unshift({ email:kw, name:kw.split('@')[0], _typed:true });
          if(!cands.length){ listBox.appendChild(h('div',{class:'small muted',style:{padding:'10px'}},['未找到匹配账号；输入完整邮箱可直接使用'])); return; }
          cands.forEach(c=>{
            const row=h('div',{class:'row',style:{alignItems:'center',padding:'8px 10px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.06)'}},[
              h('div',{class:'flex1'},[ h('div',{},[c.name||'—']), h('div',{class:'small muted'},[c.email]) ]),
              h('span',{class:'small',style:{color:c._typed?'#4ade80':'#9aa'}},[c._typed?'使用此邮箱':'选择']),
            ]);
            row.onclick=()=>{ owner={ email:c.email, name:c.name||c.email.split('@')[0] }; renderOwner(); ctx.toast('success','已选 '+owner.email+' 为企业唯一主账号'); };
            listBox.appendChild(row);
          });
        }
        function renderOwner(){
          ownerField.innerHTML='';
          ownerField.appendChild(h('label',{},['企业唯一主账号 *']));
          if(owner){
            ownerField.appendChild(h('div',{class:'row gap6',style:{alignItems:'center'}},[
              Tag('主账号','amber'), h('span',{},[owner.name+'（'+owner.email+'）']),
              h('button',{class:'btn btn-sm',onclick:()=>{ owner=null; kwIn.value=''; renderOwner(); }},['重新选择']),
            ]));
          } else {
            ownerField.appendChild(searchRow);
            ownerField.appendChild(listBox);
            ownerField.appendChild(h('div',{class:'small muted',style:{marginTop:'4px'}},['输入邮箱 / 用户名搜索并选择一个账号作为企业唯一主账号；选中即确认。主账号无资格限制。']));
            paintList();
          }
        }
        renderOwner();
        const m = ctx.modal({
          title:'新建企业',
          body:[
            ownerField,
            h('div',{class:'field'},[h('label',{},['企业名称 *']), nameIn]),
            h('div',{class:'field'},[h('label',{},['备注']), remarkIn]),
          ],
          footer:[
            h('button',{class:'btn',onclick:()=>m.close()},['取消']),
            h('button',{class:'btn btn-primary',onclick:()=>{
              if(!owner){ ctx.toast('warning','请先搜索并「确认」企业主账号'); return; }
              const name=nameIn.value.trim();
              if(!name){ ctx.toast('warning','请输入企业名称'); return; }
              if(name.length>120){ ctx.toast('warning','企业名称不超过 120 字符'); return; }
              all.unshift({ id:'019'+Math.random().toString(16).slice(2,18), name, email:owner.email, remark:remarkIn.value.trim(),
                perks:{models:[],concurrency:0}, userCount:1, modelConfigCount:0,
                createdAtUnixSecond:Math.floor(Date.now()/1000), updatedAtUnixSecond:Math.floor(Date.now()/1000),
                __members:[{ name:owner.name, email:owner.email, role:'owner', level:'NONE', unlimited:false, quota:0, leaderEmail:null }] });
              ctx.toast('success','创建成功，'+owner.email+' 已设为企业唯一主账号');
              m.close(); page=1; render();
            }},['确定']),
          ],
        });
      } else {
        // 编辑：名称 / 备注可改；主账号只读（更换主账号本期不做）
        const m = ctx.modal({
          title:'编辑企业',
          body:[
            h('div',{class:'field'},[h('label',{},['企业唯一主账号']),
              h('div',{class:'row gap6',style:{alignItems:'center'}},[ Tag('主账号','amber'), h('span',{},[r.email||'—']), h('span',{class:'small muted'},['（更换主账号需走「转移主账号」，本期暂不支持）']) ]),
            ]),
            h('div',{class:'field'},[h('label',{},['企业名称 *']), nameIn]),
            h('div',{class:'field'},[h('label',{},['备注']), remarkIn]),
          ],
          footer:[
            h('button',{class:'btn',onclick:()=>m.close()},['取消']),
            h('button',{class:'btn btn-primary',onclick:()=>{
              const name=nameIn.value.trim();
              if(!name){ ctx.toast('warning','请输入企业名称'); return; }
              if(name.length>120){ ctx.toast('warning','企业名称不超过 120 字符'); return; }
              r.name=name; r.remark=remarkIn.value.trim(); r.updatedAtUnixSecond=Math.floor(Date.now()/1000);
              ctx.toast('success','编辑成功'); m.close(); page=1; render();
            }},['确定']),
          ],
        });
      }
    }

    // 【首次启用 2026-07-06】企业「启用」= 首次配置完成后的一次性动作。点击后按顺序逐项检查：
    //  ① 积分配置（已配置模型积分消耗值，来源=企业积分配置的模版绑定一键导入）
    //  ② 模型可用权限（至少一个模型开启可使用权限）
    //  任一项不通过立即中断（该项标红、后续项标未检查）；全部通过后「确认启用」才可点。
    //  数据只读取共享态（__ENT_MODEL_STATE / __ORG_TPL_BINDING / __CREDIT_TEMPLATES），本页不初始化不落盘。
    // 【启用检查精简 2026-07-06】按用户红框删除三处：第 ③ 项「积分与权限完整性」检查、底部检查中断/通过结果面板、「去补齐配置」按钮。
    function activateSnapshot(r){
      const s = (window.__ENT_MODEL_STATE||{})[r.id];
      let online=[], configured=0;
      if(s){
        Object.keys(s).forEach(k=>{
          if(s[k].status==='online') online.push(k);
          if(s[k].override!=null) configured++;
        });
      } else {
        // 共享态未初始化（未进过积分配置页）：按企业权益推导已开权限模型；积分必然未配置
        const opened=new Set((((r.perks)||{}).models||[]).map(m=>m.name));
        online = ENT_MODELS.filter(m=>opened.has(m.name)).map(m=>m.modelKey);
      }
      const tpl = ((window.__CREDIT_TEMPLATES)||[]).find(t=>t.id===(window.__ORG_TPL_BINDING||{})[r.id]) || null;
      return { online, configured, tpl };
    }
    const ACTIVATE_CHECKS = [
      { name:'积分配置', run:sn=> sn.configured>0
          ? { ok:true, msg:'已配置 '+sn.configured+' 个模型的积分消耗值'+(sn.tpl?('，绑定模版「'+sn.tpl.name+'」'):'') }
          : { ok:false, msg:'该企业尚未配置任何模型的积分消耗值'+(sn.tpl?'':'，也未绑定积分消耗模版') } },
      { name:'模型可用权限', run:sn=> sn.online.length>0
          ? { ok:true, msg:'已开启可使用权限的模型 '+sn.online.length+' 个' }
          : { ok:false, msg:'该企业没有任何模型开启可使用权限' } },
    ];
    function openActivate(r){
      const sn = activateSnapshot(r);
      let closed=false, passedAll=false;
      const ICON = {
        pending:()=>h('span',{style:{color:'#6e6e6e'}},['◌']),
        spin:()=>h('span',{style:{display:'inline-block',color:'#f59e0b',animation:'entActSpin .8s linear infinite'}},['⟳']),
        pass:()=>h('span',{style:{color:'#4ade80',fontWeight:'700'}},['✓']),
        fail:()=>h('span',{style:{color:'#f87171',fontWeight:'700'}},['✕']),
        skip:()=>h('span',{style:{color:'#6e6e6e'}},['—']),
      };
      const items = ACTIVATE_CHECKS.map((c,i)=>{
        const iconBox=h('span',{style:{width:'20px',flexShrink:'0',textAlign:'center'}},[ICON.pending()]);
        const msg=h('div',{class:'small muted',style:{margin:'2px 0 0 30px'}},['待检查']);
        const row=h('div',{style:{padding:'10px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.03)'}},[
          h('div',{class:'row gap10',style:{alignItems:'center'}},[iconBox, h('span',{class:'bold'},[(i+1)+'. '+c.name])]),
          msg,
        ]);
        function set(state, text){
          iconBox.innerHTML=''; iconBox.appendChild(ICON[state]());
          msg.textContent=text;
          msg.style.color = state==='fail' ? '#f87171' : '';
          row.style.borderColor = state==='pass' ? 'rgba(74,222,128,.35)' : (state==='fail' ? 'rgba(248,113,113,.45)' : 'rgba(255,255,255,.08)');
        }
        return { c, row, set };
      });
      const listBox=h('div',{class:'col',style:{gap:'8px'}});
      items.forEach(it=>listBox.appendChild(it.row));
      const confirmBtn=h('button',{class:'btn btn-primary',disabled:true,style:{opacity:'.4',cursor:'not-allowed'},onclick:()=>{
        if(!passedAll) return;
        ACTIVATED[r.id]={ at: Math.floor(Date.now()/1000) };
        ctx.toast('success','「'+(r.name||'')+'」已启用：首次配置检查全部通过');
        m.close(); render();
      }},['确认启用']);
      const m=ctx.modal({ title:'启用企业 — '+(r.name||''), onClose:()=>{ closed=true; },
        body:[
          h('style',{html:'@keyframes entActSpin{to{transform:rotate(360deg)}}'}),
          h('div',{class:'small muted mb12',style:{lineHeight:'1.8'}},['启用前按顺序逐项检查企业配置，全部通过后点「确认启用」完成首次启用；任一项缺失将',h('b',{},['立即中断']),'并提示补齐。启用仅需执行一次，成功后按钮置灰。']),
          listBox,
        ],
        footer:[ h('button',{class:'btn',onclick:()=>m.close()},['取消']), confirmBtn ],
      });
      let idx=0;
      function step(){
        if(closed) return;
        if(idx>=items.length){
          passedAll=true;
          confirmBtn.disabled=false; confirmBtn.style.opacity=''; confirmBtn.style.cursor='';
          return;
        }
        const it=items[idx];
        it.set('spin','检查中…');
        setTimeout(()=>{
          if(closed) return;
          const res=it.c.run(sn);
          if(res.ok){ it.set('pass',res.msg); idx++; step(); }
          else {
            it.set('fail',res.msg);
            for(let j=idx+1;j<items.length;j++) items[j].set('skip','已中断，未检查');
          }
        }, 650);
      }
      step();
    }

    // 【发放积分 2026-07-06】操作列「发放积分」（成员管理之前）。
    // 【发放积分改版 2026-07-06】弹窗由企业级表单改为**成员列表**：用户名称 / 用户邮箱 / 剩余积分 / 身份 / 操作，
    //  操作列两个按钮——「发积分」逐成员发放（整数 + 说明必填，确认后即时计入剩余积分）；「发放明细」查看该成员逐笔发放记录。
    //  成员数据与「成员管理」同源（r.__members，那边增删改这边即时可见）；剩余积分初值取成员 quota Mock；
    //  Demo 只改内存副本（m.__credits / m.__grantRecords），刷新还原、不发网络请求。
    function openGrant(r){
      r.__members = r.__members || demoMembers(r);
      const ROLE = { owner:{text:'主账号',color:'amber'}, leader:{text:'组长',color:'green'}, sub:{text:'子账号',color:'blue'} };
      const fmtN = n => Number(n||0).toLocaleString('en-US');
      const ensure = m => { m.__credits = creditsOf(m); m.__grantRecords = m.__grantRecords||[]; return m; };
      const box = h('div');
      function renderInner(){
        box.innerHTML='';
        const members = r.__members.map(ensure);
        const totalGranted = members.reduce((a,m)=>a+m.__grantRecords.reduce((s,g)=>s+g.points,0),0);
        box.appendChild(h('div',{class:'row mb12',style:{alignItems:'center'}},[
          h('span',{class:'muted'},['共 ']), h('span',{class:'bold'},[String(members.length)]), h('span',{class:'muted'},[' 名成员 · 累计发放 ']),
          h('span',{class:'bold'},[fmtN(totalGranted)]), h('span',{class:'muted'},[' 积分']),
        ]));
        box.appendChild(ctx.DataTable({
          columns:[
            { title:'用户名称', render:m=>m.name||'—' },
            { title:'用户邮箱', render:m=>h('span',{class:'small'},[m.email||'—']) },
            { title:'企业剩余积分', width:130, align:'center', render:m=>h('span',{class:'bold'},[fmtN(m.__credits)]) },
            { title:'身份', width:84, align:'center', render:m=>{ const t=ROLE[m.role]||{text:m.role||'—',color:'gray'}; return Tag(t.text,t.color); } },
            { title:'操作', width:220, align:'center', render:m=>h('div',{class:'row gap6',style:{justifyContent:'center',flexWrap:'wrap'}},[
              h('button',{class:'btn btn-sm btn-primary',onclick:()=>grantOne(m)},['发放企业积分']),
              h('button',{class:'btn btn-sm',onclick:()=>showGrantRecords(m)},['发放明细']),
            ]) },
          ],
          rows:members, empty:'暂无成员',
        }));
      }
      // 「发积分」：向单个成员发放。
      // 【发积分表单对齐线上 2026-07-06】弹窗按线上后台「发放积分」新版表单复刻：
      //  积分类型 * → 发放积分 * → 有效期天数（留空=365，1–365 整数）→ 发放理由 *；底部 取消/确定。
      //  确认后即时计入该成员剩余积分并逐笔留痕（含类型/有效期）。
      // 【类型更名 2026-07-06】「赠送积分」→「企业积分」。
      // 【仅企业积分 2026-07-06】积分类型下拉仅保留「企业积分」一项（删「购买积分」及其切换隐藏有效期逻辑）。
      function grantOne(m0){
        const m = ensure(m0);
        const typeSel = h('select',{class:'select'},[ h('option',{value:'POINT_BUCKET_TYPE_ENTERPRISE'},['企业积分']) ]);
        const typeHint = h('div',{class:'small muted',style:{marginTop:'-4px',marginBottom:'10px'}},['企业积分有效期 365 天（留空走默认）']);
        const numIn = h('input',{class:'input',type:'number',min:'1',step:'1',placeholder:'输入发放积分数量'});
        const daysIn = h('input',{class:'input',type:'number',min:'1',max:'365',step:'1',placeholder:'留空 = 365 天'});
        const daysField = h('div',{class:'field'},[h('label',{},['有效期天数']), daysIn,
          h('div',{class:'small muted',style:{marginTop:'4px'}},['1–365 整数；留空按默认 365 天'])]);
        const ta = h('textarea',{class:'textarea',placeholder:'输入发放理由说明（必填）'});
        const gm = ctx.modal({ title:'发放积分 — '+(m.name||''), body:[
          h('div',{class:'field'},[h('label',{},['积分类型 *']), typeSel]),
          typeHint,
          h('div',{class:'field'},[h('label',{},['发放积分 *']), numIn]),
          daysField,
          h('div',{class:'field'},[h('label',{},['发放理由 *']), ta]),
        ], footer:[
          h('button',{class:'btn',onclick:()=>gm.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const n = Number(numIn.value);
            if(!Number.isInteger(n) || n<=0){ ctx.toast('warning','发放积分必须为大于 0 的整数'); return; }
            let days = 365;
            if(daysIn.value.trim()!==''){
              days = Number(daysIn.value);
              if(!Number.isInteger(days) || days<1 || days>365){ ctx.toast('warning','有效期天数须为 1–365 的整数，留空按默认 365 天'); return; }
            }
            if(!ta.value.trim()){ ctx.toast('warning','请输入发放理由说明'); return; }
            m.__credits += n;
            m.__grantRecords.push({ points:n, reason:ta.value.trim(), type:'POINT_BUCKET_TYPE_ENTERPRISE', validDays:days, atUnixSecond:Math.floor(Date.now()/1000), operator:'管理员' });
            ctx.toast('success','已向「'+(m.name||'')+'」发放 '+fmtN(n)+' 企业积分（有效期 '+days+' 天）');
            gm.close(); renderInner();
          }},['确定']),
        ]});
      }
      // 「发放明细」：该成员的逐笔发放记录（发放积分 / 发放说明 / 发放时间 / 操作人），按发放时间倒序
      function showGrantRecords(m0){
        const m = ensure(m0);
        const recs = m.__grantRecords.slice().sort((a,b)=>b.atUnixSecond-a.atUnixSecond);
        const total = recs.reduce((a,g)=>a+g.points,0);
        ctx.modal({ size:'lg', title:'发放明细 — '+(m.name||''), body:[
          h('div',{class:'small muted mb12'},['共 '+recs.length+' 条发放记录 · 累计发放 '+fmtN(total)+' 积分 · 当前剩余 '+fmtN(m.__credits)+' 积分']),
          ctx.DataTable({ columns:[
            { title:'发放积分', width:120, align:'center', render:g=>h('span',{class:'bold'},['+'+fmtN(g.points)]) },
            { title:'发放理由', render:g=>g.reason||'—' },
            { title:'发放时间', width:180, align:'center', render:g=>ctx.fmtUnix(g.atUnixSecond) },
            { title:'操作人', width:120, align:'center', render:g=>g.operator||'—' },
          ], rows:recs, empty:'暂无发放记录' }),
        ]});
      }
      renderInner();
      ctx.modal({ size:'lg', title:'发放积分 — '+(r.name||''), body:[box] });
    }

    // 【解约与存续 2026-07-01】替换原「删除」：企业解约后标记「已解约」留档并冻结为只读；成员账号转为独立个人账号（账号存续、个人数据保留）
    function confirmTerminate(r){
      const memberCount = r.__members ? r.__members.length : (r.userCount||0);
      const ack = h('input',{type:'checkbox'});
      const m = ctx.modal({
        title:'解约企业 — '+(r.name||''),
        body:[
          h('div',{},['确定要解约企业「'+(r.name||'')+'」吗？']),
          h('div',{class:'small muted mt8'},['解约后会这样：']),
          h('ul',{class:'small muted',style:{margin:'6px 0 0',paddingLeft:'18px',lineHeight:'1.9'}},[
            h('li',{},['这家企业会被停用（状态变「已解约」），之后不能再加成员、配模型；但企业记录会保留，随时能查。']),
            h('li',{},['企业里的 '+memberCount+' 名成员会各自变成独立的个人账号：脱离这家企业、不再有企业权益，但他们自己的素材、作品等都会保留。']),
          ]),
          h('label',{class:'row gap6',style:{alignItems:'flex-start',cursor:'pointer',marginTop:'12px'}},[ack, h('span',{class:'small'},['我已了解：解约后这家企业会停用、成员会变成独立个人账号。这一步用来结束和该企业的合作。'])]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            if(!ack.checked){ ctx.toast('warning','请先勾选确认知悉后再解约'); return; }
            r.status='terminated'; r.terminatedAtUnixSecond=Math.floor(Date.now()/1000); r.updatedAtUnixSecond=r.terminatedAtUnixSecond;
            if(window.__ENT_MODEL_STATE) delete window.__ENT_MODEL_STATE[r.id];      // 存续：转个人账号后企业侧模型上架不再生效
            if(window.__ENT_IDENTITY_PERKS) delete window.__ENT_IDENTITY_PERKS[r.id]; // 存续：企业侧身份权益不再生效
            delete ACTIVATED[r.id]; // 【首次启用 2026-07-06】解约清除启用记录：恢复存续后需重新完成首次启用检查
            ctx.toast('success','「'+(r.name||'')+'」已解约，'+memberCount+' 名成员转为独立个人账号，企业记录已留档');
            m.close(); render();
          }},['确认解约']),
        ],
      });
    }

    // 【恢复存续 2026-07-01】将已解约企业恢复为「存续」：重新启用企业、解冻管理入口（解约期已转个人账号的成员需按需重新添加）
    function confirmRestore(r){
      const m = ctx.modal({
        title:'恢复存续 — '+(r.name||''),
        body:[
          h('div',{},['确认将企业「'+(r.name||'')+'」恢复为「存续」状态？']),
          h('ul',{class:'small muted',style:{margin:'8px 0 0',paddingLeft:'18px',lineHeight:'1.9'}},[
            h('li',{},['企业状态由「解约」恢复为「存续」，重新可以加成员、配模型；']),
            h('li',{},['解约期间已转为独立个人账号的成员不会自动收回，如需回归企业请在「成员管理」重新添加。']),
          ]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            r.status='active'; r.terminatedAtUnixSecond=null; r.updatedAtUnixSecond=Math.floor(Date.now()/1000);
            ctx.toast('success','「'+(r.name||'')+'」已恢复存续');
            m.close(); render();
          }},['确认恢复']),
        ],
      });
    }

    render();
  }
};
