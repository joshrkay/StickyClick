import type { SettingsOutput } from "../schemas/settings";

const SETTINGS_FIELDS = [
  "enabled",
  "primaryColor",
  "textColor",
  "buttonText",
  "position",
  "upsellEnabled",
  "upsellProductId",
  "quickBuyEnabled",
  "showCartSummary",
  "enableQuantitySelector",
  "openCartDrawer",
  "showFreeShippingBar",
  "freeShippingGoal",
  "countdownEnabled",
  "countdownEndTime",
  "countdownDuration",
  "countdownText",
  "trustBadgesEnabled",
  "trustBadgesList",
  "trustBadgesStyle",
  "analyticsEnabled",
] as const satisfies readonly (keyof SettingsOutput)[];

export function pickSettings(obj: Record<string, unknown>): SettingsOutput {
  const result = {} as Record<string, unknown>;
  for (const key of SETTINGS_FIELDS) {
    result[key] = obj[key];
  }
  return result as SettingsOutput;
}
