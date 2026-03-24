import prisma from "./db.server";
import { z } from "zod";

const EventSchema = z.object({
  shop: z.string().min(1),
  eventType: z.enum(["impression", "click", "add_to_cart"]),
  variantId: z.string().nullable().optional(),
  value: z.number().int().min(0).default(0),
});

const RATE_WINDOW_MS = 60_000;
const MAX_EVENTS_PER_SHOP_PER_WINDOW = 2000;
const rateBuckets = new Map<string, { windowStart: number; count: number }>();

function allowRateLimit(shop: string): boolean {
  if (rateBuckets.size > 5000) {
    rateBuckets.clear();
  }
  const now = Date.now();
  const bucket = rateBuckets.get(shop);
  if (!bucket || now - bucket.windowStart >= RATE_WINDOW_MS) {
    rateBuckets.set(shop, { windowStart: now, count: 1 });
    return true;
  }
  if (bucket.count >= MAX_EVENTS_PER_SHOP_PER_WINDOW) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export type IngestResult =
  | { ok: true; status: 200 }
  | { ok: false; status: number; message: string };

/**
 * Persists a storefront analytics event after validating payload and shop settings.
 * `shopFromQuery` must be the shop domain from the verified app-proxy query string.
 */
export async function ingestStickyClickEvent(
  body: unknown,
  shopFromQuery: string,
): Promise<IngestResult> {
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid event data" };
  }

  if (parsed.data.shop !== shopFromQuery) {
    return { ok: false, status: 403, message: "Shop mismatch" };
  }

  if (!allowRateLimit(shopFromQuery)) {
    return { ok: false, status: 429, message: "Too many requests" };
  }

  const settings = await prisma.shopSettings.findUnique({
    where: { shop: parsed.data.shop },
    select: { analyticsEnabled: true },
  });

  if (!settings?.analyticsEnabled) {
    return { ok: true, status: 200 };
  }

  await prisma.stickyClickEvent.create({
    data: {
      shop: parsed.data.shop,
      eventType: parsed.data.eventType,
      variantId: parsed.data.variantId ?? null,
      value: parsed.data.value,
    },
  });

  return { ok: true, status: 200 };
}
