
import { describe, expect, it } from "vitest";
import { retrieveChunks } from "./retriever.js";
import type { DocumentChunk } from "./types.js";

const chunks: DocumentChunk[] = [
  {
    id: "mono-1",
    documentId: "mono",
    source: "modular-monolith.md",
    content:
      "A modular monolith simplifies deployment and maintains clear business module boundaries."
  },
  {
    id: "micro-1",
    documentId: "micro",
    source: "microservices.md",
    content:
      "Microservices support independent deployment and scaling, but introduce distributed systems complexity."
  },
  {
    id: "database-1",
    documentId: "database",
    source: "database.md",
    content:
      "Database indexes improve query performance by reducing the amount of data scanned."
  }
];

describe("retrieveChunks", () => {
  it("returns the most relevant matching passage", () => {
    const results = retrieveChunks(
      "modular monolith deployment",
      chunks
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("modular-monolith.md");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns results in descending score order", () => {
    const results = retrieveChunks("deployment scaling", chunks);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(
        results[i].score
      );
    }
  });

  it("respects the result limit", () => {
    expect(retrieveChunks("deployment", chunks, 1)).toHaveLength(1);
  });

  it("returns no results when there are no matches", () => {
    expect(
      retrieveChunks("quantum astronomy", chunks)
    ).toEqual([]);
  });

  it("returns no results for an empty question", () => {
    expect(retrieveChunks("   ", chunks)).toEqual([]);
  });
});
