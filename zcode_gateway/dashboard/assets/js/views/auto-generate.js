import { el, fill, copyText } from "../core/dom.js";
import { toast } from "../core/toast.js";
import { api } from "../core/api.js";
import { card, button, stateBadge, badge } from "../core/ui.js";
import { platform } from "../core/caps.js";
import { t } from "../core/i18n.js";

const PATH = "/admin/dash/generator/auto";
const VPN_SOURCES = ["psiphon", "surfshark"];
const SOURCES = ["pool", "direct", "pin", ...VPN_SOURCES];
const DEFAULTS = {
  mode: "goal", target: 20, attempt_limit: 100, concurrency: 1,
  cooldown_seconds: 60, ip_source: "direct", ip_sources: [], ip_mode: "spread", ip_pick: "",
  captcha: "ai", browser_display: "background",
  timeout_seconds: 900, failure_limit: 5,
};
const TERMINAL = new Set(["idle", "completed", "stopped", "failed"]);
let nextID = 0;

const SOURCE_LABELS = { pool: t("v3.auto.source_pool"), direct: t("v3.auto.source_direct"), pin: t("v3.auto.source_pin"),
  psiphon: t("v3.auto.source_psiphon"), surfshark: t("v3.auto.source_surfshark") };
const CAPTCHA_LABELS = { auto: t("v3.auto.captcha_auto"), ai: t("v3.auto.captcha_ai"), classic: t("v3.auto.captcha_classic"), mint: t("v3.auto.captcha_mint") };
function routeLabel(config) {
  const sources = config.ip_sources?.length ? config.ip_sources
    : [["proxy", "socks"].includes(config.ip_source) ? "pool" : config.ip_source || "direct"];
  const text = sources.map((source) => SOURCE_LABELS[source] || source).join(" + ");
  if (!sources.some((source) => VPN_SOURCES.includes(source))) return text;
  return text + " · " + t(config.ip_mode === "single" ? "v3.auto.stay_one" : "v3.auto.random");
}

function planBadges(w) {
  const out = [];
  if (w.giveaway500) out.push(badge("500M claimed", "warn"));
  else if (w.giveaway500_unavailable) out.push(badge("500M unavailable", "warn"));
  if (w.global_build) out.push(badge("100M global build", "warn"));
  else if (w.start_plan) out.push(badge("Start Plan", "ok"));
  else if (w.starter === true) out.push(badge("Starter", "ok"));
  else if (w.starter === false && !w.start_plan && !w.giveaway500 && !w.global_build) out.push(badge("No plan"));
  return out;
}

function workerCard(w, onStop, onRemove, onDetail) {
  const live = w.state === "running" || w.state === "starting";
  const lines = (w.lines || []).slice(-5);
  return el("div", { class: "job" }, [
    el("div", { class: "job__head" }, [
      el("span", { class: "dot dot--" + (w.state === "running" ? "live" : "") }),
      el("b", { class: "job__name truncate", text: w.name }),
      stateBadge(w.state),
      w.email ? el("span", { class: "mono text-xs muted truncate", text: w.email }) : null,
      w.route_label ? el("span", { class: "mono text-xs faint", text: w.route_label }) : null,
      el("span", { class: "faint text-xs", text: t("v3.generator.captcha") + ": " + (CAPTCHA_LABELS[w.captcha] || "—") }),
      ...planBadges(w),
      w.has_log && platform() === "windows"
        ? button({ label: t("v3.auto.open_log"), variant: "quiet", onClick: () => onDetail(w, "open-log") }) : null,
      w.has_log
        ? button({ label: t("v3.auto.copy_log"), variant: "quiet", onClick: () => onDetail(w, "log") }) : null,
      w.has_password
        ? button({ label: t("v3.auto.copy_password"), variant: "quiet", onClick: () => onDetail(w, "password") }) : null,
      el("span", { class: "spacer" }),
      live
        ? button({ label: t("v3.auto.kill"), variant: "danger", onClick: () => onStop(w.name) })
        : button({ icon: "eyeOff", title: t("v3.auto.remove"), variant: "quiet", onClick: () => onRemove(w.name) }),
    ]),
    lines.length
      ? el("div", { class: "job__log mono" }, lines.map((line) => el("div", { class: "logpane__line", text: line })))
      : null,
  ]);
}

export function createAutoGenerate({ signal } = {}) {
  const controller = new AbortController();
  const prefix = "auto-" + (++nextID) + "-";
  const controls = {};
  let disposed = false;
  let hydrated = false;
  let saved = false;
  let dirty = false;
  let busy = "";
  let healthy = false;
  let status = { state: "idle" };
  let runConfig = null;
  let runID = null;
  let requestVersion = 0;
  let pendingRefresh = null;
  let ipSources = [];
  let ipMode = "spread";
  let ipPick = "";
  let ipChoices = [];
  let pickChoices = [];
  let poolAvailable = 0;

  const note = el("p", { class: "auto-note", role: "status", "aria-live": "polite", text: t("auto.note.loading") });
  const error = el("p", { class: "auto-error", role: "alert", hidden: true });
  const connection = el("p", { class: "auto-error", role: "status", hidden: true });
  const state = el("span");
  const progress = el("p", { class: "auto-progress", text: t("auto.progress.loading") });
  const profile = el("p", { class: "auto-note" });
  const reason = el("p", { class: "auto-note", hidden: true });
  const counts = el("dl", { class: "auto-counts", "aria-label": t("v3.auto.session_aria") });
  const slots = el("ul", { class: "auto-slots", "aria-label": t("v3.auto.attempt_workers") });
  const logPane = el("div", { class: "logpane mono auto-log", role: "region", tabindex: 0,
    "aria-label": t("v3.auto.session_aria") });
  const follow = el("input", { type: "checkbox", checked: true });
  let lastLog = "";
  const copyLog = button({ label: t("auto.copy_log"), icon: "copy", onClick: async () => {
    const ok = await copyText(lastLog);
    toast(ok ? t("auto.copy_log.ok") : t("auto.copy_log.fail"), ok ? "ok" : "err");
  } });

  function field(key, label, input, help) {
    controls[key] = input;
    input.id = prefix + key;
    input.name = key;
    input.setAttribute("aria-describedby", prefix + key + "-help");
    return el("div", { class: "field auto-field" }, [
      el("label", { class: "field__label", htmlFor: input.id, text: label }), input,
      el("p", { class: "field__help auto-help", id: prefix + key + "-help", text: help }),
    ]);
  }
  const number = (key, min, help, label) => field(key, label, el("input", {
    class: "input", type: "number", min, step: 1, required: true, value: DEFAULTS[key],
  }), help);
  const modeField = field("mode", t("v3.auto.run_mode"), el("select", { class: "select" }, [
    el("option", { value: "goal", text: t("v3.auto.mode_goal") }),
    el("option", { value: "attempts", text: t("v3.auto.mode_attempts") }),
  ]), t("v3.auto.mode_help"));
  const targetField = number("target", 1, t("v3.auto.goal_help"), t("v3.auto.goal_label"));
  const attemptField = number("attempt_limit", 1, t("v3.auto.attempts_help"), t("v3.auto.attempts_label"));
  const concurrencyField = number("concurrency", 1, t("v3.auto.concurrency_help"), t("v3.auto.concurrency_label"));
  controls.concurrency.max = 100;
  const cooldownField = number("cooldown_seconds", 0, t("v3.auto.cooldown_help"), t("v3.auto.cooldown_label"));
  // Same source picker as Manual signup: each attempt draws its own exit.
  const ipInputs = [];
  const modeInputs = [];
  const poolLabel = el("span", { text: t("v3.auto.proxy_pool_count", { n: 0 }) });
  const chip = (value, text, detail) => {
    const input = el("input", { type: "checkbox", checked: ipSources.includes(value) });
    input.value = value;
    ipInputs.push(input);
    input.addEventListener("change", () => {
      if (!input.checked && ipSources.length === 1) {
        input.checked = true;
        toast(t("v3.auto.keep_source"), "warn");
        return;
      }
      ipSources = input.checked ? [...ipSources, value] : ipSources.filter((source) => source !== value);
      renderIpExits(true);
      edited();
    });
    return el("label", { class: "chip", title: detail }, [input, text]);
  };
  const modeOption = (value, title, detail) => {
    const input = el("input", { type: "radio", name: prefix + "ip-mode", checked: ipMode === value });
    input.value = value;
    modeInputs.push(input);
    input.addEventListener("change", () => { ipMode = value; renderIpExits(true); edited(); });
    return el("label", { class: "chip", title: detail }, [input, el("span", { text: title })]);
  };
  const ipPickSelect = el("select", { class: "select", "aria-label": t("v3.auto.exit_label") });
  ipPickSelect.addEventListener("change", () => { ipPick = ipPickSelect.value; edited(); });
  const pickSlot = el("div", { class: "ip-pick", hidden: true }, [ipPickSelect]);
  const ipHelp = el("p", { class: "field__help" });
  const modeRow = el("div", { class: "row ip-line" }, [
    el("span", { class: "field__label ip-label", text: t("v3.auto.mode_label") }),
    modeOption("spread", t("v3.auto.random"), t("v3.auto.random_help")),
    modeOption("single", t("v3.auto.stay_one"), t("v3.auto.stay_one_help")),
    pickSlot,
  ]);
  let exitSignature;
  function renderIpExits(resetPick = false) {
    const vpns = ipSources.filter((source) => VPN_SOURCES.includes(source));
    modeRow.hidden = !vpns.length;
    pickSlot.hidden = ipMode !== "single" || modeRow.hidden;
    ipHelp.textContent = modeRow.hidden
      ? t("v3.auto.sources_help") : t("v3.auto.vpn_help");
    if (pickSlot.hidden) { pickChoices = []; ipPickSelect.disabled = true; return; }
    const choices = ipChoices.filter((e) => vpns.includes(e.key.split(":")[0]));
    if (resetPick && !vpns.includes(ipPick.split(":")[0])) ipPick = choices[0]?.key || "";
    const selected = choices.some((e) => e.key === ipPick) ? ipPick : "";
    const options = selected ? choices : [{ key: "", label: choices.length
      ? t("v3.auto.exit_first") : t("v3.auto.exit_none") }, ...choices];
    const signature = JSON.stringify(options);
    if (signature !== exitSignature) {
      fill(ipPickSelect, options.map((e) => el("option", { value: e.key, text: e.label })));
      exitSignature = signature;
    }
    ipPickSelect.value = selected;
    pickChoices = choices;
    ipPickSelect.disabled = !choices.length;
  }
  const ipBlock = el("div", { class: "field ip-field" }, [
    el("div", { class: "row ip-line" }, [
      el("span", { class: "field__label ip-label", text: t("v3.auto.sources_label") }),
      chip("pool", poolLabel, t("v3.auto.source_pool_help")),
      chip("direct", t("v3.auto.source_direct"), t("v3.auto.source_direct_help")),
      chip("pin", t("v3.auto.source_pin"), t("v3.auto.source_pin_help")),
      chip("psiphon", t("v3.auto.source_psiphon"), t("v3.auto.source_psiphon_help")),
      chip("surfshark", t("v3.auto.source_surfshark"), t("v3.auto.source_surfshark_help")),
    ]),
    modeRow,
    ipHelp,
  ]);
  const displayField = field("browser_display", t("v3.auto.browser_display"), el("select", { class: "select" }, [
    el("option", { value: "background", text: t("v3.auto.browser_background") }),
    el("option", { value: "desktop", text: t("v3.auto.browser_desktop") }),
  ]), t("v3.auto.browser_help"));
  const captchaField = field("captcha", t("v3.auto.captcha_solver"), el("select", { class: "select" }, [
    el("option", { value: "auto", text: t("v3.auto.captcha_auto") }),
    el("option", { value: "ai", text: t("v3.auto.captcha_ai") }),
    el("option", { value: "classic", text: t("v3.auto.captcha_classic") }),
    el("option", { value: "mint", text: t("v3.auto.captcha_mint") }),
  ]), t("v3.auto.captcha_help"));
  const timeoutField = number("timeout_seconds", 1, "Maximum seconds for a single attempt before it is stopped.", t("v3.auto.timeout_label"));
  const failureField = number("failure_limit", 1, "Stop after this many consecutive failures. Review the reason before starting again.", t("v3.auto.failure_label"));
  for (const [key, min, max] of [["target", 1, 1000], ["attempt_limit", 1, 10000],
    ["cooldown_seconds", 0, 3600], ["timeout_seconds", 60, 3600], ["failure_limit", 1, 100]]) {
    controls[key].min = min;
    controls[key].max = max;
  }
  const saveButton = button({ label: t("v3.auto.save_config"), onClick: saveConfig });
  const startButton = button({ label: t("v3.auto.start"), variant: "primary", icon: "bolt", onClick: () => mutate("start") });
  const pauseButton = button({ label: t("v3.auto.pause"), onClick: () => mutate("pause") });
  const resumeButton = button({ label: t("v3.auto.resume"), onClick: () => mutate("resume") });
  const stopButton = button({ label: t("v3.auto.stop"), variant: "danger", onClick: () => mutate("stop") });
  const retryButton = button({ label: t("v3.auto.refresh"), onClick: refresh });
  const tuning = el("details", { class: "help-details auto-tuning" }, [
    el("summary", { text: t("v3.auto.tuning") }),
    el("div", { class: "auto-fields" }, [concurrencyField, cooldownField, displayField,
      captchaField, timeoutField, failureField]),
  ]);
  const form = el("form", { class: "auto-form", on: {
    submit: (event) => { event.preventDefault(); saveConfig(); },
    input: edited, change: edited,
  } }, [
    el("div", { class: "auto-fields" }, [modeField, targetField, attemptField]),
    ipBlock,
    tuning,
    el("div", { class: "auto-actions" }, [saveButton, startButton, note]),
  ]);
  form.addEventListener("invalid", (event) => {
    if (tuning.contains(event.target)) tuning.open = true;
  }, true);
  const logControls = el("div", { class: "auto-actions auto-log-controls", hidden: true }, [
    el("label", { class: "checkline" }, [follow, el("span", { text: t("v3.auto.follow") })]), copyLog,
  ]);
  const logEmpty = el("p", { class: "auto-note", text: t("v3.auto.no_events") });
  const clearWorkers = button({ label: t("v3.auto.clear_finished"), variant: "quiet", onClick: () => clearFinishedWorkers() });
  const workerEmpty = el("p", { class: "auto-note", text: t("v3.auto.workers_empty") });
  const workerBox = el("div", { class: "auto-workers-list" });
  const node = card({ title: t("v3.auto.start"), body: [
    form, error, connection,
    el("section", { class: "auto-session", "aria-label": t("v3.auto.session_aria") }, [
      el("div", { class: "auto-session-head" }, [state, progress,
        el("div", { class: "auto-actions" }, [pauseButton, resumeButton, stopButton, retryButton])]),
      profile, counts, reason, slots,
      el("div", { class: "auto-workers-head" }, [
        el("h3", { class: "auto-subtitle", text: t("v3.auto.attempt_workers") }), clearWorkers,
      ]),
      workerEmpty, workerBox,
      logEmpty, logControls, logPane,
    ]),
  ] });
  node.classList.add("auto-generate");

  function live() { return !TERMINAL.has(status.state); }
  function edited() {
    dirty = true;
    saved = false;
    error.hidden = true;
    renderControls();
  }
  function readConfig() {
    const config = { mode: controls.mode.value, ip_source: ipSources[0],
      ip_sources: [...ipSources], ip_mode: ipMode, ip_pick: ipPick,
      captcha: controls.captcha.value || DEFAULTS.captcha,
      browser_display: controls.browser_display.value || DEFAULTS.browser_display };
    for (const key of ["target", "attempt_limit", "concurrency", "cooldown_seconds", "timeout_seconds", "failure_limit"]) {
      config[key] = Number(controls[key].value);
    }
    if (config.mode === "attempts" && (!Number.isInteger(config.target) || config.target < 1 || config.target > 1000)) config.target = DEFAULTS.target;
    return config;
  }
  function canonical(config) {
    const value = { ...DEFAULTS, ...config };
    value.ip_sources = [...(value.ip_sources || [])].sort();
    return value;
  }
  function writeConfig(config) {
    const known = Array.isArray(config.ip_sources) && config.ip_sources.length
      ? config.ip_sources
      : [["proxy", "socks"].includes(config.ip_source) ? "pool" : config.ip_source || "direct"];
    ipSources = known.filter((source) => SOURCES.includes(source));
    if (!ipSources.length) ipSources = ["direct"];
    ipMode = config.ip_mode === "single" ? "single" : "spread";
    ipPick = config.ip_pick || "";
    for (const input of ipInputs) input.checked = ipSources.includes(input.value);
    for (const input of modeInputs) input.checked = input.value === ipMode;
    renderIpExits();
    for (const [key, input] of Object.entries(controls)) {
      input.value = config[key] ?? DEFAULTS[key];
    }
  }
  function renderControls() {
    const locked = !hydrated || !!busy || live() || disposed;
    for (const input of Object.values(controls)) input.disabled = locked;
    for (const input of ipInputs) input.disabled = locked;
    for (const input of modeInputs) input.disabled = locked || modeRow.hidden;
    ipPickSelect.disabled = locked || pickSlot.hidden || !pickChoices.length;
    targetField.hidden = controls.mode.value !== "goal";
    controls.target.required = !targetField.hidden;
    controls.target.disabled = locked || targetField.hidden;
    controls.attempt_limit.setCustomValidity(!targetField.hidden && Number(controls.attempt_limit.value) < Number(controls.target.value)
      ? t("v3.auto.max_attempts_error") : "");
    saveButton.disabled = locked || !healthy;
    startButton.disabled = locked || !healthy || !saved || dirty;
    pauseButton.hidden = !["preparing", "running", "starting", "cooling"].includes(status.state);
    resumeButton.hidden = !["paused", "interrupted"].includes(status.state);
    stopButton.hidden = !live();
    pauseButton.disabled = resumeButton.disabled = !!busy || !healthy || disposed;
    stopButton.disabled = !!busy || !healthy || disposed || status.state === "stopping";
    retryButton.disabled = !!busy || disposed;
    form.setAttribute("aria-busy", String(!!busy || !hydrated));
    note.textContent = busy ? ({ save: t("auto.note.saving"), start: t("auto.note.starting"),
      pause: t("auto.note.pausing"), resume: t("auto.note.resuming"), stop: t("auto.note.stopping") }[busy])
      : !hydrated ? t("auto.note.loading")
      : live() ? t("auto.note.locked")
      : dirty ? t("auto.note.dirty")
      : saved ? t("auto.note.saved")
      : t("auto.note.review");
  }
  function paint(data) {
    if (data?.error) throw new Error(String(data.error));
    if (!data?.config || !data?.status?.state) throw new Error("Invalid Auto Generate response. Refresh status to retry.");
    ipChoices = data.ip_exits || [];
    poolAvailable = data.pool_available || 0;
    poolLabel.textContent = t("v3.auto.proxy_pool_count", { n: poolAvailable });
    if (!hydrated) {
      writeConfig(data.config);
      hydrated = true;
    }
    // Another dashboard can save a different profile. Never start that unseen
    // profile under the label of this form; require an explicit save again.
    if (saved) {
      const stored = canonical(data.config);
      const shown = canonical(readConfig());
      if (Object.keys(DEFAULTS).some((key) => JSON.stringify(stored[key]) !== JSON.stringify(shown[key]))) {
        saved = false;
        dirty = true;
      }
    }
    renderIpExits();
    status = data.status;
    if (status.config || runID !== status.id || !runConfig) {
      runID = status.id;
      runConfig = { ...(status.config || data.config) };
    }
    healthy = true;
    connection.hidden = true;
    fill(state, stateBadge(status.state));
    const count = (value) => Math.max(0, Number(value) || 0);
    const mode = status.mode || runConfig.mode;
    const target = count(status.target ?? status.goal ?? runConfig.target);
    progress.textContent = status.state === "idle" ? t("auto.progress.no_session")
      : mode === "goal" ? t("auto.progress.goal", { n: count(status.qualified), target: target })
      : t("auto.progress.attempts", { n: count(status.launched), target: count(status.attempt_limit ?? runConfig.attempt_limit) });
    profile.textContent = status.state === "idle" ? t("auto.profile.saved")
      : t("v3.auto.profile", { id: status.id || "—", mode: t(mode === "goal" ? "v3.auto.goal_mode" : "v3.auto.attempts_mode"),
          slots: count(runConfig.concurrency), cooldown: count(runConfig.cooldown_seconds), route: routeLabel(runConfig),
          display: t(runConfig.browser_display === "desktop" ? "v3.auto.desktop_window" : "v3.auto.background_window"),
          captcha: CAPTCHA_LABELS[runConfig.captcha] || t("v3.auto.captcha_ai") });
    counts.hidden = status.state === "idle";
    fill(counts, [["launched", t("v3.auto.count_attempts")], ["completed", t("v3.auto.count_finished")], ["qualified", t("v3.auto.count_qualified")],
      ["failed", t("v3.auto.count_failed")], ["no_plan", t("v3.auto.count_no_plan")], ["duplicates", t("v3.auto.count_duplicates")], ["active", t("v3.auto.count_active")], ["cooling", t("v3.auto.count_cooling")]]
      .map(([key, label]) => el("div", { class: "auto-count" }, [el("dt", { text: label }), el("dd", { text: String(count(status[key])) })])));
    const details = [];
    if (status.state === "interrupted") details.push(t("auto.interrupted"));
    if (status.reason) details.push(t("auto.reason", { reason: status.reason }));
    if (count(status.remaining_cooldown_seconds)) details.push(t("auto.cooldown.next", { n: Math.ceil(count(status.remaining_cooldown_seconds)) }));
    reason.textContent = details.join(" ");
    reason.hidden = !details.length;
    fill(slots, (status.slots || []).map((slot, index) => el("li", { class: "auto-slot" }, [
      el("strong", { text: t("auto.slot", { n: slot.id ?? index + 1 }) }),
      el("span", { text: t("state." + String(slot.state || "idle")) }),
      el("span", { class: "auto-note", text: slot.worker_name || slot.name || "" }),
      slot.remaining_cooldown_seconds ? el("span", { class: "auto-note", text: t("auto.slot.remaining", { n: Math.ceil(count(slot.remaining_cooldown_seconds)) }) }) : null,
    ])));
    const workers = data.workers || [];
    workerEmpty.hidden = !!workers.length;
    clearWorkers.disabled = !workers.some((w) => w.state === "exited");
    fill(workerBox, workers.map((w) => workerCard(w, stopWorker, removeWorker, workerDetail)));
    const lines = (status.events || []).map(event => {
      const stamp = new Date(event.ts * 1000).toLocaleTimeString();
      return "[" + stamp + "] " + (event.worker ? event.worker + " | " : "") + event.message;
    });
    logEmpty.hidden = !!lines.length;
    logControls.hidden = logPane.hidden = !lines.length;
    const text = lines.join("\n");
    if (text !== lastLog || !logPane.children.length) {
      const scroll = logPane.scrollTop;
      fill(logPane, lines.map((line, index) => el("div", {
        class: "logpane__line" + ((status.events[index].level === "error") ? " logpane__line--err"
          : status.events[index].level === "warn" ? " logpane__line--warn" : ""), text: line,
      })));
      logPane.scrollTop = follow.checked ? logPane.scrollHeight : scroll;
      lastLog = text;
    }
    copyLog.disabled = !lines.length;
    renderControls();
  }
  function showError(action, exception) {
    if (disposed || exception.name === "AbortError") return;
    error.textContent = action + ": " + exception.message + ". Refresh status to check the server before retrying.";
    error.hidden = false;
  }
  async function saveConfig() {
    if (disposed || busy || !hydrated || live() || !healthy || !form.reportValidity()) return;
    busy = "save";
    requestVersion++;
    error.hidden = true;
    const config = readConfig();
    renderControls();
    try {
      const data = await api.put(PATH, config, { signal: controller.signal });
      if (disposed) return;
      paint(data);
      writeConfig(data.config);
      dirty = false;
      saved = true;
    } catch (exception) { saved = false; showError("Configuration was not saved", exception); }
    finally { busy = ""; if (!disposed) renderControls(); }
  }
  async function mutate(action) {
    if (disposed || busy || !healthy || !hydrated) return;
    if (action === "start" && (live() || dirty || !saved || !form.reportValidity())) return;
    if (action === "resume" && !["paused", "interrupted"].includes(status.state)) return;
    if (action === "pause" && !["preparing", "running", "starting", "cooling"].includes(status.state)) return;
    if (action === "stop" && (!live() || status.state === "stopping")) return;
    busy = action;
    requestVersion++;
    error.hidden = true;
    if (action === "start") runConfig = readConfig();
    renderControls();
    try {
      const data = await api.post(PATH + "/" + action, {}, { signal: controller.signal });
      if (!disposed) paint(data);
    } catch (exception) {
      showError("Could not " + action + " session", exception);
      healthy = false;
    } finally { busy = ""; if (!disposed) renderControls(); }
  }
  async function workerDetail(worker, action) {
    try {
      const result = await api.post(`/admin/dash/generator/workers/details/${action}`,
        { name: worker.name, created: worker.created }, { signal: controller.signal });
      if (disposed || action === "open-log") return;
      const password = action === "password";
      const text = password ? result.password : result.log;
      if (typeof text !== "string") throw new Error("Worker details are unavailable");
      if (!await copyText(text)) throw new Error("Clipboard is unavailable");
      toast(password ? t("v3.auto.password_copied") : t("v3.auto.full_log_copied"), "ok");
    } catch (exception) {
      if (!disposed) toast(exception.message, "err");
    }
  }
  async function stopWorker(name) {
    try { await api.post("/admin/dash/generator/stop", { name }, { signal: controller.signal }); refresh(); }
    catch (exception) { toast(exception.message, "err"); }
  }
  async function removeWorker(name) {
    try { await api.post("/admin/dash/generator/workers/remove", { name }, { signal: controller.signal }); refresh(); }
    catch (exception) { toast(exception.message, "err"); }
  }
  async function clearFinishedWorkers() {
    try { await api.post("/admin/dash/generator/workers/clear", {}, { signal: controller.signal }); refresh(); }
    catch (exception) { toast(exception.message, "err"); }
  }

  function refresh() {
    if (disposed || busy) return Promise.resolve();
    if (pendingRefresh) return pendingRefresh;
    const version = requestVersion;
    pendingRefresh = (async () => {
      try {
        const data = await api.get(PATH, { signal: controller.signal });
        if (!disposed && version === requestVersion) paint(data);
      } catch (exception) {
        if (disposed || exception.name === "AbortError" || version !== requestVersion) return;
        healthy = false;
        connection.textContent = t("auto.connection.unavailable", { msg: exception.message });
        connection.hidden = false;
        renderControls();
        if (!hydrated) {
          note.textContent = t("auto.config.not_loaded");
          progress.textContent = t("auto.session.unavailable");
        }
      } finally { pendingRefresh = null; }
    })();
    return pendingRefresh;
  }
  function destroy() {
    disposed = true;
    controller.abort();
    signal?.removeEventListener("abort", destroy);
    renderControls();
  }
  signal?.addEventListener("abort", destroy, { once: true });
  renderIpExits();
  renderControls();
  if (signal?.aborted) destroy();
  else refresh();
  return { node, refresh, destroy };
}

export async function mount({ root, signal }) {
  const view = createAutoGenerate({ signal });
  let judgeLoaded = false;
  const error = el("p", { class: "text-err text-sm", role: "status" });
  const fields = {};
  const field = (key, label, attrs = {}) => {
    const input = el("input", { class: "input", ...attrs });
    fields[key] = input;
    return el("label", { class: "field" }, [el("span", { class: "field__label", text: label }), input]);
  };
  const keyPlaceholder = (saved) => saved ? t("v3.auto.key_saved") : t("v3.auto.key_enter");
  const save = button({ label: t("v3.auto.ai_saved"), disabled: true });
  const form = el("form", { class: "stack" }, [
    el("div", { class: "auto-fields auto-judge-fields" }, [
      field("custom_ai_url", t("v3.auto.endpoint"), { type: "url", placeholder: "https://api.openai.com/v1" }),
      field("custom_ai_model", t("v3.auto.model_id"), { placeholder: t("v3.auto.model_example") }),
      field("custom_ai_key", "API key", { type: "password", autocomplete: "new-password" }),
    ]), save, error,
  ]);
  save.type = "submit";
  const key = fields.custom_ai_key;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (save.disabled) return;
    save.disabled = true;
    for (const input of Object.values(fields)) input.readOnly = true;
    error.textContent = "";
    try {
      const body = Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value.trim()]));
      if (!body.custom_ai_key) delete body.custom_ai_key;
      const result = await api.post("/admin/dash/generator/options", body);
      if (result?.ok === false || result?.error) throw new Error(result.error || "Save rejected");
      if (signal.aborted) return;
      if (body.custom_ai_key) key.placeholder = keyPlaceholder(true);
      key.value = "";
      toast(t("v3.auto.ai_saved"), "ok");
    } catch (e) {
      if (!signal.aborted) error.textContent = e.message;
    } finally {
      save.disabled = false;
      for (const input of Object.values(fields)) input.readOnly = false;
    }
  });
  for (const input of Object.values(fields)) input.readOnly = true;
  root.append(el("div", { class: "stack" }, [view.node, card({
    title: t("v3.auto.ai_title"),
    desc: t("v3.auto.ai_desc"),
    body: form,
  })]));
  async function loadJudge() {
    if (judgeLoaded) return;
    try {
      const { options = {} } = await api.get("/admin/dash/generator/status", { signal });
      if (signal.aborted || judgeLoaded) return;
      judgeLoaded = true;
      fields.custom_ai_url.value = options.custom_ai_url || "";
      fields.custom_ai_model.value = options.custom_ai_model || "";
      key.placeholder = keyPlaceholder(options.custom_ai_key_set);
      save.disabled = false;
      error.textContent = "";
      for (const input of Object.values(fields)) input.readOnly = false;
    } catch (e) {
      if (!signal.aborted) error.textContent = "Could not load AI judge settings. Use Refresh to retry.";
    }
  }
  await loadJudge();
  const refresh = view.refresh;
  view.refresh = async () => { await Promise.all([refresh(), loadJudge()]); };
  return view;
}
