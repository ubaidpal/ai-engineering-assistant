import type { RetrievedChunk } from "./types.js";

export function diversifyResults(
  results: RetrievedChunk[],
  limit = 3,
  maxPerSource = 1
): RetrievedChunk[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("limit must be a non-negative integer.");
  }

  if (!Number.isInteger(maxPerSource) || maxPerSource <= 0) {
    throw new Error("maxPerSource must be a positive integer.");
  }

  const sourceCounts = new Map<string, number>();
  const diversified: RetrievedChunk[] = [];

  for (const result of results) {
    const count = sourceCounts.get(result.source) ?? 0;

    if (count >= maxPerSource) {
      continue;
    }

    diversified.push(result);
    sourceCounts.set(result.source, count + 1);

    if (diversified.length >= limit) {
      break;
    }
  }

  return diversified;
}
