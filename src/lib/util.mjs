export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export function errorResponse(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

export async function readJson(request, maxBytes = 32_768) {
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new Error(`Body exceeds ${maxBytes} bytes`);
  }
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export function newId(prefix) {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${prefix}_${hex}`;
}
