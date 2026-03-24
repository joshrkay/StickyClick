import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

import { action } from "../routes/webhooks.customers.data_request";
import { authenticate } from "../shopify.server";

const mockWebhook = vi.mocked(authenticate.webhook);

describe("webhooks.customers.data_request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 after authenticating webhook", async () => {
    mockWebhook.mockResolvedValue({
      shop: "demo.myshopify.com",
      topic: "CUSTOMERS_DATA_REQUEST",
      payload: {},
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    const res = await action({ request, params: {}, context: {} } as never);

    expect(mockWebhook).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
