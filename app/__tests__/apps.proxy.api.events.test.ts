import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

vi.mock("../event-ingest.server", () => ({
  ingestStickyClickEvent: vi.fn(),
}));

import { action } from "../routes/apps.proxy.api.events";
import { authenticate } from "../shopify.server";
import { ingestStickyClickEvent } from "../event-ingest.server";

const mockAppProxy = vi.mocked(authenticate.public.appProxy);
const mockIngest = vi.mocked(ingestStickyClickEvent);

describe("apps.proxy.api.events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppProxy.mockResolvedValue({} as never);
    mockIngest.mockResolvedValue({ ok: true, status: 200 });
  });

  it("rejects non-POST", async () => {
    const request = new Request("https://example.com/apps/proxy/api/events", { method: "GET" });
    const res = await action({ request, params: {}, context: {} } as never);
    expect(res.status).toBe(405);
    expect(mockAppProxy).not.toHaveBeenCalled();
  });

  it("ingests after app proxy auth", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const url = `https://example.com/apps/proxy/api/events?shop=demo.myshopify.com&timestamp=${ts}&signature=abc`;
    const body = {
      shop: "demo.myshopify.com",
      eventType: "click",
      value: 0,
    };
    const request = new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await action({ request, params: {}, context: {} } as never);

    expect(mockAppProxy).toHaveBeenCalled();
    expect(mockIngest).toHaveBeenCalledWith(body, "demo.myshopify.com");
    expect(res.status).toBe(200);
  });
});
