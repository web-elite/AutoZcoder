// Email setup: Cloudflare worker + KV + secret, Email Routing, inbox check.
//
// The routing step can come back needing confirmation when a domain already
// has a non-placeholder catch-all: replacing it silently would divert the
// user's real mail, so it is always an explicit choice.

import { el, fill } from "../../core/dom.js";
import { api } from "../../core/api.js";
import { toast } from "../../core/toast.js";
import { card, button, badge } from "../../core/ui.js";

// Hostname labels plus a letter TLD or an IDN (punycode) TLD such as xn--p1ai.
const DOMAIN_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

const CF_PERMISSIONS = [
  ["Account", "Workers Scripts", "Edit"],
  ["Account", "Workers KV Storage", "Edit"],
  ["Account", "Account Settings", "Read"],
  ["Zone", "Zone", "Read"],
  ["Zone", "DNS", "Edit"],
  ["Zone", "Email Routing Rules", "Edit"],
  ["Zone", "Zone Settings", "Edit"],
];

export function createMailCard() {
  const state = {
    deploying: false,
    message: "",
    log: "",
    inboxMessage: "",
    review: new Map(),        // domain -> {existing_rule, expected_rule, worker}
    errors: new Map(),
    deferred: new Set(),
    advancedOpen: false,
    testing: false,
  };

  const body = el("div", { class: "stack" });
  const node = card({
    title: "Email setup",
    desc: "Connect a Cloudflare domain to the verification inbox.",
    body,
  });

  /* ------------------------------------------------------------ parts --- */

  function tokenHelp() {
    const table = el("table", { class: "table table--plain" }, [
      el("thead", {}, el("tr", {}, [
        el("th", { text: t("mail.token_help.col.scope") }), el("th", { text: t("mail.token_help.col.perm") }), el("th", { text: t("mail.token_help.col.access") }),
      ])),
      el("tbody", {}, CF_PERMISSIONS.map(([scope, perm, access]) => el("tr", {}, [
        el("td", { text: scope }), el("td", { text: perm }), el("td", { text: access }),
      ]))),
    ]);

    return el("details", { class: "help-details" }, [
      el("summary", { text: t("mail.token_help.title") }),
      el("ol", { class: "help-list" }, [
        el("li", {}, [
          el("span", { text: t("mail.token.step1a") }),
          el("a", { href: "https://dash.cloudflare.com/profile/api-tokens", target: "_blank", rel: "noopener",
                    text: t("mail.token.step1b") }),
          el("span", { text: t("mail.token.step1c") }),
        ]),
        el("li", {}, [el("span", { text: t("mail.token.step2") }),
                      el("div", { class: "table-wrap" }, table)]),
        el("li", { text: t("mail.token.step3") }),
        el("li", { text: t("mail.token.step4") }),
        el("li", { text: t("mail.token.step5") }),
      ]),
    ]);
  }

  function routingRow(domain, m) {
    const done = (m.routing_done || []).includes(domain);
    const review = state.review.get(domain);
    const error = state.errors.get(domain);
    const deferred = state.deferred.has(domain);

    const statusText = review ? t("mail.routing.confirm") : done ? t("mail.routing.done") : t("mail.routing.pending");
    const statusClass = review ? "text-warn" : done ? "text-ok" : "muted";
    const inUse = (m.domains_in_use || []).includes(domain);
    const isActive = m.active === domain;
    const multi = (m.domains || []).length > 1;

    const header = el("div", { class: "row row--tight" }, [
      el("span", { class: "mono", text: domain }),
      el("span", { class: "text-sm " + statusClass, text: statusText }),
      inUse ? badge(m.rotate ? "In rotation" : "Used for signups", "accent") : null,
      multi && !m.rotate && !isActive
        ? button({ label: "Use for signups", disabled: state.deploying,
                   onClick: () => setActive(domain) })
        : null,
      review && deferred
        ? button({ label: t("mail.routing.review_btn"), disabled: state.deploying,
                   onClick: () => { state.deferred.delete(domain); paint(m); } })
        : null,
    ]);

    if (!review || deferred) {
      return el("div", { class: "stack--tight" }, [
        header,
        error ? el("p", { class: "field__error", role: "alert", text: error }) : null,
      ]);
    }

    const detail = el("div", { class: "routing-review", role: "group", "aria-label": t("mail.routing.aria", { domain }) }, [
      el("div", { class: "kv" }, [
        el("div", { class: "kv__key", text: t("mail.routing.now") }),
        el("div", { class: "kv__val", text: ruleDestination(review.existing_rule) }),
        el("div", { class: "kv__key", text: t("mail.routing.after") }),
        el("div", { class: "kv__val", text: t("mail.routing.worker", { name: review.worker }) }),
      ]),
      el("p", { class: "text-warn text-sm", text:
        t("mail.routing.warn") }),
      el("div", { class: "row" }, [
        button({ label: t("mail.routing.keep"), disabled: state.deploying,
                 onClick: () => keepRouting(domain) }),
        button({ label: t("mail.routing.replace"), variant: "primary", disabled: state.deploying,
                 onClick: () => autoRoute(domain, true) }),
      ]),
      el("details", { class: "help-details" }, [
        el("summary", { text: t("mail.routing.technical") }),
        el("div", { class: "field__help", text: t("mail.routing.current_rule") }),
        el("pre", { class: "code", text: JSON.stringify(review.existing_rule, null, 2) }),
        el("div", { class: "field__help", text: t("mail.routing.proposed_rule") }),
        el("pre", { class: "code", text: JSON.stringify(review.expected_rule, null, 2) }),
      ]),
    ]);

    return el("div", { class: "stack--tight" }, [
      header, detail,
      error ? el("p", { class: "field__error", role: "alert", text: error }) : null,
    ]);
  }

  function ruleDestination(rule) {
    const actions = rule?.actions || [];
    const values = actions.flatMap((a) => a.value || []);
    if (!values.length) return t("mail.routing.not_forwarded");
    return values.join(", ");
  }

  /* ---------------------------------------------------------- actions --- */

  function rememberRouting(results) {
    for (const result of results || []) {
      const domain = result.domain;
      if (!domain) continue;
      if (result.needs_confirmation) {
        state.review.set(domain, result);
        state.deferred.delete(domain);
      } else if (result.error) {
        state.review.delete(domain);
        state.deferred.delete(domain);
        state.errors.set(domain, result.error);
      } else if (result.ok) {
        state.review.delete(domain);
        state.errors.delete(domain);
        state.deferred.delete(domain);
      }
    }
  }

  async function deploy() {
    if (state.deploying || state.testing) return;
    const domains = fields.domains.value.trim();
    const added = domains.split(/[,\s]+/).filter(Boolean).map(d => d.toLowerCase().replace(/^@/, ""));
    const token = fields.token.value.trim();
    const account = fields.account.value.trim();

    state.deploying = true;
    state.message = t("mail.deploying");
    state.log = "";
    state.errors.clear();
    // Setup re-checks every unrouted domain and reports fresh results; an old
    // review would otherwise outlive the rule it described.
    state.review.clear();
    state.deferred.clear();
    await refresh();

    try {
      const current = await api.get("/admin/dash/generator/mail");
      if (!added.length && !current.domains?.length) throw new Error("Enter at least one Cloudflare domain.");
      if (added.some(d => !DOMAIN_RE.test(d))) {
        throw new Error("Enter domain names without URLs or email addresses.");
      }
      if (added.length || !current.domains?.includes(current.active)) {
        await api.post("/admin/dash/generator/mail", {
          domains: [...new Set([...(current.domains || []), ...added])],
        });
        fields.domains.value = "";
      }
      const r = await api.post("/admin/dash/generator/mail/deploy", {
        cf_token: token, cf_account_id: account,
      });
      state.log = (r.steps || []).join("\n");
      rememberRouting(r.routing);
      if (r.ok) {
        toast(r.ready ? t("mail.complete") : t("mail.deployed_review"),
              r.ready ? "ok" : "warn");
        fields.token.value = "";
        state.message = r.ready ? "" : t("mail.needs_attention");
      } else {
        state.message = r.error || t("mail.did_not_finish");
        toast(state.message, "err", 8000);
      }
    } catch (e) {
      state.message = e.message;
      toast(t("mail.setup_err", { msg: e.message }), "err", 8000);
    } finally {
      state.deploying = false;
      await refresh();
    }
  }

  async function autoRoute(domain, replaceExisting = false) {
    state.deploying = true;
    await refresh();
    try {
      const r = await api.post("/admin/dash/generator/mail/routing-auto", {
        domain, replace_existing: replaceExisting,
        ...(replaceExisting ? {
          confirmation_fingerprint: state.review.get(domain)?.confirmation_fingerprint,
        } : {}),
      });
      for (const res of r.results || []) {
        const d = res.domain || domain;
        if (res.needs_confirmation) {
          // The rule changed since it was reviewed: show the new one right away.
          state.review.set(d, res);
          state.deferred.delete(d);
        } else if (res.error) {
          state.review.delete(d);
          state.errors.set(d, res.error);
        } else {
          state.review.delete(d);
          state.errors.delete(d);
          state.deferred.delete(d);
        }
      }
      toast(r.ok ? t("mail.routing.done") : t("mail.routing.attention"), r.ok ? "ok" : "warn");
    } catch (e) {
      state.errors.set(domain, e.message);
    } finally {
      state.deploying = false;
      await refresh();
    }
  }

  function keepRouting(domain) {
    state.review.delete(domain);
    state.deferred.delete(domain);
    state.errors.set(domain, t("mail.routing.unchanged"));
    refresh();
  }

  async function saveToken() {
    const token = fields.token.value.trim();
    const account = fields.account.value.trim();
    if (!token && !account) { toast(t("mail.enter_token_first"), "warn"); return; }
    try {
      const r = await api.post("/admin/dash/generator/mail/cf-credentials", { cf_token: token, cf_account_id: account });
      if (!r || r.saved === false || (!r.ok && r.saved !== true)) {
        throw new Error(r?.error || "Token was not saved.");
      }
      if (fields.token.value.trim() === token) fields.token.value = "";
      const unverified = !r.ok || r.verified === false;
      state.message = unverified
        ? (r.error || t("mail.token_saved_pending"))
        : t("mail.token_saved");
      toast(state.message, unverified ? "warn" : "ok");
      await refresh();
    } catch (e) {
      state.message = t("mail.token_not_saved", { msg: e.message });
      messageLine.textContent = state.message;
      messageLine.hidden = false;
      toast(state.message, "err");
    }
  }

  async function clearToken() {
    try {
      const r = await api.post("/admin/dash/generator/mail/cf-credentials", { cf_token: "", clear: true });
      if (!r?.ok) throw new Error(r?.error || t("mail.token_not_removed"));
      state.message = t("mail.token_removed");
      toast(state.message, "ok");
      await refresh();
    } catch (e) {
      state.message = t("mail.token_remove_failed", { msg: e.message });
      messageLine.textContent = state.message;
      messageLine.hidden = false;
      toast(state.message, "err");
    }
  }

  async function testInbox() {
    if (state.testing || state.deploying) return;
    state.testing = true;
    state.inboxMessage = "Testing…";
    inboxLine.textContent = state.inboxMessage;
    testBtn.disabled = deployBtn.disabled = true;
    try {
      const r = await api.get("/admin/dash/generator/mail/test");
      state.inboxMessage = r.ok ? t("mail.inbox.answered") : (r.error || t("mail.inbox.no_answer"));
      toast(state.inboxMessage, r.ok ? "ok" : "err");
    } catch (e) {
      state.inboxMessage = e.message;
    } finally {
      state.testing = false;
      await refresh();
    }
  }

  async function saveManual() {
    try {
      await api.post("/admin/dash/generator/mail", {
        inbox_url: fields.inboxUrl.value.trim(),
        inbox_secret: fields.inboxSecret.value.trim(),
      });
      fields.inboxSecret.value = "";
      toast(t("mail.inbox.saved"), "ok");
      await refresh();
    } catch (e) { toast(t("mail.inbox.save_err", { msg: e.message }), "err"); }
  }

  async function setActive(domain) {
    try {
      await api.post("/admin/dash/generator/mail", { active: domain });
      toast("Signups now use " + domain, "ok");
      await refresh();
    } catch (e) { toast(e.message, "err"); }
  }

  async function setRotate(on) {
    try {
      await api.post("/admin/dash/generator/mail", { rotate: on });
      toast(on ? "Signups rotate across routed domains" : "Signups use one domain", "ok");
      await refresh();
    } catch (e) {
      rotateInput.checked = !on;
      toast(e.message, "err");
    }
  }

  async function removeDomain(domain) {
    try {
      const current = await api.get("/admin/dash/generator/mail");
      await api.post("/admin/dash/generator/mail", {
        domains: (current.domains || []).filter(d => d !== domain),
      });
      toast(t("mail.domain.removed"), "ok");
      await refresh();
    } catch (e) { toast(t("mail.domain.remove_err", { msg: e.message }), "err"); }
  }

  async function markRoutingDone(domain) {
    try {
      await api.post("/admin/dash/generator/mail/routing", { domain, done: true });
      toast(t("mail.routing.marked"), "ok");
      await refresh();
    } catch (e) { toast(e.message, "err"); }
  }

  /* ------------------------------------------------------------ paint --- */

  // Inputs are created once and never replaced, so a repaint cannot wipe a
  // half-typed domain, token or secret.
  const fields = {
    domains: el("textarea", {
      class: "textarea", id: "mail-new-domain", rows: 2, spellcheck: false,
      autocapitalize: "none", placeholder: t("mail.domain.ph"),
    }),
    token: el("input", { class: "input", id: "mail-cf-token", type: "password", autocomplete: "off" }),
    account: el("input", { class: "input", id: "mail-cf-account", type: "text", autocomplete: "off" }),
    inboxUrl: el("input", { class: "input input--mono", id: "mail-inbox-url", type: "text" }),
    inboxSecret: el("input", { class: "input", id: "mail-inbox-secret", type: "password", autocomplete: "off" }),
  };

  const statusLine = el("div", { class: "text-sm", role: "status" });
  const statusError = el("p", { class: "field__error", role: "alert", hidden: true });
  const messageLine = el("p", { class: "text-sm" });
  const routingBox = el("div", { class: "stack--tight" });
  const logBox = el("pre", { class: "code", hidden: true });
  const inboxLine = el("span", { class: "muted text-xs", role: "status" });
  const domainList = el("div", { class: "stack--tight" });
  const tokenNote = el("div", { class: "field__help" });
  const clearBtnSlot = el("span");

  const rotateInput = el("input", { class: "switch__input", type: "checkbox", id: "mail-rotate" });
  rotateInput.addEventListener("change", () => setRotate(rotateInput.checked));
  const rotateField = el("div", { class: "field" }, [
    el("label", { class: "switch" }, [
      rotateInput, el("span", { class: "switch__track" }),
      el("span", { class: "text-sm", text: "Rotate signups across all routed domains" }),
    ]),
    el("div", { class: "field__help", text:
      "Each signup picks a random domain whose routing is configured. Domains still pending are skipped." }),
  ]);

  const deployBtn = button({ label: "Set up email", variant: "primary", onClick: deploy });
  const testBtn = button({ label: "Test worker inbox", onClick: testInbox });

  function paint(m) {
    const doms = m.domains || [];
    const credentialsSaved = !!m.inbox_url && m.inbox_secret_set === true;
    const inboxVerified = credentialsSaved && m.inbox_ok === true;
    const inUse = m.domains_in_use || [];
    const routingDone = m.routing_in_use_done === true;
    const needsConfirmation = inUse.some((d) => state.review.has(d));
    const ready = inboxVerified && routingDone && !needsConfirmation && m.ready !== false;

    const status = state.deploying ? "Setting up email…"
      : needsConfirmation ? "Routing change needs approval"
      : ready ? "Email ready"
      : !doms.length ? "Enter your domain and Cloudflare API token to begin"
      : !credentialsSaved ? "Worker setup pending"
      : !inboxVerified && !routingDone ? "Inbox verification and domain routing pending"
      : !inboxVerified ? "Credentials saved; inbox verification pending"
      : !inUse.length ? (m.rotate ? "No routed domain yet; finish routing for at least one"
                                  : "Choose a domain for signups")
      : "Inbox verified; domain routing pending";

    fill(statusLine, el("b", { text: status }));
    statusLine.className = "text-sm " + (ready ? "text-ok" : needsConfirmation ? "text-warn" : "muted");

    messageLine.textContent = state.message;
    messageLine.hidden = !state.message;

    fields.token.placeholder = m.cf_token_set
      ? t("mail.token.saved_ph") : t("mail.token.paste_ph");
    tokenNote.textContent = m.cf_token_set ? t("mail.token.saved_note") : "";
    tokenNote.hidden = !m.cf_token_set;

    fields.account.placeholder = m.cf_account_id
      ? t("mail.account.saved_ph") : t("mail.account.ph");
    fields.inboxSecret.placeholder = m.inbox_secret_set
      ? t("mail.secret.saved_ph") : t("mail.secret.ph");
    // Do not fight the user's cursor; only adopt the server value when idle.
    if (document.activeElement !== fields.inboxUrl && fields.inboxUrl.value === fields.inboxUrl.defaultValue) {
      fields.inboxUrl.value = m.inbox_url || "";
      fields.inboxUrl.defaultValue = fields.inboxUrl.value;
    }

    fill(clearBtnSlot, m.cf_token_set
      ? button({ label: t("mail.token.remove"), variant: "quiet", onClick: clearToken })
      : null);

    fill(routingBox, doms.map((d) => routingRow(d, m)));
    rotateField.hidden = doms.length < 2;
    if (document.activeElement !== rotateInput) rotateInput.checked = m.rotate === true;
    rotateInput.disabled = state.deploying;
    fill(domainList, doms.map((d) => el("div", { class: "row row--tight" }, [
      el("span", { class: "mono text-sm", text: d }),
      button({ label: t("mail.routing.mark_done"), onClick: () => markRoutingDone(d) }),
      button({ label: t("mail.domain.remove"), variant: "quiet", onClick: () => removeDomain(d) }),
    ])));

    logBox.textContent = state.log;
    logBox.hidden = !state.log;
    inboxLine.textContent = state.inboxMessage;

    testBtn.hidden = !credentialsSaved;
    testBtn.disabled = deployBtn.disabled = state.deploying || state.testing;
    deployBtn.querySelector("span").textContent = state.deploying ? "Setting up email…" : ready ? "Run setup again" : "Set up email";
    for (const f of Object.values(fields)) f.disabled = state.deploying;
  }

  function build() {
    fill(body, [
      el("div", { class: "mail-overview stack--tight" }, [
        el("div", { class: "row" }, [statusLine, testBtn]), routingBox, rotateField, inboxLine,
        el("p", { class: "field__help", text:
          "An inbox test only proves the worker answers. Send a real email to verify delivery." }),
      ]),
      statusError,
      el("div", { class: "field" }, [
        el("label", { class: "field__label", for: "mail-new-domain", text: t("mail.domain.label") }),
        fields.domains,
        el("div", { class: "field__help", text: t("mail.domain.help") }),
      ]),
      el("div", { class: "field" }, [
        el("label", { class: "field__label", for: "mail-cf-token", text: t("mail.token.label") }),
        fields.token,
        tokenNote,
      ]),
      tokenHelp(),
      el("div", { class: "row" }, [
        deployBtn,
        el("span", { class: "field__help", text: t("mail.setup_hint") }),
      ]),
      messageLine,
      logBox,
      el("details", { class: "help-details", open: state.advancedOpen,
        on: { toggle: (e) => { state.advancedOpen = e.target.open; } } }, [
        el("summary", { text: t("mail.advanced.summary") }),
        el("div", { class: "stack" }, [
          el("div", { class: "field" }, [
            el("label", { class: "field__label", for: "mail-cf-account", text: t("mail.account.label") }),
            fields.account,
            el("p", { class: "field__help", text: t("mail.account.help") }),
          ]),
          el("div", { class: "row" }, [
            button({ label: t("mail.btn.save_token"), onClick: saveToken }),
            clearBtnSlot,
          ]),
          el("div", { class: "field" }, [
            el("label", { class: "field__label", for: "mail-inbox-url", text: t("mail.inbox.url_label") }),
            fields.inboxUrl,
          ]),
          el("div", { class: "field" }, [
            el("label", { class: "field__label", for: "mail-inbox-secret", text: t("mail.inbox.secret_label") }),
            fields.inboxSecret,
          ]),
          el("div", { class: "row" }, [
            button({ label: "Save inbox settings", onClick: saveManual }),
          ]),
          el("p", { class: "field__help", text:
            t("mail.inbox.manual_fallback") }),
          domainList,
        ]),
      ]),
    ]);
  }

  async function refresh() {
    try {
      const m = await api.get("/admin/dash/generator/mail");
      statusError.hidden = true;
      paint(m);
      return state.deploying || state.testing ? { ...m, ready: false } : m;
    } catch (e) {
      statusError.textContent = t("mail.status_error", { msg: e.message });
      statusError.hidden = false;
       testBtn.disabled = deployBtn.disabled = state.deploying || state.testing;
       inboxLine.textContent = state.inboxMessage;
      for (const f of Object.values(fields)) f.disabled = state.deploying;
    }
  }

  build();
  return { node, refresh };
}

export async function mount({ root }) {
  const view = createMailCard();
  root.append(view.node);
  await view.refresh();
  return view;
}
