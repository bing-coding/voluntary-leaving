// This file is loaded only by the isolated editorial preview document.
window.__VOLUNTARY_LEAVE_PREVIEW__ = true;
(function () {
  const pending = new Set();
  const schedule = window.setTimeout.bind(window);
  const cancel = window.clearTimeout.bind(window);
  window.setTimeout = function (fn, delay, ...args) {
    const id = schedule(() => { pending.delete(id); if (typeof fn === "function") fn(...args); }, delay);
    pending.add(id);
    return id;
  };
  window.clearTimeout = function (id) { pending.delete(id); cancel(id); };
  window.VoluntaryLeavePreviewTimers = {
    clear() { pending.forEach(cancel); pending.clear(); }
  };
})();
