import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../services/mock-healthcare-api/src/index";

import type { FastifyInstance } from "fastify";

describe("checkpoint 1 mock runtime smoke", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = createServer();
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it("starts, resets, changes toggles, ingests events, and can be queried", async () => {
    const health = await getJson("/health");
    expect(health).toMatchObject({
      ok: true,
      service: "mock-healthcare-api",
      syntheticDataOnly: true,
    });

    const reset = await postJson("/demo/reset", {});
    expect(reset).toMatchObject({ ok: true });

    const seededState = await getJson("/demo/state");
    expect(seededState.case.case_id).toBe("case-syn-001");
    expect(seededState.toggles.missing_safety_lab).toBe(false);

    await postJson("/demo/toggles", {
      missing_safety_lab: true,
      payer_api_unavailable: true,
      denial_reason: "safety_screen",
    });

    const toggledState = await getJson("/demo/state");
    expect(
      toggledState.evidenceMappings.find(
        (mapping: { criterion_id: string }) =>
          mapping.criterion_id === "criterion-safety-screen",
      ),
    ).toMatchObject({ status: "missing", artifact_id: null });

    await postJson("/events", {
      event_id: "event-smoke-test",
      case_id: "case-syn-001",
      actor_type: "api_workflow",
      actor_name: "Vitest smoke",
      task_or_agent_name: "checkpoint-smoke.test",
      action: "smoke_event_ingested",
      input_summary: "Synthetic test event.",
      output_summary: "Event listed in demo state.",
      evidence_refs: [],
      timestamp: "2026-06-28T22:15:00.000Z",
    });

    const eventState = await getJson("/demo/state");
    expect(
      eventState.events.some(
        (event: { event_id: string }) => event.event_id === "event-smoke-test",
      ),
    ).toBe(true);

    await postJson("/demo/reset", {});
    const cleanState = await getJson("/demo/state");
    expect(cleanState.toggles.missing_safety_lab).toBe(false);
    expect(
      cleanState.events.some(
        (event: { event_id: string }) => event.event_id === "event-smoke-test",
      ),
    ).toBe(false);
  });

  async function getJson(path: string) {
    const response = await server.inject({ method: "GET", url: path });
    expect(response.statusCode).toBe(200);
    return response.json();
  }

  async function postJson(path: string, body: unknown) {
    const response = await server.inject({
      method: "POST",
      url: path,
      payload: body,
    });
    expect(response.statusCode).toBe(200);
    return response.json();
  }
});
