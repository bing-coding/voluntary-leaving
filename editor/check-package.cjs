#!/usr/bin/env node
"use strict";

// Read-only handoff check. Deliberately contains no source-writing operation:
// a rendered text match is a candidate, not proof that replacing JS is safe.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Patches = require("./patches.js");

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const SHA256 = /^[0-9a-f]{64}$/;

function relativeFile(root, name) {
  if (typeof name !== "string" || !name || name.includes("\\") || name.includes("\0") || path.isAbsolute(name)
    || name.split("/").some((part) => part === ".." || part === "." || !part)) {
    throw new Error("源码路径必须是项目内的规范相对路径。");
  }
  const resolved = path.resolve(root, name);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("源码路径超出项目目录。");
  return resolved;
}

function parseSources(text) {
  const assignment = "window.VoluntaryLeaveCopySources = ";
  const start = text.indexOf(assignment);
  if (start === -1 || !/^\s*(?:\/\/[^\n]*\n\s*)*$/.test(text.slice(0, start))) {
    throw new Error("sources.js 不是预期的源码快照格式。");
  }
  const payload = text.slice(start + assignment.length).trim();
  if (!payload.endsWith(";")) throw new Error("sources.js 缺少快照结束标记。");
  const value = JSON.parse(payload.slice(0, -1));
  if (!value || !SHA256.test(value.baseline) || !Array.isArray(value.files) || !value.files.length || value.files.length > 500) {
    throw new Error("sources.js 中的基准或文件清单无效。");
  }
  const seen = new Set();
  for (const file of value.files) {
    relativeFile(process.cwd(), file.path);
    if (seen.has(file.path) || !SHA256.test(file.sha256) || typeof file.content !== "string") {
      throw new Error("sources.js 包含重复或无效源码条目。");
    }
    seen.add(file.path);
  }
  return value;
}

function checkPackage(input, options = {}) {
  const root = fs.realpathSync(options.projectRoot || path.resolve(__dirname, ".."));
  const report = {
    tool: "voluntary-leaving-copy-package-check",
    readOnly: true,
    automaticApply: false,
    ok: false,
    status: "needs-attention",
    errors: [],
    warnings: [],
    baseline: null,
    files: [],
    entries: [],
    conflicts: []
  };
  const checked = Patches.validateDraft(input);
  if (!checked.ok) {
    report.status = "invalid-package";
    report.errors.push(...checked.errors);
    return report;
  }
  const draft = checked.value;
  let sources;
  try {
    const filename = relativeFile(root, "editor/sources.js");
    const real = fs.realpathSync(filename);
    if (path.relative(root, real).startsWith("..")) throw new Error("源码快照链接指向项目目录外。");
    sources = parseSources(fs.readFileSync(real, "utf8"));
  } catch (error) {
    report.errors.push(`无法读取源码快照：${error.message}`);
    return report;
  }

  const recomputed = hash(sources.files.map((file) => `${file.path}:${file.sha256}`).join("\n"));
  report.baseline = {
    package: draft.baseline,
    sourceIndex: sources.baseline,
    recomputedIndex: recomputed,
    sourceRevision: sources.sourceRevision || null,
    packageMatchesIndex: draft.baseline === sources.baseline,
    indexIntegrity: recomputed === sources.baseline
  };
  if (!report.baseline.packageMatchesIndex) report.errors.push("修改包基准与当前源码快照不同，需要找到对应版本后重新核对。");
  if (!report.baseline.indexIntegrity) report.errors.push("源码快照的基准哈希不匹配，快照可能已损坏。");

  const files = new Map();
  for (const file of sources.files) {
    const result = { path: file.path, expectedSha256: file.sha256, indexedContentMatches: hash(file.content) === file.sha256, currentSha256: null, matches: false };
    if (!result.indexedContentMatches) report.errors.push(`源码快照内容哈希不匹配：${file.path}`);
    let content = null;
    try {
      const filename = relativeFile(root, file.path);
      const real = fs.realpathSync(filename);
      if (path.relative(root, real).startsWith("..")) throw new Error("文件链接指向项目目录外。");
      content = fs.readFileSync(real, "utf8");
      result.currentSha256 = hash(content);
      result.matches = result.currentSha256 === file.sha256;
      if (!result.matches) report.errors.push(`本地源码已偏离审校基准：${file.path}`);
    } catch (error) {
      result.error = error.message;
      report.errors.push(`无法核对本地源码：${file.path}`);
    }
    files.set(file.path, { indexed: file, local: content, result });
    report.files.push(result);
  }

  const candidateEdits = new Map();
  for (const entry of draft.entries) {
    const source = entry.source && typeof entry.source === "object" ? entry.source : {};
    const list = source.candidates === undefined ? [] : source.candidates;
    const item = {
      id: entry.id,
      kind: entry.kind,
      scenes: entry.scenes,
      original: entry.original,
      replacement: entry.replacement,
      note: entry.note || "",
      status: "manual-context-review",
      candidates: [],
      warnings: Patches.riskWarnings(`${entry.original}\n${entry.replacement}`)
    };
    report.entries.push(item);
    if (!Array.isArray(list)) {
      item.status = "invalid-source-metadata";
      report.errors.push(`${entry.id}：源码候选清单格式无效。`);
      continue;
    }
    if (entry.kind === "image-note") {
      item.warnings.push("图片条目只交付改图要求，不会替换图片或源码文字。");
      item.status = "image-work-required";
    } else if (list.length === 0) {
      item.warnings.push("没有精确源码候选；可能是动态组合文字，需要按场景和定位人工合稿。");
    }
    if (list.length > 1 || (Number.isInteger(source.matchCount) && source.matchCount > 1)) {
      item.warnings.push("原文有多处源码候选；不能据此认定它们都应使用同一改稿。");
    }
    if (Number.isInteger(source.matchCount) && source.matchCount > list.length) {
      item.warnings.push(`索引共命中 ${source.matchCount} 处，本包只携带 ${list.length} 处候选，需要继续检查其余位置。`);
    }

    for (const candidate of list) {
      const valid = candidate && typeof candidate === "object" && typeof candidate.path === "string"
        && Number.isSafeInteger(candidate.offset) && candidate.offset >= 0
        && Number.isSafeInteger(candidate.line) && candidate.line > 0
        && typeof candidate.matchedText === "string" && candidate.matchedText.length > 0
        && SHA256.test(candidate.sha256);
      if (!valid) {
        item.candidates.push({ status: "invalid", reason: "候选缺少有效路径、偏移、行号、原文或哈希。" });
        report.errors.push(`${entry.id}：存在无效的源码候选。`);
        continue;
      }
      const result = { path: candidate.path, line: candidate.line, offset: candidate.offset, matchedText: candidate.matchedText, status: "stale", reasons: [] };
      item.candidates.push(result);
      const file = files.get(candidate.path);
      if (!file) {
        result.status = "invalid";
        result.reasons.push("该路径不在受核对的源码快照中；未读取该路径。");
      } else {
        const expectedNeedle = entry.kind === "image-note" ? (typeof source.assetPath === "string" ? source.assetPath.replace(/^\.\//, "") : null) : entry.original;
        if (!expectedNeedle || candidate.matchedText !== expectedNeedle) result.reasons.push("候选原文与修改条目的原文或图片路径不一致。");
        if (candidate.sha256 !== file.indexed.sha256) result.reasons.push("候选记录的文件哈希与源码快照不一致。");
        if (file.indexed.content.slice(candidate.offset, candidate.offset + candidate.matchedText.length) !== candidate.matchedText) result.reasons.push("候选偏移在基准源码中不再匹配。");
        if (file.indexed.content.slice(0, candidate.offset).split("\n").length !== candidate.line) result.reasons.push("候选行号与基准源码偏移不一致。");
        if (file.local === null || file.local.slice(candidate.offset, candidate.offset + candidate.matchedText.length) !== candidate.matchedText) result.reasons.push("候选原文在本地源码的对应偏移不再匹配。");
        if (!file.result.matches) result.reasons.push("文件整体哈希已改变，需要重新确认上下文。");
        if (!result.reasons.length) result.status = "matches";
      }
      if (result.status !== "matches") report.errors.push(`${entry.id}：源码候选需要重新核对（${candidate.path}:${candidate.line}）。`);
      const isCopyChange = entry.kind !== "image-note" && entry.original !== entry.replacement;
      if (file && isCopyChange) {
        const key = JSON.stringify([candidate.path, candidate.offset, candidate.matchedText]);
        const edits = candidateEdits.get(key) || { path: candidate.path, line: candidate.line, offset: candidate.offset, original: candidate.matchedText, edits: [] };
        if (!edits.edits.some((edit) => edit.id === entry.id)) edits.edits.push({ id: entry.id, scenes: entry.scenes, replacement: entry.replacement });
        candidateEdits.set(key, edits);
      }
    }
    if (item.candidates.some((candidate) => candidate.status !== "matches")) item.status = "source-check-failed";
    else if (entry.kind !== "image-note" && item.candidates.length) item.status = "candidate-matches-manual-review";
  }

  for (const value of candidateEdits.values()) {
    if (new Set(value.edits.map((edit) => edit.replacement)).size > 1) {
      report.conflicts.push({ ...value, reason: "同一源码候选收到不同改稿；需确认场景共用关系和最终措辞，不能直接全局替换。" });
    }
  }
  if (report.conflicts.length) report.errors.push(`发现 ${report.conflicts.length} 个源码候选的改稿冲突。`);
  report.warnings.push("核对通过只表示格式、基准和候选位置一致；仍需人工确认语法、动态字段、共用关系及谜题依赖。此工具不会修改任何游戏文件。");
  report.summary = {
    entries: draft.entries.length,
    reviewedScenes: draft.reviewedScenes.length,
    textChanges: draft.entries.filter((entry) => entry.kind !== "image-note" && entry.original !== entry.replacement).length,
    imageNotes: draft.entries.filter((entry) => entry.kind === "image-note").length,
    notesOnly: draft.entries.filter((entry) => entry.kind !== "image-note" && entry.original === entry.replacement).length,
    contextOnlyEntries: report.entries.filter((entry) => !entry.candidates.length).length,
    matchingCandidates: report.entries.flatMap((entry) => entry.candidates).filter((candidate) => candidate.status === "matches").length,
    sourceConflicts: report.conflicts.length
  };
  report.ok = report.errors.length === 0;
  report.status = report.ok ? "ready-for-manual-review" : "needs-attention";
  return report;
}

function main(argv) {
  if (!argv.length || argv.includes("--help")) {
    console.log("用法：node editor/check-package.cjs <修改包.json> [--root <游戏项目目录>]\n只读核对；输出 JSON 报告；不自动修改任何源码。退出码：0 核对通过待人工合稿，1 有冲突或基准变化，2 参数/文件/修改包无效。");
    return argv.includes("--help") ? 0 : 2;
  }
  let root;
  if (argv.length === 3 && argv[1] === "--root") root = argv[2];
  else if (argv.length !== 1) {
    console.error("参数无效。请使用 --help 查看用法。");
    return 2;
  }
  try {
    const stat = fs.statSync(argv[0]);
    if (!stat.isFile() || stat.size > Patches.LIMITS.bytes) throw new Error("修改包必须是小于 8 MB 的普通 JSON 文件。");
    const report = checkPackage(fs.readFileSync(argv[0], "utf8"), { projectRoot: root });
    console.log(JSON.stringify(report, null, 2));
    return report.status === "invalid-package" ? 2 : report.ok ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({ readOnly: true, automaticApply: false, ok: false, status: "input-error", errors: [error.message] }, null, 2));
    return 2;
  }
}

module.exports = { checkPackage, parseSources };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
