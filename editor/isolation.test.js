const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const GAME_FILES = [
  "game-data.js", "scripts/constants.js", "scripts/rules.js", "scripts/state.js",
  "scripts/modals/index.js", "scripts/views/portal.js", "scripts/views/systems.js",
  "scripts/views/core.js", "scripts/views/review.js", "scripts/actions.js", "app.js"
];

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

// The DOM stub supplies only event registration and form values. All game state,
// actions, rendering and preview timer handling execute from the real modules.
function createGame(preview = true) {
  const storageCalls = [];
  const storedSession = { "voluntary-leave-state": JSON.stringify({ evidence: ["e21"], loggedIn: false }) };
  const storedLocal = { "voluntary-leave-state": "legacy-game-progress", "voluntary-leave-guide-seen": "0" };
  function storage(name, values) {
    return {
      getItem(key) { storageCalls.push([name, "get", key]); return values[key] ?? null; },
      setItem(key, value) { storageCalls.push([name, "set", key]); values[key] = String(value); },
      removeItem(key) { storageCalls.push([name, "remove", key]); delete values[key]; }
    };
  }
  let html = "";
  let controls = [];
  let inputs = new Map();
  const app = {};
  function control(dataset, value = "") {
    const handlers = {};
    return {
      dataset, value, handlers,
      classList: { add() {}, remove() {} },
      addEventListener(name, fn) { handlers[name] = fn; },
      closest() { return null; },
      focus() {}, select() {}
    };
  }
  Object.defineProperty(app, "innerHTML", {
    get() { return html; },
    set(value) {
      html = value;
      controls = [...value.matchAll(/data-action="([^"]+)"/g)].map((match) => control({ action: match[1] }));
      controls.push(...[...value.matchAll(/data-clue-term="([^"]+)"/g)].map((match) => control({ clueTerm: match[1] })));
      inputs = new Map([...value.matchAll(/<(?:input|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/g)].map((match) => {
        const initialValue = match[0].match(/\bvalue="([^"]*)"/)?.[1] || "";
        return [match[1], control({}, initialValue)];
      }));
    }
  });
  const document = {
    getElementById(id) { return id === "app" ? app : inputs.get(id) || null; },
    querySelectorAll(selector) {
      if (selector === "[data-action]") return controls.filter((item) => item.dataset.action);
      if (selector === "[data-clue-term]") return controls.filter((item) => item.dataset.clueTerm);
      return [];
    },
    onkeydown: null
  };
  const timers = new Map();
  let timerId = 0;
  const context = {
    document, console,
    sessionStorage: storage("session", storedSession),
    localStorage: storage("local", storedLocal),
    setTimeout(fn, delay, ...args) { const id = ++timerId; timers.set(id, { fn, args, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    navigator: {}
  };
  context.window = context;
  vm.createContext(context);
  if (preview) vm.runInContext(fs.readFileSync(path.join(ROOT, "editor/preview-boot.js"), "utf8"), context, { filename: "editor/preview-boot.js" });
  GAME_FILES.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file }));
  return {
    context, timers, storageCalls, storedSession, storedLocal,
    get html() { return html; },
    get state() { return JSON.parse(JSON.stringify(context.VoluntaryLeavePreview.getState())); },
    load(state) { context.VoluntaryLeavePreview.loadScene({ state }); },
    click(action) {
      const button = controls.find((item) => item.dataset.action === action);
      assert(button, `Missing action ${action}`);
      assert(button.handlers.click, `Missing click handler for ${action}`);
      button.handlers.click({ preventDefault() {}, stopPropagation() {} });
    },
    clickClue(term) {
      const button = controls.find((item) => item.dataset.clueTerm === term);
      assert(button, `Missing clue ${term}`);
      button.handlers.click();
    },
    input(id, value) {
      const field = inputs.get(id);
      assert(field, `Missing input ${id}`);
      field.value = value;
      field.handlers.input?.({ target: field });
    },
    flushTimers() {
      let remaining = 100;
      while (timers.size && remaining-- > 0) {
        const [id, timer] = timers.entries().next().value;
        timers.delete(id);
        timer.fn(...timer.args);
      }
      assert(remaining > 0, "Unexpected recurring timers");
    }
  };
}

const academic = {
  loggedIn: true, guideSeen: true, introSeen: true,
  screen: "academic", unlocked: ["academic", "materials", "student"], evidence: []
};

test("preview boot and gameplay never read, overwrite or clear normal game storage", () => {
  const game = createGame();
  const before = JSON.stringify([game.storedSession, game.storedLocal]);
  assert.deepEqual(game.storageCalls, []);
  game.load(academic);
  game.click("flow-early-node");
  assert.deepEqual(game.state.evidence, ["e01"]);
  game.flushTimers();
  game.click("withdraw");
  assert.equal(game.state.identityGlitch, true);
  game.flushTimers();
  game.click("reset");
  assert.equal(game.state.loggedIn, false);
  assert.deepEqual(game.state.evidence, []);
  game.flushTimers();
  assert.deepEqual(game.storageCalls, []);
  assert.equal(JSON.stringify([game.storedSession, game.storedLocal]), before);
});

test("loading a scene cancels old evidence and toast timers before rendering", () => {
  const game = createGame();
  game.load(academic);
  game.click("flow-early-node");
  assert(game.timers.size >= 2);
  const patch = { ...academic, recentEvidenceId: "e01", toasts: [{ id: "keep", message: "当前场景专用提示" }] };
  game.load(patch);
  assert.equal(game.timers.size, 0);
  game.flushTimers();
  assert.equal(game.state.recentEvidenceId, "e01");
  assert.equal(game.state.toasts[0].message, "当前场景专用提示");
});

test("loading a scene cancels old identity effects without mutating the new fixture", () => {
  const game = createGame();
  game.load(academic);
  game.click("withdraw");
  assert(game.timers.size > 0);
  game.load({ ...academic, identityGlitch: true, accountGlitch: true });
  game.flushTimers();
  assert.equal(game.state.identityGlitch, true);
  assert.equal(game.state.accountGlitch, true);
});

test("loading a scene cancels autocomplete callbacks from the previous scene", () => {
  const game = createGame();
  game.load(academic);
  game.input("portal-search", "B4");
  assert.equal(game.state.portalAutocompleteActive, true);
  assert(game.timers.size >= 2);
  game.load({ ...academic, portalQuery: "孟清", portalAutocompleteActive: true, portalAutocompleteHint: "保留本场景提示" });
  game.flushTimers();
  assert.equal(game.state.portalQuery, "孟清");
  assert.equal(game.state.portalAutocompleteHint, "保留本场景提示");
  assert.equal(game.state.portalAutocompleteActive, true);
});

test("the in-game reset control also cancels queued preview timers", () => {
  const game = createGame();
  game.load(academic);
  game.click("flow-early-node");
  assert(game.timers.size >= 2);
  game.click("reset");
  assert.equal(game.timers.size, 0);
  assert.equal(game.state.loggedIn, false);
  assert.deepEqual(game.storageCalls, []);
});

test("late clipboard completion cannot change a different preview scene", () => {
  const game = createGame();
  let resolveCopy;
  game.context.navigator.clipboard = {
    writeText() {
      return { then(fn) { resolveCopy = fn; return { catch() {} }; } };
    }
  };
  game.load({ ...academic, evidence: ["e01"] });
  game.clickClue("0713");
  assert.equal(typeof resolveCopy, "function");
  game.load({ ...academic, copiedClueTerm: "current-scene-marker" });
  resolveCopy();
  assert.equal(game.state.copiedClueTerm, "current-scene-marker");
  assert.equal(game.timers.size, 0);
});

test("scene patches are cloned and transient states survive the direct preview bridge", () => {
  const game = createGame();
  const fixture = { ...academic, evidence: ["e01"], noticeModal: "archive", loginError: "错误提示" };
  game.load(fixture);
  fixture.evidence.push("e21");
  assert.deepEqual(game.state.evidence, ["e01"]);
  assert.equal(game.state.noticeModal, "archive");
  assert.equal(game.state.loginError, "错误提示");
  const snapshot = game.context.VoluntaryLeavePreview.getState();
  snapshot.evidence.push("e02");
  assert.deepEqual(game.state.evidence, ["e01"]);
});

test("normal gameplay keeps its existing storage lifecycle and has no preview bridge", () => {
  const game = createGame(false);
  assert.equal(game.context.VoluntaryLeavePreview, undefined);
  assert(game.storageCalls.some((call) => call[1] === "get" && call[2] === "voluntary-leave-state"));
  game.click("guide-seen");
  assert(game.storageCalls.some((call) => call[0] === "session" && call[1] === "set" && call[2] === "voluntary-leave-state"));
  assert(game.storageCalls.some((call) => call[0] === "local" && call[1] === "set" && call[2] === "voluntary-leave-guide-seen"));
});

function createEditor({ baseline, scenes, storedDraft = null }) {
  function element(tag = "div") {
    const result = {
      tag, dataset: {}, style: {}, children: [], handlers: {}, value: "", textContent: "", hidden: false,
      clientWidth: 1000, clientHeight: 900,
      classList: { add() {}, remove() {}, toggle() {} },
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      addEventListener(name, fn) { this.handlers[name] = fn; },
      setAttribute() {}, close() {}, showModal() {},
      querySelectorAll(selector) {
        const found = [];
        const walk = (node) => {
          if (selector === "[data-scene-id]" && node.dataset?.sceneId) found.push(node);
          node.children?.forEach(walk);
        };
        this.children.forEach(walk);
        return found;
      }
    };
    Object.defineProperty(result, "innerHTML", {
      set() { throw new Error("Editor copy must be inserted with textContent, not innerHTML"); }
    });
    return result;
  }
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) ids.set(id, element());
    return ids.get(id);
  };
  get("viewport").value = "desktop";
  get("zoom").value = "fit";
  const storageKey = `voluntary-leaving-copy-editor:v1:${baseline}`;
  const storage = new Map(storedDraft ? [[storageKey, storedDraft]] : []);
  const context = {
    console, innerWidth: 1440, location: { hash: "" }, history: { replaceState() {} },
    document: { getElementById: get, createElement: element, querySelectorAll() { return []; } },
    localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); } },
    ResizeObserver: class { observe() {} },
    addEventListener() {}, setTimeout() {},
    VoluntaryLeaveCopySources: { baseline, files: [] },
    VoluntaryLeaveEditorScenes: scenes
  };
  context.window = context;
  vm.createContext(context);
  // The model and editor must share the parent realm exactly as in the browser.
  // Injecting a host-realm require("./patches.js") would conceal iframe boundaries.
  vm.runInContext(fs.readFileSync(path.join(ROOT, "editor/patches.js"), "utf8"), context, { filename: "editor/patches.js" });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "editor/editor.js"), "utf8"), context, { filename: "editor/editor.js" });
  return { context, get, storage, storageKey };
}

test("locating an imported change uses the trusted scene, never imported source context", () => {
  const Patches = require("./patches.js");
  const trustedScene = { id: "review-trusted", group: "复核", title: "终审复核", description: "可信场景", state: { ...academic, screen: "review", reviewError: "" } };
  const baseline = "isolation-test-baseline";
  const draft = Patches.updateEntry(Patches.createDraft(baseline), {
    id: "copy-context-test", kind: "text", original: "原文", replacement: "修改稿",
    locator: { selector: "#app", textIndex: 0 }, scenes: [trustedScene.id],
    source: { sceneTitle: "导入记录", context: { ...trustedScene.state, reviewError: '<img src=x onerror="window.injected=true">' } }
  });
  const { context, get } = createEditor({ baseline, scenes: [trustedScene], storedDraft: Patches.exportDraft(draft) });
  const loaded = [];
  context.VoluntaryLeaveEditorHost.onReady({ loadScene(scene) { loaded.push(scene); }, setEdits() {}, setMode() {} });
  get("changes-button").handlers.click();
  const row = get("changes-list").children[0];
  const locateButton = row.children[0].children.find((child) => child.tag === "button");
  assert(locateButton);
  locateButton.handlers.click();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[1], trustedScene);
  assert.equal(loaded[1].state.reviewError, "");
});

test("editing a record from the preview realm persists through the real parent input handler", () => {
  const baseline = "cross-realm-baseline";
  const scene = { id: "academic-before", group: "教务", title: "教务首页", description: "复学前", state: academic };
  const { context, get, storage, storageKey } = createEditor({ baseline, scenes: [scene] });
  const child = vm.createContext({});
  vm.runInContext(`
    var record = {
      id: 'copy-cross-realm', kind: 'text', original: '等待复核', replacement: '等待复核',
      locator: { sceneId: 'academic-before', selector: '#app h1', textIndex: 0 },
      scenes: ['academic-before'], label: '页面文字'
    };
    var state = { screen: 'academic', evidence: ['e01'], toasts: [], messageLog: [], preEndingState: null };
  `, child);
  const parentPrototype = vm.runInContext("Object.prototype", context);
  assert.notEqual(Object.getPrototypeOf(child.record.locator), parentPrototype);
  assert.notEqual(Object.getPrototypeOf(child.state), parentPrototype);
  let previewEntries = [];
  context.VoluntaryLeaveEditorHost.onReady({
    loadScene() {}, setMode() {},
    setEdits(entries) { previewEntries = entries; },
    getState() { return child.state; }
  });
  context.VoluntaryLeaveEditorHost.onSelect(child.record);
  const replacement = '<img src=x onerror="window.injected=true"><script>window.injected=true</script>';
  get("copy-replacement").value = replacement;
  get("copy-note").value = "确认语境";
  get("copy-replacement").handlers.input();
  assert.equal(get("change-count").textContent, 1);
  assert.equal(previewEntries.length, 1);
  assert.equal(previewEntries[0].replacement, replacement);
  assert.equal(Object.getPrototypeOf(previewEntries[0].locator), parentPrototype);
  assert.equal(Object.getPrototypeOf(previewEntries[0].source.context), parentPrototype);
  const saved = JSON.parse(storage.get(storageKey));
  assert.equal(saved.entries.length, 1);
  assert.equal(saved.entries[0].replacement, replacement);
  assert.equal(saved.entries[0].note, "确认语境");
  assert.equal(saved.entries[0].source.context.screen, "academic");
  assert.equal(saved.entries[0].source.context.toasts, undefined);
  assert.equal(context.injected, undefined);
  context.VoluntaryLeaveEditorHost.onRecords([child.record]);
  get("changes-button").handlers.click();
  const renderedAfter = get("changes-list").children[0].children.find((item) => item.className === "after");
  assert.equal(renderedAfter.textContent, replacement);
  // A fresh editor instance must restore the serialized edit, not just its count.
  const reloaded = createEditor({ baseline, scenes: [scene], storedDraft: storage.get(storageKey) });
  let restored = [];
  reloaded.context.VoluntaryLeaveEditorHost.onReady({ loadScene() {}, setMode() {}, setEdits(entries) { restored = entries; } });
  assert.equal(restored.length, 1);
  assert.equal(restored[0].replacement, replacement);
});
