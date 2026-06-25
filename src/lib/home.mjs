const DEMO_EXAMPLES = [
  {
    label: "Back & neck pain",
    need: "Neck pain and release tension in my shoulders from desk work",
    location: "Glasgow",
    urgency: "week",
    hint: "Live cell — massage",
  },
  {
    label: "Stress & burnout",
    need: "Burned out, can't sleep, overwhelmed and anxious",
    location: "Glasgow",
    urgency: "week",
    hint: "Live cell — massage",
  },
  {
    label: "Pregnancy comfort",
    need: "Pregnant, second trimester, need safe massage for hip pain",
    location: "Glasgow",
    urgency: "flexible",
    hint: "Live cell — massage",
  },
  {
    label: "Dental emergency",
    need: "Broken tooth, severe dental pain, need emergency dentist",
    location: "Glasgow",
    urgency: "immediate",
    hint: "Stub — routing friction",
  },
  {
    label: "STI screening",
    need: "Confidential STI screening at a pharmacy in Glasgow",
    location: "Glasgow",
    urgency: "week",
    hint: "Stub — routing friction",
  },
];

export function homeHtml(offerCount, syncedAt, options = {}) {
  const host = options.host || "";
  const isLocal = /localhost|127\.0\.0\.1/.test(host);
  const syncedLabel = syncedAt ? new Date(syncedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const examplesJson = JSON.stringify(DEMO_EXAMPLES);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Deserved — Glasgow directory demo. Route free-text needs to validated problem-solvers." />
  <title>Deserved — Glasgow directory demo</title>
  <style>
    :root {
      --bg: #0f1412;
      --surface: #1a221e;
      --surface-2: #243029;
      --border: #2f3d36;
      --text: #eef2ef;
      --muted: #9aaba3;
      --accent: #6ee7b7;
      --accent-dim: #34d399;
      --warn: #fbbf24;
      --danger: #f87171;
      --radius: 10px;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: var(--text);
      background: var(--bg);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(52, 211, 153, 0.12), transparent),
        var(--bg);
    }
    .wrap { max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    header { margin-bottom: 2rem; }
    .eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0 0 0.5rem;
    }
    h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 700; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
    .lede { color: var(--muted); font-size: 1.05rem; max-width: 38rem; margin: 0 0 1.25rem; }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.5rem 0.85rem;
      font-size: 0.85rem;
    }
    .stat strong { color: var(--accent); }
    .links { font-size: 0.85rem; }
    .links a { color: var(--accent-dim); margin-right: 1rem; text-decoration: none; }
    .links a:hover { text-decoration: underline; }
    .local-tip {
      font-size: 0.8rem;
      color: var(--warn);
      background: rgba(251, 191, 36, 0.08);
      border: 1px solid rgba(251, 191, 36, 0.25);
      border-radius: var(--radius);
      padding: 0.65rem 0.85rem;
      margin-top: 0.75rem;
    }
    section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    section h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 1rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .chip {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 999px;
      padding: 0.4rem 0.85rem;
      font-size: 0.82rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .chip:hover, .chip.active { border-color: var(--accent-dim); background: rgba(52, 211, 153, 0.1); }
    .chip small { display: block; color: var(--muted); font-size: 0.7rem; margin-top: 0.1rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-top: 0.85rem; color: var(--muted); }
    label:first-of-type { margin-top: 0; }
    input, textarea, select, button { width: 100%; font: inherit; }
    textarea, input, select {
      margin-top: 0.35rem;
      padding: 0.65rem 0.75rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
    }
    textarea { min-height: 5.5rem; resize: vertical; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    @media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
    .primary {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(180deg, var(--accent-dim), #059669);
      color: #042f1a;
      font-weight: 700;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
    }
    .primary:hover { filter: brightness(1.05); }
    .primary:disabled { opacity: 0.6; cursor: wait; }
    #result-empty { color: var(--muted); font-size: 0.95rem; }
    .card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .card h3 { margin: 0 0 0.35rem; font-size: 1rem; }
    .card .provider { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
    .card .outcome { font-size: 0.9rem; margin-bottom: 0.75rem; }
    .badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.35rem;
      margin-bottom: 0.35rem;
    }
    .badge-live { background: rgba(52, 211, 153, 0.2); color: var(--accent); }
    .badge-stub { background: rgba(251, 191, 36, 0.15); color: var(--warn); }
    .badge-slug { background: var(--surface-2); color: var(--muted); }
    .confidence { height: 6px; background: var(--surface-2); border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
    .confidence span { display: block; height: 100%; background: var(--accent-dim); border-radius: 3px; }
    .friction {
      border-color: rgba(251, 191, 36, 0.4);
      background: rgba(251, 191, 36, 0.06);
    }
    .friction h3 { color: var(--warn); }
    .classify-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .classify-grid dt { color: var(--muted); margin: 0; }
    .classify-grid dd { margin: 0 0 0.5rem; font-weight: 600; }
    details { margin-top: 1rem; }
    details summary { cursor: pointer; color: var(--muted); font-size: 0.85rem; }
    pre {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.85rem;
      overflow: auto;
      font-size: 0.72rem;
      white-space: pre-wrap;
      color: var(--muted);
      margin-top: 0.5rem;
    }
    .error { color: var(--danger); }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <p class="eyebrow">RouteQuery demo · Glasgow MVP</p>
      <h1>Deserved directory</h1>
      <p class="lede">Describe a problem in plain language. Doctrine classifies the need, filters eligible cells, and ranks validated Offers — or surfaces routing friction when a stub cell isn't live yet.</p>
      <div class="stats">
        <span class="stat"><strong>${offerCount}</strong> Offers</span>
        <span class="stat"><strong>3</strong> providers</span>
        <span class="stat">Synced <strong>${syncedLabel}</strong></span>
      </div>
      <p class="links">
        <a href="/offers">Catalog</a>
        <a href="/api">API</a>
        <a href="/healthz">Health</a>
        <a href="https://github.com/mrgrantfinlay/deserved" rel="noopener">GitHub</a>
      </p>
      ${isLocal ? `<p class="local-tip">Local dev: use <code>http://127.0.0.1:8787/ui</code> (HTTP only — Wrangler does not serve TLS locally).</p>` : ""}
    </header>

    <section aria-labelledby="try-heading">
      <h2 id="try-heading">Try a scenario</h2>
      <div class="chips" id="chips"></div>
      <form id="route-form">
        <label for="need">What do you need help with?</label>
        <textarea id="need" name="need_description" required placeholder="e.g. Lower back pain keeping me awake…"></textarea>
        <div class="row">
          <div>
            <label for="location">Location</label>
            <input id="location" name="location" value="Glasgow" autocomplete="address-level2" />
          </div>
          <div>
            <label for="urgency">Urgency</label>
            <select id="urgency" name="urgency">
              <option value="flexible">Flexible</option>
              <option value="week" selected>This week</option>
              <option value="24h">Within 24h</option>
              <option value="immediate">Today / urgent</option>
            </select>
          </div>
        </div>
        <button type="submit" class="primary" id="submit-btn">Route → Match[]</button>
      </form>
    </section>

    <section aria-labelledby="result-heading">
      <h2 id="result-heading">Result</h2>
      <div id="result-view"><p id="result-empty">Pick a scenario or submit the form.</p></div>
      <details id="raw-details" hidden>
        <summary>Raw JSON</summary>
        <pre id="raw-json"></pre>
      </details>
    </section>
  </div>

  <script>
    const EXAMPLES = ${examplesJson};

    function pct(n) {
      return Math.min(100, Math.round((Number(n) || 0) * 100));
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderResult(data) {
      const view = document.getElementById("result-view");
      const raw = document.getElementById("raw-json");
      const details = document.getElementById("raw-details");
      raw.textContent = JSON.stringify(data, null, 2);
      details.hidden = false;

      if (!data.ok) {
        view.innerHTML = '<p class="error">' + escapeHtml(data.error || "Route failed") + "</p>";
        return;
      }

      const intake = data.intake || {};
      const matches = data.matches || [];
      const meta = data.meta || {};
      const friction = meta.routing_friction;

      let html = '<div class="card"><h3>Classification</h3><dl class="classify-grid">';
      html += "<dt>Need</dt><dd>" + escapeHtml(intake.need_type || "—") + "</dd>";
      html += "<dt>Problem</dt><dd>" + escapeHtml(intake.problem_type || "—") + "</dd>";
      if (intake.problem_slug) {
        html += '<dt>problem_slug</dt><dd><span class="badge badge-slug">' + escapeHtml(intake.problem_slug) + "</span></dd>";
      }
      if (intake.classifier) {
        html += "<dt>Classifier</dt><dd>" + escapeHtml(intake.classifier) + "</dd>";
      }
      html += "</dl></div>";

      if (matches.length) {
        html += "<h3 style=\\"margin:0 0 0.75rem;font-size:0.95rem;\\">" + matches.length + " match" + (matches.length === 1 ? "" : "es") + "</h3>";
        for (const m of matches) {
          const conf = pct(m.confidence_score);
          html += '<article class="card">';
          html += '<span class="badge badge-live">routing eligible</span>';
          html += "<h3>" + escapeHtml(m.dream_outcome || m.offer_id) + "</h3>";
          html += '<p class="provider">' + escapeHtml(m.provider_name || m.provider_id) + " · " + escapeHtml(m.offer_id) + "</p>";
          if (m.capabilities_matched && m.capabilities_matched.length) {
            html += '<p class="outcome"><strong>Capabilities:</strong> ' + escapeHtml(m.capabilities_matched.join(", ")) + "</p>";
          }
          html += "<p class=\\"outcome\\">Confidence " + conf + "% · resonance " + escapeHtml(String(m.resonance ?? "—")) + " · trust " + escapeHtml(String(m.trust_score ?? "—")) + "</p>";
          html += "<div class=\\"confidence\\" title=\\"confidence_score\\"><span style=\\"width:" + conf + "%\\"></span></div>";
          html += "</article>";
        }
      } else if (friction) {
        html += '<article class="card friction">';
        html += '<span class="badge badge-stub">no live match</span>';
        html += "<h3>Routing friction</h3>";
        html += "<p>Classified as <strong>" + escapeHtml(friction.problem_slug) + "</strong> but no routing-eligible Offer is live yet.</p>";
        html += "<p class=\\"outcome\\">Default stub: <code>" + escapeHtml(friction.default_offer_id) + "</code></p>";
        if (friction.providers_with_capability && friction.providers_with_capability.length) {
          html += "<p class=\\"outcome\\">Providers with capability: " + escapeHtml(friction.providers_with_capability.join(", ")) + "</p>";
        }
        html += "<p class=\\"outcome\\" style=\\"color:var(--muted);font-size:0.85rem\\">Portable signal for doctrine — flip <code>routing_eligible: true</code> when the cell graduates.</p>";
        html += "</article>";
      } else {
        html += '<p id="result-empty">No matches. Try a different description or check <a href="/offers">/offers</a>.</p>';
      }

      view.innerHTML = html;
    }

    async function runRoute() {
      const btn = document.getElementById("submit-btn");
      const view = document.getElementById("result-view");
      btn.disabled = true;
      view.innerHTML = "<p id=\\"result-empty\\">Routing…</p>";
      const body = {
        need_description: document.getElementById("need").value,
        location: document.getElementById("location").value,
        urgency: document.getElementById("urgency").value,
        routing_source: "human",
      };
      try {
        const res = await fetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        renderResult(await res.json());
      } catch (err) {
        view.innerHTML = '<p class="error">' + escapeHtml(String(err)) + "</p>";
      } finally {
        btn.disabled = false;
      }
    }

    function applyExample(ex, idx) {
      document.getElementById("need").value = ex.need;
      document.getElementById("location").value = ex.location;
      document.getElementById("urgency").value = ex.urgency;
      document.querySelectorAll(".chip").forEach((el, i) => el.classList.toggle("active", i === idx));
    }

    const chips = document.getElementById("chips");
    EXAMPLES.forEach((ex, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.innerHTML = escapeHtml(ex.label) + "<small>" + escapeHtml(ex.hint) + "</small>";
      b.addEventListener("click", () => {
        applyExample(ex, i);
        runRoute();
      });
      chips.appendChild(b);
    });

    document.getElementById("route-form").addEventListener("submit", (e) => {
      e.preventDefault();
      document.querySelectorAll(".chip").forEach((el) => el.classList.remove("active"));
      runRoute();
    });

    applyExample(EXAMPLES[0], 0);
    runRoute();
  </script>
</body>
</html>`;
}
