(function () {
  const { EVIDENCE, SYSTEMS, CLUE_TERMS, LIBRARY_EGGS, FORUM_THREADS } = window.VoluntaryLeaveData;
  const Rules = window.VoluntaryLeaveRules;
  const State = window.VoluntaryLeaveState;
  const ReviewView = window.VoluntaryLeaveReviewView;
  const Modals = window.VoluntaryLeaveModals;
  const PortalViews = window.VoluntaryLeavePortalViews;
  const SystemViews = window.VoluntaryLeaveSystemViews;
  const CoreViews = window.VoluntaryLeaveCoreViews;
  const Actions = window.VoluntaryLeaveActions;
  const {
    RISK_LOG_LIMIT,
    REVIEW_SUPPORT_EVIDENCE,
    FLOW_INVALID_EVIDENCE,
    HIGH_RISK_B4_EVIDENCE,
    WITHDRAWAL_INVALID_EVIDENCE,
    B4_INTEREST_EVIDENCE,
    PUBLIC_EXPOSURE_EVIDENCE,
    REVIEW_ROUTE,
    PORTAL_SCREENS,
    TOP_CHANNELS
  } = window.VoluntaryLeaveConstants;
  const FULL_EVIDENCE_TOTAL = Object.keys(EVIDENCE).length;

  let state = State.loadState({ evidenceMap: EVIDENCE });
  let portalAutocompleteRun = 0;
  const app = document.getElementById("app");

  function saveState() {
    State.saveState(state);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    saveState();
    render();
  }

  function unlock(id) {
    if (!state.unlocked.includes(id)) state.unlocked.push(id);
  }

  function addRiskLog(text) {
    if (!state.riskLogs.includes(text)) {
      state.riskLogs.push(text);
      if (state.riskLogs.length > RISK_LOG_LIMIT) {
        state.riskLogs = state.riskLogs.slice(-RISK_LOG_LIMIT);
      }
    }
  }

  function formatRiskLogTime(index) {
    const total = 3 * 60 + 12 + index * 3;
    const hour = Math.floor(total / 60).toString().padStart(2, "0");
    const minute = (total % 60).toString().padStart(2, "0");
    return `${hour}:${minute}`;
  }

  function renderRiskLogs() {
    if (!state.riskLogs.length) return `<p class="muted">暂无新增关怀记录。</p>`;
    const maxVisible = 6;
    const hiddenCount = Math.max(0, state.riskLogs.length - maxVisible);
    const start = state.riskLogExpanded ? 0 : hiddenCount;
    const rows = state.riskLogs.slice(start).map((item, offset) => {
      const index = start + offset;
      return `<tr><td>${formatRiskLogTime(index)}</td><td>${escapeHtml(item)}</td></tr>`;
    }).join("");
    return h`
      ${!state.riskLogExpanded && hiddenCount ? `<div class="risk-log-summary">已折叠 ${hiddenCount} 条较早记录，只显示最近 ${maxVisible} 条。</div>` : ""}
      <table class="table risk-log-table"><tr><th>时间</th><th>记录内容</th></tr>${rows}</table>
      ${state.appealCount > 4 ? `<div class="risk-log-merge">重复异议累计 ${state.appealCount} 次，后续点击已并入同一条关怀标签。</div>` : ""}
      ${state.riskLogs.length > maxVisible ? `<div class="risk-log-actions"><button data-action="toggle-risk-log">${state.riskLogExpanded ? "收起较早记录" : "查看全部记录"}</button></div>` : ""}
    `;
  }

  function getAppealProfile() {
    if (state.appealCount <= 0) return "";
    if (state.appealCount === 1) return "学生再次提交异议，要求复核既有材料与流转依据。";
    if (state.appealCount === 2) return "关怀平台记录到学生重复提交异议，对既有沟通结果不认可。";
    return "关怀平台记录到学生多次重复提交异议，对既有沟通结果不认可，需回访确认。";
  }

  function appendAppealLog() {
    state.appealCount += 1;
    const logs = [
      "学生再次提交异议，要求复核既有材料与流转依据。",
      "学生重复提交异议，工单同步至关怀回访队列。",
      "学生继续追加异议，页面提示辅导员进行回访确认。"
    ];
    if (state.appealCount <= logs.length) {
      addRiskLog(logs[state.appealCount - 1]);
    } else if (state.appealCount > 4) {
      addRiskLog("后续重复提交已合并记录，关怀标签维持不变。");
    }
    if (state.appealCount >= 4) {
      state.appealHorrorPopup = true;
      state.appealHorrorSeen = true;
      unlock("parent");
      if (state.appealCount === 4) {
        addRiskLog("关怀阈值触发：重复异议被写入家长端风险提示。");
      }
    }
  }

  function flashAccount() {
    state.interactionLockedUntil = Date.now() + 1150;
    state.accountGlitch = true;
    state.accessDeniedGlitch = true;
    render();
    window.setTimeout(() => {
      state.accountGlitch = false;
      state.accessDeniedGlitch = false;
      state.interactionLockedUntil = 0;
      render();
    }, 1100);
  }

  function triggerIdentityGlitch() {
    state.interactionLockedUntil = Date.now() + 1850;
    state.accountGlitch = true;
    state.identityGlitch = true;
    state.accessDeniedGlitch = false;
    render();
    window.setTimeout(() => {
      state.identityGlitch = false;
      state.accountGlitch = false;
      state.interactionLockedUntil = 0;
      render();
    }, 1850);
  }

  function spend(minutes) {
    state.time = Math.max(0, state.time);
  }

  function addEvidence(id) {
    if (!state.evidence.includes(id)) {
      state.evidence.push(id);
      if (state.reviewSelectionMode === "flow") {
        state.selectedEvidence = flowReviewEvidence();
      }
      state.recentEvidenceId = id;
      toast(`新增本地证据：${EVIDENCE[id][0]} · ${EVIDENCE[id][1]}`);
      window.setTimeout(() => {
        if (state.recentEvidenceId === id) {
          state.recentEvidenceId = "";
          saveState();
          render();
        }
      }, 1600);
    }
  }

  function inspectField(id) {
    if (!state.inspectedFields.includes(id)) state.inspectedFields.push(id);
  }

  function inspected(id) {
    return state.inspectedFields.includes(id);
  }

  function act(fn, minutes = 6) {
    const previousScreen = state.screen;
    fn();
    if (state.screen !== previousScreen) {
      state.portalResults = [];
      state.mobileNavOpen = false;
      state.mobileEvidenceOpen = false;
    }
    spend(minutes);
    saveState();
    render();
  }

  function toast(message) {
    const item = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message };
    state.toasts = [...state.toasts.slice(-2), item];
    window.setTimeout(() => {
      state.toasts = state.toasts.filter((toastItem) => toastItem.id !== item.id);
      saveState();
      render();
    }, 1800);
  }

  function end(type) {
    state.ending = type;
    saveState();
    render();
  }

  function resetGame() {
    state = State.resetStoredState();
    render();
  }

  function h(strings, ...values) {
    return strings.reduce((out, string, index) => out + string + (values[index] ?? ""), "");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}:00`;
  }

  function has(id) {
    return state.evidence.includes(id);
  }

  function visibleEvidenceTotal() {
    let total = FULL_EVIDENCE_TOTAL;
    if (!state.studentStatusRestored && !has("e17")) total -= 1;
    if (!state.studentStatusRestored && !state.hiddenEvidence20Unlocked && !has("e20")) total -= 1;
    if (!state.studentStatusRestored && !has("e04")) total -= 1;
    return total;
  }

  function countEvidence(ids, sourceIds = state.evidence) {
    return Rules.countEvidence(ids, sourceIds);
  }

  function getEvidenceProfile(sourceIds = state.evidence) {
    return Rules.getEvidenceProfile(sourceIds);
  }

  function isFlowReviewReady(sourceIds = state.evidence) {
    return Rules.isFlowReviewReady(sourceIds);
  }

  function isLowRiskReviewRoute(sourceIds = state.evidence) {
    return Rules.isLowRiskReviewRoute(sourceIds);
  }

  function isTrueEndingReady() {
    return Rules.isTrueEndingReady(state, state.evidence);
  }

  function reviewSupportEvidence(sourceIds = state.evidence) {
    return Rules.reviewSupportEvidence(sourceIds);
  }

  function reviewSubmittedEvidence() {
    return Rules.reviewSubmittedEvidence(state, EVIDENCE);
  }

  function flowReviewEvidence() {
    return Rules.flowReviewEvidence(state);
  }

  function render() {
    if (state.ending) {
      app.innerHTML = renderEnding();
      bind();
      return;
    }
    if (!state.guideSeen) {
      app.innerHTML = renderGuide();
      bind();
      return;
    }
    if (!state.loggedIn) {
      app.innerHTML = renderLogin();
      bind();
      return;
    }
    app.innerHTML = renderShell();
    bind();
  }

  function renderGuide() {
    return h`
      <main class="guide-page">
        <section class="guide-panel">
          <div class="guide-kicker">网页解谜 · 系统悬疑</div>
          <h1>自愿离校</h1>
          <p class="guide-lead">你登录学校门户，只是想确认一条消息：有人说你已经退学了。</p>
          <div class="guide-brief">
            <div><strong>玩法</strong><span>在教务、学工、邮箱、论坛、图书馆等系统之间核对记录，收集本地证据。</span></div>
            <div><strong>目标</strong><span>先证明退学流程无效，再决定是否继续追查 B4 与推免候选名单。</span></div>
            <div><strong>提醒</strong><span>页面会保存进度。游戏内“重新开始”只重置本局，不会再次显示本导引页。</span></div>
          </div>
          <div class="guide-message">昨晚 23:47，同学发来一句：“你真的退学了？”</div>
          <div class="actions">
            <button class="primary" data-action="guide-seen">进入青川大学综合教务服务平台</button>
          </div>
        </section>
      </main>`;
  }

  function renderLogin() {
    return h`
      <main class="login-wrap">
        <div class="login-page-header">
          <div class="login-school">
            <img class="brand-logo" src="./assets/logo_qingchuan_university.svg" alt="青川大学校徽" />
            <div>
              <strong>青川大学</strong>
              <span>Qingchuan University</span>
            </div>
          </div>
          <div class="login-links">信息门户 | 网上办事大厅 | 帮助中心</div>
        </div>
        <section class="login-card">
          <div class="login-hero">
            <div>
              <h1>综合教务服务平台</h1>
              <p>统一身份认证 · 学籍异动 · 学生事务 · 学生工作</p>
            </div>
            <div class="login-notices">
              <div>通知公告</div>
              <button data-action="notice-archive"><span>06-24</span>学籍数据归档及离校过渡期账号权限调整通知</button>
              <button data-action="notice-service"><span>06-23</span>关于规范学生事务线上办理流程的提示</button>
            </div>
          </div>
          <div class="login-box">
            <div class="login-box-title">
              <img class="brand-logo" src="./assets/logo_qingchuan_university.svg" alt="青川大学校徽" />
              <h2>统一身份认证</h2>
            </div>
            <div class="login-tabs"><span class="active">账号登录</span><span>扫码登录</span><span>手机号登录</span></div>
            <div class="form-field">
              <label>用户名 / 学号 / 工号</label>
              <input class="readonly-input" value="2021060713" disabled />
            </div>
            <div class="form-field">
              <label>密码</label>
              <input class="readonly-input" value="********" type="password" disabled />
            </div>
            <div class="form-field captcha-row">
              <label>验证码</label>
              <div><input id="login-captcha" value="" inputmode="text" autocomplete="off" maxlength="4" placeholder="请输入验证码" /><span>7 1 3 A</span></div>
            </div>
            ${state.loginError ? `<div class="login-error">${escapeHtml(state.loginError)}</div>` : ""}
            <button class="primary" data-action="login">登录</button>
            <div class="login-assist">忘记密码？ | 账号激活 | 浏览器兼容说明</div>
            <p class="muted">上次登录：2026-06-24 02:14 · 10.18.4.27</p>
          </div>
        </section>
        <div class="login-footer">建议使用 Chrome、Edge、Firefox 浏览器访问。版权所有 © 青川大学信息化办公室</div>
        ${renderNoticeModal()}
        ${renderIntroModal()}
      </main>`;
  }

  function renderShell() {
    const locked = isInteractionLocked();
    return h`
      <div class="app-shell ${locked ? "is-locked" : ""} ${state.mobileNavOpen || state.mobileEvidenceOpen ? "mobile-panel-open" : ""}">
        <div class="utilitybar">
          <div>青川大学信息门户</div>
          <div>今日：2026-06-24　角色：学生　消息 <strong>0</strong>　退出</div>
        </div>
        <header class="topbar">
          <div class="topbar-inner">
            <div class="brand">
              <img class="brand-logo" src="./assets/logo_qingchuan_university.svg" alt="青川大学校徽" />
              <div>
                <div class="brand-title">青川大学综合教务服务平台</div>
                <div class="brand-subtitle">QCU Academic Affairs & Student Service Portal</div>
              </div>
            </div>
            <div class="portal-search ${state.portalAutocompleteActive ? "autocomplete-glitch" : ""}" data-autocomplete-hint="${escapeHtml(state.portalAutocompleteHint)}"><input id="portal-search" value="${escapeHtml(state.portalAutocompleteActive ? state.portalAutocompletePreview : state.portalQuery)}" placeholder="事项名称 / 流程编号 / 人名 / IP" autocomplete="off" /><button data-action="portal-search">搜索</button></div>
            <div class="account ${state.accountGlitch ? "account-glitch" : ""}">
              ${state.accountGlitch ? "该账号不存在或已离校" : "林华灿　2021级　信息管理"}<br />
              <span class="muted">${state.accountGlitch ? "身份状态：归档失败" : state.permissionLevel === "active_student" ? "账号权限：在籍学生" : state.permissionLevel === "reviewing" ? "账号权限：复核中临时保留" : "账号权限：离校过渡期"}</span>
            </div>
          </div>
          <nav class="topnav">
            ${TOP_CHANNELS.map(([id, label]) => `<button class="${state.screen === id ? "active" : ""}" data-screen="${id}">${label}</button>`).join("")}
          </nav>
        </header>
        <div class="status-strip">
          <span>${renderLocation()}</span>
          <strong>状态：${state.studentStatusRestored ? "在籍 · 复核完成" : state.permissionLevel === "reviewing" ? "复核中 · 权限临时保留" : "终审待确认 · 离校过渡期"} · 剩余 ${formatTime(state.time)} · 完成度 ${state.progress}%</strong>
        </div>
        <div class="mobile-shell-actions">
          <button data-action="open-mobile-nav" aria-label="打开业务系统抽屉">业务系统</button>
          <button data-action="open-mobile-evidence" aria-label="打开取证夹">取证夹 ${state.evidence.length}/${visibleEvidenceTotal()}</button>
        </div>
        <main class="layout">
          <aside class="sidebar ${state.mobileNavOpen ? "open" : ""}">
            <div class="nav-title"><span>业务系统</span><button class="mobile-nav-close" data-action="close-mobile-panels" aria-label="关闭业务系统抽屉">×</button></div>
            <div class="nav-list">${renderNav()}</div>
            <div class="nav-list" style="border-top:1px solid var(--line)"><button class="nav-item" data-action="reset"><span>重新开始</span><span class="tag">重置</span></button></div>
          </aside>
          <section class="main-panel">${renderScreen()}</section>
          <aside class="evidence-dock ${state.mobileEvidenceOpen ? "open" : ""}">
            <div class="dock-title">
              <span>本地取证夹</span>
              <b>${state.evidence.length}/${visibleEvidenceTotal()}</b>
              <button class="mobile-dock-close" data-action="close-mobile-evidence" aria-label="关闭取证夹">×</button>
            </div>
            <div class="evidence-list">${renderEvidence()}</div>
            ${renderClueTerms()}
          </aside>
        </main>
        ${(state.mobileNavOpen || state.mobileEvidenceOpen) ? `<div class="mobile-drawer-backdrop" data-action="close-mobile-panels"></div>` : ""}
        <button class="mobile-evidence-fab ${state.recentEvidenceId ? "new" : ""} ${state.mobileEvidenceOpen ? "hidden" : ""}" data-action="open-mobile-evidence" aria-label="打开取证夹">取证夹 ${state.evidence.length}/${visibleEvidenceTotal()}</button>
        ${locked ? `<div class="interaction-guard" aria-live="polite">权限校验中，请稍候…</div>` : ""}
        ${renderPortalResults()}
      </div>
      ${renderNoticeModal()}
      ${renderAffairsEvidenceModal()}
      ${renderTalkSourceModal()}
      ${renderWorkOrderFlowModal()}
      ${renderPublicChainModal()}
        ${renderGuTimelineModal()}
        ${renderIntroModal()}
        ${renderVoluntaryConfirmModal()}
        ${renderLibraryEggModal()}
      ${renderForumThreadModal()}
      ${renderForumPmPopup()}
      ${renderAppealHorrorPopup()}
      ${renderRestoreNoticeModal()}
      ${renderToasts()}
      ${renderAccessDeniedGlitch()}
      ${renderIdentityGlitch()}`;
  }

  function renderPortalResults() {
    if (!state.portalResults.length) return "";
    return h`
      <div class="search-panel">
        <div class="search-panel-head">
          <strong>门户统一检索</strong>
          <button data-action="close-search" aria-label="关闭检索结果">×</button>
        </div>
        <div class="search-result-list">
          ${state.portalResults.map((item) => `
            <button class="search-result ${item.restricted ? "restricted" : ""}" data-action="${item.action}">
              <span>${item.system}</span>
              <strong>${item.title}</strong>
              <small>${item.desc}</small>
            </button>`).join("")}
        </div>
      </div>`;
  }

  function buildPortalResults(query) {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    const results = [];
    const add = (system, title, desc, action) => results.push({ system, title, desc, action });
    const addRestricted = (system, title = "结果受限", desc = "该结果需要对应业务系统的来源记录，当前账号无权直接查看。") => results.push({ system, title, desc, action: "search-empty", restricted: true });
    const includesAny = (...words) => words.some((word) => value.includes(word.toLowerCase()));
    const hasMaterialCallNo = state.materialTab === "libraryDoc" || inspected("library-callno") || inspected("library-hit") || has("e09");
    const hasForumThread = inspected("forum-warning-thread") || has("e11");
    const hasCardTrail = has("e08");
    const hasMailArchive = has("e10");
    const hasParentTrail = inspected("parent-care") || inspected("parent-withdraw") || has("e12");
    const q0713 = value.includes("0713");
    const qB4 = value.includes("b4");
    const qGuest = value.includes("guest_404") || value.includes("guest404");
    const qArchive = includesAny("archive", "归档", "审计");
    const qArchiveEntry = value.includes("xg413_archive") || value.includes("audit-qcu-2026-0713");
    const qGczCode = includesAny("gcz", "gcz-2024", "gcz-2024-discipline-withdraw", "discipline-withdraw");
    const qRankCache = includesAny("recommend_rank_cache", "recommend-rank-cache", "rank_cache");
    const qGu = includesAny("顾天泽", "gutianze", "gu tian") || qGczCode;
    const qRecommendation = includesAny("保研", "推免", "候选", "排名", "recommend") || qRankCache;
    const qDiscipline = includesAny("处分撤回", "处分", "撤回") || qGczCode;
    const qMeng = includesAny("孟清", "meng");
    if (q0713) {
      add("教务系统", "QCU-XJYD-20260619-0713", "学籍异动流程编号，归档日期早于本人提交。", "search-academic-flow");
      if (qB4 && hasMaterialCallNo) {
        add("图书馆", "QCU-SEC-B4-0713", "命中封闭馆藏索书号。详情页受限，可尝试馆藏打印预览。", "search-library-b4");
      } else {
        addRestricted("图书馆", "QCU-SEC-B4-0713", "命中封闭馆藏编号，但需要同时提供地点词 B4 与来源材料编号。");
      }
      if (qB4 && qGuest && hasForumThread) {
        add("校园论坛", "B4 侧门图片引用缓存", "guest_404 引用过被删图片，缓存文件名仍保留 231713。", "search-forum-cache");
      } else if (hasForumThread) {
        addRestricted("校园论坛", "0713 相关删帖缓存", "单一编号只能确认存在锁帖；需组合 B4 与 guest_404。");
      } else {
        addRestricted("校园论坛", "0713 相关删帖缓存", "该结果需要先在论坛锁帖中取得缓存 ID。");
      }
      if (qArchiveEntry && hasMailArchive) {
        add("归档预览缓存", "AUDIT-QCU-2026-0713", "由邮箱自动转发规则暴露的只读审计预览地址。", "search-archive");
      } else {
        addRestricted("归档预览缓存", "AUDIT-QCU-2026-0713", "命中审计编号，需先取得邮箱转发规则里的 xg413_archive 来源。");
      }
    }
    if (qMeng) {
      has("e09") ? add("图书馆", "孟清调阅登记", "B4 档案记录显示她调阅过顾天泽处分与保研材料。", "search-library-b4") : addRestricted("图书馆", "姓名检索受限", "涉及学生隐私，需先取得对应档案调阅记录。");
      hasForumThread ? add("校园论坛", "长期休学记录引用", "已恢复的删帖缓存中出现该姓名。", "search-forum-0713") : addRestricted("校园论坛", "姓名检索受限", "匿名区历史内容未恢复。");
    }
    if (qGuest && !q0713 && !qB4 && !qGu) {
      addRestricted("校园论坛", "guest_404 缓存 ID 受限", hasForumThread ? "已取得缓存 ID，但仍需组合 B4 与 0713 才能定位被删图片引用。" : "需要先进入校园论坛锁帖，取得 guest_404 的来源语境。");
    }
    if (qB4) {
      hasCardTrail ? add("校园卡", "尚德楼 B4 侧门流水", "已查询到与该地点相关的校园卡记录。", "search-card-b4") : addRestricted("校园卡");
      q0713 && hasMaterialCallNo ? add("图书馆", "尚德楼 B4 档案室", "公开详情页受限，打印预览仍暴露调阅登记字段。", "search-library-b4") : addRestricted("图书馆", "尚德楼 B4 档案室", "地点词不足以打开封闭馆藏，请补充索书号或流程尾号。");
      q0713 && qGuest && hasForumThread ? add("校园论坛", "B4 侧门图片缓存", "被删除楼层残留事故图片片段。", "search-forum-cache") : addRestricted("校园论坛", "B4 侧门图片缓存", "需要锁帖缓存 ID 与流程尾号共同定位。");
    }
    if (qGu) {
      if (qDiscipline && (qMeng || qGuest) && hasForumThread) {
        add("校园论坛", "顾天泽处分预警引用缓存", "组合词命中已删除回复：处分撤回、保研资格、孟清调阅。", "search-forum-cache");
      } else if (qGczCode && has("e09")) {
        addRestricted("信息公开", "GCZ-2024-discipline-withdraw", "该编号需回到 B4 调阅登记和信息公开缓存交叉核验。");
      } else {
        addRestricted("校园论坛", "姓名检索受限", "学生姓名单独检索已折叠；需补充处分撤回及来源 ID。");
      }
      (qDiscipline && has("e09")) || has("e14") ? addRestricted("信息公开", "顾天泽材料引用关系", "处分撤回、成绩补录、保研复核需在信息公开与 B4 调阅来源中交叉核验。") : addRestricted("信息公开", "材料引用关系受限", "需先取得档案调阅或公开缓存记录。");
    }
    if (qRecommendation) {
      if (has("e09") && state.studentStatusRestored) {
        add("信息公开", "推免候选排名缓存", "命中公开名单的缓存版本，需带入 B4 调阅来源交叉核验。", "search-recommend-cache");
      } else if (has("e09")) {
        addRestricted("信息公开", "推免候选排名缓存", "命中公开名单缓存，但当前账号仍需恢复在籍权限。");
      } else if (hasMaterialCallNo) {
        addRestricted("信息公开", "推免候选排名缓存", "命中附件名，但需先取得 B4 调阅来源。");
      } else {
        addRestricted("信息公开", "候选名单缓存受限", "公开信息只显示最终名单，不显示缓存版本。");
      }
    }
    if (value.includes("xzy_admin")) {
      add("材料归档", "自愿退学申请书 Author", "PDF 作者字段不是学生账号。", "search-pdf-author");
    }
    if (value.includes("10.18.4.27")) {
      has("e07") ? add("学工系统", "学院行政楼 413 室", "多个责任单位审核 IP 相同。", "search-flow-ip") : add("学工系统", "10.18.4.27", "该 IP 出现在学生事务工单日志中，需打开流转记录核对。", "search-flow-ip");
      hasMailArchive && qArchiveEntry ? add("归档预览缓存", "xg413_archive", "学生事务材料归档预览地址。", "search-archive") : addRestricted("归档预览缓存", "归档预览受限", "需要邮箱转发规则里的 xg413_archive / AUDIT-QCU-2026-0713。");
    }
    if (value.includes("暂时离校") || value.includes("休整")) {
      hasParentTrail ? add("家长端缓存", "暂时离校休整", "家长端按钮文案与教务归档不一致。", "search-parent") : addRestricted("家长端缓存");
      has("e14") ? addRestricted("终审复核", "端口差异已写入本地证据", "请在本地取证夹或终审复核页使用证据 14。") : addRestricted("归档预览缓存");
    }
    if (qArchiveEntry && !q0713) {
      hasMailArchive ? add("归档预览缓存", "学生事务材料归档预览", "只读缓存展示材料如何被模板拼接。", "search-archive") : addRestricted("归档预览缓存", "归档预览受限", "该入口需要先取得邮箱转发规则。");
    } else if (qArchive && !qArchiveEntry) {
      addRestricted("归档预览缓存", "归档预览受限", "该缓存不接受泛搜索，需要 xg413_archive 或 AUDIT-QCU-2026-0713。");
    }
    if (!results.length) {
      add("统一检索", "未检索到公开事项", "系统建议更换流程编号、责任字段、人名或 IP。", "search-empty");
    }
    return results;
  }

  function renderIdentityGlitch() {
    if (!state.identityGlitch) return "";
    return h`
      <div class="identity-glitch" aria-live="assertive">
        <section class="identity-glitch-panel">
          <div class="identity-glitch-code">AUTH-404 / XJYD-FINAL-0713</div>
          <h2>该账号不存在或已离校</h2>
          <p>撤销请求未能匹配在籍学生身份。系统已按离校过渡期权限重新校验当前会话。</p>
          <div class="identity-glitch-log readable-log">
            <div><span>学生姓名</span><strong>未匹配到在籍记录</strong></div>
            <div><span>流程状态</span><strong>离校归档待确认</strong></div>
            <div><span>撤销申请人</span><strong>按离校学生处理</strong></div>
          </div>
        </section>
      </div>`;
  }

  function renderAccessDeniedGlitch() {
    if (!state.accessDeniedGlitch || state.identityGlitch) return "";
    return h`
      <div class="access-denied-glitch" aria-live="assertive">
        <section class="access-denied-panel">
          <div class="access-denied-code">AUTH-CHECK / PERMISSION_DENIED</div>
          <h2>你没有权限查看</h2>
          <p>当前账号处于离校过渡期。该页面或材料仅对在籍学生开放。</p>
        </section>
      </div>`;
  }

  function renderToasts() {
    if (!state.toasts.length) return "";
    return `<div class="toast-wrap" aria-live="polite">${state.toasts.map((item) => `<div class="toast">${escapeHtml(item.message)}</div>`).join("")}</div>`;
  }

  function createModalContext() {
    return {
      state,
      h,
      has,
      LIBRARY_EGGS,
      FORUM_THREADS
    };
  }

  function renderNoticeModal() {
    return Modals.renderNoticeModal(createModalContext());
  }

  function renderAffairsEvidenceModal() {
    return Modals.renderAffairsEvidenceModal(createModalContext());
  }

  function renderTalkSourceModal() {
    return Modals.renderTalkSourceModal(createModalContext());
  }

  function renderWorkOrderFlowModal() {
    return Modals.renderWorkOrderFlowModal(createModalContext());
  }

  function renderPublicChainModal() {
    return Modals.renderPublicChainModal(createModalContext());
  }

  function renderGuTimelineModal() {
    return Modals.renderGuTimelineModal(createModalContext());
  }

  function renderIntroModal() {
    return Modals.renderIntroModal(createModalContext());
  }

  function renderVoluntaryConfirmModal() {
    return Modals.renderVoluntaryConfirmModal(createModalContext());
  }

  function renderLibraryEggModal() {
    return Modals.renderLibraryEggModal(createModalContext());
  }

  function renderForumThreadModal() {
    return Modals.renderForumThreadModal(createModalContext());
  }

  function renderForumPmPopup() {
    return Modals.renderForumPmPopup(createModalContext());
  }

  function renderAppealHorrorPopup() {
    return Modals.renderAppealHorrorPopup(createModalContext());
  }

  function renderRestoreNoticeModal() {
    return Modals.renderRestoreNoticeModal(createModalContext());
  }

  function renderNav() {
    return SYSTEMS.map(([id, label]) => {
      const opened = state.unlocked.includes(id);
      const title = opened ? "" : lockedSystemHint(id);
      return `<button class="nav-item ${state.screen === id ? "active" : ""} ${opened ? "" : "locked"}" data-screen="${id}" ${title ? `title="${title}" aria-label="${label}：${title}"` : ""}>
        <span>${label}</span><span class="tag">${opened ? "开放" : "未开放"}</span>
      </button>`;
    }).join("");
  }

  function lockedSystemHint(id) {
    const hints = {
      materials: "请先在教务首页点击“查看材料”，或核对流程编号中的时间线。",
      student: "请先尝试撤销申请，或核对流程编号中的异常节点。",
      psych: state.studentStatusRestored ? "请回材料归档重新核验课程反馈，以解锁心理中心。" : "心理中心完整内容需要先恢复在籍；当前可在材料归档查看脱敏转介单。",
      dorm: "请先在材料归档的宿舍退宿页核对退宿申请与柜锁维修时间。",
      library: "请先在材料归档的图书馆清退页记录索书号，或搜索 B4 / 0713。",
      card: "请先取得论坛缓存或 B4 相关线索，再核对校园卡异常流水。",
      forum: "请先查看顾天泽新闻、信息公开材料，或组合 B4 / 0713 检索。",
      mail: "请先在学工系统查看流转 IP，或推进论坛/申诉线索。",
      parent: "请先查看邮箱规则或重复申诉触发的家长端风险提示。",
      review: "请先收集足够流程矛盾材料；归档预览或信息公开核验后会开放终审复核。"
    };
    return hints[id] || "该系统还未开放，请先继续核对已出现的字段和关键词。";
  }

  function renderLocation() {
    const current = TOP_CHANNELS.find(([id]) => id === state.screen);
    if (current) return `当前位置：首页 / ${current[1]} / ${current[0] === "academic" ? "学籍异动" : "信息浏览"}`;
    if (state.screen === "archive") return "当前位置：首页 / 邮箱附件 / 归档预览缓存";
    const system = SYSTEMS.find(([id]) => id === state.screen);
    return `当前位置：首页 / 业务系统 / ${system ? system[1] : "材料核对"}`;
  }

  function renderEvidence() {
    if (!state.evidence.length) return `<div class="evidence-empty"><strong>□ 暂无本地证据</strong><p>本地取证夹为空。</p></div>`;
    return state.evidence.map((id) => {
      const item = EVIDENCE[id];
      const fileName = `${item[0].replace("证据 ", "evidence_")}_${item[1]}.txt`;
      return `<div class="evidence-item ${state.recentEvidenceId === id ? "new" : ""}"><div><strong>□ ${fileName}</strong><p>${item[2]}</p></div><small>LOCAL</small></div>`;
    }).join("");
  }

  function getVisibleClueTerms() {
    return CLUE_TERMS.filter((term) => term.appearsWhen.some((id) => has(id) || inspected(id)));
  }

  function renderClueTerms() {
    const terms = getVisibleClueTerms();
    return h`
      <div class="clue-terms">
        <div class="clue-terms-head">
          <span>已出现关键词</span>
          <small>${terms.length}/${CLUE_TERMS.length}</small>
        </div>
        ${terms.length ? `<div class="clue-term-list">
          ${terms.map((term) => `
            <span class="clue-term-wrap">
              <button class="clue-term ${state.copiedClueTerm === term.label ? "copied" : ""}" data-clue-term="${escapeHtml(term.label)}" title="复制关键词：${escapeHtml(term.label)}">
                <strong>${escapeHtml(term.label)}</strong>
                <span>${escapeHtml(term.source)}</span>
              </button>
              <button class="clue-term-search" data-clue-search="${escapeHtml(term.label)}" title="填入门户检索">+</button>
            </span>`).join("")}
        </div>
        <p class="clue-term-hint">${state.copiedClueTerm ? `已复制：${escapeHtml(state.copiedClueTerm)}` : "点击词条复制；点 + 填入门户检索框。"}</p>` : `<p class="clue-term-empty">尚未摘录可复查关键词。</p>`}
      </div>`;
  }

  function renderScreen() {
    const map = {
      academic: renderAcademic,
      affairs: renderAffairs,
      work: renderWork,
      life: renderLife,
      public: renderPublic,
      materials: renderMaterials,
      student: renderStudent,
      psych: renderPsych,
      dorm: renderDorm,
      library: renderLibrary,
      card: renderCard,
      forum: renderForum,
      mail: renderMail,
      parent: renderParent,
      archive: renderArchive,
      review: renderReview
    };
    return map[state.screen]();
  }

  function header(title, desc, tag = "") {
    return `<div class="panel-head"><div><h1>${title}</h1><p>${desc}</p></div>${tag}</div>`;
  }

  function createPortalViewContext() {
    return {
      state,
      h,
      header,
      has,
      inspected,
      renderRiskLogs
    };
  }

  function renderAffairs() {
    return PortalViews.renderAffairs(createPortalViewContext());
  }

  function renderWork() {
    return PortalViews.renderWork(createPortalViewContext());
  }

  function renderLife() {
    return PortalViews.renderLife(createPortalViewContext());
  }

  function renderPublic() {
    return PortalViews.renderPublic(createPortalViewContext());
  }

  function createCoreViewContext() {
    return {
      state,
      h,
      header,
      has,
      inspected,
      renderRiskLogs,
      getAppealProfile,
      REVIEW_ROUTE
    };
  }

  function renderAcademic() {
    return CoreViews.renderAcademic(createCoreViewContext());
  }

  function renderMaterials() {
    return CoreViews.renderMaterials(createCoreViewContext());
  }

  function renderMaterialTab() {
    return CoreViews.renderMaterialTab(createCoreViewContext());
  }

  function renderStudent() {
    return CoreViews.renderStudent(createCoreViewContext());
  }

  function renderArchive() {
    return CoreViews.renderArchive(createCoreViewContext());
  }

  function createSystemViewContext() {
    return {
      state,
      h,
      header,
      has,
      inspected
    };
  }

  function renderPsych() {
    return SystemViews.renderPsych(createSystemViewContext());
  }

  function renderDorm() {
    return SystemViews.renderDorm(createSystemViewContext());
  }

  function renderLibrary() {
    return SystemViews.renderLibrary(createSystemViewContext());
  }

  function renderCard() {
    return SystemViews.renderCard(createSystemViewContext());
  }

  function renderForum() {
    return SystemViews.renderForum(createSystemViewContext());
  }

  function renderMail() {
    return SystemViews.renderMail(createSystemViewContext());
  }

  function renderParent() {
    return SystemViews.renderParent(createSystemViewContext());
  }

  function createReviewViewContext() {
    return {
      state,
      EVIDENCE,
      constants: window.VoluntaryLeaveConstants,
      rules: Rules,
      h,
      header,
      escapeHtml,
      getEvidenceProfile,
      has,
      isFlowReviewReady,
      isLowRiskReviewRoute,
      isTrueEndingReady,
      reviewSubmittedEvidence,
      reviewSupportEvidence
    };
  }

  function renderReviewRoute() {
    return ReviewView.renderReviewRoute(createReviewViewContext());
  }

  function renderReview() {
    return ReviewView.renderReview(createReviewViewContext());
  }

  function renderEnding() {
    const supportCount = reviewSupportEvidence().length;
    const endings = {
      default: {
        title: "你已被强行归档。",
        name: "石沉海底",
        status: "XJYD-FINAL-0713 · 未收到有效异议",
        body: "你没有完成关键举证，流程按既有材料归档。你只能看着权限逐项关闭，你什么都做不了了。<br /><br />你意识到，或许你和孟清是一样的。",
        note: "待办事项已清空。申诉入口已关闭。",
        log: ["08:00 学籍异动归档完成", "08:03 校园网账号转入离校过渡", "08:07 论坛历史发言仅保留摘要", "08:12 家长端显示：学生已完成确认"],
        denied: ["教务详情", "邮箱附件", "论坛私信", "B4 旧刊"],
        variant: "lost"
      },
      voluntary: {
        title: state.evidence.length >= 8 ? "离校确认已接收" : "离校确认已接收",
        name: state.evidence.length >= 8 ? "抱薪留火" : "随波逐流",
        status: state.evidence.length >= 8 ? "LOCAL-BACKUP-PARTIAL · for_mengqing.zip" : "LOCAL-BACKUP-FAILED · 零散截图",
        body: state.evidence.length >= 8 ? "尽管你获得了一些证据，你仍然接受了离校归档，这是唯一能获得完整备份的方式。你失去了校内身份，但真相仍然可以调查。<br /><br />你依旧抱有希望：即使你的人生失败了，会不会有下一个成功者？" : "你点击了确认，学校系统把你归档为自愿离校。你离开了流程，也失去了继续追问的入口。",
        note: state.evidence.length >= 8 ? "系统仍显示：本人确认，风险解除。" : "系统仍显示：本人确认，材料完整。",
        log: state.evidence.length >= 8
          ? ["03:56 正在压缩本地证据", "03:57 邮箱服务停止同步", "03:58 校园卡查询权限回收", "03:59 for_mengqing.zip 写入完成"]
          : ["03:56 本地备份校验失败", "03:57 附件缺失：B4 静帧", "03:58 附件缺失：转发规则", "03:59 本人确认记录已归档"],
        denied: ["校园网", "校内邮箱", "图书馆封闭馆藏", "学生事务申诉"],
        variant: "voluntary"
      },
      restore: {
        title: "流程暂停",
        name: "全身而退",
        status: "XJYD-0713 · 材料瑕疵",
        body: "复核通过，你提交的补充材料进入复核附件，退学流程被标记为材料瑕疵并暂停。但那些有关于更多真相的信息？你不知道，或者“选择”不知情，你要的只是顺利毕业而已。<br /><br />你不需要揭露什么真相，你是明哲保身的、智慧的庶民。",
        note: supportCount >= 4 ? "页面恢复了你的名字，补充材料留在复核附件中。" : "页面恢复了你的名字，但把你真正追问的部分关掉了。",
        log: supportCount >= 4
          ? ["04:11 学籍状态恢复：在籍", "04:12 家长端更正说明已发送", "04:13 补充材料写入复核附件", "04:14 事故相关材料转入另案处理"]
          : ["04:11 学籍状态恢复：在籍", "04:12 家长端更正说明已发送", "04:13 B4 档案权限更新：不可见", "04:14 事故相关材料转入另案处理"],
        denied: ["孟清调阅登记", "顾天泽处分撤回", "B4 CCTV 原始流", "审计附件"],
        variant: "restore"
      },
      public: {
        title: "申诉已公开",
        name: "众目昭彰",
        status: "FORUM-CACHE-0713 · 正在扩散",
        body: "你公开了关于顾天泽的完整证据链。退学流程暂停，吃瓜群众为你的正义欢呼喝彩，尽管舆情不断被镇压。你的账号被列入重点风险，你再也不能只做一个普通学生。<br /><br />你究竟是仗义执言的勇士，还是趟了浑水的愚民？",
        note: "他们删得越快，被发现的就越多。",
        log: has("e21") ? ["04:21 匿名区新增 52 条引用", "04:22 关键词：顾天泽 / 推免候选排名 已限制搜索", "04:23 家长端风险等级上调", "04:24 退学流程暂停，账号进入重点关注"] : ["04:21 匿名区新增 37 条引用", "04:22 关键词：顾天泽 已限制搜索", "04:23 家长端风险等级上调", "04:24 退学流程暂停，账号进入重点关注"],
        denied: ["普通学生身份", "家长端信任", "论坛发帖自由", "辅导员线下预约"],
        variant: "public"
      },
      audit: {
        title: "材料已反向归档",
        name: "拨乱反正",
        status: "AUDIT-QCU-2026-0713 · 不可由学院端删除",
        body: "你没有公开资料，而是直接绕过学院，将材料送进了审计归档，你相信，自然有更高层的人来进行判决。你锁住了真相，但你仍然在离校流程里。<br /><br />一切都没有改变，除了周启明第一次发来了私人消息。",
        note: "这一次，系统替他们留下了痕迹。",
        log: has("e21") ? ["04:31 审计附件校验通过", "04:32 保研候选名单缓存写入附件", "04:33 学院端删除权限拒绝", "04:34 AUDIT-QCU-2026-0713 已锁定"] : ["04:31 审计附件校验通过", "04:32 学院端删除权限拒绝", "04:33 周启明发送非模板消息", "04:34 AUDIT-QCU-2026-0713 已锁定"],
        denied: ["撤回审计附件", "覆盖家长端缓存", "重写谈话原文", "删除 B4 关联编号"],
        variant: "audit"
      },
      "true": {
        title: "回到名单",
        name: "蚂蚁的胜利",
        status: "ACTIVE-STUDENT-0713 · 补充调查已受理",
        body: "学籍状态恢复后，那些曾经写着“无权限”的页面重新亮起：纪要、附件、候选名单缓存和论坛残留第一次进入同一条正式程序：学校领导接受调查，顾天泽推免资格暂停，孟清事件被重新核查。<br /><br />仍然没有人向你道歉，但这一次，起码他们不能再把你的名字从名单里删掉。",
        note: "真相进入程序，不等于世界立刻变好；但它终于不能只存在于截图里。",
        log: ["05:02 学籍状态：在籍", "05:04 复学后补充调查材料受理", "05:08 周启明会议纪要 OCR 写入附件", "05:13 推免资格复核暂停", "05:17 B4 事件转入校外调查协查"],
        denied: ["在籍状态", "补充调查附件", "会议纪要 OCR", "候选名单缓存"],
        permissionLabel: "程序状态",
        accessStatus: "已写入",
        variant: "true"
      }
    };
    const item = endings[state.ending];
    const permissionLabel = item.permissionLabel || "权限状态";
    const accessStatus = item.accessStatus || "拒绝访问";
    return h`
      <main class="ending ending-${item.variant}">
        <div class="ending-noise" aria-hidden="true"></div>
        <section class="ending-card">
          <div class="ending-stamp">${item.status}</div>
          <h1>${item.title}</h1>
          <p class="ending-body">${item.body}</p>
          <div class="ending-achievement"><span>达成结局</span><strong>${item.name}</strong></div>
          <div class="ending-note">${item.note}</div>
          <div class="ending-grid">
            <div>
              <div class="ending-label">系统日志</div>
              <div class="ending-log">${item.log.map((line) => `<div>${line}</div>`).join("")}</div>
            </div>
            <div>
              <div class="ending-label">${permissionLabel}</div>
              <div class="ending-denied">${item.denied.map((line) => `<span>${line}<b>${accessStatus}</b></span>`).join("")}</div>
            </div>
          </div>
          <div class="ending-footer">
            <span>本地取证夹：${state.evidence.length}/${visibleEvidenceTotal()}</span>
            <button class="primary" data-action="reset">重新开始</button>
          </div>
        </section>
      </main>`;
  }

  function bind() {
    document.querySelectorAll("[data-screen]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        if (PORTAL_SCREENS.includes(button.dataset.screen) || state.unlocked.includes(button.dataset.screen)) {
          setState({ screen: button.dataset.screen, mobileNavOpen: false, mobileEvidenceOpen: false, portalResults: [] });
          return;
        }
        toast(lockedSystemHint(button.dataset.screen));
      });
    });

    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        setState({ materialTab: button.dataset.tab });
      });
    });

    document.querySelectorAll("[data-unit]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        setState({ selectedUnit: button.dataset.unit, reviewError: "" });
      });
    });

    document.querySelectorAll("[data-pick-evidence]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        const id = button.dataset.pickEvidence;
        const current = reviewSubmittedEvidence();
        const selected = current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id];
        setState({ selectedEvidence: selected, reviewSelectionMode: "manual", reviewError: "" });
      });
    });

    document.querySelectorAll("[data-statement]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        const text = button.dataset.statement;
        const selected = state.statementChips.includes(text)
          ? state.statementChips.filter((item) => item !== text)
          : [...state.statementChips, text];
        setState({ statementChips: selected, reviewError: "" });
      });
    });

    document.querySelectorAll("[data-library-egg]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        setState({ libraryEgg: button.dataset.libraryEgg });
      });
    });

    document.querySelectorAll("[data-forum-thread]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        if (shouldCloseMobilePanelBeforeAction(button)) return;
        if (button.dataset.forumThread === "warning") inspectField("forum-warning-thread");
        if (button.dataset.forumThread === "sidegate") inspectField("forum-sidegate-thread");
        if (button.dataset.forumThread === "poison") inspectField("forum-poison-thread");
        setState({ forumThread: button.dataset.forumThread });
      });
    });

    document.querySelectorAll("[data-clue-term]").forEach((button) => {
      button.addEventListener("click", () => copyClueTerm(button.dataset.clueTerm));
    });

    document.querySelectorAll("[data-clue-search]").forEach((button) => {
      button.addEventListener("click", () => {
        if (isInteractionLocked()) return;
        const value = button.dataset.clueSearch || "";
        state.portalQuery = value;
        state.mobileEvidenceOpen = false;
        toast(`已填入门户检索框，请点击搜索：${value}`);
        saveState();
        render();
      });
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.closest("[data-modal-panel]")) event.stopPropagation();
        if (shouldCloseMobilePanelBeforeAction(button)) {
          event.preventDefault();
          return;
        }
        if (button.dataset.action === "portal-search") clearPortalAutocomplete(true);
        handleAction(button.dataset.action);
      });
    });

    const reviewDraft = document.getElementById("review-draft");
    if (reviewDraft) {
      reviewDraft.addEventListener("input", (event) => {
        const value = event.target.value;
        if (!state.reviewDraftRewritten && value.includes("我没有申请")) {
          state.reviewDraft = "我没有准备好接受当前处理结果。";
          state.reviewDraftRewritten = true;
          addRiskLog("学生在复核说明中否认既有流程记录，系统已按规范表述调整。");
          saveState();
          render();
          flashAccount();
          return;
        }
        state.reviewDraft = value;
        saveState();
      });
    }

    const portalSearch = document.getElementById("portal-search");
    if (portalSearch) {
      portalSearch.addEventListener("input", (event) => {
        clearPortalAutocomplete(false);
        const value = event.target.value;
        state.portalQuery = value;
        saveState();
        triggerPortalAutocomplete(value, event.target);
      });
      portalSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          clearPortalAutocomplete(true);
          handleAction("portal-search");
        }
      });
    }

    const librarySearch = document.getElementById("library-search");
    if (librarySearch) {
      librarySearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleAction("library-search");
        }
      });
    }

    document.querySelectorAll("[data-modal-panel]").forEach((panel) => {
      panel.addEventListener("click", (event) => event.stopPropagation());
    });

    document.onkeydown = handleGlobalKeydown;
  }

  function shouldCloseMobilePanelBeforeAction(element) {
    if (!state.mobileNavOpen && !state.mobileEvidenceOpen) return false;
    const allowedActions = new Set([
      "open-mobile-nav",
      "open-mobile-evidence",
      "close-mobile-evidence",
      "close-mobile-panels",
      "toggle-mobile-nav",
      "toggle-mobile-evidence"
    ]);
    const action = element.dataset?.action || "";
    if (allowedActions.has(action)) return false;
    if (element.closest(".sidebar.open") || element.closest(".evidence-dock.open")) return false;
    setState({ mobileNavOpen: false, mobileEvidenceOpen: false });
    return false;
  }

  function handleGlobalKeydown(event) {
    if (event.key !== "Escape") return;
    if (state.mobileNavOpen || state.mobileEvidenceOpen) {
      event.preventDefault();
      setState({ mobileNavOpen: false, mobileEvidenceOpen: false });
      return;
    }
    const closeActions = [
      ["noticeModal", "close-notice"],
      ["affairsModal", "close-affairs-modal"],
      ["talkSourceModal", "close-talk-source"],
      ["workOrderFlowModal", "close-flow-modal"],
      ["publicChainModal", "close-public-chain"],
      ["guTimelineModal", "close-gu-timeline"],
      ["libraryEgg", "close-library-egg"],
      ["forumThread", "close-forum-thread"],
      ["forumPmPopup", "close-forum-pm"],
      ["appealHorrorPopup", "close-appeal-horror"],
      ["restoreNoticePopup", "close-restore-notice"]
    ];
    const item = closeActions.find(([key]) => Boolean(state[key]));
    if (item) {
      event.preventDefault();
      handleAction(item[1]);
    }
  }

  function createActionContext() {
    return {
      state,
      EVIDENCE,
      REVIEW_ROUTE,
      setState,
      resetGame,
      act,
      unlock,
      addRiskLog,
      buildPortalResults,
      inspectField,
      inspected,
      addEvidence,
      toast,
      flashAccount,
      triggerIdentityGlitch,
      appendAppealLog,
      end,
      has,
      flowReviewEvidence,
      reviewSubmittedEvidence,
      getEvidenceProfile,
      isLowRiskReviewRoute,
      isTrueEndingReady,
      isInteractionLocked
    };
  }

  function handleAction(action) {
    return Actions.handleAction(createActionContext(), action);
  }

  function isInteractionLocked() {
    return state.interactionLockedUntil && Date.now() < state.interactionLockedUntil;
  }

  function getPortalAutocompleteCue(value) {
    const raw = String(value || "");
    const lower = raw.toLowerCase();
    const cues = [
      {
        id: "mengqing-status",
        matches: raw.includes("孟清") || lower.includes("meng"),
        preview: "孟清 长期休学",
        hint: "系统补全：历史学籍状态"
      },
      {
        id: "b4-transfer",
        matches: lower.includes("b4"),
        preview: "B4 侧门 转运 23:58",
        hint: "系统补全：已撤回地点描述"
      },
      {
        id: "gu-recommend",
        matches: raw.includes("顾天泽") || lower.includes("gutianze") || lower.includes("gu tian"),
        preview: "顾天泽 处分撤回 推免候选",
        hint: "系统补全：关联事项已折叠"
      },
      {
        id: "guest-draft",
        matches: lower.includes("guest_404") || lower.includes("guest404"),
        preview: "guest_404 未发送草稿",
        hint: "系统补全：缓存草稿"
      }
    ];
    return cues.find((cue) => cue.matches && !state.portalAutocompleteSeen.includes(cue.id));
  }

  function triggerPortalAutocomplete(value, input) {
    if (state.portalAutocompleteActive || isInteractionLocked()) return;
    const cue = getPortalAutocompleteCue(value);
    if (!cue) return;
    const original = String(value || "");
    const runId = ++portalAutocompleteRun;
    state.portalAutocompleteSeen = [...state.portalAutocompleteSeen, cue.id];
    state.portalAutocompleteActive = true;
    state.portalAutocompletePreview = cue.preview;
    state.portalAutocompleteHint = cue.hint;
    saveState();
    paintPortalAutocomplete(input);
    window.setTimeout(() => {
      if (runId !== portalAutocompleteRun || !state.portalAutocompleteActive) return;
      const currentInput = document.getElementById("portal-search");
      const holder = currentInput?.closest(".portal-search");
      if (currentInput && state.portalQuery === original) currentInput.value = original;
      if (holder) holder.dataset.autocompleteHint = "自动补全已撤回";
      state.portalAutocompletePreview = original;
      state.portalAutocompleteHint = "自动补全已撤回";
      saveState();
    }, 1180);
    window.setTimeout(() => {
      if (runId !== portalAutocompleteRun) return;
      clearPortalAutocomplete(false);
    }, 1680);
  }

  function paintPortalAutocomplete(input) {
    const currentInput = input || document.getElementById("portal-search");
    const holder = currentInput?.closest(".portal-search");
    if (!currentInput || !holder) return;
    currentInput.value = state.portalAutocompletePreview;
    holder.classList.add("autocomplete-glitch");
    holder.dataset.autocompleteHint = state.portalAutocompleteHint;
  }

  function clearPortalAutocomplete(restoreOriginal) {
    if (!state.portalAutocompleteActive) return;
    portalAutocompleteRun += 1;
    const currentInput = document.getElementById("portal-search");
    const holder = currentInput?.closest(".portal-search");
    if (restoreOriginal && currentInput) currentInput.value = state.portalQuery;
    if (holder) {
      holder.classList.remove("autocomplete-glitch");
      holder.dataset.autocompleteHint = "";
    }
    state.portalAutocompleteActive = false;
    state.portalAutocompletePreview = "";
    state.portalAutocompleteHint = "";
    saveState();
  }

  function copyClueTerm(term) {
    const value = term || "";
    const markCopied = () => {
      setState({ copiedClueTerm: value });
      window.setTimeout(() => {
        if (state.copiedClueTerm === value) {
          state.copiedClueTerm = "";
          saveState();
          render();
        }
      }, 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(markCopied).catch(() => {
        fallbackCopy(value);
        markCopied();
      });
      return;
    }
    fallbackCopy(value);
    markCopied();
  }

  function fallbackCopy(value) {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
    } catch (_err) {
      // Some file:// browser contexts block clipboard access; visual feedback still records the selected term.
    }
    input.remove();
  }

  render();
})();
