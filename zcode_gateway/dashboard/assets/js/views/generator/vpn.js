// Generator → IP source: Psiphon and Surfshark.
//
// Each chosen region is one bundled client on a local SOCKS port; the
// generator sends each signup through the next ready region, so accounts do
// not share one exit address. "New address" reconnects a region for a
// different exit. The card renders whatever the gateway status reports.

import { el, fill } from "../../core/dom.js";
import { api } from "../../core/api.js";
import { toast } from "../../core/toast.js";
import { card, button, badge } from "../../core/ui.js";
import { t } from "../../core/i18n.js";

const STATE_TONE = {
  ready: "ok", starting: "warn", reconnecting: "warn", failed: "err", stopped: "",
};
const STATE_LABEL = {
  ready: t("v3.vpn.connected"), starting: t("v3.vpn.connecting"), reconnecting: t("v3.vpn.reconnecting"),
  failed: t("v3.vpn.failed"), stopped: t("v3.vpn.not_running"),
};

function ago(ms) {
  if (!ms) return "";
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + " min ago";
  if (minutes < 1440) return Math.round(minutes / 60) + " h ago";
  return Math.round(minutes / 1440) + " d ago";
}

function switchField(label, help, checked, onChange) {
  const input = el("input", { class: "switch__input", type: "checkbox", checked });
  input.addEventListener("change", () => onChange(input.checked));
  return el("div", { class: "field" }, [
    el("label", { class: "switch" }, [
      input, el("span", { class: "switch__track" }),
      el("span", { class: "text-sm muted", text: label }),
    ]),
    help ? el("div", { class: "field__help", text: help }) : null,
  ]);
}

function summaryBadge(info, kind) {
  if (!info.installed) return badge(t("v3.vpn.not_available"), "");
  if (kind === "surfshark" && !info.keys?.saved) return badge(t("v3.vpn.key_needed"), "");
  if (!info.config?.enabled) return badge(t("v3.vpn.off"), "");
  const total = (info.config?.regions || []).length;
  if (info.live) return badge(`${info.live} of ${total} connected`, "ok");
  if (info.running) return badge(t("v3.vpn.connecting"), "warn");
  return badge(t("v3.vpn.not_running"), "");
}

function modePicker(name, cfg, save) {
  const radio = (value, title, detail) => {
    const input = el("input", { type: "radio", name, checked: cfg.mode === value });
    input.addEventListener("change", () => {
      if (cfg.mode === value) return;
      const patch = { mode: value };
      if (value === "single") patch.pinned = cfg.pinned || (cfg.regions || [])[0] || "";
      save(patch, value === "single" ? t("v3.auto.stay_one") : t("v3.auto.random") );
    });
    return el("label", { class: "vpn-mode" }, [
      input, el("span", {}, [
        el("b", { text: title }),
        el("small", { text: detail }),
      ]),
    ]);
  };
  const row = el("div", { class: "vpn-modes" }, [
    radio("spread", "Take turns", "each signup uses the next ready region"),
    radio("single", "Stay on one", "every signup uses the same region"),
  ]);
  let pinned = null;
  if (cfg.mode === "single" && (cfg.regions || []).length) {
    const select = el("select", { class: "select", id: name + "-region" }, (cfg.regions || []).map((r) =>
      el("option", { value: r, text: r, selected: r === (cfg.pinned || cfg.regions[0]) })));
    select.addEventListener("change", () => save({ pinned: select.value }, "Region pinned: " + select.value));
    pinned = el("div", { class: "field" }, [
      el("label", { class: "field__label", htmlFor: select.id, text: t("v3.vpn.region_in_use") }),
      select,
    ]);
  }
  return el("fieldset", { class: "vpn-routing" }, [
    el("legend", { text: t("v3.vpn.region_preference") }), row, pinned,
  ]);
}

export function createVpnCard(provider, signal) {
  const box = el("div");
  const node = card({
    title: provider === "psiphon" ? "Psiphon" : "Surfshark",
    body: box, flush: true,
  });
  node.classList.add("vpn-card");

  let status = null;
  let busy = "";
  const picked = { psiphon: null, surfshark: null };
  const dirty = { psiphon: false, surfshark: false };
  const keys = { editing: false, publicKey: "", privateKey: "", saved: null };
  let search = "";

  async function talking(path, body, done) {
    try {
      await api.post(path, body || {});
      if (done) toast(done, "ok");
      await reload();
      return true;
    } catch (e) {
      toast(String(e?.message || e), "err");
      return false;
    }
  }

  async function act(label, path, body, done) {
    if (busy) return false;
    busy = label;
    render();
    try { return await talking(path, body, done); }
    finally { busy = ""; render(); }
  }

  async function reload() {
    const initial = !status;
    try {
      const next = await api.get("/admin/dash/generator/vpn/status", { signal });
      if (signal?.aborted) return;
      status = next;
    } catch (e) {
      if (signal?.aborted) return;
      if (initial) fill(box, el("div", { class: "vpn-provider text-err", role: "status", text: e.message }));
      return;
    }
    render();
  }

  function ensurePicked(kind, info) {
    if (picked[kind] === null || !dirty[kind]) {
      picked[kind] = [...(info.config?.regions || [])];
      dirty[kind] = false;
    }
  }

  function regionsChanged(kind, info) {
    if (!dirty[kind]) return false;
    const a = [...picked[kind]].sort().join(",");
    const b = [...(info.config?.regions || [])].sort().join(",");
    return a !== b;
  }

  function toggleChip(kind, id) {
    dirty[kind] = true;
    picked[kind] = picked[kind].includes(id)
      ? picked[kind].filter((x) => x !== id)
      : [...picked[kind], id];
    render();
  }

  async function saveRegions(kind, what) {
    if (!picked[kind].length) { toast(t("v3.vpn.choose_region"), "warn"); return; }
    const selection = picked[kind];
    const saved = await act("save", `/admin/dash/generator/vpn/${kind}/settings`,
      { regions: selection }, `${what}: ${selection.length} chosen`);
    if (saved && picked[kind] === selection) {
      dirty[kind] = false;
      render();
    }
  }

  /* ------------------------------------------------------------ rows --- */

  function regionRow(kind, row, info) {
    const tone = STATE_TONE[row.state] || "";
    const label = STATE_LABEL[row.state] || row.state;
    const name = kind === "psiphon"
      ? (info.regionNames?.[row.region] || row.region)
      : (row.place || row.region);
    const pinned = info.config?.mode === "single" && info.config?.pinned === row.region;
    return el("div", { class: "job" }, [
      el("div", { class: "job__head" }, [
        el("span", { class: "dot dot--" + (tone || "ok") + (row.state === "ready" ? " dot--live" : "") }),
        el("b", { class: "job__name truncate", text: name }),
        el("span", { class: "mono text-xs muted", text: row.region }),
        pinned ? badge(t("v3.vpn.region_in_use"), "ok") : null,
        badge(label, tone),
        el("span", { class: "mono text-xs faint", text: row.exitIp || "—" }),
        el("span", { class: "faint text-xs", text: row.location && kind === "psiphon" ? row.location : "" }),
        el("span", { class: "spacer" }),
        info.config?.mode === "single" && !pinned
          ? button({ label: t("v3.vpn.stay_on"), onClick: () => act("pin",
              `/admin/dash/generator/vpn/${kind}/settings`, { pinned: row.region },
              "Pinned " + name) })
          : null,
        button({
          label: t("v3.vpn.new_address"), icon: "refresh", variant: "quiet",
          disabled: busy !== "" || row.state === "stopped",
          title: t("v3.vpn.new_address_help"),
          onClick: () => act("renew:" + row.region, `/admin/dash/generator/vpn/${kind}/renew`,
            { region: row.region }, name + " is getting a new address"),
        }),
      ]),
      row.error ? el("div", { class: "field__help text-warn", text: row.error }) : null,
    ]);
  }

  /* --------------------------------------------------------- psiphon --- */

  function renderPsiphon(info) {
    ensurePicked("psiphon", info);
    const cfg = info.config || {};
    const working = busy !== "" || info.busy;
    const save = (patch, done) => act("save", "/admin/dash/generator/vpn/psiphon/settings", patch, done);

    const chips = el("div", { class: "row", style: { flexWrap: "wrap", gap: "var(--s-2)" } },
      (info.available || []).map((region) => {
        const on = picked.psiphon.includes(region);
        const input = el("input", { type: "checkbox", checked: on });
        input.addEventListener("change", () => toggleChip("psiphon", region));
        return el("label", { class: "chip", style: { cursor: "pointer", borderColor: on ? "var(--accent)" : "" },
                             title: info.regionNames?.[region] || region }, [
          input, el("span", { class: "mono", text: region }),
        ]);
      }));

    return el("section", { class: "vpn-provider", "aria-labelledby": "vpn-psiphon" }, [
      el("div", { class: "row" }, [
        el("h3", { id: "vpn-psiphon", text: "Psiphon" }),
        summaryBadge(info, "psiphon"),
        el("span", { class: "spacer" }),
        button({ label: t("v3.vpn.update_servers"), icon: "refresh", disabled: working,
                 title: t("v3.vpn.update_psiphon_help"),
                 onClick: () => act("update", "/admin/dash/generator/vpn/psiphon/update", {},
                   t("v3.vpn.psiphon_updated")) }),
      ]),
      info.problem ? el("div", { class: "notice notice--warn", text: info.problem }) : null,
      el("div", { class: "field" }, [
        el("b", { text: t("v3.vpn.regions") }),
        el("div", { class: "field__help", text: t("v3.vpn.regions_available", { n: (info.available || []).length }) }),
        chips,
      ]),
      regionsChanged("psiphon", info)
        ? el("div", { class: "row" }, [
            el("span", { class: "text-xs text-warn", text: t("v3.vpn.chosen_unsaved", { n: picked.psiphon.length }) }),
            button({ label: t("v3.vpn.save_regions"), variant: "primary",
                     onClick: () => saveRegions("psiphon", "Psiphon regions") }),
            button({ label: t("v3.vpn.undo"), onClick: () => { dirty.psiphon = false; picked.psiphon = null; render(); } }),
          ])
        : null,
      el("div", { class: "row" }, [
        button({ label: info.running ? t("v3.vpn.connect_restart") : t("v3.vpn.connect"), icon: "bolt", variant: "primary",
                 disabled: working || !cfg.enabled || !(cfg.regions || []).length,
                 onClick: () => act("connect", "/admin/dash/generator/vpn/psiphon/connect", {},
                   t("v3.vpn.psiphon_connecting")) }),
        button({ label: t("v3.vpn.disconnect"), disabled: working || !info.running,
                 onClick: () => act("disconnect", "/admin/dash/generator/vpn/psiphon/disconnect", {},
                   t("v3.vpn.psiphon_disconnected")) }),
        info.lastError ? el("span", { class: "text-xs text-err", text: info.lastError }) : null,
      ]),
      (info.regions || []).length
        ? el("div", {}, info.regions.map((row) => regionRow("psiphon", row, info)))
        : null,
      modePicker("psiphon-mode", cfg, save),
      switchField(t("v3.vpn.enabled"), t("v3.vpn.enabled_help"),
        cfg.enabled !== false, (v) => save({ enabled: v }, v ? t("v3.vpn.psiphon_enabled") : t("v3.vpn.psiphon_disabled"))),
      switchField(t("v3.vpn.auto_start"), t("v3.vpn.auto_start_help"),
        !!cfg.autoStart, (v) => save({ autoStart: v },
          v ? t("v3.vpn.psiphon_connecting") : t("v3.vpn.psiphon_disabled"))),
    ]);
  }

  /* ------------------------------------------------------- surfshark --- */

  function keyPanel(info) {
    const saved = !!info.keys?.saved;
    const open = !saved || keys.editing;
    const saveKeys = async () => {
      if (busy) return;
      if (!keys.privateKey.trim()) { toast(t("v3.vpn.paste_private"), "warn"); return; }
      busy = "keys";
      render();
      try {
        const saved = await talking("/admin/dash/generator/vpn/surfshark/keys",
          { privateKey: keys.privateKey.trim(), publicKey: keys.publicKey.trim() },
          t("v3.vpn.key_saved"));
        if (saved) {
          keys.editing = false; keys.privateKey = ""; keys.publicKey = "";
        }
      } finally { busy = ""; }
      render();
    };
    const field = (label, node, help) => el("div", { class: "field" }, [
      el("label", { class: "field__label", htmlFor: node.id, text: label }), node,
      help ? el("div", { class: "field__help", id: node.id + "-help", text: help }) : null,
    ]);
    const pub = el("input", { class: "input input--mono", type: "text", id: "vpn-public-key", readOnly: busy === "keys",
                              placeholder: "44 characters ending in =", value: keys.publicKey });
    pub.addEventListener("input", () => { keys.publicKey = pub.value; });
    pub.spellcheck = false;
    const priv = el("input", { class: "input input--mono", type: "password", autocomplete: "new-password", readOnly: busy === "keys",
                               id: "vpn-private-key", "aria-describedby": "vpn-private-key-help",
                               placeholder: "44 characters ending in =", value: keys.privateKey });
    priv.addEventListener("input", () => { keys.privateKey = priv.value; });

    return el("div", { class: "stack--tight" }, [
      el("div", { class: "row" }, [
        el("b", { text: t("v3.vpn.key_pair") }),
        saved && !keys.editing ? el("span", { class: "text-xs text-ok", text: t("v3.vpn.saved") }) : null,
        el("span", { class: "spacer" }),
        saved && !keys.editing
          ? button({ label: t("v3.vpn.replace"), disabled: busy !== "", onClick: () => { keys.editing = true; render(); } })
          : null,
        saved && !keys.editing
          ? button({ label: t("v3.vpn.remove"), variant: "danger", disabled: busy !== "",
                     onClick: () => act("keys", "/admin/dash/generator/vpn/surfshark/keys/remove", {},
                       t("v3.vpn.key_removed")) })
          : null,
      ]),
      saved && !keys.editing
        ? el("div", { class: "field__help mono", text: t("v3.vpn.public_key") + " " + (info.keys?.publicKey || "") })
        : null,
      open
        ? el("div", { class: "stack--tight" }, [
            el("div", { class: "field__help", text:
              t("v3.vpn.key_help") }),
            field(t("v3.vpn.public_key"), pub),
            field(t("v3.vpn.private_key"), priv, t("v3.vpn.public_key_help")),
            el("div", { class: "row" }, [
              button({ label: t("v3.vpn.save_keys"), variant: "primary", disabled: busy !== "",
                       onClick: saveKeys }),
              keys.editing
                ? button({ label: t("v3.vpn.cancel"), disabled: busy !== "", onClick: () => { keys.editing = false; keys.privateKey = ""; keys.publicKey = ""; render(); } })
                : null,
            ]),
          ])
        : null,
    ]);
  }

  function renderSurfshark(info) {
    ensurePicked("surfshark", info);
    const cfg = info.config || {};
    const working = busy !== "" || info.busy;
    const save = (patch, done) => act("save", "/admin/dash/generator/vpn/surfshark/settings", patch, done);
    const servers = info.servers || [];
    const query = search.trim().toLowerCase();
    const shown = servers.filter((s) => !query ||
      `${s.country} ${s.location} ${s.id} ${s.countryCode}`.toLowerCase().includes(query));
    const counts = new Map();
    for (const s of servers) counts.set(s.country, (counts.get(s.country) || 0) + 1);

    const searchInput = el("input", { class: "input", type: "search", id: "vpn-location-search", "aria-label": t("v3.vpn.search_locations"),
                                      placeholder: t("v3.vpn.search_locations"), value: search });
    searchInput.addEventListener("input", () => {
      search = searchInput.value;
      const results = box.querySelector("#vpn-location-results");
      if (results) results.scrollTop = 0;
      render();
    });

    const chips = el("div", { class: "vpn-scroll vpn-location-results row", id: "vpn-location-results",
                              role: "region", "aria-label": t("v3.vpn.available_locations"), tabIndex: 0 },
      shown.map((s) => {
        const on = picked.surfshark.includes(s.id);
        const many = (counts.get(s.country) || 0) > 1;
        const where = many ? (s.location || s.id) : (s.location && s.location !== s.country ? s.location : s.countryCode);
        const input = el("input", { type: "checkbox", checked: on, id: `vpn-location-${s.id}` });
        input.addEventListener("change", () => toggleChip("surfshark", s.id));
        return el("label", { class: "chip", style: { cursor: "pointer", borderColor: on ? "var(--accent)" : "" },
                             title: `${s.country}${s.location ? " · " + s.location : ""} (${s.id})` }, [
          input, el("span", { text: s.country }), el("span", { class: "faint text-xs", text: where }),
        ]);
      }));

    return el("section", { class: "vpn-provider", "aria-labelledby": "vpn-surfshark" }, [
      el("div", { class: "row" }, [
        el("h3", { id: "vpn-surfshark", text: "Surfshark" }),
        summaryBadge(info, "surfshark"),
        el("span", { class: "spacer" }),
        button({ label: t("v3.vpn.update_servers"), icon: "refresh", disabled: working,
                 title: t("v3.vpn.update_servers"),
                 onClick: () => act("update", "/admin/dash/generator/vpn/surfshark/update", {},
                   t("v3.vpn.surfshark_updated")) }),
      ]),
      info.problem ? el("div", { class: "notice notice--warn", text: info.problem }) : null,
      el("div", { class: "notice notice--warn" }, [
        el("strong", { text: t("v3.vpn.subscription_required") + " " }),
        el("span", { text: t("v3.vpn.subscription_help") }),
      ]),
      keyPanel(info),
      info.keys?.saved
        ? el("div", { class: "stack--tight" }, [
            el("div", { class: "field__help", text: servers.length
              ? t("v3.vpn.location_count", { n: servers.length, countries: new Set(servers.map((s) => s.countryCode)).size })
                + (info.updatedAt ? " · " + t("v3.vpn.updated", { when: ago(info.updatedAt) }) : "")
              : t("v3.vpn.load_locations") }),
            servers.length ? searchInput : null,
             shown.length ? chips : servers.length
               ? el("div", { class: "field__help", text: t("v3.vpn.no_location_match") }) : null,
            regionsChanged("surfshark", info)
              ? el("div", { class: "row" }, [
                  el("span", { class: "text-xs text-warn", text: t("v3.vpn.chosen_unsaved", { n: picked.surfshark.length }) }),
                  button({ label: t("v3.vpn.save_regions"), variant: "primary",
                           onClick: () => saveRegions("surfshark", t("v3.vpn.surfshark_locations")) }),
                  button({ label: t("v3.vpn.undo"), onClick: () => { dirty.surfshark = false; picked.surfshark = null; render(); } }),
                ])
              : null,
            el("div", { class: "row" }, [
              button({ label: info.running ? t("v3.vpn.connect_restart") : t("v3.vpn.connect"), icon: "bolt", variant: "primary",
                       disabled: working || !cfg.enabled || !(cfg.regions || []).length,
                       onClick: () => act("connect", "/admin/dash/generator/vpn/surfshark/connect", {},
                         t("v3.vpn.surfshark_connecting")) }),
              button({ label: t("v3.vpn.disconnect"), disabled: working || !info.running,
                       onClick: () => act("disconnect", "/admin/dash/generator/vpn/surfshark/disconnect", {},
                         t("v3.vpn.surfshark_disconnected")) }),
              info.lastError ? el("span", { class: "text-xs text-err", text: info.lastError }) : null,
            ]),
             (info.regions || []).length
               ? el("div", { class: "stack--tight" }, [
                   el("b", { text: `Location status (${info.regions.length})` }),
                   el("div", { class: "vpn-scroll vpn-location-status", id: "vpn-location-status",
                               role: "region", "aria-label": t("v3.vpn.location_status", { n: info.regions.length }), tabIndex: 0 },
                      info.regions.map((row) => regionRow("surfshark", row, info))),
                 ])
              : null,
            modePicker("surfshark-mode", cfg, save),
            switchField(t("v3.vpn.surfshark_enabled"), t("v3.vpn.surfshark_enabled_help"),
              cfg.enabled !== false, (v) => save({ enabled: v }, v ? t("v3.vpn.surfshark_enabled_msg") : t("v3.vpn.surfshark_disabled_msg"))),
            switchField(t("v3.vpn.auto_start"), t("v3.vpn.auto_start_help"),
              !!cfg.autoStart, (v) => save({ autoStart: v },
                v ? t("v3.vpn.surfshark_connecting") : t("v3.vpn.surfshark_disabled_msg"))),
          ])
        : null,
    ]);
  }

  function render() {
    if (!status) return;
    const active = document.activeElement;
    const focused = box.contains(active) && active.id;
    const selection = focused && active instanceof HTMLInputElement && active.selectionStart !== null
      ? [active.selectionStart, active.selectionEnd, active.selectionDirection] : null;
    const scrollPositions = Array.from(box.querySelectorAll(".vpn-scroll"), (list) => [list.id, list.scrollTop]);
    fill(box, provider === "psiphon" ? renderPsiphon(status.psiphon || {}) : renderSurfshark(status.surfshark || {}));
    for (const [id, scrollTop] of scrollPositions) {
      const list = box.querySelector(`#${id}`);
      if (list) list.scrollTop = scrollTop;
    }
    if (focused) {
      const replacement = box.querySelector(`#${CSS.escape(focused)}`);
      if (replacement) {
        replacement.focus({ preventScroll: true });
        if (selection) replacement.setSelectionRange(...selection);
      }
    }
  }

  return { node, refresh: reload };
}

export async function mountProvider({ root, signal }, provider) {
  const view = createVpnCard(provider, signal);
  root.append(view.node);
  await view.refresh();
  return view;
}
