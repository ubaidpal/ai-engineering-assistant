
import { describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import { OpenAIEmbeddingProvider } from "./openai-embedding-provider.js";

vi.mock("openai", () => {
  const create = vi.fn();

  return {
    default: class OpenAI {
      embeddings = {
        create
      };
    }
  };
});

describe("OpenAIEmbeddingProvider", () => {
  it("returns embeddings in input order", async () => {
    const provider = new OpenAIEmbeddingProvider("test-key");
    const client = new OpenAI({ apiKey: "test-key" });

    vi.mocked(client.embeddings.create).mockResolvedValue({
      object: "list",
      data: [
        { object: "embedding", index: 1, embedding: [0.2, 0.3] },
        { object: "embedding", index: 0, embedding: [0.1, 0.2] }
      ],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 4, total_tokens: 4 }
    } as Awaited<ReturnType<typeof client.embeddings.create>>);

    const result = await provider.embed(["first", "second"]);

    expect(result).toEqual([
      [0.1, 0.2],
      [0.2, 0.3]
    ]);
  });

  it("does not call the API for empty input", async () => {
    const provider = new OpenAIEmbeddingProvider("test-key");

    await expect(provider.embed([])).resolves.toEqual([]);
  });

  it("rejects blank text", async () => {
    const provider = new OpenAIEmbeddingProvider("test-key");

    await expect(provider.embed(["hello", "  "])).rejects.toThrow(
      "Embedding inputs must not be empty."
    );
  });
});
