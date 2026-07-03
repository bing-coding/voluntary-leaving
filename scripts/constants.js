(function (root) {
  const REVIEW_SUPPORT_EVIDENCE = ["e02", "e03", "e04", "e05", "e06", "e14", "e15", "e16", "e18", "e19", "e21"];
  const FLOW_INVALID_EVIDENCE = ["e01", "e02", "e03", "e04", "e05", "e07", "e12", "e13", "e14", "e16"];
  const FLOW_CORE_EVIDENCE = ["e01", "e02", "e03", "e07", "e12", "e13", "e14"];
  const HIGH_RISK_B4_EVIDENCE = ["e08", "e09", "e11", "e18", "e19", "e21"];
  const WITHDRAWAL_INVALID_EVIDENCE = ["e01", "e02", "e03", "e04", "e05", "e06", "e07", "e12", "e13", "e14", "e16"];
  const B4_INTEREST_EVIDENCE = ["e08", "e09", "e10", "e11", "e15", "e17", "e18", "e19", "e20", "e21"];
  const PUBLIC_EXPOSURE_EVIDENCE = ["e08", "e09", "e10", "e11"];
  const TRUE_ENDING_EVIDENCE = ["e08", "e09", "e10", "e11", "e17", "e19", "e20", "e21"];

  const REVIEW_ROUTE = [
    ["学院学生工作办公室", "确认谈话摘要存在来源争议。", 74],
    ["教务处", "确认申请创建时间与本人提交时间不一致。", 61],
    ["心理中心", "确认风险材料来源不是独立评估。", 49],
    ["家长端", "确认家长端文案与教务归档不一致。", 33],
    ["学工部", "确认多部门材料互相引用。", 18],
    ["学院学生工作办公室", "退回终审，允许学生端撤销。", 0]
  ];

  const PORTAL_SCREENS = ["academic", "affairs", "work", "life", "public"];
  const TOP_CHANNELS = [
    ["academic", "教务管理"],
    ["affairs", "学生事务"],
    ["work", "学工服务"],
    ["life", "校园生活"],
    ["public", "信息公开"]
  ];

  const constants = {
    RISK_LOG_LIMIT: 24,
    REVIEW_SUPPORT_EVIDENCE,
    FLOW_INVALID_EVIDENCE,
    FLOW_CORE_EVIDENCE,
    HIGH_RISK_B4_EVIDENCE,
    WITHDRAWAL_INVALID_EVIDENCE,
    B4_INTEREST_EVIDENCE,
    PUBLIC_EXPOSURE_EVIDENCE,
    TRUE_ENDING_EVIDENCE,
    REVIEW_ROUTE,
    PORTAL_SCREENS,
    TOP_CHANNELS
  };

  root.VoluntaryLeaveConstants = constants;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = constants;
  }
})(typeof window !== "undefined" ? window : globalThis);
