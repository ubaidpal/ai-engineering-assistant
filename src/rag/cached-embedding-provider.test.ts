import { describe, expect, it, vi } from "vitest";
import type { EmbeddingProvider } from "./embedding-provider.js";
import { CachedEmbeddingProvider } from "./cached-embedding-provider.js";

describe("CachedEmbeddingProvider", () => {
  it("caches embeddings and preserves input order", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [1, 0],
        [0, 1]
      ])
    };

    const cached = new CachedEmbeddingProvider(provider);

    const first = await cached.embed(["alpha", "beta"]);
    const second = await cached.embed(["beta", "alpha", "alpha"]);

    expect(first).toEqual([
      [1, 0],
      [0, 1]
    ]);
    expect(second).toEqual([
      [0, 1],
      [1, 0],
      [1, 0]
    ]);
    expect(provider.embed).toHaveBeenCalledTimes(1);
  });

  it("rejects blank inputs", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn()
    };

    const cached = new CachedEmbeddingProvider(provider);

    await expect(cached.embed(["   "])).rejects.toThrow(
      "Embedding inputs must not be empty."
    );
  });
});
