from pydantic_settings import BaseSettings
from pydantic import field_validator
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Nutrition & Recovery Coach"
    debug: bool = False

    # DB
    database_url: str = "sqlite+aiosqlite:///./data/coach.db"

    # RAG
    chroma_persist_dir: str = "./data/chroma"
    embedding_model: str = "all-MiniLM-L6-v2"  # local; no API key
    chunk_size: int = 512
    chunk_overlap: int = 64

    # Optional: LLM for coach (Gemini preferred, then OpenAI; else RAG-only)
    gemini_api_key: str | None = None  # or GOOGLE_API_KEY in .env
    openai_api_key: str | None = None

    class Config:
        # .env lives in project root (parent of backend/)
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        extra = "ignore"

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def gemini_from_google_key(cls, v):
        import os
        return v or os.environ.get("GOOGLE_API_KEY")


def get_settings() -> Settings:
    return Settings()
