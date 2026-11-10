(function () {
  "use strict";

  const app = document.getElementById("app");
  const bridge = window.VoluntaryLeavePreview;
  const patches = window.VoluntaryLeaveCopyPatches;
  if (!app || !bridge || !patches) {
    console.error("文案预览未能启动：缺少游戏渲染入口或文案数据模块。");
    return;
  }

  const SKIP_TEXT = "script,style,noscript,svg,canvas,textarea,input,select,option,[data-copy-ignore]";
  const ATTRIBUTE_LABELS = {
    placeholder: "输入提示",
    title: "悬停提示",
    "aria-label": "无障碍名称",
    "data-autocomplete-hint": "搜索框异常提示",
    alt: "图片说明",
    value: "表单显示文字"
  };
  const RECORD_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt", "data-autocomplete-hint"];
  const bindings = new Map();
  let records = [];
  let currentScene = { id: "initial", title: "初始页面" };
  let edits = new Map();
  let mode = "edit";
  let selectedId = "";
  let hoveredId = "";
  let collectedRoot = null;
  let detailStates = new Map();
  let raf = 0;

  const selectionOutline = makeOutline("copy-preview-selection");
  const hoverOutline = makeOutline("copy-preview-hover");

  function host() {
    try {
      return window.parent !== window ? window.parent.VoluntaryLeaveEditorHost : null;
    } catch (_error) {
      return null;
    }
  }

  function notify(name, value) {
    const receiver = host();
    if (receiver && typeof receiver[name] === "function") receiver[name](value);
  }

  function makeOutline(className) {
    const element = document.createElement("div");
    element.className = className;
    element.setAttribute("aria-hidden", "true");
    element.hidden = true;
    document.body.appendChild(element);
    return element;
  }

  function escapeIdentifier(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
  }

  // Capture the structural locator before inserting any editor decorations.
  // Each text node retains its own slot, even when the same words occur twice.
  function selectorFor(element) {
    if (element === app) return "#app";
    const path = [];
    let cursor = element;
    while (cursor && cursor !== app && cursor.nodeType === Node.ELEMENT_NODE) {
      if (cursor.id && document.querySelectorAll(`#${escapeIdentifier(cursor.id)}`).length === 1) {
        path.unshift(`#${escapeIdentifier(cursor.id)}`);
        return path.join(" > ");
      }
      const tag = cursor.tagName.toLowerCase();
      const siblings = cursor.parentElement
        ? Array.from(cursor.parentElement.children).filter((sibling) => sibling.tagName === cursor.tagName)
        : [cursor];
      path.unshift(`${tag}:nth-of-type(${siblings.indexOf(cursor) + 1})`);
      cursor = cursor.parentElement;
    }
    path.unshift("#app");
    return path.join(" > ");
  }

  function makeRecord(kind, original, locator, label, extra = {}) {
    const id = patches.stableId(JSON.stringify([currentScene.id, kind, locator.selector,
      locator.textIndex ?? null, locator.attribute || "", original]));
    return {
      id,
      kind,
      original,
      replacement: original,
      locator: { sceneId: currentScene.id, ...locator },
      scenes: [currentScene.id],
      label,
      ...extra
    };
  }

  function isVisible(binding) {
    const element = binding.element;
    if (!element || !element.isConnected || element.closest("[hidden]")) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  }

  function collect() {
    // setEdits does not re-collect. A second notification for the same render
    // must also preserve the unedited baseline already held in bindings.
    if (collectedRoot === app.firstChild && bindings.size) {
      applyEdits();
      return;
    }
    collectedRoot = app.firstChild;
    bindings.clear();
    records = [];
    detailStates = new Map(Array.from(app.querySelectorAll("details"), (element) => [element, element.open]));
    if (mode === "edit") for (const element of detailStates.keys()) element.open = true;
    const textCandidates = [];
    const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim() || !node.parentElement || node.parentElement.closest(SKIP_TEXT)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      const raw = node.nodeValue;
      textCandidates.push({
        node,
        selector: selectorFor(parent),
        textIndex: Array.from(parent.childNodes).indexOf(node),
        original: raw.trim(),
        prefix: raw.match(/^\s*/)[0],
        suffix: raw.match(/\s*$/)[0]
      });
    }

    // Attribute locators are also collected before wrappers can affect paths.
    const attributeCandidates = [];
    const imageCandidates = [];
    for (const element of app.querySelectorAll("*")) {
      if (element.closest("script,style,svg,[data-copy-ignore]")) continue;
      const selector = selectorFor(element);
      for (const attribute of RECORD_ATTRIBUTES) {
        const original = element.getAttribute(attribute);
        if (original && original.trim()) attributeCandidates.push({ element, selector, attribute, original });
      }
      if (element.matches("textarea, input:not([type=password])")) {
        // Use rendered markup, never a value that the reviewer typed while
        // exploring. This also covers disabled student IDs and search cues.
        const original = element.tagName === "TEXTAREA" ? element.textContent : element.getAttribute("value");
        if (original && original.trim()) attributeCandidates.push({ element, selector, attribute: "value", original });
      }
      if (element.tagName === "IMG") {
        imageCandidates.push({ element, selector, src: element.getAttribute("src") || "", assetUrl: element.src });
      }
    }

    for (const candidate of textCandidates) {
      const record = makeRecord("text", candidate.original,
        { selector: candidate.selector, textIndex: candidate.textIndex }, "页面文字");
      // A custom inline element avoids matching game-specific `span` styles.
      const wrapper = document.createElement("copy-text");
      wrapper.setAttribute("data-copy-id", record.id);
      candidate.node.replaceWith(wrapper);
      wrapper.appendChild(candidate.node);
      bindings.set(record.id, {
        record,
        element: wrapper,
        node: candidate.node,
        prefix: candidate.prefix,
        suffix: candidate.suffix
      });
      records.push(record);
    }

    for (const candidate of attributeCandidates) {
      const record = makeRecord("attribute", candidate.original,
        { selector: candidate.selector, attribute: candidate.attribute }, ATTRIBUTE_LABELS[candidate.attribute]);
      const binding = { record, element: candidate.element, attribute: candidate.attribute };
      bindings.set(record.id, binding);
      records.push(record);
      const existing = candidate.element.getAttribute("data-copy-attribute-ids");
      candidate.element.setAttribute("data-copy-attribute-ids", [existing, record.id].filter(Boolean).join(" "));
    }

    for (const candidate of imageCandidates) {
      const original = candidate.element.getAttribute("alt") || candidate.src;
      const record = makeRecord("image-note", original,
        { selector: candidate.selector, attribute: "src" }, "图片文字批注", {
          assetPath: candidate.src,
          assetUrl: candidate.assetUrl
        });
      bindings.set(record.id, { record, element: candidate.element });
      candidate.element.setAttribute("data-copy-image-id", record.id);
      records.push(record);
    }

    for (const record of records) record.visible = isVisible(bindings.get(record.id));
    if (selectedId && !bindings.has(selectedId)) {
      selectedId = "";
      notify("onSelect", null);
    }
    applyEdits();
    notify("onRecords", getRecords());
  }

  function applyEdits() {
    for (const [id, binding] of bindings) {
      const entry = edits.get(id);
      const original = binding.record.original;
      // A mismatched old record is never silently applied to changed copy.
      const usable = entry && entry.original === original && entry.kind === binding.record.kind;
      const replacement = usable && typeof entry.replacement === "string" ? entry.replacement : original;
      if (binding.record.kind === "text") {
        binding.node.nodeValue = binding.prefix + replacement + binding.suffix;
      } else if (binding.record.kind === "attribute") {
        if (binding.attribute === "value") binding.element.value = replacement;
        else binding.element.setAttribute(binding.attribute, replacement);
      }
      binding.element.classList.toggle("copy-preview-changed", Boolean(usable &&
        (binding.record.kind === "image-note" ? entry.note : replacement !== original)));
    }
    scheduleOutlines();
  }

  function getRecords() {
    return records.map((record) => ({ ...record, visible: isVisible(bindings.get(record.id)),
      locator: { ...record.locator }, scenes: [...record.scenes] }));
  }

  function setEdits(entries) {
    edits = new Map((Array.isArray(entries) ? entries : [])
      .filter((entry) => entry && typeof entry.id === "string")
      .map((entry) => [entry.id, entry]));
    applyEdits();
  }

  function recordAtTarget(target) {
    const element = target instanceof Element ? target : target && target.parentElement;
    if (!element || !app.contains(element)) return null;
    const text = element.closest("[data-copy-id]");
    if (text) return bindings.get(text.getAttribute("data-copy-id"))?.record || null;
    const image = element.closest("[data-copy-image-id]");
    if (image) return bindings.get(image.getAttribute("data-copy-image-id"))?.record || null;
    const control = element.closest("[data-copy-attribute-ids]");
    if (control) {
      const ids = control.getAttribute("data-copy-attribute-ids").split(" ");
      const candidates = ids.map((id) => bindings.get(id)?.record).filter(Boolean);
      return candidates.find((record) => record.locator.attribute === "value")
        || candidates.find((record) => record.locator.attribute === "placeholder")
        || candidates[0] || null;
    }
    return null;
  }

  function select(id, options = {}) {
    if (!bindings.has(id)) {
      selectedId = "";
      scheduleOutlines();
      return false;
    }
    selectedId = id;
    const binding = bindings.get(id);
    if (options.scroll !== false && isVisible(binding)) {
      binding.element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
    scheduleOutlines();
    if (options.notify !== false) notify("onSelect", { ...binding.record, locator: { ...binding.record.locator } });
    return true;
  }

  function paintOutline(outline, id) {
    const binding = bindings.get(id);
    if (mode !== "edit" || !binding || !isVisible(binding)) {
      outline.hidden = true;
      return;
    }
    const rect = binding.element.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      outline.hidden = true;
      return;
    }
    outline.hidden = false;
    outline.style.left = `${rect.left - 2}px`;
    outline.style.top = `${rect.top - 2}px`;
    outline.style.width = `${rect.width + 4}px`;
    outline.style.height = `${rect.height + 4}px`;
  }

  function scheduleOutlines() {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      paintOutline(selectionOutline, selectedId);
      paintOutline(hoverOutline, hoveredId === selectedId ? "" : hoveredId);
    });
  }

  function setMode(next) {
    const previous = mode;
    mode = next === "browse" ? "browse" : "edit";
    if (mode === "edit" && previous !== "edit") {
      for (const element of detailStates.keys()) {
        detailStates.set(element, element.open);
        element.open = true;
      }
    } else if (mode === "browse" && previous !== "browse") {
      for (const [element, open] of detailStates) element.open = open;
    }
    document.documentElement.classList.toggle("copy-preview-edit", mode === "edit");
    document.documentElement.classList.toggle("copy-preview-browse", mode === "browse");
    hoveredId = "";
    if (mode === "edit") applyEdits();
    scheduleOutlines();
  }

  function loadScene(scene) {
    if (!scene || typeof scene.id !== "string") throw new Error("场景缺少稳定标识。");
    currentScene = scene;
    selectedId = "";
    hoveredId = "";
    bridge.loadScene(scene);
    collect();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (event) => {
    if (mode !== "edit" || !app.contains(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const record = recordAtTarget(event.target);
    if (record) select(record.id, { scroll: false });
  }, true);

  // Disabled fields suppress click events, but still expose pointer events.
  document.addEventListener("pointerdown", (event) => {
    if (mode !== "edit" || !(event.target instanceof Element) || !event.target.matches(":disabled")) return;
    const record = recordAtTarget(event.target);
    if (record) {
      event.preventDefault();
      event.stopImmediatePropagation();
      select(record.id, { scroll: false });
    }
  }, true);

  // Native form controls must not accept gameplay input while selecting copy.
  for (const eventName of ["beforeinput", "submit", "dblclick"]) {
    document.addEventListener(eventName, (event) => {
      if (mode !== "edit" || !app.contains(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }
  document.addEventListener("keydown", (event) => {
    if (mode !== "edit") return;
    if (event.key === "Escape" || (app.contains(event.target) && (event.key === "Enter" || event.key === " "))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener("mousemove", (event) => {
    if (mode !== "edit") return;
    const nextId = recordAtTarget(event.target)?.id || "";
    if (nextId === hoveredId) return;
    hoveredId = nextId;
    scheduleOutlines();
  });
  document.addEventListener("mouseleave", () => {
    hoveredId = "";
    scheduleOutlines();
  });
  window.addEventListener("scroll", scheduleOutlines, true);
  window.addEventListener("resize", scheduleOutlines);

  const previousOnRender = bridge.onRender;
  bridge.onRender = function () {
    if (typeof previousOnRender === "function") previousOnRender();
    collect();
  };
  const api = {
    loadScene,
    setEdits,
    setMode,
    getRecords,
    select,
    getState: () => bridge.getState(),
    getScene: () => ({ id: currentScene.id, title: currentScene.title })
  };
  window.VoluntaryLeaveCopyPreview = api;
  setMode("edit");
  collect();
  notify("onReady", api);
})();
