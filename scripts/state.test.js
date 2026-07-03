const assert = require("node:assert/strict");
const State = require("./state.js");

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    removeItem(key) {
      delete store[key];
    },
    dump() {
      return { ...store };
    }
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("loadState merges saved data with initial defaults", () => {
  const storage = createStorage({
    [State.STORAGE_KEY]: JSON.stringify({ loggedIn: true, evidence: ["e01"] })
  });
  const loaded = State.loadState({ storage, evidenceMap: { e01: true } });
  assert.equal(loaded.loggedIn, true);
  assert.deepEqual(loaded.evidence, ["e01"]);
  assert.equal(loaded.screen, "academic");
});

test("loadState filters evidence ids that are no longer defined", () => {
  const storage = createStorage({
    [State.STORAGE_KEY]: JSON.stringify({ evidence: ["e01", "missing"], recentEvidenceId: "missing" })
  });
  const loaded = State.loadState({ storage, evidenceMap: { e01: true } });
  assert.deepEqual(loaded.evidence, ["e01"]);
  assert.equal(loaded.recentEvidenceId, "");
});

test("loadState reopens intro modal for legacy saved states", () => {
  const legacyStorage = createStorage({
    [State.STORAGE_KEY]: JSON.stringify({ introSeen: true })
  });
  const migrated = State.loadState({ storage: legacyStorage, evidenceMap: {} });
  assert.equal(migrated.introSeen, false);
  assert.equal(migrated.introVersion, State.INTRO_VERSION);

  const currentStorage = createStorage({
    [State.STORAGE_KEY]: JSON.stringify({ introSeen: true, introVersion: State.INTRO_VERSION })
  });
  const current = State.loadState({ storage: currentStorage, evidenceMap: {} });
  assert.equal(current.introSeen, true);
});

test("loadState preserves guide flag without hiding session intro", () => {
  const storage = createStorage({
    [State.GUIDE_STORAGE_KEY]: "1",
    [State.STORAGE_KEY]: JSON.stringify({ introSeen: false })
  });
  const loaded = State.loadState({ storage, evidenceMap: {} });
  assert.equal(loaded.guideSeen, true);
  assert.equal(loaded.introSeen, false);
});

test("loadState can split session game state from persistent guide flag", () => {
  const sessionStorage = createStorage({
    [State.STORAGE_KEY]: JSON.stringify({ loggedIn: true, evidence: ["e01"] })
  });
  const guideStorage = createStorage({
    [State.GUIDE_STORAGE_KEY]: "1"
  });
  const loaded = State.loadState({ storage: sessionStorage, guideStorage, evidenceMap: { e01: true } });
  assert.equal(loaded.loggedIn, true);
  assert.equal(loaded.guideSeen, true);
  assert.equal(loaded.introSeen, false);
  assert.deepEqual(loaded.evidence, ["e01"]);
});

test("saveState omits transient UI fields", () => {
  const storage = createStorage();
  const state = {
    ...State.createInitialState(),
    loggedIn: true,
    toasts: [{ id: "toast", message: "x" }],
    noticeModal: "archive",
    mobileEvidenceOpen: true,
    recentEvidenceId: "e01",
    interactionLockedUntil: 123,
    voluntaryConfirmOpen: true
  };
  State.saveState(state, { storage });
  const saved = JSON.parse(storage.dump()[State.STORAGE_KEY]);
  assert.equal(saved.loggedIn, true);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "toasts"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "noticeModal"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "mobileEvidenceOpen"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "recentEvidenceId"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "interactionLockedUntil"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "voluntaryConfirmOpen"), false);
});

test("saveState writes first-run guide flag to persistent guide storage", () => {
  const sessionStorage = createStorage();
  const guideStorage = createStorage();
  State.saveState({ ...State.createInitialState(), guideSeen: true }, { storage: sessionStorage, guideStorage });
  assert.equal(guideStorage.dump()[State.GUIDE_STORAGE_KEY], "1");
  assert.equal(sessionStorage.dump()[State.GUIDE_STORAGE_KEY], undefined);
  assert.ok(sessionStorage.dump()[State.STORAGE_KEY]);
});

test("resetStoredState removes storage and returns a fresh initial state", () => {
  const storage = createStorage({ [State.STORAGE_KEY]: JSON.stringify({ loggedIn: true }) });
  const state = State.resetStoredState({ storage });
  assert.equal(storage.dump()[State.STORAGE_KEY], undefined);
  assert.equal(state.loggedIn, false);
  assert.deepEqual(state.unlocked, ["academic"]);
});

test("resetStoredState preserves first-run guide flag", () => {
  const storage = createStorage({
    [State.GUIDE_STORAGE_KEY]: "1",
    [State.STORAGE_KEY]: JSON.stringify({ loggedIn: true, introSeen: false })
  });
  const state = State.resetStoredState({ storage });
  assert.equal(storage.dump()[State.STORAGE_KEY], undefined);
  assert.equal(storage.dump()[State.GUIDE_STORAGE_KEY], "1");
  assert.equal(state.guideSeen, true);
  assert.equal(state.introSeen, false);
  assert.equal(state.loggedIn, false);
});
