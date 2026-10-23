
import { describe, expect, it, vi } from "vitest";
import { ArchitectureService } from "./architecture-service.js";
import type { AIProvider } from "./ai-provider.js";
import { buildServer } from "./server.js";

describe("Architecture API", () => {
  it("returns an AI answer for a valid request", async () => {
    const provider: AIProvider = {
      answer: vi.fn().mockResolvedValue(
        "Start with a modular monolith when simplicity matters."
      )
    };

    const app = buildServer({
      service: new ArchitectureService(provider)
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/architecture/answer",
        payload: {
          question: "When should I use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        answer:
          "Start with a modular monolith when simplicity matters."
      });
      expect(provider.answer).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it("rejects an empty question", async () => {
    const provider: AIProvider = {
      answer: vi.fn().mockResolvedValue("Unexpected")
    };

    const app = buildServer({
      service: new ArchitectureService(provider)
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/architecture/answer",
        payload: { question: "" }
      });

      expect(response.statusCode).toBe(400);
      expect(provider.answer).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
