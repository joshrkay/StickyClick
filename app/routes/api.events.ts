import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { z } from "zod";

const EventSchema = z.object({
  shop: z.string().min(1),
  eventType: z.enum(["impression", "click", "add_to_cart"]),
  variantId: z.string().nullable().optional(),
  value: z.number().int().min(0).default(0),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const result = EventSchema.safeParse(body);
    if (!result.success) {
      return new Response("Invalid event data", { status: 400 });
    }

    const settings = await prisma.shopSettings.findUnique({
      where: { shop: result.data.shop },
      select: { analyticsEnabled: true },
    });

    if (!settings?.analyticsEnabled) {
      return new Response("OK", { status: 200 });
    }

    await prisma.stickyClickEvent.create({
      data: {
        shop: result.data.shop,
        eventType: result.data.eventType,
        variantId: result.data.variantId ?? null,
        value: result.data.value,
      },
    });

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Server error", { status: 500 });
  }
};
