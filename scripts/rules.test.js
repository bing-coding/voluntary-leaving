const assert = require("node:assert/strict");
const constants = require("./constants.js");
const rules = require("./rules.js");

const flowIds = ["e01", "e02", "e03", "e05", "e06", "e07", "e12", "e13", "e14", "e16"];
const sensitiveIds = ["e08", "e09", "e10", "e11", "e19", "e21"];
const allIds = [...flowIds, ...sensitiveIds, "e20"];
const evidenceMap = Object.fromEntries(allIds.map((id) => [id, true]));

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("flow-only submission is low risk and ready for review", () => {
  assert.equal(rules.isFlowReviewReady(flowIds), true);
  assert.equal(rules.isLowRiskReviewRoute(flowIds), true);
});

test("adding B4 evidence raises submission risk", () => {
  const submitted = [...flowIds, "e08"];
  const profile = rules.getEvidenceProfile(submitted);
  assert.equal(profile.withdrawalReady, true);
  assert.equal(profile.lowRisk, false);
  assert.notEqual(profile.riskLabel, "较低");
});

test("collected sensitive evidence does not affect low-risk route when not submitted", () => {
  const state = {
    evidence: [...flowIds, "e08", "e09", "e10", "e11", "e19"],
    selectedEvidence: flowIds
  };
  const submitted = rules.reviewSubmittedEvidence(state, evidenceMap);
  assert.deepEqual(submitted, flowIds);
  assert.equal(rules.isLowRiskReviewRoute(submitted), true);
});

test("missing shared-IP evidence keeps flow source incomplete", () => {
  const withoutSharedIp = flowIds.filter((id) => id !== "e07");
  assert.equal(rules.isFlowReviewReady(withoutSharedIp), false);
  assert.equal(rules.getEvidenceProfile(withoutSharedIp).coreReady, false);
});

test("support evidence includes recommendation cache when submitted", () => {
  const support = rules.reviewSupportEvidence([...flowIds, "e21"]);
  assert.equal(support.includes("e21"), true);
});

test("true ending needs restored status, e20, and key B4 or interest-chain evidence", () => {
  assert.equal(rules.isTrueEndingReady({ studentStatusRestored: false, evidence: allIds }, allIds), false);
  assert.equal(rules.isTrueEndingReady({ studentStatusRestored: true, evidence: flowIds }, flowIds), false);
  assert.equal(rules.isTrueEndingReady({ studentStatusRestored: true, evidence: allIds }, allIds), true);
});

test("flow review evidence strips sensitive materials from collected evidence", () => {
  const state = { evidence: [...flowIds, ...constants.TRUE_ENDING_EVIDENCE] };
  const submitted = rules.flowReviewEvidence(state);
  assert.deepEqual(submitted, flowIds);
});
