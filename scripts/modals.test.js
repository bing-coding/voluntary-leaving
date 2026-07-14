const assert = require("node:assert/strict");
const Modals = require("./modals/index.js");

const h = (strings, ...values) => strings.reduce((out, string, index) => out + string + (values[index] ?? ""), "");

const baseContext = {
  h,
  has: () => false,
  LIBRARY_EGGS: {
    qingchuan: {
      title: "旧刊标题",
      tag: "旧刊",
      image: "./assets/evidence_b4_archive_zhou_qiming.jpg",
      body: ["旧刊正文"],
      footer: "旧刊编号"
    }
  },
  FORUM_THREADS: {
    warning: {
      title: "锁帖标题",
      tag: "已锁定",
      posts: [["楼主", "帖子内容"]],
      footer: "锁定原因"
    }
  }
};

function ctx(state, overrides = {}) {
  return {
    ...baseContext,
    ...overrides,
    state: {
      noticeModal: "",
      affairsModal: "",
      talkSourceModal: false,
      workOrderFlowModal: false,
      publicChainModal: false,
      publicChainFields: [],
      guTimelineModal: false,
      introSeen: true,
      loggedIn: true,
      libraryEgg: "",
      forumThread: "",
      forumPmPopup: false,
      appealHorrorPopup: false,
      appealCount: 0,
      restoreNoticePopup: false,
      ...state
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

test("notice modal renders selected notice", () => {
  const html = Modals.renderNoticeModal(ctx({ noticeModal: "archive" }));
  assert.match(html, /学籍数据归档/);
  assert.match(html, /data-action="close-notice"/);
});

test("affairs evidence modal renders xzy variant", () => {
  const html = Modals.renderAffairsEvidenceModal(ctx({ affairsModal: "xzy" }));
  assert.match(html, /谈话材料历史版本记录/);
  assert.match(html, /材料归档历史版本缓存/);
  assert.match(html, /历史草稿 A/);
});

test("public chain modal enables evidence action after three fields", () => {
  const html = Modals.renderPublicChainModal(ctx({ publicChainModal: true, publicChainFields: ["supplier", "partner", "minutes"] }));
  assert.match(html, /形成核验记录 3\/3/);
  assert.match(html, /联系人：<strong>顾兴学<\/strong>/);
  assert.doesNotMatch(html, /<strong>青川智教信息技术有限公司/);
  assert.doesNotMatch(html, /public-chain-evidence" disabled/);
});

test("library and forum content render from data maps", () => {
  const libraryHtml = Modals.renderLibraryEggModal(ctx({ libraryEgg: "qingchuan" }));
  assert.match(libraryHtml, /旧刊标题/);
  assert.match(libraryHtml, /evidence_b4_archive_zhou_qiming\.jpg/);
  assert.doesNotMatch(libraryHtml, /evidence_b4_archive_zhou_qiming\.png/);
  assert.match(Modals.renderForumThreadModal(ctx({ forumThread: "warning" })), /锁帖标题/);
});

test("restore notice modal renders rollback receipt", () => {
  const html = Modals.renderRestoreNoticeModal(ctx({ restoreNoticePopup: true }));
  assert.match(html, /XJYD-0713-ROLLBACK/);
  assert.match(html, /close-restore-notice/);
});

test("voluntary confirmation modal blocks accidental ending", () => {
  const html = Modals.renderVoluntaryConfirmModal(ctx({ voluntaryConfirmOpen: true, evidence: ["e01", "e02"] }));
  assert.match(html, /你确认“自愿离校”吗？/);
  assert.match(html, /点击确认，即可离开。/);
  assert.match(html, /class="voluntary-confirm-command">点击确认。/);
  assert.match(html, /class="voluntary-confirm-exit">离开。/);
  assert.match(html, /data-action="cancel-voluntary"/);
  assert.match(html, /data-action="confirm-voluntary"/);
});
