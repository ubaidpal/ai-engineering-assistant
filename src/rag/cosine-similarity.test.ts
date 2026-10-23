
import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "./cosine-similarity.js";

describe("cosineSimilarity", () => {
  it("returns 1 for identical direction vectors", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
  });

  it("returns 0 for perpendicular vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite direction vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("rejects vectors with different dimensions", () => {
    expect(() => cosineSimilarity([1, 2], [1])).toThrow();
  });

  it("rejects empty vectors", () => {
    expect(() => cosineSimilarity([], [])).toThrow();
  });

  it("rejects zero vectors", () => {
    expect(() => cosineSimilarity([0, 0], [1, 2])).toThrow();
  });

  it("rejects non-finite values", () => {
    expect(() => cosineSimilarity([1, Infinity], [1, 2])).toThrow();
  });
});
