import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

const { mockSettingsFindUnique, mockSessionFindFirst } = vi.hoisted(() => ({
  mockSettingsFindUnique: vi.fn(),
  mockSessionFindFirst: vi.fn(),
}));

vi.mock("../db.server", () => ({
  default: {
    shopSettings: {
      findUnique: mockSettingsFindUnique,
    },
    session: {
      findFirst: mockSessionFindFirst,
    },
  },
}));

import { loader } from "../routes/apps.proxy.api.discounts";
import { authenticate } from "../shopify.server";

const mockAppProxy = vi.mocked(authenticate.public.appProxy);

function makeRequest(shop?: string) {
  const url = shop
    ? `https://example.com/apps/proxy/api/discounts?shop=${shop}`
    : "https://example.com/apps/proxy/api/discounts";
  return new Request(url);
}

describe("apps.proxy.api.discounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppProxy.mockResolvedValue({} as never);
  });

  it("returns empty discounts when no shop param", async () => {
    const request = makeRequest();
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ discounts: [] });
    expect(mockSettingsFindUnique).not.toHaveBeenCalled();
  });

  it("returns empty discounts when showDiscountBadge is false", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: false });
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ discounts: [] });
    expect(mockSessionFindFirst).not.toHaveBeenCalled();
  });

  it("returns empty discounts when no settings found", async () => {
    mockSettingsFindUnique.mockResolvedValue(null);
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ discounts: [] });
  });

  it("returns empty discounts when no offline session found", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue(null);
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ discounts: [] });
  });

  it("returns empty discounts when session has no accessToken", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue({ accessToken: null });
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ discounts: [] });
  });

  it("returns discounts from GraphQL when all conditions are met", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue({ accessToken: "shpat_test" });

    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          automaticDiscountNodes: {
            nodes: [
              {
                automaticDiscount: {
                  title: "Summer Sale",
                  summary: "10% off everything",
                  status: "ACTIVE",
                },
              },
              {
                automaticDiscount: {
                  title: "Free Shipping",
                  summary: "Free shipping on orders over $50",
                  status: "ACTIVE",
                },
              },
            ],
          },
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json.discounts).toHaveLength(2);
    expect(json.discounts[0]).toEqual({ title: "Summer Sale", summary: "10% off everything" });
    expect(json.discounts[1]).toEqual({ title: "Free Shipping", summary: "Free shipping on orders over $50" });
    vi.unstubAllGlobals();
  });

  it("applies Cache-Control max-age=300 on successful discount response", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue({ accessToken: "shpat_test" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          automaticDiscountNodes: {
            nodes: [{ automaticDiscount: { title: "Deal", summary: "20% off", status: "ACTIVE" } }],
          },
        },
      }),
    }));

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);

    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
    vi.unstubAllGlobals();
  });

  it("filters out discount nodes with empty titles", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue({ accessToken: "shpat_test" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          automaticDiscountNodes: {
            nodes: [
              { automaticDiscount: { title: "", summary: "no title" } },
              { automaticDiscount: { title: "Valid", summary: "has title" } },
            ],
          },
        },
      }),
    }));

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json.discounts).toHaveLength(1);
    expect(json.discounts[0].title).toBe("Valid");
    vi.unstubAllGlobals();
  });

  it("returns empty discounts on fetch error", async () => {
    mockSettingsFindUnique.mockResolvedValue({ showDiscountBadge: true });
    mockSessionFindFirst.mockResolvedValue({ accessToken: "shpat_test" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json).toEqual({ discounts: [] });
    vi.unstubAllGlobals();
  });
});
