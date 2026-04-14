# API Documentation

The Agentic-CX backend provides a set of REST endpoints for chat interaction, WhatsApp integration, and administrative observability.

## User APIs

### Chat Interaction
`POST /api/chat`

Main endpoint for web-based chat interfaces.

**Request Body:**
```json
{
  "message": "Where is my order 1234?",
  "userId": "user_123"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "reply": "Your order is Out for delivery."
  }
}
```

### WhatsApp Webhook
`POST /api/whatsapp`

Endpoint for Twilio WhatsApp integration. Accepts `application/x-www-form-urlencoded`.

**Expected Fields:**
- `Body`: The message text.
- `From`: The WhatsApp sender ID (e.g., `whatsapp:+1234567890`).

**Response:**
Returns a Twilio TwiML XML response.

---

## Admin APIs

### Analytics Overview
`GET /admin/analytics`

Returns aggregate counts for system interactions.

**Response Example:**
```json
{
  "totalQueries": 150,
  "ragQueries": 85,
  "actionQueries": 65,
  "escalations": 12,
  "avgResponseTime": 420
}
```

### Quality Metrics (Ragas)
`GET /admin/metrics`

Retrieves the latest Ragas evaluation scores.

**Response Example:**
```json
{
  "faithfulness": 0.92,
  "answer_relevancy": 0.88,
  "context_precision": 0.85,
  "evaluated_at": "2024-04-14T10:00:00Z",
  "records_evaluated": 50
}
```

### Ticket Management
`GET /admin/tickets`

Returns a list of all escalated support tickets.

**Optional Query Params:**
- `status`: `open` | `resolved`
- `limit`: Number of records (default 100)

**Response Example:**
```json
{
  "tickets": [
    {
      "user": "user_123",
      "message": "I am very angry about my late order!",
      "status": "open",
      "sentiment": "angry",
      "createdAt": "2024-04-14T09:30:00Z"
    }
  ]
}
```

### Interaction Logs
`GET /admin/interactions`

Returns raw interaction records for audit or Ragas export.

**Optional Query Params:**
- `route`: `rag_agent` | `action_agent`
- `limit`: Number of records (default 100)
