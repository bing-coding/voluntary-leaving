(function (root) {
  const ALLOWED_DURING_LOCK = [
    "reset",
    "close-notice",
    "close-notice-backdrop",
    "close-library-egg",
    "close-forum-thread",
    "close-forum-pm",
    "close-forum-pm-backdrop",
    "close-appeal-horror",
    "close-restore-notice",
    "close-restore-notice-backdrop",
    "close-mobile-panels",
    "close-mobile-evidence"
  ];

  function handleAction(ctx, action) {
    if (ctx.isInteractionLocked() && !ALLOWED_DURING_LOCK.includes(action)) return;
    return handleUiAction(ctx, action)
      || handleSearchAction(ctx, action)
      || handlePortalAction(ctx, action)
      || handleAcademicAction(ctx, action)
      || handleMaterialsAction(ctx, action)
      || handleStudentAction(ctx, action)
      || handleSystemEvidenceAction(ctx, action)
      || handleArchiveReviewAction(ctx, action);
  }

  function handleUiAction(ctx, action) {
    const { state, setState, resetGame } = ctx;
    const backdropCloseMap = {
      "close-notice-backdrop": "close-notice",
      "close-affairs-modal-backdrop": "close-affairs-modal",
      "close-talk-source-backdrop": "close-talk-source",
      "close-flow-modal-backdrop": "close-flow-modal",
      "close-public-chain-backdrop": "close-public-chain",
      "close-gu-timeline-backdrop": "close-gu-timeline",
      "close-forum-pm-backdrop": "close-forum-pm",
      "close-restore-notice-backdrop": "close-restore-notice"
    };
    action = backdropCloseMap[action] || action;
    if (action === "notice-archive") return setState({ noticeModal: "archive" }) || true;
    if (action === "notice-service") return setState({ noticeModal: "service" }) || true;
    if (action === "close-notice") return setState({ noticeModal: "" }) || true;
    if (action === "close-affairs-modal") return setState({ affairsModal: "" }) || true;
    if (action === "open-talk-source") return setState({ talkSourceModal: true }) || true;
    if (action === "close-talk-source") return setState({ talkSourceModal: false }) || true;
    if (action === "open-flow-modal") return setState({ workOrderFlowModal: true }) || true;
    if (action === "close-flow-modal") return setState({ workOrderFlowModal: false }) || true;
    if (action === "close-public-chain") return setState({ publicChainModal: false }) || true;
    if (action === "close-gu-timeline") return setState({ guTimelineModal: false }) || true;
    if (action === "close-library-egg") return setState({ libraryEgg: "" }) || true;
    if (action === "close-forum-thread") return setState({ forumThread: "" }) || true;
    if (action === "close-forum-pm") return setState({ forumPmPopup: false }) || true;
    if (action === "close-appeal-horror") return setState({ appealHorrorPopup: false }) || true;
    if (action === "close-restore-notice") return setState({ restoreNoticePopup: false }) || true;
    if (action === "guide-seen") return setState({ guideSeen: true }) || true;
    if (action === "cancel-voluntary") return setState({ voluntaryConfirmOpen: false }) || true;
    if (action === "open-mobile-nav") return setState({ mobileNavOpen: true, mobileEvidenceOpen: false }) || true;
    if (action === "open-mobile-evidence") return setState({ mobileEvidenceOpen: true, mobileNavOpen: false }) || true;
    if (action === "close-mobile-evidence") return setState({ mobileEvidenceOpen: false }) || true;
    if (action === "toggle-mobile-nav") return setState({ mobileNavOpen: state.mobileEvidenceOpen ? true : !state.mobileNavOpen, mobileEvidenceOpen: false }) || true;
    if (action === "toggle-mobile-evidence") return setState({ mobileEvidenceOpen: state.mobileNavOpen ? true : !state.mobileEvidenceOpen, mobileNavOpen: false }) || true;
    if (action === "close-mobile-panels") return setState({ mobileNavOpen: false, mobileEvidenceOpen: false }) || true;
    if (action === "toggle-risk-log") return setState({ riskLogExpanded: !state.riskLogExpanded }) || true;
    if (action === "close-search") return setState({ portalResults: [] }) || true;
    if (action === "reset") return resetGame() || true;
    if (action === "intro-seen") return setState({ introSeen: true }) || true;
    if (action === "intro-seen-login") return setState({ introSeen: true }) || true;
    return false;
  }

  function handleSearchAction(ctx, action) {
    const { state, act, unlock, inspectField, addEvidence, toast, addRiskLog, buildPortalResults, flashAccount, has } = ctx;
    if (action === "portal-search") {
      const query = document.getElementById("portal-search")?.value || state.portalQuery;
      return act(() => {
        state.portalQuery = query;
        state.mobileNavOpen = false;
        state.mobileEvidenceOpen = false;
        state.portalResults = buildPortalResults(query);
        recordSensitiveSearch(ctx, query);
        addRiskLog(`学生使用统一门户检索：${query || "空白关键词"}。`);
      }, 2) || true;
    }
    if (action === "search-empty") return act(() => addRiskLog("学生检索未公开事项，系统未返回结果。"), 1) || true;
    if (action === "search-academic-flow") return act(() => { state.screen = "academic"; inspectField("flow-code"); unlock("materials"); unlock("student"); state.portalResults = []; }, 2) || true;
    if (action === "search-library-b4") return act(() => { unlock("library"); state.screen = "library"; state.portalResults = []; inspectField("library-hit"); toast("已进入图书馆旧刊数据库：尝试打开封闭馆藏打印预览。"); addRiskLog("学生通过统一检索进入 B4 封闭馆藏记录。"); if (!state.studentStatusRestored) flashAccount(); }, 3) || true;
    if (action === "search-forum-0713") return act(() => { unlock("forum"); state.screen = "forum"; state.portalResults = []; toast("已进入校园论坛：锁帖和缓存 ID 会暴露被删内容。"); addRiskLog("学生通过统一检索进入 0713 舆情缓存。"); }, 3) || true;
    if (action === "search-forum-cache") return act(() => { unlock("forum"); unlock("card"); state.screen = "forum"; state.portalResults = []; if (!state.forumPmUnlocked) state.forumPmPopup = true; state.forumPmUnlocked = true; addEvidence("e11"); toast("已进入论坛缓存：guest_404 的离线私信已恢复。"); addRiskLog("学生用组合关键词定位被删楼层引用缓存。"); if (!state.studentStatusRestored) flashAccount(); }, 4) || true;
    if (action === "search-card-b4") return act(() => { unlock("card"); state.screen = "card"; state.portalResults = []; toast("已进入校园卡系统：请比较脱敏异常流水中的地点与时间。"); }, 3) || true;
    if (action === "search-pdf-author") return act(() => { unlock("materials"); state.screen = "materials"; state.materialTab = "application"; state.portalResults = []; }, 2) || true;
    if (action === "search-flow-ip") return act(() => { unlock("student"); state.screen = "student"; state.portalResults = []; }, 3) || true;
    if (action === "search-parent") return act(() => { unlock("parent"); state.screen = "parent"; inspectField("parent-cache"); state.portalResults = []; toast("已进入家长端缓存：请比较家长端按钮和教务归档文案。"); }, 3) || true;
    if (action === "search-archive") return act(() => { unlock("archive"); state.screen = "archive"; state.portalResults = []; toast("已打开归档预览缓存：请标记来源片段并生成归档输出。"); addRiskLog("学生通过邮箱转发规则访问学生事务材料归档预览缓存。"); if (!state.studentStatusRestored) flashAccount(); }, 4) || true;
    if (action === "search-recommend-cache") return act(() => {
      state.screen = "public";
      state.portalResults = [];
      if (!has("e09")) {
        addRiskLog("学生尝试打开推免候选排名缓存，但缺少 B4 调阅来源。");
        toast("候选排名缓存需要先取得 B4 调阅来源。");
        return;
      }
      if (!state.studentStatusRestored) {
        addRiskLog("学生尝试打开推免候选排名缓存，但当前账号仍处于离校过渡期。");
        toast("候选排名缓存需要在籍学生权限。请先完成流程回转。");
        return;
      }
      addEvidence("e21");
      addRiskLog("学生在信息公开缓存中定位推免候选排名缓存。");
    }, 4) || true;
    return false;
  }

  function handlePortalAction(ctx, action) {
    const { state, act, unlock, inspectField, addEvidence, toast, addRiskLog, buildPortalResults, flashAccount, has } = ctx;
    if (action === "mengqing-volunteer") return act(() => {
      addEvidence("e15");
      inspectField("mengqing-volunteer");
      state.affairsModal = "mengqing";
      addRiskLog("学生查看孟清志愿服务与学生事务材料补录记录。");
      unlock("library");
    }, 4) || true;
    if (action === "xzy-draft") return act(() => {
      addEvidence("e16");
      inspectField("xzy-draft");
      state.affairsModal = "xzy";
      addRiskLog("学生查看辅导员谈话材料历史版本。");
      unlock("materials");
    }, 4) || true;
    if (action === "work-profile" || action === "life-fragments") return act(() => {
      inspectField("life-fragments");
      addRiskLog("学生查看学生画像摘要与来源记录。");
      toast("已展开学生画像摘要，请查看下方核心记录。");
    }, 2) || true;
    if (action === "open-student-system") return act(() => {
      unlock("student");
      state.screen = "student";
      toast("已进入学工系统：请在工单日志中核对责任单位、处理依据和 IP。");
    }, 3) || true;
    if (action === "gu-news") return act(() => {
      state.guTimelineVisible = true;
      state.guTimelineModal = true;
      inspectField("gu-news");
      addRiskLog("学生浏览顾天泽荣誉新闻附件。");
      unlock("forum");
      unlock("library");
    }, 2) || true;
    if (action === "gu-timeline-node") return act(() => {
      state.guTimelineVisible = true;
      state.guTimelineModal = true;
      addEvidence("e18");
      inspectField("gu-news");
      addRiskLog("学生核验顾天泽荣誉新闻与推免节点时间线。");
      unlock("forum");
      unlock("library");
    }, 4) || true;
    if (action.startsWith("public-chain-field-")) return act(() => {
      const field = action.replace("public-chain-field-", "");
      if (!state.publicChainFields.includes(field)) state.publicChainFields.push(field);
      state.publicChainModal = true;
      state.publicChainVisible = true;
    }, 1) || true;
    if (action === "public-chain") return act(() => {
      state.publicChainVisible = true;
      state.publicChainModal = true;
      inspectField("public-chain");
      addRiskLog("学生打开数据治理采购公示附件。");
    }, 2) || true;
    if (action === "public-chain-evidence") return act(() => {
      if (state.publicChainFields.length < 3 && !has("e19")) {
        state.publicChainModal = true;
        toast("公开字段不足，请先标记这 3 个可互相印证的附件字段。");
        return;
      }
      state.publicChainVisible = true;
      state.publicChainModal = true;
      addEvidence("e19");
      unlock("review");
      inspectField("public-chain");
      addRiskLog("学生查看数据治理采购、合作备案与会议纪要公开材料。");
    }, 5) || true;
    if (action === "recommend-cache-locked") return act(() => {
      state.portalQuery = "推免候选排名缓存";
      state.portalResults = buildPortalResults(state.portalQuery);
      addRiskLog(state.studentStatusRestored ? "学生在信息公开页尝试打开推免候选排名缓存，系统要求先提供 B4 调阅来源。" : "学生在信息公开页尝试打开推免候选排名缓存，系统要求先恢复在籍权限。");
    }, 2) || true;
    if (action === "public-full-ocr") return act(() => unlockHiddenEvidence20(ctx, "学生以在籍权限查看信息公开会议纪要完整 OCR。"), 5) || true;
    return false;
  }

  function handleAcademicAction(ctx, action) {
    const { state, act, unlock, addRiskLog, triggerIdentityGlitch, toast, setState, end } = ctx;
    if (action === "login") {
      const captcha = (document.getElementById("login-captcha")?.value || "").trim().toUpperCase().replace(/\s+/g, "");
      if (captcha !== "713A" && captcha !== "0713") {
        setState({ loginError: "验证码输入错误，请重新输入。" });
        setTimeout(() => {
          const input = document.getElementById("login-captcha");
          input?.focus();
          input?.select();
        }, 0);
        return true;
      }
      toast("学籍异动终审提醒：当前节点为本人最终确认。");
      setState({ loggedIn: true, loginError: "" });
      return true;
    }
    if (action === "open-materials") return act(() => { unlock("materials"); state.screen = "materials"; addRiskLog("学生主动查看离校归档材料，对终审流程持续关注。"); }, 4) || true;
    if (action === "open-library") return act(() => { unlock("library"); state.screen = "library"; toast("已进入图书馆旧刊数据库：可尝试索书号尾号或地点词。"); }, 4) || true;
    if (action === "library-callno") return act(() => { ctx.inspectField("library-callno"); unlock("library"); addRiskLog("学生记录图书馆清退索书号 QCU-SEC-B4-0713。"); }, 2) || true;
    if (action === "withdraw") return act(() => {
      if (state.studentStatusRestored) {
        state.permissionLevel = "active_student";
        state.progress = 0;
        state.restoreNoticePopup = true;
        unlock("library");
        unlock("review");
        unlock("student");
        addRiskLog("学生端撤销申请成功，离校过渡期权限调整已撤回。");
        return;
      }
      state.withdrawAttempts = (state.withdrawAttempts || 0) + 1;
      unlock("student");
      addRiskLog("学生尝试撤销已进入终审阶段的学籍异动流程。");
      if (state.withdrawAttempts === 1) triggerIdentityGlitch();
    }, 5) || true;
    if (action === "flow-log") return act(() => { ctx.inspectField("flow-code"); unlock("materials"); unlock("student"); addRiskLog("学生查看流程编号中的归档日期。"); }, 2) || true;
    if (action === "flow-early-node") return act(() => { ctx.addEvidence("e01"); unlock("materials"); unlock("student"); addRiskLog("学生核对流程办理时间，对既有审核顺序提出质疑。"); }, 4) || true;
    if (action === "voluntary") return setState({ voluntaryConfirmOpen: true }) || true;
    if (action === "confirm-voluntary") return end("voluntary") || true;
    return false;
  }

  function handleMaterialsAction(ctx, action) {
    const { state, act, unlock, inspectField, inspected, addEvidence, addRiskLog, toast, has } = ctx;
    if (action === "pdf-meta") return act(() => { state.pdfMetaVisible = true; addRiskLog("学生查看退学申请附件元数据。"); }, 3) || true;
    if (action === "pdf-author") return act(() => { state.pdfAuthorMarked = true; addEvidence("e02"); }, 4) || true;
    if (action === "pdf-creator" || action === "pdf-created") return act(() => toast("该字段已记录。"), 1) || true;
    if (action === "talk-quote") return act(() => inspectField("talk-quote"), 2) || true;
    if (action === "source-param") {
      const value = (document.getElementById("url-param")?.value || "").toLowerCase().replace(/\s+/g, "");
      const opensSource = value.includes("source")
        || value.includes("raw")
        || value.includes("origin")
        || value.includes("原始")
        || value.includes("原文")
        || value.includes("来源")
        || value.includes("谈话记录")
        || value.includes("20260612")
        || value.includes("13:40")
        || value.includes("1340")
        || value.includes("chat_20260612_1340");
      return act(() => {
        if (opensSource) {
          addEvidence("e03");
          state.talkSourceModal = true;
          return;
        }
        addRiskLog("学生尝试访问谈话记录非公开来源视图。");
      }, 5) || true;
    }
    if (action === "survey-source") return act(() => {
      inspectField("survey-source");
      addRiskLog("学生展开心理转介单的请求记录来源。");
      if (state.studentStatusRestored && !has("e04")) {
        toast("已显示课程反馈来源。继续点击任一反馈结果转换字段即可写入证据。");
      }
    }, 2) || true;
    if (action === "survey-map") return act(() => {
      if (!state.studentStatusRestored && !has("e04")) {
        toast("当前账号只能查看脱敏请求详情。完整原表需要在籍学生权限。");
        return;
      }
      addEvidence("e04");
      unlock("psych");
    }, 5) || true;
    if (action === "dorm-apply" || action === "dorm-repair") return act(() => {
      inspectField(action);
      if ((action === "dorm-apply" && inspected("dorm-repair")) || (action === "dorm-repair" && inspected("dorm-apply"))) {
        addEvidence("e05");
        unlock("dorm");
      }
    }, 3) || true;
    return false;
  }

  function handleStudentAction(ctx, action) {
    const { state, act, unlock, inspectField, addEvidence, addRiskLog, appendAppealLog } = ctx;
    if (action === "appeal") return act(() => { addEvidence("e06"); appendAppealLog(); }, 6) || true;
    if (action === "flow-loop") return act(() => {
      inspectField("flow-loop");
      state.flowPreviewVisible = true;
    }, 3) || true;
    if (action === "flow-ip") return act(() => { addEvidence("e07"); unlock("forum"); unlock("mail"); }, 4) || true;
    return false;
  }

  function handleSystemEvidenceAction(ctx, action) {
    const { state, act, unlock, inspectField, inspected, addEvidence, addRiskLog, buildPortalResults, toast, flashAccount, has } = ctx;
    if (action === "psych-risk-profile") return act(() => inspectField("psych-risk-profile"), 3) || true;
    if (action === "library-search") {
      const value = document.getElementById("library-search")?.value || "";
      return act(() => {
        if (value.toLowerCase().includes("b4") || value.includes("0713")) {
          inspectField("library-hit");
          addRiskLog("学生检索封闭区域 B4 相关档案资料。");
          if (!state.studentStatusRestored) flashAccount();
        } else {
          addRiskLog("学生检索与当前学籍异动无直接关联的馆藏资料。");
        }
      }, 5) || true;
    }
    if (action === "library-print") return act(() => {
      addEvidence("e09");
      unlock("review");
      addRiskLog("学生通过馆藏打印预览残页取得 B4 调阅登记。");
      if (!state.studentStatusRestored) flashAccount();
    }, 4) || true;
    if (action === "library-b4-attachments") return act(() => {
      if (!state.studentStatusRestored) {
        toast("当前账号仍无权确认 B4 附件目录。");
        return;
      }
      addEvidence("e17");
      unlock("review");
      addRiskLog("学生以在籍权限核验 B4 附件目录，补充材料纳入终审复核。");
    }, 4) || true;
    if (action === "recommend-cache") return act(() => {
      state.screen = "public";
      if (!has("e09")) {
        toast("候选排名缓存需要先取得 B4 调阅来源。");
        return;
      }
      if (!state.studentStatusRestored) {
        toast("候选排名缓存需要在籍学生权限。请先完成流程回转。");
        addRiskLog("学生尝试打开推免候选排名缓存，但权限尚未恢复。");
        return;
      }
      addEvidence("e21");
      unlock("review");
      addRiskLog("学生打开信息公开中的推免候选排名缓存，系统记录其继续关注名额调整。");
    }, 5) || true;
    if (action === "card-b4" || action === "card-hospital") return act(() => {
      inspectField(action);
      if ((action === "card-b4" && inspected("card-hospital")) || (action === "card-hospital" && inspected("card-b4"))) {
        addEvidence("e08");
        unlock("library");
        unlock("review");
      }
    }, 3) || true;
    if (action === "forum-search") {
      const value = document.getElementById("forum-search")?.value || "";
      return act(() => {
        const query = value.trim().toLowerCase();
        recordSensitiveSearch(ctx, query);
        if (query.includes("guest_404") && inspected("forum-warning-thread")) {
          if (!state.forumPmUnlocked) state.forumPmPopup = true;
          state.forumPmUnlocked = true;
          addEvidence("e11");
          unlock("card");
          unlock("library");
          unlock("mail");
          unlock("review");
          addRiskLog("学生在锁帖缓存中发现 guest_404，并触发离线私信。");
        } else if (value.includes("长期休学") || value.includes("孟清") || value.includes("顾天泽")) {
          addRiskLog("学生搜索长期休学人员、处分撤回及历史删帖缓存，对敏感舆情表现出持续关注。");
          if (!state.studentStatusRestored) flashAccount();
        } else if (value.includes("投毒") || value.includes("中毒") || value.includes("校医院")) {
          addRiskLog("学生搜索突发事件传闻与校医院相关记录，系统将其并入敏感舆情关注。");
          toast("论坛搜索只剩折叠传闻。请结合 B4、孟清或 guest_404 继续核验。");
          if (!state.studentStatusRestored) flashAccount();
        } else if (query.includes("guest_404")) {
          addRiskLog("学生尝试检索未公开的历史楼层缓存 ID。");
        } else {
          addRiskLog("学生尝试检索论坛已删除内容。");
        }
      }, 5) || true;
    }
    if (action === "mail-rule") return act(() => { addEvidence("e10"); unlock("parent"); }, 5) || true;
    if (action === "mail-archive-search") return act(() => {
      state.portalQuery = "AUDIT-QCU-2026-0713 xg413_archive";
      state.portalResults = buildPortalResults(state.portalQuery);
      toast("已填入审计编号：请在统一检索结果中打开归档预览缓存。");
      addRiskLog("学生从邮箱转发规则反查审计归档入口。");
    }, 3) || true;
    if (action === "parent-cache") return act(() => { unlock("parent"); state.screen = "parent"; inspectField("parent-cache"); toast("已进入家长端缓存：请核对“暂时休整”和“自愿退学”的差异。"); }, 4) || true;
    if (action === "parent-care" || action === "parent-withdraw") return act(() => {
      inspectField(action);
      if ((action === "parent-care" && inspected("parent-withdraw")) || (action === "parent-withdraw" && inspected("parent-care"))) addEvidence("e12");
    }, 3) || true;
    if (action === "risk-profile") return act(() => {
      inspectField("risk-profile");
      addEvidence("e13");
      unlock("review");
      toast("随附风险说明已写入本地取证。");
    }, 5) || true;
    return false;
  }

  function handleArchiveReviewAction(ctx, action) {
    const { state, setState, act, unlock, addEvidence, addRiskLog, has, EVIDENCE, flowReviewEvidence } = ctx;
    if (action.startsWith("archive-")) {
      if (action === "archive-compare") return act(() => {
        state.archiveFields = [...new Set(state.archiveFields)];
        if (state.archiveFields.length < 3 && !has("e14")) {
          addRiskLog("学生尝试生成归档拼接结论，但标记字段不足。");
          return;
        }
        addEvidence("e14");
        unlock("review");
      }, 5) || true;
      return act(() => {
        if (!state.archiveFields.includes(action)) {
          state.archiveFields = [...state.archiveFields, action];
        }
      }, 2) || true;
    }
    if (action === "open-review-from-archive") return act(() => { unlock("review"); state.screen = "review"; }, 3) || true;
    if (action === "advance-review-route") return advanceReviewRoute(ctx) || true;
    if (action === "select-all-review-evidence" || action === "detail-select-all-review-evidence") return setState({ selectedEvidence: state.evidence.filter((id) => EVIDENCE[id]), reviewSelectionMode: "all", reviewError: "" }) || true;
    if (action === "select-flow-review-evidence" || action === "detail-select-flow-review-evidence") return setState({ selectedEvidence: flowReviewEvidence(), reviewSelectionMode: "flow", reviewError: "" }) || true;
    if (action === "submit-review") return submitReview(ctx) || true;
    if (action === "submit-true-ending") return submitTrueEnding(ctx) || true;
    if (action === "audit-archive") return submitAuditArchive(ctx) || true;
    return false;
  }

  function recordSensitiveSearch(ctx, query) {
    const value = String(query || "").toLowerCase();
    const sensitiveWords = ["b4", "顾天泽", "孟清", "guest_404", "guest404", "推免", "保研", "处分", "0713", "投毒", "中毒", "校医院"];
    if (sensitiveWords.some((word) => value.includes(word.toLowerCase()))) {
      ctx.state.sensitiveSearchCount += 1;
    }
  }

  function unlockHiddenEvidence20(ctx, logText) {
    const { state, addEvidence, unlock, addRiskLog, isTrueEndingReady } = ctx;
    if (!state.studentStatusRestored) {
      state.reviewError = "当前账号仍处于离校过渡期，无法查看完整 OCR。";
      return;
    }
    addEvidence("e20");
    state.hiddenEvidence20Unlocked = true;
    state.trueEndingReady = isTrueEndingReady();
    unlock("review");
    if (logText) addRiskLog(logText);
  }

  function advanceReviewRoute(ctx) {
    const { state, act, unlock, addRiskLog, REVIEW_ROUTE } = ctx;
    act(() => {
      if (!state.reviewRouteStep) state.reviewRouteStep = 1;
      if (state.reviewRouteStep < REVIEW_ROUTE.length) {
        const next = REVIEW_ROUTE[state.reviewRouteStep];
        state.reviewRouteStep += 1;
        state.progress = next[2];
        addRiskLog(`回转节点推进：${next[0]}确认 ${next[1]}`);
        return;
      }
      state.reviewRouteStep = REVIEW_ROUTE.length;
      state.progress = 0;
      state.studentStatusRestored = true;
      state.permissionLevel = "active_student";
      state.restoreNoticePopup = true;
      unlock("academic");
      unlock("materials");
      unlock("student");
      unlock("library");
      unlock("review");
      addRiskLog("多部门流程回转完成，学生身份恢复为在籍。");
    }, 8);
  }

  function submitReview(ctx) {
    const { state, act, unlock, addRiskLog, end, reviewSubmittedEvidence, getEvidenceProfile, isLowRiskReviewRoute, REVIEW_ROUTE } = ctx;
    act(() => {
      const submittedEvidence = reviewSubmittedEvidence();
      const profile = getEvidenceProfile(submittedEvidence);
      const selectedUnit = (state.selectedUnit || "多部门材料互相引用") === "不存在明确责任单位" ? "多部门材料互相引用" : (state.selectedUnit || "多部门材料互相引用");
      if (selectedUnit !== "多部门材料互相引用") {
        state.reviewError = "复核退回：学院意见与心理材料互作依据，不能单独采信。";
        return;
      }
      if (!profile.withdrawalReady) {
        if (submittedEvidence.length < 4) {
          state.reviewError = "";
          end("default");
          return;
        }
        if (profile.b4Ready) {
          state.reviewError = "复核退回：B4 与利益链材料不能单独证明本人自愿离校流程无效。可改走 B4 与利益链补正归档。";
          return;
        }
        state.reviewError = "复核退回：现有流程材料还不足以证明本人确认、家长确认和部门审核之间的事实矛盾。";
        return;
      }
      if (state.studentStatusRestored) {
        state.reviewError = "当前学籍异动已撤销。如需继续，请提交复学后补充调查材料。";
        return;
      }
      if (isLowRiskReviewRoute(submittedEvidence)) {
        state.reviewError = "";
        state.permissionLevel = "reviewing";
        state.reviewRouteStep = 1;
        state.progress = REVIEW_ROUTE[0][2];
        unlock("review");
        addRiskLog("终审复核通过流程有效性审查，进入多部门回转。");
        return;
      }
      state.reviewError = "";
      end(profile.publicReady && profile.b4Ready ? "public" : "restore");
    }, 12);
  }

  function submitAuditArchive(ctx) {
    const { state, act, has, getEvidenceProfile, end } = ctx;
    act(() => {
      const profile = getEvidenceProfile();
      if (!profile.b4Ready || (!has("e09") && !has("e11"))) {
        state.reviewError = "补正归档退回：需要先取得 B4 调阅来源或论坛缓存，并补齐 B4 与利益链材料。";
        return;
      }
      state.reviewError = "";
      end("audit");
    }, 10);
  }

  function submitTrueEnding(ctx) {
    const { state, act, isTrueEndingReady, end } = ctx;
    act(() => {
      if (!isTrueEndingReady()) {
        state.reviewError = "补充材料未受理：仍缺少复学后 OCR、B4、舆情缓存、利益链或候选名单关键附件。";
        return;
      }
      state.trueEndingReady = true;
      end("true");
    }, 10);
  }

  root.VoluntaryLeaveActions = {
    handleAction,
    handleUiAction,
    handleSearchAction,
    handlePortalAction,
    handleAcademicAction,
    handleMaterialsAction,
    handleStudentAction,
    handleSystemEvidenceAction,
    handleArchiveReviewAction
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.VoluntaryLeaveActions;
  }
})(typeof window !== "undefined" ? window : globalThis);
