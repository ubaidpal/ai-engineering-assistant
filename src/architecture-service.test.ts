import { describe, expect, it, vi } from "vitest";
import { ArchitectureService } from "./architecture-service.js";
import type { AIProvider } from "./ai-provider.js";

describe("ArchitectureService", () => {
  it("uses the injected provider", async () => {
    const provider: AIProvider = {
      answer: vi.fn().mockResolvedValue(
        "A modular monolith is often simpler to operate."
      )
    };

    const service = new ArchitectureService(provider);

    await expect(
      service.answer({ question: "  When should I use a monolith?  " })
    ).resolves.toEqual({
      answer: "A modular monolith is often simpler to operate."
    });

    expect(provider.answer).toHaveBeenCalledWith(
      "When should I use a monolith?"
    );
  });

  it("does not call the provider for invalid input", async () => {
    const provider: AIProvider = {
      answer: vi.fn().mockResolvedValue("Unexpected answer")
    };

    const service = new ArchitectureService(provider);

    await expect(
      service.answer({ question: "   " })
    ).rejects.toThrow("Question must not be empty.");

    expect(provider.answer).not.toHaveBeenCalled();
  });

  it("rejects an empty provider response", async () => {
    const provider: AIProvider = {
      answer: vi.fn().mockResolvedValue("   ")
    };

    const service = new ArchitectureService(provider);

    await expect(
      service.answer({ question: "Explain event-driven architecture" })
    ).rejects.toThrow("The AI provider returned no answer.");
  });
});