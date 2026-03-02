import { authenticate, PRO_PLAN } from "./shopify.server";

export async function requireSubscription(request: Request) {
  const { billing } = await authenticate.admin(request);

  await billing.require({
    plans: [PRO_PLAN],
    onFailure: async () =>
      billing.request({ plan: PRO_PLAN, isTest: true }),
  });
}

export async function hasActiveSubscription(request: Request) {
  const { billing } = await authenticate.admin(request);

  const { hasActivePayment } = await billing.check({
    plans: [PRO_PLAN],
    isTest: true,
  });

  return hasActivePayment;
}
