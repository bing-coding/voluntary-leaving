(function (root) {
  const STORAGE_KEY = "voluntary-leave-state";
  const GUIDE_STORAGE_KEY = "voluntary-leave-guide-seen";
  const INTRO_VERSION = 2;

  const TRANSIENT_STATE = {
    toasts: [],
    noticeModal: "",
    affairsModal: "",
    talkSourceModal: false,
    workOrderFlowModal: false,
    publicChainModal: false,
    guTimelineModal: false,
    libraryEgg: "",
    forumThread: "",
    forumPmPopup: false,
    appealHorrorPopup: false,
    loginError: "",
    portalResults: [],
    pdfMetaVisible: false,
    pdfAuthorMarked: false,
    accountGlitch: false,
    identityGlitch: false,
    accessDeniedGlitch: false,
    copiedClueTerm: "",
    portalAutocompleteActive: false,
    portalAutocompletePreview: "",
    portalAutocompleteHint: ""
  };

  const NON_PERSISTENT_KEYS = [
    ...Object.keys(TRANSIENT_STATE),
    "recentEvidenceId",
    "interactionLockedUntil",
    "mobileNavOpen",
    "mobileEvidenceOpen",
    "restoreNoticePopup",
    "voluntaryConfirmOpen"
  ];

  function createInitialState() {
    return {
      loggedIn: false,
      screen: "academic",
      time: 360,
      progress: 87,
      evidence: [],
      unlocked: ["academic"],
      guideSeen: false,
      introSeen: false,
      introVersion: INTRO_VERSION,
      inspectedFields: [],
      toasts: [],
      materialTab: "application",
      selectedUnit: "多部门材料互相引用",
      selectedEvidence: [],
      statementChips: [],
      ending: "",
      preEndingState: null,
      messageLog: [],
      noticeModal: "",
      affairsModal: "",
      talkSourceModal: false,
      workOrderFlowModal: false,
      flowPreviewVisible: false,
      publicChainModal: false,
      guTimelineModal: false,
      libraryEgg: "",
      forumThread: "",
      forumPmUnlocked: false,
      forumPmPopup: false,
      appealHorrorPopup: false,
      appealHorrorSeen: false,
      loginError: "",
      portalQuery: "",
      portalResults: [],
      pdfMetaVisible: false,
      pdfAuthorMarked: false,
      riskLogs: [],
      riskLogExpanded: false,
      appealCount: 0,
      accountGlitch: false,
      identityGlitch: false,
      accessDeniedGlitch: false,
      guTimelineVisible: false,
      publicChainVisible: false,
      publicChainFields: [],
      archiveFields: [],
      reviewDraft: "",
      reviewDraftRewritten: false,
      reviewError: "",
      reviewSelectionMode: "flow",
      copiedClueTerm: "",
      recentEvidenceId: "",
      interactionLockedUntil: 0,
      studentStatusRestored: false,
      permissionLevel: "leaving",
      reviewRouteStep: 0,
      hiddenEvidence20Unlocked: false,
      trueEndingReady: false,
      sensitiveSearchCount: 0,
      portalAutocompleteSeen: [],
      portalAutocompleteActive: false,
      portalAutocompletePreview: "",
      portalAutocompleteHint: "",
      mobileNavOpen: false,
      mobileEvidenceOpen: false,
      restoreNoticePopup: false,
      voluntaryConfirmOpen: false,
      withdrawAttempts: 0
    };
  }

  function stateStorageFrom(options = {}) {
    return options.storage || root.sessionStorage || root.localStorage;
  }

  function guideStorageFrom(options = {}) {
    return options.guideStorage || options.storage || root.localStorage || root.sessionStorage;
  }

  function clearLegacyLocalState(activeStorage) {
    try {
      if (root.localStorage && root.localStorage !== activeStorage) {
        root.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_err) {
      // Ignore private-mode or blocked storage failures.
    }
  }

  function loadState(options = {}) {
    const evidenceMap = options.evidenceMap || {};
    const storage = stateStorageFrom(options);
    const guideStorage = guideStorageFrom(options);
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      const guideSeen = guideStorage.getItem(GUIDE_STORAGE_KEY) === "1" || parsed.guideSeen === true;
      const loaded = { ...createInitialState(), ...parsed, ...TRANSIENT_STATE };
      loaded.guideSeen = guideSeen;
      if (parsed.introVersion !== INTRO_VERSION) {
        loaded.introSeen = false;
        loaded.introVersion = INTRO_VERSION;
      }
      loaded.evidence = Array.isArray(loaded.evidence) ? loaded.evidence.filter((id) => evidenceMap[id]) : [];
      loaded.messageLog = Array.isArray(loaded.messageLog) ? loaded.messageLog.slice(-8) : [];
      if (!loaded.selectedUnit) loaded.selectedUnit = "多部门材料互相引用";
      if (!loaded.reviewSelectionMode) loaded.reviewSelectionMode = "flow";
      if (!evidenceMap[loaded.recentEvidenceId]) loaded.recentEvidenceId = "";
      clearLegacyLocalState(storage);
      return loaded;
    } catch (_err) {
      return createInitialState();
    }
  }

  function persistentSnapshot(state) {
    return Object.fromEntries(Object.entries(state).filter(([key]) => !NON_PERSISTENT_KEYS.includes(key)));
  }

  function saveState(state, options = {}) {
    const storage = stateStorageFrom(options);
    const guideStorage = guideStorageFrom(options);
    if (state.guideSeen) guideStorage.setItem(GUIDE_STORAGE_KEY, "1");
    storage.setItem(STORAGE_KEY, JSON.stringify(persistentSnapshot(state)));
    clearLegacyLocalState(storage);
  }

  function resetStoredState(options = {}) {
    const storage = stateStorageFrom(options);
    const guideStorage = guideStorageFrom(options);
    const guideSeen = guideStorage.getItem(GUIDE_STORAGE_KEY) === "1";
    storage.removeItem(STORAGE_KEY);
    clearLegacyLocalState(storage);
    return { ...createInitialState(), guideSeen };
  }

  const stateApi = {
    STORAGE_KEY,
    GUIDE_STORAGE_KEY,
    INTRO_VERSION,
    createInitialState,
    loadState,
    saveState,
    resetStoredState,
    persistentSnapshot
  };

  root.VoluntaryLeaveState = stateApi;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = stateApi;
  }
})(typeof window !== "undefined" ? window : globalThis);
