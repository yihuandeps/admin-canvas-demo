// 模版配置 — 模型管理
window.Pages['model-config'] = {
  render(root, ctx){
    const { h, Tag } = ctx;

    const TASK_LABEL = { video: '视频', image: '图片', text: '文本' };

    // 模型限制 —— 用户群体「黑名单」维度（勾选=禁止使用该模型；空=全员可用）
    // 群体口径取自系统既有：特殊群体（内部会员）
    const LIMIT_GROUPS = [
      { section: '特殊群体', items: [
        { key: 'internal', label: '内部会员', hint: '内部赠送权益账号', detail: true },
      ]},
    ];
    const GROUP_LABEL = {};
    LIMIT_GROUPS.forEach(s => s.items.forEach(it => { GROUP_LABEL[it.key] = it.label; }));
    const limitLabels = keys => (keys || []).map(k => GROUP_LABEL[k] || k);

    function parseSchema(raw){
      if (!raw) return {};
      try { return JSON.parse(raw); } catch { return {}; }
    }
    function vals(schema, key){
      const f = schema[key];
      const arr = f && Array.isArray(f.values) ? f.values : [];
      return arr;
    }

    // 本地内存副本（首行样例对齐 video_happyhorse | HappyHorse | 720p,1080p | 1:1,3:4,... | 4s,5s,... | 有 | 启用）
    let all = ((ctx.data.templates && ctx.data.templates.templates) || []).map(t => {
      const schema = parseSchema(t.optionsSchema);
      return {
        ref: t,
        id: t.id,
        templateKey: t.templateKey || '',
        taskType: t.taskType || '',
        displayName: t.displayName || '',
        status: typeof t.status === 'number' ? t.status : 1,
        sortOrder: t.sortOrder || 0,
        resolution: vals(schema, 'resolution'),
        ratio: vals(schema, 'ratio'),
        duration: vals(schema, 'duration'),
        voice: vals(schema, 'voice'),
        createdAt: t.createdAt || '',
        updatedAt: t.updatedAt || '',
        restrictGroups: Array.isArray(t.restrictGroups) ? t.restrictGroups : [],
      };
    }).sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

    // —— Kling V3 / O3 系列（fal.ai 通道，本期接入 17 端点）——
    // 依据 ~/Desktop/Kling模型接入/Kling模型接入总PRD-V3+O3.md（V3.6）§二 接入矩阵 + §5.4 后台配置
    // 17 端点独立条目（上下架/排序/NEW 角标）；时长 3–15s 13 档默认 5s；音频默认关；会员限制本期不启用
    const K = (key, name, line, form, tier, sortOrder, opts) => Object.assign({
      ref: null, id: 'kling-' + key, templateKey: key, taskType: 'video',
      displayName: name, status: 1, sortOrder,
      resolution: [tier === '4K' ? '4K' : '1080p'],
      ratio: form === '文生' ? ['16:9', '9:16', '1:1'] : (form === '视频参考' ? ['auto·透传'] : ['跟随首图']),
      duration: ['3–15s·13档', '默认5s'],
      voice: form === '视频参考' ? ['保留原声·默认开'] : ['开/关·默认关'],
      createdAt: '2026-06-12', updatedAt: '2026-06-12',
      kling: true, isNew: true, line, form, tier,
      defaultDuration: '5s', memberLimit: '不限（本期全量开放）',
    }, opts || {});
    const KLING_MODELS = [
      K('v3/standard/image-to-video',        'Kling V3 图生视频 Standard',  'V3', '图生',     'Standard', 9917),
      K('v3/pro/image-to-video',             'Kling V3 图生视频 Pro',       'V3', '图生',     'Pro',      9916),
      K('v3/4k/image-to-video',              'Kling V3 图生视频 4K',        'V3', '图生',     '4K',       9915, { region: '仅新加坡' }),
      K('v3/standard/text-to-video',         'Kling V3 文生视频 Standard',  'V3', '文生',     'Standard', 9914),
      K('v3/pro/text-to-video',              'Kling V3 文生视频 Pro',       'V3', '文生',     'Pro',      9913),
      K('v3/4k/text-to-video',               'Kling V3 文生视频 4K',        'V3', '文生',     '4K',       9912, { region: '区域待确认' }),
      K('o3/standard/image-to-video',        'Kling O3 图生视频 Standard',  'O3', '图生',     'Standard', 9911),
      K('o3/pro/image-to-video',             'Kling O3 图生视频 Pro',       'O3', '图生',     'Pro',      9910),
      K('o3/4k/image-to-video',              'Kling O3 图生视频 4K',        'O3', '图生',     '4K',       9909, { region: '仅新加坡' }),
      K('o3/standard/text-to-video',         'Kling O3 文生视频 Standard',  'O3', '文生',     'Standard', 9908),
      K('o3/pro/text-to-video',              'Kling O3 文生视频 Pro',       'O3', '文生',     'Pro',      9907),
      K('o3/4k/text-to-video',               'Kling O3 文生视频 4K',        'O3', '文生',     '4K',       9906, { region: '仅新加坡' }),
      K('o3/standard/reference-to-video',    'Kling O3 参考生视频 Standard','O3', '参考生',   'Standard', 9905, { refImgLimit: 4 }),
      K('o3/pro/reference-to-video',         'Kling O3 参考生视频 Pro',     'O3', '参考生',   'Pro',      9904, { refImgLimit: 4 }),
      K('o3/4k/reference-to-video',          'Kling O3 参考生视频 4K',      'O3', '参考生',   '4K',       9903, { refImgLimit: 4, region: '仅新加坡' }),
      K('o3/standard/video-to-video/reference','Kling O3 视频参考 Standard','O3', '视频参考', 'Standard', 9902, { refImgLimit: 4 }),
      K('o3/pro/video-to-video/reference',   'Kling O3 视频参考 Pro',       'O3', '视频参考', 'Pro',      9901, { refImgLimit: 4 }),
    ];
    all = KLING_MODELS.concat(all);

    // —— Seedance 2.0（火山引擎 方舟）——
    // 依据 产品文档库/1-模型接入/Seedance2.0模型接入-需求文档(PRD) §四 后台配置
    // 旗舰「Seedance 2.0 VIP」(480p→4K，含 4K) + 「Seedance 2.0 fast」(480p/720p，无 4K)；品牌名取自画布模型下拉
    // 本需求：4K 成本过高 → 内部会员禁用「4K 档」(分辨率档维度限制，不影响其 720p/1080p)
    const SEEDANCE_MODELS = [
      { ref: null, id: 'seedance-vip', templateKey: 'video_seedance2_vip', taskType: 'video',
        displayName: 'Seedance 2.0 VIP', status: 1, sortOrder: 9932,
        resolution: ['480p', '720p', '1080p', '4K'], ratio: ['16:9', '9:16', '1:1', '跟随首图'],
        duration: ['滑块吸附·档随官方', '默认5s'], voice: ['开/关·默认关'],
        createdAt: '2026-06-26', updatedAt: '2026-06-26',
        seedance: true, isNew: true, line: '旗舰',
        restrictGroups: ['internal'], restrictResolutions: ['4K'] },
      { ref: null, id: 'seedance-fast', templateKey: 'video_seedance2_fast', taskType: 'video',
        displayName: 'Seedance 2.0 fast', status: 1, sortOrder: 9931,
        resolution: ['480p', '720p'], ratio: ['16:9', '9:16', '1:1', '跟随首图'],
        duration: ['滑块吸附·档随官方', '默认5s'], voice: ['开/关·默认关'],
        createdAt: '2026-06-26', updatedAt: '2026-06-26',
        seedance: true, isNew: true, line: 'Mini',
        restrictGroups: [], restrictResolutions: [] },
    ];
    all = SEEDANCE_MODELS.concat(all);

    let filter = { taskType: 'video' };
    let page = 1, pageSize = 10;

    root.appendChild(ctx.PageHeader({
      breadcrumb: ['模型管理', '模版配置'],
      title: '模版配置',
      desc: '管理视频、图片、文本 AI 模型模版的参数配置与各渠道上游路由绑定',
      actions: [ h('button', { class: 'btn btn-primary', onclick: () => openEdit(null) }, ['+ 新建模型']) ],
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(t => filter.taskType === 'all' || t.taskType === filter.taskType);
    }

    function joinVals(arr){
      if (!arr || !arr.length) return '—';
      return h('span', { class: 'small' }, [arr.join(', ')]);
    }

    function render(){
      container.innerHTML = '';

      const seg = ctx.Segmented(
        [{ label: '视频', value: 'video' }, { label: '图片', value: 'image' }, { label: '文本', value: 'text' }, { label: '全部', value: 'all' }],
        filter.taskType,
        v => { filter.taskType = v; page = 1; render(); }
      );
      container.appendChild(ctx.FilterBar([seg]));

      const rows = applied();
      const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

      container.appendChild(ctx.DataTable({
        columns: [
          { title: '模版 key', render: r => h('span', { class: 'mono small' }, [r.templateKey || '—']) },
          { title: '模型名称', render: r => {
            const tags = [];
            if (r.kling) {
              tags.push(Tag(r.line, r.line === 'V3' ? 'blue' : 'purple'));
              if (r.isNew) tags.push(Tag('NEW', 'red'));
              if (r.region) tags.push(Tag(r.region, 'amber'));
            }
            if (r.seedance) {
              tags.push(Tag(r.line, 'blue'));
              if (r.isNew) tags.push(Tag('NEW', 'red'));
            }
            if (r.restrictGroups && r.restrictGroups.length) {
              const scoped = r.restrictResolutions && r.restrictResolutions.length;
              const lt = Tag(scoped ? ('限制·' + r.restrictResolutions.join('/')) : ('限制 ' + r.restrictGroups.length), 'red');
              lt.title = '禁止 ' + limitLabels(r.restrictGroups).join('、') + ' 使用'
                + (scoped ? ('「' + r.restrictResolutions.join('/') + '」档') : '本模型（全部分辨率）');
              tags.push(lt);
            }
            return h('div', { class: 'row gap6', style: { alignItems: 'center', flexWrap: 'wrap' } }, [
              h('span', { class: 'bold' }, [r.displayName || '—']),
              ...tags,
            ]);
          } },
          { title: '分辨率', render: r => joinVals(r.resolution) },
          { title: '比例', render: r => joinVals(r.ratio) },
          { title: '时长', render: r => joinVals(r.duration) },
          { title: '声音', width: 80, align: 'center', render: r => (r.voice && r.voice.length) ? r.voice.join('、') : '—' },
          { title: '状态', width: 90, align: 'center', render: r => Tag(r.status === 1 ? '启用' : '禁用', r.status === 1 ? 'green' : 'gray') },
          { title: '操作', width: 80, align: 'center', render: r => {
            const trigger = h('button', { class: 'act-trigger', title: '更多操作', html: '⋯' });
            trigger.addEventListener('click', e => {
              e.stopPropagation();
              openActionMenu(trigger, [
                { label: '编辑', icon: 'edit', onClick: () => openEdit(r) },
                { label: r.status === 1 ? '禁用' : '启用', icon: r.status === 1 ? 'ban' : 'check',
                  onClick: () => { r.status = r.status === 1 ? 0 : 1; ctx.toast('success', r.status === 1 ? '已启用该模版' : '已禁用该模版'); render(); } },
                { label: '模型限制', icon: 'lock', onClick: () => openLimit(r) },
                { divider: true },
                { label: '删除', icon: 'trash', danger: true, onClick: () => confirmDel(r) },
              ]);
            });
            return trigger;
          } },
        ],
        rows: pageRows,
        empty: '暂无模版数据',
        pager: { page, pageSize, total: rows.length },
        onPage: p => { page = p; render(); },
        onPageSize: ps => { pageSize = ps; page = 1; render(); },
      }));
    }

    // Kling 条目专属编辑：上下架走列表按钮；这里配 名称/排序/NEW 角标/默认时长档/风格参考图上限/会员限制（保留不启用）
    function openKlingEdit(row){
      const nameIn = h('input', { class: 'input', value: row.displayName });
      const keyIn = h('input', { class: 'input mono', value: row.templateKey }); keyIn.disabled = true;
      const sortIn = h('input', { class: 'input', type: 'number', value: row.sortOrder });
      let isNewBadge = row.isNew;
      const newToggle = ctx.Toggle(isNewBadge, v => { isNewBadge = v; });
      const durSel = h('select', { class: 'select' },
        Array.from({ length: 13 }, (_, i) => i + 3).map(s => h('option', { value: s + 's' }, [s + ' 秒'])));
      durSel.value = row.defaultDuration || '5s';
      const refIn = row.refImgLimit != null
        ? h('input', { class: 'input', type: 'number', min: '1', max: '7', value: String(row.refImgLimit), style: { width: '120px' } })
        : null;
      const memberSel = h('select', { class: 'select' }, [h('option', {}, ['不限（本期全量开放）'])]);
      memberSel.disabled = true;

      const m = ctx.modal({
        title: '编辑 Kling 模型 — ' + row.displayName,
        size: 'lg',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['模型名称 *']), nameIn]),
          h('div', { class: 'field' }, [h('label', {}, ['端点 ID（fal，创建后不可改）']), keyIn]),
          h('div', { class: 'row gap10' }, [
            h('div', { class: 'field flex1' }, [h('label', {}, ['排序']), sortIn]),
            h('div', { class: 'field flex1' }, [h('label', {}, ['NEW 角标']), h('div', { class: 'mt8' }, [newToggle])]),
          ]),
          h('div', { class: 'field' }, [
            h('label', {}, ['时长档位 / 默认档']),
            h('div', { class: 'row gap10', style: { alignItems: 'center' } }, [
              h('span', { class: 'small muted' }, ['3–15 整秒 13 档（档位集合以联调 #1 实测后初始化）·默认']), durSel,
            ]),
          ]),
          refIn ? h('div', { class: 'field' }, [
            h('label', {}, ['风格参考图上限（image_urls）']),
            h('div', { class: 'row gap10', style: { alignItems: 'center' } }, [refIn, h('span', { class: 'small muted' }, ['张；实测前按 ≤4 紧口径（PRD §3.5 / 联调 #5），前端数量控制读本配置']) ]),
          ]) : null,
          h('div', { class: 'field' }, [
            h('label', {}, ['会员等级限制']),
            memberSel,
            h('div', { class: 'small muted mt8' }, ['已拍板（2026-06-12）：本期不做会员等级限制，全部模型含 4K 全量开放；配置保留不启用']),
          ]),
        ].filter(Boolean),
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const name = nameIn.value.trim();
            if (!name) { ctx.toast('warning', '请输入模型名称'); return; }
            row.displayName = name; row.sortOrder = Number(sortIn.value) || 0;
            row.isNew = isNewBadge; row.defaultDuration = durSel.value;
            if (refIn) row.refImgLimit = Number(refIn.value) || 4;
            row.updatedAt = new Date().toISOString();
            all.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
            ctx.toast('success', '保存成功（实时生效，只对新任务生效）');
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }

    function openEdit(row){
      if (row && row.kling) { openKlingEdit(row); return; }
      const isNew = !row;
      const nameIn = h('input', { class: 'input', value: row ? row.displayName : '', placeholder: '请输入模版名称' });
      const keyIn = h('input', { class: 'input', value: row ? row.templateKey : '', placeholder: '如 video_xxx' });
      const typeSel = h('select', { class: 'select' }, [['video', '视频'], ['image', '图片'], ['text', '文本']].map(([v, t]) => h('option', { value: v }, [t])));
      typeSel.value = row ? row.taskType : 'video';
      const resIn = h('input', { class: 'input', value: row ? (row.resolution || []).join(', ') : '', placeholder: '如 720p, 1080p' });
      const ratioIn = h('input', { class: 'input', value: row ? (row.ratio || []).join(', ') : '', placeholder: '如 1:1, 16:9' });
      const durIn = h('input', { class: 'input', value: row ? (row.duration || []).join(', ') : '', placeholder: '如 4s, 5s, 6s' });
      const voiceIn = h('input', { class: 'input', value: row ? (row.voice || []).join(', ') : '', placeholder: '如 有 / 无' });
      const sortIn = h('input', { class: 'input', type: 'number', value: row ? row.sortOrder : 0 });
      if (!isNew) keyIn.disabled = true; // 模版 key 创建后不可改

      const splitVals = s => s.split(/[,，、]/).map(x => x.trim()).filter(Boolean);

      const m = ctx.modal({
        title: isNew ? '新建模型' : '编辑模型',
        size: 'lg',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['模型名称 *']), nameIn]),
          h('div', { class: 'field' }, [h('label', {}, ['模版 key *']), keyIn]),
          h('div', { class: 'row gap10' }, [
            h('div', { class: 'field flex1' }, [h('label', {}, ['类型']), typeSel]),
            h('div', { class: 'field flex1' }, [h('label', {}, ['排序']), sortIn]),
          ]),
          h('div', { class: 'field' }, [h('label', {}, ['分辨率']), resIn]),
          h('div', { class: 'field' }, [h('label', {}, ['比例']), ratioIn]),
          h('div', { class: 'field' }, [h('label', {}, ['时长']), durIn]),
          h('div', { class: 'field' }, [h('label', {}, ['声音']), voiceIn]),
        ],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const name = nameIn.value.trim();
            if (!name) { ctx.toast('warning', '请输入模版名称'); return; }
            if (isNew && !keyIn.value.trim()) { ctx.toast('warning', '请输入模版 key'); return; }
            const now = new Date().toISOString();
            if (isNew) {
              all.unshift({
                ref: null, id: 'local-' + Date.now(), templateKey: keyIn.value.trim(), taskType: typeSel.value,
                displayName: name, status: 1, sortOrder: Number(sortIn.value) || 0,
                resolution: splitVals(resIn.value), ratio: splitVals(ratioIn.value),
                duration: splitVals(durIn.value), voice: splitVals(voiceIn.value),
                createdAt: now, updatedAt: now,
              });
              ctx.toast('success', '创建成功');
            } else {
              row.displayName = name; row.taskType = typeSel.value; row.sortOrder = Number(sortIn.value) || 0;
              row.resolution = splitVals(resIn.value); row.ratio = splitVals(ratioIn.value);
              row.duration = splitVals(durIn.value); row.voice = splitVals(voiceIn.value); row.updatedAt = now;
              ctx.toast('success', '更新成功');
            }
            all.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
            m.close(); render();
          } }, ['确定']),
        ],
      });
    }

    function confirmDel(row){
      const m = ctx.modal({
        title: '确认删除该模版?',
        body: [h('div', {}, ['软删除「' + (row.displayName || row.templateKey) + '」，且该模版 key 之后不可再复用。'])],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-danger', onclick: () => {
            all = all.filter(t => t !== row); ctx.toast('success', '删除成功'); m.close(); render();
          } }, ['删除']),
        ],
      });
    }

    // 行操作「…」下拉菜单：fixed 定位挂 body，避开 .table-wrap 的 overflow:hidden 裁切
    function openActionMenu(anchor, items){
      document.querySelectorAll('.act-pop,.act-overlay').forEach(n => n.remove());
      const overlay = h('div', { class: 'act-overlay' });
      const pop = h('div', { class: 'act-pop' });
      pop.style.visibility = 'hidden';
      function close(){ overlay.remove(); pop.remove(); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close, true); }
      items.forEach(it => {
        if (it.divider) { pop.appendChild(h('div', { class: 'act-sep' })); return; }
        pop.appendChild(h('button', { class: 'act-item' + (it.danger ? ' danger' : ''),
          onclick: () => { close(); it.onClick && it.onClick(); } }, [
            it.icon ? h('span', { class: 'act-ic', html: ctx.icon(it.icon, 15) }) : null,
            h('span', {}, [it.label]),
          ].filter(Boolean)));
      });
      overlay.addEventListener('click', close);
      document.body.appendChild(overlay);
      document.body.appendChild(pop);
      const rect = anchor.getBoundingClientRect();
      let left = rect.right - pop.offsetWidth; if (left < 8) left = 8;
      let top = rect.bottom + 6; if (top + pop.offsetHeight > window.innerHeight - 8) top = rect.top - pop.offsetHeight - 6;
      pop.style.left = left + 'px'; pop.style.top = top + 'px'; pop.style.visibility = 'visible';
      window.addEventListener('scroll', close, true); window.addEventListener('resize', close, true);
    }

    // ===== 「详情」：查看归属在某用户群体下的真实用户名单 =====
    // 内部会员名单（internal_members 接口为空时，用现成邀请记录里的真实用户兜底合成示意）
    function internalRows(){
      const im = ctx.data.internal_members || {};
      let rows = im.items || im.list || (im.data && (im.data.items || im.data.list)) || [];
      if (!rows.length) rows = ((ctx.data.invite_history && ctx.data.invite_history.items) || []).slice(0, 8);
      return rows.map(u => ({
        userId: u.userId || u.id || '—', username: u.username || '—', email: u.email || '—',
        ts: u.createdAtUnixSecond || u.setAtUnixSecond,
      }));
    }
    // 搜索：单词 + 批量（分隔符 空格/逗号/中文逗号/分号/顿号/换行）；命中即任一词为子串
    function parseTerms(s){ return (s || '').toLowerCase().split(/[\s,，;；、]+/).filter(Boolean); }
    function matchTerms(hay, terms){ return !terms.length || terms.some(t => hay.includes(t)); }

    // 限制次数（总额度）：按 模型×用户 关联存 window.__USAGE_LIMIT
    // 默认随「前面是否勾选禁用」而定：blocked=true(已勾禁用) → 默认 0（一次不能用，可逐个放开）；否则默认不限。手动调整 / 模拟使用 -1 / 用尽即禁用（演示前端控制）
    function usageCell(modelKey, userKey, blocked){
      const store = (window.__USAGE_LIMIT = window.__USAGE_LIMIT || {});
      const bucket = (store[modelKey] = store[modelKey] || {});
      const st = (bucket[userKey] = bucket[userKey] || (blocked ? { limit: 0, remaining: 0 } : { limit: null, remaining: null }));
      const input = h('input', { class: 'input', type: 'number', min: '0', placeholder: '不限',
        value: st.limit == null ? '' : String(st.limit), style: { width: '74px', flexShrink: '0' } });
      const status = h('span', { class: 'small', style: { minWidth: '92px' } });
      const useBtn = h('button', { class: 'btn btn-sm', style: { flexShrink: '0' } }, ['模拟使用 -1']);
      function paint(){
        if (st.limit == null){ status.textContent = '不限'; status.style.color = 'var(--muted-foreground)'; useBtn.disabled = true; useBtn.style.opacity = '.45'; }
        else if (st.remaining <= 0){ status.textContent = '已用尽 · 禁用'; status.style.color = '#f87171'; useBtn.disabled = true; useBtn.style.opacity = '.45'; }
        else { status.textContent = '剩余 ' + st.remaining + ' / ' + st.limit; status.style.color = 'var(--foreground)'; useBtn.disabled = false; useBtn.style.opacity = '1'; }
      }
      input.addEventListener('change', () => {
        const v = input.value.trim();
        if (v === '' || isNaN(+v) || +v < 0){ st.limit = null; st.remaining = null; input.value = ''; }
        else { st.limit = Math.floor(+v); st.remaining = st.limit; }
        paint();
      });
      useBtn.addEventListener('click', () => {
        if (st.limit == null || st.remaining <= 0) return;
        st.remaining -= 1; paint();
        if (st.remaining === 0) ctx.toast('warning', '该用户本模型次数已用尽，前端将禁止其继续使用');
      });
      paint();
      return h('div', { class: 'row gap6', style: { alignItems: 'center', flexWrap: 'wrap' } }, [input, status, useBtn]);
    }

    // 某群体的全部用户 key（用于"勾选即全员限制 / 取消即全员放开"批量写入）
    function groupUserKeys(groupKey){
      if (groupKey === 'internal') return internalRows().map(r => r.userId);
      return [];
    }
    // 勾选某群体 → 该群体全部用户立刻置为不可用(0/0)；取消勾选 → 全部恢复不限
    function applyGroupBlock(modelKey, groupKey, blocked){
      const store = (window.__USAGE_LIMIT = window.__USAGE_LIMIT || {});
      const bucket = (store[modelKey] = store[modelKey] || {});
      groupUserKeys(groupKey).forEach(k => { bucket[k] = blocked ? { limit: 0, remaining: 0 } : { limit: null, remaining: null }; });
    }

    // 点「详情」打开归属用户名单弹窗（叠在模型限制弹窗之上，现仅内部会员群体）。blocked = 该群体在上一层是否已勾选禁用（决定限次默认值）
    function openGroupDetail(label, model, blocked){
      const modelKey = (model && (model.templateKey || model.displayName)) || 'unknown';
      const modelName = (model && model.displayName) || '本模型';
      const usageNote = '限制次数＝该用户对本模型「' + modelName + '」的可用次数，用尽后前端禁止使用；'
        + (blocked ? '该群体已勾选禁用，默认 0 次（一次不能用），可逐个放开。' : '留空＝不限。');
      // 搜索栏：输入框 + 搜索按钮 + 命中计数（实时过滤，单词/批量；按钮/回车同样触发）
      const input = h('input', { class: 'input', placeholder: '搜索 邮箱 / 用户名 / 用户ID，支持批量（空格、逗号或换行分隔）', style: { flex: '1', minWidth: '280px' } });
      const searchBtn = h('button', { class: 'btn btn-primary', style: { flexShrink: '0' }, onclick: () => draw() }, ['🔍 搜索']);
      const countEl = h('span', { class: 'small muted', style: { flexShrink: '0' } }, []);
      const bar = h('div', { class: 'row gap10', style: { alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' } }, [input, searchBtn, countEl]);
      const allRows = internalRows();
      const tbl = h('div');
      function draw(){
        const terms = parseTerms(input.value);
        const rows = allRows.filter(r => matchTerms((r.userId + ' ' + r.username + ' ' + r.email).toLowerCase(), terms));
        countEl.textContent = '匹配 ' + rows.length + ' / ' + allRows.length + ' 人';
        tbl.innerHTML = '';
        tbl.appendChild(ctx.DataTable({ columns: [
          { title: '用户ID', width: 140, render: r => ctx.IdCell(r.userId, 10) },
          { title: '用户名', render: r => r.username },
          { title: '邮箱', render: r => r.email },
          { title: '设为内部时间', width: 150, align: 'center', render: r => ctx.fmtUnix(r.ts) },
          { title: '限制次数（本模型）', width: 280, render: r => usageCell(modelKey, r.userId, blocked) },
        ], rows, empty: terms.length ? '无匹配用户' : '暂无内部会员' }));
      }
      input.addEventListener('input', draw);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') draw(); });
      draw();
      const body = [h('div', { class: 'small muted', style: { marginBottom: '8px' } }, ['拥有内部赠送权益的账号名单，共 ' + allRows.length + ' 人。' + usageNote]), bar, tbl];
      const m = ctx.modal({ size: 'lg', title: '用户详情 — ' + label, body,
        footer: [h('button', { class: 'btn', onclick: () => m.close() }, ['关闭'])] });
    }

    // 模型限制：按用户群体「黑名单」勾选（勾选=禁止使用，空=全员可用）+ 可选「分辨率档」范围（不选=整模型，选中=仅锁这些档）
    function openLimit(row){
      const sel = new Set(row.restrictGroups || []);
      const allKeys = LIMIT_GROUPS.flatMap(s => s.items.map(it => it.key));
      const modelKey = row.templateKey || row.displayName || 'unknown';
      const cards = {};
      const countEl = h('span', { class: 'small muted' }, []);

      // 分辨率档范围（仅当模型有分辨率档时展示；不选 = 限制整模型全部分辨率）
      const resList = (row.resolution || []).filter(Boolean);
      const resSel = new Set((row.restrictResolutions || []).filter(r => resList.includes(r)));
      const resPills = {};

      function updateCount(){
        if (!sel.size) { countEl.textContent = '未设限制（全员可用）'; return; }
        let scope = '';
        if (resList.length) scope = resSel.size
          ? ('，仅锁 ' + resList.filter(r => resSel.has(r)).join('/') + ' 档')
          : '，全部分辨率';
        countEl.textContent = '已禁止 ' + sel.size + ' 个群体' + scope;
      }
      function paint(){
        allKeys.forEach(k => cards[k] && cards[k].classList.toggle('on', sel.has(k)));
        updateCount();
      }
      function paintRes(){
        resList.forEach(r => {
          const on = resSel.has(r); const el = resPills[r]; if (!el) return;
          el.style.borderColor = on ? 'var(--primary)' : 'var(--border)';
          el.style.background  = on ? 'var(--accent)'  : 'transparent';
          el.style.color       = on ? 'var(--primary)' : 'var(--foreground)';
          el.style.fontWeight  = on ? '600' : '500';
        });
        updateCount();
      }

      const grid = h('div', { class: 'col', style: { gap: '8px' } });
      LIMIT_GROUPS.forEach(s => {
        grid.appendChild(h('div', { class: 'chk-section-label' }, [s.section]));
        const g = h('div', { class: 'chk-grid' });
        s.items.forEach(it => {
          const card = h('div', { class: 'chk', onclick: () => { const on = !sel.has(it.key); if (on) sel.add(it.key); else sel.delete(it.key); applyGroupBlock(modelKey, it.key, on); paint(); } }, [
            h('span', { class: 'chk-box' }, ['✓']),
            h('div', { style: { flex: '1', minWidth: '0' } }, [
              h('div', { class: 'chk-label' }, [it.label]),
              it.hint ? h('div', { class: 'chk-hint' }, [it.hint]) : null,
            ].filter(Boolean)),
            it.detail ? h('button', { class: 'btn btn-sm', style: { flexShrink: '0' },
              onclick: (e) => { e.stopPropagation(); openGroupDetail(it.label, row, sel.has(it.key)); } }, ['详情']) : null,
          ].filter(Boolean));
          cards[it.key] = card;
          g.appendChild(card);
        });
        grid.appendChild(g);
      });

      const resSection = resList.length ? h('div', { class: 'col', style: { gap: '6px', marginTop: '2px' } }, [
        h('div', { class: 'chk-section-label' }, ['限制分辨率档（可选）']),
        h('div', { class: 'chk-hint' }, ['不选＝限制整模型全部分辨率；选中＝仅锁定选中的分辨率档，其余档不受影响（如成本过高的 4K：仅锁 4K，720p/1080p 仍可用）。']),
        h('div', { class: 'row gap6', style: { flexWrap: 'wrap' } }, resList.map(r => {
          const el = h('button', { class: 'btn btn-sm', style: { borderRadius: '999px' },
            onclick: () => { resSel.has(r) ? resSel.delete(r) : resSel.add(r); paintRes(); } }, [r]);
          resPills[r] = el; return el;
        })),
      ]) : null;

      const m = ctx.modal({
        title: '模型限制 — ' + (row.displayName || row.templateKey),
        body: [
          h('div', { class: 'small muted' }, ['勾选的用户群体将被禁止使用该模型，常用于成本过高的模型（如避免内部会员消耗）。不勾选 = 全员可用。']),
          h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }, [
            countEl,
            h('div', { class: 'row gap10' }, [
              h('button', { class: 'btn btn-sm', onclick: () => { allKeys.forEach(k => { sel.add(k); applyGroupBlock(modelKey, k, true); }); paint(); } }, ['全部禁止']),
              h('button', { class: 'btn btn-sm', onclick: () => { allKeys.forEach(k => applyGroupBlock(modelKey, k, false)); sel.clear(); paint(); } }, ['清空']),
            ]),
          ]),
          grid,
          resSection,
        ].filter(Boolean),
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            row.restrictGroups = allKeys.filter(k => sel.has(k));
            row.restrictResolutions = resList.filter(r => resSel.has(r));
            const scoped = row.restrictGroups.length && row.restrictResolutions.length;
            ctx.toast('success', row.restrictGroups.length
              ? ('已保存模型限制' + (scoped ? ('（仅锁 ' + row.restrictResolutions.join('/') + ' 档）') : '') + '，仅对新任务生效')
              : '已清除该模型的限制');
            m.close(); render();
          } }, ['确定']),
        ],
      });
      paint(); paintRes();
    }

    render();
  }
};
