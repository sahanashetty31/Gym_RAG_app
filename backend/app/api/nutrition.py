import json
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session, ClientProfile, MealLog
from app.schemas import (
    ClientProfileCreate,
    ClientProfileResponse,
    MealLogCreate,
    MealLogResponse,
    MealItem,
    OCRMealRequest,
)
from app.services.ocr_meal import OCRMealService

router = APIRouter()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


@router.post("/clients", response_model=ClientProfileResponse)
async def create_client(body: ClientProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = ClientProfile(
        name=body.name,
        email=body.email,
        goal=body.goal,
        target_calories=body.target_calories,
        target_protein_g=body.target_protein_g,
        dietary_restrictions=body.dietary_restrictions,
        allergies=body.allergies,
        training_phase=body.training_phase,
        recovery_preferences=body.recovery_preferences,
        extra_context=body.extra_context,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/clients", response_model=list[ClientProfileResponse])
async def list_clients(db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ClientProfile).order_by(ClientProfile.id))
    return list(r.scalars().all())


@router.get("/clients/{client_id}", response_model=ClientProfileResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ClientProfile).where(ClientProfile.id == client_id))
    profile = r.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Client not found")
    return profile


@router.post("/meals/log", response_model=MealLogResponse)
async def log_meal(body: MealLogCreate, db: AsyncSession = Depends(get_db)):
    items_json = json.dumps([i.model_dump() for i in body.items])
    log = MealLog(
        client_id=body.client_id,
        meal_type=body.meal_type,
        items=items_json,
        source="manual",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.post("/meals/log-image", response_model=MealLogResponse)
async def log_meal_image(
    client_id: int = Form(...),
    meal_type: str = Form("lunch"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    ocr = OCRMealService()
    result = ocr.process_image(content)
    items = result.get("items") or []
    if not items:
        raw = result.get("raw_text", "").strip() or "Unrecognized meal"
        items = [{"name": raw, "calories": None, "protein_g": None}]
    items_json = json.dumps(items)
    # Optionally save image to disk
    upload_dir = Path("./data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "img").suffix or ".jpg"
    image_path = str(upload_dir / f"{uuid4().hex}{ext}")
    with open(image_path, "wb") as f:
        f.write(content)
    log = MealLog(
        client_id=client_id,
        meal_type=meal_type,
        items=items_json,
        source="ocr",
        image_path=image_path,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/meals")
async def list_meals(client_id: int | None = None, db: AsyncSession = Depends(get_db)):
    q = select(MealLog)
    if client_id is not None:
        q = q.where(MealLog.client_id == client_id)
    q = q.order_by(MealLog.logged_at.desc()).limit(100)
    r = await db.execute(q)
    logs = r.scalars().all()
    return [{"id": l.id, "client_id": l.client_id, "logged_at": l.logged_at.isoformat(), "meal_type": l.meal_type, "items": l.items, "source": l.source} for l in logs]
