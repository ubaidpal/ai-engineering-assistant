import { describe, expect, it } from "vitest";
import { evaluateRetrieval } from "./retrieval-metrics.js";
import type { RetrievedChunk } from "./types.js";

const results: RetrievedChunk[] = [
  {
    id: "a",
    documentId: "micro",
    source: "microservices.md",
    content: "Independent deployment",
    score: 0.95
  },
  {
    id: "b",
    documentId: "mono",
    source: "modular-monolith.md",
    content: "Simpler deployment",
    score: 0.82
  },
  {
    id: "c",
    documentId: "micro",
    source: "microservices.md",
    content: "Independent scaling",
    score: 0.72
  }
];

describe("evaluateRetrieval", () => {
  it("calculates recall and reciprocal rank", () => {
    const metrics = evaluateRetrieval(
      results,
      ["modular-monolith.md"],
      3
    );

    expect(metrics.recallAtK).toBe(1);
    expect(metrics.reciprocalRank).toBe(0.5);
  });

  it("returns zero when no relevant source is retrieved", () => {
    const metrics = evaluateRetrieval(results, ["unknown.md"], 3);

    expect(metrics.recallAtK).toBe(0);
    expect(metrics.reciprocalRank).toBe(0);
  });

  it("rejects an invalid k", () => {
    expect(() =>
      evaluateRetrieval(results, ["microservices.md"], 0)
    ).toThrow("k must be a positive integer.");
  });
});
