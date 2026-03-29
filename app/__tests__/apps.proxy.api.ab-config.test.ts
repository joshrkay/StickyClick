import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

const { mockABTestFindFirst } = vi.hoisted(() => ({
  mockABTestFindFirst: vi.fn(),
}));

vi.mock("../db.server", () => ({
  default: {
    aBTest: {
      findFirst: mockABTestFindFirst,
    },
  },
}));

import { loader } from "../routes/apps.proxy.api.ab-config";
import { authenticate } from "../shopify.server";

const mockAppProxy = vi.mocked(authenticate.public.appProxy);

function makeRequest(shop?: string) {
  const url = shop
    ? `https://example.com/apps/proxy/api/ab-config?shop=${shop}`
    : "https://example.com/apps/proxy/api/ab-config";
  return new Request(url);
}

const runningTest = {
  id: 42,
  shop: "test.myshopify.com",
  name: "Button color test",
  status: "running",
  variantAConfig: JSON.stringify({ primaryColor: "#000000", buttonText: "Add to Cart" }),
  variantBConfig: JSON.stringify({ primaryColor: "#1d4ed8", buttonText: "Buy Now" }),
  startDate: new Date("2026-03-01"),
  endDate: null,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
};

describe("apps.proxy.api.ab-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppProxy.mockResolvedValue({} as never);
  });

  it("returns null variant when no shop param", async () => {
    const request = makeRequest();
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ variant: null, config: null });
    expect(mockABTestFindFirst).not.toHaveBeenCalled();
  });

  it("returns null variant when no running test exists", async () => {
    mockABTestFindFirst.mockResolvedValue(null);
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ variant: null, config: null });
  });

  it("queries only running tests for the given shop", async () => {
    mockABTestFindFirst.mockResolvedValue(null);
    const request = makeRequest("test.myshopify.com");
    await loader({ request, params: {}, context: {} } as never);
    expect(mockABTestFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shop: "test.myshopify.com", status: "running" },
      }),
    );
  });

  it("returns both variant configs when a running test exists", async () => {
    mockABTestFindFirst.mockResolvedValue(runningTest);
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json.testId).toBe(42);
    expect(json.variantAConfig).toEqual({ primaryColor: "#000000", buttonText: "Add to Cart" });
    expect(json.variantBConfig).toEqual({ primaryColor: "#1d4ed8", buttonText: "Buy Now" });
  });

  it("returns variant A config correctly", async () => {
    mockABTestFindFirst.mockResolvedValue(runningTest);

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json.variantAConfig).toEqual({ primaryColor: "#000000", buttonText: "Add to Cart" });
  });

  it("returns variant B config correctly", async () => {
    mockABTestFindFirst.mockResolvedValue(runningTest);

    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();

    expect(json.variantBConfig).toEqual({ primaryColor: "#1d4ed8", buttonText: "Buy Now" });
  });

  it("uses Cache-Control: no-store", async () => {
    mockABTestFindFirst.mockResolvedValue(runningTest);
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns null variant on DB error", async () => {
    mockABTestFindFirst.mockRejectedValue(new Error("DB connection failed"));
    const request = makeRequest("test.myshopify.com");
    const res = await loader({ request, params: {}, context: {} } as never);
    const json = await res.json();
    expect(json).toEqual({ variant: null, config: null });
  });
});
