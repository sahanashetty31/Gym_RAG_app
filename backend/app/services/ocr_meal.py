import base64
import io
import json
import re
from typing import Any

try:
    import pytesseract
    from PIL import Image
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

def _mime_from_bytes(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG"):
        return "image/png"
    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return "image/gif"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return None


MEAL_VISION_PROMPT = """Look at this image of a meal, plate of food, or receipt.

List every food or drink item you can identify. For each item provide:
- name: short name (e.g. "Grilled chicken breast", "White rice")
- calories: number if visible or estimable, otherwise null
- protein_g: grams of protein if visible or estimable, otherwise null

Reply with ONLY a valid JSON array, no other text. Example:
[{"name": "Grilled chicken", "calories": 250, "protein_g": 35}, {"name": "Broccoli", "calories": 55, "protein_g": 4}]
Use null for unknown numbers. If you cannot see any food, return []."""


class OCRMealService:
    """Extract meal items from image using Gemini vision (preferred) or Tesseract OCR."""

    def __init__(self, gemini_api_key: str | None = None):
        from app.config import get_settings
        self._gemini_key = gemini_api_key if gemini_api_key is not None else get_settings().gemini_api_key

    @staticmethod
    def is_tesseract_available() -> bool:
        return HAS_TESSERACT

    def is_gemini_available(self) -> bool:
        return bool(self._gemini_key)

    @staticmethod
    def _image_to_text_tesseract(image_bytes: bytes) -> str:
        if not HAS_TESSERACT:
            return ""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode not in ("L", "RGB"):
                img = img.convert("RGB")
            return pytesseract.image_to_string(img) or ""
        except Exception:
            return ""

    @staticmethod
    def parse_meal_items_from_text(raw_text: str) -> list[dict[str, Any]]:
        """Heuristic: split by newlines/commas, clean, return list of {name, ...}."""
        if not raw_text or not raw_text.strip():
            return []
        lines = re.split(r"[\n,;]+", raw_text)
        items = []
        for line in lines:
            line = line.strip()
            if not line or len(line) < 2:
                continue
            line = re.sub(r"^[\s\-*•#\d.)]+", "", line).strip()
            if not line:
                continue
            name = line
            calories = None
            protein = None
            match_cal = re.search(r"(\d+)\s*(?:cal|kcal)", line, re.I)
            if match_cal:
                calories = int(match_cal.group(1))
                name = re.sub(r"\s*\d+\s*(?:cal|kcal)\s*", " ", name).strip()
            match_pro = re.search(r"(\d+)\s*g?\s*pro(?:tein)?", line, re.I)
            if match_pro:
                protein = float(match_pro.group(1))
                name = re.sub(r"\s*\d+\s*g?\s*pro(?:tein)?\s*", " ", name).strip()
            name = name.strip() or line.strip()
            items.append({"name": name, "calories": calories, "protein_g": protein})
        return items[:50]

    def _extract_with_gemini(self, image_bytes: bytes) -> list[dict[str, Any]] | None:
        """Use Gemini vision to extract meal items. Returns None on failure."""
        if not self._gemini_key:
            return None
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage

            b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
            mime = _mime_from_bytes(image_bytes) or "image/jpeg"
            data_url = f"data:{mime};base64,{b64}"

            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=self._gemini_key,
            )
            msg = HumanMessage(content=[
                {"type": "image_url", "image_url": {"url": data_url}},
                {"type": "text", "text": MEAL_VISION_PROMPT},
            ])
            response = llm.invoke([msg])
            text = (response.content or "").strip() if hasattr(response, "content") else str(response)
            if not text:
                return None
            # Strip markdown code block if present
            if "```" in text:
                text = re.sub(r"^```(?:json)?\s*", "", text)
                text = re.sub(r"\s*```$", "", text)
            data = json.loads(text)
            if not isinstance(data, list):
                return None
            out = []
            for item in data[:50]:
                if not isinstance(item, dict):
                    continue
                name = item.get("name") or item.get("item")
                if not name:
                    continue
                out.append({
                    "name": str(name).strip(),
                    "calories": item.get("calories") if isinstance(item.get("calories"), (int, float)) else None,
                    "protein_g": item.get("protein_g") if isinstance(item.get("protein_g"), (int, float)) else None,
                })
            return out
        except Exception:
            return None

    def process_image(self, image_bytes: bytes) -> dict[str, Any]:
        """Extract meal items: try Gemini vision first, then Tesseract OCR."""
        items: list[dict[str, Any]] = []
        raw_text = ""
        source = "tesseract"

        if self.is_gemini_available():
            gemini_items = self._extract_with_gemini(image_bytes)
            if gemini_items:
                items = gemini_items
                source = "gemini"

        if not items and HAS_TESSERACT:
            raw_text = self._image_to_text_tesseract(image_bytes)
            items = self.parse_meal_items_from_text(raw_text)

        return {"raw_text": raw_text, "items": items, "source": source}
