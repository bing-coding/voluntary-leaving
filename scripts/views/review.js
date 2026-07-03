(function (root) {
  function renderReviewRoute(ctx) {
    const { state, constants, h, header } = ctx;
    const { REVIEW_ROUTE } = constants;
    const currentIndex = Math.max(0, state.reviewRouteStep - 1);
    const current = REVIEW_ROUTE[currentIndex] || REVIEW_ROUTE[REVIEW_ROUTE.length - 1];
    return h`
      ${header("多部门流程回转", "复核通过后，原离校流程正在逐级退回。")}
      <div class="panel-body">
        <div class="card">
          <div class="card-head">回转进度 <span class="tag ok">${state.progress}%</span></div>
          <div class="card-body">
            <div class="progress rollback"><span style="width:${state.progress}%"></span></div>
            <div class="rollback-list">
              ${REVIEW_ROUTE.map(([unit, desc, progress], index) => `
                <div class="rollback-step ${index < state.reviewRouteStep ? "complete" : ""} ${index === currentIndex ? "active" : ""}">
                  <strong>${index + 1}. ${unit}</strong>
                  <p>${desc}</p>
                  <span>${progress}%</span>
                </div>`).join("")}
            </div>
            <div class="notice" style="margin-top:12px">当前节点：${current[0]}。退学完成度正在从 87% 回退，完成回转后系统将自动撤销离校流程。</div>
            <div class="actions">
              <button class="primary" data-action="advance-review-route">${state.reviewRouteStep >= REVIEW_ROUTE.length ? "完成回转" : "推进当前节点"}</button>
              <button data-screen="academic">返回教务首页</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderReview(ctx) {
    const {
      state,
      EVIDENCE,
      constants,
      rules,
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
    } = ctx;
    const {
      WITHDRAWAL_INVALID_EVIDENCE,
      B4_INTEREST_EVIDENCE,
      PUBLIC_EXPOSURE_EVIDENCE
    } = constants;
    if (state.reviewRouteStep && !state.studentStatusRestored) return renderReviewRoute(ctx);
    const units = ["教务处", "学院学生工作办公室", "心理中心", "家长端", "多部门材料互相引用"];
    const selectedUnit = state.selectedUnit === "不存在明确责任单位" ? "多部门材料互相引用" : state.selectedUnit;
    const submittedEvidence = reviewSubmittedEvidence();
    const submittedHas = (id) => submittedEvidence.includes(id);
    const allEvidenceIds = state.evidence.filter((id) => EVIDENCE[id]);
    const reviewChecks = [
      {
        title: "节点顺序",
        desc: "核对节点时间。",
        ok: submittedHas("e01"),
        missing: "未通过"
      },
      {
        title: "材料来源",
        desc: "核对责任材料引用。",
        ok: submittedHas("e07"),
        missing: "未通过"
      },
      {
        title: "端口文案",
        desc: "核对各端确认口径。",
        ok: submittedHas("e12") && submittedHas("e13"),
        missing: "未通过"
      },
      {
        title: "利益结果",
        desc: "核对学籍状态与候选资格。",
        ok: submittedHas("e21"),
        missing: "可选附件"
      }
    ];
    const requiredReadyCount = reviewChecks.slice(0, 3).filter((item) => item.ok).length;
    const supportEvidence = reviewSupportEvidence(submittedEvidence);
    const portalSupport = ["e15", "e16", "e18", "e19"].filter(submittedHas);
    const portalLine = portalSupport.length ? `门户补充材料显示：${portalSupport.map((id) => EVIDENCE[id][1]).join("；")}。` : "";
    const evidenceProfile = getEvidenceProfile(submittedEvidence);
    const collectedProfile = getEvidenceProfile();
    const flowReady = isFlowReviewReady(submittedEvidence);
    const lowRiskReady = isLowRiskReviewRoute(submittedEvidence);
    const trueReady = isTrueEndingReady();
    const selectedSensitiveCount = submittedEvidence.filter((id) => rules.isSensitiveEvidence(id)).length;
    const excludedSensitive = allEvidenceIds.filter((id) => rules.isSensitiveEvidence(id) && !submittedEvidence.includes(id));
    const selectionLabel = state.reviewSelectionMode === "flow"
      ? "只提交流程有效性材料"
      : state.reviewSelectionMode === "all"
        ? "全部提交"
        : "手动选择";
    const reviewStatement = requiredReadyCount === 3
      ? `审核早于本人申请；多部门记录来自同一内网地点；家长端与教务归档口径不一致，申诉被写入关注标签。${portalLine}${submittedHas("e21") ? "候选名单缓存显示，离校过渡状态触发资格移除。" : ""}据此，现有记录不足以证明本人作出完整、独立的离校确认。`
      : "复核陈述未生成。";
    return h`
      ${header("学籍异动终审复核", "先选复核口径，再确认本次提交附件。")}
      <div class="panel-body">
        ${!state.studentStatusRestored ? `<div class="notice">建议先只提交流程有效性材料，把 B4、论坛、邮箱、采购、推免线索留到在籍权限恢复后再补。${submittedHas("e01") ? "" : " 仍缺节点顺序：请回到教务首页，核对流程办理时间。"}</div>` : ""}
        ${state.studentStatusRestored ? `<div class="notice">学籍状态已恢复为在籍。现在可以提交复学后补充调查材料，不必再次证明自己没有自愿离校。</div>
        <div class="restored-review-todo">
          <strong>复学后待核验</strong>
          <span>${has("e04") ? "已核验课程反馈来源" : "材料归档 / 心理转介单：核验课程反馈来源，解锁心理中心"}</span>
          <span>${has("e17") ? "已记录 B4 附件目录" : "图书馆：记录 B4 附件目录"}</span>
          <span>${has("e20") ? "已查看会议纪要 OCR" : "信息公开：查看周启明会议纪要完整 OCR"}</span>
          <span>${has("e21") ? "已核验推免候选缓存" : "信息公开：核验推免候选缓存"}</span>
        </div>` : lowRiskReady ? `<div class="notice">本次附件只指向退学流程本身，复核通过后将进入多部门回转。</div>` : flowReady ? `<div class="notice danger">流程矛盾已经接近完整，但本次附件夹带 B4、顾天泽或舆情缓存，可能被并入舆情处置。</div>` : ""}
        <div class="card">
          <div class="card-head">本次复核策略 <span class="tag ${evidenceProfile.riskLabel === "较低" ? "ok" : evidenceProfile.riskLabel === "中" ? "warn" : "danger"}">提交风险${evidenceProfile.riskLabel}</span></div>
          <div class="card-body">
            <div class="review-decision">
              <div class="review-decision-head">
                <div>
                  <strong>${lowRiskReady ? "当前适合走低风险回转" : flowReady ? "当前附件会抬高处置等级" : "先补齐流程矛盾"}</strong>
                  <p>已选 ${submittedEvidence.length}/${allEvidenceIds.length} 份附件，其中敏感附件 ${selectedSensitiveCount} 份。</p>
                </div>
                <span class="tag ${lowRiskReady ? "ok" : flowReady ? "danger" : "warn"}">${lowRiskReady ? "可提交" : flowReady ? "需取舍" : "未完整"}</span>
              </div>
              <div class="chips">${units.map((unit) => `<button class="chip ${selectedUnit === unit ? "selected" : ""}" data-unit="${unit}">${unit}</button>`).join("")}</div>
              <div class="actions">
                <button class="${state.reviewSelectionMode === "all" ? "selected-action" : ""}" data-action="select-all-review-evidence" aria-label="全部提交">全部提交</button>
                <button class="primary ${state.reviewSelectionMode === "flow" ? "selected-action" : ""}" data-action="select-flow-review-evidence" aria-label="只提交流程有效性材料">只提交流程有效性材料</button>
              </div>
              <div class="review-submit-summary ${selectedSensitiveCount ? "danger" : "ok"}">
                <strong>当前范围：${selectionLabel}</strong>
                <span>本次将提交 ${submittedEvidence.length} 条；敏感附件 ${selectedSensitiveCount} 条；已排除敏感附件 ${excludedSensitive.length} 条。</span>
                ${excludedSensitive.length ? `<p>已排除：${excludedSensitive.map((id) => `${EVIDENCE[id][0]} ${EVIDENCE[id][1]}`).join("；")}</p>` : selectedSensitiveCount ? `<p>将带入 B4、舆情或公开链条材料，可能进入高风险处置。</p>` : `<p>当前附件只保留流程有效性材料。</p>`}
              </div>
              <div class="review-checklist">
                <div class="review-check ${evidenceProfile.withdrawalReady ? "complete" : ""}">
                  <strong>退学流程矛盾</strong>
                  <p>本人确认、家长确认和部门审核之间的事实冲突。</p>
                  <span>${evidenceProfile.withdrawalCount}/${WITHDRAWAL_INVALID_EVIDENCE.length}</span>
                </div>
                <div class="review-check ${lowRiskReady ? "complete" : ""}">
                  <strong>低风险回转</strong>
                  <p>暂不带入 B4 与舆情附件，先保住在籍权限。</p>
                  <span>${lowRiskReady ? "可进入" : "未满足"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <details class="review-details" ${submittedHas("e01") ? "" : "open"}>
          <summary>手动调整本次附件 <span>${submittedEvidence.length}/${allEvidenceIds.length}</span></summary>
          <div class="review-details-body">
            <p class="muted">默认会提交全部本地附件；也可以只保留流程矛盾相关附件。</p>
            <div class="actions">
              <button class="${state.reviewSelectionMode === "all" ? "selected-action" : ""}" data-action="detail-select-all-review-evidence" aria-label="全部提交（手动附件区）">全部提交</button>
              <button class="primary ${state.reviewSelectionMode === "flow" ? "selected-action" : ""}" data-action="detail-select-flow-review-evidence" aria-label="只提交流程有效性材料（手动附件区）">只提交流程有效性材料</button>
            </div>
            ${allEvidenceIds.length ? `<div class="review-evidence-picker">
              ${allEvidenceIds.map((id) => {
                const sensitive = rules.isSensitiveEvidence(id);
                return `<button class="review-evidence-chip ${submittedEvidence.includes(id) ? "selected" : ""} ${sensitive ? "sensitive" : ""}" data-pick-evidence="${id}">
                  <strong>${EVIDENCE[id][0]}</strong>
                  <span>${EVIDENCE[id][1]}</span>
                </button>`;
              }).join("")}
            </div>` : `<p class="muted">暂无可提交材料。</p>`}
          </div>
        </details>
        <details class="review-details" ${requiredReadyCount < 3 ? "open" : ""}>
          <summary>校验要点与带入附件 <span>${requiredReadyCount}/3${supportEvidence.length ? ` · 附件 ${supportEvidence.length}` : ""}</span></summary>
          <div class="review-details-body">
            <div class="review-checklist">
              ${reviewChecks.map((item) => `
                <div class="review-check ${item.ok ? "complete" : ""}">
                  <strong>${item.title}</strong>
                  <p>${item.desc}</p>
                  <span>${item.ok ? "已通过本地材料校验" : item.title === "节点顺序" ? "请核对流程节点时间线" : item.missing}</span>
                </div>`).join("")}
            </div>
            <div style="margin-top:12px">
            ${supportEvidence.length ? `<div class="support-evidence-list">
              ${supportEvidence.map((id) => `<span>${EVIDENCE[id][0]} · ${EVIDENCE[id][1]}</span>`).join("")}
            </div>` : `<p class="muted">暂无额外附件带入复核。</p>`}
            </div>
          </div>
        </details>
        <div class="card" style="margin-top:12px">
          <div class="card-head">复核陈述</div>
          <div class="card-body">
            <textarea rows="4" readonly>${reviewStatement}</textarea>
            <div class="draft-box">
              <label>补充说明</label>
              <textarea id="review-draft" rows="3" placeholder="可选填写">${escapeHtml(state.reviewDraft)}</textarea>
              ${state.reviewDraftRewritten ? `<div class="rewrite-mark">已按规范表述调整</div>` : ""}
            </div>
            <div class="actions">
              <button class="primary" data-action="submit-review">${lowRiskReady ? "只提交流程有效性复核" : "提交已选复核材料"}</button>
              <button data-action="audit-archive" ${collectedProfile.b4Ready && (has("e09") || has("e11")) ? "" : "disabled"}>提交 B4 与利益链补正</button>
              ${state.studentStatusRestored ? `<button class="primary" data-action="submit-true-ending" ${trueReady ? "" : "disabled"}>复学后补充调查材料</button>` : ""}
            </div>
            ${state.studentStatusRestored && !trueReady ? `<p class="muted">真结局材料还不完整：需要恢复身份后的证据 20，并补齐 B4、顾天泽、孟清与利益链关键材料。</p>` : ""}
            ${state.reviewError ? `<div class="review-error">${state.reviewError}</div>` : ""}
          </div>
        </div>
      </div>`;
  }

  root.VoluntaryLeaveReviewView = {
    renderReview,
    renderReviewRoute
  };
})(typeof window !== "undefined" ? window : globalThis);
