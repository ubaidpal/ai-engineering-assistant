import type { RetrievedChunk } from "./types.js";

export interface ChunkRetriever {
  retrieve(
    question: string,
    limit?: number,
    minScore?: number,
    maxPerSource?: number
  ): RetrievedChunk[] | Promise<RetrievedChunk[]>;
}
