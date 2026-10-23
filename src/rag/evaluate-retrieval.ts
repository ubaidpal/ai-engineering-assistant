import "dotenv/config";
import { createKnowledgeBase } from "./knowledge-base.js";
import { createSemanticKnowledgeBase } from "./semantic-knowledge-base.js";
import { evaluateRetrieval } from "./retrieval-metrics.js";

const apiKey = process.env.EXPLABS_API_KEY;
const baseURL =
  process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";

if (!apiKey) {
  throw new Error("EXPLABS_API_KEY is required.");
}

const keywordRetriever = await createKnowledgeBase();
const semanticRetriever = await createSemanticKnowledgeBase(apiKey, baseURL);

const cases = [
  {
    question: "When should I use a modular monolith?",
    relevantSources: ["modular-monolith.md"]
  },
  {
    question: "What are the disadvantages of microservices?",
    relevantSources: ["microservices.md"]
  },
  {
    question: "How can a team deploy business capabilities independently?",
    relevantSources: ["microservices.md"]
  },
  {
    question: "What architecture is appropriate for a small team?",
    relevantSources: ["modular-monolith.md"]
  },
  {
    question: "When should I consider independently scaling a service?",
    relevantSources: ["microservices.md"]
  }
];

type Totals = {
  recallAt3: number;
  mrr: number;
};

const totals: Record<string, Totals> = {
  keyword: { recallAt3: 0, mrr: 0 },
  semantic: { recallAt3: 0, mrr: 0 }
};

for (const testCase of cases) {
  const [keywordResults, semanticResults] = await Promise.all([
    keywordRetriever.retrieve(testCase.question, 3),
    semanticRetriever.retrieve(testCase.question, 3)
  ]);

  const keywordMetrics = evaluateRetrieval(
    keywordResults,
    testCase.relevantSources,
    3
  );

  const semanticMetrics = evaluateRetrieval(
    semanticResults,
    testCase.relevantSources,
    3
  );

  totals.keyword.recallAt3 += keywordMetrics.recallAtK;
  totals.keyword.mrr += keywordMetrics.reciprocalRank;

  totals.semantic.recallAt3 += semanticMetrics.recallAtK;
  totals.semantic.mrr += semanticMetrics.reciprocalRank;

  console.log(`\nQuestion: ${testCase.question}`);
  console.log(
    `Keyword: Recall@3=${keywordMetrics.recallAtK.toFixed(3)}, ` +
      `RR=${keywordMetrics.reciprocalRank.toFixed(3)}`
  );
  console.log(
    `Semantic: Recall@3=${semanticMetrics.recallAtK.toFixed(3)}, ` +
      `RR=${semanticMetrics.reciprocalRank.toFixed(3)}`
  );
}

console.log("\n=== Average results ===");

for (const [name, total] of Object.entries(totals)) {
  console.log(
    `${name}: Recall@3=${(total.recallAt3 / cases.length).toFixed(3)}, ` +
      `MRR=${(total.mrr / cases.length).toFixed(3)}`
  );
}
