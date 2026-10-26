# Agent 01: Authentication Architect
**Priority:** P0 - CRITICAL
**Estimated Time:** 2-3 days
**Dependencies:** 05-configuration-management
**Category:** Technical Infrastructure

---

## OBJECTIVE

Fix authentication system by replacing hardcoded user_id=1 with proper JWT authentication and multi-user support.

**Current Issues:**
- All users authenticated as user_id=1 (hardcoded)
- No actual login/signup functionality
- JWT tokens generated but never validated
- No user session management
- Security vulnerability: Anyone can access any user's data

**Expected Outcome:**
- Proper JWT authentication flow
- User registration and login
- Session management
- Multi-user support
- Secure authentication endpoints

---

## FILES TO MODIFY

### Backend Files:
1. `/backend/routers/auth.py` - Fix JWT validation
2. `/backend/models/user.py` - Add user model fields
3. `/backend/dependencies.py` - Create get_current_user dependency
4. `/backend/main.py` - Add authentication middleware
5. All `/backend/routers/*.py` - Add authentication to endpoints

### Frontend Files:
6. `/frontend/src/lib/stores/authStore.ts` - JWT storage and validation
7. `/frontend/src/lib/api/client.ts` - Add JWT to all requests
8. `/frontend/src/routes/login/+page.svelte` - Create login page
9. `/frontend/src/routes/signup/+page.svelte` - Create signup page
10. `/frontend/src/hooks.server.ts` - Add authentication guards

---

## IMPLEMENTATION

### Step 1: Create User Dependency (Backend)

**File:** `/backend/dependencies.py` (create if doesn't exist)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from backend.models.user import User
from backend.database import get_session
import os

security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Extract and validate JWT token, return current user.

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.get(User, user_id)
    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify user account is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```

---

### Step 2: Fix Authentication Router

**File:** `/backend/routers/auth.py`

**Add proper signup endpoint:**

```python
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from backend.models.user import User
from backend.database import get_session
import os

router = APIRouter(prefix="/api/auth", tags=["authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup", response_model=Token)
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register new user account"""

    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id}, expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email
    )

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Authenticate user and return JWT token"""

    # Find user by email
    user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )
```

---

### Step 3: Update User Model

**File:** `/backend/models/user.py`

```python
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
```

---

### Step 4: Add Authentication to All Endpoints

**Example:** `/backend/routers/documents.py`

**Before:**
```python
@router.get("/api/documents")
def get_documents(session: Session = Depends(get_session)):
    user_id = 1  # ❌ HARDCODED
    documents = session.exec(
        select(Document).where(Document.user_id == user_id)
    ).all()
    return documents
```

**After:**
```python
from backend.dependencies import get_current_active_user
from backend.models.user import User

@router.get("/api/documents")
def get_documents(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all documents for authenticated user"""
    documents = session.exec(
        select(Document).where(Document.user_id == current_user.id)
    ).all()
    return documents
```

**Apply this pattern to ALL endpoints in:**
- `/backend/routers/documents.py`
- `/backend/routers/contacts.py`
- `/backend/routers/wishes.py`
- `/backend/routers/inventory.py`
- `/backend/routers/medical.py`
- `/backend/routers/pulse.py`
- All other routers

---

### Step 5: Frontend Authentication Store

**File:** `/frontend/src/lib/stores/authStore.ts`

```typescript
import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  // Load token from localStorage on init
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ user, token, isAuthenticated: true });
    }
  }

  return {
    subscribe,

    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const user = {
        id: data.user_id,
        email: data.email,
        full_name: '' // Will be fetched later
      };

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      set({ user, token: data.access_token, isAuthenticated: true });
      goto('/dashboard');
    },

    signup: async (email: string, password: string, full_name: string) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      const user = {
        id: data.user_id,
        email: data.email,
        full_name
      };

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      set({ user, token: data.access_token, isAuthenticated: true });
      goto('/dashboard');
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ user: null, token: null, isAuthenticated: false });
      goto('/login');
    },

    getToken: () => {
      const state = get({ subscribe });
      return state.token;
    }
  };
}

export const authStore = createAuthStore();
```

---

### Step 6: Update API Client to Include JWT

**File:** `/frontend/src/lib/api/client.ts`

```typescript
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const auth = get(authStore);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add JWT token if authenticated
  if (auth.isAuthenticated && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 401 Unauthorized - token expired
  if (response.status === 401) {
    authStore.logout();
    throw new Error('Session expired. Please login again.');
  }

  return response;
}
```

---

### Step 7: Create Login Page

**File:** `/frontend/src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  onMount(() => {
    // Redirect if already logged in
    const unsubscribe = authStore.subscribe(auth => {
      if (auth.isAuthenticated) {
        goto('/dashboard');
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    error = '';
    loading = true;

    try {
      await authStore.login(email, password);
    } catch (err) {
      error = 'Invalid email or password. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
    <div>
      <h2 class="text-3xl font-bold text-center">Welcome back</h2>
      <p class="mt-2 text-center text-gray-600">
        Sign in to continue planning
      </p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="mt-8 space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <p class="text-center text-sm text-gray-600">
        Don't have an account?
        <a href="/signup" class="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </a>
      </p>
    </form>
  </div>
</div>
```

---

### Step 8: Create Signup Page

**File:** `/frontend/src/routes/signup/+page.svelte`

```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let fullName = '';
  let error = '';
  let loading = false;

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      if (auth.isAuthenticated) {
        goto('/dashboard');
      }
    });
    return unsubscribe;
  });

  async function handleSignup() {
    error = '';

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }

    loading = true;

    try {
      await authStore.signup(email, password, fullName);
    } catch (err) {
      error = 'Could not create account. Email may already be registered.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
    <div>
      <h2 class="text-3xl font-bold text-center">Create your account</h2>
      <p class="mt-2 text-center text-gray-600">
        Begin organizing what matters most
      </p>
    </div>

    <form on:submit|preventDefault={handleSignup} class="mt-8 space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            minlength="8"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p class="text-center text-sm text-gray-600">
        Already have an account?
        <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
          Sign in
        </a>
      </p>
    </form>
  </div>
</div>
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -m pytest tests/test_auth.py
python -c "from routers.auth import router; print('✓ Auth router valid')"

# Frontend validation
cd frontend
npm run check
npm run build

# Test authentication flow
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
```

---

## SUCCESS CRITERIA

- [ ] JWT tokens generated and validated correctly
- [ ] User signup creates new user in database
- [ ] User login returns valid JWT token
- [ ] All endpoints require authentication (no hardcoded user_id=1)
- [ ] Frontend stores JWT in localStorage
- [ ] Frontend includes JWT in all API requests
- [ ] 401 responses log user out automatically
- [ ] Login page redirects to dashboard on success
- [ ] Signup page redirects to dashboard on success
- [ ] Password hashing with bcrypt works
- [ ] Email uniqueness enforced

---

## TESTING

### Manual Testing:

1. **Signup Flow:**
   - Navigate to `/signup`
   - Enter email, password, full name
   - Submit form
   - Verify redirect to dashboard
   - Check JWT token in localStorage

2. **Login Flow:**
   - Logout
   - Navigate to `/login`
   - Enter credentials
   - Verify redirect to dashboard

3. **Protected Endpoints:**
   - Try accessing `/api/documents` without token (should get 401)
   - Login and try again (should work)

### Automated Testing:

```python
# backend/tests/test_auth.py
def test_signup():
    response = client.post("/api/auth/signup", json={
        "email": "newuser@example.com",
        "password": "password123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login():
    response = client.post("/api/auth/login", json={
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_endpoint():
    # Without token
    response = client.get("/api/documents")
    assert response.status_code == 401

    # With token
    token = login_and_get_token()
    response = client.get("/api/documents", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
```

---

## ROLLBACK

### If Issues Occur:

```bash
git checkout HEAD -- backend/routers/auth.py
git checkout HEAD -- backend/dependencies.py
git checkout HEAD -- backend/models/user.py
git checkout HEAD -- frontend/src/lib/stores/authStore.ts
git checkout HEAD -- frontend/src/routes/login/
git checkout HEAD -- frontend/src/routes/signup/
```

---

## COMMIT MESSAGE

```
feat(auth): implement JWT authentication and multi-user support

Replace hardcoded user_id=1 with proper JWT authentication system.

Issues Fixed:
- All users were authenticated as user_id=1 (major security issue)
- No actual login/signup functionality
- JWT tokens generated but never validated
- Anyone could access any user's data

Implementation:
- Created get_current_user dependency for JWT validation
- Added signup endpoint with bcrypt password hashing
- Added login endpoint returning JWT tokens
- Updated all backend endpoints to require authentication
- Created frontend auth store with JWT management
- Built login and signup pages
- Added automatic logout on 401 responses

Backend Changes:
- backend/dependencies.py (new): JWT validation dependency
- backend/routers/auth.py: Proper signup/login endpoints
- backend/models/user.py: Updated user model with password field
- All routers: Added authentication requirement

Frontend Changes:
- frontend/src/lib/stores/authStore.ts: JWT state management
- frontend/src/lib/api/client.ts: Auto-include JWT in requests
- frontend/src/routes/login/+page.svelte: Login page
- frontend/src/routes/signup/+page.svelte: Signup page

Security:
- Password hashing with bcrypt
- JWT tokens with 30-day expiration
- Email uniqueness enforced
- Protected endpoints require valid JWT

Testing:
- Manual testing of signup/login flows
- Automated tests for auth endpoints
- Verified JWT validation works
- Confirmed 401 handling

Impact:
- CRITICAL: Fixes major security vulnerability
- Enables true multi-user support
- Proper authentication flow
- Session management

Closes: Authentication system overhaul
Ref: CODEBASE_REVIEW_REPORT.md issue #1
```

---

## NOTES

### Railway PostgreSQL Database:
- **This agent will use your EXISTING Railway PostgreSQL database**
- The User table will be created in your existing Railway PostgreSQL
- No need to set up a new database - it's already running
- SQLModel will create the `user` table on first run or via Alembic migration
- The `DATABASE_URL` is automatically provided by Railway

### Critical Implementation Notes:
- This is a CRITICAL security fix
- All endpoints must be updated to use get_current_active_user dependency
- JWT secret should be changed in production via environment variable
- Password reset flow should be added in follow-up
- Consider adding refresh tokens for better security
- May need to create migration for existing users

---

**READY TO EXECUTE**

Claude: Read this specification and execute when authentication is priority.
