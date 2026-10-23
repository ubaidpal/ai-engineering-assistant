import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmbeddingProvider } from "./embedding-provider.js";

type CacheFile = {
  version: 2;
  model: string;
  entries: Record<string, number[]>;
};

export class PersistentEmbeddingProvider implements EmbeddingProvider {
  private readonly cache = new Map<string, number[]>();
  private initialized = false;

  constructor(
    private readonly provider: EmbeddingProvider,
    private readonly cacheFilePath: string,
    private readonly model: string
  ) {
    if (!model.trim()) {
      throw new Error("Embedding model must not be empty.");
    }
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const contents = await readFile(this.cacheFilePath, "utf8");
      const parsed = JSON.parse(contents) as Partial<CacheFile>;

      // Never reuse embeddings from an incompatible cache.
      if (
        parsed.version === 2 &&
        parsed.model === this.model &&
        parsed.entries &&
        typeof parsed.entries === "object"
      ) {
        for (const [text, embedding] of Object.entries(parsed.entries)) {
          if (
            Array.isArray(embedding) &&
            embedding.length > 0 &&
            embedding.every(Number.isFinite)
          ) {
            this.cache.set(text, embedding);
          }
        }
      }
    } catch (error) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        )
      ) {
        throw error;
      }
    }

    this.initialized = true;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.some((text) => !text.trim())) {
      throw new Error("Embedding inputs must not be empty.");
    }

    await this.initialize();

    const missing = [
      ...new Set(texts.filter((text) => !this.cache.has(text)))
    ];

    if (missing.length > 0) {
      const embeddings = await this.provider.embed(missing);

      if (
        embeddings.length !== missing.length ||
        embeddings.some(
          (embedding) =>
            !embedding ||
            embedding.length === 0 ||
            !embedding.every(Number.isFinite)
        )
      ) {
        throw new Error("Embedding provider returned invalid embeddings.");
      }

      for (let i = 0; i < missing.length; i++) {
        this.cache.set(missing[i], embeddings[i]);
      }

      await this.persist();
    }

    return texts.map((text) => {
      const embedding = this.cache.get(text);

      if (!embedding) {
        throw new Error("Embedding cache entry is missing.");
      }

      return [...embedding];
    });
  }

  async retainOnly(texts: string[]): Promise<void> {
    await this.initialize();

    const activeTexts = new Set(texts);
    let removedEntries = false;

    for (const cachedText of this.cache.keys()) {
      if (!activeTexts.has(cachedText)) {
        this.cache.delete(cachedText);
        removedEntries = true;
      }
    }

    if (removedEntries) {
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    await mkdir(path.dirname(this.cacheFilePath), {
      recursive: true
    });

    const entries = Object.fromEntries(this.cache);
    const temporaryPath = `${this.cacheFilePath}.tmp`;

    const cacheFile: CacheFile = {
      version: 2,
      model: this.model,
      entries
    };

    await writeFile(temporaryPath, JSON.stringify(cacheFile), "utf8");
    await rename(temporaryPath, this.cacheFilePath);
  }
}
