const assert = require("node:assert/strict");
const SystemViews = require("./views/systems.js");

const h = (strings, ...values) => strings.reduce((out, string, index) => out + string + (values[index] ?? ""), "");
const header = (title, desc, tag = "") => `<div class="panel-head"><div><h1>${title}</h1><p>${desc}</p></div>${tag}</div>`;

function ctx(state = {}) {
  const evidence = state.evidence || [];
  const inspectedFields = state.inspectedFields || [];
  return {
    state: {
      studentStatusRestored: false,
      publicChainVisible: false,
      forumPmUnlocked: false,
      ...state,
      evidence,
      inspectedFields
    },
    h,
    header,
    has: (id) => evidence.includes(id),
    inspected: (id) => inspectedFields.includes(id)
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

test("library view shows B4 record after evidence is collected", () => {
  const html = SystemViews.renderLibrary(ctx({ evidence: ["e09"] }));
  assert.match(html, /B4 档案室调阅登记/);
  assert.match(html, /env_library_archive_room_v3/);
});

test("library view shows restored B4 attachments after status restoration", () => {
  const html = SystemViews.renderLibrary(ctx({ studentStatusRestored: true }));
  assert.match(html, /B4 处置附件目录/);
  assert.match(html, /B4-incident-attach-C/);
});

test("forum view unlocks warning thread after public chain opens", () => {
  const html = SystemViews.renderForum(ctx({ publicChainVisible: true }));
  assert.match(html, /已锁定/);
  assert.doesNotMatch(html, /data-forum-thread="warning" disabled/);
});

test("forum warning thread is clickable before public chain evidence", () => {
  const html = SystemViews.renderForum(ctx());
  assert.match(html, /data-forum-thread="warning"/);
  assert.match(html, /已锁定/);
  assert.doesNotMatch(html, /需采购附件/);
  assert.doesNotMatch(html, /data-forum-thread="warning" disabled/);
});

test("mail view shows archive search after forward rule evidence", () => {
  const html = SystemViews.renderMail(ctx({ evidence: ["e10"] }));
  assert.match(html, /自动转发规则残留/);
  assert.match(html, /mail-archive-search/);
});

test("parent view shows mismatch after parent evidence", () => {
  const html = SystemViews.renderParent(ctx({ evidence: ["e12", "e13"] }));
  assert.match(html, /随附风险说明/);
  assert.match(html, /教务归档却改写/);
});

test("card view marks B4 and hospital inspected times", () => {
  const html = SystemViews.renderCard(ctx({ inspectedFields: ["card-b4", "card-hospital"], evidence: ["e08"] }));
  assert.match(html, /23:17/);
  assert.match(html, /inspect-token marked/);
  assert.match(html, /evidence_cctv_b4_gate_v3/);
});
