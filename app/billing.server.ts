import { authenticate, PREMIUM_PLAN, PRO_PLAN } from "./shopify.server";

export type FeatureTier = "basic" | "pro" | "premium";

const isTestMode = process.env.NODE_ENV !== "production";

export async function requireSubscription(request: Request) {
  const { billing } = await authenticate.admin(request);

  await billing.require({
    plans: [PRO_PLAN, PREMIUM_PLAN],
    onFailure: async () =>
      billing.request({ plan: PRO_PLAN, isTest: isTestMode }),
  });
}

export async function getFeatureTier(request: Request): Promise<FeatureTier> {
  const { billing } = await authenticate.admin(request);

  const { appSubscriptions } = await billing.check({
    plans: [PRO_PLAN, PREMIUM_PLAN],
    isTest: isTestMode,
  });

  if (appSubscriptions.some((sub) => sub.name === PREMIUM_PLAN)) {
    return "premium";
  }

  if (appSubscriptions.some((sub) => sub.name === PRO_PLAN)) {
    return "pro";
  }

  return "basic";
}

export async function hasActiveSubscription(request: Request) {
  const tier = await getFeatureTier(request);
  return tier !== "basic";
}
