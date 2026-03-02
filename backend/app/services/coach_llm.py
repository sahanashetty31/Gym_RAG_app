"""
Coach responses using RAG context. Prefers Google Gemini if API key is set, then OpenAI, else formatted RAG suggestions.
"""
from app.config import get_settings
from app.services.rag import RAGService


def _client_context_summary(profile) -> str:
    parts = [f"Goal: {profile.goal}"]
    if profile.target_calories:
        parts.append(f"Target calories: {profile.target_calories}")
    if profile.target_protein_g:
        parts.append(f"Target protein (g): {profile.target_protein_g}")
    if profile.dietary_restrictions:
        parts.append(f"Restrictions: {profile.dietary_restrictions}")
    if profile.allergies:
        parts.append(f"Allergies: {profile.allergies}")
    if profile.training_phase:
        parts.append(f"Training phase: {profile.training_phase}")
    if profile.recovery_preferences:
        parts.append(f"Recovery: {profile.recovery_preferences}")
    if profile.extra_context:
        parts.append(profile.extra_context)
    return "; ".join(parts)


def build_rag_prompt(query: str, context_summary: str, retrieved: list[dict]) -> str:
    refs = "\n\n".join([r["content"] for r in retrieved])
    return f"""You are a Nutrition & Recovery Coach. Use the following context and the client's profile to answer.

Client profile: {context_summary}

Relevant knowledge base excerpts:
{refs}

User question: {query}

Answer in a helpful, concise way. If the knowledge base doesn't cover something, say so and give general safe advice. Do not make up specific numbers (e.g. dosages) unless they appear in the context."""


async def get_llm_reply(prompt: str) -> str:
    settings = get_settings()
    # Prefer Google Gemini if key is set
    if settings.gemini_api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.gemini_api_key,
            )
            msg = llm.invoke([HumanMessage(content=prompt)])
            return msg.content if hasattr(msg, "content") else str(msg)
        except Exception as e:
            return f"[Gemini unavailable: {e}. Showing retrieved context only.]"
    if settings.openai_api_key:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import HumanMessage
            llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key)
            msg = llm.invoke([HumanMessage(content=prompt)])
            return msg.content if hasattr(msg, "content") else str(msg)
        except Exception as e:
            return f"[OpenAI unavailable: {e}. Showing retrieved context only.]"
    return ""


def format_retrieved_as_reply(retrieved: list[dict]) -> str:
    if not retrieved:
        return "No relevant documents found. Consider adding nutrition and recovery documents to the knowledge base."
    lines = ["Here’s what I found from the knowledge base:\n"]
    for i, r in enumerate(retrieved[:5], 1):
        lines.append(f"{i}. {r['content'][:500]}{'...' if len(r['content']) > 500 else ''}")
    return "\n".join(lines)


async def coach_reply(client_context: str, query: str, use_llm: bool = True) -> tuple[str, list[dict]]:
    rag = RAGService.get_instance()
    retrieved = rag.retrieve_for_client(query, client_context, k=6)
    sources = [{"content": r["content"], "metadata": r.get("metadata", {})} for r in retrieved]
    if use_llm:
        prompt = build_rag_prompt(query, client_context, retrieved)
        reply = await get_llm_reply(prompt)
        if reply:
            return reply, sources
    return format_retrieved_as_reply(retrieved), sources
