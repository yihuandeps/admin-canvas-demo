// 首页 — 概览
window.Pages['home'] = {
  render(root, ctx){
    const { h } = ctx;
    const hr = new Date().getHours();
    const greet = hr<11?'早上好':hr<18?'下午好':'晚上好';

    root.appendChild(h('div',{class:'page-header'},[
      h('div',{class:'page-title'},[greet+'，管理员 👋']),
      h('div',{class:'row gap10', style:{marginTop:'8px',alignItems:'center'}},[
        h('span',{class:'page-desc',style:{margin:0}},['欢迎使用 Admin Canvas 运营后台']),
        h('span',{class:'brand-badge',style:{marginLeft:0}},['● 测试环境']),
      ]),
    ]));

    // 快速入口
    root.appendChild(h('div',{class:'nav-group-label',style:{padding:'4px 0 10px'}},['快速入口']));
    const quick=[
      { label:'Banner', sub:'管理首页轮播图', icon:'card', path:'/operation/banners' },
      { label:'精选内容', sub:'配置精选内容推荐', icon:'bag', path:'/operation/featured-content' },
      { label:'用户列表', sub:'查看和管理用户', icon:'users', path:'/user-management/user-list' },
      { label:'订单管理', sub:'查看订单和收入', icon:'card', path:'/commercial-management/order-management' },
    ];
    root.appendChild(h('div',{class:'quick-grid'}, quick.map(q=>
      h('div',{class:'quick-card', onclick:()=>ctx.navigate(q.path)},[
        h('div',{class:'quick-icon', html:ctx.icon(q.icon,18)}),
        h('div',{class:'quick-title'},[q.label]),
        h('div',{class:'quick-sub'},[q.sub]),
      ]))));

    // 轻松一下（简易 Flappy）
    root.appendChild(h('div',{class:'nav-group-label',style:{padding:'24px 0 6px'}},['轻松一下']));
    root.appendChild(h('div',{class:'page-desc',style:{marginTop:0,marginBottom:'12px'}},['空格 / ↑ / 点击振翅，穿过管道']));
    const canvas=h('canvas',{width:760,height:420,style:{borderRadius:'10px',border:'1px solid var(--border)',background:'#1e3a5f',display:'block',maxWidth:'100%'}});
    root.appendChild(canvas);
    startFlappy(canvas);
  }
};

function startFlappy(canvas){
  const cx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height;
  let bird,pipes,running,score,raf;
  function reset(){ bird={y:H/2,v:0}; pipes=[]; running=false; score=0; draw(); }
  function flap(){ if(!running){ running=true; loop(); } bird.v=-6.2; }
  function loop(){
    bird.v+=0.4; bird.y+=bird.v;
    if(!pipes.length || pipes[pipes.length-1].x<W-220){
      const gap=140, top=40+Math.random()*(H-gap-120); pipes.push({x:W,top,gap,passed:false});
    }
    pipes.forEach(p=>p.x-=2.6);
    pipes=pipes.filter(p=>p.x>-60);
    // collision
    const bx=120,br=12;
    let dead = bird.y<0||bird.y>H-24;
    pipes.forEach(p=>{ if(bx+br>p.x&&bx-br<p.x+50){ if(bird.y-br<p.top||bird.y+br>p.top+p.gap) dead=true; }
      if(!p.passed&&p.x+50<bx){ p.passed=true; score++; } });
    draw();
    if(dead){ running=false; cx.fillStyle='#fff'; cx.font='bold 22px Inter'; cx.textAlign='center'; cx.fillText('撞到啦！点击重新开始 · 本局 '+score, W/2, H/2); return; }
    raf=requestAnimationFrame(loop);
  }
  function draw(){
    cx.fillStyle='#1e3a5f'; cx.fillRect(0,0,W,H);
    cx.fillStyle='#5b3a1a'; cx.fillRect(0,H-18,W,18);
    cx.fillStyle='#3ea64a';
    pipes.forEach(p=>{ cx.fillRect(p.x,0,50,p.top); cx.fillRect(p.x,p.top+p.gap,50,H-p.top-p.gap-18); });
    cx.fillStyle='#f5c542'; cx.beginPath(); cx.arc(120,bird.y,12,0,7); cx.fill();
    cx.fillStyle='#fff'; cx.font='bold 16px Inter'; cx.textAlign='left'; cx.fillText('得分 '+score, 14, 28);
    if(!running && score===0){ cx.fillStyle='#fff'; cx.font='bold 20px Inter'; cx.textAlign='center'; cx.fillText('点击 / 空格 —— 开始飞行', W/2, H/2); }
  }
  canvas.addEventListener('click',()=>{ if(!running && score>0 && (bird.y<0||bird.y>H-24||true)){} flap(); });
  const keyh=e=>{ if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); flap(); } };
  window.addEventListener('keydown',keyh);
  // 离开页面时清理
  const obs=new MutationObserver(()=>{ if(!document.body.contains(canvas)){ cancelAnimationFrame(raf); window.removeEventListener('keydown',keyh); obs.disconnect(); } });
  obs.observe(document.body,{childList:true,subtree:true});
  reset();
}
