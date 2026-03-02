from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session, ClientProfile, MealLog
from app.schemas import (
    CoachChatRequest,
    CoachChatResponse,
    MealPlanRequest,
    SupplementSuggestRequest,
    RecoveryProtocolRequest,
)
from app.services.rag import RAGService
from app.services.coach_llm import _client_context_summary, coach_reply

router = APIRouter()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def _get_profile(client_id: int, db: AsyncSession) -> ClientProfile:
    r = await db.execute(select(ClientProfile).where(ClientProfile.id == client_id))
    profile = r.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Client not found")
    return profile


@router.post("/chat", response_model=CoachChatResponse)
async def coach_chat(body: CoachChatRequest, db: AsyncSession = Depends(get_db)):
    profile = await _get_profile(body.client_id, db)
    context = _client_context_summary(profile)
    reply, sources = await coach_reply(context, body.message, use_llm=True)
    return CoachChatResponse(reply=reply, sources=[{"content": s["content"][:300]} for s in sources])


@router.post("/meal-plan")
async def get_meal_plan(body: MealPlanRequest, db: AsyncSession = Depends(get_db)):
    profile = await _get_profile(body.client_id, db)
    context = _client_context_summary(profile)
    query = f"Meal plan for {body.days} days. Goal: {profile.goal}. Focus: {body.focus or 'balanced'}."
    rag = RAGService.get_instance()
    retrieved = rag.retrieve_for_client(query, context, k=8)
    plan_text = "\n\n---\n\n".join([r["content"] for r in retrieved])
    return {
        "client_id": body.client_id,
        "days": body.days,
        "plan_summary": plan_text[:4000],
        "sources": [{"content": r["content"][:400]} for r in retrieved[:5]],
    }


@router.post("/supplements")
async def suggest_supplements(body: SupplementSuggestRequest, db: AsyncSession = Depends(get_db)):
    profile = await _get_profile(body.client_id, db)
    context = _client_context_summary(profile)
    goal = body.goal or profile.goal
    query = f"Supplement recommendations for goal: {goal}. Training: {profile.training_phase or 'general'}."
    rag = RAGService.get_instance()
    retrieved = rag.retrieve_for_client(query, context, k=6)
    return {
        "client_id": body.client_id,
        "suggestions": [r["content"] for r in retrieved],
        "sources": [{"content": r["content"][:400]} for r in retrieved],
    }


@router.post("/recovery")
async def get_recovery_protocols(body: RecoveryProtocolRequest, db: AsyncSession = Depends(get_db)):
    profile = await _get_profile(body.client_id, db)
    context = _client_context_summary(profile)
    query = f"Recovery protocols. Context: {body.context or 'general recovery'}. Preferences: {profile.recovery_preferences or 'none'}."
    rag = RAGService.get_instance()
    retrieved = rag.retrieve_for_client(query, context, k=6)
    return {
        "client_id": body.client_id,
        "protocols": [r["content"] for r in retrieved],
        "sources": [{"content": r["content"][:400]} for r in retrieved],
    }


@router.post("/ingest")
async def ingest_documents():
    """Ingest from data/docs (relative to backend) into vector store. Call once after adding docs."""
    from pathlib import Path
    # backend/app/api/coach.py -> backend/data/docs
    docs_dir = Path(__file__).resolve().parent.parent.parent / "data" / "docs"
    rag = RAGService.get_instance()
    n = rag.ingest_documents(docs_dir)
    return {"ingested_chunks": n, "docs_dir": str(docs_dir)}
