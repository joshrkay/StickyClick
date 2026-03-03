import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

vi.mock("../db.server", () => ({
  default: {
    session: {
      deleteMany: vi.fn(),
    },
  },
}));

import { action } from "../routes/webhooks.app.uninstalled";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const mockWebhook = vi.mocked(authenticate.webhook);
const mockDeleteMany = vi.mocked(db.session.deleteMany);

describe("webhooks.app.uninstalled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes all sessions for the shop when session exists", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: { id: "session-1" },
      topic: "APP_UNINSTALLED",
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { shop: "test-shop.myshopify.com" },
    });
  });

  it("does not delete sessions when session is null", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: undefined,
      topic: "APP_UNINSTALLED",
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("returns a Response", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: { id: "session-1" },
      topic: "APP_UNINSTALLED",
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    const response = await action({ request, params: {}, context: {} } as never);

    expect(response).toBeInstanceOf(Response);
  });
});
