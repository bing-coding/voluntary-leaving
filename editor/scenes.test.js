const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scenes = require("./scenes.js");

const root = path.resolve(__dirname, "..");
const appElement = { innerHTML: "" };
const sandbox = {
  console,
  document: {
    getElementById(id) { return id === "app" ? appElement : null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  location: { search: "", href: "http://localhost/index.html", origin: "http://localhost" },
  navigator: {},
  URLSearchParams,
  setTimeout() { return 1; },
  clearTimeout() {},
  addEventListener() {},
  dispatchEvent() {}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of ["game-data.js", "scripts/constants.js", "scripts/rules.js", "scripts/state.js", "scripts/modals/index.js", "scripts/views/portal.js", "scripts/views/systems.js", "scripts/views/core.js", "scripts/views/review.js", "scripts/actions.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}

// Render fixtures through the real view functions. This test hook is applied to
// an in-memory source copy only; no production source or browser save is changed.
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const ending = /\n  render\(\);\s*\}\)\(\);\s*$/;
assert.match(source, ending, "app entry point changed: update the isolated render harness");
vm.runInContext(source.replace(ending, `
  window.__renderSceneForTest = function (scene) {
    state = { ...State.createInitialState(), ...JSON.parse(JSON.stringify(scene.state)) };
    if (scene.searchQuery) state.portalResults = buildPortalResults(scene.searchQuery);
    render();
    return app.innerHTML;
  };
})();`), sandbox, { filename: "app.js" });

assert.equal(new Set(scenes.map((scene) => scene.id)).size, scenes.length, "scene IDs must be unique");
const evidenceIds = new Set(Object.keys(sandbox.VoluntaryLeaveData.EVIDENCE));
const rendered = new Map();
for (const scene of scenes) {
  assert.ok(scene.id && scene.group && scene.title && scene.description, "scene metadata is required");
  assert.ok(scene.state.evidence.every((id) => evidenceIds.has(id)), `${scene.id}: invalid evidence`);
  if (scene.searchQuery) assert.equal(scene.searchQuery, scene.state.portalQuery, `${scene.id}: inconsistent query`);
  const html = sandbox.__renderSceneForTest(scene);
  assert.ok(html.length > 100, `${scene.id}: empty page`);
  assert.ok(!html.includes("[object Object]"), `${scene.id}: invalid object rendered as copy`);
  rendered.set(scene.id, html);
}

assert.match(rendered.get("material-psych-redacted"), /2026 春季学期\*\*\*\*/);
assert.doesNotMatch(rendered.get("material-psych-redacted"), /页面标题<\/span><span>2026 春季学期课程学习体验反馈/);
assert.match(rendered.get("material-psych-restored"), /页面标题<\/span><span>2026 春季学期课程学习体验反馈/);
assert.match(rendered.get("search-rank-before-restore"), /命中公开名单缓存，但当前账号仍需恢复在籍权限/);
assert.match(rendered.get("search-rank-ready"), /命中公开名单的缓存版本，需带入 B4 调阅来源交叉核验/);
assert.match(rendered.get("search-b4-cache"), /guest_404 引用过被删图片/);
assert.match(rendered.get("ending-voluntary-low"), /随波逐流/);
assert.match(rendered.get("ending-voluntary-high"), /抱薪留火/);
assert.match(rendered.get("ending-restore-low"), /但把你真正追问的部分关掉了/);
assert.match(rendered.get("ending-restore-high"), /补充材料留在复核附件中/);
assert.match(rendered.get("ending-public"), /新增 37 条引用/);
assert.match(rendered.get("ending-public-cache"), /新增 52 条引用/);
assert.match(rendered.get("ending-audit"), /周启明发送非模板消息/);
assert.match(rendered.get("ending-audit-cache"), /保研候选名单缓存写入附件/);
assert.match(rendered.get("ending-true"), /蚂蚁的胜利/);
assert.match(rendered.get("overlay-identity"), /未匹配到在籍记录/);
assert.match(rendered.get("overlay-pm"), /收到一条离线私信/);
assert.match(rendered.get("review-route-6"), /完成回转/);
assert.match(rendered.get("evidence-complete"), /本地调查摘要/);
assert.equal(scenes.find((scene) => scene.id === "academic-initial").state.evidence.length, 0, "rendering must not mutate fixture data");
const fixtureToasts = new Set(scenes.flatMap((scene) => (scene.state.toasts || []).map((item) => item.message)));
const fixtureLogs = new Set(scenes.flatMap((scene) => scene.state.riskLogs || []));
for (const file of ["app.js", "scripts/actions.js"]) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/\btoast\("([^"\n]*)"/g)) {
    assert.ok(fixtureToasts.has(match[1]), `${file}: new transient toast needs a review scene: ${match[1]}`);
  }
  for (const match of text.matchAll(/\baddRiskLog\("([^"\n]*)"/g)) {
    assert.ok(fixtureLogs.has(match[1]), `${file}: new risk log needs a review scene: ${match[1]}`);
  }
}
console.log(`ok - ${scenes.length} editor scenes render through the real game views`);
console.log("ok - mutually exclusive materials, search permissions, transient overlays and ending variants remain covered");
console.log("ok - every fixed toast and risk-log call has a review fixture");
