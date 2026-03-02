from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum


class Base(DeclarativeBase):
    pass


class GoalType(str, enum.Enum):
    lose_fat = "lose_fat"
    maintain = "maintain"
    gain_muscle = "gain_muscle"
    performance = "performance"


class ClientProfile(Base):
    __tablename__ = "client_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    goal: Mapped[str] = mapped_column(String(64), default=GoalType.maintain.value)
    target_calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    dietary_restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or comma-separated
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    training_phase: Mapped[str | None] = mapped_column(String(128), nullable=True)  # e.g. "cut", "bulk"
    recovery_preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meal_logs: Mapped[list["MealLog"]] = relationship("MealLog", back_populates="client")
    meal_plans: Mapped[list["MealPlan"]] = relationship("MealPlan", back_populates="client")


class MealLog(Base):
    __tablename__ = "meal_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("client_profiles.id"), nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meal_type: Mapped[str] = mapped_column(String(64), nullable=False)  # breakfast, lunch, dinner, snack
    items: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list of {name, calories?, protein?, ...}
    source: Mapped[str] = mapped_column(String(32), default="manual")  # manual | ocr
    image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped["ClientProfile"] = relationship("ClientProfile", back_populates="meal_logs")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("client_profiles.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    plan_json: Mapped[str] = mapped_column(Text, nullable=False)  # structured meal plan
    goal_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped["ClientProfile"] = relationship("ClientProfile", back_populates="meal_plans")


class SupplementLog(Base):
    __tablename__ = "supplement_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(Integer, nullable=False)  # FK to client_profiles
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(128), nullable=True)
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RecoveryLog(Base):
    __tablename__ = "recovery_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(Integer, nullable=False)
    protocol_name: Mapped[str] = mapped_column(String(256), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
