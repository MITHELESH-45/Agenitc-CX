# Setup and Deployment

Follow these instructions to get the Agentic-CX platform running locally or in a production environment.

## Local Development

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (local or Atlas)
- Chroma Cloud account (or local ChromaDB)

### 1. Repository Setup
```bash
git clone <your-repo-url>
cd Agentic-CX
```

### 2. Backend Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your keys (see Environment Variables section below)

# Seed initial data
npm run db:seed

# Optional: Ingest documents into Chroma
npm run rag:ingest
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Core
- `PORT`: Server port (default 3000)
- `MONGO_URI`: MongoDB connection string
- `OPENAI_API_KEY`: Your OpenAI API Key

### RAG & Agents
- `CHROMA_URL`: Chroma Cloud / local URL
- `CHROMA_API_KEY`: Required if using Chroma Cloud
- `CHROMA_COLLECTION`: Name of your vector collection
- `OPENAI_CHAT_MODEL`: Default `gpt-4o-mini`
- `OPENAI_EMBEDDING_MODEL`: Default `text-embedding-3-small`

### Integrations
- `TWILIO_ACCOUNT_SID`: For WhatsApp
- `TWILIO_AUTH_TOKEN`: For WhatsApp
- `ADMIN_SECRET`: Secret key for administrative actions

---

## Evaluation (Ragas)

To run the quality evaluation pipeline, ensure you have the Python dependencies installed:

```bash
pip install -r requirements.txt
python ragas_eval.py
```

The script will fetch the latest RAG interactions from MongoDB, perform evaluations using GPT-4o-mini as a judge, and save the results to `metrics.json` for the Admin Dashboard to display.

---

## Deployment

### Backend
The backend can be deployed as a standard Node.js application.
- **Render/Railway**: Connect your repository and add the environment variables.
- **Docker**: (Optional) A `Dockerfile` can be created to containerize the service.

### Frontend
The frontend is a Vite application and can be deployed as static hosting.
- **Vercel/Netlify**: Optimized for React/Vite deployments. Set `VITE_API_BASE_URL` to your backend URL.
