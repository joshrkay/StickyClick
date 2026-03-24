import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

vi.mock("../shop-data.server", () => ({
  deleteShopPersistedData: vi.fn(),
}));

import { action } from "../routes/webhooks.shop.redact";
import { authenticate } from "../shopify.server";
import { deleteShopPersistedData } from "../shop-data.server";

const mockWebhook = vi.mocked(authenticate.webhook);
const mockDelete = vi.mocked(deleteShopPersistedData);

describe("webhooks.shop.redact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes persisted shop data", async () => {
    mockWebhook.mockResolvedValue({
      shop: "demo.myshopify.com",
      topic: "SHOP_REDACT",
      payload: {},
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockDelete).toHaveBeenCalledWith("demo.myshopify.com");
  });
});
