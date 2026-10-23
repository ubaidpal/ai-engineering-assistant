import { describe, expect, it } from "vitest";
import { validateRequest } from "./validation.js";

describe("validateRequest", () => {
  it("accepts a valid question", () => {
    expect(
      validateRequest({
        question: "How should I design a scalable API?"
      })
    ).toEqual({
      question: "How should I design a scalable API?"
    });
  });

  it("trims whitespace", () => {
    expect(
      validateRequest({ question: "  Explain RAG  " })
    ).toEqual({
      question: "Explain RAG"
    });
  });

  it("rejects an empty question", () => {
    expect(() =>
      validateRequest({ question: "" })
    ).toThrow("Question must not be empty.");
  });

  it("rejects whitespace-only input", () => {
    expect(() =>
      validateRequest({ question: "   " })
    ).toThrow("Question must not be empty.");
  });

  it("rejects questions exceeding 2000 characters", () => {
    expect(() =>
      validateRequest({ question: "a".repeat(2001) })
    ).toThrow(
      "Question must not exceed 2000 characters."
    );
  });

  it("accepts a question of exactly 2000 characters", () => {
    expect(
      validateRequest({ question: "a".repeat(2000) })
        .question
    ).toHaveLength(2000);
  });
});