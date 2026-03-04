import { z } from "zod";

export const SettingsSchema = z.object({
  enabled: z.string().transform((val) => val === "true"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  buttonText: z.string().min(1).max(50),
  position: z.enum(["BOTTOM_RIGHT", "BOTTOM_LEFT"]),
  upsellEnabled: z.string().transform((val) => val === "true"),
  upsellProductId: z
    .string()
    .regex(
      /^(\d+|gid:\/\/shopify\/ProductVariant\/\d+)?$/,
      "Invalid variant ID",
    )
    .optional()
    .nullable(),
  quickBuyEnabled: z.string().transform((val) => val === "true"),
  showCartSummary: z.string().transform((val) => val === "true"),
  enableQuantitySelector: z.string().transform((val) => val === "true"),
  openCartDrawer: z.string().transform((val) => val === "true"),
  showFreeShippingBar: z.string().transform((val) => val === "true"),
  freeShippingGoal: z.string().transform((val) => parseInt(val, 10) || 5000),
});

export type SettingsOutput = z.output<typeof SettingsSchema>;
