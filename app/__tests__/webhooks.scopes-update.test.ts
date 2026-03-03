import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

vi.mock("../db.server", () => ({
  default: {
    session: {
      update: vi.fn(),
    },
  },
}));

import { action } from "../routes/webhooks.app.scopes_update";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const mockWebhook = vi.mocked(authenticate.webhook);
const mockUpdate = vi.mocked(db.session.update);

describe("webhooks.app.scopes_update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates session scope when session exists", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: { id: "session-1" },
      topic: "APP_SCOPES_UPDATE",
      payload: { current: ["read_products", "write_products"] },
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { scope: "read_products,write_products" },
    });
  });

  it("does not update when session is null", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: undefined,
      topic: "APP_SCOPES_UPDATE",
      payload: { current: ["read_products"] },
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
