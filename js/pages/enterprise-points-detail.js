// 企业积分管理明细 — 商业化管理
// 按企业查看：① 企业充值金额（充值金额¥ + 充值时间）
//             ② 企业积分总额及积分发放记录（发放积分金额 + 发放记录）
//             ③ 企业账号消耗记录（子账号列表 + 逐账号「明细」弹窗：模型名称 + 消耗时间 + 积分消耗）
//                └─ 原「积分消耗明细」「子账号明细」两个 Tab 已融合为此
// 【2026-07-06 迭代】删除筛选栏「结算币种 RMB」标签与充值列表「充值方式」列；Mock 的 channel 字段保留——
//   现仅收据占位图（凭证内容）在用。
// 【2026-07-06 迭代2】子账号「明细」弹窗的「模型消耗记录」表：按消耗时间倒序 + 分页器；
//   为让翻页可演示，给「内容一组」补 14 条消耗 Mock（cs-009~022，共 18 条 → 每页 10 条时 2 页），汇总卡数值随数据自动重算。
// 【2026-07-06 迭代3】一键导出按新规格重设计为四段（开头信息/积分汇总/充值明细/发放明细），删除原【积分消耗明细】段
//   与 充值方式/操作人/流水号/记录ID 等审计字段；导出与三张指标卡一并接入时间筛选（验收标准 4/22/23 条：汇总=卡片、明细行数=页签行数）。
// 【2026-07-07 迭代】收据导入弹窗在「充值日期」下方新增必填项「需发放金额」：财务导入时手填该笔充值需发放给企业的积分，
//   写入记录 points（导出【企业充值记录明细】的「企业发放积分」列随之取手填值），取代原「充值金额×10」自动折算。
// 【2026-07-07 迭代2】「企业充值金额」页签表格新增两列（红框标注）：「需发放积分」（充值金额后，取 r.points）
//   与「操作人」（收据后，取 r.operator；收据导入生成的记录=财务导入）；一键导出维持迭代3规格不变（不含操作人）。
// 【2026-07-07 迭代3】改名（红框标注）：指标卡「已发放积分」与「企业充值金额」页签列头「需发放积分」统一改为「发放企业积分」；
//   其余页签列名、成员钻取弹窗、一键导出规格均不动。
// 【2026-07-07 迭代4】收据导入加二次确认（红框标注）：点「确定导入」先校验，通过后弹「确认导入信息」确认窗，
//   展示本次填写的基础信息（充值金额 / 收据图片缩略图·点击放大 / 充值日期 / 需发放金额）；
//   「确认导入」才真正生成充值记录，「取消」退回收据导入表单可继续修改（已填内容保留）。
window.Pages['enterprise-points-detail'] = {
  render(root, ctx){
    const { h, Tag } = ctx;
    const fmtNum = n => Number(n||0).toLocaleString('en-US');
    const fmtRMB = n => '¥' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

    // —— 本地 Mock：企业积分台账（充值 / 发放 / 消耗），与「用户积分报表」企业口径一致 ——
    const ENTERPRISES = [
      {
        id:'org-a1f62d8b-3c54-4970-b8e1-d29c70f5a463',
        name:'星澜文化（总账号）', email:'user53@demo.test', subAccounts:12,
        members:[
          {no:'03', name:'内容一组', email:'user44@demo.test', role:'组长',  status:'启用', joinedAt:'2026-05-22'},
          {no:'07', name:'内容二组', email:'user45@demo.test', role:'组长',  status:'启用', joinedAt:'2026-05-22'},
          {no:'11', name:'特效组',   email:'user97@demo.test',      role:'组长',  status:'启用', joinedAt:'2026-05-25'},
          {no:'01', name:'运营中心', email:'user82@demo.test',      role:'子账号', status:'启用', joinedAt:'2026-05-20'},
          {no:'02', name:'美术中心', email:'user36@demo.test',      role:'子账号', status:'启用', joinedAt:'2026-05-20'},
          {no:'04', name:'编剧组',   email:'user91@demo.test',   role:'子账号', status:'启用', joinedAt:'2026-05-23'},
          {no:'05', name:'后期组',   email:'user84@demo.test',     role:'子账号', status:'启用', joinedAt:'2026-05-24'},
          {no:'06', name:'配音组',   email:'user98@demo.test',    role:'子账号', status:'停用', joinedAt:'2026-05-24'},
          {no:'08', name:'市场组',   email:'user68@demo.test',      role:'子账号', status:'启用', joinedAt:'2026-05-26'},
          {no:'09', name:'数据组',   email:'user47@demo.test',     role:'子账号', status:'启用', joinedAt:'2026-05-27'},
          {no:'10', name:'商务组',   email:'user39@demo.test',      role:'子账号', status:'启用', joinedAt:'2026-05-28'},
          {no:'12', name:'品控组',   email:'user87@demo.test',       role:'子账号', status:'启用', joinedAt:'2026-05-29'},
        ],
        recharges:[
          { id:'rc-2026060112', amount:50000.00, points:500000, time:'2026-06-01 10:24:18', operator:'王会计', channel:'对公转账' },
          { id:'rc-2026061509', amount:30000.00, points:300000, time:'2026-06-15 09:12:46', operator:'王会计', channel:'对公转账' },
          { id:'rc-2026052016', amount:20000.00, points:200000, time:'2026-05-20 16:38:02', operator:'王会计', channel:'对公转账' },
        ],
        allocations:[
          { id:'al-20260601a', points:120000, target:'内容一组（子账号 03）', time:'2026-06-01 14:02:33', operator:'平台管理员·赵敏' },
          { id:'al-20260603b', points:80000,  target:'内容二组（子账号 07）', time:'2026-06-03 11:20:09', operator:'平台管理员·赵敏' },
          { id:'al-20260610c', points:60000,  target:'特效组（子账号 11）',   time:'2026-06-10 16:45:51', operator:'平台管理员·赵敏' },
          { id:'al-20260618d', points:150000, target:'内容一组（子账号 03）', time:'2026-06-18 10:08:27', operator:'平台管理员·赵敏' },
        ],
        consumptions:[
          { id:'cs-001', model:'Kling v3 Pro',     time:'2026-06-02 13:41:09', points:3600, sub:'内容一组（子账号 03）' },
          { id:'cs-002', model:'Seedance 2.0 pro', time:'2026-06-04 09:55:32', points:9800, sub:'内容二组（子账号 07）' },
          { id:'cs-003', model:'Veo 3.1',          time:'2026-06-06 17:12:48', points:19600, sub:'特效组（子账号 11）' },
          { id:'cs-004', model:'Nano banana Pro',  time:'2026-06-09 11:03:14', points:3900, sub:'内容一组（子账号 03）' },
          { id:'cs-005', model:'Kling o3 Standard',time:'2026-06-12 15:26:50', points:1152, sub:'内容二组（子账号 07）' },
          { id:'cs-006', model:'Sora 2 Pro',       time:'2026-06-15 10:39:21', points:1560, sub:'内容一组（子账号 03）' },
          { id:'cs-007', model:'Vidu q3 Pro',      time:'2026-06-19 14:18:07', points:4580, sub:'特效组（子账号 11）' },
          { id:'cs-008', model:'Gemini 3 Flash',   time:'2026-06-22 08:47:55', points:1561, sub:'内容一组（子账号 03）' },
          { id:'cs-009', model:'Seedance 2.0 pro', time:'2026-05-23 09:14:27', points:9800, sub:'内容一组（子账号 03）' },
          { id:'cs-010', model:'Kling v3 Pro',     time:'2026-05-24 15:42:08', points:3600, sub:'内容一组（子账号 03）' },
          { id:'cs-011', model:'Gemini 3 Flash',   time:'2026-05-26 11:05:36', points:780,  sub:'内容一组（子账号 03）' },
          { id:'cs-012', model:'Sora 2 Pro',       time:'2026-05-27 16:58:12', points:3100, sub:'内容一组（子账号 03）' },
          { id:'cs-013', model:'Vidu q3 Pro',      time:'2026-05-29 10:27:45', points:2290, sub:'内容一组（子账号 03）' },
          { id:'cs-014', model:'Veo 3.1',          time:'2026-05-30 14:33:59', points:9800, sub:'内容一组（子账号 03）' },
          { id:'cs-015', model:'Nano banana Pro',  time:'2026-06-03 09:48:21', points:1300, sub:'内容一组（子账号 03）' },
          { id:'cs-016', model:'Kling o3 Standard',time:'2026-06-05 13:16:44', points:1152, sub:'内容一组（子账号 03）' },
          { id:'cs-017', model:'Kling v3 Pro',     time:'2026-06-08 17:29:03', points:7200, sub:'内容一组（子账号 03）' },
          { id:'cs-018', model:'Gemini 3 Flash',   time:'2026-06-11 10:52:37', points:1561, sub:'内容一组（子账号 03）' },
          { id:'cs-019', model:'Sora 2 Pro',       time:'2026-06-14 15:07:19', points:1560, sub:'内容一组（子账号 03）' },
          { id:'cs-020', model:'Veo 3.1',          time:'2026-06-17 09:36:55', points:4900, sub:'内容一组（子账号 03）' },
          { id:'cs-021', model:'Vidu q3 Pro',      time:'2026-06-24 14:44:30', points:4580, sub:'内容一组（子账号 03）' },
          { id:'cs-022', model:'Seedance 2.0 pro', time:'2026-06-28 11:21:16', points:4900, sub:'内容一组（子账号 03）' },
        ],
      },
      {
        id:'org-c7e94b20-6d18-4f3a-a5c2-08b1f6d73e95',
        name:'山海互娱（总账号）', email:'user34@demo.test', subAccounts:5,
        members:[
          {no:'02', name:'美术组', email:'user35@demo.test',  role:'组长',  status:'启用', joinedAt:'2026-05-30'},
          {no:'04', name:'运营组', email:'user81@demo.test',  role:'组长',  status:'启用', joinedAt:'2026-06-01'},
          {no:'01', name:'策划组', email:'user83@demo.test', role:'子账号', status:'启用', joinedAt:'2026-05-30'},
          {no:'03', name:'程序组', email:'user48@demo.test',  role:'子账号', status:'启用', joinedAt:'2026-05-31'},
          {no:'05', name:'测试组', email:'user86@demo.test',   role:'子账号', status:'停用', joinedAt:'2026-06-02'},
        ],
        recharges:[
          { id:'rc-2026060110', amount:40000.00, points:400000, time:'2026-06-01 11:08:30', operator:'李出纳', channel:'对公转账' },
          { id:'rc-2026062014', amount:15000.00, points:150000, time:'2026-06-20 14:51:17', operator:'李出纳', channel:'对公转账' },
        ],
        allocations:[
          { id:'al-20260602a', points:100000, target:'美术组（子账号 02）', time:'2026-06-02 09:30:11', operator:'平台管理员·赵敏' },
          { id:'al-20260612b', points:90000,  target:'运营组（子账号 04）', time:'2026-06-12 13:44:38', operator:'平台管理员·赵敏' },
        ],
        consumptions:[
          { id:'cs-101', model:'Kling v3 Pro',     time:'2026-06-03 10:22:41', points:21600, sub:'美术组（子账号 02）' },
          { id:'cs-102', model:'Veo 3.1',          time:'2026-06-07 16:09:53', points:7400,  sub:'运营组（子账号 04）' },
          { id:'cs-103', model:'Seedance 2.0 pro', time:'2026-06-11 11:33:26', points:9800,  sub:'美术组（子账号 02）' },
          { id:'cs-104', model:'Sora 2 Pro',       time:'2026-06-16 09:17:04', points:3100,  sub:'运营组（子账号 04）' },
          { id:'cs-105', model:'Vidu q3 Pro',      time:'2026-06-21 15:48:39', points:1900,  sub:'美术组（子账号 02）' },
        ],
      },
    ];

    let orgId = ENTERPRISES[0].id;
    let tab = 'recharge';                 // recharge | allocation | members（members=企业账号消耗记录）
    const pageState = { recharge:1, allocation:1, consumption:1 };
    let pageSize = 10;
    let memberQuery = '';                 // 子账号搜索关键词
    let dateStart = '';                   // 时间筛选 — 起始日期（YYYY-MM-DD，空=不限）
    let dateEnd = '';                     // 时间筛选 — 结束日期（YYYY-MM-DD，空=不限）

    const org = () => ENTERPRISES.find(o => o.id===orgId) || ENTERPRISES[0];
    const sum = (arr, k) => arr.reduce((a,r)=>a+(r[k]||0), 0);
    // 时间筛选：按记录时间的日期部分（YYYY-MM-DD）落在 [起, 止] 区间内
    const inRange = t => { const d=(t||'').slice(0,10); if(dateStart && d<dateStart) return false; if(dateEnd && d>dateEnd) return false; return true; };
    const hasDateFilter = () => !!(dateStart || dateEnd);
    const emptyOf = base => hasDateFilter() ? '当前时间范围内暂无记录' : base;
    // 发放记录的「发放对象」→ 解析回子账号（身份 / 昵称 / 邮箱）：按展示名「组名（子账号 NN）」匹配 members
    function allocRecipient(o, a){
      const m = (o.members||[]).find(x => (x.name+'（子账号 '+x.no+'）') === a.target);
      if(m) return { role:m.role, name:m.name, email:m.email };
      const nm = (a.target||'').replace(/（.*?）/g,'').trim();
      return { role:null, name: nm || (a.target||'—'), email:null };
    }

    root.appendChild(ctx.PageHeader({
      breadcrumb:['企业管理','企业积分管理明细'],
      title:'企业积分管理明细',
      desc:'按企业查看充值金额与时间、积分总额与发放记录、以及各企业账号的模型消耗记录。',
    }));
    const container = h('div');
    root.appendChild(container);

    // —— 一键导出：按导出规格输出四段 CSV ——
    // 开头 = 标题（企业积分管理明细 — 企业名）+ 企业主账号邮箱 + 子账号数 + 结算币种（人民币）
    // 【积分汇总】= 累计充值金额（人民币）/ 企业积分总额（企业发放积分）/ 企业已消耗积分 —— 与页面三张指标卡一一相等
    // 【企业充值记录明细】= 充值金额（人民币）/ 企业发放积分 / 充值时间（企业发放积分 = 该笔充值对应发放的积分 r.points）
    // 【积分发放记录明细】= 企业发放积分金额 / 发放对象 / 角色 / 发放时间
    // 导出受时间筛选：明细行数与页签一致；文件名 = 企业积分管理明细_企业名_导出日期
    function exportAll(o){
      const esc=v=>{ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
      const recharges=o.recharges.filter(r=>inRange(r.time));
      const allocations=o.allocations.filter(r=>inRange(r.time));
      const totalRMB=sum(recharges,'amount');
      const allocated=sum(allocations,'points');
      const consumed=sum(o.consumptions.filter(r=>inRange(r.time)),'points');
      const lines=[];
      const row=(...cells)=>lines.push(cells.map(esc).join(','));
      const blank=()=>lines.push('');

      row('企业积分管理明细 — '+o.name);
      row('企业主账号邮箱', o.email);
      row('子账号数', o.subAccounts);
      row('结算币种', '人民币');
      blank();
      row('【积分汇总】');
      row('累计充值金额（人民币）', totalRMB.toFixed(2));
      row('企业积分总额（企业发放积分）', allocated);
      row('企业已消耗积分', consumed);
      blank();
      row('【企业充值记录明细】');
      row('充值金额（人民币）','企业发放积分','充值时间');
      recharges.forEach(r=>row(r.amount.toFixed(2), r.points, r.time));
      blank();
      row('【积分发放记录明细】');
      row('企业发放积分金额','发放对象','角色','发放时间');
      allocations.forEach(r=>{ const g=allocRecipient(o,r); row(r.points, r.target, g.role||'—', r.time); });

      const now=new Date(), pad=n=>String(n).padStart(2,'0');
      const ymd=''+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate());
      const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`企业积分管理明细_${o.name.replace(/（.*?）/g,'')}_${ymd}.csv`;
      a.click(); URL.revokeObjectURL(a.href);
      ctx.toast('success',`已导出「${o.name}」积分明细（充值 ${recharges.length} 条 / 发放 ${allocations.length} 条${hasDateFilter()?'，已按当前时间筛选':''}）`);
    }

    // —— 收据导入：录入一笔线下充值（充值金额 + 收据图片 + 充值日期 + 需发放金额），生成一条充值记录 ——
    // 需发放金额 = 该笔充值需发放给企业的积分，手填必填，写入记录 points
    // 点「确定导入」先弹「确认导入信息」二次确认（展示填写的基础信息），确认后才落库
    function openReceiptModal(o){
      let receiptUrl='';
      const amountIn=h('input',{class:'input',type:'number',min:'0',step:'0.01',placeholder:'请输入充值金额（人民币）'});
      const pointsIn=h('input',{class:'input',type:'number',min:'0',step:'1',placeholder:'请输入需发放金额（积分）'});
      const dateIn=h('input',{class:'input',type:'date'});
      const fileIn=h('input',{type:'file',accept:'image/*'});
      fileIn.style.display='none';
      const drop=h('div',{
        style:{border:'1px dashed var(--border)',borderRadius:'8px',padding:'18px',textAlign:'center',cursor:'pointer',color:'var(--muted-foreground)',fontSize:'13px'},
        onclick:()=>fileIn.click(),
      },['🧾 点击上传收据图片（JPG / PNG）']);
      fileIn.onchange=()=>{
        const f=fileIn.files&&fileIn.files[0];
        if(!f) return;
        if(!/^image\//.test(f.type)){ ctx.toast('error','请上传图片格式的收据'); return; }
        const rd=new FileReader();
        rd.onload=()=>{
          receiptUrl=rd.result;
          drop.innerHTML='';
          drop.appendChild(h('img',{src:receiptUrl,style:{maxWidth:'100%',maxHeight:'200px',borderRadius:'6px',display:'block',margin:'0 auto'}}));
          drop.appendChild(h('div',{class:'muted small',style:{marginTop:'8px'}},[f.name+' · 点击可重新选择']));
        };
        rd.readAsDataURL(f);
      };
      // 真正落库：生成充值记录、关闭收据导入弹窗、切回「企业充值金额」页签
      function doImport(amt, pts){
        o.recharges.unshift({
          id:'rc-'+dateIn.value.replace(/-/g,'')+String(Math.floor(Math.random()*90)+10),
          amount:amt, points:Math.round(pts),
          time:dateIn.value+' 00:00:00',
          operator:'财务导入', channel:'对公转账', receipt:receiptUrl,
        });
        m.close();
        tab='recharge'; pageState.recharge=1; render();
        ctx.toast('success','收据已导入，已生成一条充值记录（'+fmtRMB(amt)+'，需发放 '+fmtNum(Math.round(pts))+' 积分）');
      }
      // 二次确认弹窗：展示本次填写的基础信息，「确认导入」才落库；「取消」退回表单可继续修改
      function openConfirmModal(amt, pts){
        const c=ctx.modal({ title:'确认导入信息',
          body:[
            h('div',{class:'muted small',style:{marginBottom:'12px'}},['请核对本次收据导入的信息，点击「确认导入」后将生成一条充值记录。']),
            h('div',{class:'kv'},[
              h('dt',{},['充值金额']), h('dd',{class:'bold'},[fmtRMB(amt)]),
              h('dt',{},['收据图片']), h('dd',{},[h('img',{src:receiptUrl,title:'点击放大查看',
                style:{maxWidth:'160px',maxHeight:'120px',borderRadius:'6px',display:'block',cursor:'zoom-in',background:'#fff'},
                onclick:()=>previewReceipt(receiptUrl,'本次导入 · '+fmtRMB(amt)+' · '+dateIn.value)})]),
              h('dt',{},['充值日期']), h('dd',{},[dateIn.value]),
              h('dt',{},['需发放金额']), h('dd',{class:'bold'},[fmtNum(Math.round(pts))+' 积分']),
            ]),
          ],
          footer:[
            h('button',{class:'btn',onclick:()=>c.close()},['取消']),
            h('button',{class:'btn btn-primary',onclick:()=>{ c.close(); doImport(amt, pts); }},['确认导入']),
          ],
        });
      }
      const m=ctx.modal({ title:'收据导入',
        body:[
          h('div',{class:'field'},[ h('label',{},['充值金额（人民币 ¥）']), amountIn ]),
          h('div',{class:'field'},[ h('label',{},['收据图片']), drop, fileIn ]),
          h('div',{class:'field'},[ h('label',{},['充值日期']), dateIn ]),
          h('div',{class:'field'},[ h('label',{},['需发放金额']), pointsIn ]),
        ],
        footer:[
          h('button',{class:'btn',onclick:()=>m.close()},['取消']),
          h('button',{class:'btn btn-primary',onclick:()=>{
            const amt=parseFloat(amountIn.value);
            const pts=parseFloat(pointsIn.value);
            if(!(amt>0)){ ctx.toast('error','请输入有效的充值金额'); return; }
            if(!dateIn.value){ ctx.toast('error','请选择充值日期'); return; }
            if(!receiptUrl){ ctx.toast('error','请上传收据图片'); return; }
            if(!(pts>0)){ ctx.toast('error','请输入有效的需发放金额'); return; }
            openConfirmModal(amt, pts);
          }},['确定导入']),
        ],
      });
    }

    // —— 收据图片：导入上传的用 r.receipt；无上传的按该记录生成一张「对公转账回单」占位图（SVG dataURI）——
    function receiptImg(r, o){
      const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const rows = [
        ['付款方', o.name],
        ['收款方', 'Admin Canvas 平台'],
        ['充值方式', r.channel||'对公转账'],
        ['充值日期', (r.time||'').slice(0,10)],
        ['操作人', r.operator||'—'],
        ['流水号', r.id||'—'],
      ];
      const fieldSvg = rows.map((kv,i)=>{
        const y = 242 + i*32;
        return `<text x='32' y='${y}' font-family='sans-serif' font-size='13' fill='#6b7280'>${esc(kv[0])}</text>`
             + `<text x='328' y='${y}' font-family='sans-serif' font-size='13' fill='#111827' text-anchor='end'>${esc(kv[1])}</text>`
             + `<line x1='32' y1='${y+12}' x2='328' y2='${y+12}' stroke='#eef0f3'/>`;
      }).join('');
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='520' viewBox='0 0 360 520'>`
        + `<rect width='360' height='520' fill='#ffffff'/>`
        + `<rect width='360' height='70' fill='#2563eb'/>`
        + `<text x='180' y='38' font-family='sans-serif' font-size='22' font-weight='bold' fill='#ffffff' text-anchor='middle'>充值收据</text>`
        + `<text x='180' y='58' font-family='sans-serif' font-size='12' fill='#dbeafe' text-anchor='middle'>${esc(r.channel||'对公转账')}凭证 · 仅演示</text>`
        + `<text x='32' y='118' font-family='sans-serif' font-size='12' fill='#6b7280'>充值金额（人民币）</text>`
        + `<text x='32' y='162' font-family='sans-serif' font-size='40' font-weight='bold' fill='#111827'>${esc(fmtRMB(r.amount))}</text>`
        + `<line x1='32' y1='196' x2='328' y2='196' stroke='#e5e7eb' stroke-width='1.5'/>`
        + fieldSvg
        + `<g transform='rotate(-14 285 472)'>`
        + `<circle cx='285' cy='472' r='38' fill='none' stroke='#dc2626' stroke-width='2.5'/>`
        + `<text x='285' y='468' font-family='sans-serif' font-size='13' font-weight='bold' fill='#dc2626' text-anchor='middle'>财务已核</text>`
        + `<text x='285' y='484' font-family='sans-serif' font-size='9' fill='#dc2626' text-anchor='middle'>FINANCE</text>`
        + `</g>`
        + `</svg>`;
      return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    }
    function previewReceipt(url, caption){
      ctx.modal({ title:'收据凭证',
        body:[
          caption? h('div',{class:'muted small',style:{marginBottom:'10px'}},[caption]) : null,
          h('img',{src:url, style:{maxWidth:'100%',maxHeight:'70vh',borderRadius:'8px',display:'block',margin:'0 auto',background:'#fff'}}),
        ],
      });
    }

    function render(){
      container.innerHTML='';
      const o = org();

      // —— 企业选择 ——
      const orgSel = h('select',{class:'select',style:{minWidth:'260px'},
        onchange:e=>{ orgId=e.target.value; pageState.recharge=pageState.allocation=pageState.consumption=1; memberQuery=''; render(); }},
        ENTERPRISES.map(e=>h('option',{value:e.id},[e.name])));
      orgSel.value = orgId;
      // —— 时间筛选：按记录时间起止日期过滤当前列表 ——
      const startIpt=h('input',{class:'input',type:'date',value:dateStart,style:{width:'150px'}});
      const endIpt=h('input',{class:'input',type:'date',value:dateEnd,style:{width:'150px'}});
      const applyDate=()=>{
        if(startIpt.value && endIpt.value && startIpt.value>endIpt.value){ ctx.toast('error','起始日期不能晚于结束日期'); return; }
        dateStart=startIpt.value; dateEnd=endIpt.value;
        pageState.recharge=pageState.allocation=pageState.consumption=1; render();
      };
      startIpt.onchange=applyDate; endIpt.onchange=applyDate;
      container.appendChild(ctx.FilterBar([
        h('span',{class:'muted small'},['选择企业']), orgSel,
        h('span',{class:'muted small',style:{marginLeft:'8px'}},[o.email]),
        Tag('子账号 '+o.subAccounts+' 个','purple'),
        h('span',{class:'muted small',style:{marginLeft:'10px'}},['时间筛选']),
        startIpt, h('span',{class:'muted small'},['至']), endIpt,
        h('button',{class:'btn',onclick:()=>{ dateStart=''; dateEnd=''; pageState.recharge=pageState.allocation=pageState.consumption=1; render(); }},['↻ 重置']),
        h('div',{class:'flex1'}),
        h('button',{class:'btn',onclick:()=>openReceiptModal(o)},['🧾 收据导入']),
        h('button',{class:'btn btn-primary',onclick:()=>exportAll(o)},['⬇ 一键导出']),
      ]));

      // —— 指标卡：累计充值金额(¥) / 已发放积分 / 已消耗积分 —— 均受时间筛选，与导出【积分汇总】一一相等 ——
      const totalRMB = sum(o.recharges.filter(r=>inRange(r.time)),'amount');
      const allocated = sum(o.allocations.filter(r=>inRange(r.time)),'points');
      const consumed = sum(o.consumptions.filter(r=>inRange(r.time)),'points');
      container.appendChild(h('div',{class:'stat-grid mb18'},[
        ctx.StatCard({label:'累计充值金额', value:fmtRMB(totalRMB), sub:'单位：人民币'}),
        ctx.StatCard({label:'发放企业积分', value:fmtNum(allocated)}),
        ctx.StatCard({label:'已消耗积分', value:fmtNum(consumed)}),
      ]));

      // —— Tab 切换（原「积分消耗明细」「子账号明细」已融合为「企业账号消耗记录」）——
      container.appendChild(h('div',{class:'mb12'},[
        ctx.Segmented([
          {label:'企业充值金额', value:'recharge'},
          {label:'积分总额及发放记录', value:'allocation'},
          {label:'企业账号消耗记录', value:'members'},
        ], tab, v=>{ tab=v; render(); }),
      ]));

      if(tab==='recharge') renderTable(o.recharges.filter(r=>inRange(r.time)), 'recharge', [
        { title:'充值金额（人民币）', width:160, align:'center', render:r=>h('span',{class:'bold'},[fmtRMB(r.amount)]) },
        { title:'发放企业积分', width:140, align:'center', render:r=>h('span',{class:'bold'},[fmtNum(r.points)]) },
        { title:'收据', width:130, align:'center', render:r=>{ const url=r.receipt||receiptImg(r,o); return h('img',{class:'cell-img',src:url,title:'点击查看收据',style:{cursor:'zoom-in'},onclick:()=>previewReceipt(url, o.name+' · '+fmtRMB(r.amount)+' · '+(r.time||'').slice(0,10))}); } },
        { title:'操作人', width:120, align:'center', render:r=>r.operator||'—' },
        { title:'充值时间', width:180, align:'center', render:r=>r.time },
      ], emptyOf('该企业暂无充值记录'));

      if(tab==='allocation') renderTable(o.allocations.filter(r=>inRange(r.time)), 'allocation', [
        { title:'发放积分', width:140, align:'center', render:r=>h('span',{class:'bold'},[fmtNum(r.points)]) },
        { title:'身份', width:90, align:'center', render:r=>{ const g=allocRecipient(o,r); return g.role? Tag(g.role, g.role==='组长'?'green':'blue') : '—'; } },
        { title:'昵称', width:160, render:r=>allocRecipient(o,r).name || '—' },
        { title:'邮箱', render:r=>{ const e=allocRecipient(o,r).email; return e? h('span',{class:'muted small'},[e]) : '—'; } },
        { title:'发放时间', width:180, align:'center', render:r=>r.time },
      ], emptyOf('该企业暂无积分发放记录'));

      if(tab==='members') renderMembers(o);
    }

    function renderTable(rows, key, columns, empty){
      const page = pageState[key];
      const pageRows = rows.slice((page-1)*pageSize, page*pageSize);
      container.appendChild(ctx.DataTable({
        columns, rows:pageRows, empty,
        pager:{ page, pageSize, total:rows.length },
        onPage:p=>{ pageState[key]=p; render(); },
        onPageSize:s=>{ pageSize=s; pageState[key]=1; render(); },
      }));
    }

    // —— 子账号明细：搜索企业下辖子账号 + 单账号积分明细查询 ——
    // 子账号的发放 / 消耗记录由其展示名（"组名（子账号 NN）"）匹配企业台账中的 target / sub 得到。
    function memberStat(o, m){
      const tag = m.name+'（子账号 '+m.no+'）';
      const allocs = (o.allocations||[]).filter(a=>a.target===tag);
      const cons   = (o.consumptions||[]).filter(c=>c.sub===tag);
      const allocated = allocs.reduce((s,a)=>s+(a.points||0),0);
      const consumed  = cons.reduce((s,c)=>s+(c.points||0),0);
      return { tag, allocs, cons, allocated, consumed, remaining: allocated-consumed };
    }

    function renderMembers(o){
      const list = (o.members||[]);
      const q = h('input',{class:'input',style:{minWidth:'240px'},placeholder:'账号名称 / 邮箱',value:memberQuery});
      q.oninput = ()=>{ memberQuery=q.value; renderMembersTable(); };
      container.appendChild(ctx.FilterBar([
        h('span',{class:'muted small'},['搜索子账号']), q,
        h('button',{class:'btn btn-primary',onclick:()=>renderMembersTable()},['🔍 搜索']),
        h('button',{class:'btn',onclick:()=>{ memberQuery=''; q.value=''; renderMembersTable(); }},['重置']),
        h('div',{class:'flex1'}),
        h('span',{class:'muted small'},['共 '+list.length+' 个子账号']),
      ]));
      const tableHost = h('div'); container.appendChild(tableHost);
      function renderMembersTable(){
        tableHost.innerHTML='';
        const kw = memberQuery.trim().toLowerCase();
        const rows = list.filter(m=> !kw
          || m.name.toLowerCase().includes(kw)
          || (m.email||'').toLowerCase().includes(kw));
        tableHost.appendChild(ctx.DataTable({
          columns:[
            { title:'账号名称', render:m=>h('div',{},[h('div',{style:{cursor:'pointer',color:'#60a5fa',fontWeight:'500'},title:'点击查看消耗记录',onclick:()=>openMemberModal(o,m)},[m.name]), h('div',{class:'muted small'},[m.email||'—'])]) },
            { title:'角色', width:90, align:'center', render:m=>Tag(m.role, m.role==='组长'?'green':'blue') },
            { title:'已发放积分', width:120, align:'center', render:m=>fmtNum(memberStat(o,m).allocated) },
            { title:'已消耗积分', width:120, align:'center', render:m=>fmtNum(memberStat(o,m).consumed) },
            { title:'剩余积分', width:110, align:'center', render:m=>{ const r=memberStat(o,m).remaining; return h('span',{class:'bold',style:{color:r>0?'#4ade80':'#8c8c8c'}},[fmtNum(r)]); } },
            { title:'操作', width:90, align:'center', render:m=>h('button',{class:'btn btn-sm',onclick:()=>openMemberModal(o,m)},['明细']) },
          ],
          rows, empty: kw?'未搜索到匹配的子账号':'该企业暂无子账号',
        }));
      }
      renderMembersTable();
    }

    // —— 子账号「明细」弹窗：概览 + 模型消耗记录（模型名称 / 消耗时间 / 积分消耗）+ 积分发放记录 ——
    // 模型消耗记录：按消耗时间倒序（最新在前），带分页器（与页面列表同款：共 N 条 / 每页 10/20/50/100 / 上下页）
    function openMemberModal(o, m){
      const st = memberStat(o,m);
      const consRows = st.cons.slice().sort((a,b)=>(b.time||'').localeCompare(a.time||''));
      let consPage = 1, consPageSize = 10;
      const consHost = h('div');
      function renderCons(){
        consHost.innerHTML='';
        consHost.appendChild(ctx.DataTable({
          columns:[
            { title:'模型名称', width:200, render:r=>h('span',{class:'mono'},[r.model]) },
            { title:'消耗时间', width:200, align:'center', render:r=>r.time },
            { title:'积分消耗', width:140, align:'center', render:r=>h('span',{class:'bold'},[fmtNum(r.points)]) },
          ],
          rows: consRows.slice((consPage-1)*consPageSize, consPage*consPageSize),
          empty:'该子账号暂无模型消耗记录',
          pager:{ page:consPage, pageSize:consPageSize, total:consRows.length },
          onPage:p=>{ consPage=p; renderCons(); },
          onPageSize:s=>{ consPageSize=s; consPage=1; renderCons(); },
        }));
      }
      renderCons();
      const modalRef = ctx.modal({
        size:'lg',
        title:'「'+m.name+'」消耗记录',
        body:[
          h('div',{class:'panel'},[
            h('div',{class:'row gap10',style:{alignItems:'center',flexWrap:'wrap'}},[
              h('span',{class:'bold',style:{fontSize:'15px'}},[m.name]),
              Tag(m.role, m.role==='组长'?'green':'blue'),
              h('span',{class:'muted small'},[m.email||'—']),
            ]),
            h('div',{class:'muted small',style:{marginTop:'8px'}},['所属企业：'+o.name+'　·　加入时间：'+(m.joinedAt||'—')]),
          ]),
          h('div',{class:'stat-grid'},[
            ctx.StatCard({label:'已发放积分', value:fmtNum(st.allocated), sub:st.allocs.length+' 条发放记录'}),
            ctx.StatCard({label:'已消耗积分', value:fmtNum(st.consumed), sub:st.cons.length+' 条消耗记录'}),
            ctx.StatCard({label:'剩余积分', value:fmtNum(st.remaining), sub:'发放 − 消耗'}),
          ]),
          h('div',{class:'bold'},['模型消耗记录']),
          consHost,
          h('div',{class:'bold',style:{marginTop:'4px'}},['积分发放记录']),
          ctx.DataTable({
            columns:[
              { title:'发放积分金额', width:180, align:'center', render:r=>h('span',{class:'bold'},[fmtNum(r.points)]) },
              { title:'发放时间', width:200, align:'center', render:r=>r.time },
            ], rows:st.allocs, empty:'该子账号暂无积分发放记录',
          }),
        ],
        footer:[ h('button',{class:'btn',onclick:()=>modalRef.close()},['关闭']) ],
      });
    }

    render();
  }
};
