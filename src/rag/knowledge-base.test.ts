
import { describe, expect, it } from "vitest";
import { createKnowledgeBase } from "./knowledge-base.js";

describe("knowledge base integration", () => {
  it("loads real documents and retrieves relevant passages", async () => {
    const knowledgeBase = await createKnowledgeBase();

    expect(knowledgeBase.getChunkCount()).toBeGreaterThan(0);

    const results = knowledgeBase.retrieve(
      "When should I use a modular monolith?"
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(
      (chunk) => chunk.source === "modular-monolith.md"
    )).toBe(true);
  });
});
