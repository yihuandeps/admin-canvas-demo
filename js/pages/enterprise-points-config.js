// 企业积分配置 — 商业化管理
// 【结构】保留两 Tab：① 按企业配置（企业级上架/下架 + 模版绑定）② 积分消耗模版库（新建/编辑模版）。
// 【2026-07-01 迭代】把「模型配置」段（模版编辑 & 企业模型配置两处）统一换成「积分配置」结构：
//   · 顶部 5 分栏：视频 / 图片 / 文本 / 图片超清 / 视频超清
//   · 列表：模型 | 档位配置 | 基础积分 | 操作（编辑）
//   · 编辑弹窗「编辑积分配置」：模型(只读)/模板Key(只读)/基础积分*/清晰度积分配置*(分辨率+无声有声+积分+删除)/+添加配置
//   每模型积分值改为富结构 { base, clarity:[{res,sound,points}] }。模型目录 = templates(21) + 上清 Mock(4)。
// 【2026-07-02 迭代】① 按企业配置去掉「模型配置」入口（企业积分统一走「模版绑定」一键导入，不再逐企业进模型页手改）；
//   ② 模版库「删除」加关联判断：绑定企业数 >0 拦截不可删（删除会影响企业的积分消耗），=0 才允许确认删除。
// 【2026-07-02 迭代2】③ 模版「删除」按钮替换为「启用/停用」：不再提供删除；关联判断沿用到「停用」（绑定 >0 不可停、=0 确认后停），
//   停用的模版不进「模版绑定」下拉、可随时重新启用（新建/复制默认启用）。
// 【2026-07-06 迭代】① 删除页头说明文案；② 删除右上角「演示 · 消耗参数调整权限」开关（只读演示机制一并移除，页面恒为可编辑）；
//   ③ 删除「按企业配置」操作列的企业级上架/下架按钮（含确认弹窗；「已上线模型」计数列保留，仅展示）；
//   ④ 删除模版库列表上方的紫色说明面板（「一套模版 = 一组各模型积分消耗值…」）。
// 【2026-07-06 迭代2】编辑积分配置弹窗：仅 Seedance 2.0 两模型（video_seedance_20_pro / video_seedance_20_fast）
//   的档位第二维由「无声/有声」改为「有视频/无视频」——值槽复用存储（silent 槽=有视频、sound 槽=无视频），
//   既有数据无需迁移，默认选中仍是第一项（有视频）；其余模型维持「无声/有声」。
// 【2026-07-06 迭代3】模版库「复制」改为弹窗流程：先改模版名称再创建（默认名自动避让重名：副本/副本2/…），
//   空名与同名均拦截——复制出的模版必须与既有模版名区分。
// 【2026-07-06 迭代4】模版绑定弹窗删两段说明文字（红框标注）：顶部绿边说明面板、下拉底下「不绑定」解释句；
//   绑定/解绑逻辑与选中模版时的备注行均保留。
window.Pages['enterprise-points-config'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const TASK = { video:'视频', image:'图片', text:'文本', image_hd:'图片超清', video_hd:'视频超清' };
    const TASK_TABS = Object.keys(TASK).map(k => ({ label:TASK[k], value:k }));
    const RES_OPTS   = ['720p','1080p','2K','4K'];
    const SOUND_OPTS = [{ label:'无声', value:'silent' }, { label:'有声', value:'sound' }];
    // Seedance 2.0 两模型该维度按「有视频/无视频」展示；值槽复用 silent/sound（silent=有视频），其余模型不变
    const VIDEO_DIM_KEYS = { video_seedance_20_pro:1, video_seedance_20_fast:1 };
    const VIDEO_OPTS = [{ label:'有视频', value:'silent' }, { label:'无视频', value:'sound' }];
    const soundOptsFor = m => VIDEO_DIM_KEYS[m.modelKey] ? VIDEO_OPTS : SOUND_OPTS;

    const orgs = ((ctx.data.organizations && ctx.data.organizations.list) || []).map(o=>({
      id:o.id, name:o.name, email:o.email, remark:o.remark||'',
      userCount:o.userCount||0, modelConfigCount:o.modelConfigCount||0, perks:o.perks,
    }));

    // ── 模型目录：templates(视频/图片/文本) + 上清 Mock(图片超清/视频超清)，含档位 tiers ──
    function parseSchema(raw){ if(!raw) return {}; try{ return JSON.parse(raw); }catch{ return {}; } }
    function resVals(t){ const f=parseSchema(t.optionsSchema).resolution; return f&&Array.isArray(f.values)?f.values.slice():[]; }
    const HD_MOCK = [
      { modelKey:'upscale_video_topaz',      name:'Topaz Video 超清',   taskType:'video_hd', tiers:['1080p','2K','4K'] },
      { modelKey:'upscale_video_topaz_fast', name:'Topaz Video 提速版', taskType:'video_hd', tiers:['1080p','2K'] },
      { modelKey:'upscale_image_topaz',      name:'Topaz Photo 超清',   taskType:'image_hd', tiers:['2K','4K'] },
      { modelKey:'upscale_image_gigapixel',  name:'Gigapixel 放大',     taskType:'image_hd', tiers:['2K','4K'] },
    ];
    const MODELS = (function(){
      const tpls = ((ctx.data.templates && ctx.data.templates.templates) || []);
      const fromTpl = tpls.filter(t=>t.taskType && t.displayName).slice()
        .sort((a,b)=>(b.sortOrder||0)-(a.sortOrder||0))
        .map(t=>({ modelKey:t.templateKey||t.id, name:t.displayName||t.templateKey||'—', taskType:t.taskType, tiers:resVals(t) }));
      return fromTpl.concat(HD_MOCK);
    })();
    const modelByKey = {}; MODELS.forEach(m=>modelByKey[m.modelKey]=m);
    window.__MODEL_CATALOG = window.__MODEL_CATALOG || MODELS.map(m=>({ modelKey:m.modelKey, name:m.name, taskType:m.taskType, cfgPoints:null }));

    // ── 富积分结构 { base:Number, clarity:[{res,sound,points}] } 工具 ──
    function defClarity(m){ const t=(m.tiers&&m.tiers.length)?m.tiers:['720p']; return t.map(r=>({ res:RES_OPTS.includes(r)?r:'720p', sound:'silent', points:0 })); }
    function cloneCredit(c){ return c ? { base:c.base, clarity:(c.clarity||[]).map(r=>({res:r.res,sound:r.sound,points:r.points})) } : null; }
    const creditBase = c => (c && c.base!=null) ? c.base : null;

    // ── 上架状态：off/online（仅用于「已上线模型」计数展示，上/下架操作已删除） ──
    const STATE = (window.__ENT_MODEL_STATE = window.__ENT_MODEL_STATE || {});
    function stateFor(orgId){
      if(!STATE[orgId]){
        const org = orgs.find(o=>o.id===orgId) || {};
        const opened = new Set((((org.perks)||{}).models || []).map(m=>m.name));
        const s = {};
        MODELS.forEach(m=>{ s[m.modelKey] = { status: opened.has(m.name)?'online':'off', override: null, enabled: true }; });
        STATE[orgId] = s;
      }
      return STATE[orgId];
    }
    function onlineCount(orgId){ const s=stateFor(orgId); return Object.values(s).filter(x=>x.status==='online').length; }
    function configuredCount(orgId){ const s=stateFor(orgId); return Object.values(s).filter(x=>x.override!=null).length; }

    // ── 模版库 / 企业↔模版 1:1 绑定 / 审计 / 权限 ──
    function seedTemplates(){
      const covered = MODELS.slice(0, Math.max(1, MODELS.length-2)); // 末 2 个不收录 → 演示「保持原值」
      const base = m => m.taskType==='video'?80 : (m.taskType==='image'?15 : (m.taskType==='video_hd'?120 : (m.taskType==='image_hd'?20 : 5)));
      function mkCredit(m, mult){
        const b = Math.round(base(m)*mult);
        return { base:b, clarity:defClarity(m).map((r,i)=>({ res:r.res, sound:r.sound, points: Math.max(1, Math.round(b*(0.5+i*0.4))) })) };
      }
      function mk(name, remark, mult, conc){
        const credits={}; covered.forEach(m=>{ credits[m.modelKey] = mkCredit(m, mult); });
        return { id:'tpl_'+Math.random().toString(36).slice(2,8), name, remark, credits, videoConcurrency:conc };
      }
      return [
        mk('标准利润档','该套配置 ≈ 50% 利润（人工估算，仅备注、不参与计算）', 1.0, 5),
        mk('高利润档','面向议价能力较弱客户，≈ 65% 利润（仅备注，不驱动定价）', 1.4, 8),
        mk('低利润档','大客户 / 战略合作，≈ 35% 利润（仅备注）', 0.7, 3),
      ];
    }
    const TPLS  = (window.__CREDIT_TEMPLATES = (window.__CREDIT_TEMPLATES && window.__CREDIT_TEMPLATES.length) ? window.__CREDIT_TEMPLATES : seedTemplates());
    const BIND  = (window.__ORG_TPL_BINDING = window.__ORG_TPL_BINDING || {});
    const AUDIT = (window.__CREDIT_AUDIT = window.__CREDIT_AUDIT || []);
    function audit(scope, summary, source){ AUDIT.unshift({ t:Date.now(), who:'管理员 admin', scope, summary, source }); }
    const tplById = id => TPLS.find(t=>t.id===id) || null;
    const tplName = id => { const t=tplById(id); return t?t.name:'—'; };
    const coveredKeys = t => Object.keys(t.credits).filter(k=>t.credits[k]!=null);
    const boundOrgCount = tplId => Object.values(BIND).filter(x=>x===tplId).length;
    const tplEnabled = t => t.enabled !== false;          // 模版级启用状态：停用后不可被绑定，可随时重新启用
    const DEF_CONC = 5;                                   // 视频并发默认值
    const concOf = t => (t && t.videoConcurrency!=null) ? t.videoConcurrency : DEF_CONC;

    // ── 视图状态 ──
    let tab='orgs';                 // orgs | tpls
    let view='list';                // list | tplEdit
    let curTpl=null, curDraft=null, taskType='video';
    const root2=h('div'); root.appendChild(root2);
    function go(){ render(); }
    function render(){
      root2.innerHTML='';
      if(view==='tplEdit')   return renderTplEdit();
      renderTop();
      if(tab==='orgs')  renderOrgList();
      else renderTplList();
    }

    function renderTop(){
      root2.appendChild(ctx.PageHeader({
        breadcrumb:['企业管理','企业积分配置'], title:'企业积分配置',
      }));
      const seg = ctx.Segmented([
        { label:'按企业配置', value:'orgs' },
        { label:'积分消耗模版库', value:'tpls' },
      ], tab, v=>{ tab=v; go(); });
      root2.appendChild(h('div',{class:'row mb12',style:{alignItems:'center'}},[ seg ]));
    }

    /* ============ 编辑积分配置弹窗（对齐线上「积分配置」编辑，模版编辑用） ============ */
    // model：目录项；current：富结构或 null；onSave({base,clarity})
    function openCreditModal(model, current, onSave){
      const draft = (current && current.clarity && current.clarity.length)
        ? current.clarity.map(r=>({ res:r.res, sound:r.sound, points:r.points }))
        : defClarity(model);
      const ro = v => { const i=h('input',{class:'input', value:v}); i.disabled=true; return i; };
      const baseIn = h('input',{class:'input', type:'number', min:'0', value:String(current && current.base!=null ? current.base : 0) });

      const rowsWrap = h('div');
      function renderRows(){
        rowsWrap.innerHTML='';
        if(!draft.length) rowsWrap.appendChild(h('div',{class:'small muted',style:{padding:'6px 0'}},['暂无档位，点「+ 添加配置」新增一行']));
        draft.forEach((d,idx)=>{
          const pts = h('input',{class:'input', type:'number', min:'0', value:String(d.points), style:{width:'160px'} });
          pts.oninput = () => { d.points = pts.value; };
          rowsWrap.appendChild(h('div',{class:'row gap10', style:{alignItems:'center', marginBottom:'10px', flexWrap:'wrap'} },[
            ctx.Segmented(RES_OPTS.map(r=>({label:r,value:r})), d.res, v=>{ d.res=v; renderRows(); }),
            ctx.Segmented(soundOptsFor(model), d.sound, v=>{ d.sound=v; renderRows(); }),
            pts,
            h('button',{class:'btn btn-sm btn-danger', title:'删除', onclick:()=>{ draft.splice(idx,1); renderRows(); }, html:'🗑' }),
          ]));
        });
      }
      renderRows();

      const m2 = ctx.modal({
        title:'编辑积分配置', size:'lg',
        body:[
          h('div',{class:'field'},[h('label',{},['模型']), ro(model.name)]),
          h('div',{class:'field'},[h('label',{},['模板 Key']), ro(model.modelKey)]),
          h('div',{class:'field'},[h('label',{},['基础积分 *']), baseIn]),
          h('div',{class:'field'},[
            h('label',{},['清晰度积分配置 *']),
            rowsWrap,
            h('button',{class:'btn btn-sm', style:{marginTop:'4px'}, onclick:()=>{ draft.push({ res:'720p', sound:'silent', points:0 }); renderRows(); }},['+ 添加配置']),
          ]),
        ],
        footer:[
          h('button',{class:'btn', onclick:()=>m2.close()},['取消']),
          h('button',{class:'btn btn-primary', onclick:()=>{
            const base = Number(baseIn.value);
            if(!(base>=0)){ ctx.toast('warning','基础积分需 ≥ 0'); return; }
            for(const d of draft){ const n=Number(d.points); if(d.points==='' || !(n>=0)){ ctx.toast('warning','清晰度积分需为 ≥ 0 的数值'); return; } }
            onSave({ base, clarity: draft.map(d=>({ res:d.res, sound:d.sound, points:Number(d.points) })) });
            ctx.toast('success','保存成功'); m2.close(); go();
          }},['确定']),
        ],
      });
    }

    // 5 分栏筛选（模版编辑用）
    function taskTabs(){
      return ctx.FilterBar([ ctx.Segmented(TASK_TABS, taskType, v=>{ taskType=v; go(); }) ]);
    }
    function tierText(m){ return (m.tiers && m.tiers.length) ? h('span',{class:'small'},[m.tiers.join('、')]) : '—'; }

    /* ============ Tab 1 · 按企业配置 ============ */
    function renderOrgList(){
      root2.appendChild(ctx.DataTable({
        columns:[
          { title:'企业名称', render:r=>r.name||'—' },
          // 【删列 2026-07-07】按红框删除「企业主账号」列；邮箱仅从列表隐藏，数据保留
          { title:'已绑模版', width:150, align:'center', render:r=>{ const t=tplById(BIND[r.id]); return t?Tag(t.name,'purple'):Tag('未绑定','gray'); } },
          { title:'已配置积分', width:120, align:'center', render:r=>{ const n=configuredCount(r.id); return Tag(n+' / '+MODELS.length, n?'amber':'gray'); } },
          { title:'已上线模型', width:120, align:'center', render:r=>{ const n=onlineCount(r.id); return Tag(n+' / '+MODELS.length, n?'green':'gray'); } },
          { title:'操作', width:120, align:'center', render:r=>h('button',{class:'btn btn-sm btn-primary',onclick:()=>openBindModal(r)},['模版绑定']) },
        ],
        rows:orgs, empty:'暂无企业数据',
      }));
    }

    // ── 模版绑定 ──
    function openBindModal(org){
      const usable = TPLS.filter(t=>tplEnabled(t) && coveredKeys(t).length>0);
      if(!usable.length){
        const em=ctx.modal({ title:'模版绑定 — '+(org.name||''),
          body:[ h('div',{class:'small muted',style:{lineHeight:'1.9'}},['暂无「已配置好的」积分消耗模版。请先到 ',h('b',{},['积分消耗模版库']),' 新建并为各模型配置积分，再回来绑定。']) ],
          footer:[
            h('button',{class:'btn',onclick:()=>em.close()},['知道了']),
            h('button',{class:'btn btn-primary',onclick:()=>{ em.close(); view='list'; tab='tpls'; go(); }},['去模版库']),
          ]});
        return;
      }
      const sel=h('select',{class:'select',style:{width:'100%'}});
      sel.appendChild(h('option',{value:''},['—— 不绑定（解除关联）——']));
      usable.forEach(t=> sel.appendChild(h('option',{value:t.id},[t.name+'（收录 '+coveredKeys(t).length+' / '+MODELS.length+' 模型）'])));
      sel.value = (BIND[org.id] && tplById(BIND[org.id]) && coveredKeys(tplById(BIND[org.id])).length) ? BIND[org.id] : '';
      const info=h('div',{class:'small muted',style:{marginTop:'8px',lineHeight:'1.8'}});
      // 【2026-07-06 迭代4】删除「不绑定」解释文案（红框标注）；选中模版时的备注行保留
      function refreshInfo(){
        const t=tplById(sel.value); info.innerHTML='';
        if(t) info.appendChild(h('span',{},['备注（利润率·仅参考）：'+(t.remark||'（无）')]));
      }
      sel.onchange=refreshInfo; refreshInfo();
      const bm=ctx.modal({ size:'lg', title:'模版绑定 — '+(org.name||''),
        body:[
          h('label',{class:'field'},[h('label',{},['选择已配置模版']), sel, info]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>bm.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const id=sel.value;
            if(!id){
              if(BIND[org.id]){ const old=tplName(BIND[org.id]); delete BIND[org.id]; audit('企业：'+org.name,'解除模版绑定（原「'+old+'」，已填充积分保留）','模版导入'); ctx.toast('info','已解除模版绑定'); }
              bm.close(); go(); return;
            }
            const t=tplById(id); if(!t){ ctx.toast('error','请选择模版'); return; }
            const existed=configuredCount(org.id);
            const doIt=()=>{ bm.close(); applyImport(org, t); };
            if(existed>0){
              const cm=ctx.modal({ title:'确认覆盖现有积分配置',
                body:[ h('div',{class:'small',style:{lineHeight:'1.9'}},[
                  '该企业当前已配置 ',h('b',{style:{color:'#f59e0b'}},[String(existed)+' 个模型']),' 的积分。',
                  '绑定「',h('b',{},[t.name]),'」将 ',h('b',{style:{color:'#f87171'}},['覆盖命中模型的积分']),'；模版未收录的模型保持原值。是否继续？',
                ]) ],
                footer:[
                  h('button',{class:'btn',onclick:()=>cm.close()},['取消']),
                  h('button',{class:'btn btn-danger',onclick:()=>{ cm.close(); doIt(); }},['覆盖并绑定']),
                ]});
            } else doIt();
          }},['绑定']),
        ]});
    }
    function applyImport(org, t){
      const s=stateFor(org.id); let changed=0;
      MODELS.forEach(m=>{ const v=t.credits[m.modelKey]; if(v!=null){ s[m.modelKey].override=cloneCredit(v); changed++; } });
      BIND[org.id]=t.id;
      audit('企业：'+org.name, '绑定模版「'+t.name+'」，填充 '+changed+' 个模型积分（未收录模型保持原值，不触发上架）', '模版导入');
      ctx.toast('success','已绑定「'+t.name+'」：填充 '+changed+' 个模型积分');
      go();
    }

    /* ============ Tab 2 · 积分消耗模版库 ============ */
    function renderTplList(){
      root2.appendChild(h('div',{class:'row mb12'},[
        h('span',{class:'flex1'}),
        h('button',{class:'btn btn-primary btn-sm',onclick:()=>openTplEdit(null)},['+ 新建模版']),
      ]));
      root2.appendChild(ctx.DataTable({
        columns:[
          { title:'模版名称', render:t=>h('div',{style: tplEnabled(t)?null:{opacity:'0.55'}},[
              h('div',{},[h('b',{},[t.name]), tplEnabled(t)?null:h('span',{style:{marginLeft:'8px'}},[Tag('已停用','gray')])]),
              h('div',{class:'mono small muted'},[t.id]),
            ]) },
          { title:'备注（利润率·仅参考）', render:t=>h('span',{class:'small muted'},[t.remark||'—']) },
          { title:'收录模型', width:120, align:'center', render:t=>Tag(coveredKeys(t).length+' / '+MODELS.length,'blue') },
          { title:'视频并发', width:100, align:'center', render:t=>Tag(String(concOf(t)),'amber') },
          { title:'绑定企业', width:100, align:'center', render:t=>{ const n=boundOrgCount(t.id); return Tag(String(n), n?'purple':'gray'); } },
          { title:'操作', width:230, align:'center', render:t=>{
              return h('div',{class:'row gap6',style:{justifyContent:'center'}},[
                h('button',{class:'btn btn-sm',onclick:()=>openTplEdit(t)},['编辑']),
                h('button',{class:'btn btn-sm',onclick:()=>copyTpl(t)},['复制']),
                tplEnabled(t)
                  ? h('button',{class:'btn btn-sm btn-danger',onclick:()=>toggleTpl(t)},['停用'])
                  : h('button',{class:'btn btn-sm btn-primary',onclick:()=>toggleTpl(t)},['启用']),
              ]);
            } },
        ],
        rows:TPLS, empty:'暂无模版，点「新建模版」创建',
      }));
    }
    // 【2026-07-06 迭代】复制不再直接落库：先弹窗改模版名称（用于与源模版区分）再创建。
    //   默认名自动避让重名（副本 / 副本2 / 副本3…）；空名与同名均拦截。
    function copyTpl(t){
      const names=()=>TPLS.map(x=>(x.name||'').trim());
      let def=t.name+' 副本', i=2;
      while(names().includes(def)) def=t.name+' 副本'+(i++);
      const nameIn=h('input',{class:'input',value:def,placeholder:'请输入新模版名称'});
      const m=ctx.modal({ title:'复制模版 — '+t.name,
        body:[
          h('div',{class:'small muted',style:{lineHeight:'1.8',marginBottom:'10px'}},[
            '将完整复制「',h('b',{},[t.name]),'」的收录模型积分、视频并发与备注为一个新模版（默认启用、绑定企业为 0）。请确认或修改模版名称以便区分：',
          ]),
          h('div',{class:'field'},[h('label',{},['新模版名称']), nameIn]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const name=nameIn.value.trim();
            if(!name){ ctx.toast('error','请输入模版名称'); return; }
            if(names().includes(name)){ ctx.toast('error','已存在同名模版「'+name+'」，请换一个名称以便区分'); return; }
            const credits={}; Object.keys(t.credits).forEach(k=>{ credits[k]=cloneCredit(t.credits[k]); });
            const nt={ id:'tpl_'+Math.random().toString(36).slice(2,8), name, remark:t.remark, credits, videoConcurrency:concOf(t), disabled:Object.assign({}, t.disabled||{}) };
            TPLS.push(nt); audit('模版：'+nt.name, '复制自「'+t.name+'」', '模版管理');
            m.close(); ctx.toast('success','已复制为「'+nt.name+'」'); go();
          }},['确定复制']),
        ]});
      setTimeout(()=>{ nameIn.focus(); nameIn.select(); },50);
    }
    // 启用/停用（替换原「删除」按钮，判断逻辑保持不变）：已关联企业（绑定数 >0）不可停用——停用会影响企业的积分消耗；
    // 未关联（=0）确认后停用；停用期间不进「模版绑定」下拉；「启用」即时生效恢复可绑定
    function toggleTpl(t){
      if(!tplEnabled(t)){
        t.enabled = true;
        audit('模版：'+t.name, '启用模版（恢复可被企业绑定）', '模版管理');
        ctx.toast('success','已启用模版「'+t.name+'」'); go(); return;
      }
      const bound=boundOrgCount(t.id);
      if(bound>0){
        const bm=ctx.modal({ title:'无法停用模版 — '+(t.name||''),
          body:[ h('div',{class:'small',style:{lineHeight:'1.9'}},[
            '模版「',h('b',{},[t.name]),'」当前已关联 ',h('b',{style:{color:'#f87171'}},[bound+' 个企业']),'，不支持停用——停用后会影响这些企业的积分消耗。',
            h('div',{style:{marginTop:'6px'}},['如确需停用：先到「按企业配置」把相关企业 ',h('b',{},['解除绑定或换绑其他模版']),'，待绑定企业数归 0 后再停用。']),
          ]) ],
          footer:[
            h('button',{class:'btn',onclick:()=>bm.close()},['知道了']),
            h('button',{class:'btn btn-primary',onclick:()=>{ bm.close(); view='list'; tab='orgs'; go(); }},['去按企业配置处理']),
          ]});
        return;
      }
      const cm=ctx.modal({ title:'停用模版',
        body:[ h('div',{class:'small',style:{lineHeight:'1.9'}},[
          '确定停用模版「',h('b',{},[t.name]),'」？该模版未关联任何企业，停用不影响企业积分消耗；停用期间不可被绑定到企业，可随时重新启用。',
        ]) ],
        footer:[
          h('button',{class:'btn',onclick:()=>cm.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{
            t.enabled = false;
            audit('模版：'+t.name, '停用模版（未关联企业，判断通过；停用期间不可被绑定）', '模版管理');
            cm.close(); ctx.toast('info','已停用模版「'+t.name+'」'); go();
          }},['停用']),
        ]});
    }
    function openTplEdit(t){
      curTpl=t;
      curDraft = t
        ? { name:t.name, remark:t.remark||'', videoConcurrency:concOf(t), disabled:Object.assign({}, t.disabled||{}), credits:(function(){ const c={}; Object.keys(t.credits).forEach(k=>{ c[k]=cloneCredit(t.credits[k]); }); return c; })() }
        : { name:'新模版', remark:'', videoConcurrency:DEF_CONC, disabled:{}, credits:{} };
      taskType='video'; view='tplEdit'; go();
    }

    function renderTplEdit(){
      const isNew=!curTpl;
      root2.appendChild(ctx.PageHeader({
        breadcrumb:['企业管理','企业积分配置','积分消耗模版库', isNew?'新建模版':curTpl.name],
        title:(isNew?'新建':'编辑')+'积分消耗模版',
        desc:'先填模版名称 / 备注；再按任务类型逐模型点「编辑」配置基础积分与清晰度积分（未配置 = 不收录，一键导入时该模型保持企业原值）。',
      }));
      const nameIn=h('input',{class:'input',value:curDraft.name,placeholder:'模版名称，如：标准利润档'});
      nameIn.oninput=()=>{ curDraft.name=nameIn.value; };
      const remarkIn=h('textarea',{class:'textarea',rows:'2',placeholder:'利润率说明（仅备注、不参与计算），如：≈ 50% 利润'},[curDraft.remark]);
      remarkIn.oninput=()=>{ curDraft.remark=remarkIn.value; };
      const concIn=h('input',{class:'input',type:'number',min:'1',step:'1',style:{width:'160px'},value:String(curDraft.videoConcurrency)});
      concIn.oninput=()=>{ curDraft.videoConcurrency=concIn.value; };
      root2.appendChild(h('div',{class:'panel',style:{marginBottom:'12px'}},[
        h('label',{class:'field'},[h('label',{},['模版名称']), nameIn]),
        h('label',{class:'field'},[h('label',{},['备注（利润率·仅参考，不参与计算）']), remarkIn]),
        h('label',{class:'field'},[
          h('label',{},['视频并发数']), concIn,
          h('div',{class:'small muted mt8'},['该模版下企业的视频同时生成上限（独立并发池，可个性化编辑）；导入 / 绑定该模版时随积分一并生效。']),
        ]),
      ]));

      root2.appendChild(h('div',{class:'row mb12',style:{alignItems:'center',gap:'12px'}},[
        h('button',{class:'btn back-btn',onclick:()=>{ view='list'; tab='tpls'; curTpl=null; curDraft=null; go(); }},['← 返回模版库']),
        h('span',{class:'small muted'},['当前收录 '+Object.keys(curDraft.credits).filter(k=>curDraft.credits[k]!=null).length+' / '+MODELS.length+' 模型']),
        h('span',{class:'flex1'}),
        h('button',{class:'btn btn-primary',onclick:saveTpl},['保存模版']),
      ]));
      root2.appendChild(taskTabs());

      const rows=MODELS.filter(m=>m.taskType===taskType);
      root2.appendChild(ctx.DataTable({
        columns:[
          { title:'模型', render:m=>{
              const off=!!curDraft.disabled[m.modelKey];
              return h('div',{style: off?{opacity:'0.5'}:null},[h('div',{class:'bold'},[m.name]), h('div',{class:'mono small muted'},[m.modelKey])]);
            } },
          { title:'状态', width:110, align:'center', render:m=>{
              const on=!curDraft.disabled[m.modelKey];
              return h('div',{class:'row gap6',style:{justifyContent:'center',alignItems:'center'}},[
                ctx.Toggle(on, nv=>setTplEnabled(m, nv)),
                h('span',{class:'small muted'},[on?'已启用':'已禁用']),
              ]);
            } },
          { title:'档位配置', width:220, render:m=>tierText(m) },
          { title:'基础积分', width:120, align:'center', render:m=>{
              const c=curDraft.credits[m.modelKey];
              return c==null ? Tag('未收录','gray') : h('span',{class:'mono',style:{color:'#f59e0b',fontWeight:'600'}},[String(creditBase(c))]);
            } },
          { title:'操作', width:100, align:'center', render:m=>h('button',{class:'btn btn-sm',onclick:()=>editTplCredit(m)},['编辑']) },
        ],
        rows, empty:'该任务类型暂无模型',
      }));
    }
    function editTplCredit(m){
      openCreditModal(m, curDraft.credits[m.modelKey], (val)=>{ curDraft.credits[m.modelKey]=val; });
    }
    // 启用 / 禁用某模型（开关）：直接影响使用（绑定）本模版的企业
    function setTplEnabled(m, on){
      if(on) delete curDraft.disabled[m.modelKey]; else curDraft.disabled[m.modelKey]=true;
      const bound = curTpl ? boundOrgCount(curTpl.id) : 0;
      const affect = bound ? '（保存后直接影响 '+bound+' 家已绑定企业）' : '（保存生效；暂无绑定企业）';
      ctx.toast(on?'success':'info', (on?'已启用 ':'已禁用 ')+m.name+affect);
      go();
    }
    function saveTpl(){
      const name=(curDraft.name||'').trim();
      if(!name){ ctx.toast('error','请填写模版名称'); return; }
      const conc=parseInt(curDraft.videoConcurrency,10);
      if(!(conc>=1)){ ctx.toast('error','视频并发数需为 ≥ 1 的整数'); return; }
      Object.keys(curDraft.credits).forEach(k=>{ if(curDraft.credits[k]==null) delete curDraft.credits[k]; });
      const cnt=Object.keys(curDraft.credits).length;
      const disabled=Object.assign({}, curDraft.disabled||{});
      const offCnt=Object.keys(disabled).length;
      if(curTpl){
        curTpl.name=name; curTpl.remark=curDraft.remark; curTpl.videoConcurrency=conc; curTpl.disabled=disabled;
        curTpl.credits=(function(){ const c={}; Object.keys(curDraft.credits).forEach(k=>{ c[k]=cloneCredit(curDraft.credits[k]); }); return c; })();
        audit('模版：'+name, '编辑模版（收录 '+cnt+' 模型，视频并发 '+conc+'，禁用 '+offCnt+' 模型）。微调不回写已绑企业，导入才覆盖。', '模版管理');
        ctx.toast('success','已保存模版「'+name+'」');
      } else {
        const credits={}; Object.keys(curDraft.credits).forEach(k=>{ credits[k]=cloneCredit(curDraft.credits[k]); });
        const nt={ id:'tpl_'+Math.random().toString(36).slice(2,8), name, remark:curDraft.remark, videoConcurrency:conc, disabled, credits };
        TPLS.push(nt); audit('模版：'+name, '新建模版（收录 '+cnt+' 模型，视频并发 '+conc+'，禁用 '+offCnt+' 模型）', '模版管理');
        ctx.toast('success','已创建模版「'+name+'」');
      }
      view='list'; tab='tpls'; curTpl=null; curDraft=null; go();
    }

    render();
  }
};
