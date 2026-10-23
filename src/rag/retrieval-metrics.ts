import type { RetrievedChunk } from "./types.js";

export type RetrievalEvaluation = {
  recallAtK: number;
  reciprocalRank: number;
};

export function evaluateRetrieval(
  results: RetrievedChunk[],
  relevantSources: string[],
  k = 3
): RetrievalEvaluation {
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error("k must be a positive integer.");
  }

  const relevant = new Set(relevantSources);

  if (relevant.size === 0) {
    throw new Error("At least one relevant source is required.");
  }

  const topResults = results.slice(0, k);
  const retrievedRelevant = new Set(
    topResults
      .filter((result) => relevant.has(result.source))
      .map((result) => result.source)
  );

  const firstRelevantIndex = topResults.findIndex((result) =>
    relevant.has(result.source)
  );

  return {
    recallAtK: retrievedRelevant.size / relevant.size,
    reciprocalRank:
      firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1)
  };
}
