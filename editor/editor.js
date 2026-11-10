(function () {
  'use strict';
  const P = window.VoluntaryLeaveCopyPatches;
  const sources = window.VoluntaryLeaveCopySources;
  const scenes = window.VoluntaryLeaveEditorScenes;
  const $ = id => document.getElementById(id);
  const make = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const storageKey = `voluntary-leaving-copy-editor:v1:${sources.baseline}`;
  let draft = P.createDraft(sources.baseline);
  let api = null;
  let records = [];
  let selected = null;
  let currentScene = scenes.find(scene => scene.id === location.hash.slice(1)) || scenes[0];
  let filter = 'all';
  let mode = 'edit';
  let undo = [];
  let sourceCache = new Map();
  let autosaveFailed = false;
  let initialProblem = '';
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const result = P.validateDraft(stored, sources.baseline);
      if (result.ok) draft = result.value;
      else initialProblem = `已保存的草稿无法载入：${result.errors.join(' ')} 原始数据仍保留在浏览器中，请交由开发恢复；本次新编辑请及时导出。`;
    }
  } catch (_) { initialProblem = '浏览器未允许读取本地草稿。可以编辑，但请及时导出修改包保存。'; }

  function notice(message, error = true) {
    $('app-notice').textContent = message;
    $('app-notice').hidden = !message;
    $('app-notice').style.background = error ? '#fff4da' : '#edf7f2';
  }

  function persist() {
    try {
      if (initialProblem) throw new Error(initialProblem);
      localStorage.setItem(storageKey, P.exportDraft(draft));
      $('save-status').textContent = '● 已保存到本浏览器';
      autosaveFailed = false;
    } catch (_) {
      autosaveFailed = true;
      $('save-status').textContent = '本地保存失败，请导出';
      notice('草稿当前仅保留在页面内存中，请用「导出修改包」保存后再离开。');
    }
    updateCounts();
  }

  function checkpoint() {
    undo.push(P.exportDraft(draft));
    if (undo.length > 30) undo.shift();
    $('undo-copy').disabled = !undo.length;
  }

  function changedScenes() {
    return new Set(draft.entries.flatMap(entry => entry.scenes));
  }

  function updateCounts() {
    $('change-count').textContent = draft.entries.length;
    const count = draft.reviewedScenes.filter(id => scenes.some(scene => scene.id === id)).length;
    $('review-progress').textContent = `${count} / ${scenes.length}`;
    $('review-bar').max = scenes.length;
    $('review-bar').value = count;
    $('scene-reviewed').checked = draft.reviewedScenes.includes(currentScene.id);
    $('undo-copy').disabled = !undo.length;
    const changed = changedScenes();
    for (const row of $('scene-list').querySelectorAll('[data-scene-id]')) {
      row.classList.toggle('changed', changed.has(row.dataset.sceneId));
      row.classList.toggle('reviewed', draft.reviewedScenes.includes(row.dataset.sceneId));
    }
  }

  function renderScenes() {
    const query = $('scene-search').value.trim().toLowerCase();
    const changed = changedScenes();
    const filtered = scenes.filter(scene => {
      const match = [scene.title, scene.group, scene.description, ...(scene.keywords || [])].join(' ').toLowerCase().includes(query);
      return match && (filter !== 'pending' || !draft.reviewedScenes.includes(scene.id)) && (filter !== 'changed' || changed.has(scene.id));
    });
    $('scene-count').textContent = `${filtered.length} 个场景`;
    $('scene-list').replaceChildren();
    const groups = new Map();
    for (const scene of filtered) {
      let section = groups.get(scene.group);
      if (!section) {
        section = make('section', undefined, 'scene-section');
        section.append(make('h3', scene.group));
        groups.set(scene.group, section);
        $('scene-list').append(section);
      }
      const row = make('button', undefined, 'scene-row');
      row.dataset.sceneId = scene.id;
      row.classList.toggle('active', currentScene.id === scene.id);
      row.classList.toggle('reviewed', draft.reviewedScenes.includes(scene.id));
      row.classList.toggle('changed', changed.has(scene.id));
      row.setAttribute('aria-current', currentScene.id === scene.id ? 'page' : 'false');
      row.title = scene.description;
      row.append(make('span', '', 'scene-dot'), make('span', scene.title));
      row.addEventListener('click', () => openScene(scene));
      section.append(row);
    }
    if (!filtered.length) $('scene-list').append(make('p', '没有符合条件的场景。', 'empty-list'));
  }

  function openScene(scene) {
    currentScene = scene;
    selected = null;
    records = [];
    $('scene-group').textContent = scene.group;
    $('scene-title').textContent = scene.title;
    $('scene-description').textContent = scene.description;
    history.replaceState(null, '', `#${scene.id}`);
    showInspector();
    $('copy-form').hidden = true;
    $('inspector-empty').hidden = false;
    $('preview-stage').scrollTop = 0;
    $('preview-stage').scrollLeft = 0;
    api?.loadScene(scene);
    api?.setEdits(draft.entries);
    renderScenes();
    updateCounts();
  }

  function sourceFor(record) {
    const key = `${record.kind}:${record.original}`;
    if (sourceCache.has(key)) return sourceCache.get(key);
    const needle = record.kind === 'image-note' ? (record.assetPath || '').replace(/^\.\//, '') : record.original;
    const candidates = [];
    let total = 0;
    if (needle.length >= 2) {
      for (const file of sources.files) {
        if (file.path.endsWith('.css')) continue;
        let position = file.content.indexOf(needle);
        while (position !== -1) {
          total += 1;
          if (candidates.length < 20) {
            const line = file.content.slice(0, position).split('\n').length;
            candidates.push({ path: file.path, line, offset: position, matchedText: needle, sha256: file.sha256 });
          }
          position = file.content.indexOf(needle, position + Math.max(1, needle.length));
        }
      }
    }
    const result = { candidates, matchCount: total, method: total ? 'exact-substring-candidates' : 'rendered-context', assetPath: record.assetPath || null };
    sourceCache.set(key, result);
    return result;
  }

  function selectRecord(record) {
    selected = record;
    showInspector();
    $('copy-form').hidden = !record;
    $('inspector-empty').hidden = Boolean(record);
    if (!record) return;
    const entry = draft.entries.find(item => item.id === record.id);
    $('copy-original').value = record.original;
    $('copy-replacement').value = entry ? entry.replacement : record.kind === 'image-note' ? '' : record.original;
    $('copy-replacement').placeholder = record.kind === 'image-note' ? '填写图片内需替换的文字与位置' : '输入修改后的文案';
    $('copy-note').value = entry?.note || '';
    $('entry-kind').textContent = record.kind === 'image-note' ? '图片改稿备注' : record.kind === 'attribute' ? (record.label || '控件说明') : '页面文字';
    $('image-guidance').hidden = record.kind !== 'image-note';
    $('entry-id').textContent = record.id;
    const source = sourceFor(record);
    $('source-description').textContent = source.matchCount === 1 ? '找到 1 处源码候选。合稿时仍会核对上下文与语法，修改仅在当前场景预览。' : source.matchCount ? `找到 ${source.matchCount} 处源码候选。此处仅修改当前场景；导出记录会保留定位，由开发核对共用关系。` : '这段文字由运行时组合生成，导出会保留场景、原文和显示位置，供开发核对。';
    $('source-locations').replaceChildren();
    for (const candidate of source.candidates.slice(0, 6)) {
      $('source-locations').append(make('div', `${candidate.path}:${candidate.line}`, 'source-row'));
    }
    paintEntryStatus();
  }

  function paintEntryStatus() {
    if (!selected) return;
    $('entry-state').textContent = draft.entries.some(item => item.id === selected.id) ? '已记录修改' : '未修改';
    $('character-count').textContent = `${$('copy-replacement').value.length} 字符`;
    const warnings = [...new Set([...P.riskWarnings(selected.original), ...P.riskWarnings($('copy-replacement').value)])];
    $('risk-notice').hidden = !warnings.length;
    $('risk-notice').textContent = warnings.join(' ') + (warnings.length ? ' 修改将作为建议交付，合稿时核对相关线索。' : '');
  }

  function changeCopy() {
    if (!selected) return;
    try {
      const context = api?.getState() || {};
      delete context.preEndingState;
      delete context.toasts;
      delete context.messageLog;
      const source = { ...sourceFor(selected), sceneTitle: currentScene.title, context };
      // Preview records cross an iframe realm; normalize to local plain JSON
      // before the strict data model checks object prototypes.
      draft = P.updateEntry(draft, JSON.parse(JSON.stringify({
        id: selected.id, kind: selected.kind, original: selected.original,
        replacement: $('copy-replacement').value,
        locator: selected.locator, scenes: selected.scenes,
        note: $('copy-note').value, source
      })));
      api?.setEdits(draft.entries);
      paintEntryStatus();
      persist();
    } catch (error) { notice(`未保存此次修改：${error.message}`); }
  }

  function showInspector() {
    $('text-list-panel').hidden = true;
    $('inspector-tab').classList.add('active');
    $('text-list-tab').classList.remove('active');
    $('copy-form').hidden = !selected;
    $('inspector-empty').hidden = Boolean(selected);
  }

  function renderTextList() {
    $('text-list').replaceChildren();
    const query = $('text-search').value.trim().toLowerCase();
    const matches = records.filter(record => [record.original, record.label, draft.entries.find(entry => entry.id === record.id)?.replacement || ''].join(' ').toLowerCase().includes(query));
    for (const record of matches) {
      const entry = draft.entries.find(item => item.id === record.id);
      const row = make('button', undefined, `text-item${entry ? ' changed' : ''}`);
      row.append(make('small', `${record.label || record.kind}${record.visible === false ? ' · 折叠或隐藏内容' : ''}${entry ? ' · 已修改' : ''}`));
      row.append(make('span', (entry?.replacement || record.original).slice(0, 170)));
      row.addEventListener('click', () => { api?.select(record.id); selectRecord(record); });
      $('text-list').append(row);
    }
    if (!matches.length) $('text-list').append(make('p', '没有匹配的文字。', 'empty-list'));
  }

  function fitPreview() {
    const stage = $('preview-stage');
    const width = $('viewport').value === 'mobile' ? 390 : 1280;
    const available = Math.max(120, stage.clientWidth - (innerWidth <= 850 ? 20 : 44));
    const scale = $('zoom').value === 'fit' ? Math.min(1, available / width) : Number($('zoom').value);
    const height = Math.max($('viewport').value === 'mobile' ? 844 : 900, (stage.clientHeight - 50) / scale);
    $('frame-sizer').style.width = `${width * scale}px`;
    $('frame-sizer').style.height = `${height * scale}px`;
    $('game-preview').style.width = `${width}px`;
    $('game-preview').style.height = `${height}px`;
    $('game-preview').style.transform = `scale(${scale})`;
  }

  function download(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = make('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function stamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  function exportChanges() {
    download(P.exportDraft(draft), `自愿离校-文案修改-${stamp()}.json`, 'application/json');
    $('save-status').textContent = '修改包已导出';
  }

  function readableChanges() {
    const lines = ['# 自愿离校 · 文案修改记录', '', `基准：${sources.baseline}`, `修改条目：${draft.entries.length}；已审场景：${draft.reviewedScenes.length}/${scenes.length}`, '', 'JSON 修改包是合稿依据，此清单仅供阅读。', ''];
    for (const [index, entry] of draft.entries.entries()) {
      lines.push(`## ${index + 1}. ${entry.source?.sceneTitle || entry.scenes.join(' / ')}`, '', `标识：${entry.id}`, `类型：${entry.kind}`, '', '原文：', entry.original, '', entry.kind === 'image-note' ? '改图要求：' : '修改稿：', entry.replacement, '', `备注：${entry.note || '无'}`, '');
      for (const candidate of entry.source?.candidates || []) lines.push(`源码候选：${candidate.path}:${candidate.line}`);
      lines.push('');
    }
    download(lines.join('\n'), `自愿离校-文案清单-${stamp()}.md`, 'text/markdown;charset=utf-8');
  }

  function showChanges() {
    $('changes-list').replaceChildren();
    for (const entry of draft.entries) {
      const row = make('section', undefined, 'change-row');
      const heading = make('h3');
      heading.append(make('span', `${entry.source?.sceneTitle || entry.scenes[0]} · ${entry.kind === 'image-note' ? '图片备注' : '文案'}`));
      const locate = make('button', '定位');
      locate.addEventListener('click', () => {
        const scene = scenes.find(item => item.id === entry.scenes[0]);
        $('changes-dialog').close();
        if (scene) {
          // Imported context is descriptive metadata, never executable game state.
          openScene(scene);
          const record = records.find(item => item.id === entry.id);
          if (record) { api?.select(entry.id); selectRecord(record); }
          else notice('已打开关联场景。该文字可能属于交互产生的瞬时状态，请在本页文字中查找原文。');
        }
      });
      heading.append(locate);
      row.append(heading, make('pre', entry.original, 'before'), make('pre', entry.replacement || '（仅备注）', 'after'));
      if (entry.note) row.append(make('p', `备注：${entry.note}`));
      $('changes-list').append(row);
    }
    if (!draft.entries.length) $('changes-list').append(make('p', '还没有修改记录。点击游戏页面中的文字开始编辑。', 'empty-list'));
    $('changes-dialog').showModal();
  }

  window.VoluntaryLeaveEditorHost = {
    onReady(previewApi) {
      api = previewApi;
      api.setEdits(draft.entries);
      api.setMode(mode);
      openScene(currentScene);
      fitPreview();
      $('save-status').textContent = initialProblem ? '草稿读取异常' : '● 草稿已就绪';
    },
    onRecords(next) {
      records = next;
      $('record-count').textContent = records.length;
      if (!$('text-list-panel').hidden) renderTextList();
      if (selected && !records.some(record => record.id === selected.id)) selectRecord(null);
    },
    onSelect: selectRecord
  };

  $('scene-search').addEventListener('input', renderScenes);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderScenes();
  }));
  $('scene-reviewed').addEventListener('change', () => {
    draft = P.setSceneReviewed(draft, currentScene.id, $('scene-reviewed').checked);
    persist();
    if (filter === 'pending') renderScenes();
  });
  $('next-scene').addEventListener('click', () => {
    const index = scenes.findIndex(scene => scene.id === currentScene.id);
    openScene(scenes[(index + 1) % scenes.length]);
  });
  $('reset-scene').addEventListener('click', () => openScene(scenes.find(scene => scene.id === currentScene.id)));
  $('mode-button').addEventListener('click', () => {
    mode = mode === 'edit' ? 'browse' : 'edit';
    api?.setMode(mode);
    $('mode-button').textContent = mode === 'edit' ? '切换到交互' : '返回编辑';
    $('mode-button').setAttribute('aria-pressed', String(mode === 'browse'));
    $('mode-hint').textContent = mode === 'edit' ? '编辑模式：点文字修改；折叠内容自动展开。' : '交互模式：可以点击游戏控件。随时重置场景，编辑稿会保留。';
  });
  $('viewport').addEventListener('change', fitPreview);
  $('zoom').addEventListener('change', fitPreview);
  new ResizeObserver(fitPreview).observe($('preview-stage'));
  $('copy-form').addEventListener('submit', event => event.preventDefault());
  for (const id of ['copy-replacement', 'copy-note']) {
    $(id).addEventListener('focus', checkpoint);
    $(id).addEventListener('input', changeCopy);
  }
  $('restore-copy').addEventListener('click', () => {
    if (!selected) return;
    checkpoint();
    draft = P.removeEntry(draft, selected.id);
    api?.setEdits(draft.entries);
    selectRecord(selected);
    persist();
  });
  $('undo-copy').addEventListener('click', () => {
    const previous = undo.pop();
    if (!previous) return;
    draft = P.validateDraft(previous, sources.baseline).value;
    api?.setEdits(draft.entries);
    if (selected) selectRecord(selected);
    persist();
    renderScenes();
  });
  $('inspector-tab').addEventListener('click', showInspector);
  $('text-list-tab').addEventListener('click', () => {
    $('copy-form').hidden = true;
    $('inspector-empty').hidden = true;
    $('text-list-panel').hidden = false;
    $('inspector-tab').classList.remove('active');
    $('text-list-tab').classList.add('active');
    renderTextList();
  });
  $('text-search').addEventListener('input', renderTextList);
  $('export-button').addEventListener('click', exportChanges);
  $('export-in-dialog').addEventListener('click', exportChanges);
  $('export-readable').addEventListener('click', readableChanges);
  $('changes-button').addEventListener('click', showChanges);
  $('close-changes').addEventListener('click', () => $('changes-dialog').close());
  $('import-button').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { notice('文件超过 8 MB，请选择文案修改 JSON 包。'); return; }
    try {
      const result = P.importDraft(await file.text(), draft);
      if (!result.ok) {
        const conflicts = result.conflicts.map(item => item.id).join('、');
        notice(result.errors.join(' ') || `存在 ${result.conflicts.length} 条冲突，本次未导入。请保留两份修改包供开发核对：${conflicts}`);
        return;
      }
      const known = new Set(scenes.map(scene => scene.id));
      if (result.draft.entries.some(entry => entry.scenes.some(id => !known.has(id))) || result.draft.reviewedScenes.some(id => !known.has(id))) {
        notice('修改包包含当前版本没有的场景，本次未导入。请核对编辑器版本。'); return;
      }
      checkpoint();
      draft = result.draft;
      api?.setEdits(draft.entries);
      if (selected) selectRecord(selected);
      persist();
      renderScenes();
      if (!autosaveFailed) notice('导入完成。修改记录已合并到当前草稿。', false);
    } catch (error) { notice(`未能导入：${error.message}`); }
  });
  window.addEventListener('beforeunload', event => {
    if (autosaveFailed && draft.entries.length) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('hashchange', () => {
    const scene = scenes.find(item => item.id === location.hash.slice(1));
    if (scene && scene.id !== currentScene.id) openScene(scene);
  });
  renderScenes();
  updateCounts();
  if (initialProblem) notice(initialProblem);
  $('game-preview').src = './preview.html';
})();
