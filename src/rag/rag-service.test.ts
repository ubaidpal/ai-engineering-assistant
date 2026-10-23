
import { describe, expect, it } from "vitest";
import { RAGService } from "./rag-service.js";

describe("RAGService", () => {
  const service = new RAGService([
    {
      id: "modular-monolith",
      source: "modular-monolith.md",
      content:
        "A modular monolith keeps business modules together in one deployable application. It simplifies deployment and preserves clear module boundaries."
    },
    {
      id: "microservices",
      source: "microservices.md",
      content:
        "Microservices allow independent deployment and scaling. They introduce network communication and distributed systems complexity."
    }
  ]);

  it("creates chunks from the supplied documents", () => {
    expect(service.getChunkCount()).toBeGreaterThan(0);
  });

  it("retrieves a relevant source for a question", () => {
    const results = service.retrieve(
      "Why does a modular monolith simplify deployment?"
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("modular-monolith.md");
  });

  it("returns no results for an unrelated question", () => {
    expect(
      service.retrieve("quantum astronomy")
    ).toEqual([]);
  });
});
