import { describe, expect, it } from "vitest";
import { createServer } from "../src/index";

describe("mock healthcare api", () => {
  it("returns health status", async () => {
    const server = createServer();
    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      syntheticDataOnly: true,
    });
  });
});
