// 侧边栏菜单树 —— 一比一取自源站 layout（node_2.js）
// path 即 hash 路由；key 对应 js/pages/<key>.js 页面模块
window.MENU = [
  { title: '概览', items: [
    { key:'home', label:'首页', icon:'home', path:'/home' },
  ]},
  // 「业务运营」分组标题文字已删除(2026-07-07 绿框标注):title 留空则不渲染分组标题行,组内菜单不受影响
  { title: '', items: [
    // 【企业管理独立分组 2026-07-07】新增一级分组「企业管理」（业务运营首位，绿框标注处），
    //  企业管理 / 企业积分配置 / 企业积分管理明细 三项由「商业化管理」移入（红框标注）；
    //  path 保持 /commercial-management/* 不变——既有链接与浏览器书签不失效，仅侧边栏归属变化
    { key:'enterprise-management', label:'企业管理', icon:'building', children:[
      { key:'enterprises', label:'企业管理', path:'/commercial-management/enterprises' },
      { key:'enterprise-points-config', label:'企业积分配置', path:'/commercial-management/enterprise-points-config' },
      { key:'enterprise-points-detail', label:'企业积分管理明细', path:'/commercial-management/enterprise-points-detail' },
    ]},
    { key:'content', label:'内容管理', icon:'file', children:[
      { key:'video-review', label:'视频审核', path:'/content/video-review' },
      { key:'projects', label:'项目管理', path:'/content/projects' },
    ]},
    { key:'operation', label:'运营管理', icon:'bag', children:[
      { key:'featured-content', label:'精选内容', path:'/operation/featured-content' },
      { key:'material-upload', label:'内容上传', path:'/operation/material/upload' },
      { key:'material-management', label:'内容管理', path:'/operation/material/manage' },
      { key:'hot-drama-covers', label:'热剧封面', path:'/operation/hot-drama-covers' },
      { key:'audition-review', label:'试稿审核', path:'/operation/audition-review' },
      { key:'commercial-projects', label:'商单', path:'/operation/commercial-projects' },
      { key:'points-consumption', label:'积分消耗', path:'/operation/points-consumption' },
      { key:'announcements', label:'公告', path:'/operation/announcements' },
      { key:'broadcast-message', label:'全员消息通知', path:'/operation/broadcast-message' },
      { key:'banners', label:'Banner', path:'/operation/banners' },
      { key:'invite-points-records', label:'赠分记录', path:'/operation/invite-code/points-records' },
      { key:'invite-special-users', label:'特殊用户', path:'/operation/invite-code/special-users' },
      { key:'invite-history', label:'历史记录', path:'/operation/invite-code/history' },
      { key:'invite-internal-members', label:'内部会员', path:'/operation/invite-code/internal-members' },
      { key:'invite-verification-records', label:'验证码记录', path:'/operation/invite-code/verification-records' },
      { key:'risk-events', label:'风控事件', path:'/operation/risk-control/events' },
      { key:'risk-list', label:'黑白名单', path:'/operation/risk-control/risk-list' },
      { key:'risk-settings', label:'风控配置', path:'/operation/risk-control/settings' },
    ]},
    { key:'product', label:'产品管理', icon:'package', children:[
      { key:'one-click-mode', label:'一键模式配置', path:'/product/one-click-mode' },
    ]},
    { key:'model-management', label:'模型管理', icon:'database', children:[
      { key:'ai-channels', label:'渠道管理', path:'/model-management/ai-channels' },
      { key:'model-config', label:'模版配置', path:'/model-management/model-config' },
      { key:'system-prompts', label:'系统提示词', path:'/model-management/system-prompts' },
      { key:'points-config', label:'积分配置', path:'/model-management/points-config' },
    ]},
    { key:'commercial-management', label:'商业化管理', icon:'card', children:[
      { key:'entitlements', label:'权益管理', path:'/commercial-management/entitlements' },
      { key:'non-member-entitlements', label:'非会员权益', path:'/commercial-management/non-member-entitlements' },
      { key:'points-products', label:'商品管理', path:'/commercial-management/points-products' },
      { key:'sku-management', label:'SKU管理', path:'/commercial-management/sku-management' },
      { key:'order-management', label:'订单管理', path:'/commercial-management/order-management' },
      { key:'team-mode-config', label:'团队模式配置', path:'/commercial-management/team-mode-config' },
      { key:'finance-points-report', label:'用户积分报表', path:'/commercial-management/finance-points-report' },
    ]},
  ]},
  { title: '平台管理', items: [
    { key:'user-management', label:'用户管理', icon:'users', children:[
      { key:'user-list', label:'用户列表', path:'/user-management/user-list' },
    ]},
    { key:'system', label:'系统设置', icon:'settings', children:[
      { key:'users', label:'后台用户管理', path:'/system/users' },
      { key:'roles', label:'角色管理', path:'/system/roles' },
      { key:'permissions', label:'系统权限', path:'/system/permissions' },
      { key:'app-settings', label:'配置项管理', path:'/system/app-settings' },
    ]},
    { key:'test-portal', label:'测试 Portal', icon:'flask', children:[
      { key:'test-subscription-manage', label:'订阅管理', path:'/test-portal/subscription-manage' },
      { key:'test-fake-users', label:'测试用户', path:'/test-portal/fake-users' },
    ]},
  ]},
];

// 路由 path -> 页面模块 key
window.ROUTE_KEY = {
  '/home':'home',
  '/content/video-review':'video-review',
  '/content/projects':'projects',
  '/operation/featured-content':'featured-content',
  '/operation/material/upload':'material-upload',
  '/operation/material/manage':'material-management',
  '/operation/hot-drama-covers':'hot-drama-covers',
  '/operation/audition-review':'audition-review',
  '/operation/commercial-projects':'commercial-projects',
  '/operation/points-consumption':'points-consumption',
  '/operation/announcements':'announcements',
  '/operation/broadcast-message':'broadcast-message',
  '/operation/banners':'banners',
  '/operation/invite-code/points-records':'invite-points-records',
  '/operation/invite-code/special-users':'invite-special-users',
  '/operation/invite-code/history':'invite-history',
  '/operation/invite-code/internal-members':'invite-internal-members',
  '/operation/invite-code/verification-records':'invite-verification-records',
  '/operation/risk-control/events':'risk-events',
  '/operation/risk-control/risk-list':'risk-list',
  '/operation/risk-control/settings':'risk-settings',
  '/product/one-click-mode':'one-click-mode',
  '/model-management/ai-channels':'ai-channels',
  '/model-management/model-config':'model-config',
  '/model-management/system-prompts':'system-prompts',
  '/model-management/points-config':'points-config',
  '/commercial-management/entitlements':'entitlements',
  '/commercial-management/non-member-entitlements':'non-member-entitlements',
  '/commercial-management/points-products':'points-products',
  '/commercial-management/sku-management':'sku-management',
  '/commercial-management/order-management':'order-management',
  '/commercial-management/enterprises':'enterprises',
  '/commercial-management/enterprise-points-config':'enterprise-points-config',
  '/commercial-management/team-mode-config':'team-mode-config',
  '/commercial-management/finance-points-report':'finance-points-report',
  '/commercial-management/enterprise-points-detail':'enterprise-points-detail',
  '/user-management/user-list':'user-list',
  '/system/users':'users',
  '/system/roles':'roles',
  '/system/permissions':'permissions',
  '/system/app-settings':'app-settings',
  '/test-portal/subscription-manage':'test-subscription-manage',
  '/test-portal/fake-users':'test-fake-users',
};
