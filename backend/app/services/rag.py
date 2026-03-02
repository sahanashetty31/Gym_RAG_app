from pathlib import Path
from typing import Optional

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import get_settings


class RAGService:
    _instance: Optional["RAGService"] = None

    def __init__(self):
        settings = get_settings()
        self.embedding = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
        )
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap
        self.persist_dir = Path(settings.chroma_persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self._store: Optional[Chroma] = None

    @classmethod
    def get_instance(cls) -> "RAGService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_collection_name(self) -> str:
        return "nutrition_recovery"

    def ingest_documents(self, docs_dir: Path) -> int:
        """Load .txt/.md from docs_dir, chunk, embed, and store in Chroma."""
        if not docs_dir.exists():
            return 0
        loader = DirectoryLoader(
            str(docs_dir),
            glob="**/*.txt",
            loader_cls=TextLoader,
            loader_kwargs={"encoding": "utf-8"},
        )
        try:
            raw = loader.load()
        except Exception:
            raw = []
        md_loader = DirectoryLoader(
            str(docs_dir),
            glob="**/*.md",
            loader_cls=TextLoader,
            loader_kwargs={"encoding": "utf-8"},
        )
        try:
            raw.extend(md_loader.load())
        except Exception:
            pass
        if not raw:
            return 0
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_documents(raw)
        Chroma.from_documents(
            chunks,
            self.embedding,
            collection_name=self._get_collection_name(),
            persist_directory=str(self.persist_dir),
        )
        return len(chunks)

    def _get_store(self) -> Chroma:
        if self._store is None:
            self._store = Chroma(
                collection_name=self._get_collection_name(),
                embedding_function=self.embedding,
                persist_directory=str(self.persist_dir),
            )
        return self._store

    def retrieve(self, query: str, k: int = 6, filter_metadata: Optional[dict] = None) -> list[dict]:
        store = self._get_store()
        kwargs = {"k": k}
        if filter_metadata:
            kwargs["filter"] = filter_metadata
        docs = store.similarity_search_with_score(query, **kwargs)
        return [
            {"content": d[0].page_content, "metadata": d[0].metadata, "score": float(d[1])}
            for d in docs
        ]

    def retrieve_for_client(self, query: str, client_context: str, k: int = 6) -> list[dict]:
        """Retrieve docs and prepend client context for LLM."""
        combined = f"Client context: {client_context}\n\nQuery: {query}"
        return self.retrieve(combined, k=k)
