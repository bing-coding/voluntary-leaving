const assert = require("node:assert/strict");
const PortalViews = require("./views/portal.js");

const h = (strings, ...values) => strings.reduce((out, string, index) => out + string + (values[index] ?? ""), "");
const header = (title, desc, tag = "") => `<div class="panel-head"><div><h1>${title}</h1><p>${desc}</p></div>${tag}</div>`;

function ctx(state = {}) {
  const evidence = state.evidence || [];
  const inspectedFields = state.inspectedFields || [];
  return {
    state: {
      riskLogs: [],
      guTimelineVisible: false,
      studentStatusRestored: false,
      ...state,
      evidence,
      inspectedFields
    },
    h,
    header,
    has: (id) => evidence.includes(id),
    inspected: (id) => inspectedFields.includes(id),
    renderRiskLogs: () => "<table><tr><td>risk log</td></tr></table>"
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

test("affairs view marks collected Mengqing evidence", () => {
  const html = PortalViews.renderAffairs(ctx({ evidence: ["e15"] }));
  assert.match(html, /学生事务服务大厅/);
  assert.match(html, /inspect-token marked/);
  assert.match(html, /GCZ-2024-discipline-withdraw/);
});

test("work view shows risk logs and flow shortcut", () => {
  const html = PortalViews.renderWork(ctx({ riskLogs: ["log"], inspectedFields: ["flow-loop"] }));
  assert.match(html, /学生状态研判与家校协同服务/);
  assert.match(html, /risk log/);
  assert.match(html, /进入学工系统核验/);
});

test("life view shows Gu timeline evidence state", () => {
  const html = PortalViews.renderLife(ctx({ evidence: ["e18"], guTimelineVisible: true }));
  assert.match(html, /顾天泽同学获信息化实践贡献专项加分/);
  assert.match(html, /新闻附件已核验/);
});

test("public view shows restored OCR entry and candidate cache", () => {
  const html = PortalViews.renderPublic(ctx({ evidence: ["e09", "e20", "e21"], studentStatusRestored: true }));
  assert.match(html, /推免候选排名缓存/);
  assert.match(html, /周启明会议纪要完整 OCR/);
  assert.match(html, /会议议题/);
});

test("public view marks recommendation cache ready after restored status and B4 source", () => {
  const html = PortalViews.renderPublic(ctx({ evidence: ["e09"], studentStatusRestored: true }));
  assert.match(html, /可核验/);
  assert.match(html, /核验推免候选缓存/);
  assert.doesNotMatch(html, /需要先取得 B4 调阅来源/);
});
