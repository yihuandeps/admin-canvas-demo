// 风控配置 — 运营管理
window.Pages['risk-settings'] = {
  render(root, ctx){
    const { h } = ctx;

    // 接口 NOT_FOUND → 用源站默认值（node_32）作为内存配置
    const cfg = (ctx.data.risk_settings && ctx.data.risk_settings.data) || {};
    const engine = Object.assign({
      risk_enforce:false,
      score_thresholds:{ ban:80, deny:50, pending:30 },
      weights:{ blacklist_hit:100, same_ip_hourly_5:40, same_device_3:50, no_mx:30 },
    }, cfg.engine || {});
    const rate = Object.assign({
      register_ip_hourly:20, register_ip_daily:100, register_device_daily:10, send_code_ip_hourly:10,
    }, cfg.rateLimit || {});
    const disposable = { domains: (cfg.disposable && cfg.disposable.domains) || ['tempmail.com','guerrillamail.com','10minutemail.com'] };
    const allowed = { enabled:(cfg.allowed && cfg.allowed.enabled) || false, domains:(cfg.allowed && cfg.allowed.domains) || [] };

    const TABS = [
      { key:'engine', label:'风控引擎' },
      { key:'rateLimit', label:'限流配置' },
      { key:'disposable', label:'一次性邮箱黑名单' },
      { key:'allowed', label:'邮箱域名白名单' },
    ];
    let tab = 'engine';

    root.appendChild(ctx.PageHeader({
      breadcrumb:['风控','风控配置'], title:'风控配置',
      desc:'管理风控引擎参数、限流规则和邮箱域名黑白名单',
    }));
    const container = h('div');
    root.appendChild(container);

    // ——— 表单基元 ———
    function section(title, hint, children){
      return h('div',{class:'panel card-pad mb18'},[
        h('h3',{class:'bold mb12'},[title]),
        hint? h('p',{class:'small muted mb12'},[hint]) : null,
        ...children,
      ]);
    }
    function numField(label, getv, setv, hint, min){
      const inp = h('input',{class:'input',type:'number',value:String(getv()),style:{maxWidth:'160px'}});
      if(min!=null) inp.min = String(min);
      inp.oninput = ()=>{ const n = parseInt(inp.value,10); setv(isNaN(n)?0:n); };
      return h('div',{class:'field',style:{marginBottom:'14px'}},[
        h('label',{},[label]), inp, hint? h('span',{class:'small muted'},[hint]) : null,
      ]);
    }

    function renderEngine(){
      const frag = [];
      // 执行模式
      const tg = ctx.Toggle(engine.risk_enforce, v=>{ engine.risk_enforce=v; });
      frag.push(section('执行模式', null, [
        h('div',{class:'row gap10',style:{alignItems:'center',marginBottom:'10px'}},[tg, h('span',{},['风控强制执行'])]),
        h('p',{class:'small muted'},['开启后，风控评估结果将实际执行（拒绝注册/封禁账号）。关闭时为「观测模式」，所有请求正常放行，但仍记录风控事件和评分，可在「风控事件」页面查看。建议先观测一段时间确认阈值合理后再开启。']),
      ]));
      // 评分阈值
      frag.push(section('评分阈值', '风控引擎会为每个注册/登录请求计算风险评分(0~∞)，评分达到以下阈值时触发对应决策。必须满足 封禁 > 拒绝 > 可疑，否则保存失败。', [
        numField('封禁', ()=>engine.score_thresholds.ban, v=>engine.score_thresholds.ban=v, '评分 ≥ 此值 → 拒绝请求，当前实现与「拒绝」效果相同（均为拒绝注册，不封号/IP/设备）', 1),
        numField('拒绝', ()=>engine.score_thresholds.deny, v=>engine.score_thresholds.deny=v, '评分 ≥ 此值 → 拒绝本次请求，不封号/IP/设备', 1),
        numField('可疑', ()=>engine.score_thresholds.pending, v=>engine.score_thresholds.pending=v, '评分 ≥ 此值 → 标记为可疑，记录到风控事件便于后续排查', 1),
      ]));
      // 信号权重
      frag.push(section('信号权重', '各风控信号命中后增加的风险分值，多个信号可叠加。例如「黑名单命中 100」+「无 MX 记录 30」= 总分 130，超过封禁阈值则触发封禁。设为 0 表示禁用该信号。', [
        numField('黑名单命中', ()=>engine.weights.blacklist_hit, v=>engine.weights.blacklist_hit=v, 'IP / 设备 / 邮箱域名命中黑名单时的加分', 0),
        numField('同 IP 每小时 ≥5 次', ()=>engine.weights.same_ip_hourly_5, v=>engine.weights.same_ip_hourly_5=v, '同一 IP 在 1 小时内发起 ≥5 次同场景请求', 0),
        numField('同设备每日 ≥3 次', ()=>engine.weights.same_device_3, v=>engine.weights.same_device_3=v, '同一设备指纹在 24 小时内发起 ≥3 次同场景请求', 0),
        numField('无 MX 记录', ()=>engine.weights.no_mx, v=>engine.weights.no_mx=v, '邮箱域名无有效 MX DNS 记录（疑似一次性邮箱）', 0),
      ]));
      return frag;
    }

    function renderRate(){
      return [
        section('注册限流', '限制单个 IP 或设备在时间窗口内的注册次数，超出后请求会被直接拒绝。用于防止批量注册攻击。', [
          numField('单 IP 每小时注册上限', ()=>rate.register_ip_hourly, v=>rate.register_ip_hourly=v, '同一 IP 地址在 1 小时滑动窗口内最多注册次数', 1),
          numField('单 IP 每日注册上限', ()=>rate.register_ip_daily, v=>rate.register_ip_daily=v, '同一 IP 地址在 24 小时滑动窗口内最多注册次数', 1),
          numField('单设备每日注册上限', ()=>rate.register_device_daily, v=>rate.register_device_daily=v, '同一设备指纹在 24 小时内最多注册次数', 1),
        ]),
        section('验证码限流', '限制验证码发送频率，防止验证码接口被滥用（短信/邮件轰炸）。', [
          numField('单 IP 每小时发码上限', ()=>rate.send_code_ip_hourly, v=>rate.send_code_ip_hourly=v, '同一 IP 地址在 1 小时内最多发送验证码次数', 1),
        ]),
      ];
    }

    // 域名列表（黑/白名单共用）
    function domainTable(store, opts){
      const wrap = h('div');
      let search = '';
      function add(val){
        const n = (val||'').trim().toLowerCase();
        if(!n) return;
        if(store.domains.includes(n)){ ctx.toast('warning', n+' 已存在'); return; }
        store.domains.push(n); search=''; draw();
      }
      function remove(d){ const i=store.domains.indexOf(d); if(i>=0){ store.domains.splice(i,1); draw(); } }
      function draw(){
        wrap.innerHTML='';
        const inputRow = h('div',{class:'row gap10 mb12'},[]);
        const domInput = h('input',{class:'input',placeholder:opts.placeholder,style:{minWidth:'280px'}});
        domInput.onkeydown = e=>{ if(e.key==='Enter'){ add(domInput.value); } };
        inputRow.appendChild(domInput);
        inputRow.appendChild(h('button',{class:'btn',onclick:()=>add(domInput.value)},['＋ 添加']));
        wrap.appendChild(inputRow);

        const filtered = search ? store.domains.filter(d=>d.includes(search.trim().toLowerCase())) : store.domains;
        const header = h('div',{class:'row mb12',style:{alignItems:'center'}},[
          h('span',{class:'small muted'},[`共 ${store.domains.length} 个域名${search?`，匹配 ${filtered.length} 个`:''}`]),
          h('div',{class:'flex1'}),
        ]);
        const searchInput = h('input',{class:'input',placeholder:'搜索域名…',value:search,style:{maxWidth:'200px'}});
        searchInput.oninput = ()=>{ search=searchInput.value; draw(); searchInput.focus(); };
        header.appendChild(searchInput);
        wrap.appendChild(header);

        wrap.appendChild(ctx.DataTable({
          columns:[
            { title:'#', width:60, align:'center', render:r=>String(filtered.indexOf(r)+1) },
            { title:'域名', render:r=>h('span',{class:'mono small'},[r]) },
            { title:'操作', width:100, align:'center', render:r=>h('button',{class:'btn btn-sm btn-danger',onclick:()=>remove(r)},['删除']) },
          ],
          rows:filtered,
          empty: search?'无匹配域名':'暂无域名，请在上方添加',
        }));
      }
      draw();
      return wrap;
    }

    function renderDisposable(){
      return [ section('一次性邮箱域名黑名单', '使用这些域名的邮箱将无法注册，如 tempmail.com、guerrillamail.com',
        [ domainTable(disposable, { placeholder:'输入域名，如 tempmail.com，回车添加' }) ]) ];
    }
    function renderAllowed(){
      const tg = ctx.Toggle(allowed.enabled, v=>{ allowed.enabled=v; });
      return [ section('邮箱域名白名单', '开启后，仅白名单内的邮箱域名可以注册', [
        h('div',{class:'row gap10 mb12',style:{alignItems:'center'}},[tg, h('span',{},['启用白名单'])]),
        domainTable(allowed, { placeholder:'输入域名，如 gmail.com，回车添加' }),
      ]) ];
    }

    function save(){
      if(tab==='engine'){
        const t = engine.score_thresholds;
        if(t.ban<=t.deny || t.deny<=t.pending){ ctx.toast('error','阈值顺序必须为 Ban > Deny > 可疑'); return; }
        ctx.toast('success','风控引擎配置已保存');
      } else if(tab==='rateLimit'){ ctx.toast('success','限流配置已保存'); }
      else if(tab==='disposable'){ ctx.toast('success','一次性邮箱域名黑名单已保存'); }
      else { ctx.toast('success','邮箱域名白名单已保存'); }
    }

    function render(){
      container.innerHTML='';

      // Tab 栏
      const tabBar = h('div',{class:'tabs mb18'}, TABS.map(t=>
        h('button',{class: tab===t.key?'active':'', onclick:()=>{ tab=t.key; render(); }},[t.label])
      ));
      container.appendChild(tabBar);

      // 表单体
      const body = h('div');
      let parts = [];
      if(tab==='engine') parts = renderEngine();
      else if(tab==='rateLimit') parts = renderRate();
      else if(tab==='disposable') parts = renderDisposable();
      else parts = renderAllowed();
      parts.forEach(p=>body.appendChild(p));
      container.appendChild(body);

      // 底部保存
      container.appendChild(h('div',{class:'row mt16',style:{alignItems:'center'}},[
        h('button',{class:'btn btn-primary',onclick:save},['保存']),
        h('span',{class:'small muted',style:{marginLeft:'12px'}},['保存后立即生效（带缓存的配置会在 30 秒内更新）']),
      ]));
    }

    render();
  }
};
