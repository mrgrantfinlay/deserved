const PROBLEM_LABELS = {
  "back-pain": "Back or neck pain",
  "stress-burnout": "Stress and burnout",
  "pregnancy-comfort": "Pregnancy comfort",
};

const BOOK_URLS = {
  "deserved-massage": "https://deservedmassage.com",
};

export function homeHtml() {
  const problemLabelsJson = JSON.stringify(PROBLEM_LABELS);
  const bookUrlsJson = JSON.stringify(BOOK_URLS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Deserved — validated problem-solvers in Glasgow." />
  <title>Deserved</title>
  <style>
    :root {
      --text: #111;
      --muted: #666;
      --border: #ddd;
      --radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: var(--text);
      background: #fff;
    }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main {
      max-width: 32rem;
      margin: 0 auto;
      padding: 4rem 1.25rem 3rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0 0 0.35rem;
    }
    .tagline {
      margin: 0 0 2rem;
      color: var(--muted);
      font-size: 1rem;
    }
    textarea {
      width: 100%;
      min-height: 6rem;
      padding: 0.75rem;
      font: inherit;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      resize: vertical;
    }
    textarea:focus {
      outline: 2px solid #111;
      outline-offset: 1px;
      border-color: #111;
    }
    button {
      margin-top: 0.75rem;
      padding: 0.65rem 1.25rem;
      font: inherit;
      font-weight: 500;
      color: #fff;
      background: #111;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
    }
    button:hover { background: #333; }
    button:disabled { opacity: 0.5; cursor: wait; }
    #out { margin-top: 2rem; }
    #out:empty { display: none; }
    .result { padding-top: 0.25rem; }
    .result h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }
    .result p {
      margin: 0 0 1rem;
      color: var(--muted);
    }
    .result a {
      color: #111;
      font-weight: 500;
    }
    .error { color: #b00020; }
    .foot {
      margin-top: 3rem;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .foot a { color: inherit; }
  </style>
</head>
<body>
  <main>
    <h1>Deserved</h1>
    <p class="tagline">Validated problem-solvers in Glasgow.</p>
    <form id="f">
      <textarea id="q" name="q" required placeholder="Describe what's going wrong…" aria-label="Describe your problem"></textarea>
      <button type="submit" id="go">Find a match</button>
    </form>
    <div id="out" aria-live="polite"></div>
    <p class="foot"><a href="/api">API</a></p>
  </main>
  <script>
    const PROBLEM_LABELS = ${problemLabelsJson};
    const BOOK_URLS = ${bookUrlsJson};

    function esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function label(slug) {
      return PROBLEM_LABELS[slug] || (slug || "").replace(/-/g, " ");
    }

    function render(data) {
      const out = document.getElementById("out");
      if (!data.ok) {
        out.innerHTML = '<p class="error">' + esc(data.error || "Request failed") + "</p>";
        return;
      }

      const slug = data.intake && data.intake.problem_slug;
      const matches = data.matches || [];
      const friction = data.meta && data.meta.routing_friction;

      if (matches.length) {
        const m = matches[0];
        const book = BOOK_URLS[m.provider_id];
        let html = '<div class="result">';
        html += "<h2>" + esc(m.provider_name || m.provider_id) + "</h2>";
        html += "<p>" + esc(m.dream_outcome || "") + "</p>";
        if (book) {
          html += '<p><a href="' + esc(book) + '" rel="noopener" target="_blank">Book</a></p>';
        }
        html += "</div>";
        out.innerHTML = html;
        return;
      }

      if (friction && slug) {
        out.innerHTML =
          '<div class="result"><p>We understand this as <strong>' +
          esc(label(slug)) +
          "</strong>. No validated match in Glasgow yet.</p></div>";
        return;
      }

      out.innerHTML = '<p class="result">No match yet. Try describing your problem differently.</p>';
    }

    document.getElementById("f").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("go");
      const out = document.getElementById("out");
      btn.disabled = true;
      out.textContent = "";
      try {
        const res = await fetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            need_description: document.getElementById("q").value,
            location: "Glasgow",
            routing_source: "human",
          }),
        });
        render(await res.json());
      } catch (err) {
        out.innerHTML = '<p class="error">' + esc(err) + "</p>";
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}
