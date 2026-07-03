const assert = require("node:assert/strict");
const CoreViews = require("./views/core.js");
const constants = require("./constants.js");

const h = (strings, ...values) => strings.reduce((out, string, index) => out + string + (values[index] ?? ""), "");
const header = (title, desc, tag = "") => `<div class="panel-head"><div><h1>${title}</h1><p>${desc}</p></div>${tag}</div>`;

function ctx(state = {}) {
  const evidence = state.evidence || [];
  const inspectedFields = state.inspectedFields || [];
  return {
    state: {
      progress: 87,
      withdrawAttempts: 0,
      studentStatusRestored: false,
      materialTab: "application",
      pdfMetaVisible: false,
      pdfAuthorMarked: false,
      flowPreviewVisible: false,
      appealHorrorSeen: false,
      riskLogs: [],
      archiveFields: [],
      ...state,
      evidence,
      inspectedFields
    },
    h,
    header,
    has: (id) => evidence.includes(id),
    inspected: (id) => inspectedFields.includes(id),
    renderRiskLogs: () => "<table><tr><td>risk log</td></tr></table>",
    getAppealProfile: () => "学生再次提交异议，要求复核既有材料与流转依据。",
    REVIEW_ROUTE: constants.REVIEW_ROUTE
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

test("academic view shows restored state and review shortcut", () => {
  const html = CoreViews.renderAcademic(ctx({ studentStatusRestored: true, progress: 0 }));
  assert.match(html, /学籍异动撤销回执/);
  assert.match(html, /提交复学后补充材料/);
});

test("materials application tab shows pdf metadata evidence", () => {
  const html = CoreViews.renderMaterials(ctx({ materialTab: "application", pdfMetaVisible: true, pdfAuthorMarked: true }));
  assert.match(html, /xzy_admin/);
  assert.match(html, /作者字段并非学生账号/);
});

test("materials psych tab shows restored course feedback source", () => {
  const html = CoreViews.renderMaterials(ctx({ materialTab: "psychDoc", studentStatusRestored: true, evidence: ["e04"], inspectedFields: ["survey-source"] }));
  assert.match(html, /课程学习体验反馈/);
  assert.match(html, /不能证明独立心理评估/);
});

test("student view shows flow loop and rollback route after restoration", () => {
  const html = CoreViews.renderStudent(ctx({ studentStatusRestored: true, evidence: ["e07"], flowPreviewVisible: true }));
  assert.match(html, /责任闭环对比/);
  assert.match(html, /完整回转记录/);
});

test("archive view enables compare after three source fields", () => {
  const html = CoreViews.renderArchive(ctx({ archiveFields: ["archive-source", "archive-parent", "archive-final"] }));
  assert.match(html, /生成归档输出/);
  assert.doesNotMatch(html, /archive-compare" disabled/);
});

test("archive view shows output after evidence 14", () => {
  const html = CoreViews.renderArchive(ctx({ evidence: ["e14"] }));
  assert.match(html, /AUDIT-QCU-2026-0713/);
  assert.match(html, /转入终审复核/);
});
