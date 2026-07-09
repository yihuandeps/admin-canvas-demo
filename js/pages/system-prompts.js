// 系统提示词 — 模型管理（源站源码还原：node_11.js）
window.Pages['system-prompts'] = {
  render(root, ctx){
    const { h } = ctx;

    const TYPE_LABEL = { VIDEO: '视频', IMAGE: '图片', TEXT: '文本' };
    const TYPES = ['VIDEO', 'IMAGE', 'TEXT'];

    // 分类：{type,categoryKey,category}
    const categories = ((ctx.data.prompt_categories && ctx.data.prompt_categories.categories) || []).map(c => ({
      type: c.type, categoryKey: c.categoryKey, category: c.category,
    }));
    // 提示词：{id,type,category,categoryKey,title,sortOrder,position,createdAt,updatedAt,promptZh,promptEn}
    let all = ((ctx.data.system_prompts && ctx.data.system_prompts.prompts) || []).map(p => ({
      ref: p,
      id: p.id, type: p.type, category: p.category || '', categoryKey: p.categoryKey || '',
      title: p.title || '', sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : 0,
      position: p.position == null ? null : p.position,
      createdAt: p.createdAt || '', updatedAt: p.updatedAt || '',
      promptZh: p.promptZh || '', promptEn: p.promptEn || '',
      videoUrl: p.videoUrl || '', videoName: p.videoName || '',
    }));

    let curType = TYPES[0];
    let curCat = '';
    let page = 1, pageSize = 10;

    function catsOfType(t){ return categories.filter(c => c.type === t); }
    function ensureCat(){
      const cs = catsOfType(curType);
      if (!curCat || !cs.some(c => c.categoryKey === curCat)) curCat = cs[0] ? cs[0].categoryKey : '';
    }
    ensureCat();

    root.appendChild(ctx.PageHeader({
      breadcrumb: ['模型管理', '系统提示词'],
      title: '系统提示词',
      desc: '按媒体类型与分类管理 AI 生成任务的预设提示词模板',
    }));
    const container = h('div');
    root.appendChild(container);

    function applied(){
      return all.filter(p => p.type === curType && p.categoryKey === curCat);
    }

    function render(){
      container.innerHTML = '';
      ensureCat();

      // 一级 Tab：视频 / 图片 / 文本
      const tabBar = h('div', { class: 'tabs mb12' }, TYPES.map(t =>
        h('button', { class: curType === t ? 'active' : '', onclick: () => { curType = t; page = 1; const cs = catsOfType(t); curCat = cs[0] ? cs[0].categoryKey : ''; render(); } }, [TYPE_LABEL[t]])
      ));
      container.appendChild(tabBar);

      const cs = catsOfType(curType);
      if (!cs.length){
        container.appendChild(h('div', { class: 'panel card-pad' }, [
          h('div', { class: 'empty-state' }, [
            h('p', { class: 'muted' }, ['该一级分类下还没有二级分类，点击下方按钮创建第一个提示词']),
            h('button', { class: 'btn btn-primary mt8', onclick: () => openEdit(null) }, ['+ 新建提示词']),
          ]),
        ]));
        return;
      }

      // 二级分类 sub-tabs + 操作区
      const subTabs = h('div', { class: 'tabs', style: { flexWrap: 'wrap' } }, cs.map(c =>
        h('button', { class: curCat === c.categoryKey ? 'active' : '', title: c.categoryKey, onclick: () => { curCat = c.categoryKey; page = 1; render(); } }, [c.category])
      ));
      const subActions = h('div', { class: 'row gap6' }, [
        h('button', { class: 'btn btn-danger', onclick: () => delCategory() }, ['删除当前分类']),
        h('button', { class: 'btn btn-primary', onclick: () => openEdit(null) }, ['+ 新建提示词']),
      ]);
      container.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [subTabs, subActions]));

      const rows = applied();
      const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

      container.appendChild(ctx.DataTable({
        columns: [
          { title: '排序', width: 80, align: 'center', render: r => h('span', { class: 'small' }, [String(r.sortOrder)]) },
          { title: 'ID', width: 280, render: r => ctx.IdCell(r.id, 18) },
          { title: '标题', width: 240, render: r => r.title || '—' },
          { title: '分类 Key', width: 180, render: r => h('span', { class: 'mono small' }, [r.categoryKey || '—']) },
          { title: '插入位置', width: 200, render: r => r.position == null ? '-' : h('span', { class: 'mono small' }, [JSON.stringify(r.position)]) },
          { title: '创建时间', width: 200, align: 'center', render: r => ctx.fmtISO(r.createdAt) },
          { title: '操作', width: 180, align: 'center', render: r => h('div', { class: 'row gap6', style: { justifyContent: 'center' } }, [
            h('button', { class: 'btn btn-sm', onclick: () => openEdit(r) }, ['编辑']),
            h('button', { class: 'btn btn-sm btn-danger', onclick: () => confirmDel(r) }, ['删除']),
          ]) },
        ],
        rows: pageRows,
        empty: '暂无提示词',
        pager: { page, pageSize, total: rows.length },
        onPage: p => { page = p; render(); },
        onPageSize: ps => { pageSize = ps; page = 1; render(); },
      }));
    }

    function openEdit(row){
      const isNew = !row;
      const cs = catsOfType(curType);
      // 二级分类：可自由输入（已有分类作为输入建议，不限制只能选已有）
      const catListId = 'cat-list-' + curType;
      const catList = h('datalist', { id: catListId }, cs.map(c => h('option', { value: c.category }, [c.categoryKey])));
      const curCatName = (cs.find(c => c.categoryKey === curCat) || {}).category || '';
      const catIn = h('input', { class: 'input', list: catListId, placeholder: '输入二级分类名称（可新建，亦可从下拉选已有）',
        value: row ? (row.category || row.categoryKey) : curCatName });
      const titleIn = h('input', { class: 'input', value: row ? row.title : '', placeholder: '请输入提示词标题', maxlength: '50' });
      const zhIn = h('textarea', { class: 'textarea', placeholder: '请输入中文提示词' }); zhIn.value = row ? row.promptZh : '';
      const enIn = h('textarea', { class: 'textarea', placeholder: '请输入英文提示词' }); enIn.value = row ? row.promptEn : '';
      const sortIn = h('input', { class: 'input', type: 'number', min: '1', max: '100', value: row ? row.sortOrder : 1 });
      const posIn = h('textarea', { class: 'textarea mono', placeholder: '{"x": 0, "y": 0}' });
      posIn.value = row && row.position != null ? JSON.stringify(row.position, null, 2) : '';

      // 示例视频上传（本地预览，URL.createObjectURL）
      let videoUrl = row && row.videoUrl ? row.videoUrl : '';
      let videoName = row && row.videoName ? row.videoName : '';
      const fileIn = h('input', { type: 'file', accept: 'video/*', style: { display: 'none' } });
      const preview = h('video', { controls: 'controls',
        style: { display: videoUrl ? 'block' : 'none', maxWidth: '100%', maxHeight: '240px', marginTop: '10px', borderRadius: '6px', background: '#000' } });
      if (videoUrl) preview.src = videoUrl;
      const nameLbl = h('span', { class: 'small muted', style: { marginLeft: '10px' } }, [videoName || '未选择文件']);
      const clearBtn = h('button', { class: 'btn btn-sm btn-danger',
        style: { marginLeft: '8px', display: videoUrl ? 'inline-block' : 'none' },
        onclick: () => { videoUrl = ''; videoName = ''; preview.src = ''; preview.style.display = 'none';
          nameLbl.textContent = '未选择文件'; clearBtn.style.display = 'none'; fileIn.value = ''; } }, ['移除']);
      const pickBtn = h('button', { class: 'btn btn-sm', onclick: () => fileIn.click() }, ['选择视频文件']);
      fileIn.addEventListener('change', () => {
        const f = fileIn.files && fileIn.files[0];
        if (!f) return;
        if (!f.type.startsWith('video/')) { ctx.toast('error', '请选择视频文件'); fileIn.value = ''; return; }
        if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
        videoUrl = URL.createObjectURL(f); videoName = f.name;
        preview.src = videoUrl; preview.style.display = 'block';
        nameLbl.textContent = f.name + '（' + (f.size / 1024 / 1024).toFixed(1) + ' MB）';
        clearBtn.style.display = 'inline-block';
      });

      const m = ctx.modal({
        title: isNew ? '新建系统提示词' : '编辑系统提示词',
        size: 'lg',
        body: [
          h('div', { class: 'field' }, [h('label', {}, ['一级分类']), h('div', { class: 'mono small muted' }, [TYPE_LABEL[curType]])]),
          h('div', { class: 'field' }, [h('label', {}, ['二级分类']), catIn, catList]),
          h('div', { class: 'field' }, [h('label', {}, ['示例视频（可选）']),
            h('div', { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' } }, [pickBtn, clearBtn, nameLbl, fileIn]),
            preview]),
          h('div', { class: 'field' }, [h('label', {}, ['提示词标题（1-50 个字符）']), titleIn]),
          h('div', { class: 'field' }, [h('label', {}, ['中文提示词']), zhIn]),
          h('div', { class: 'field' }, [h('label', {}, ['英文提示词']), enIn]),
          h('div', { class: 'field' }, [h('label', {}, ['排序（1-100，越小越靠前）']), sortIn]),
          h('div', { class: 'field' }, [h('label', {}, ['插入位置（可选 JSON，留空=不设置）']), posIn]),
        ],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-primary', onclick: () => {
            const title = titleIn.value.trim();
            if (!title || title.length > 50) { ctx.toast('error', '标题长度需为 1-50 个字符'); return; }
            if (!zhIn.value.trim() && !enIn.value.trim()) { ctx.toast('error', '中文 / 英文提示词至少填一个'); return; }
            const so = Number(sortIn.value);
            if (!(so >= 1 && so <= 100)) { ctx.toast('error', '排序需为 1-100 之间的整数'); return; }
            const raw = posIn.value.trim();
            let pos = null;
            if (raw) { try { pos = JSON.parse(raw); } catch { ctx.toast('error', 'JSON 格式错误'); return; } }
            const catTyped = catIn.value.trim();
            if (!catTyped) { ctx.toast('error', '请填写二级分类'); return; }
            // 自由输入：匹配到已有分类则复用其 name/key，否则按输入新建（name=key=输入值）
            const existCat = cs.find(c => c.category === catTyped || c.categoryKey === catTyped) || {};
            const catName = existCat.category || catTyped;
            const catKey = existCat.categoryKey || catTyped;
            const now = new Date().toISOString();
            if (isNew) {
              all.unshift({ ref: null, id: 'local-' + Date.now(), type: curType, category: catName, categoryKey: catKey,
                title, sortOrder: so, position: pos, createdAt: now, updatedAt: now, promptZh: zhIn.value, promptEn: enIn.value,
                videoUrl, videoName });
              ctx.toast('success', '创建成功');
            } else {
              row.title = title; row.categoryKey = catKey; row.category = catName;
              row.sortOrder = so; row.position = pos; row.promptZh = zhIn.value; row.promptEn = enIn.value; row.updatedAt = now;
              row.videoUrl = videoUrl; row.videoName = videoName;
              ctx.toast('success', '更新成功');
            }
            m.close(); render();
          } }, [isNew ? '创建' : '保存']),
        ],
      });
    }

    function confirmDel(row){
      const m = ctx.modal({
        title: '确认删除',
        body: [h('div', {}, ['删除后无法恢复「' + (row.title || row.id) + '」'])],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-danger', onclick: () => {
            all = all.filter(p => p !== row); ctx.toast('success', '删除成功'); m.close(); render();
          } }, ['确认删除']),
        ],
      });
    }

    function delCategory(){
      const cat = catsOfType(curType).find(c => c.categoryKey === curCat);
      if (!cat) return;
      const m = ctx.modal({
        title: '确认删除该分类?',
        body: [h('div', {}, ['将软删 ' + cat.category + ' (' + cat.categoryKey + ') 下的全部提示词，操作不可恢复（需走 SQL）。'])],
        footer: [
          h('button', { class: 'btn', onclick: () => m.close() }, ['取消']),
          h('button', { class: 'btn btn-danger', onclick: () => {
            const n = applied().length;
            all = all.filter(p => !(p.type === curType && p.categoryKey === curCat));
            const idx = categories.findIndex(c => c.type === curType && c.categoryKey === curCat);
            if (idx >= 0) categories.splice(idx, 1);
            ctx.toast('success', '已删除分类，清理 ' + n + ' 条提示词');
            curCat = ''; page = 1; m.close(); render();
          } }, ['确认删除']),
        ],
      });
    }

    render();
  }
};
