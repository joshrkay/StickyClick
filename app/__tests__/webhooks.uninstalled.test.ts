import { describe, it, expect, vi, beforeEach } from "vitest";

const { sessionDeleteMany, stickyEventDeleteMany, shopSettingsDeleteMany, mockTransaction } = vi.hoisted(() => {
  return {
    sessionDeleteMany: vi.fn(),
    stickyEventDeleteMany: vi.fn(),
    shopSettingsDeleteMany: vi.fn(),
    mockTransaction: vi.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
  };
});

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

vi.mock("../db.server", () => ({
  default: {
    session: {
      deleteMany: sessionDeleteMany,
    },
    stickyClickEvent: {
      deleteMany: stickyEventDeleteMany,
    },
    shopSettings: {
      deleteMany: shopSettingsDeleteMany,
    },
    $transaction: mockTransaction,
  },
}));

import { action } from "../routes/webhooks.app.uninstalled";
import { authenticate } from "../shopify.server";

const mockWebhook = vi.mocked(authenticate.webhook);

describe("webhooks.app.uninstalled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes shop data and sessions when session and admin exist", async () => {
    const mockGraphql = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ data: { shop: { id: "gid://shopify/Shop/1" } } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: { metafieldsDelete: { userErrors: [] } } }),
      });

    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: { id: "session-1" },
      topic: "APP_UNINSTALLED",
      admin: { graphql: mockGraphql },
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockTransaction).toHaveBeenCalled();
    expect(sessionDeleteMany).toHaveBeenCalledWith({
      where: { shop: "test-shop.myshopify.com" },
    });
  });

  it("still deletes persisted data when session is null", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: undefined,
      topic: "APP_UNINSTALLED",
      admin: undefined,
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    await action({ request, params: {}, context: {} } as never);

    expect(mockTransaction).toHaveBeenCalled();
    expect(sessionDeleteMany).not.toHaveBeenCalled();
  });

  it("returns a Response", async () => {
    mockWebhook.mockResolvedValue({
      shop: "test-shop.myshopify.com",
      session: undefined,
      topic: "APP_UNINSTALLED",
    } as never);

    const request = new Request("https://example.com", { method: "POST" });
    const response = await action({ request, params: {}, context: {} } as never);

    expect(response).toBeInstanceOf(Response);
  });
});
