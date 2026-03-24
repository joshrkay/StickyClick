import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

import { action } from "../routes/webhooks.customers.redact";
import { authenticate } from "../shopify.server";

const mockWebhook = vi.mocked(authenticate.webhook);

describe("webhooks.customers.redact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates and returns 200 (no customer-scoped rows in DB)", async () => {
    mockWebhook.mockResolvedValue({
      shop: "demo.myshopify.com",
      topic: "CUSTOMERS_REDACT",
      payload: {},
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    const res = await action({ request, params: {}, context: {} } as never);

    expect(mockWebhook).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
