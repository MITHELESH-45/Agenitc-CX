## Agentic-CX Backend (Production-grade)

Production-grade Node.js + Express backend for **Agentic-CX**, a multi-agent AI customer support system.

### Folder structure

- `server.js`: starts the HTTP server
- `src/app.js`: Express app wiring (middleware, routes, error handling)
- `src/routes/`: route definitions
- `src/controllers/`: request/response handling
- `src/services/`: orchestration (Router → RAG/Action → Sentiment → Response)
- `src/agents/`: Router/RAG/Action + sentiment + response generator
- `src/rag/`: ingestion + hybrid retrieval
- `src/db/`: MongoDB connection + seed
- `src/config/`: OpenAI config
- `src/utils/logger.js`: basic logger utility

### Prerequisites

- Node.js 18+
- An OpenAI API key (set in `.env`)
- MongoDB (for Action Agent)
- ChromaDB (for RAG)

### How to run

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

- Edit `.env` and set `OPENAI_API_KEY=...`

3. Start MongoDB (required for Action Agent)

Option A: Local MongoDB service (Windows)
- Ensure MongoDB is installed and running.

Option B: Docker:

```bash
docker run --name agentic-cx-mongo -p 27017:27017 -d mongo:7
```

4. Seed dummy orders:

```bash
npm run db:seed
```

5. Start ChromaDB (required for RAG)

Option 1 (Docker):

```bash
docker run -p 8000:8000 chromadb/chroma
```

Option 2 (Python local):

```bash
pip install chromadb
chroma run --host localhost --port 8000
```

6. Ingest PDFs into Chroma

- Put your PDFs in the `data/` folder (you already added company docs there).
- Run ingestion:

```bash
npm run rag:ingest
```

7. Start the API server:

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

Expected response (Action Agent):

```json
{
  "success": true,
  "data": {
    "reply": "Your order is Out for delivery.",
    "meta": {
      "intent": "order_status",
      "route": "action_agent",
      "entities": {
        "order_id": "1234"
      },
      "emotion": "neutral"
    }
  }
}
```

### Test cases

1) Action agent
- Message: `Where is my order 1234?`

2) RAG agent
- Message: `What is your return policy?`

3) Sentiment / angry
- Message: `I am angry my order is late`

