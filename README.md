## Agentic-CX Backend (Phase 1)

Node.js + Express backend scaffold for **Agentic-CX**, an AI-powered multi-agent customer support system.

### Folder structure

- `server.js`: starts the HTTP server
- `src/app.js`: Express app wiring (middleware, routes, error handling)
- `src/routes/`: route definitions
- `src/controllers/`: request/response handling
- `src/services/`: business logic layer (placeholder for now)
- `src/agents/`: reserved for future Router/RAG/Action agents
- `src/utils/logger.js`: basic logger utility

### How to run

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm run start
```

Server defaults to port `3000`. You can override with `PORT=4000 npm start`.

### How to test (Postman)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/chat`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:

```json
{
  "message": "Where is my order 1234?",
  "userId": "user_1"
}
```

Expected response:

```json
{
  "success": true,
  "data": {
    "reply": "You said: Where is my order 1234?"
  }
}
```

