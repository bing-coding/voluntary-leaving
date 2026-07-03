const assert = require("node:assert/strict");
const Actions = require("./actions.js");

let fields = {};
global.document = {
  getElementById(id) {
    return fields[id] ? { value: fields[id] } : null;
  }
};

const EVIDENCE = {
  e01: {},
  e02: {},
  e03: {},
  e07: {},
  e09: {},
  e11: {},
  e14: {},
  e19: {},
  e20: {},
  e21: {}
};

const REVIEW_ROUTE = [
  ["学工", "发起复核", 62],
  ["教务", "回转学籍", 34]
];

function ctx(overrides = {}) {
  const state = {
    evidence: [],
    unlocked: [],
    inspectedFields: [],
    archiveFields: [],
    selectedEvidence: [],
    portalResults: [],
    portalQuery: "",
    riskLogs: [],
    sensitiveSearchCount: 0,
    studentStatusRestored: false,
    hiddenEvidence20Unlocked: false,
    trueEndingReady: false,
    reviewError: "",
    noticeModal: "",
    interactionLockedUntil: 0,
    ...overrides
  };
  const ended = [];
  const context = {
    state,
    EVIDENCE,
    REVIEW_ROUTE,
    setState(patch) {
      Object.assign(state, patch);
    },
    resetGame() {
      state.reset = true;
    },
    act(fn) {
      fn();
    },
    unlock(id) {
      if (!state.unlocked.includes(id)) state.unlocked.push(id);
    },
    addRiskLog(text) {
      state.riskLogs.push(text);
    },
    buildPortalResults(query) {
      return query ? [{ query }] : [];
    },
    inspectField(id) {
      if (!state.inspectedFields.includes(id)) state.inspectedFields.push(id);
    },
    inspected(id) {
      return state.inspectedFields.includes(id);
    },
    addEvidence(id) {
      if (!state.evidence.includes(id)) state.evidence.push(id);
    },
    toast(text) {
      state.toast = text;
    },
    flashAccount() {
      state.flashed = true;
    },
    triggerIdentityGlitch() {
      state.glitched = true;
      state.glitchCount = (state.glitchCount || 0) + 1;
    },
    appendAppealLog() {
      state.appealed = true;
    },
    end(type) {
      ended.push(type);
      state.ended = type;
    },
    has(id) {
      return state.evidence.includes(id);
    },
    flowReviewEvidence() {
      return ["e01", "e02", "e07"];
    },
    reviewSubmittedEvidence() {
      return state.selectedEvidence;
    },
    getEvidenceProfile(evidence = state.evidence) {
      return {
        withdrawalReady: evidence.includes("e01") && evidence.includes("e02") && evidence.includes("e07"),
        b4Ready: evidence.includes("e09") || evidence.includes("e11"),
        publicReady: evidence.includes("e19") || evidence.includes("e21")
      };
    },
    isLowRiskReviewRoute(evidence) {
      return evidence.includes("e01") && evidence.includes("e02") && evidence.includes("e07");
    },
    isTrueEndingReady() {
      return state.evidence.includes("e20") && state.evidence.includes("e09") && state.evidence.includes("e11") && state.evidence.includes("e19") && state.evidence.includes("e21");
    },
    isInteractionLocked() {
      return state.interactionLockedUntil > Date.now();
    },
    ended
  };
  return context;
}

function test(name, fn) {
  try {
    fields = {};
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("login action validates captcha and sets login state", () => {
  const context = ctx();
  fields["login-captcha"] = "bad";
  Actions.handleAction(context, "login");
  assert.equal(context.state.loginError, "验证码输入错误，请重新输入。");

  fields["login-captcha"] = "0713";
  Actions.handleAction(context, "login");
  assert.equal(context.state.loggedIn, true);
  assert.equal(context.state.loginError, "");
});

test("guide action keeps the session intro available", () => {
  const context = ctx({ guideSeen: false, introSeen: false });
  Actions.handleAction(context, "guide-seen");
  assert.equal(context.state.guideSeen, true);
  assert.equal(context.state.introSeen, false);
});

test("locked interaction only allows whitelisted close actions", () => {
  const context = ctx({ interactionLockedUntil: Date.now() + 10_000 });
  Actions.handleAction(context, "login");
  assert.equal(context.state.loggedIn, undefined);

  Actions.handleAction(context, "notice-archive");
  assert.equal(context.state.noticeModal, "");

  Actions.handleAction(context, "close-notice");
  assert.equal(context.state.noticeModal, "");
});

test("portal search records sensitive query and builds results", () => {
  const context = ctx({ mobileNavOpen: true, mobileEvidenceOpen: true });
  fields["portal-search"] = "B4 guest_404";
  Actions.handleAction(context, "portal-search");
  assert.equal(context.state.portalQuery, "B4 guest_404");
  assert.equal(context.state.portalResults.length, 1);
  assert.equal(context.state.sensitiveSearchCount, 1);
  assert.equal(context.state.mobileNavOpen, false);
  assert.equal(context.state.mobileEvidenceOpen, false);
});

test("mobile drawers switch cleanly", () => {
  const context = ctx({ mobileNavOpen: true, mobileEvidenceOpen: false });
  Actions.handleAction(context, "open-mobile-evidence");
  assert.equal(context.state.mobileNavOpen, false);
  assert.equal(context.state.mobileEvidenceOpen, true);

  Actions.handleAction(context, "open-mobile-nav");
  assert.equal(context.state.mobileNavOpen, true);
  assert.equal(context.state.mobileEvidenceOpen, false);
});

test("talk source accepts visible hint keywords", () => {
  const context = ctx();
  fields["url-param"] = "原始记录";
  Actions.handleAction(context, "source-param");
  assert.ok(context.state.evidence.includes("e03"));
  assert.equal(context.state.talkSourceModal, true);
});

test("withdraw identity glitch only appears on first failed attempt", () => {
  const context = ctx();
  Actions.handleAction(context, "withdraw");
  Actions.handleAction(context, "withdraw");
  assert.equal(context.state.withdrawAttempts, 2);
  assert.equal(context.state.glitchCount, 1);
  assert.ok(context.state.unlocked.includes("student"));
});

test("voluntary ending requires a second confirmation", () => {
  const context = ctx({ evidence: ["e01"] });
  Actions.handleAction(context, "voluntary");
  assert.equal(context.state.voluntaryConfirmOpen, true);
  assert.equal(context.state.ended, undefined);

  Actions.handleAction(context, "cancel-voluntary");
  assert.equal(context.state.voluntaryConfirmOpen, false);

  Actions.handleAction(context, "voluntary");
  Actions.handleAction(context, "confirm-voluntary");
  assert.equal(context.state.ended, "voluntary");
});

test("recommendation cache evidence requires restored student status", () => {
  const leaving = ctx({ evidence: ["e09"] });
  Actions.handleAction(leaving, "search-recommend-cache");
  assert.equal(leaving.state.evidence.includes("e21"), false);
  assert.equal(leaving.state.toast, "候选排名缓存需要在籍学生权限。请先完成流程回转。");

  const restored = ctx({ studentStatusRestored: true, evidence: ["e09"] });
  Actions.handleAction(restored, "search-recommend-cache");
  assert.equal(restored.state.evidence.includes("e21"), true);
});

test("public full OCR requires restored student status", () => {
  const context = ctx();
  Actions.handleAction(context, "public-full-ocr");
  assert.equal(context.state.reviewError, "当前账号仍处于离校过渡期，无法查看完整 OCR。");
  assert.equal(context.state.hiddenEvidence20Unlocked, false);

  const restored = ctx({ studentStatusRestored: true, evidence: ["e09", "e11", "e19", "e21"] });
  Actions.handleAction(restored, "public-full-ocr");
  assert.equal(restored.state.hiddenEvidence20Unlocked, true);
  assert.equal(restored.state.trueEndingReady, true);
  assert.ok(restored.state.evidence.includes("e20"));
  assert.ok(restored.state.unlocked.includes("review"));
});

test("archive fields unlock review evidence after comparison", () => {
  const context = ctx();
  Actions.handleAction(context, "archive-source");
  Actions.handleAction(context, "archive-parent");
  Actions.handleAction(context, "archive-parent");
  Actions.handleAction(context, "archive-final");
  Actions.handleAction(context, "archive-compare");
  assert.deepEqual(context.state.archiveFields, ["archive-source", "archive-parent", "archive-final"]);
  assert.ok(context.state.evidence.includes("e14"));
  assert.ok(context.state.unlocked.includes("review"));
});

test("review actions select route evidence and submit rollback", () => {
  const context = ctx({ selectedUnit: "不存在明确责任单位" });
  Actions.handleAction(context, "select-flow-review-evidence");
  assert.deepEqual(context.state.selectedEvidence, ["e01", "e02", "e07"]);

  Actions.handleAction(context, "submit-review");
  assert.equal(context.state.permissionLevel, "reviewing");
  assert.equal(context.state.reviewRouteStep, 1);
});
