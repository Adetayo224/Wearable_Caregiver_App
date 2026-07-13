export function jsonResponse(data: unknown, init?: { status?: number }) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" }
  });
}

export async function withJson<T>(
  handler: () => Promise<T>
): Promise<Response> {
  try {
    const data = await handler();
    return jsonResponse(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: msg }, { status: 500 });
  }
}
