"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const Patches = require("./patches.js");
const { checkPackage, parseSources } = require("./check-package.cjs");

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");
function test(name, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voluntary-copy-check-"));
  try {
    fs.mkdirSync(path.join(root, "editor"));
    const content = 'const heading = "旧文案";\nconst footer = "页脚";\n';
    const files = [{ path: "game.js", sha256: sha(content), content }];
    const sources = { baseline: sha(files.map((file) => `${file.path}:${file.sha256}`).join("\n")), sourceRevision: "test", files };
    const writeIndex = (value = sources) => fs.writeFileSync(path.join(root, "editor/sources.js"), `// Generated fixture.\nwindow.VoluntaryLeaveCopySources = ${JSON.stringify(value)};\n`);
    fs.writeFileSync(path.join(root, "game.js"), content);
    writeIndex();
    const record = (patch = {}) => ({
      id: "copy-first", kind: "text", original: "旧文案", replacement: "新文案",
      locator: { sceneId: "scene-first", selector: "#app h1", textIndex: 0 }, scenes: ["scene-first"],
      source: { matchCount: 1, candidates: [{ path: "game.js", line: 1, offset: content.indexOf("旧文案"), matchedText: "旧文案", sha256: files[0].sha256 }] },
      ...patch
    });
    const draft = Patches.updateEntry(Patches.createDraft(sources.baseline), record());
    callback({ root, content, sources, draft, record, writeIndex });
    console.log(`ok - ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("matching baseline and source candidates pass without changing files", ({ root, draft, content }) => {
  const indexBefore = fs.readFileSync(path.join(root, "editor/sources.js"), "utf8");
  const report = checkPackage(Patches.exportDraft(draft), { projectRoot: root });
  assert.equal(report.ok, true);
  assert.equal(report.automaticApply, false);
  assert.equal(report.status, "ready-for-manual-review");
  assert.equal(report.entries[0].candidates[0].status, "matches");
  assert.equal(fs.readFileSync(path.join(root, "game.js"), "utf8"), content);
  assert.equal(fs.readFileSync(path.join(root, "editor/sources.js"), "utf8"), indexBefore);
});

test("different replacements for one source candidate are reported as a conflict", ({ root, draft, record }) => {
  const incoming = Patches.updateEntry(draft, record({ id: "copy-second", replacement: "另一个改稿", scenes: ["scene-second"] }));
  const report = checkPackage(incoming, { projectRoot: root });
  assert.equal(report.ok, false);
  assert.equal(report.conflicts.length, 1);
  assert.equal(report.conflicts[0].edits.length, 2);
  assert.equal(report.conflicts[0].path, "game.js");
});

test("identical edits in different scenes do not create a false conflict", ({ root, draft, record }) => {
  const incoming = Patches.updateEntry(draft, record({ id: "copy-second", scenes: ["scene-second"] }));
  const report = checkPackage(incoming, { projectRoot: root });
  assert.equal(report.ok, true);
  assert.equal(report.conflicts.length, 0);
});

test("a note-only entry does not conflict with an actual replacement", ({ root, draft, record }) => {
  const incoming = Patches.updateEntry(draft, record({ id: "copy-note", replacement: "旧文案", note: "请确认人物语气。" }));
  const report = checkPackage(incoming, { projectRoot: root });
  assert.equal(report.ok, true);
  assert.equal(report.summary.notesOnly, 1);
});

test("local source changes are detected even if the matched phrase remains", ({ root, draft, content }) => {
  fs.writeFileSync(path.join(root, "game.js"), `${content}// later change\n`);
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.ok, false);
  assert.equal(report.files[0].matches, false);
  assert.equal(report.entries[0].candidates[0].status, "stale");
});

test("candidate offset and line must match the original snapshot", ({ root, draft }) => {
  draft.entries[0].source.candidates[0].offset += 1;
  draft.entries[0].source.candidates[0].line = 2;
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.ok, false);
  assert.ok(report.entries[0].candidates[0].reasons.some((reason) => reason.includes("偏移")));
  assert.ok(report.entries[0].candidates[0].reasons.some((reason) => reason.includes("行号")));
});

test("a candidate cannot point at unrelated text or a path outside the indexed project", ({ root, draft }) => {
  draft.entries[0].source.candidates[0].matchedText = "不相干的文案";
  assert.equal(checkPackage(draft, { projectRoot: root }).ok, false);
  draft.entries[0].source.candidates[0].path = "../../outside.js";
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.entries[0].candidates[0].status, "invalid");
  assert.match(report.entries[0].candidates[0].reasons.join(""), /未读取/);
});

test("dynamic strings and image notes remain manual work instead of false source matches", ({ root, sources, record }) => {
  let draft = Patches.updateEntry(Patches.createDraft(sources.baseline), record({ source: { candidates: [], matchCount: 0, method: "rendered-context" } }));
  draft = Patches.updateEntry(draft, record({ id: "image-note", kind: "image-note", original: "扫描件", replacement: "左下角日期改为约定日期", source: { candidates: [], assetPath: "./assets/scan.jpg" } }));
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.ok, true);
  assert.equal(report.entries[0].status, "manual-context-review");
  assert.equal(report.entries[1].status, "image-work-required");
  assert.equal(report.summary.imageNotes, 1);
});

test("wrong package baseline and damaged source snapshot are caught", ({ root, draft, sources, writeIndex }) => {
  const other = { ...draft, baseline: "different-baseline" };
  assert.equal(checkPackage(other, { projectRoot: root }).ok, false);
  sources.files[0].content += "tampered";
  writeIndex();
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.ok, false);
  assert.equal(report.files[0].indexedContentMatches, false);
});

test("sources.js is parsed as JSON and never executed", ({ root, draft }) => {
  const marker = path.join(root, "should-not-exist");
  fs.appendFileSync(path.join(root, "editor/sources.js"), `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'bad');`);
  assert.equal(checkPackage(draft, { projectRoot: root }).ok, false);
  assert.equal(fs.existsSync(marker), false);
  assert.throws(() => parseSources('window.VoluntaryLeaveCopySources = {}; console.log("execute");'));
});

test("malformed package metadata is reported without crashing", ({ root, draft }) => {
  assert.equal(checkPackage("{", { projectRoot: root }).status, "invalid-package");
  draft.entries[0].source.candidates = "not-a-list";
  const report = checkPackage(draft, { projectRoot: root });
  assert.equal(report.ok, false);
  assert.equal(report.entries[0].status, "invalid-source-metadata");
});

test("CLI returns a JSON report and uses nonzero status for conflicts", ({ root, draft, record }) => {
  const packagePath = path.join(root, "draft.json");
  fs.writeFileSync(packagePath, Patches.exportDraft(draft));
  const good = cp.spawnSync(process.execPath, [path.join(__dirname, "check-package.cjs"), packagePath, "--root", root], { encoding: "utf8" });
  assert.equal(good.status, 0);
  assert.equal(JSON.parse(good.stdout).readOnly, true);
  const conflicting = Patches.updateEntry(draft, record({ id: "copy-other", replacement: "另一稿" }));
  fs.writeFileSync(packagePath, Patches.exportDraft(conflicting));
  const bad = cp.spawnSync(process.execPath, [path.join(__dirname, "check-package.cjs"), packagePath, "--root", root], { encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).conflicts.length, 1);
});
