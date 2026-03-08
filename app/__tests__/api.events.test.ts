import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db.server", () => ({
  default: {
    shopSettings: {
      findUnique: vi.fn(),
    },
    stickyClickEvent: {
      create: vi.fn(),
    },
  },
}));

import { action } from "../routes/api.events";
import db from "../db.server";

const mockFindUnique = vi.mocked(db.shopSettings.findUnique);
const mockCreate = vi.mocked(db.stickyClickEvent.create);

function jsonRequest(
  body: unknown,
  method = "POST",
): Request {
  return new Request("https://example.com/api/events", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  shop: "test-shop.myshopify.com",
  eventType: "click",
  variantId: "12345",
  value: 0,
};

describe("api.events action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST methods", async () => {
    const request = new Request("https://example.com/api/events", {
      method: "GET",
    });
    const response = await action({ request, params: {}, context: {} } as never);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(405);
  });

  it("returns 400 for invalid event data (missing shop)", async () => {
    const request = jsonRequest({ eventType: "click" });
    const response = await action({ request, params: {}, context: {} } as never);
    expect((response as Response).status).toBe(400);
  });

  it("returns 400 for invalid eventType", async () => {
    const request = jsonRequest({ ...validPayload, eventType: "invalid" });
    const response = await action({ request, params: {}, context: {} } as never);
    expect((response as Response).status).toBe(400);
  });

  it("returns 200 and skips DB write when analytics is disabled", async () => {
    mockFindUnique.mockResolvedValue({ analyticsEnabled: false } as never);

    const request = jsonRequest(validPayload);
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { shop: "test-shop.myshopify.com" },
      select: { analyticsEnabled: true },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 200 and skips DB write when shop settings not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const request = jsonRequest(validPayload);
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 200 and creates event when analytics is enabled", async () => {
    mockFindUnique.mockResolvedValue({ analyticsEnabled: true } as never);
    mockCreate.mockResolvedValue({} as never);

    const request = jsonRequest(validPayload);
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        shop: "test-shop.myshopify.com",
        eventType: "click",
        variantId: "12345",
        value: 0,
      },
    });
  });

  it("stores null variantId when not provided", async () => {
    mockFindUnique.mockResolvedValue({ analyticsEnabled: true } as never);
    mockCreate.mockResolvedValue({} as never);

    const request = jsonRequest({
      shop: "test-shop.myshopify.com",
      eventType: "impression",
    });
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        shop: "test-shop.myshopify.com",
        eventType: "impression",
        variantId: null,
        value: 0,
      },
    });
  });

  it("accepts add_to_cart eventType with value", async () => {
    mockFindUnique.mockResolvedValue({ analyticsEnabled: true } as never);
    mockCreate.mockResolvedValue({} as never);

    const request = jsonRequest({
      ...validPayload,
      eventType: "add_to_cart",
      value: 2500,
    });
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "add_to_cart",
        value: 2500,
      }),
    });
  });

  it("returns 500 on unexpected errors", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB connection failed"));

    const request = jsonRequest(validPayload);
    const response = await action({ request, params: {}, context: {} } as never);

    expect((response as Response).status).toBe(500);
  });
});
