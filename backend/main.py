from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import database
import graph_builder
from llm_agent import ContextLLMAgent

app = FastAPI(title="Context Graph System")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data if not already done
database.init_db()

# LLM Agent
llm_agent = ContextLLMAgent("sqlite:///./context_graph.db")

class ChatRequest(BaseModel):
    query: str

from typing import Optional

class ChatResponse(BaseModel):
    answer: str
    sql: str
    target_id: Optional[str] = None

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/graph")
def get_graph(db: Session = Depends(get_db)):
    """Returns the graph representation of the whole database."""
    try:
        return graph_builder.build_graph_data(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
def chat_query(req: ChatRequest):
    """Answers user's data questions using LangChain LLM to SQL."""
    response = llm_agent.query(req.query)
    return ChatResponse(
        answer=response["answer"], 
        sql=response["sql"], 
        target_id=response.get("target_id")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
