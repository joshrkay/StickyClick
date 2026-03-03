import type { FeatureTier } from "../billing.server";
import type { SettingsOutput } from "../schemas/settings";

/**
 * Sanitize settings by forcing gated features to their disabled values
 * for the given tier. This prevents false positives where DB defaults
 * enable features the user's tier doesn't support.
 */
export function sanitizeSettingsForTier(
  tier: FeatureTier,
  data: SettingsOutput,
): SettingsOutput {
  const sanitized = { ...data };

  if (tier === "basic") {
    sanitized.upsellEnabled = false;
    sanitized.quickBuyEnabled = false;
    sanitized.showCartSummary = false;
    sanitized.showFreeShippingBar = false;
  }

  if (tier !== "premium") {
    sanitized.enableQuantitySelector = false;
    sanitized.openCartDrawer = false;
  }

  return sanitized;
}
