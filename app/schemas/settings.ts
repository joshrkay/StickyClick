import { z } from "zod";

const VALID_BADGES = [
  "secure_checkout",
  "money_back",
  "free_returns",
  "fast_shipping",
  "satisfaction_guaranteed",
  "ssl_encrypted",
] as const;

const badgePattern = new RegExp(
  `^(${VALID_BADGES.join("|")})(,(${VALID_BADGES.join("|")}))*$`,
);

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
  countdownEnabled: z.string().transform((val) => val === "true"),
  countdownEndTime: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }),
  countdownDuration: z
    .string()
    .transform((val) => Math.max(0, Math.min(86400, parseInt(val, 10) || 0))),
  countdownText: z.string().min(1).max(50),
  trustBadgesEnabled: z.string().transform((val) => val === "true"),
  trustBadgesList: z
    .string()
    .regex(badgePattern, "Invalid badge selection")
    .default("secure_checkout,money_back"),
  trustBadgesStyle: z.enum(["icon_only", "icon_text", "text_only"]),
  analyticsEnabled: z.string().transform((val) => val === "true"),
  lowStockEnabled: z.string().transform((val) => val === "true"),
  lowStockThreshold: z
    .string()
    .transform((val) => Math.max(1, Math.min(999, parseInt(val, 10) || 10))),
  showDiscountBadge: z.string().transform((val) => val === "true"),
  smartUpsellEnabled: z.string().transform((val) => val === "true"),
  smartUpsellStrategy: z.enum([
    "same_collection",
    "best_selling",
    "highest_price",
  ]),
  multiCurrencyEnabled: z.string().transform((val) => val === "true"),
});

export type SettingsOutput = z.output<typeof SettingsSchema>;
