
import { chunkDocument } from "./chunker.js";
import { retrieveChunks } from "./retriever.js";
import type { Document, DocumentChunk, RetrievedChunk } from "./types.js";

export class RAGService {
  private readonly chunks: DocumentChunk[];

  constructor(documents: Document[]) {
    this.chunks = documents.flatMap((document) =>
      chunkDocument(document)
    );
  }

  retrieve(
    question: string,
    limit = 3,
    _minScore?: number,
    _maxPerSource?: number
  ): RetrievedChunk[] {
    return retrieveChunks(question, this.chunks, limit);
  }

  getChunkCount(): number {
    return this.chunks.length;
  }
}
