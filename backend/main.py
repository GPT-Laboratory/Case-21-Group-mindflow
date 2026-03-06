from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import rag, eval, flows, node_types, data

# Create Database tables (in a real scenario, use alembic for migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agentic Content Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(eval.router, prefix="/api/eval", tags=["Evaluation"])
app.include_router(flows.router, prefix="/api/flows", tags=["Flows"])
app.include_router(node_types.router, prefix="/api/nodeTypes", tags=["Node Types"])
app.include_router(data.router, prefix="/api", tags=["Data"])

@app.get("/")
def read_root():
    return {
        "message": "Agentic Content Flow API is running",
        "endpoints": {
            "GET /": "API Information",
            "GET /api/flows": "Get all flows",
            "POST /api/flows": "Create new flow",
            "GET /api/flows/{id}": "Get flow by ID",
            "PUT /api/flows/{id}": "Update flow",
            "DELETE /api/flows/{id}": "Delete flow",
            "GET /api/nodeTypes": "Get all node types",
            "POST /api/nodeTypes": "Create new node type",
            "GET /api/nodeTypes/{nodeType}": "Get node type by ID",
            "PUT /api/nodeTypes/{nodeType}": "Update node type",
            "DELETE /api/nodeTypes/{nodeType}": "Delete node type",
            "POST /api/posts": "Receive posts data",
            "POST /api/users": "Receive users data",
            "POST /api/comments": "Receive comments data",
            "POST /api/data": "Generic data endpoint",
            "GET /api/received": "View all received data",
            "DELETE /api/received": "Clear received data",
            "GET /api/rag/documents": "Get uploaded documents",
            "POST /api/rag/upload": "Upload and process document",
            "POST /api/eval/evaluate": "Evaluate flow with LLM"
        }
    }
