(function (root) {
  "use strict";

  // These are independent preview fixtures, not save files or a second copy of
  // game rendering. Search results are produced by the game's own search engine.
  const ALL_EVIDENCE = Array.from({ length: 21 }, (_, index) => `e${String(index + 1).padStart(2, "0")}`);
  const EARLY_EVIDENCE = ALL_EVIDENCE.filter((id) => !["e04", "e17", "e20", "e21"].includes(id));
  const FLOW_EVIDENCE = ["e01", "e02", "e03", "e05", "e06", "e07", "e12", "e13", "e14", "e16"];
  const MIN_FLOW = ["e01", "e02", "e03", "e07", "e12", "e13", "e14"];
  const B4_EVIDENCE = ["e08", "e09", "e10", "e11", "e15", "e18", "e19"];
  const ALL_SYSTEMS = ["academic", "materials", "student", "psych", "dorm", "library", "card", "forum", "mail", "parent", "review"];
  const RESTORED = { studentStatusRestored: true, permissionLevel: "active_student", progress: 0, reviewRouteStep: 6 };
  const ARCHIVE_FIELDS = ["archive-source", "archive-summary", "archive-parent", "archive-final", "archive-risk"];
  const scenes = [];
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function add(id, group, title, patch, description, extra) {
    const state = clone({
      loggedIn: true,
      guideSeen: true,
      introSeen: true,
      screen: "academic",
      evidence: [],
      selectedEvidence: [],
      inspectedFields: [],
      unlocked: ALL_SYSTEMS,
      ...patch
    });
    scenes.push({ id, group, title, description: description || "直接查看此状态下的游戏文案。", keywords: `${group} ${title}`, state, ...extra });
  }

  add("start-guide", "开场与登录", "首次进入 · 玩法导引", { loggedIn: false, guideSeen: false, introSeen: false }, "首次打开游戏的导引页，含玩法、目标和进度保存说明。");
  add("start-login", "开场与登录", "登录页 · 通知与验证码", { loggedIn: false }, "账号、密码、验证码输入区及登录前的通知列表。");
  add("start-intro", "开场与登录", "登录前 · 背景弹窗", { loggedIn: false, introSeen: false });
  add("start-intro-signed-in", "开场与登录", "登录后 · 背景弹窗", { introSeen: false });
  add("start-login-error", "开场与登录", "登录页 · 验证码错误", { loggedIn: false, loginError: "验证码输入错误，请重新输入。" });
  for (const [key, label] of [["archive", "学籍归档与权限调整"], ["service", "学生事务线上办理"]]) {
    add(`notice-${key}`, "开场与登录", `通知公告 · ${label}`, { loggedIn: false, noticeModal: key });
  }

  add("academic-initial", "教务与材料归档", "教务首页 · 首次登录", { unlocked: ["academic"] }, "显示尚未开放的业务系统及其提示；时间线中的日期矛盾是谜题线索。");
  add("academic-timeline", "教务与材料归档", "教务首页 · 时间线已取证", { evidence: ["e01"], inspectedFields: ["flow-code"] });
  add("academic-withdraw-pressure", "教务与材料归档", "教务首页 · 多次撤销失败", { withdrawAttempts: 5, evidence: ["e01"] });
  add("academic-restored", "教务与材料归档", "教务首页 · 学籍恢复", { ...RESTORED, evidence: FLOW_EVIDENCE, unlocked: ALL_SYSTEMS.filter((id) => id !== "psych") });
  add("material-application", "教务与材料归档", "退学申请书 · 默认预览", { screen: "materials", materialTab: "application" });
  add("material-pdf-meta", "教务与材料归档", "退学申请书 · PDF 信息", { screen: "materials", materialTab: "application", pdfMetaVisible: true });
  add("material-pdf-marked", "教务与材料归档", "退学申请书 · 作者已取证", { screen: "materials", materialTab: "application", pdfMetaVisible: true, pdfAuthorMarked: true, evidence: ["e02"] });
  add("material-talk", "教务与材料归档", "谈话记录 · 摘要", { screen: "materials", materialTab: "talk" });
  add("material-talk-source-entry", "教务与材料归档", "谈话记录 · 来源入口已展开", { screen: "materials", materialTab: "talk", inspectedFields: ["talk-quote"] });
  add("material-talk-compared", "教务与材料归档", "谈话记录 · 原话已核对", { screen: "materials", materialTab: "talk", inspectedFields: ["talk-quote"], evidence: ["e03"] });
  add("material-talk-original", "教务与材料归档", "谈话记录 · 原始对话弹窗", { screen: "materials", materialTab: "talk", inspectedFields: ["talk-quote"], evidence: ["e03"], talkSourceModal: true }, "注意保留原话与摘要的语义差异，这一差异用于取证。");
  add("material-psych", "教务与材料归档", "心理转介单 · 摘要", { screen: "materials", materialTab: "psychDoc" });
  add("material-psych-redacted", "教务与材料归档", "心理转介单 · 复学前脱敏内容", { screen: "materials", materialTab: "psychDoc", inspectedFields: ["survey-source"] });
  add("material-psych-restored", "教务与材料归档", "心理转介单 · 复学后完整原表", { ...RESTORED, screen: "materials", materialTab: "psychDoc", evidence: FLOW_EVIDENCE, inspectedFields: ["survey-source"] });
  add("material-psych-recorded", "教务与材料归档", "心理转介单 · 来源已取证", { ...RESTORED, screen: "materials", materialTab: "psychDoc", evidence: [...FLOW_EVIDENCE, "e04"], inspectedFields: ["survey-source"] });
  add("material-dorm", "教务与材料归档", "宿舍退宿 · 时间尚未核对", { screen: "materials", materialTab: "dormDoc" });
  add("material-dorm-recorded", "教务与材料归档", "宿舍退宿 · 时间已取证", { screen: "materials", materialTab: "dormDoc", evidence: ["e05"], inspectedFields: ["dorm-apply", "dorm-repair"] });
  add("material-library", "教务与材料归档", "图书馆清退 · 索书号线索", { screen: "materials", materialTab: "libraryDoc", inspectedFields: ["library-callno"] });

  add("affairs-initial", "门户频道", "学生事务 · 默认", { screen: "affairs" });
  add("affairs-recorded", "门户频道", "学生事务 · 两份材料已取证", { screen: "affairs", evidence: ["e15", "e16"] });
  add("affairs-mengqing", "门户频道", "学生事务 · 孟清志愿服务附件", { screen: "affairs", evidence: ["e15"], affairsModal: "mengqing" });
  add("affairs-xzy", "门户频道", "学生事务 · 谈话历史版本附件", { screen: "affairs", evidence: ["e16"], affairsModal: "xzy" });
  add("work-initial", "门户频道", "学工服务 · 默认", { screen: "work" });
  add("work-expanded", "门户频道", "学工服务 · 学生画像与流转摘要", { screen: "work", inspectedFields: ["life-fragments", "flow-loop"], evidence: ["e07"] });
  add("life-initial", "门户频道", "校园生活 · 新闻列表", { screen: "life" });
  add("life-recorded", "门户频道", "校园生活 · 荣誉新闻已核验", { screen: "life", guTimelineVisible: true, evidence: ["e18"] });
  add("life-attachment", "门户频道", "校园生活 · 加分名单附件", { screen: "life", guTimelineVisible: true, guTimelineModal: true });
  add("life-attachment-recorded", "门户频道", "校园生活 · 附件已取证", { screen: "life", guTimelineVisible: true, guTimelineModal: true, evidence: ["e18"] });
  add("public-initial", "门户频道", "信息公开 · 离校过渡期", { screen: "public" });
  add("public-restored-without-source", "门户频道", "信息公开 · 在籍但缺少 B4 来源", { ...RESTORED, screen: "public", evidence: FLOW_EVIDENCE });
  add("public-cache-ready", "门户频道", "信息公开 · 候选缓存可核验", { ...RESTORED, screen: "public", evidence: [...FLOW_EVIDENCE, "e09", "e19"] });
  add("public-full-records", "门户频道", "信息公开 · OCR 与候选缓存已核验", { ...RESTORED, screen: "public", evidence: ALL_EVIDENCE, publicChainVisible: true, hiddenEvidence20Unlocked: true });
  add("public-attachment", "门户频道", "信息公开 · 采购附件未标记", { screen: "public", publicChainVisible: true, publicChainModal: true });
  add("public-attachment-selected", "门户频道", "信息公开 · 三项字段已标记", { screen: "public", publicChainVisible: true, publicChainModal: true, publicChainFields: ["supplier", "partner", "minutes"] });
  add("public-attachment-recorded", "门户频道", "信息公开 · 采购附件已取证", { screen: "public", publicChainVisible: true, publicChainModal: true, publicChainFields: ["supplier", "partner", "minutes"], evidence: ["e19"] });

  add("student-initial", "学工与归档", "申诉工单 · 默认", { screen: "student" });
  for (const count of [1, 2, 3]) {
    add(`student-appeal-${count}`, "学工与归档", `申诉工单 · 第 ${count} 次异议`, { screen: "student", appealCount: count, evidence: ["e06"] });
  }
  add("student-care-generated", "学工与归档", "申诉工单 · 关怀处置依据", { screen: "student", appealCount: 4, appealHorrorSeen: true, evidence: ["e06"] });
  add("student-flow-expanded", "学工与归档", "申诉工单 · 流转摘要与重复 IP", { screen: "student", flowPreviewVisible: true, inspectedFields: ["flow-loop"] });
  add("student-flow-recorded", "学工与归档", "申诉工单 · 同源 IP 已取证", { screen: "student", flowPreviewVisible: true, inspectedFields: ["flow-loop"], evidence: ["e07"] });
  add("student-flow-modal", "学工与归档", "申诉工单 · 完整流转图弹窗", { screen: "student", flowPreviewVisible: true, inspectedFields: ["flow-loop"], workOrderFlowModal: true });
  add("student-restored", "学工与归档", "申诉工单 · 完整回转记录", { ...RESTORED, screen: "student", evidence: FLOW_EVIDENCE, flowPreviewVisible: true });
  add("archive-initial", "学工与归档", "归档预览 · 未标记来源", { screen: "archive", evidence: ["e10"] });
  add("archive-selected", "学工与归档", "归档预览 · 可以生成输出", { screen: "archive", evidence: ["e10"], archiveFields: ARCHIVE_FIELDS });
  add("archive-output", "学工与归档", "归档预览 · 拼接结论已生成", { screen: "archive", evidence: ["e10", "e14"], archiveFields: ARCHIVE_FIELDS });

  add("psych-initial", "其他业务系统", "心理中心 · 预约与评估", { ...RESTORED, screen: "psych", evidence: [...FLOW_EVIDENCE, "e04"] });
  add("psych-profile", "其他业务系统", "心理中心 · 评估图表", { ...RESTORED, screen: "psych", evidence: [...FLOW_EVIDENCE, "e04"], inspectedFields: ["psych-risk-profile"] });
  add("dorm-system", "其他业务系统", "宿舍系统 · 门禁与床位", { screen: "dorm", evidence: ["e05"] });
  add("library-initial", "其他业务系统", "图书馆 · 未命中馆藏", { screen: "library" });
  add("library-restricted", "其他业务系统", "图书馆 · 封闭馆藏命中", { screen: "library", inspectedFields: ["library-hit"] });
  add("library-print", "其他业务系统", "图书馆 · 调阅打印残页", { screen: "library", inspectedFields: ["library-hit"], evidence: ["e09"] });
  add("library-restored", "其他业务系统", "图书馆 · 复学后附件目录", { ...RESTORED, screen: "library", evidence: [...FLOW_EVIDENCE, "e09"] });
  add("library-attachments-recorded", "其他业务系统", "图书馆 · 附件已纳入补充材料", { ...RESTORED, screen: "library", evidence: [...FLOW_EVIDENCE, "e09", "e17"] });
  add("card-initial", "其他业务系统", "校园卡 · 本人与异常流水", { screen: "card" });
  add("card-recorded", "其他业务系统", "校园卡 · 门禁与校医院已取证", { screen: "card", evidence: ["e08"], inspectedFields: ["card-b4", "card-hospital"] });
  add("mail-initial", "其他业务系统", "校园邮箱 · 收件箱", { screen: "mail" });
  add("mail-rules", "其他业务系统", "校园邮箱 · 自动转发规则", { screen: "mail", evidence: ["e10"] });
  add("parent-initial", "其他业务系统", "家长端 · 回执正文", { screen: "parent" });
  add("parent-compared", "其他业务系统", "家长端 · 两端文案已核对", { screen: "parent", evidence: ["e12"], inspectedFields: ["parent-care", "parent-withdraw"] });
  add("parent-risk", "其他业务系统", "家长端 · 随附风险说明", { screen: "parent", evidence: ["e12", "e13"], inspectedFields: ["parent-care", "parent-withdraw", "risk-profile"] });

  add("forum-initial", "论坛与旧刊", "校园论坛 · 列表与引用缓存", { screen: "forum" });
  add("forum-pm-restored", "论坛与旧刊", "校园论坛 · 图片缓存与离线私信", { screen: "forum", evidence: ["e11"], forumPmUnlocked: true });
  add("forum-draft-restored", "论坛与旧刊", "校园论坛 · 复学后未发送草稿", { ...RESTORED, screen: "forum", evidence: [...FLOW_EVIDENCE, "e11"], forumPmUnlocked: true });
  for (const [key, label] of [["classroom", "教室空调"], ["project", "课程小组作业"], ["warning", "处分预警锁帖"], ["poison", "投毒传闻折叠帖"], ["sidegate", "尚德楼侧门施工"]]) {
    add(`forum-thread-${key}`, "论坛与旧刊", `论坛帖子 · ${label}`, { screen: "forum", forumThread: key }, "帖子完整正文及页脚。传闻与可验证事实的表述应保持区分。");
  }
  for (const [key, label] of [["qingchuan", "迎新校报"], ["discipline", "处分与申诉年报"], ["safety", "消防演练手册"]]) {
    add(`library-egg-${key}`, "论坛与旧刊", `旧刊彩蛋 · ${label}`, { screen: "library", libraryEgg: key });
  }

  add("review-empty", "终审与流程回转", "终审复核 · 尚无材料", { screen: "review" });
  add("review-partial", "终审与流程回转", "终审复核 · 流程证据不足", { screen: "review", evidence: ["e01", "e02", "e03", "e05"] });
  add("review-flow-ready", "终审与流程回转", "终审复核 · 低风险回转就绪", { screen: "review", evidence: FLOW_EVIDENCE });
  add("review-filtered", "终审与流程回转", "终审复核 · 已排除敏感附件", { screen: "review", evidence: EARLY_EVIDENCE, reviewSelectionMode: "flow" });
  add("review-all-sensitive", "终审与流程回转", "终审复核 · 全部提交高风险", { screen: "review", evidence: EARLY_EVIDENCE, reviewSelectionMode: "all" });
  add("review-manual", "终审与流程回转", "终审复核 · 手动选择中风险", { screen: "review", evidence: EARLY_EVIDENCE, reviewSelectionMode: "manual", selectedEvidence: [...MIN_FLOW, "e08"] });
  add("review-draft-rewritten", "终审与流程回转", "终审复核 · 补充说明被改写", { screen: "review", evidence: FLOW_EVIDENCE, reviewDraft: "我没有准备好接受当前处理结果。", reviewDraftRewritten: true }, "玩家输入“我没有申请”后，系统对补充说明进行改写。");
  add("review-restored-pending", "终审与流程回转", "终审复核 · 复学后待补材料", { ...RESTORED, screen: "review", evidence: FLOW_EVIDENCE });
  add("review-true-ready", "终审与流程回转", "终审复核 · 补充调查完整", { ...RESTORED, screen: "review", evidence: ALL_EVIDENCE, reviewSelectionMode: "all" });
  const reviewErrors = [
    ["unit", "责任口径被退回", "复核退回：学院意见与心理材料互作依据，不能单独采信。", { evidence: FLOW_EVIDENCE, selectedUnit: "学院学生工作办公室" }],
    ["b4", "B4 材料不能证明流程无效", "复核退回：B4 与利益链材料不能单独证明本人自愿离校流程无效。可改走 B4 与利益链补正归档。", { evidence: B4_EVIDENCE, reviewSelectionMode: "all" }],
    ["flow", "流程证明不足", "复核退回：现有流程材料还不足以证明本人确认、家长确认和部门审核之间的事实矛盾。", { evidence: ["e01", "e02", "e03", "e05"] }],
    ["restored", "学籍异动已撤销", "当前学籍异动已撤销。如需继续，请提交复学后补充调查材料。", { ...RESTORED, evidence: FLOW_EVIDENCE }],
    ["audit", "补正归档缺少来源", "补正归档退回：需要先取得 B4 调阅来源或论坛缓存，并补齐 B4 与利益链材料。", { evidence: ["e01", "e08"] }],
    ["true", "补充材料未受理", "补充材料未受理：仍缺少复学后 OCR、B4、舆情缓存、利益链或候选名单关键附件。", { ...RESTORED, evidence: FLOW_EVIDENCE }],
    ["ocr", "完整 OCR 权限不足", "当前账号仍处于离校过渡期，无法查看完整 OCR。", { evidence: EARLY_EVIDENCE }]
  ];
  reviewErrors.forEach(([id, title, reviewError, patch]) => add(`review-error-${id}`, "终审与流程回转", `复核反馈 · ${title}`, { screen: "review", ...patch, reviewError }));
  const route = [["学院学生工作办公室", 74], ["教务处", 61], ["心理中心", 49], ["家长端", 33], ["学工部", 18], ["学院学生工作办公室", 0]];
  route.forEach(([unit, progress], index) => add(`review-route-${index + 1}`, "终审与流程回转", `流程回转 ${index + 1}/6 · ${unit}`, { screen: "review", evidence: FLOW_EVIDENCE, permissionLevel: "reviewing", reviewRouteStep: index + 1, progress }));

  add("overlay-identity", "弹窗与短暂状态", "撤销申请 · 账号不存在或已离校", { identityGlitch: true, accountGlitch: true, withdrawAttempts: 1 }, "原游戏短暂显示的身份异常层，此处保持显示以便审校。");
  add("overlay-permission", "弹窗与短暂状态", "访问受限 · 无权限查看", { screen: "library", accessDeniedGlitch: true, accountGlitch: true });
  add("overlay-interaction-guard", "弹窗与短暂状态", "权限校验 · 请稍候", { screen: "library", interactionLockedUntil: 8640000000000000 }, "只展示校验等待文字；场景切换不会受此游戏内锁影响。");
  add("overlay-voluntary", "弹窗与短暂状态", "自愿离校 · 二次确认", { voluntaryConfirmOpen: true });
  add("overlay-pm", "弹窗与短暂状态", "guest_404 · 收到离线私信", { screen: "forum", evidence: ["e11"], forumPmUnlocked: true, forumPmPopup: true });
  add("overlay-care", "弹窗与短暂状态", "重复申诉 · 关怀处置警告", { screen: "student", evidence: ["e06"], appealCount: 4, appealHorrorSeen: true, appealHorrorPopup: true });
  add("overlay-restored", "弹窗与短暂状态", "恢复学籍 · 撤销申请回执", { ...RESTORED, evidence: FLOW_EVIDENCE, restoreNoticePopup: true });
  add("evidence-complete", "弹窗与短暂状态", "取证夹 · 全部证据与事件链", { ...RESTORED, evidence: ALL_EVIDENCE, recentEvidenceId: "e21" }, "21 条证据、四组事件链、完整调查摘要及全部关键词。可在手机预览中打开取证夹。");
  add("evidence-copied", "弹窗与短暂状态", "关键词 · 复制成功", { evidence: EARLY_EVIDENCE, copiedClueTerm: "0713" });
  add("mobile-navigation", "弹窗与短暂状态", "手机布局 · 业务系统抽屉", { mobileNavOpen: true }, "请切换为手机尺寸查看抽屉与关闭按钮。");
  add("mobile-evidence", "弹窗与短暂状态", "手机布局 · 完整取证夹抽屉", { ...RESTORED, evidence: ALL_EVIDENCE, mobileEvidenceOpen: true }, "请切换为手机尺寸查看证据列表、事件链与关键词。");
  const autocomplete = [
    ["mengqing", "孟清", "孟清 长期休学", "系统补全：历史学籍状态"],
    ["b4", "B4", "B4 侧门 转运 23:58", "系统补全：已撤回地点描述"],
    ["gu", "顾天泽", "顾天泽 处分撤回 推免候选", "系统补全：关联事项已折叠"],
    ["guest", "guest_404", "guest_404 未发送草稿", "系统补全：缓存草稿"],
    ["withdrawn", "B4", "B4", "自动补全已撤回"]
  ];
  autocomplete.forEach(([id, portalQuery, portalAutocompletePreview, portalAutocompleteHint]) => add(`autocomplete-${id}`, "弹窗与短暂状态", `检索框自动补全 · ${portalAutocompleteHint}`, { portalQuery, portalAutocompleteActive: true, portalAutocompletePreview, portalAutocompleteHint }, "自动补全的输入框内容及下方提示通常只显示片刻；此处保持显示。"));

  const searches = [
    ["no-match", "未命中公开事项", "不存在的事项", {}],
    ["number-locked", "流程尾号 · 来源未取得", "0713", {}],
    ["number-forum-known", "流程尾号 · 已读锁帖", "0713", { inspectedFields: ["forum-warning-thread"] }],
    ["b4-locked", "B4 地点 · 来源未取得", "B4", {}],
    ["b4-print", "B4＋尾号 · 馆藏来源已取得", "B4 0713", { inspectedFields: ["library-callno"] }],
    ["b4-cache", "B4＋尾号＋缓存 ID · 完整命中", "B4 0713 guest_404", { inspectedFields: ["library-callno", "forum-warning-thread"], evidence: ["e08"] }],
    ["meng-locked", "孟清 · 姓名受限", "孟清", {}],
    ["meng-unlocked", "孟清 · 已有调阅与论坛来源", "孟清", { evidence: ["e09", "e11"] }],
    ["guest-locked", "guest_404 · 未取得来源", "guest_404", {}],
    ["guest-known", "guest_404 · 已取得来源", "guest_404", { inspectedFields: ["forum-warning-thread"] }],
    ["gu-locked", "顾天泽 · 单独检索", "顾天泽", {}],
    ["gu-reference", "顾天泽处分 · 已有调阅来源", "顾天泽 处分", { evidence: ["e09"] }],
    ["gu-cache", "顾天泽处分＋孟清 · 引用缓存", "顾天泽 处分撤回 孟清", { evidence: ["e09"], inspectedFields: ["forum-warning-thread"] }],
    ["gcz-code", "旧档编号 · 交叉核验受限", "GCZ-2024-discipline-withdraw", { evidence: ["e09"] }],
    ["rank-locked", "推免候选 · 无来源", "推免候选排名缓存", {}],
    ["rank-callno", "推免候选 · 仅有索书号", "推免候选排名缓存", { inspectedFields: ["library-callno"] }],
    ["rank-before-restore", "推免候选 · 等待恢复在籍", "推免候选排名缓存", { evidence: ["e09"] }],
    ["rank-ready", "推免候选 · 可核验", "推免候选排名缓存", { ...RESTORED, evidence: [...FLOW_EVIDENCE, "e09"] }],
    ["pdf-author", "PDF 作者账号", "xzy_admin", {}],
    ["ip-before", "处理 IP · 尚未取证", "10.18.4.27", {}],
    ["ip-and-archive", "处理 IP＋归档地址 · 已有来源", "10.18.4.27 xg413_archive", { evidence: ["e07", "e10"] }],
    ["parent-locked", "暂时休整 · 来源受限", "暂时离校休整", {}],
    ["parent-found", "暂时休整 · 端口差异已取证", "暂时离校休整", { evidence: ["e12", "e14"] }],
    ["archive-generic", "归档 · 泛搜索受限", "归档", {}],
    ["archive-no-source", "归档地址 · 未取得邮箱规则", "xg413_archive", {}],
    ["archive-found", "归档地址 · 已有邮箱规则", "xg413_archive", { evidence: ["e10"] }],
    ["audit-found", "审计编号 · 已有邮箱规则", "AUDIT-QCU-2026-0713 xg413_archive", { evidence: ["e10"] }]
  ];
  searches.forEach(([id, title, searchQuery, patch]) => add(`search-${id}`, "统一检索", title, { portalQuery: searchQuery, ...patch }, `检索“${searchQuery}”时的真实结果。编号、人名、来源条件共同决定结果。`, { searchQuery }));

  function ending(id, title, type, evidence, patch, description) {
    add(id, "全部结局", title, { evidence, ending: type, preEndingState: { loggedIn: true, guideSeen: true, introSeen: true, screen: "review", evidence: clone(evidence), unlocked: ALL_SYSTEMS }, ...patch }, description);
  }
  ending("ending-default", "石沉海底", "default", ["e01", "e02", "e03"]);
  ending("ending-voluntary-low", "随波逐流 · 零散证据", "voluntary", ["e01", "e02", "e03", "e05"]);
  ending("ending-voluntary-high", "抱薪留火 · 足量证据", "voluntary", EARLY_EVIDENCE);
  ending("ending-restore-low", "全身而退 · 辅助附件较少", "restore", [...MIN_FLOW, "e08"]);
  ending("ending-restore-high", "全身而退 · 辅助附件较多", "restore", [...FLOW_EVIDENCE, "e08"]);
  ending("ending-public", "众目昭彰 · 未含候选缓存", "public", [...FLOW_EVIDENCE, ...B4_EVIDENCE]);
  ending("ending-public-cache", "众目昭彰 · 含候选缓存的保留变体", "public", ALL_EVIDENCE, RESTORED, "源码保留的 e21 日志变体。当前正常流程恢复学籍后不会再由原复核入口触发此结局，单列供文案核对。");
  ending("ending-audit", "拨乱反正 · 未含候选缓存", "audit", B4_EVIDENCE);
  ending("ending-audit-cache", "拨乱反正 · 含候选缓存", "audit", ALL_EVIDENCE, RESTORED);
  ending("ending-true", "蚂蚁的胜利 · 回到名单", "true", ALL_EVIDENCE, { ...RESTORED, trueEndingReady: true });

  // Transient strings are fixtures only. The editor's source map must index the
  // original app/actions files, never this scene catalogue, when exporting edits.
  const notices = [
    "已进入图书馆旧刊数据库：尝试打开封闭馆藏打印预览。",
    "已进入校园论坛：锁帖和缓存 ID 会暴露被删内容。",
    "已进入论坛缓存：guest_404 的离线私信已恢复。",
    "已进入校园卡系统：请比较脱敏异常流水中的地点与时间。",
    "已进入家长端缓存：请比较家长端按钮和教务归档文案。",
    "已打开归档预览缓存：请标记来源片段并生成归档输出。",
    "候选排名缓存需要先取得 B4 调阅来源。",
    "候选排名缓存需要在籍学生权限。请先完成流程回转。",
    "已展开学生画像摘要，请查看下方核心记录。",
    "已进入学工系统：请在工单日志中核对责任单位、处理依据和 IP。",
    "公开字段不足，请先标记这 3 个可互相印证的附件字段。",
    "学籍异动终审提醒：当前节点为本人最终确认。",
    "已进入图书馆旧刊数据库：可尝试索书号尾号或地点词。",
    "该字段已记录。",
    "已显示课程反馈来源。继续点击任一反馈结果转换字段即可写入证据。",
    "当前账号只能查看脱敏请求详情。完整原表需要在籍学生权限。",
    "当前账号仍无权确认 B4 附件目录。",
    "论坛搜索只剩折叠传闻。请结合 B4、孟清或 guest_404 继续核验。",
    "已填入审计编号：请在统一检索结果中打开归档预览缓存。",
    "已进入家长端缓存：请核对“暂时休整”和“自愿退学”的差异。",
    "随附风险说明已写入本地取证。"
  ];
  for (let offset = 0; offset < notices.length; offset += 3) {
    const items = notices.slice(offset, offset + 3).map((message, index) => ({ id: `notice-${offset + index}`, message }));
    add(`toasts-${offset / 3 + 1}`, "操作反馈与日志", `操作提示 ${offset / 3 + 1} · ${items[0].message.slice(0, 14)}`, { screen: "student", toasts: items, messageLog: items }, "短暂提示在此保持显示。策划修改的是对应游戏动作的反馈文案。", { sourceFiles: ["scripts/actions.js", "app.js"] });
  }
  add("toasts-dynamic", "操作反馈与日志", "动态提示 · 新增证据与填入检索", { evidence: ["e01"], toasts: [{ id: "evidence", message: "新增本地证据：证据 01 · 流程节点时间错误" }, { id: "search", message: "已填入门户检索框，请点击搜索：0713" }] }, "这是带变量的实际显示示例；合回时需保留证据编号、名称和检索词的动态插入。", { sourceFiles: ["app.js", "game-data.js"] });

  const riskLogs = [
    "学生再次提交异议，要求复核既有材料与流转依据。",
    "学生重复提交异议，工单同步至关怀回访队列。",
    "学生继续追加异议，页面提示辅导员进行回访确认。",
    "后续重复提交已合并记录，关怀标签维持不变。",
    "关怀阈值触发：重复异议被写入家长端风险提示。",
    "学生在复核说明中否认既有流程记录，系统已按规范表述调整。",
    "学生检索未公开事项，系统未返回结果。",
    "学生通过统一检索进入 B4 封闭馆藏记录。",
    "学生通过统一检索进入 0713 舆情缓存。",
    "学生用组合关键词定位被删楼层引用缓存。",
    "学生通过邮箱转发规则访问学生事务材料归档预览缓存。",
    "学生尝试打开推免候选排名缓存，但缺少 B4 调阅来源。",
    "学生尝试打开推免候选排名缓存，但当前账号仍处于离校过渡期。",
    "学生在信息公开缓存中定位推免候选排名缓存。",
    "学生查看孟清志愿服务与学生事务材料补录记录。",
    "学生查看辅导员谈话材料历史版本。",
    "学生查看学生画像摘要与来源记录。",
    "学生浏览顾天泽荣誉新闻附件。",
    "学生核验顾天泽荣誉新闻与推免节点时间线。",
    "学生打开数据治理采购公示附件。",
    "学生查看数据治理采购、合作备案与会议纪要公开材料。",
    "学生在信息公开页尝试打开推免候选排名缓存，系统要求先提供 B4 调阅来源。",
    "学生在信息公开页尝试打开推免候选排名缓存，系统要求先恢复在籍权限。",
    "学生以在籍权限查看信息公开会议纪要完整 OCR。",
    "学生主动查看离校归档材料，对终审流程持续关注。",
    "学生记录图书馆清退索书号 QCU-SEC-B4-0713。",
    "学生端撤销申请成功，离校过渡期权限调整已撤回。",
    "学生尝试撤销已进入终审阶段的学籍异动流程。",
    "学生查看流程编号中的归档日期。",
    "学生核对流程办理时间，对既有审核顺序提出质疑。",
    "学生查看退学申请附件元数据。",
    "学生尝试访问谈话记录非公开来源视图。",
    "学生展开心理转介单的请求记录来源。",
    "学生检索封闭区域 B4 相关档案资料。",
    "学生检索与当前学籍异动无直接关联的馆藏资料。",
    "学生通过馆藏打印预览残页取得 B4 调阅登记。",
    "学生以在籍权限核验 B4 附件目录，补充材料纳入终审复核。",
    "学生尝试打开推免候选排名缓存，但权限尚未恢复。",
    "学生打开信息公开中的推免候选排名缓存，系统记录其继续关注名额调整。",
    "学生在锁帖缓存中发现 guest_404，并触发离线私信。",
    "学生搜索长期休学人员、处分撤回及历史删帖缓存，对敏感舆情表现出持续关注。",
    "学生搜索突发事件传闻与校医院相关记录，系统将其并入敏感舆情关注。",
    "学生尝试检索未公开的历史楼层缓存 ID。",
    "学生尝试检索论坛已删除内容。",
    "学生从邮箱转发规则反查审计归档入口。",
    "学生尝试生成归档拼接结论，但标记字段不足。",
    "多部门流程回转完成，学生身份恢复为在籍。",
    "终审复核通过流程有效性审查，进入多部门回转。"
  ];
  for (let offset = 0; offset < riskLogs.length; offset += 12) {
    add(`risk-log-${offset / 12 + 1}`, "操作反馈与日志", `关怀记录 · 文案组 ${offset / 12 + 1}`, { screen: "student", riskLogs: riskLogs.slice(offset, offset + 12), riskLogExpanded: true, appealCount: 5 }, "将多个动作产生的真实记录集中显示，便于逐条审校；不代表一条完整游玩路线。", { sourceFiles: ["scripts/actions.js", "app.js"] });
  }
  add("risk-log-collapsed", "操作反馈与日志", "关怀记录 · 折叠与合并说明", { screen: "student", riskLogs: riskLogs.slice(0, 12), riskLogExpanded: false, appealCount: 5 });

  root.VoluntaryLeaveEditorScenes = scenes;
  if (typeof module !== "undefined" && module.exports) module.exports = scenes;
})(typeof window !== "undefined" ? window : globalThis);
