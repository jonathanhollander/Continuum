from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import InsurancePolicy
from backend.utils.audit import log_audit, log_deletion

router = APIRouter(prefix="/api/insurance", tags=["insurance"])

@router.get("/", response_model=List[InsurancePolicy])
def get_insurance_policies(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(InsurancePolicy).where(InsurancePolicy.user_id == user.id)
    return session.exec(statement).all()

@router.post("/", response_model=InsurancePolicy)
def create_insurance_policy(request: Request, policy: InsurancePolicy, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    policy.user_id = user.id
    session.add(policy)
    session.commit()
    session.refresh(policy)

    # P1-High: Audit logging for insurance policy creation
    log_audit(
        session=session,
        request=request,
        action="create_insurance_policy",
        user_id=user.id,
        user_email=user.email,
        resource_type="insurance_policy",
        resource_id=str(policy.id)
    )
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
def delete_insurance_policy(request: Request, policy_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    policy = session.get(InsurancePolicy, policy_id)
    if not policy or policy.user_id != user.id:
        raise HTTPException(status_code=404, detail="Policy not found")

    # P1-High: Audit logging for insurance policy deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="insurance_policy",
        resource_id=policy_id
    )

    session.delete(policy)
    session.commit()
    return {"status": "deleted"}
