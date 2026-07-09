// 积分配置 — 模型管理（源站源码还原列定义：node_9.js）
window.Pages['points-config'] = {
  render(root, ctx){
    const { h } = ctx;

    const TASK_LABEL = { video: '视频', image: '图片', text: '文本' };

    // ── 共享模型目录：与「企业积分配置 → 积分消耗模版」同一份模型字段（单一数据源）。
    // cfgPoints = 本页（积分配置）的每模型基础积分；企业模版以此为「参考值」做关联映射，但两处编辑互不影响。
    window.__MODEL_CATALOG = window.__MODEL_CATALOG || (function(){
      const tpls = ((ctx.data.templates && ctx.data.templates.templates) || []);
      return tpls.length ? tpls.map((t,i)=>({
        modelKey: t.templateKey || ('model_'+i),
        name: t.displayName || t.templateKey || ('模型'+(i+1)),
        taskType: TASK_LABEL[t.taskType] ? t.taskType : 'video',
        cfgPoints: null,
      })) : [];
    })();
    const catByKey = {}; window.__MODEL_CATALOG.forEach(m => catByKey[m.modelKey] = m);

    function parseSchema(raw){ if (!raw) return {}; try { return JSON.parse(raw); } catch { return {}; } }
    function resVals(t){
      const sc = parseSchema(t.optionsSchema);
      const f = sc.resolution;
      return f && Array.isArray(f.values) ? f.values.slice() : [];
    }

    // 优先用真实 points_config.items；为空则按 templates 派生（每模型一行：档位=分辨率清晰度，基础积分=0）
    function build(){
      const real = (ctx.data.points_config && ctx.data.points_config.items) || [];
      if (real.length){
        return real.map(it => ({
          ref: it,
          templateId: it.templateId || '',
          modelKey: it.templateKey || it.model || '',
          taskType: it.taskType || '',
          model: it.displayName || it.model || '',
          tiers: (it.tiers || []).map(x => x.clarity).filter(Boolean),
          basePoints: typeof it.basePoints === 'number' ? it.basePoints : 0,
        }));
      }
      const templates = (ctx.data.templates && ctx.data.templates.templates) || [];
      return templates.slice()
        .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0))
        .map(t => {
          const tiers = resVals(t).slice().sort(); // 1080p、2K、4K、720p
          const cat = catByKey[t.templateKey];
          return {
            ref: null,
            templateId: t.id,
            modelKey: t.templateKey || '',
            taskType: t.taskType || '',
            model: t.displayName || '',
            tiers,
            basePoints: (cat && cat.cfgPoints != null) ? cat.cfgPoints : 0,
          };
        });
    }
    let all = build();

    // —— Kling V3 / O3 系列积分配置（本期接入 17 端点，fal.ai）——
    // 依据 ~/Desktop/Kling模型接入/Kling模型接入总PRD-V3+O3.md（V3.6）§5.1/§5.4：
    // 按「模型 × 音频开/关」二维积分单价（4K 与视频参考为固定单价一维）；积分=单价(积分/秒)×时长(秒)；
    // 积分数值已拍板本期仅成本核算、上线前初始化（pt=null 显示「待初始化」）；O3 参考生与同档图生同价联动。
    // dim:2=音频两价 [无,有]；dim:1=固定一维 [固定]；pair：O3 图生↔参考生 同档联动组
    const KP = (key, name, line, tier, dim, cost, opts) => Object.assign({
      key, name, line, tier, dim, cost, pt: dim === 2 ? [null, null] : [null],
    }, opts || {});
    const KLING_PRICES = [
      KP('v3/standard/image-to-video',         'Kling V3 图生 Standard',   'V3', 'Standard', 2, [0.084, 0.126]),
      KP('v3/pro/image-to-video',              'Kling V3 图生 Pro',        'V3', 'Pro',      2, [0.112, 0.168]),
      KP('v3/4k/image-to-video',               'Kling V3 图生 4K',         'V3', '4K',       1, [0.42]),
      KP('v3/standard/text-to-video',          'Kling V3 文生 Standard',   'V3', 'Standard', 2, [0.084, 0.126]),
      KP('v3/pro/text-to-video',               'Kling V3 文生 Pro',        'V3', 'Pro',      2, [0.112, 0.168]),
      KP('v3/4k/text-to-video',                'Kling V3 文生 4K',         'V3', '4K',       1, [0.42]),
      KP('o3/standard/image-to-video',         'Kling O3 图生 Standard',   'O3', 'Standard', 2, [0.084, 0.112], { pair: 'o3-std' }),
      KP('o3/pro/image-to-video',              'Kling O3 图生 Pro',        'O3', 'Pro',      2, [0.112, 0.140], { pair: 'o3-pro' }),
      KP('o3/4k/image-to-video',               'Kling O3 图生 4K',         'O3', '4K',       1, [0.42],         { pair: 'o3-4k' }),
      KP('o3/standard/text-to-video',          'Kling O3 文生 Standard',   'O3', 'Standard', 2, [0.084, 0.112]),
      KP('o3/pro/text-to-video',               'Kling O3 文生 Pro',        'O3', 'Pro',      2, [0.112, 0.140]),
      KP('o3/4k/text-to-video',                'Kling O3 文生 4K',         'O3', '4K',       1, [0.42]),
      KP('o3/standard/reference-to-video',     'Kling O3 参考生 Standard', 'O3', 'Standard', 2, [0.084, 0.112], { pair: 'o3-std' }),
      KP('o3/pro/reference-to-video',          'Kling O3 参考生 Pro',      'O3', 'Pro',      2, [0.112, 0.140], { pair: 'o3-pro' }),
      KP('o3/4k/reference-to-video',           'Kling O3 参考生 4K',       'O3', '4K',       1, [0.42],         { pair: 'o3-4k' }),
      KP('o3/standard/video-to-video/reference','Kling O3 视频参考 Standard','O3','Standard',1, [0.126]),
      KP('o3/pro/video-to-video/reference',    'Kling O3 视频参考 Pro',    'O3', 'Pro',      1, [0.168]),
    ];

    let filter = { taskType: 'video' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb: ['模型管理', '积分配置'],
      title: '积分配置',
      desc: '按任务类型（视频/图片/文本）和清晰度档位配置各 AI 模型的积分消耗规则',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(r => filter.taskType === 'all' || r.taskType === filter.taskType);
    }

    function render(){
      container.innerHTML = '';
      const seg = ctx.Segmented(
        [{ label: '视频', value: 'video' }, { label: '图片', value: 'image' }, { label: '文本', value: 'text' }, { label: '全部', value: 'all' }],
        filter.taskType,
        v => { filter.taskType = v; page = 1; render(); }
      );
      container.appendChild(ctx.FilterBar([seg]));

      // Kling 专区（视频任务类型下展示）
      if (filter.taskType === 'video' || filter.taskType === 'all') {
        container.appendChild(h('div', { class: 'row', style: { alignItems: 'baseline', margin: '4px 2px 10px', flexWrap: 'wrap', gap: '10px' } }, [
          h('span', { class: 'bold' }, ['Kling V3 / O3 系列（本期接入 17 端点 · fal.ai）']),
          h('span', { class: 'muted small' }, ['积分 = 单价(积分/秒) × 时长(秒)；音频开/关两套价（4K 与视频参考为固定单价）；改价实时生效、只对新任务生效；积分数值已拍板上线前初始化']),
        ]));
        container.appendChild(ctx.DataTable({
          columns: [
            { title: '模型', render: r => h('div', { class: 'row gap6', style: { alignItems: 'center', flexWrap: 'wrap' } }, [
                h('span', { class: 'bold' }, [r.name]),
                ctx.Tag(r.line, r.line === 'V3' ? 'blue' : 'purple'),
                r.pair ? ctx.Tag('同价联动', 'amber') : null,
              ].filter(Boolean)) },
            { title: '端点 ID（fal）', width: 280, render: r => h('span', { class: 'mono small' }, [r.key]) },
            { title: '计费维度', width: 130, align: 'center', render: r => r.dim === 2 ? '音频开/关两价' : '固定单价' },
            { title: '成本基准（$/秒）', width: 170, align: 'center', render: r => h('span', { class: 'mono small' },
                [r.dim === 2 ? `${r.cost[0].toFixed(3)} / ${r.cost[1].toFixed(3)}` : `${r.cost[0].toFixed(2)} 固定`]) },
            { title: '积分单价（积分/秒）', width: 200, align: 'center', render: r => r.pt.some(v => v == null)
                ? ctx.Tag('待初始化', 'amber')
                : h('span', { class: 'mono' }, [r.dim === 2 ? `无 ${r.pt[0]} / 有 ${r.pt[1]}` : `${r.pt[0]} 固定`]) },
            { title: '操作', width: 90, align: 'center', render: r => h('button', { class: 'btn btn-sm', onclick: () => openKlingPrice(r) }, ['编辑']) },
          ],
          rows: KLING_PRICES,
          empty: '—',
        }));
        container.appendChild(h('div', { class: 'bold', style: { margin: '18px 2px 10px' } }, ['现有模型积分配置']));
      }

      const rows = applied();
      const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

      container.appendChild(ctx.DataTable({
        columns: [
          { title: '模型', render: r => h('span', { class: 'bold' }, [r.model || '—']) },
          { title: '档位配置', width: 280, render: r => (r.tiers && r.tiers.length) ? h('span', { class: 'small' }, [r.tiers.join('、')]) : '—' },
          { title: '基础积分', width: 120, align: 'center', render: r => h('span', { class: 'mono' }, [String(r.basePoints)]) },
          { title: '操作', width: 100, align: 'center', render: r => h('button', { class: 'btn btn-sm', onclick: () => openEdit(r) }, ['编辑']) },
        ],
        rows: pageRows,
        empty: '暂无积分配置',
        pager: { page, pageSize, total: rows.length },
        onPage: p => { page = p; render(); },
        onPageSize: ps => { pageSize = ps; page = 1; render(); },
      }));
    }

    // Kling 积分单价编辑：二维（无/有音频）或固定一维；O3 图生↔参考生 同档保存即联动（PRD §3.5/§5.4）
    function openKlingPrice(row){
      const mkIn = v => h('input', { class: 'input', type: 'number', min: '0', value: v == null ? '' : String(v), style: { width: '140px' } });
      const inputs = row.dim === 2 ? [mkIn(row.pt[0]), mkIn(row.pt[1])] : [mkIn(row.pt[0])];
      const labels = row.dim === 2 ? ['无音频（积分/秒）', '有音频（积分/秒）'] : ['固定单价（积分/秒）'];
      const m = ctx.modal({
        title: '编辑积分单价 — ' + row.name,
        body: [
          h('div', { class: 'muted small' }, [
            `成本基准：${row.dim === 2 ? `$${row.cost[0]}/秒（无音频）、$${row.cost[1]}/秒（有音频）` : `$${row.cost[0]}/秒 固定`}（fal 实时价为准）`,
          ]),
          h('div', { class: 'muted small mt8' }, ['积分 = 单价(积分/秒) × 时长(秒)；提交预扣、失败退还；改价实时生效、只对新任务生效']),
          ...inputs.map((inp, i) => h('div', { class: 'field mt16' }, [h('label', {}, [labels[i]]), inp])),
          row.pair ? h('div', { class: 'small mt8', style: { color: '#f59e0b' } },
            ['⚠ 该档位为 O3 图生 ↔ 参考生 同价联动组：保存后将自动同步同档另一端点（自动路由后扣费与展示必须一致）']) : null,
        ].filter(Boolean),
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const vals = inputs.map(inp => inp.value === '' ? null : Number(inp.value));
            if (vals.some(v => v == null || isNaN(v) || v < 0)) { ctx.toast('warning', '请填写全部单价（≥ 0 的数值）'); return; }
            row.pt = vals;
            if (row.pair) {
              const mate = KLING_PRICES.find(r => r.pair === row.pair && r.key !== row.key);
              if (mate) { mate.pt = vals.slice(); ctx.toast('info', `已联动同步：${mate.name}`); }
            }
            ctx.toast('success', '保存成功（实时生效，只对新任务生效）');
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }

    function openEdit(row){
      const baseIn = h('input', { class: 'input', type: 'number', min: '0', value: row.basePoints });
      // 各档位积分（清晰度 + 是否有声 简化为按清晰度一行）
      const tierInputs = (row.tiers && row.tiers.length ? row.tiers : ['默认']).map(t => {
        const inp = h('input', { class: 'input', type: 'number', min: '0', value: 0, style: { width: '120px' } });
        return { clarity: t, inp, node: h('div', { class: 'row gap10', style: { alignItems: 'center', marginBottom: '8px' } }, [
          h('span', { class: 'small', style: { minWidth: '90px' } }, [t]), inp,
        ]) };
      });

      const m = ctx.modal({
        title: '编辑积分配置 — ' + (row.model || ''),
        size: 'lg',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['基础积分 *']), baseIn, h('div', { class: 'small muted mt8' }, ['每次调用扣除的基础积分。此值会作为「企业积分配置 → 积分消耗模版」的参考值，但模版可自由编辑，两处互不影响。']) ]),
          h('div', { class: 'field' }, [h('label', {}, ['档位积分配置 *（清晰度 + 是否有声）']), ...tierInputs.map(t => t.node) ]),
        ],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const base = Number(baseIn.value);
            if (!(base >= 0)) { ctx.toast('warning', '基础积分需 ≥ 0'); return; }
            row.basePoints = base;
            const cat = catByKey[row.modelKey]; if (cat) cat.cfgPoints = base;  // 写回共享目录，供企业模版引用为参考值
            ctx.toast('success', '保存成功');
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }

    render();
  }
};
