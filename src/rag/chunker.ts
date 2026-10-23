import type { Document, DocumentChunk } from "./types.js";

export function chunkDocument(
  document: Document,
  maxLength = 500,
  overlap = 100
): DocumentChunk[] {
  if (maxLength <= 0) {
    throw new Error("maxLength must be positive.");
  }

  if (overlap < 0 || overlap >= maxLength) {
    throw new Error(
      "overlap must be non-negative and smaller than maxLength."
    );
  }

  const content = document.content.trim();

  if (!content) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  const step = maxLength - overlap;

  for (let start = 0; start < content.length; start += step) {
    const text = content.slice(start, start + maxLength).trim();

    if (text) {
      chunks.push({
        id: `${document.id}-chunk-${chunks.length + 1}`,
        documentId: document.id,
        source: document.source,
        content: text
      });
    }

    if (start + maxLength >= content.length) {
      break;
    }
  }

  return chunks;
}
