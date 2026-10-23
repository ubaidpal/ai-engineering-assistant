export type ArchitectureRequest = {
  question: string;
};

export function validateRequest(
  request: ArchitectureRequest
): ArchitectureRequest {
  const question = request.question.trim();

  if (question.length === 0) {
    throw new Error("Question must not be empty.");
  }

  if (question.length > 2000) {
    throw new Error("Question must not exceed 2000 characters.");
  }

  return { question };
}
