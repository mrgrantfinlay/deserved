export function homeHtml(offerCount, syncedAt) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deserved — directory API</title>
  <style>
    :root { font-family: system-ui, sans-serif; line-height: 1.5; color: #111; background: #f6f6f4; }
    body { max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; margin-top: 1rem; }
    input, textarea, select, button { width: 100%; box-sizing: border-box; margin-top: 0.35rem; font: inherit; }
    textarea { min-height: 5rem; }
    button { margin-top: 1rem; padding: 0.65rem 1rem; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #333; }
    pre { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 1rem; overflow: auto; font-size: 0.8rem; white-space: pre-wrap; }
    .links a { margin-right: 1rem; }
  </style>
</head>
<body>
  <h1>Deserved</h1>
  <p class="meta">LLM-queryable directory · ${offerCount} offer(s) synced · ${syncedAt}</p>
  <p class="meta"><strong>Local dev:</strong> use <code>http://127.0.0.1:8787/ui</code> — not <code>https</code> (Wrangler serves plain HTTP).</p>
  <p class="links"><a href="/healthz">/healthz</a><a href="/offers">/offers</a><a href="/api">/api</a></p>

  <form id="route-form">
    <label for="need">What do you need help with?</label>
    <textarea id="need" name="need_description" required>Lower back pain in Glasgow, trouble sleeping</textarea>
    <label for="location">Location</label>
    <input id="location" name="location" value="Glasgow" />
    <label for="urgency">Urgency</label>
    <select id="urgency" name="urgency">
      <option value="flexible">flexible</option>
      <option value="week" selected>this week</option>
      <option value="24h">within 24h</option>
      <option value="immediate">today / urgent</option>
    </select>
    <button type="submit">Route → Match[]</button>
  </form>

  <h2>Result</h2>
  <pre id="out">Submit the form to run POST /route</pre>

  <script>
    document.getElementById("route-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = document.getElementById("out");
      out.textContent = "Routing…";
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
        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        out.textContent = String(err);
      }
    });
  </script>
</body>
</html>`;
}
