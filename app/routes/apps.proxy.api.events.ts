import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ingestStickyClickEvent } from "../event-ingest.server";

const MAX_PROXY_AGE_SEC = 300;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const ts = url.searchParams.get("timestamp");
  if (!shop) {
    return new Response("Bad Request", { status: 400 });
  }
  if (ts) {
    const nowSec = Date.now() / 1000;
    const age = Math.abs(nowSec - Number(ts));
    if (!Number.isFinite(age) || age > MAX_PROXY_AGE_SEC) {
      return new Response("Request expired", { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const result = await ingestStickyClickEvent(body, shop);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  return new Response("OK", { status: 200 });
};
