// 公告管理 — 运营管理(管理表形态:多条公告 + 定时任务,设计稿,本地先行于线上)
// 规则:①状态三态:待上线(蓝,排期未到点,到点自动上线)/展示中(绿,=上线中)/已结束(灰,未在展示的其余全部——排期走完/手动下线/尚未上线,不设「已停用」);
//      ②全局同一时间仅允许一条公告处于展示中;③定时排期时间段严格不可重叠(首尾相接允许);
//      ④手动上线/下线均二次确认、立即生效(定时公告改写排期时间);⑤定时任务到点自动上线/自动下线(上线为边沿触发,手动下线后不会被反复拉起)
window.Pages['announcements'] = {
  render(root, ctx){
    const { h } = ctx;

    // 数据源:announcements_list;缺失时从抓取样例 announcements 兜底生成一条
    if(!ctx.data.announcements_list){
      const a=ctx.data.announcements||{};
      const tz=(a.translations||[]).find(t=>t.language==='zh')||{};
      const te=(a.translations||[]).find(t=>t.language==='en')||{};
      ctx.data.announcements_list=[{ id:1, titleZh:tz.title||'', titleEn:te.title||'', contentZh:tz.content||'', contentEn:te.content||'',
        isVip:!!a.isVip, isLink:!!a.isLink, linkUrl:a.linkUrl||'', publishMode:'now', startTime:'', endTime:'', enabled:!!a.enabled, updatedAt:'—' }];
    }
    const list=()=>ctx.data.announcements_list;

    // ---- 时间工具:本地时间字符串,与 datetime-local 值可直接字典序比较 ----
    const p2=n=>String(n).padStart(2,'0');
    const nowTs=()=>{ const d=new Date(); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'T'+p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds()); };
    const nowDisp=()=>nowTs().replace('T',' ');
    const norm=v=>v? (v.length===16? v+':00': v) : '';          // 补齐秒位
    const disp=v=>v? norm(v).replace('T',' ') : '';
    const INF='9999-12-31T23:59:59';

    // ---- 状态:待上线(蓝)/展示中(绿)/已结束(灰),不设「已停用」 ----
    // enabled=展示中;排期未到点且未被手动停用=待上线(到点自动上线);其余未展示的一律=已结束(排期走完/手动下线/尚未上线)
    function statusOf(r){
      if(r.enabled) return { label:'展示中', color:'green' };
      if(!r.stopped && r.publishMode==='timed' && r.startTime && nowTs()<norm(r.startTime)) return { label:'待上线', color:'blue' };
      return { label:'已结束', color:'gray' };
    }
    const enabledOthers=r=>list().filter(x=>x!==r && x.enabled);
    // 定时公告当前是否处于排期窗口内
    const inWindow=(r,n)=> !!r.startTime && norm(r.startTime)<=n && (!r.endTime || n<norm(r.endTime));
    // 统一手动/被顶替下线:定时公告若正处于窗口内,下线时间截断为当前时间(排期记录=实际展示区间,保证时间轴不重叠);记 stopped=手动停用(区别于自然已结束)
    function takeOffline(x){
      const n=nowTs();
      if(x.publishMode==='timed' && inWindow(x,n)) x.endTime=n;
      x.enabled=false; x.stopped=true; x.updatedAt=nowDisp();
    }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['运营管理','公告管理'], title:'公告管理',
      actions:[h('button',{class:'btn btn-primary',onclick:()=>openEdit(null)},['+ 新建公告'])],
    }));

    // ---- 筛选栏 ----
    let kw='', st='全部状态';
    // 表头排序:sortKey='start'(按上线时间,无上线时间的恒排最后)/'updated'(按更新时间)/null=默认序;点表头启用并切换方向,两列互斥
    let sortKey=null, sortDir='asc';
    // 搜索:输入即搜保留;「🔍 搜索」按钮与回车显式触发(与企业管理页同款并存样式)
    const doSearch=()=>{ kw=kwIn.value.trim().toLowerCase(); renderTable(); };
    const kwIn=h('input',{class:'input',placeholder:'搜索标题 / 内容',
      oninput:e=>{ kw=e.target.value.trim().toLowerCase(); renderTable(); },
      onkeydown:e=>{ if(e.key==='Enter') doSearch(); }});
    const stSel=h('select',{class:'select',onchange:e=>{ st=e.target.value; renderTable(); }},
      ['全部状态','待上线','展示中','已结束'].map(s=>h('option',{value:s},[s])));
    root.appendChild(ctx.FilterBar([kwIn, h('button',{class:'btn btn-primary',onclick:doSearch},['🔍 搜索']), stSel]));

    const tableWrap=h('div');
    root.appendChild(tableWrap);

    function filtered(){
      return list().filter(r=>{
        if(st!=='全部状态' && statusOf(r).label!==st) return false;
        if(kw){ const t=((r.titleZh||'')+' '+(r.titleEn||'')+' '+(r.contentZh||'')+' '+(r.contentEn||'')).toLowerCase(); if(!t.includes(kw)) return false; }
        return true;
      });
    }

    function renderTable(){
      tableWrap.innerHTML='';
      const rows=filtered();
      if(sortKey==='updated') rows.sort((a,b)=> sortDir==='asc'
        ? String(a.updatedAt||'').localeCompare(String(b.updatedAt||''))
        : String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
      else if(sortKey==='start') rows.sort((a,b)=>{
        const A=a.startTime?norm(a.startTime):null, B=b.startTime?norm(b.startTime):null;
        if(A===null && B===null) return 0;
        if(A===null) return 1;                               // 无上线时间(立即发布)不论方向恒排最后
        if(B===null) return -1;
        return sortDir==='asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
      const sortHead=(label,key,tip)=>h('span',{
        style:{display:'inline-flex',alignItems:'center',gap:'4px',cursor:'pointer',userSelect:'none'},
        title:tip,
        onclick:()=>{ if(sortKey===key){ sortDir = sortDir==='asc'?'desc':'asc'; } else { sortKey=key; sortDir='asc'; } renderTable(); },
      },[label, h('span',{class:sortKey===key?'':'muted'},[sortKey===key?(sortDir==='asc'?'↑':'↓'):'⇅'])]);
      tableWrap.appendChild(ctx.DataTable({
        columns:[
          { title:'ID', width:56, align:'center', render:r=>h('span',{class:'mono small'},[String(r.id)]) },
          { title:'公告标题', render:r=>h('div',{},[
              h('div',{class:'bold'},[r.titleZh||'—']),
              h('div',{class:'muted small',style:{marginTop:'2px'}},[r.titleEn||'—']),
            ]) },
          { title:'跳转目标', width:190, render:r=> r.isLink
              ? h('div',{},[ctx.Tag('自定义 URL','blue'),
                  h('div',{class:'muted small mono',style:{marginTop:'4px',maxWidth:'170px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},[r.linkUrl||'—'])])
              : ctx.Tag('会员','purple') },
          { title:'发布方式', width:96, align:'center', render:r=> r.publishMode==='timed'?'定时发布':'立即发布' },
          { title:sortHead('定时任务','start','点击按上线时间排序:由远到近 / 由近到远;无上线时间的排在最后'), width:225, render:r=>h('div',{class:'mono small'},[
              // 立即发布:上线恒显示 —;下线选了时间显示具体时间,未选显示 —
              h('div',{},['上线 '+(r.publishMode==='timed'?disp(r.startTime):'—')]),
              h('div',{class:'muted',style:{marginTop:'2px'}},['下线 '+(r.endTime?disp(r.endTime):(r.publishMode==='timed'?'长期展示':'—'))]),
            ]) },
          { title:'状态', width:88, align:'center', render:r=>{ const s=statusOf(r); return ctx.Tag(s.label,s.color); } },
          { title:sortHead('更新时间','updated','点击切换排序:时间由远到近 / 由近到远'), width:165, align:'center', render:r=>h('span',{class:'small'},[r.updatedAt||'—']) },
          { title:'操作', width:140, align:'center', render:r=>h('div',{class:'row gap6',style:{justifyContent:'center'}},[
              h('button',{class:'btn btn-sm',onclick:()=>openEdit(r)},['编辑']),
              r.enabled
                ? h('button',{class:'btn btn-sm btn-danger',onclick:()=>offline(r)},['下线'])
                : h('button',{class:'btn btn-sm',style:{color:'var(--primary)'},onclick:()=>online(r)},['上线']),
            ]) },
        ],
        rows, empty:'暂无公告',
        pager:{ page:1, pageSize:10, total:rows.length }, onPage:()=>{},
      }));
    }

    // ---- 行操作:上线/下线均二次确认、立即生效 ----
    function offline(r){
      const trunc = r.publishMode==='timed' && inWindow(r,nowTs());
      const m=ctx.modal({ title:'立即下线',
        body:[
          h('div',{},['确认立即下线「'+r.titleZh+'」?下线后站点将立即停止展示该公告。']),
          trunc? h('div',{style:{marginTop:'8px'}},['本次为立即下线:下线时间将修改为当前时间 '+nowDisp()+',该公告的排期到此截止。']) : null,
        ].filter(Boolean),
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-danger',onclick:()=>{ takeOffline(r); ctx.toast('success', trunc?'已立即下线,下线时间已改为当前时间':'已下线'); m.close(); renderTable(); }},['确认下线']),
        ]});
    }
    function online(r){
      const n=nowTs();
      const timed = r.publishMode==='timed';
      // 点「上线」= 立即上线(定时公告改写上线时间为当前,下线时间不变);下线时间已过则先拦截(否则上线即刻又被自动下线)
      if(r.endTime && norm(r.endTime)<=n){
        ctx.toast('warning','该公告的下线时间 '+disp(r.endTime)+' 已过,立即上线会立刻被自动下线;请先编辑调整下线时间'); return;
      }
      // 立即上线后的排期为[当前时间,原下线时间],仍须与其他定时公告不重叠(处于窗口内的上线公告会被截断,不计入)
      if(timed){
        const E = r.endTime? norm(r.endTime) : INF;
        const clash=list().filter(x=>x!==r && x.publishMode==='timed' && x.startTime
          && !(x.enabled && norm(x.startTime)<=n)
          && norm(x.startTime)<E && n<(x.endTime?norm(x.endTime):INF));
        if(clash.length){
          const cm=ctx.modal({ title:'排期时间冲突',
            body:[
              h('div',{},['立即上线后「'+r.titleZh+'」的排期将变为 '+nowDisp()+' ~ '+(r.endTime?disp(r.endTime):'长期展示')+',与以下公告重叠,请先调整排期错开:']),
              h('div',{class:'mono small',style:{marginTop:'8px'}}, clash.map(x=>
                h('div',{style:{marginTop:'4px'}},['「'+x.titleZh+'」 '+disp(x.startTime)+' ~ '+(x.endTime?disp(x.endTime):'长期展示')]))),
            ],
            footer:[ h('button',{class:'btn btn-primary',onclick:()=>cm.close()},['知道了']) ]});
          return;
        }
      }
      const conflicts = enabledOthers(r);
      const m=ctx.modal({ title:'立即上线',
        body:[
          h('div',{},['确认立即上线「'+r.titleZh+'」?上线后站点将立即展示该公告。']),
          timed? h('div',{style:{marginTop:'8px'}},['本次为立即上线:上线时间将修改为当前时间 '+nowDisp()+',下线时间 '+(r.endTime?disp(r.endTime):'(空=长期展示)')+' 保持不变。']) : null,
          conflicts.length? h('div',{style:{marginTop:'8px'}},['全局同一时间仅允许一条公告处于展示中,确认后将自动下线'+conflicts.map(x=>'「'+x.titleZh+'」').join('、')+'。']) : null,
        ].filter(Boolean),
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            conflicts.forEach(takeOffline);
            if(timed) r.startTime=nowTs();
            r.enabled=true; r.stopped=false; r.updatedAt=nowDisp();
            ctx.toast('success',(timed?'已立即上线,上线时间已改为当前时间':'已上线')+(conflicts.length?',其余公告已自动下线':''));
            m.close(); renderTable();
          }},['确认上线']),
        ]});
    }
    // ---- 新建 / 编辑弹窗 ----
    function openEdit(r){
      const isNew=!r;
      function field(label,node,extra){ return h('div',{class:'field flex1'},[h('label',{},[label]), node, extra||null]); }
      function radios(opts,cur,onPick){
        const wrap=h('div',{class:'row',style:{gap:'24px'}});
        opts.forEach(o=>{ const el=h('label',{class:'radio'+(o.v===cur?' checked':''),onclick:()=>{
          wrap.querySelectorAll('.radio').forEach(x=>x.classList.remove('checked'));
          el.classList.add('checked'); onPick(o.v);
        }},[h('span',{class:'radio-dot'}),o.t]); wrap.appendChild(el); });
        return wrap;
      }

      const tZh=h('input',{class:'input',placeholder:'请输入中文标题',maxlength:'30',value:r?r.titleZh:''});
      const tEn=h('input',{class:'input',placeholder:'请输入英文标题',maxlength:'30',value:r?r.titleEn:''});
      const cZh=h('textarea',{class:'textarea',placeholder:'请输入中文内容',maxlength:'200',style:{minHeight:'90px'}},[r?r.contentZh:'']);
      const cEn=h('textarea',{class:'textarea',placeholder:'请输入英文内容',maxlength:'200',style:{minHeight:'90px'}},[r?r.contentEn:'']);

      // 倒计时组件:启用后公告展示时附带活动倒计时(按下线时间倒数),随公告保存
      let countdown = r? !!r.countdown : false;
      const cdText=()=> countdown? '已启用倒计时组件' : '启用倒计时组件';
      const cdBtn=h('button',{class:'btn btn-sm'+(countdown?' btn-primary':''),onclick:()=>{
        countdown=!countdown;
        cdBtn.className='btn btn-sm'+(countdown?' btn-primary':'');
        cdBtn.textContent=cdText();
      }},[cdText()]);
      const cdField=h('div',{class:'field'},[h('div',{class:'row',style:{gap:'10px',alignItems:'center'}},[cdBtn])]);

      let target=r? (r.isLink?'link':'vip') : 'vip';
      const urlIn=h('input',{class:'input',placeholder:'请输入跳转地址',value:r?(r.linkUrl||''):''});
      const urlField=h('div',{class:'field'},[h('label',{},['跳转 URL']), urlIn,
        h('div',{class:'muted small',style:{marginTop:'4px'}},['建议以 https:// 开头的完整地址'])]);
      const targetRadios=radios([{t:'会员',v:'vip'},{t:'自定义 URL',v:'link'}],target,v=>{ target=v; urlField.style.display=v==='link'?'':'none'; });
      urlField.style.display = target==='link'?'':'none';

      let mode=r? (r.publishMode||'now') : 'now';
      const sIn=h('input',{class:'input',type:'datetime-local',step:'1',value:r?(r.startTime||''):'',style:{width:'225px'}});
      const eIn=h('input',{class:'input',type:'datetime-local',step:'1',value:(r&&r.publishMode==='timed')?(r.endTime||''):'',style:{width:'225px'}});
      const timeField=h('div',{class:'field'},[h('label',{},['定时任务(上线 / 下线时间)']),
        h('div',{class:'row',style:{gap:'10px'}},[sIn, h('span',{class:'muted'},['至']), eIn])]);
      // 立即发布专用:可选下线时间(留空=长期展示;设置后到点自动下线)
      const eNowIn=h('input',{class:'input',type:'datetime-local',step:'1',value:(r&&(r.publishMode||'now')==='now')?(r.endTime||''):'',style:{width:'225px'}});
      const nowEndField=h('div',{class:'field'},[h('label',{},['下线时间(可选)']),
        h('div',{class:'row',style:{gap:'10px'}},[eNowIn])]);
      const modeRadios=radios([{t:'立即发布',v:'now'},{t:'定时发布',v:'timed'}],mode,v=>{ mode=v; timeField.style.display=v==='timed'?'':'none'; nowEndField.style.display=v==='now'?'':'none'; });
      timeField.style.display = mode==='timed'?'':'none';
      nowEndField.style.display = mode==='now'?'':'none';

      const m=ctx.modal({ title:isNew?'新建公告':'编辑公告', size:'lg', body:[
        h('div',{class:'row gap14 wrap'},[ field('中文标题',tZh), field('英文标题',tEn) ]),
        h('div',{class:'row gap14 wrap'},[ field('中文内容',cZh), field('英文内容',cEn) ]),
        cdField,
        h('div',{class:'field'},[h('label',{},['跳转目标']), targetRadios]),
        urlField,
        h('div',{class:'field'},[h('label',{},['发布方式']), modeRadios]),
        nowEndField,
        timeField,
      ], footer:[
        h('button',{class:'btn',onclick:()=>m.close()},['取消']),
        h('button',{class:'btn btn-primary',onclick:save},[isNew?'创建':'保存']),
      ]});

      function save(){
        if(!tZh.value.trim()){ ctx.toast('warning','请输入中文标题'); return; }
        const n=nowTs();
        if(mode==='timed'){
          if(!sIn.value){ ctx.toast('warning','请选择上线时间'); return; }
          if(eIn.value && norm(eIn.value)<=norm(sIn.value)){ ctx.toast('error','下线时间需晚于上线时间'); return; }
          // 排期互斥:任意两条定时公告的时间段不允许重叠(不分状态;下线留空视为长期占用;首尾相接不算重叠)
          const S=norm(sIn.value), E=eIn.value?norm(eIn.value):INF;
          const clash=list().filter(x=>x!==r && x.publishMode==='timed' && x.startTime
            && norm(x.startTime)<E && S<(x.endTime?norm(x.endTime):INF));
          if(clash.length){
            const cm=ctx.modal({ title:'排期时间冲突',
              body:[
                h('div',{},['同一段时间内不允许存在两条定时公告。「'+tZh.value.trim()+'」的排期与以下公告重叠,请调整上线/下线时间错开:']),
                h('div',{class:'mono small',style:{marginTop:'8px'}}, clash.map(x=>
                  h('div',{style:{marginTop:'4px'}},['「'+x.titleZh+'」 '+disp(x.startTime)+' ~ '+(x.endTime?disp(x.endTime):'长期展示')]))),
              ],
              footer:[ h('button',{class:'btn btn-primary',onclick:()=>cm.close()},['知道了']) ]});
            return;
          }
        }
        // 立即发布的可选下线时间:填了必须晚于当前时间(否则保存即到点下线,无意义)
        if(mode==='now' && eNowIn.value && norm(eNowIn.value)<=n){ ctx.toast('error','下线时间需晚于当前时间'); return; }
        // 倒计时组件按下线时间倒数,必须有明确的下线时间才能启用(立即发布/定时发布均可)
        const endVal = mode==='timed' ? eIn.value : eNowIn.value;
        if(countdown && !endVal){ ctx.toast('warning','启用倒计时组件需设置下线时间'); return; }
        const data={ titleZh:tZh.value.trim(), titleEn:tEn.value.trim(), contentZh:cZh.value, contentEn:cEn.value,
          isVip:target==='vip', isLink:target==='link', linkUrl:target==='link'?urlIn.value.trim():'',
          publishMode:mode, startTime:mode==='timed'?norm(sIn.value):'', endTime:endVal?norm(endVal):'', countdown };
        // 保存后的启停:立即发布=新建即上线/编辑保持原状;定时发布=按当前时间是否在排期窗口内,窗口未到先不上线(状态显示待上线),到点自动上线
        const willEnable = mode==='timed'
          ? (norm(sIn.value)<=n && (!eIn.value || n<norm(eIn.value)))
          : (isNew ? true : r.enabled);
        const laterHint = (mode==='timed' && !willEnable && norm(sIn.value)>n) ? ',将于 '+disp(sIn.value)+' 到点自动上线' : '';
        const commit=()=>{
          if(isNew){
            const id=Math.max(0,...list().map(x=>x.id||0))+1;
            list().unshift(Object.assign({id, enabled:willEnable, stopped:false, updatedAt:nowDisp()}, data));
            ctx.toast('success','创建成功'+laterHint);
          } else {
            Object.assign(r,data); r.enabled=willEnable; r.stopped=false; r.updatedAt=nowDisp();
            ctx.toast('success','已保存'+laterHint);
          }
          m.close(); renderTable();
        };
        // 上线互斥:保存后本条若处于上线状态,其余上线中的公告须确认后自动下线
        const conflicts = willEnable ? enabledOthers(r) : [];
        if(conflicts.length){
          const names = conflicts.map(x=>'「'+x.titleZh+'」').join('、');
          const cm=ctx.modal({ title:'仅允许一条公告上线',
            body:[h('div',{},['全局同一时间仅允许一条公告处于展示中。保存后「'+data.titleZh+'」将立即展示,'+names+'将被自动下线,确认继续?'])],
            footer:[
              h('button',{class:'btn',onclick:()=>cm.close()},['取消']),
              h('button',{class:'btn btn-primary',onclick:()=>{ conflicts.forEach(takeOffline); cm.close(); commit(); }},['确认替换']),
            ]});
        } else commit();
      }
    }

    // ---- 定时任务到点自动流转:自动下线为水平触发(已过下线时间即停),自动上线为边沿触发(仅在跨过上线时刻的周期触发一次,手动下线后不会被反复拉起) ----
    let lastTick=nowTs();
    function autoFlow(){
      const n=nowTs();
      list().forEach(x=>{
        // 到点自动下线:定时公告与「立即发布+设置了下线时间」的公告都生效
        if(x.enabled && x.endTime && n>=norm(x.endTime)){
          x.enabled=false; x.stopped=false; x.updatedAt=nowDisp();      // 自然走完 → 已结束
        } else if(x.publishMode==='timed' && !x.enabled && !x.stopped && x.startTime && lastTick<norm(x.startTime) && norm(x.startTime)<=n && (!x.endTime || n<norm(x.endTime))){
          enabledOthers(x).forEach(takeOffline);
          x.enabled=true; x.updatedAt=nowDisp();
        }
      });
      lastTick=n;
    }

    autoFlow(); renderTable();
    const timer=setInterval(()=>{
      if(!document.body.contains(tableWrap)){ clearInterval(timer); return; }
      autoFlow(); renderTable();
    },30000);
  }
};
