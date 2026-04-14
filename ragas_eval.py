"""
ragas_eval.py  —  Agentic-CX RAG Evaluation Pipeline (Fixed for 0.4.3)
──────────────────────────────────────────────────────────────────────
"""

import json
import math
import os
import sys
import warnings
from datetime import datetime, timezone

# Suppress warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# ── Load .env ─────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[INFO] .env loaded")
except ImportError:
    pass

# ── Env vars ──────────────────────────────────────────────────────────────────
MONGO_URI       = os.getenv("MONGO_URI")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")

if not MONGO_URI or not OPENAI_API_KEY:
    print("[ERROR] MONGO_URI and OPENAI_API_KEY must be set in .env")
    sys.exit(1)

# ── Imports ───────────────────────────────────────────────────────────────────
try:
    from pymongo import MongoClient
    from datasets import Dataset
    from ragas import evaluate
    # Use capitalized names to be sure we have the classes
    from ragas.metrics import Faithfulness, AnswerRelevancy, ContextPrecision
    from ragas.llms import LangchainLLMWrapper
    from ragas.embeddings import LangchainEmbeddingsWrapper
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    sys.exit(1)

# ── Configure Ragas Judges ────────────────────────────────────────────────────
evaluator_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o-mini"))
evaluator_embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings())

# ── Instantiate Metrics ───────────────────────────────────────────────────────
# In 0.4.3, metrics MUST be instances. Faithfulness needs llm in constructor.
print("[INFO] Initializing metrics...")
metrics = [
    Faithfulness(llm=evaluator_llm),
    AnswerRelevancy(llm=evaluator_llm, embeddings=evaluator_embeddings),
    ContextPrecision(llm=evaluator_llm)
]

# ── Step 1: Fetch Data ────────────────────────────────────────────────────────
print("[STEP 1] Fetching data from MongoDB...")
client = MongoClient(MONGO_URI)
db_name = MONGO_URI.split("/")[-1].split("?")[0] or "Agentic-CX"
db = client[db_name]
interactions_col = db["interactions"]

# Fetch RAG interactions which have context
raw_records = list(interactions_col.find({"route": "rag_agent"}).sort("createdAt", -1))
print(f"[INFO] Found {len(raw_records)} RAG interactions in total")

# ── Step 2: Build Dataset ─────────────────────────────────────────────────────
dataset_rows = []
for i, rec in enumerate(raw_records):
    q = rec.get("question", "").strip()
    a = rec.get("answer", "").strip()
    ctx = rec.get("context", [])

    # Filter out empty or placeholder contexts
    real_ctx = [c for c in ctx if isinstance(c, str) and len(c) > 40 and "(chunk" not in c]
    
    if q and a and real_ctx:
        dataset_rows.append({
            "question": q,
            "answer": a,
            "contexts": real_ctx,
            "ground_truth": a # Use generated answer as reference for faithfulness/precision
        })

if not dataset_rows:
    print("[WARN] No valid records with REAL text context found.")
    print("      Note: You may need to RESTART the Node server and send NEW messages.")
    sys.exit(0)

print(f"[INFO] Evaluating {len(dataset_rows)} valid records...")
dataset = Dataset.from_list(dataset_rows)

# ── Step 3: Run Evaluation ────────────────────────────────────────────────────
try:
    result = evaluate(
        dataset=dataset,
        metrics=metrics,
    )

    # ── Step 4: Extract and Save ──────────────────────────────────────────────
    print("\n[INFO] Evaluation Results:")
    print(result)

    # Extract scores - some Ragas versions return lists of per-sample scores
    def get_avg(val):
        if isinstance(val, list):
            return sum(val) / len(val) if val else 0.0
        return float(val)

    output = {
        "faithfulness": round(get_avg(result["faithfulness"]), 4),
        "answer_relevancy": round(get_avg(result["answer_relevancy"]), 4),
        "context_precision": round(get_avg(result["context_precision"]), 4),
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "records_evaluated": len(dataset_rows)
    }

    with open("metrics.json", "w") as f:
        json.dump(output, f, indent=2)

    print("\n[SUCCESS] metrics.json generated.")

except Exception as e:
    print(f"[ERROR] Evaluation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
