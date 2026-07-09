// 渠道管理 — 模型管理（源站源码还原：node_8.js）
window.Pages['ai-channels'] = {
  render(root, ctx){
    const { h } = ctx;

    // 渠道：{id,name,remark,createdAt,updatedAt}
    let channels = ((ctx.data.channels && ctx.data.channels.items) || []).map(c => ({
      id: c.id, name: c.name || '', remark: c.remark || '',
      createdAt: c.createdAt || '', updatedAt: c.updatedAt || '',
    }));
    // 路由策略：{id,name,params}
    let strategies = ((ctx.data.route_strategies && ctx.data.route_strategies.items) || []).map(s => ({
      id: s.id, name: s.name || '', params: s.params || '',
    }));

    root.appendChild(ctx.PageHeader({
      breadcrumb: ['模型管理', '渠道管理'],
      title: '渠道管理',
      desc: '配置 AI 推理渠道及其路由策略，决定请求如何分发到各底层服务',
    }));
    const container = h('div');
    root.appendChild(container);

    function render(){
      container.innerHTML = '';

      // ===== 渠道管理 =====
      const chHead = h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
        h('span', { class: 'bold', style: { fontSize: '15px' } }, ['渠道管理']),
        h('button', { class: 'btn btn-primary', onclick: () => editChannel(null) }, ['+ 新增']),
      ]);
      const chTable = ctx.DataTable({
        columns: [
          { title: 'ID', width: 100, render: r => ctx.IdCell(r.id, 18) },
          { title: '渠道名称', render: r => r.name || '—' },
          { title: '备注', render: r => r.remark || '—' },
          { title: '操作', width: 140, align: 'center', render: r => h('div', { class: 'row gap6', style: { justifyContent: 'center' } }, [
            h('button', { class: 'btn btn-sm', onclick: () => editChannel(r) }, ['编辑']),
            h('button', { class: 'btn btn-sm btn-danger', onclick: () => delChannel(r) }, ['删除']),
          ]) },
        ],
        rows: channels,
        empty: '暂无渠道，点击右上角「新增」创建',
      });

      // ===== 路由策略管理 =====
      const stHead = h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
        h('span', { class: 'bold', style: { fontSize: '15px' } }, ['路由策略管理']),
        h('button', { class: 'btn btn-primary', onclick: () => editStrategy(null) }, ['+ 新增']),
      ]);
      const stTable = ctx.DataTable({
        columns: [
          { title: 'ID', width: 100, render: r => ctx.IdCell(r.id, 18) },
          { title: '策略名称', render: r => r.name || '—' },
          { title: '参数', width: 320, render: r => h('span', { class: 'mono small' }, [r.params || '—']) },
          { title: '操作', width: 140, align: 'center', render: r => h('div', { class: 'row gap6', style: { justifyContent: 'center' } }, [
            h('button', { class: 'btn btn-sm', onclick: () => editStrategy(r) }, ['编辑']),
            h('button', { class: 'btn btn-sm btn-danger', onclick: () => delStrategy(r) }, ['删除']),
          ]) },
        ],
        rows: strategies,
        empty: '暂无路由策略，点击右上角「新增」创建',
      });

      container.appendChild(h('section', { class: 'panel card-pad mb18' }, [chHead, chTable]));
      container.appendChild(h('section', { class: 'panel card-pad' }, [stHead, stTable]));
    }

    function editChannel(row){
      const isNew = !row;
      const nameIn = h('input', { class: 'input', value: row ? row.name : '', placeholder: '如 Google / Fal.ai / Vidu' });
      const remarkIn = h('textarea', { class: 'textarea', placeholder: '渠道说明(可选)' }); remarkIn.value = row ? row.remark : '';
      const m = ctx.modal({
        title: isNew ? '新增渠道' : '编辑渠道',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['渠道名称 *']), nameIn]),
          h('div', { class: 'field' }, [h('label', {}, ['备注']), remarkIn]),
        ],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const name = nameIn.value.trim();
            if (!name) { ctx.toast('warning', '请输入渠道名称'); return; }
            const remark = remarkIn.value.trim();
            if (isNew) {
              const now = new Date().toISOString();
              channels = [...channels, { id: 'local-' + Date.now(), name, remark, createdAt: now, updatedAt: now }];
              ctx.toast('success', '渠道已创建');
            } else {
              row.name = name; row.remark = remark; ctx.toast('success', '渠道已更新');
            }
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }
    function delChannel(row){
      const m = ctx.modal({
        title: '确认删除该渠道?',
        body: [h('div', {}, ['确认删除渠道「' + (row.name || row.id) + '」？'])],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-danger', onclick: () => {
            channels = channels.filter(c => c !== row); ctx.toast('success', '渠道已删除'); m.close(); render();
          } }, ['删除']),
        ],
      });
    }

    function editStrategy(row){
      const isNew = !row;
      const nameIn = h('input', { class: 'input', value: row ? row.name : '', placeholder: '如 固定渠道 / 按权重 / 允许降级' });
      const paramsIn = h('textarea', { class: 'textarea mono', placeholder: '{\n  "key": "value"\n}' });
      paramsIn.value = row ? row.params : '{}';
      const m = ctx.modal({
        title: isNew ? '新增路由策略' : '编辑路由策略',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['策略名称 *']), nameIn]),
          h('div', { class: 'field' }, [h('label', {}, ['参数']), paramsIn, h('div', { class: 'small muted mt8' }, ['必须是合法的 JSON 对象'])]),
        ],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const name = nameIn.value.trim();
            if (!name) { ctx.toast('warning', '请输入策略名称'); return; }
            const raw = paramsIn.value.trim();
            if (!raw) { ctx.toast('warning', '请输入参数'); return; }
            let pretty;
            try { pretty = JSON.stringify(JSON.parse(raw), null, 2); }
            catch { ctx.toast('warning', '参数必须是合法的 JSON'); return; }
            if (isNew) {
              strategies = [...strategies, { id: 'local-' + Date.now(), name, params: pretty }];
              ctx.toast('success', '策略已创建');
            } else {
              row.name = name; row.params = pretty; ctx.toast('success', '策略已更新');
            }
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }
    function delStrategy(row){
      const m = ctx.modal({
        title: '确认删除该策略?',
        body: [h('div', {}, ['确认删除策略「' + (row.name || row.id) + '」？'])],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-danger', onclick: () => {
            strategies = strategies.filter(s => s !== row); ctx.toast('success', '策略已删除'); m.close(); render();
          } }, ['删除']),
        ],
      });
    }

    render();
  }
};
