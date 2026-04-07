import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return Response.json(
      {
        ok: false,
        error: "Database unavailable",
        detail: message,
      },
      { status: 503 },
    );
  }
};
