import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    admin: vi.fn(),
  },
  PRO_PLAN: "Pro",
  PREMIUM_PLAN: "Premium",
}));

import { getFeatureTier, hasActiveSubscription } from "../billing.server";
import { authenticate } from "../shopify.server";

const mockAuthenticate = vi.mocked(authenticate.admin);

function mockBilling(subscriptions: { name: string }[]) {
  mockAuthenticate.mockResolvedValue({
    billing: {
      check: vi.fn().mockResolvedValue({ appSubscriptions: subscriptions }),
      require: vi.fn(),
      request: vi.fn(),
    },
  } as never);
}

describe("getFeatureTier", () => {
  const fakeRequest = new Request("https://example.com");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 'premium' when Premium subscription exists", async () => {
    mockBilling([{ name: "Premium" }]);
    expect(await getFeatureTier(fakeRequest)).toBe("premium");
  });

  it("returns 'pro' when Pro subscription exists", async () => {
    mockBilling([{ name: "Pro" }]);
    expect(await getFeatureTier(fakeRequest)).toBe("pro");
  });

  it("returns 'basic' when no subscriptions exist", async () => {
    mockBilling([]);
    expect(await getFeatureTier(fakeRequest)).toBe("basic");
  });

  it("prefers premium when both Pro and Premium exist", async () => {
    mockBilling([{ name: "Pro" }, { name: "Premium" }]);
    expect(await getFeatureTier(fakeRequest)).toBe("premium");
  });
});

describe("hasActiveSubscription", () => {
  const fakeRequest = new Request("https://example.com");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for pro tier", async () => {
    mockBilling([{ name: "Pro" }]);
    expect(await hasActiveSubscription(fakeRequest)).toBe(true);
  });

  it("returns true for premium tier", async () => {
    mockBilling([{ name: "Premium" }]);
    expect(await hasActiveSubscription(fakeRequest)).toBe(true);
  });

  it("returns false for basic tier", async () => {
    mockBilling([]);
    expect(await hasActiveSubscription(fakeRequest)).toBe(false);
  });
});
