// 风控事件 — 运营管理
window.Pages['risk-events'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    // 决策 / 场景 / 命中原因映射（对齐源站 node_33）
    function decisionText(d){ return {pass:'通过',pending:'可疑',deny:'拒绝',ban:'封禁'}[d] || d; }
    function decisionColor(d){ return {pass:'#4ade80',pending:'#f5b544',deny:'#f87171',ban:'#ef4444'}[d] || 'gray'; }
    function sceneText(s){ return {register:'注册',login:'登录',send_code:'发码'}[s] || s; }
    const REASON = {
      ip_blacklisted:'IP 黑名单', device_blacklisted:'设备黑名单',
      email_domain_blacklisted:'邮箱域名黑名单', no_mx_record:'邮箱无 MX 记录',
      whitelisted:'白名单放行',
    };
    function reasonText(r){
      if(REASON[r]) return REASON[r];
      let m = String(r).match(/^same_ip_hourly:(\d+)$/); if(m) return `同 IP 小时注册 ${m[1]} 次`;
      let n = String(r).match(/^same_device_daily:(\d+)$/); if(n) return `同设备日注册 ${n[1]} 次`;
      return r;
    }
    const dash = v => (v==null || v==='') ? '—' : String(v);

    const raw = (ctx.data.risk_events && ctx.data.risk_events.items) || [];
    const all = raw.slice();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let filter = { decision:'', scene:'', ip:'', deviceId:'', userId:'', keyword:'' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb:['风控','风控事件'], title:'风控事件',
      desc:'查看注册/登录/发码的风控评估记录，按多维度筛选分析',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r=>{
        if(filter.decision && r.decision!==filter.decision) return false;
        if(filter.scene && r.scene!==filter.scene) return false;
        if(filter.ip && !String(r.ip||'').includes(filter.ip)) return false;
        if(filter.deviceId && !String(r.deviceId||'').includes(filter.deviceId)) return false;
        if(filter.userId && String(r.userId||'')!==filter.userId) return false;
        if(filter.keyword && !String(r.email||'').toLowerCase().includes(filter.keyword.toLowerCase())) return false;
        return true;
      });
    }

    function render(){
      container.innerHTML='';

      const decisionSel = h('select',{class:'select'},[
        ['','全部决策'],['pass','通过'],['pending','可疑'],['deny','拒绝'],['ban','封禁']
      ].map(([v,t])=>h('option',{value:v},[t])));
      decisionSel.value = filter.decision;
      const sceneSel = h('select',{class:'select'},[
        ['','全部场景'],['register','注册'],['login','登录'],['send_code','发码']
      ].map(([v,t])=>h('option',{value:v},[t])));
      sceneSel.value = filter.scene;
      const ipIn = h('input',{class:'input',placeholder:'IP 地址',value:filter.ip,style:{minWidth:'130px'}});
      const devIn = h('input',{class:'input',placeholder:'设备 ID',value:filter.deviceId,style:{minWidth:'130px'}});
      const uidIn = h('input',{class:'input',placeholder:'用户ID（UUID 精确匹配）',value:filter.userId,style:{minWidth:'200px'}});
      const kwIn = h('input',{class:'input',placeholder:'用户名 / 邮箱',value:filter.keyword,style:{minWidth:'140px'}});

      container.appendChild(ctx.FilterBar([
        decisionSel, sceneSel, ipIn, devIn, uidIn, kwIn,
        h('button',{class:'btn btn-primary',onclick:()=>{
          const uid = uidIn.value.trim();
          if(uid && !UUID_RE.test(uid)){
            ctx.toast('warning','用户ID 格式不正确：需为完整 UUID（如 019eb079-beea-767b-96ca-0bde31ceeb7d）');
            return;
          }
          filter = { decision:decisionSel.value, scene:sceneSel.value,
            ip:ipIn.value.trim(), deviceId:devIn.value.trim(),
            userId:uid, keyword:kwIn.value.trim() };
          page=1; render();
        }},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{
          filter={ decision:'', scene:'', ip:'', deviceId:'', userId:'', keyword:'' };
          page=1; render();
        }},['↻ 重置']),
      ]));

      const rows = applied();
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

      container.appendChild(ctx.DataTable({
        columns:[
          { title:'ID', width:70, render:r=>ctx.IdCell(r.id, 18) },
          { title:'用户 ID', width:150, render:r=>ctx.IdCell(r.userId, 18) },
          { title:'场景', width:80, render:r=>sceneText(r.scene) },
          { title:'IP', width:140, render:r=>h('span',{class:'mono small'},[dash(r.ip)]) },
          { title:'设备 ID', width:150, render:r=>ctx.IdCell(r.deviceId, 18) },
          { title:'邮箱', width:180, render:r=>dash(r.email) },
          { title:'邮箱域名', width:130, render:r=>dash(r.emailDomain) },
          { title:'国家', width:70, render:r=>dash(r.country) },
          { title:'风险分', width:80, align:'center', render:r=>h('span',{class:'mono small'},[String(r.riskScore==null?'—':r.riskScore)]) },
          { title:'决策', width:90, align:'center', render:r=>Tag(decisionText(r.decision), decisionColor(r.decision)) },
          { title:'模式', width:80, align:'center', render:r=>Tag(r.enforceMode==='enforce'?'强制':'观测', r.enforceMode==='enforce'?'blue':'gray') },
          { title:'命中原因', width:200, render:r=>{
              const rs = Array.isArray(r.reasons)?r.reasons:[];
              if(!rs.length) return '—';
              const txt = rs.map(x=>reasonText(String(x.rule!=null?x.rule:(x.reason!=null?x.reason:x)))).join('、');
              return h('span',{class:'small',title:txt},[txt]);
            } },
          { title:'时间', width:170, render:r=>ctx.fmtISO(r.createdAt) },
        ],
        rows:pageRows,
        empty:'暂无数据',
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ page=p; render(); },
        onPageSize:ps=>{ pageSize=ps; page=1; render(); },
      }));
    }

    render();
  }
};
