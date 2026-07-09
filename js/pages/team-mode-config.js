// 团队模式配置 — 商业化管理
// 运营侧治理：为每家企业控制「主账号给子账号发放积分额度 + 模型权限」的边界。
// 与前端「企业团队」入口（积分发放/成员管理）配套：前端是企业主账号自助发放，本页是运营层面定规则。
window.Pages['team-mode-config'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    // 【企业账号体系升级 2026-06-25】可分配模型范围与「企业积分配置」上架集合同源（PRD §7.1）：
    //   共享 window.__ENT_MODEL_STATE（企业积分配置写入），团队模式只在「已上架」集合内勾选可分配。
    const _TASKS = { video:'视频', image:'图片', text:'文本' };
    const _tpl = ((ctx.data.templates && ctx.data.templates.templates) || []);
    const ENT_MODELS = _tpl.length ? _tpl.map((t,i)=>({ modelKey:t.templateKey||('model_'+i), name:t.displayName||t.templateKey||('模型'+(i+1)), taskType:_TASKS[t.taskType]?t.taskType:'video' })) : [
      {modelKey:'video_happyhorse',name:'HappyHorse',taskType:'video'},
      {modelKey:'video_kling_v3_std',name:'Kling V3 标准',taskType:'video'},
      {modelKey:'image_nano_banana',name:'Nano banana 2',taskType:'image'},
      {modelKey:'upscale_topaz_video',name:'Topaz 视频高清',taskType:'video'},
      {modelKey:'text_prompt_pro',name:'文本扩写 Pro',taskType:'text'},
    ];
    const ENT_STATE = (window.__ENT_MODEL_STATE = window.__ENT_MODEL_STATE || {});
    function entStateFor(r){
      if(!ENT_STATE[r.id]){ const opened=new Set(((r.models)||[]).map(m=>m.name)); const s={}; ENT_MODELS.forEach(m=>{ s[m.modelKey]={status:opened.has(m.name)?'online':'off',override:null}; }); ENT_STATE[r.id]=s; }
      return ENT_STATE[r.id];
    }
    // 只有「已上线」(飞书审批通过)的模型才可分配给子账号
    function visModels(r){ const s=entStateFor(r); return ENT_MODELS.filter(m=>s[m.modelKey].status==='online'); }

    // 团队类型：内部团队 / 外部团队 / 外部企业
    const TYPE = { internal:'内部团队', external_team:'外部团队', external_org:'外部企业' };
    const TYPE_COLOR = { internal:'green', external_team:'blue', external_org:'purple' };
    const TYPE_KEYS = Object.keys(TYPE);

    const orgs = ((ctx.data.organizations && ctx.data.organizations.list) || []).map((o,i)=>({
      id:o.id, name:o.name, email:o.email,
      models:(o.perks && o.perks.models) || [],
      userCount:o.userCount||0,
      createdAtUnixSecond:o.createdAtUnixSecond,
      // 默认类型（Mock）：内部邮箱归内部团队，其余按序分外部团队/外部企业；运营可在配置里改
      type: /storeel|@storeelapp/i.test(o.email||'') ? 'internal' : TYPE_KEYS[1 + (i % 2)],
    }));

    // 治理配置（内存副本）：每家企业一份；默认值贴合产品 PRD（默认开启、两模式可切换、配额默认无限）
    const cfg = {};
    orgs.forEach(o=>{
      cfg[o.id] = {
        enabled:true,
        subCap:20,
        defaultUnlimited:true,
        defaultQuota:5000,
        allowModels:new Set(visModels(o).map(m=>m.modelKey)),  // 默认=该企业「已上架」模型全部可分配（同源自企业积分配置）
        // 子账号发放现状（Mock 样例，真实需 orgId 查询）
        subs: sampleSubs(o),
      };
    });

    function sampleSubs(o){
      const ms = o.models.map(m=>m.id);
      if(!o.userCount) return [];
      const base = [
        { name:'张三', contact:'zhangsan@'+(o.email||'corp.com').split('@')[1], note:'剪辑组', unlimited:false, quota:5000, restrict:true, models:ms.slice(0,2) },
        { name:'李四', contact:'138****6021', note:'运营', unlimited:true, quota:0, restrict:false, models:[] },
        { name:'王五', contact:'wangwu@'+(o.email||'corp.com').split('@')[1], note:'外包·设计', unlimited:false, quota:2000, restrict:true, models:ms.slice(0,1) },
      ];
      return base.slice(0, Math.max(1, Math.min(3, o.userCount)));
    }

    let filter = { kw:'', type:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['商业化管理','团队模式配置'], title:'团队模式配置',
      desc:'按企业控制团队模式：是否开启、子账号上限、可分配的模型范围；与前端「企业团队」自助发放配套',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      const k = filter.kw.toLowerCase();
      return orgs.filter(r=>{
        if(filter.type && r.type !== filter.type) return false;
        if(k && !((r.name||'').toLowerCase().includes(k) || (r.email||'').toLowerCase().includes(k))) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';
      const kwIn = h('input',{class:'input',placeholder:'模糊匹配企业名称或邮箱',value:filter.kw,style:{minWidth:'240px'}});
      const typeSel = h('select',{class:'select'},[
        h('option',{value:''},['全部团队类型']),
        ...TYPE_KEYS.map(k=>h('option',{value:k},[TYPE[k]])),
      ]);
      typeSel.value = filter.type;
      container.appendChild(ctx.FilterBar([
        kwIn,
        typeSel,
        h('button',{class:'btn btn-primary',onclick:()=>{ filter={kw:kwIn.value.trim(), type:typeSel.value}; page=1; render(); }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ filter={kw:'', type:''}; page=1; render(); }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'团队名称', render:r=>r.name||'—' },
          { title:'团队类型', width:100, align:'center', render:r=> Tag(TYPE[r.type]||'—', TYPE_COLOR[r.type]||'gray') },
          { title:'企业邮箱', render:r=>h('span',{class:'small'},[r.email||'—']) },
          { title:'团队模式', width:100, align:'center', render:r=> cfg[r.id].enabled? Tag('已开启','green') : Tag('已关闭','gray') },
          { title:'子账号', width:110, align:'center', render:r=>h('span',{class:'small'},[ (cfg[r.id].subs.length)+' / '+cfg[r.id].subCap ]) },
          { title:'可分配模型', width:130, align:'center', render:r=>h('span',{class:'small'},[ cfg[r.id].allowModels.size+' / '+visModels(r).length+' 已上架' ]) },
          { title:'操作', width:230, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
            h('button',{class:'btn btn-sm btn-primary',onclick:()=>openConfig(r)},['配置团队模式']),
            h('button',{class:'btn btn-sm btn-danger',onclick:()=>confirmDel(r)},['删除']),
          ]) },
        ],
        rows:pageRows,
        empty:'暂无企业数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    function confirmDel(r){
      const m = ctx.modal({ title:'确认删除团队',
        body:[ h('div',{},['确认删除「'+(r.name||'')+'」？']),
          h('div',{class:'small muted mt8'},['将清空该团队的模式配置、子账号发放与可分配模型设置（本地 Mock，刷新即还原）']) ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            const i = orgs.findIndex(x=>x.id===r.id);
            if(i>=0) orgs.splice(i,1);
            delete cfg[r.id];
            ctx.toast('success','已删除'); m.close();
            const maxPage = Math.max(1, Math.ceil(applied().length/pageSize));
            if(page>maxPage) page=maxPage;
            render();
          }},['确认删除']),
        ]});
    }

    function openConfig(r){
      const c = cfg[r.id];
      // 草稿（取消不生效）
      const d = { type:r.type, enabled:c.enabled, subCap:c.subCap,
        defaultUnlimited:c.defaultUnlimited, defaultQuota:c.defaultQuota, allowModels:new Set(c.allowModels) };

      // —— 团队类型
      const typeSel = h('select',{class:'select',style:{maxWidth:'200px'}},
        TYPE_KEYS.map(k=>h('option',{value:k},[TYPE[k]])));
      typeSel.value = d.type;
      typeSel.onchange = ()=>{ d.type = typeSel.value; };

      // —— 总开关
      const enToggle = ctx.Toggle(d.enabled, v=>{ d.enabled=v; body.classList.toggle('tm-off', !v); });

      // —— 子账号上限
      const capIn = h('input',{class:'input',type:'number',min:'0',value:String(d.subCap),style:{maxWidth:'160px'}});

      // —— 默认积分配额
      const quotaIn = h('input',{class:'input',type:'number',min:'0',value:String(d.defaultQuota),placeholder:'如 5000',style:{maxWidth:'200px'}});
      const quotaWrap = h('div',{class:'field',style:{display:d.defaultUnlimited?'none':''}},[h('label',{},['默认配额上限（积分）']), quotaIn]);
      const unlimToggle = ctx.Toggle(d.defaultUnlimited, v=>{ d.defaultUnlimited=v; quotaWrap.style.display=v?'none':''; });

      // —— 可分配模型范围
      const _vis = visModels(r);
      const grid = h('div',{class:'thumb-grid'}, _vis.length? _vis.map(m=>{
        const card = h('div',{class:'model-card'+(d.allowModels.has(m.modelKey)?' sel':''),onclick:()=>{
          if(d.allowModels.has(m.modelKey)) d.allowModels.delete(m.modelKey); else d.allowModels.add(m.modelKey);
          card.classList.toggle('sel');
        }},[ h('div',{class:'model-name'},[m.name]), h('div',{class:'model-check'},['✓']) ]);
        return card;
      }) : [h('span',{class:'muted'},['该企业暂无「已上架」模型（请先在「企业积分配置」为其上架）'])]);
      const selAllBtn = h('button',{class:'btn btn-sm',onclick:()=>{ _vis.forEach(m=>d.allowModels.add(m.modelKey)); grid.querySelectorAll('.model-card').forEach(el=>el.classList.add('sel')); }},['全选']);
      const selNoneBtn = h('button',{class:'btn btn-sm',onclick:()=>{ d.allowModels.clear(); grid.querySelectorAll('.model-card').forEach(el=>el.classList.remove('sel')); }},['清空']);

      // —— 子账号发放现状（只读总览）
      const subTable = ctx.DataTable({
        columns:[
          { title:'子账号', render:s=>s.name||'—' },
          { title:'备注', width:120, render:s=>h('span',{class:'small'},[s.note||'—']) },
          { title:'账号标识', render:s=>h('span',{class:'small muted'},[s.contact||'—']) },
          { title:'积分配额', width:120, align:'center', render:s=> s.unlimited? Tag('无限配额','green') : h('span',{class:'small'},[String(s.quota)+' 积分']) },
          { title:'模型权限', width:120, align:'center', render:s=> s.restrict? Tag('限 '+s.models.length+' 个','blue') : Tag('全部模型','gray') },
        ],
        rows:c.subs,
        empty:'该企业暂无子账号（成员明细需 orgId 查询）',
      });

      const body = h('div',{class:d.enabled?'':'tm-off'},[
        // 团队类型
        h('div',{class:'field'},[ h('label',{},['团队类型']),
          h('div',{class:'small muted mb12'},['内部团队=公司内部使用；外部团队=外部合作小团队；外部企业=对公企业客户']),
          typeSel ]),
        h('div',{class:'divider'}),
        // 总开关
        h('div',{class:'row',style:{alignItems:'center',gap:'12px'}},[
          h('div',{class:'flex1'},[ h('div',{class:'bold'},['启用团队模式']),
            h('div',{class:'small muted'},['关闭后该企业主账号将看不到「企业团队」发放入口']) ]),
          enToggle,
        ]),
        h('div',{class:'divider'}),
        // 子账号上限
        h('div',{class:'field'},[ h('label',{},['子账号数量上限']), capIn ]),
        h('div',{class:'divider'}),
        // 默认配额
        h('div',{class:'row',style:{alignItems:'center',gap:'12px'}},[
          h('div',{class:'flex1'},[ h('div',{class:'bold'},['默认无限配额（新发放时默认值）']),
            h('div',{class:'small muted'},['主账号给新成员发放时的默认起始配额，可在前端逐人调整']) ]),
          unlimToggle,
        ]),
        quotaWrap,
        h('div',{class:'divider'}),
        // 可分配模型范围
        h('div',{class:'field'},[
          h('div',{class:'row',style:{alignItems:'center'}},[
            h('label',{class:'flex1'},['可分配的模型范围']),
            selAllBtn, h('span',{style:{width:'8px'}}), selNoneBtn,
          ]),
          h('div',{class:'small muted mb12'},['候选来自该企业「已上架」模型（同源自「企业积分配置」上架集合，PRD §7.1）；未上架模型不在此出现，需先去企业积分配置上架。勾选项才能被主账号授予子账号。']),
          grid,
        ]),
        h('div',{class:'divider'}),
        // 子账号现状
        h('div',{class:'field'},[ h('label',{},['子账号发放现状（只读）']), subTable ]),
      ]);

      const m = ctx.modal({ size:'lg', title:'团队模式配置 — '+(r.name||''),
        body:[body],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const cap = parseInt(capIn.value,10);
            if(isNaN(cap)||cap<0){ ctx.toast('error','子账号上限必须为非负整数'); return; }
            if(cap < c.subs.length){ ctx.toast('warning','上限不能小于当前子账号数（'+c.subs.length+'）'); return; }
            if(!d.defaultUnlimited){
              const q = parseInt(quotaIn.value,10);
              if(isNaN(q)||q<0){ ctx.toast('error','默认配额上限必须为非负整数'); return; }
              d.defaultQuota=q;
            }
            if(d.enabled && d.allowModels.size===0 && visModels(r).length){ ctx.toast('warning','开启团队模式时至少保留 1 个可分配模型'); return; }
            d.subCap=cap;
            // 提交草稿：类型回写 org，其余回写 cfg
            r.type = d.type;
            Object.assign(c, { enabled:d.enabled, subCap:d.subCap,
              defaultUnlimited:d.defaultUnlimited, defaultQuota:d.defaultQuota, allowModels:d.allowModels });
            ctx.toast('success','团队模式配置已保存'); m.close(); render();
          }},['保存配置']),
        ],
      });
    }

    render();
  }
};
