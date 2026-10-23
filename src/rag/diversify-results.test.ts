import { describe, expect, it } from "vitest";
import { diversifyResults } from "./diversify-results.js";
import type { RetrievedChunk } from "./types.js";

const results: RetrievedChunk[] = [
  {
    id: "mono-1",
    documentId: "mono",
    source: "modular-monolith.md",
    content: "Modular monolith deployment",
    score: 0.98
  },
  {
    id: "mono-2",
    documentId: "mono",
    source: "modular-monolith.md",
    content: "Modular monolith boundaries",
    score: 0.95
  },
  {
    id: "micro-1",
    documentId: "micro",
    source: "microservices.md",
    content: "Independent service deployment",
    score: 0.91
  }
];

describe("diversifyResults", () => {
  it("limits the number of chunks from each source", () => {
    const output = diversifyResults(results, 3, 1);

    expect(output.map((chunk) => chunk.id)).toEqual(["mono-1", "micro-1"]);
  });

  it("supports multiple chunks from a source", () => {
    const output = diversifyResults(results, 3, 2);

    expect(output.map((chunk) => chunk.id)).toEqual([
      "mono-1",
      "mono-2",
      "micro-1"
    ]);
  });

  it("rejects invalid limits", () => {
    expect(() => diversifyResults(results, -1)).toThrow(
      "limit must be a non-negative integer."
    );

    expect(() => diversifyResults(results, 3, 0)).toThrow(
      "maxPerSource must be a positive integer."
    );
  });
});
