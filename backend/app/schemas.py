from datetime import datetime
from pydantic import BaseModel, Field


class ClientProfileCreate(BaseModel):
    name: str
    email: str | None = None
    goal: str = "maintain"
    target_calories: float | None = None
    target_protein_g: float | None = None
    dietary_restrictions: str | None = None
    allergies: str | None = None
    training_phase: str | None = None
    recovery_preferences: str | None = None
    extra_context: str | None = None


class ClientProfileResponse(BaseModel):
    id: int
    name: str
    email: str | None
    goal: str
    target_calories: float | None
    target_protein_g: float | None
    dietary_restrictions: str | None
    allergies: str | None
    training_phase: str | None
    recovery_preferences: str | None
    extra_context: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class MealItem(BaseModel):
    name: str
    calories: int | None = None
    protein_g: float | None = None


class MealLogCreate(BaseModel):
    client_id: int
    meal_type: str = "lunch"  # breakfast, lunch, dinner, snack
    items: list[MealItem]


class MealLogResponse(BaseModel):
    id: int
    client_id: int
    logged_at: datetime
    meal_type: str
    items: str  # JSON
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class OCRMealRequest(BaseModel):
    client_id: int
    meal_type: str = "lunch"


class CoachChatRequest(BaseModel):
    client_id: int
    message: str


class CoachChatResponse(BaseModel):
    reply: str
    sources: list[dict] = []


class MealPlanRequest(BaseModel):
    client_id: int
    days: int = 7
    focus: str | None = None  # e.g. "high_protein", "low_carb"


class SupplementSuggestRequest(BaseModel):
    client_id: int
    goal: str | None = None


class RecoveryProtocolRequest(BaseModel):
    client_id: int
    context: str | None = None  # e.g. "post heavy leg day"
