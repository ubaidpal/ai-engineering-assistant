import { describe, expect, it, vi } from "vitest";
import { ArchitectureService } from "./architecture-service.js";
import type { RAGAIProvider } from "./rag/rag-ai-provider.js";
import { RAGService } from "./rag/rag-service.js";

const knowledgeBase = new RAGService([
  {
    id: "modular-monolith",
    source: "modular-monolith.md",
    content:
      "A modular monolith is often simpler to operate. Use a monolith when simplicity matters."
  }
]);

describe("ArchitectureService", () => {
  it("uses the injected provider with retrieved evidence", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "A modular monolith is often simpler to operate."
      )
    };

    const service = new ArchitectureService(provider, knowledgeBase);

    await expect(
      service.answer({ question: "  When should I use a monolith?  " })
    ).resolves.toEqual({
      answer: "A modular monolith is often simpler to operate."
    });

    expect(provider.answerWithContext).toHaveBeenCalledOnce();
    expect(provider.answerWithContext).toHaveBeenCalledWith(
      "When should I use a monolith?",
      expect.any(Array)
    );
  });

  it("does not call the provider for invalid input", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected answer")
    };

    const service = new ArchitectureService(provider, knowledgeBase);

    await expect(
      service.answer({ question: "   " })
    ).rejects.toThrow("Question must not be empty.");

    expect(provider.answerWithContext).not.toHaveBeenCalled();
  });

  it("rejects an empty provider response", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("   ")
    };

    const service = new ArchitectureService(provider, knowledgeBase);

    await expect(
      service.answer({ question: "When should I use a monolith?" })
    ).rejects.toThrow("The AI provider returned no answer.");
  });
});
