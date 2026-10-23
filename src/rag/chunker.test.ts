
import { describe, expect, it } from "vitest";
import { chunkDocument } from "./chunker.js";

describe("chunkDocument", () => {
  it("splits a document into overlapping chunks", () => {
    const document = {
      id: "doc-1",
      source: "modular-monolith.md",
      content: "A".repeat(900)
    };

    const chunks = chunkDocument(document, 500, 100);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toHaveLength(500);
    expect(chunks[1].content).toHaveLength(500);
    expect(chunks[0].content.slice(-100)).toBe(
      chunks[1].content.slice(0, 100)
    );
    expect(chunks[0].source).toBe("modular-monolith.md");
  });

  it("returns no chunks for an empty document", () => {
    const chunks = chunkDocument({
      id: "doc-2",
      source: "empty.md",
      content: "   "
    });

    expect(chunks).toEqual([]);
  });

  it("rejects invalid chunk settings", () => {
    const document = {
      id: "doc-3",
      source: "test.md",
      content: "Example content"
    };

    expect(() => chunkDocument(document, 0, 0)).toThrow();
    expect(() => chunkDocument(document, 100, 100)).toThrow();
  });
});
