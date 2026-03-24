# AgenticContentFlow

A full-stack platform for building and AI-evaluating educational concept flow graphs (mindmaps). Students construct a flow graph of topics in the browser; uploaded course documents are embedded and used as grounding context when a local LLM evaluates the submission, scoring topic coverage and connection correctness.

---

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Scoring Logic](#scoring-logic)
- [Fine-Tuning & Models](#fine-tuning--models)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Contributing](#contributing)

---

## Key Features

- **Mindmap Editor** — Drag-and-drop canvas for creating and connecting topic nodes. Supports hierarchical ELK layouts, a minimap, keyboard shortcuts, multi-select, and an extensible controls registry.
- **Document Upload & RAG** — Upload PDFs or text files that are chunked, embedded with a local sentence-transformer model, and stored in PostgreSQL + pgvector. All documents are scoped by `course_id / module_id / exercise_id`.
- **AI Topic Extraction** — On upload, an Ollama LLM extracts key educational topics and their supporting details from each document. These are stored alongside the embeddings for later comparison.
- **AI Flow Validation** — Student flow graphs are validated against the uploaded course materials. Topics and details are extracted from both the graph and the DB, semantically matched, and scored.
- **Weighted Scoring** — A hybrid score blends a deterministic rule-based score (penalising missing main topics more than missing details) with the LLM's own assessment.
- **Configurable Pass/Fail** — `is_valid` is computed server-side from the numeric score using a configurable threshold (default: 60%). The LLM is never asked to decide pass/fail.
- **Dockerized Stack** — PostgreSQL, FastAPI backend, and React frontend launch with a single command.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, ReactFlow, Zustand, ELK Layout |
| Backend | Python 3.10, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 + pgvector |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (local, HuggingFace) |
| LLM | [Ollama](https://ollama.com/) — `llama3.2` or fine-tuned `kiran2.0` |
| Fine-Tuning | Unsloth, Google Colab (A100/L4 GPUs) |
| Model Format | `safetensors` |
| Containerization | Docker, Docker Compose |

---

## Project Structure

```
agentic-content-flow/
├── docker-compose.yml
├── backend/
│   ├── main.py                    # FastAPI app entry point & router registration
│   ├── database.py                # SQLAlchemy engine & session setup
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── models/
│   │   ├── document.py            # Document ORM model
│   │   ├── topic.py               # Topic ORM model (topic_name + details, scoped by course/module/exercise)
│   │   ├── evaluation.py          # EvaluationResult ORM model
│   │   ├── flow.py                # Saved flow graph ORM model
│   │   └── node_type.py           # Node type registry ORM model
│   ├── routers/
│   │   ├── rag.py                 # Document upload, listing, deletion, semantic search
│   │   ├── eval.py                # Flow evaluation endpoint
│   │   ├── flows.py               # Flow graph persistence
│   │   ├── node_types.py          # Node type registry CRUD
│   │   └── data.py                # General data endpoints
│   └── services/
│       ├── llm_service.py         # LLM calls, topic extraction (regex), flow validation, scoring
│       ├── rag_service.py         # Chunking, embedding, pgvector storage & search
│       ├── prompts.py             # Prompt templates for extraction and validation
│       └── topic_utils.py         # Semantic topic deduplication & matching (cosine similarity)
└── frontend/
    └── src/AgenticContentFlow/
        ├── Controls/              # Toolbar controls registry & components
        ├── Flow/                  # ReactFlow canvas, viewport, connection logic
        ├── Layout/                # ELK layout algorithms
        ├── Node/                  # Node types, editing, registry
        ├── Minimap/               # Minimap overlay
        ├── Select/                # Multi-selection logic & UI
        └── services/              # API service clients
```

---

## API Reference

Backend runs on **`http://localhost:8000`**. Full interactive docs at [`http://localhost:8000/docs`](http://localhost:8000/docs).

---

### Document Management — `/api/rag`

#### `POST /api/rag/upload`

Upload a course document. Chunking, embedding, and topic extraction run in the background — the document record is returned immediately with `processing_status: "processing"`.

**Form fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | ✅ | PDF or plain-text file |
| `course_id` | string | ❌ | Course identifier |
| `module_id` | string | ❌ | Module identifier |
| `module_name` | string | ❌ | Human-readable module name |
| `exercise_id` | string | ❌ | Exercise identifier (scopes RAG context) |
| `exercise_name` | string | ❌ | Human-readable exercise name |

**Response:** `DocumentResponse` — includes `id`, `filename`, `processing_status`, and all scope fields.

---

#### `GET /api/rag/documents`

List all uploaded documents. Supports filtering via query params.

| Param | Description |
|---|---|
| `course_id` | Filter by course |
| `module_id` | Filter by module |
| `exercise_id` | Filter by exercise |

---

#### `DELETE /api/rag/documents/{doc_id}`

Delete a document by ID. Removes its stored file, SQL record, vector embeddings, and extracted topics.

---

#### `GET /api/rag/search`

Run a semantic search over the embedded document chunks.

| Param | Required | Description |
|---|---|---|
| `query` | ✅ | Natural language search string |
| `course_id` | ✅ | Scope to a course |
| `module_id` | ✅ | Scope to a module |
| `exercise_id` | ❌ | Optionally narrow to a specific exercise |

**Response:** List of `{ content, metadata }` objects.

---

### Evaluation — `/api/eval`

#### `POST /api/eval/evaluate`

Validates a student's flow graph JSON against the uploaded course materials for the given scope.

**Request body:**

```json
{
  "flow_data": {
    "nodes": [
      { "id": "1", "data": { "label": "Machine Learning", "description": "supervised, unsupervised" } },
      { "id": "2", "data": { "label": "Neural Networks" } }
    ],
    "edges": [
      { "id": "e1", "source": "1", "target": "2" }
    ]
  },
  "course_id": "cs101",
  "module_id": "module-1",
  "exercise_id": "exercise-3"
}
```

Each node's `data.label` is used as the topic name. Optional fields `data.description`, `data.details`, or `data.content` are parsed as supporting details and included in scoring.

**Response:**

```json
{
  "id": 42,
  "is_valid": true,
  "feedback": "Machine Learning and Neural Networks are well covered. Reinforcement Learning is entirely missing from the flow.",
  "points": 0.72,
  "status": "processed"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | int | Evaluation record ID (persisted in DB) |
| `is_valid` | bool | `true` if `points >= VALID_THRESHOLD` (env-configurable, default 0.6) |
| `feedback` | string | Detailed LLM explanation of strengths and gaps |
| `points` | float | Score 0.0 – 1.0 (stored as 0–100 integer in DB) |
| `status` | string | `"processed"` or `"failed"` |

---

## Scoring Logic

The `points` score is a **50/50 blend** of two independent scores:

### 1. Rule-based score (deterministic)

Based on pre-computed topic match counts via semantic similarity:

```
main_penalty   = min(0.70, missing_main_topics × (0.70 / total_expected_topics))
detail_penalty = min(0.30, missing_detail_count × 0.06)
rule_score     = max(0.0, 1.0 − main_penalty − detail_penalty)
```

- A **missing main topic** causes up to a 0.70 total score reduction — proportional to how many expected topics are absent.
- A **missing detail** within a matched topic causes a 0.06 reduction per item, capped at 0.30 total.

### 2. LLM score

The Ollama model receives the full flow graph, the matched/missing topic lists (with details), and the RAG document context. It is given explicit scoring guidelines matching the rules above and returns a numeric score.

### Final score

```
final_points = (rule_score + llm_score) / 2
```

### Pass/fail

```
is_valid = final_points >= VALID_THRESHOLD
```

`is_valid` is always computed server-side. The LLM is not asked to determine pass or fail.

---

## Fine-Tuning & Models

AgenticContentFlow leverages a specialized fine-tuned model, **kiran2.0**, optimized specifically for educational concept mapping and structural validation.

### Fine-Tuning Process
- **Data Generation**: 20,000 samples of artificial mindmap evaluation data were generated to cover diverse pedagogical scenarios.
- **Training**: 5,000 high-quality samples were used for the core fine-tuning phase using the **Unsloth** library on Google Colab.
- **Format**: The resulting model is stored and served in the **`safetensors`** format for maximum performance and security.
- **Evaluation**: Performance was validated using a separate set of 100 data points, comparing the base `llama3.2` against the specialized `kiran2.0`.

### Model Downloads (Google Drive)

You can download the fine-tuned model weights from the following locations:

| Model Name | Base Model | URL |
|---|---|---|
| **kiran2.0** | Phi-3-Mini-4k-Instruct | [Download from Google Drive](https://drive.google.com/drive/folders/1TzY8xoFlXwheBZr2ONOqE02X9wB7GwYb?usp=sharing) |

---

## Environment Variables

All backend configuration is via environment variables, set in `docker-compose.yml` or a `backend/.env` file.

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `agenticflow_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `agenticflow_pass` | PostgreSQL password |
| `POSTGRES_HOST` | `db` | PostgreSQL host (use `db` inside Docker, `localhost` for manual setup) |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `agenticflow_db` | PostgreSQL database name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Base URL for the local Ollama API |
| `VALIDATION_MODEL` | `llama3.2` | Ollama model used for topic extraction and flow validation |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace sentence-transformer model for embeddings |
| `VALID_THRESHOLD` | `0.6` | Minimum `points` value (0.0–1.0) for `is_valid: true` |

---

## Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Ollama](https://ollama.com/) running locally with the LLM you want to use:

```bash
ollama pull llama3.2
```

> **Embedding model** — `sentence-transformers/all-MiniLM-L6-v2` is downloaded automatically from HuggingFace the first time the backend starts. No manual setup needed.

---

### Docker Compose (recommended)

```bash
git clone https://github.com/Jalez/agentic-content-flow.git
cd agentic-content-flow
docker-compose up --build -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger / OpenAPI UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

To change configuration (e.g. model, threshold) without rebuilding, edit the `environment:` block in `docker-compose.yml` and restart the backend:

```bash
docker-compose restart backend
```

---

### Manual Development Setup

**Backend:**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Create backend/.env with the variables from the table above
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
