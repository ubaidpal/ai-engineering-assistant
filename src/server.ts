import Fastify from "fastify";
import { ArchitectureService } from "./architecture-service.js";
import type { RAGAnswerService } from "./rag/rag-answer-service.js";

type ServerOptions = {
  service: ArchitectureService;
  ragAnswerService?: RAGAnswerService;
  semanticRagAnswerService?: RAGAnswerService;
  logger?: boolean;
};

export function buildServer({
  service,
  ragAnswerService,
  semanticRagAnswerService,
  logger = true
}: ServerOptions) {
  const app = Fastify({
    logger
  });

  app.post<{ Body: { question: string } }>(
    "/api/architecture/answer",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["question"],
          properties: {
            question: {
              type: "string",
              minLength: 1,
              maxLength: 2000
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await service.answer({
          question: request.body.question
        });

        return { answer: result.answer };
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.message === "Question must not be empty." ||
            error.message ===
              "Question must not exceed 2000 characters.")
        ) {
          return reply.code(400).send({
            error: "INVALID_QUESTION",
            message: error.message
          });
        }

        request.log.error(
          { err: error },
          "Architecture answer request failed"
        );

        return reply.code(502).send({
          error: "AI_PROVIDER_FAILURE",
          message: "Unable to generate an answer right now."
        });
      }
    }
  );

  if (ragAnswerService) {
    app.post<{ Body: { question: string } }>(
      "/api/rag/answer",
      {
        schema: {
          body: {
            type: "object",
            additionalProperties: false,
            required: ["question"],
            properties: {
              question: {
                type: "string",
                minLength: 1,
                maxLength: 2000
              }
            }
          }
        }
      },
      async (request, reply) => {
        const question = request.body.question.trim();

        if (!question) {
          return reply.code(400).send({
            error: "INVALID_QUESTION",
            message: "Question must not be empty."
          });
        }

        try {
          const result = await ragAnswerService.answer(
            question,
            request.id
          );

          return {
            ...result,
            requestId: request.id
          };
        } catch (error: unknown) {
          request.log.error({ err: error }, "RAG request failed");

          return reply.code(502).send({
            error: "RAG_PROVIDER_FAILURE",
            message: "Unable to generate an answer right now."
          });
        }
      }
    );
  }

  if (semanticRagAnswerService) {
    app.post<{ Body: { question: string } }>(
      "/api/rag/semantic/answer",
      {
        schema: {
          body: {
            type: "object",
            required: ["question"],
            additionalProperties: false,
            properties: {
              question: {
                type: "string",
                minLength: 1,
                maxLength: 4000
              }
            }
          }
        }
      },
      async (request, reply) => {
        const { question } = request.body;

        try {
          const result = await semanticRagAnswerService.answer(
            question,
            request.id
          );

          return {
            ...result,
            requestId: request.id
          };
        } catch (error: unknown) {
          request.log.error(
            { err: error, requestId: request.id },
            "Semantic RAG request failed"
          );

          return reply.code(502).send({
            error: "Semantic RAG request failed."
          });
        }
      }
    );
  }

  return app;
}
