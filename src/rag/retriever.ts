
import type { DocumentChunk, RetrievedChunk } from "./types.js";

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function retrieveChunks(
  question: string,
  chunks: DocumentChunk[],
  limit = 3
): RetrievedChunk[] {
  if (limit <= 0) {
    return [];
  }

  const queryTerms = [...new Set(tokenize(question))];

  if (queryTerms.length === 0) {
    return [];
  }

  return chunks
    .map((chunk) => {
      const chunkTerms = new Set(tokenize(chunk.content));

      const matchedTerms = queryTerms.filter((term) =>
        chunkTerms.has(term)
      );

      return {
        ...chunk,
        score: matchedTerms.length / queryTerms.length
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
