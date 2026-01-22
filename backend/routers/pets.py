from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import Pet
from backend.utils.audit import log_audit, log_deletion

router = APIRouter(prefix="/api/pets", tags=["pets"])

@router.get("/", response_model=List[Pet])
def get_pets(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Pet).where(Pet.user_id == user.id)
    return session.exec(statement).all()

@router.post("/", response_model=Pet)
def create_pet(request: Request, pet: Pet, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pet.user_id = user.id
    session.add(pet)
    session.commit()
    session.refresh(pet)

    # P1-High: Audit logging for pet creation
    log_audit(
        session=session,
        request=request,
        action="create_pet",
        user_id=user.id,
        user_email=user.email,
        resource_type="pet",
        resource_id=str(pet.id)
    )
    return pet

@router.put("/{pet_id}", response_model=Pet)
def update_pet(pet_id: int, updated: Pet, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pet = session.get(Pet, pet_id)
    if not pet or pet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id" and key != "user_id":
            setattr(pet, key, val)
    
    session.add(pet)
    session.commit()
    session.refresh(pet)
    return pet

@router.delete("/{pet_id}")
def delete_pet(request: Request, pet_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pet = session.get(Pet, pet_id)
    if not pet or pet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Pet not found")

    # P1-High: Audit logging for pet deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="pet",
        resource_id=pet_id
    )

    session.delete(pet)
    session.commit()
    return {"status": "deleted"}
