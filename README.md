# AI Engineering Assistant

A TypeScript-based AI assistant designed to answer software architecture and engineering questions using OpenAI.

This project is being developed as a practical AI engineering learning journey, focusing on clean architecture, modular design, automated testing, API development, and production-ready engineering practices.

## Features

- **AI-powered answers:** Generate responses using the OpenAI API.
- **Modular architecture:** Separate business logic from AI provider implementation.
- **HTTP API:** Expose AI functionality through a Fastify REST endpoint.
- **Input validation:** Validate questions and enforce a maximum length of 2,000 characters.
- **Automated testing:** Test application logic and HTTP endpoints using Vitest and mocked AI providers.
- **Environment-based configuration:** Keep API credentials and configuration outside the source code.
- **Error handling:** Return appropriate HTTP responses for invalid input and AI provider failures.
- **TypeScript:** Use static typing to improve maintainability and code quality.

## Tech Stack

- Node.js
- TypeScript
- OpenAI API
- Fastify
- Vitest
- dotenv
- tsx

## Project Structure

```text
ai-engineering-assistant/
├── src/
│   ├── index.ts
│   ├── http.ts
│   ├── server.ts
│   ├── validation.ts
│   ├── validation.test.ts
│   ├── ai-provider.ts
│   ├── openai-provider.ts
│   ├── architecture-service.ts
│   └── server.test.ts
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*The structure above reflects the files created during the current development stages. Adjust it if your actual project differs.*

## Getting Started

### Prerequisites

- Node.js and npm
- An OpenAI API key

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd ai-engineering-assistant
```

Replace `YOUR_REPOSITORY_URL` with your GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=your_supported_model
PORT=3000
```

Replace the placeholder values with your actual configuration. Never commit your real API key.

### 4. Run the application

Start the HTTP API:

```bash
npm run start:api
```

The API will listen on `http://127.0.0.1:3000` by default.

### 5. Send a request

```bash
curl -X POST http://127.0.0.1:3000/api/architecture/answer \
  -H "Content-Type: application/json" \
  -d '{"question":"When should I use a modular monolith?"}'
```

Example response:

```json
{
  "answer": "A modular monolith is useful when you want clear module boundaries without the operational complexity of distributed services."
}
```

The response above is an illustrative example; the actual answer depends on the model.

### 6. Run tests

```bash
npm test
```

Run the project's type-checking and validation script:

```bash
npm run check
```

These commands assume the corresponding scripts are configured in `package.json`.

## API Reference

### Answer an architecture question

`POST /api/architecture/answer`

Request body:

```json
{
  "question": "When should I use a modular monolith?"
}
```

Successful response — `200 OK`:

```json
{
  "answer": "Generated AI answer"
}
```

Invalid input returns `400 Bad Request`. AI provider failures return `502 Bad Gateway`.

## Architecture Principles

The application uses a provider abstraction to separate AI integration from business logic.

- **Separation of concerns:** HTTP handling, business logic, validation, and AI integration are kept in separate modules.
- **Dependency injection:** The architecture service receives an AI provider rather than directly depending on a particular implementation.
- **Testability:** Mock providers allow application behavior to be tested without making real AI API calls.
- **Configuration management:** Environment variables are used for sensitive credentials and runtime settings.

## Roadmap

- [x] Integrate the OpenAI API
- [x] Add input validation
- [x] Introduce a modular service and provider architecture
- [x] Build an HTTP API with Fastify
- [x] Add automated tests for validation, service logic, and HTTP endpoints
- [ ] Implement Retrieval-Augmented Generation (RAG)
- [ ] Add document ingestion and chunking
- [ ] Add semantic search using embeddings
- [ ] Return source citations with generated answers
- [ ] Add stronger API security, rate limiting, and timeouts
- [ ] Add evaluation, observability, and cost monitoring
- [ ] Deploy the application

## Security Notes

- Do not commit `.env` or any API credentials.
- Validate and limit user input.
- Configure authentication and rate limiting before exposing the API publicly.
- Add appropriate timeouts and safeguards for AI provider requests.

## Learning Objectives

This project explores practical AI engineering through incremental implementation, emphasizing maintainable code, testability, retrieval systems, and production-oriented design.

## License

No license has been specified yet. Add a license before allowing others to reuse or distribute the project.
