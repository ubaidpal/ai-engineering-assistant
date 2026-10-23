import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmbeddingProvider } from "./embedding-provider.js";
import { PersistentEmbeddingProvider } from "./persistent-embedding-provider.js";

describe("PersistentEmbeddingProvider", () => {
  let directory: string | undefined;

  afterEach(async () => {
    if (directory) {
      await rm(directory, { recursive: true, force: true });
      directory = undefined;
    }
  });

  it("reuses cached embeddings across provider instances", async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "embedding-cache-test-")
    );

    const cachePath = path.join(directory, "embeddings.json");

    const firstProvider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([[1, 0]])
    };

    const firstCache = new PersistentEmbeddingProvider(
      firstProvider,
      cachePath,
      "test-model"
    );

    await expect(firstCache.embed(["alpha"])).resolves.toEqual([[1, 0]]);
    expect(firstProvider.embed).toHaveBeenCalledOnce();

    const secondProvider: EmbeddingProvider = {
      embed: vi.fn()
    };

    const secondCache = new PersistentEmbeddingProvider(
      secondProvider,
      cachePath,
      "test-model"
    );

    await expect(secondCache.embed(["alpha"])).resolves.toEqual([[1, 0]]);
    expect(secondProvider.embed).not.toHaveBeenCalled();

    const saved = JSON.parse(await readFile(cachePath, "utf8"));
    expect(saved.version).toBe(2);
    expect(saved.model).toBe("test-model");
  });

  it("generates an embedding for changed text", async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "embedding-cache-test-")
    );

    const cachePath = path.join(directory, "embeddings.json");

    const provider: EmbeddingProvider = {
      embed: vi
        .fn()
        .mockResolvedValueOnce([[1, 0]])
        .mockResolvedValueOnce([[0, 1]])
    };

    const cache = new PersistentEmbeddingProvider(
      provider,
      cachePath,
      "test-model"
    );

    await cache.embed(["original text"]);
    await cache.embed(["updated text"]);

    expect(provider.embed).toHaveBeenCalledTimes(2);
  });

  it("removes cached embeddings for text no longer in the knowledge base", async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "embedding-cache-test-")
    );

    const cachePath = path.join(directory, "embeddings.json");

    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [1, 0],
        [0, 1]
      ])
    };

    const cache = new PersistentEmbeddingProvider(
      provider,
      cachePath,
      "test-model"
    );

    await cache.embed(["old text", "current text"]);
    await cache.retainOnly(["current text"]);

    const saved = JSON.parse(await readFile(cachePath, "utf8"));

    expect(saved.entries).toEqual({
      "current text": [0, 1]
    });
  });

  it("does not reuse embeddings from a different model", async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), "embedding-cache-test-")
    );

    const cachePath = path.join(directory, "embeddings.json");

    const firstProvider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([[1, 0]])
    };

    const firstCache = new PersistentEmbeddingProvider(
      firstProvider,
      cachePath,
      "model-a"
    );

    await firstCache.embed(["alpha"]);

    const secondProvider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([[0, 1]])
    };

    const secondCache = new PersistentEmbeddingProvider(
      secondProvider,
      cachePath,
      "model-b"
    );

    await expect(secondCache.embed(["alpha"])).resolves.toEqual([[0, 1]]);
    expect(secondProvider.embed).toHaveBeenCalledOnce();
  });
});
