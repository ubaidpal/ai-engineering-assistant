import Fastify from "fastify";
import { ArchitectureService } from "./architecture-service.js";

type ServerOptions = {
  service: ArchitectureService;
};

export function buildServer({ service }: ServerOptions) {
  const app = Fastify({
    logger: true
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

  return app;
}
