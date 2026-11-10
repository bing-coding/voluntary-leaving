const assert = require("node:assert/strict");
const Patches = require("./patches.js");

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

const BASELINE = "49d752fd926ec0e2d0d9b0349266716c79db0674";
const original = "当前账号仍无权确认 B4 附件目录。";
function record(patch = {}) {
  return {
    id: "copy-a1",
    kind: "text",
    original,
    replacement: "当前账号暂无 B4 附件目录的核验权限。",
    locator: { selector: "#app .notice", textIndex: 0 },
    scenes: ["library-before"],
    source: { file: "scripts/actions.js", line: 322 },
    ...patch
  };
}

function draftWith(patch = {}) {
  return Patches.updateEntry(Patches.createDraft(BASELINE), record(patch));
}

test("stable IDs distinguish locations and ignore object-key order", () => {
  assert.equal(Patches.stableId({ file: "a.js", line: 12 }), Patches.stableId({ line: 12, file: "a.js" }));
  assert.notEqual(Patches.stableId({ file: "a.js", line: 12 }), Patches.stableId({ file: "a.js", line: 13 }));
  assert.match(Patches.stableId("中文 → 文案"), /^copy-[0-9a-f]{16}$/);
});

test("updating one entry keeps the original draft and caller metadata unchanged", () => {
  const initial = Patches.createDraft(BASELINE);
  const item = record();
  const next = Patches.updateEntry(initial, item);
  item.locator.selector = "different";
  item.source.line = 900;
  assert.equal(initial.entries.length, 0);
  assert.equal(next.entries[0].locator.selector, "#app .notice");
  assert.equal(next.entries[0].source.line, 322);
});

test("the same original wording at different locations remains independent", () => {
  const first = draftWith();
  const next = Patches.updateEntry(first, record({ id: "copy-b2", locator: { selector: "#app .footer", textIndex: 0 } }));
  assert.equal(next.entries.length, 2);
  assert.equal(next.entries[0].original, next.entries[1].original);
});

test("updates preserve associated scenes and restoring original removes the change", () => {
  const first = draftWith();
  const second = Patches.updateEntry(first, record({ replacement: "修改二", scenes: ["library-after"] }));
  assert.deepEqual(second.entries[0].scenes, ["library-after", "library-before"]);
  assert.equal(first.entries[0].replacement, "当前账号暂无 B4 附件目录的核验权限。");
  const restored = Patches.updateEntry(second, record({ replacement: original }));
  assert.equal(restored.entries.length, 0);
});

test("an ID cannot silently move to a new source or original", () => {
  assert.throws(() => Patches.updateEntry(draftWith(), record({ original: "不同的原文" })), /原文或位置已改变/);
  assert.throws(() => Patches.updateEntry(draftWith(), record({ locator: { selector: "#different" } })), /原文或位置已改变/);
});

test("image annotations remain even when there is no replacement text", () => {
  const imageRecord = record({
    id: "image-01", kind: "image-note", original: "./assets/doc.jpg", replacement: "",
    locator: { src: "./assets/doc.jpg", selector: "img.asset" }, note: "请修改右下方的日期。"
  });
  const next = Patches.updateEntry(Patches.createDraft(BASELINE), imageRecord);
  assert.equal(next.entries[0].note, "请修改右下方的日期。");
  const cleared = Patches.updateEntry(next, { ...imageRecord, note: "" });
  assert.equal(cleared.entries.length, 0);
});

test("text-only editorial notes survive export and import without a wording change", () => {
  const note = "请确认此处日期是否为刻意设计的矛盾。";
  const draft = draftWith({ replacement: original, note });
  assert.equal(draft.entries.length, 1);
  const result = Patches.importDraft(Patches.exportDraft(draft), Patches.createDraft(BASELINE));
  assert.equal(result.ok, true);
  assert.equal(result.draft.entries[0].replacement, original);
  assert.equal(result.draft.entries[0].note, note);
  assert.equal(Patches.removeEntry(result.draft, "copy-a1").entries.length, 0);
});

test("scene review toggles are idempotent and do not alter entries", () => {
  const draft = draftWith();
  const reviewed = Patches.setSceneReviewed(Patches.setSceneReviewed(draft, "library-before"), "library-before");
  assert.deepEqual(reviewed.reviewedScenes, ["library-before"]);
  assert.deepEqual(reviewed.entries, draft.entries);
  assert.deepEqual(Patches.setSceneReviewed(reviewed, "library-before", false).reviewedScenes, []);
  assert.throws(() => Patches.setSceneReviewed(reviewed, "library-before", "yes"), /布尔/);
});

test("export and import preserve exact text and review status", () => {
  const draft = Patches.setSceneReviewed(draftWith({ replacement: "第一行\n第二行 \"引号\" 与 <标签>" }), "library-before");
  const text = Patches.exportDraft(draft, { now: "2026-11-10T10:00:00.000Z" });
  const parsed = JSON.parse(text);
  assert.equal(parsed.exportedAt, "2026-11-10T10:00:00.000Z");
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.project, "voluntary-leaving");
  assert.equal(draft.exportedAt, null);
  const imported = Patches.importDraft(text, Patches.createDraft(BASELINE));
  assert.equal(imported.ok, true);
  assert.deepEqual(imported.draft.entries, draft.entries);
  assert.deepEqual(imported.draft.reviewedScenes, draft.reviewedScenes);
});

test("HTML-like input remains literal data", () => {
  const text = '<img src=x onerror="alert(1)"><script>window.test=1</script>';
  const draft = draftWith({ replacement: text });
  const result = Patches.importDraft(Patches.exportDraft(draft), Patches.createDraft(BASELINE));
  assert.equal(result.ok, true);
  assert.equal(result.draft.entries[0].replacement, text);
});

test("malformed JSON and wrong baselines reject without modifying current work", () => {
  const current = draftWith();
  const badJson = Patches.importDraft('{"entries":', current);
  assert.equal(badJson.ok, false);
  assert.equal(badJson.draft, current);
  assert.match(badJson.errors[0], /JSON/);
  const other = Patches.createDraft("another-revision");
  const mismatch = Patches.importDraft(Patches.exportDraft(other), current);
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.draft, current);
  assert.match(mismatch.errors[0], /基准版本/);
});

test("a conflicting import is atomic, including new entries and review flags", () => {
  const current = draftWith();
  let incoming = draftWith({ replacement: "来自另一个人的修订" });
  incoming = Patches.updateEntry(incoming, record({ id: "copy-new", locator: { selector: "#new" } }));
  incoming = Patches.setSceneReviewed(incoming, "some-new-scene");
  const result = Patches.importDraft(Patches.exportDraft(incoming), current);
  assert.equal(result.ok, false);
  assert.equal(result.draft, current);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].id, "copy-a1");
  assert.equal(current.entries.length, 1);
  assert.deepEqual(current.reviewedScenes, []);
});

test("matching edits merge scene references and preserve local-only edits", () => {
  const current = Patches.updateEntry(draftWith(), record({ id: "copy-local", locator: { selector: "#local" } }));
  const incoming = Patches.setSceneReviewed(draftWith({ scenes: ["library-after"] }), "library-after");
  const result = Patches.importDraft(Patches.exportDraft(incoming), current);
  assert.equal(result.ok, true);
  assert.equal(result.draft.entries.length, 2);
  assert.deepEqual(result.draft.entries.find((item) => item.id === "copy-a1").scenes, ["library-after", "library-before"]);
  assert.deepEqual(result.draft.reviewedScenes, ["library-after"]);
});

test("missing and no-op imported entries never delete local work", () => {
  const current = draftWith();
  const empty = Patches.importDraft(Patches.exportDraft(Patches.createDraft(BASELINE)), current);
  assert.equal(empty.draft.entries.length, 1);
  const noOp = { ...Patches.createDraft(BASELINE), entries: [record({ replacement: original })] };
  const result = Patches.importDraft(noOp, current);
  assert.equal(result.ok, true);
  assert.equal(result.draft.entries.length, 1);
});

test("duplicate IDs and unsupported entry types are rejected", () => {
  const duplicate = { ...draftWith(), entries: [record(), record()] };
  assert.match(Patches.validateDraft(duplicate).errors[0], /重复/);
  const unsupported = { ...draftWith(), entries: [record({ kind: "html" })] };
  assert.match(Patches.validateDraft(unsupported).errors[0], /类型/);
  assert.equal(Patches.validateDraft({ ...draftWith(), project: "other-game" }).ok, false);
  assert.equal(Patches.validateDraft({ ...draftWith(), schemaVersion: 2 }).ok, false);
});

test("invalid IDs, missing location, and unknown fields fail validation", () => {
  for (const patch of [
    { id: "__proto__" }, { id: "a b" }, { locator: {} }, { scenes: [] },
    { scenes: ["invalid scene"] }, { replacement: 7 }, { unknown: "value" }
  ]) {
    const result = Patches.validateDraft({ ...Patches.createDraft(BASELINE), entries: [record(patch)] });
    assert.equal(result.ok, false, JSON.stringify(patch));
  }
});

test("unsafe metadata and nested objects are rejected without prototype pollution", () => {
  const malicious = JSON.parse(JSON.stringify(draftWith()).replace('"selector":"#app .notice"', '"selector":"#app .notice","__proto__":{"polluted":true}'));
  assert.equal(Patches.validateDraft(malicious).ok, false);
  assert.equal({}.polluted, undefined);
  let nested = { leaf: true };
  for (let index = 0; index < 12; index += 1) nested = { next: nested };
  assert.equal(Patches.validateDraft({ ...Patches.createDraft(BASELINE), entries: [record({ source: nested })] }).ok, false);
  assert.equal(Patches.validateDraft({ ...Patches.createDraft(BASELINE), entries: [record({ source: new Date() })] }).ok, false);
});

test("oversized text and oversized input files fail before import", () => {
  const textResult = Patches.validateDraft({ ...Patches.createDraft(BASELINE), entries: [record({ replacement: "字".repeat(Patches.LIMITS.textLength + 1) })] });
  assert.equal(textResult.ok, false);
  const bytesResult = Patches.validateDraft(" ".repeat(Patches.LIMITS.bytes + 1));
  assert.equal(bytesResult.ok, false);
  assert.match(bytesResult.errors[0], /8 MB/);
  const utf8Result = Patches.validateDraft("中".repeat(Math.ceil(Patches.LIMITS.bytes / 3) + 1));
  assert.equal(utf8Result.ok, false);
  assert.match(utf8Result.errors[0], /8 MB/);
});

test("invalid export timestamps and excessive entry counts are rejected", () => {
  assert.equal(Patches.validateDraft({ ...Patches.createDraft(BASELINE), exportedAt: "yesterday" }).ok, false);
  assert.equal(Patches.validateDraft({ ...Patches.createDraft(BASELINE), entries: Array(Patches.LIMITS.entries + 1).fill(record()) }).ok, false);
  assert.throws(() => Patches.exportDraft(draftWith(), { now: "yesterday" }), /导出时间/);
});

test("risk warnings highlight puzzle dependencies without rejecting editorial changes", () => {
  assert.equal(Patches.riskWarnings("返回首页").length, 0);
  assert.equal(Patches.riskWarnings("B4 0713 guest_404").length, 1);
  assert.equal(Patches.riskWarnings("林华灿在 2026-06-17 09:10 使用 10.18.4.27 查看 2/17 条记录").length, 4);
  assert.equal(Patches.riskWarnings("${count} 条").length, 1);
  assert.equal(Patches.riskWarnings("多部门材料互相引用").length, 1);
});
