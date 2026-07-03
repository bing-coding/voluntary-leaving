(function (root) {
  const constants = root.VoluntaryLeaveConstants || (typeof require === "function" ? require("./constants.js") : {});

  function countEvidence(ids, sourceIds = []) {
    return ids.filter((id) => sourceIds.includes(id)).length;
  }

  function getEvidenceProfile(sourceIds = []) {
    const sourceHas = (id) => sourceIds.includes(id);
    const withdrawalCount = countEvidence(constants.WITHDRAWAL_INVALID_EVIDENCE, sourceIds);
    const b4Count = countEvidence(constants.B4_INTEREST_EVIDENCE, sourceIds);
    const flowInvalidCount = countEvidence(constants.FLOW_INVALID_EVIDENCE, sourceIds);
    const publicExposureCount = countEvidence(constants.PUBLIC_EXPOSURE_EVIDENCE, sourceIds);
    const highRiskCount = countEvidence(constants.HIGH_RISK_B4_EVIDENCE, sourceIds);
    const coreReady = ["e01", "e07", "e12", "e13"].every(sourceHas);
    const withdrawalReady = coreReady && withdrawalCount >= 7 && flowInvalidCount >= 7;
    const b4Ready = b4Count >= 4 || ["e08", "e09", "e10", "e11"].every(sourceHas);
    const publicReady = ["e08", "e09", "e10", "e11"].every(sourceHas);
    const lowRisk = withdrawalReady
      && b4Count === 0
      && publicExposureCount === 0
      && highRiskCount === 0;
    const riskScore = b4Count + publicExposureCount * 2 + highRiskCount * 2;
    let riskLabel = "较低";
    if (riskScore >= 7) riskLabel = "高";
    else if (riskScore >= 3) riskLabel = "中";
    return {
      withdrawalCount,
      b4Count,
      flowInvalidCount,
      publicExposureCount,
      highRiskCount,
      coreReady,
      withdrawalReady,
      b4Ready,
      publicReady,
      lowRisk,
      riskScore,
      riskLabel
    };
  }

  function isFlowReviewReady(sourceIds = []) {
    const profile = getEvidenceProfile(sourceIds);
    return profile.withdrawalReady && countEvidence(constants.FLOW_INVALID_EVIDENCE, sourceIds) >= 7;
  }

  function isLowRiskReviewRoute(sourceIds = []) {
    return getEvidenceProfile(sourceIds).lowRisk;
  }

  function isTrueEndingReady(state, sourceIds = state?.evidence || []) {
    return Boolean(state?.studentStatusRestored)
      && sourceIds.includes("e20")
      && countEvidence(constants.TRUE_ENDING_EVIDENCE, sourceIds) >= 6;
  }

  function reviewSupportEvidence(sourceIds = []) {
    return constants.REVIEW_SUPPORT_EVIDENCE.filter((id) => sourceIds.includes(id));
  }

  function reviewSubmittedEvidence(state, evidenceMap) {
    const evidence = Array.isArray(state?.evidence) ? state.evidence : [];
    const selectedEvidence = Array.isArray(state?.selectedEvidence) ? state.selectedEvidence : [];
    const available = evidence.filter((id) => evidenceMap[id]);
    const selected = selectedEvidence.filter((id) => available.includes(id));
    if (state?.reviewSelectionMode === "flow") return flowReviewEvidence(state).filter((id) => evidenceMap[id]);
    if (state?.reviewSelectionMode === "all") return available;
    const currentFlowEvidence = flowReviewEvidence(state).filter((id) => evidenceMap[id]);
    const selectedLooksLikeFlowRoute = !state?.reviewSelectionMode
      && selected.length > 0
      && selected.every((id) => currentFlowEvidence.includes(id))
      && currentFlowEvidence.length > selected.length;
    if (selectedLooksLikeFlowRoute) return currentFlowEvidence;
    return selected.length ? selected : available;
  }

  function flowReviewEvidence(state) {
    const evidence = Array.isArray(state?.evidence) ? state.evidence : [];
    return evidence.filter((id) => constants.WITHDRAWAL_INVALID_EVIDENCE.includes(id) && !constants.B4_INTEREST_EVIDENCE.includes(id));
  }

  function isSensitiveEvidence(id) {
    return constants.B4_INTEREST_EVIDENCE.includes(id)
      || constants.PUBLIC_EXPOSURE_EVIDENCE.includes(id)
      || constants.HIGH_RISK_B4_EVIDENCE.includes(id);
  }

  const rules = {
    countEvidence,
    getEvidenceProfile,
    isFlowReviewReady,
    isLowRiskReviewRoute,
    isTrueEndingReady,
    reviewSupportEvidence,
    reviewSubmittedEvidence,
    flowReviewEvidence,
    isSensitiveEvidence
  };

  root.VoluntaryLeaveRules = rules;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = rules;
  }
})(typeof window !== "undefined" ? window : globalThis);
