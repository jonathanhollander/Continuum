# Agent 02: Data Persistence Unifier
**Priority:** P0 - CRITICAL
**Estimated Time:** 12-16 hours (2-3 days)
**Dependencies:** 01-authentication-architect
**Category:** Technical Infrastructure

---

## OBJECTIVE

Fix data persistence for 11 modules currently storing data only in localStorage/IndexedDB instead of backend database.

**Current Issues:**
- 80% of module data only saved to localStorage (lost on browser cache clear)
- No backend endpoints for: family, insurance, medical, pets, funeral, digital beneficiaries, trustees, professionals, wishes, inventory, financial
- Users lose all data when switching devices or clearing browser data
- No cloud backup or sync capability

**Expected Outcome:**
- All module data persists to PostgreSQL database
- Full CRUD backend endpoints for all modules
- SQLModel models for each data type
- Frontend updated to use backend APIs instead of localStorage
- Data survives browser cache clears and device changes

---

## FILES TO MODIFY

### Backend Files (Create):
1. `/backend/models/family.py` - Family member model
2. `/backend/models/insurance.py` - Insurance policy model
3. `/backend/models/medical.py` - Medical directive model
4. `/backend/models/pets.py` - Pet information model
5. `/backend/models/funeral.py` - Funeral plan model
6. `/backend/models/beneficiary.py` - Beneficiary model
7. `/backend/models/trustee.py` - Trustee model
8. `/backend/models/professional.py` - Professional contact model
9. `/backend/models/wish.py` - Wish model
10. `/backend/models/inventory.py` - Inventory item model
11. `/backend/models/financial.py` - Financial account model

### Backend Routers (Create):
12. `/backend/routers/family.py` - Family CRUD endpoints
13. `/backend/routers/insurance.py` - Insurance CRUD endpoints
14. `/backend/routers/medical.py` - Medical CRUD endpoints
15. `/backend/routers/pets.py` - Pets CRUD endpoints
16. `/backend/routers/funeral.py` - Funeral CRUD endpoints
17. `/backend/routers/beneficiaries.py` - Beneficiary CRUD endpoints
18. `/backend/routers/trustees.py` - Trustee CRUD endpoints
19. `/backend/routers/professionals.py` - Professional CRUD endpoints
20. `/backend/routers/wishes.py` - Wish CRUD endpoints
21. `/backend/routers/inventory.py` - Inventory CRUD endpoints
22. `/backend/routers/financial.py` - Financial CRUD endpoints

### Backend Main:
23. `/backend/main.py` - Register new routers

### Frontend Files (Modify):
24. `/frontend/src/routes/modules/family/+page.svelte` - Switch to API calls
25. `/frontend/src/routes/modules/insurance/+page.svelte` - Switch to API calls
26. `/frontend/src/routes/modules/medical/+page.svelte` - Switch to API calls
27. `/frontend/src/routes/modules/pets/+page.svelte` - Switch to API calls
28. `/frontend/src/routes/modules/funeral/+page.svelte` - Switch to API calls
29. `/frontend/src/lib/stores/profileStore.ts` - Add backend sync

---

## IMPLEMENTATION

### Step 1: Create Family Member Model

**File:** `/backend/models/family.py`

```python
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, date

class FamilyMember(SQLModel, table=True):
    """Family member information for estate planning"""
    __tablename__ = "family_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Basic Information
    full_name: str = Field(max_length=255)
    relationship: str = Field(max_length=100)  # spouse, child, parent, sibling
    nickname: Optional[str] = Field(default=None, max_length=100)

    # Contact Information
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=500)

    # Personal Details
    date_of_birth: Optional[date] = None
    place_of_birth: Optional[str] = Field(default=None, max_length=255)
    ssn: Optional[str] = Field(default=None, max_length=20)  # Encrypted in production

    # Estate Planning
    is_dependent: bool = Field(default=False)
    is_beneficiary: bool = Field(default=False)
    is_executor: bool = Field(default=False)
    special_needs: Optional[str] = Field(default=None)

    # Metadata
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Sarah Johnson",
                "relationship": "spouse",
                "email": "sarah@example.com",
                "phone": "+1-555-0123",
                "is_beneficiary": True
            }
        }
```

---

### Step 2: Create Family CRUD Router

**File:** `/backend/routers/family.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from backend.models.family import FamilyMember
from backend.models.user import User
from backend.database import get_session
from backend.dependencies import get_current_active_user

router = APIRouter(prefix="/api/family", tags=["family"])

@router.get("/members", response_model=List[FamilyMember])
async def get_family_members(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all family members for authenticated user"""
    members = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    ).all()
    return members

@router.get("/members/{member_id}", response_model=FamilyMember)
async def get_family_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get specific family member by ID"""
    member = session.get(FamilyMember, member_id)

    if not member or member.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )

    return member

@router.post("/members", response_model=FamilyMember)
async def create_family_member(
    member: FamilyMember,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create new family member"""

    # Ensure user_id matches authenticated user
    member.user_id = current_user.id
    member.created_at = datetime.utcnow()

    session.add(member)
    session.commit()
    session.refresh(member)

    return member

@router.put("/members/{member_id}", response_model=FamilyMember)
async def update_family_member(
    member_id: int,
    updated_member: FamilyMember,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update existing family member"""

    member = session.get(FamilyMember, member_id)

    if not member or member.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )

    # Update fields
    for key, value in updated_member.dict(exclude_unset=True).items():
        if key not in ['id', 'user_id', 'created_at']:
            setattr(member, key, value)

    member.updated_at = datetime.utcnow()

    session.add(member)
    session.commit()
    session.refresh(member)

    return member

@router.delete("/members/{member_id}")
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Delete family member"""

    member = session.get(FamilyMember, member_id)

    if not member or member.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )

    session.delete(member)
    session.commit()

    return {"message": "Family member deleted successfully"}
```

---

### Step 3: Create Insurance Policy Model

**File:** `/backend/models/insurance.py`

```python
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, date
from decimal import Decimal

class InsurancePolicy(SQLModel, table=True):
    """Insurance policy information"""
    __tablename__ = "insurance_policies"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Policy Information
    policy_type: str = Field(max_length=100)  # life, health, auto, home, disability
    provider: str = Field(max_length=255)
    policy_number: str = Field(max_length=100)

    # Coverage Details
    coverage_amount: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    premium_amount: Optional[Decimal] = Field(default=None, max_digits=10, decimal_places=2)
    premium_frequency: Optional[str] = Field(default=None, max_length=50)  # monthly, quarterly, annual

    # Dates
    issue_date: Optional[date] = None
    renewal_date: Optional[date] = None
    expiration_date: Optional[date] = None

    # Contact Information
    agent_name: Optional[str] = Field(default=None, max_length=255)
    agent_phone: Optional[str] = Field(default=None, max_length=50)
    agent_email: Optional[str] = Field(default=None, max_length=255)

    # Beneficiaries
    primary_beneficiary: Optional[str] = Field(default=None, max_length=255)
    contingent_beneficiary: Optional[str] = Field(default=None, max_length=255)

    # Status
    is_active: bool = Field(default=True)
    notes: Optional[str] = Field(default=None)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
```

---

### Step 4: Update Frontend to Use Backend APIs

**File:** `/frontend/src/routes/modules/family/+page.svelte`

**Replace localStorage calls with API calls:**

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api/client';

  let familyMembers = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadFamilyMembers();
  });

  async function loadFamilyMembers() {
    try {
      loading = true;
      const response = await apiRequest('/api/family/members');
      if (response.ok) {
        familyMembers = await response.json();
      } else {
        error = 'Failed to load family members';
      }
    } catch (err) {
      error = 'Network error loading family members';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function saveFamilyMember(member) {
    try {
      const method = member.id ? 'PUT' : 'POST';
      const url = member.id
        ? `/api/family/members/${member.id}`
        : '/api/family/members';

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(member)
      });

      if (response.ok) {
        await loadFamilyMembers(); // Refresh list
        return true;
      } else {
        error = 'Failed to save family member';
        return false;
      }
    } catch (err) {
      error = 'Network error saving family member';
      console.error(err);
      return false;
    }
  }

  async function deleteFamilyMember(memberId) {
    try {
      const response = await apiRequest(`/api/family/members/${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadFamilyMembers(); // Refresh list
        return true;
      } else {
        error = 'Failed to delete family member';
        return false;
      }
    } catch (err) {
      error = 'Network error deleting family member';
      console.error(err);
      return false;
    }
  }
</script>

<!-- Rest of component UI -->
```

---

### Step 5: Register Routers in Main

**File:** `/backend/main.py`

**Add imports and router includes:**

```python
from backend.routers import family, insurance, medical, pets, funeral
from backend.routers import beneficiaries, trustees, professionals
from backend.routers import wishes, inventory, financial

# Register routers
app.include_router(family.router)
app.include_router(insurance.router)
app.include_router(medical.router)
app.include_router(pets.router)
app.include_router(funeral.router)
app.include_router(beneficiaries.router)
app.include_router(trustees.router)
app.include_router(professionals.router)
app.include_router(wishes.router)
app.include_router(inventory.router)
app.include_router(financial.router)
```

---

### Step 6: Create Database Migration

**File:** `/backend/migrations/add_missing_tables.py`

```python
"""
Add missing data persistence tables
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Family members table
    op.create_table(
        'family_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('relationship', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('is_beneficiary', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_family_members_user_id', 'family_members', ['user_id'])

    # Insurance policies table
    op.create_table(
        'insurance_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('policy_type', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=255), nullable=False),
        sa.Column('policy_number', sa.String(length=100), nullable=False),
        sa.Column('coverage_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_insurance_policies_user_id', 'insurance_policies', ['user_id'])

    # Continue for other tables...

def downgrade():
    op.drop_table('insurance_policies')
    op.drop_table('family_members')
    # Drop other tables...
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -m pytest tests/test_family.py
python -m pytest tests/test_insurance.py

# Test model creation
python -c "from models.family import FamilyMember; print('✓ Family model valid')"
python -c "from models.insurance import InsurancePolicy; print('✓ Insurance model valid')"

# Test router imports
python -c "from routers.family import router; print('✓ Family router valid')"
python -c "from routers.insurance import router; print('✓ Insurance router valid')"

# Frontend validation
cd frontend
npm run check
npm run build

# Database migration
cd backend
alembic upgrade head
```

---

## SUCCESS CRITERIA

- [ ] 11 SQLModel models created (family, insurance, medical, pets, funeral, beneficiary, trustee, professional, wish, inventory, financial)
- [ ] 11 CRUD routers created with full endpoints (GET, POST, PUT, DELETE)
- [ ] All routers registered in main.py
- [ ] Authentication required on all endpoints
- [ ] Database migration created and tested
- [ ] Frontend updated to use API calls instead of localStorage
- [ ] Data persists across browser cache clears
- [ ] Data syncs across devices
- [ ] No data loss on refresh
- [ ] Backward compatibility: Import existing localStorage data on first load

---

## TESTING

### Manual Testing:

1. **Family Module:**
   - Add family member via frontend
   - Verify saved to database (check with SQL query)
   - Clear browser cache
   - Reload page
   - Verify family member still appears

2. **Insurance Module:**
   - Add insurance policy
   - Edit policy
   - Delete policy
   - Verify all operations persist to database

3. **Cross-Device Test:**
   - Add data on Device A
   - Login on Device B
   - Verify data appears on Device B

### Automated Testing:

```python
# backend/tests/test_family.py
def test_create_family_member(client, auth_headers):
    response = client.post(
        "/api/family/members",
        json={
            "full_name": "John Doe",
            "relationship": "spouse",
            "email": "john@example.com"
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Doe"

def test_get_family_members(client, auth_headers):
    response = client.get("/api/family/members", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_family_member(client, auth_headers, family_member_id):
    response = client.put(
        f"/api/family/members/{family_member_id}",
        json={"full_name": "Jane Doe"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Jane Doe"

def test_delete_family_member(client, auth_headers, family_member_id):
    response = client.delete(
        f"/api/family/members/{family_member_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Revert database migration
cd backend
alembic downgrade -1

# Revert code changes
git checkout HEAD -- backend/models/family.py
git checkout HEAD -- backend/models/insurance.py
git checkout HEAD -- backend/routers/family.py
git checkout HEAD -- backend/routers/insurance.py
git checkout HEAD -- backend/main.py
git checkout HEAD -- frontend/src/routes/modules/family/
git checkout HEAD -- frontend/src/routes/modules/insurance/
```

---

## COMMIT MESSAGE

```
feat(persistence): add backend persistence for 11 missing modules

Fix critical data loss issue by implementing backend database persistence
for modules currently using only localStorage/IndexedDB.

Issues Fixed:
- 80% of module data stored only in localStorage (lost on cache clear)
- No backend endpoints for family, insurance, medical, pets, funeral, etc.
- Data lost when switching devices
- No cloud backup or sync capability

Implementation:

Backend Models Created:
- backend/models/family.py: Family member model with full details
- backend/models/insurance.py: Insurance policy model with coverage info
- backend/models/medical.py: Medical directive model
- backend/models/pets.py: Pet information model
- backend/models/funeral.py: Funeral plan model
- backend/models/beneficiary.py: Beneficiary model
- backend/models/trustee.py: Trustee model
- backend/models/professional.py: Professional contact model
- backend/models/wish.py: Wish model
- backend/models/inventory.py: Inventory item model
- backend/models/financial.py: Financial account model

Backend Routers Created:
- Full CRUD endpoints for all 11 modules
- Authentication required on all endpoints
- Proper error handling with 404/401 responses
- User isolation (users can only access their own data)

Frontend Changes:
- Updated all 11 modules to use API calls instead of localStorage
- Added loading states and error handling
- Maintains backward compatibility (imports localStorage data on first load)
- Proper authentication token inclusion in requests

Database Migration:
- Created tables for all 11 new models
- Foreign keys to users table
- Indexes on user_id for performance
- Timestamps for audit trail

Testing:
- Unit tests for all CRUD operations
- Integration tests for full flow
- Manual testing of data persistence
- Cross-device sync verification

Impact:
- CRITICAL: Prevents data loss on browser cache clear
- Users can access data across devices
- Cloud backup of all estate planning data
- Fixes 80% data persistence gap
- Production-ready multi-user support

Closes: Data persistence for 11 modules
Ref: CODEBASE_REVIEW_REPORT.md issue #3
```

---

## NOTES

- This is a CRITICAL fix preventing major data loss
- Must implement ALL 11 modules to reach production readiness
- Consider creating a data migration script to import existing localStorage data
- Add rate limiting to prevent API abuse
- Consider caching for frequently accessed data
- May want to add soft delete (is_deleted flag) instead of hard delete
- Ensure SSN and sensitive fields are encrypted at rest
- Add audit logging for sensitive data access
- Consider adding bulk import/export endpoints

### Implementation Order:
1. Start with Family module (most commonly used)
2. Then Insurance and Medical (high priority)
3. Then remaining 8 modules
4. Test each module before moving to next
5. Deploy incrementally if possible

### Performance Considerations:
- Add pagination for lists with many items
- Add filtering and search capabilities
- Consider GraphQL for complex queries
- Cache frequently accessed data in Redis

---

**READY TO EXECUTE**

Claude: Read this specification and execute after authentication is implemented.
