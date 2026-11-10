(function (root) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const PROJECT = "voluntary-leaving";
  const EDITOR_VERSION = "1.0.0";
  const LIMITS = Object.freeze({
    bytes: 8 * 1024 * 1024,
    entries: 5000,
    scenes: 2000,
    textLength: 50000,
    noteLength: 10000,
    metadataDepth: 8
  });
  const KINDS = new Set(["text", "attribute", "image-note"]);
  const DRAFT_KEYS = new Set(["schemaVersion", "project", "baseline", "editorVersion", "entries", "reviewedScenes", "exportedAt"]);
  const ENTRY_KEYS = new Set(["id", "kind", "original", "replacement", "locator", "scenes", "note", "source"]);
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:/@-]{0,199}$/;

  function isObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function validId(value) {
    return typeof value === "string" && ID_PATTERN.test(value) && !UNSAFE_KEYS.has(value);
  }

  function assertString(value, label, maxLength, allowEmpty = true) {
    assert(typeof value === "string", `${label}必须是文字。`);
    assert(value.length <= maxLength, `${label}超过长度限制（${maxLength} 字符）。`);
    assert(allowEmpty || value.trim().length > 0, `${label}不能为空。`);
  }

  // Keep source/locator metadata as plain JSON. Never merge untrusted keys into objects.
  function copyMetadata(value, depth = 0) {
    assert(depth <= LIMITS.metadataDepth, "定位信息嵌套层级过多。");
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "number") {
      assert(Number.isFinite(value), "定位信息含有无效数字。");
      return value;
    }
    if (typeof value === "string") {
      assertString(value, "定位信息", LIMITS.textLength);
      return value;
    }
    if (Array.isArray(value)) {
      assert(value.length <= LIMITS.scenes, "定位信息数组过长。");
      return value.map((item) => copyMetadata(item, depth + 1));
    }
    assert(isObject(value), "定位信息必须是 JSON 数据。");
    const keys = Object.keys(value);
    assert(keys.length <= 100, "定位信息字段过多。");
    const result = {};
    keys.forEach((key) => {
      assert(!UNSAFE_KEYS.has(key), "定位信息含有不允许的字段。");
      assertString(key, "定位信息字段名", 200, false);
      result[key] = copyMetadata(value[key], depth + 1);
    });
    return result;
  }

  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (isObject(value)) {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function stableId(value) {
    const input = typeof value === "string" ? value : canonical(copyMetadata(value));
    let first = 0x811c9dc5;
    let second = 0x9e3779b9;
    for (let index = 0; index < input.length; index += 1) {
      const code = input.charCodeAt(index);
      first = Math.imul(first ^ code, 0x01000193);
      second = Math.imul(second ^ code, 0x85ebca6b);
      second ^= second >>> 13;
    }
    return `copy-${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
  }

  function sceneIds(value, label) {
    assert(Array.isArray(value), `${label}必须是列表。`);
    assert(value.length <= LIMITS.scenes, `${label}数量过多。`);
    value.forEach((id) => assert(validId(id), `${label}含有无效标识。`));
    return [...new Set(value)].sort();
  }

  function normalizeEntry(value) {
    assert(isObject(value), "修改条目必须是对象。");
    Object.keys(value).forEach((key) => assert(ENTRY_KEYS.has(key), `修改条目包含不支持的字段：${key}。`));
    assert(validId(value.id), "文案标识无效。");
    assert(KINDS.has(value.kind), "修改条目的类型无效。");
    assertString(value.original, "原文", LIMITS.textLength);
    assertString(value.replacement, "修改稿", LIMITS.textLength);
    assert(isObject(value.locator) && Object.keys(value.locator).length > 0, "修改条目缺少定位信息。");
    const entry = {
      id: value.id,
      kind: value.kind,
      original: value.original,
      replacement: value.replacement,
      locator: copyMetadata(value.locator),
      scenes: sceneIds(value.scenes, "关联场景")
    };
    assert(entry.scenes.length > 0, "修改条目至少需要一个关联场景。");
    if (value.note !== undefined) {
      assertString(value.note, "备注", LIMITS.noteLength);
      if (value.note.trim()) entry.note = value.note;
    }
    if (value.source !== undefined) entry.source = copyMetadata(value.source);
    return entry;
  }

  function hasChange(entry) {
    if (entry.kind === "image-note") return Boolean(entry.note?.trim() || entry.replacement.trim());
    return entry.original !== entry.replacement || Boolean(entry.note?.trim());
  }

  function byteLength(text) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
    // TextEncoder is available in supported browsers and Node. This fallback counts UTF-8
    // without relying on Buffer, so the module remains usable in other JS runtimes.
    let length = 0;
    for (const char of text) {
      const point = char.codePointAt(0);
      length += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    }
    return length;
  }

  function checkSize(value) {
    let text;
    try { text = typeof value === "string" ? value : JSON.stringify(value); }
    catch (_error) { throw new Error("修改包必须是可序列化的 JSON 数据。"); }
    assert(typeof text === "string", "修改包为空或格式无效。");
    assert(text.length <= LIMITS.bytes && byteLength(text) <= LIMITS.bytes, "修改包超过 8 MB 限制。");
    return text;
  }

  function normalizeDraft(value, expectedBaseline) {
    assert(isObject(value), "修改包必须是对象。");
    Object.keys(value).forEach((key) => assert(DRAFT_KEYS.has(key), `修改包包含不支持的字段：${key}。`));
    assert(value.schemaVersion === SCHEMA_VERSION, "修改包格式版本不受支持。");
    assert(value.project === PROJECT, "修改包不属于《自愿离校》。");
    assertString(value.baseline, "基准版本", 256, false);
    if (expectedBaseline !== undefined) assert(value.baseline === expectedBaseline, "修改包的基准版本与当前游戏不同，请先核对版本，不能直接导入。");
    assertString(value.editorVersion, "编辑器版本", 64, false);
    assert(Array.isArray(value.entries), "修改条目必须是列表。");
    assert(value.entries.length <= LIMITS.entries, "修改条目超过 5000 条限制。");
    const ids = new Set();
    const entries = value.entries.map((item) => {
      const entry = normalizeEntry(item);
      assert(!ids.has(entry.id), `修改包含有重复文案标识：${entry.id}。`);
      ids.add(entry.id);
      return entry;
    }).filter(hasChange);
    assert(value.exportedAt === null || (typeof value.exportedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.exportedAt) && !Number.isNaN(Date.parse(value.exportedAt))), "修改包的导出时间无效。");
    return {
      schemaVersion: SCHEMA_VERSION,
      project: PROJECT,
      baseline: value.baseline,
      editorVersion: value.editorVersion,
      entries,
      reviewedScenes: sceneIds(value.reviewedScenes, "已审场景"),
      exportedAt: value.exportedAt
    };
  }

  function createDraft(baseline) {
    assertString(baseline, "基准版本", 256, false);
    return {
      schemaVersion: SCHEMA_VERSION,
      project: PROJECT,
      baseline,
      editorVersion: EDITOR_VERSION,
      entries: [],
      reviewedScenes: [],
      exportedAt: null
    };
  }

  function validateDraft(input, expectedBaseline) {
    try {
      checkSize(input);
      const value = typeof input === "string" ? JSON.parse(input) : input;
      return { ok: true, value: normalizeDraft(value, expectedBaseline), errors: [] };
    } catch (error) {
      const message = error instanceof SyntaxError ? "文件不是有效的 JSON 修改包。" : error.message;
      return { ok: false, value: null, errors: [message || "修改包格式无效。"] };
    }
  }

  function checkedDraft(input) {
    const result = validateDraft(input);
    assert(result.ok, result.errors.join(" "));
    return result.value;
  }

  function updateEntry(draft, record) {
    const next = checkedDraft(draft);
    const entry = normalizeEntry(record);
    const previous = next.entries.find((item) => item.id === entry.id);
    if (previous) {
      assert(previous.original === entry.original && previous.kind === entry.kind && canonical(previous.locator) === canonical(entry.locator), "同一文案标识对应的原文或位置已改变，请重新选择文案。");
      entry.scenes = [...new Set([...previous.scenes, ...entry.scenes])].sort();
    }
    next.entries = next.entries.filter((item) => item.id !== entry.id);
    if (hasChange(entry)) next.entries.push(entry);
    assert(next.entries.length <= LIMITS.entries, "修改条目超过 5000 条限制。");
    next.exportedAt = null;
    checkSize(next);
    return next;
  }

  function removeEntry(draft, id) {
    assert(validId(id), "文案标识无效。");
    const next = checkedDraft(draft);
    next.entries = next.entries.filter((item) => item.id !== id);
    next.exportedAt = null;
    return next;
  }

  function setSceneReviewed(draft, id, reviewed = true) {
    assert(validId(id), "场景标识无效。");
    assert(typeof reviewed === "boolean", "审阅状态必须为布尔值。");
    const next = checkedDraft(draft);
    const ids = new Set(next.reviewedScenes);
    if (reviewed) ids.add(id);
    else ids.delete(id);
    assert(ids.size <= LIMITS.scenes, "已审场景数量过多。");
    next.reviewedScenes = [...ids].sort();
    next.exportedAt = null;
    return next;
  }

  function exportDraft(draft, options = {}) {
    const next = checkedDraft(draft);
    const now = options.now === undefined ? new Date() : new Date(options.now);
    assert(!Number.isNaN(now.getTime()), "导出时间无效。");
    next.editorVersion = EDITOR_VERSION;
    next.exportedAt = now.toISOString();
    next.entries.sort((left, right) => left.id.localeCompare(right.id));
    const result = JSON.stringify(next, null, 2);
    checkSize(result);
    return result;
  }

  function contentOf(entry) {
    const { scenes, ...content } = entry;
    return canonical(content);
  }

  // Imports are a union, not a replacement: absent entries never delete local work.
  // A conflict rejects the entire package and returns both versions for the UI.
  function importDraft(input, currentDraft) {
    const currentResult = validateDraft(currentDraft);
    if (!currentResult.ok) return { ok: false, draft: currentDraft, conflicts: [], errors: currentResult.errors };
    const incomingResult = validateDraft(input, currentResult.value.baseline);
    if (!incomingResult.ok) return { ok: false, draft: currentDraft, conflicts: [], errors: incomingResult.errors };
    const incoming = incomingResult.value;
    const next = currentResult.value;
    const local = new Map(next.entries.map((entry) => [entry.id, entry]));
    const conflicts = [];
    incoming.entries.forEach((entry) => {
      const previous = local.get(entry.id);
      if (previous && contentOf(previous) !== contentOf(entry)) {
        conflicts.push({ id: entry.id, local: previous, incoming: entry });
      } else {
        local.set(entry.id, previous ? { ...previous, scenes: [...new Set([...previous.scenes, ...entry.scenes])].sort() } : entry);
      }
    });
    if (conflicts.length) return { ok: false, draft: currentDraft, conflicts, errors: [`有 ${conflicts.length} 条修改与本机草稿冲突，未导入任何内容。`] };
    next.entries = [...local.values()];
    next.reviewedScenes = [...new Set([...next.reviewedScenes, ...incoming.reviewedScenes])].sort();
    next.editorVersion = EDITOR_VERSION;
    next.exportedAt = null;
    const merged = validateDraft(next);
    if (!merged.ok) return { ok: false, draft: currentDraft, conflicts: [], errors: merged.errors };
    return { ok: true, draft: merged.value, conflicts: [], errors: [] };
  }

  function riskWarnings(text) {
    const value = String(text || "");
    const warnings = [];
    if (/\bB4\b|0713|guest_404|xzy_admin|xg413_archive|chat_\d+|AUDIT-QCU|QCU-XJYD/i.test(value)) warnings.push("含检索关键词或记录编号；修改后需核对搜索入口与关联证据。");
    if (/\b(?:\d{1,3}\.){3}\d{1,3}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(value)) warnings.push("含 IP 或邮箱；它们可能用于跨系统比对。");
    if (/林华灿|孟清|顾天泽|许知遥|周启明|顾兴学|青川大学/.test(value)) warnings.push("含人物或学校名称；请同步检查所有关联场景和图片。");
    if (/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b|\d{1,2}\s*月\s*\d{1,2}\s*日|\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(value)) warnings.push("含日期或时间；时间矛盾可能是谜题的一部分。");
    if (/\$\{[^}]+\}|\{\{[^}]+\}\}|\{[A-Za-z_][\w.]*\}|%[sd]|\b\d+\s*\/\s*\d+\b|\d+\s*%/.test(value)) warnings.push("含动态字段或数量；修改时保留变量及其含义。");
    if (/多部门材料互相引用|不存在明确责任单位|自愿退学|暂时离校休整|真的不想继续了|不愿继续/.test(value)) warnings.push("含复核选项或关键证词；措辞差异可能影响推理，需要核对上下文。");
    return warnings;
  }

  const api = Object.freeze({
    SCHEMA_VERSION, PROJECT, EDITOR_VERSION, LIMITS,
    stableId, riskWarnings, createDraft, validateDraft,
    updateEntry, removeEntry, setSceneReviewed, exportDraft, importDraft
  });
  root.VoluntaryLeaveCopyPatches = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
