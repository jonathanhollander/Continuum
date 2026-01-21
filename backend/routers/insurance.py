from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import InsurancePolicy

router = APIRouter(prefix="/api/insurance", tags=["insurance"])

@router.get("/", response_model=List[InsurancePolicy])
def get_insurance_policies(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(InsurancePolicy).where(InsurancePolicy.user_id == user.id)
    return session.exec(statement).all()

@router.post("/", response_model=InsurancePolicy)
def create_insurance_policy(policy: InsurancePolicy, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    policy.user_id = user.id
    session.add(policy)
    session.commit()
    session.refresh(policy)
    return policy

@router.put("/{policy_id}", response_model=InsurancePolicy)
def update_insurance_policy(policy_id: int, updated: InsurancePolicy, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    policy = session.get(InsurancePolicy, policy_id)
    if not policy or policy.user_id != user.id:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id" and key != "user_id":
            setattr(policy, key, val)
    
    session.add(policy)
    session.commit()
    session.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_insurance_policy(policy_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    policy = session.get(InsurancePolicy, policy_id)
    if not policy or policy.user_id != user.id:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    session.delete(policy)
    session.commit()
    return {"status": "deleted"}
