# Remaining Authentication Work

## High Priority - Must Complete

### 1. Update Remaining Frontend Components with Hardcoded USER_ID

**Files still needing updates:**
- `/frontend/src/routes/modules/pulse/vault/+page.svelte` - Line 20
- `/frontend/src/routes/modules/pulse/messages/+page.svelte` - Line 7
- `/frontend/src/routes/modules/pulse/transparency/+page.svelte` - Line 15
- `/frontend/src/routes/modules/pulse/settings/+page.svelte` - Line 25
- `/frontend/src/routes/modules/contacts/+page.svelte` - Line 24
- `/frontend/src/routes/modules/home-manual/+page.svelte` - Line 25

**Pattern to follow:**
```typescript
// REMOVE:
const USER_ID = 1;
fetch(`/api/endpoint?user_id=${USER_ID}`)

// REPLACE WITH:
import { apiGet, apiPost } from '$lib/api/client';
await apiGet('/api/endpoint')
```

### 2. Add Auth Guards to Protected Routes

Create `/frontend/src/routes/dashboard/+page.ts`:
```typescript
import { auth } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export async function load() {
    const authState = get(auth);
    if (!authState.user) {
        throw redirect(307, '/login');
    }
    return {};
}
```

Apply to all protected routes:
- `/dashboard/+page.ts`
- `/modules/+layout.ts` (protects all module routes)
- `/settings/+page.ts`
- `/binder/+page.ts`

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Specifically ensure:
- `passlib[bcrypt]`
- `bcrypt>=4.0.0`
- `pyjwt`

### 4. Test Database Migration

Run backend and verify:
```bash
cd backend
python main.py
# Look for: "🔧 Migrating: Adding hashed_password to users table"
# Look for: "✅ Dev user created: dev@continuum.im / dev123"
```

## Medium Priority - Should Complete

### 5. Update All Frontend Stores

Many stores might still use direct fetch instead of API client:

**Check and update:**
- `/frontend/src/lib/stores/estateStore.ts`
- `/frontend/src/lib/stores/insuranceStore.ts`
- `/frontend/src/lib/stores/medicalStore.ts`
- `/frontend/src/lib/stores/petStore.ts`
- `/frontend/src/lib/stores/familyStore.ts`

**Pattern:**
```typescript
// Before
const res = await fetch(`${API_BASE_URL}/api/insurance?user_id=${userId}`)
const data = await res.json()

// After
import { apiGet } from '$lib/api/client';
const data = await apiGet('/api/insurance');
```

### 6. Add Loading/Error States to Auth

Update components to show loading states during auth:
```svelte
{#if $auth.loading}
    <div>Authenticating...</div>
{:else if !$auth.user}
    <div>Please login</div>
{:else}
    <!-- Protected content -->
{/if}
```

### 7. Handle Auth Errors Gracefully

Add user-friendly error messages for:
- Invalid credentials
- Network errors
- Email already exists
- Weak passwords

## Low Priority - Nice to Have

### 8. Remember Me Functionality

Add option to extend token expiration:
```typescript
signup(email, password, rememberMe = false)
// If rememberMe, use 30-day token, else 24-hour token
```

### 9. Show Active Session Info

Display logged-in user in header:
```svelte
<script>
    import { auth } from '$lib/stores/auth';
</script>

<div class="user-info">
    {$auth.user?.email}
    <button on:click={() => auth.logout()}>Logout</button>
</div>
```

### 10. Add Logout to Navigation

Update navigation components to include logout button:
- `/frontend/src/lib/components/Navigation.svelte` (if exists)
- `/frontend/src/routes/+layout.svelte`

## Testing Checklist

### Backend Tests
- [ ] Signup creates user with hashed password
- [ ] Login with correct credentials returns token
- [ ] Login with incorrect credentials returns 401
- [ ] Protected endpoints require valid token
- [ ] Protected endpoints reject invalid/expired tokens
- [ ] Different users see only their own data

### Frontend Tests
- [ ] Signup redirects to dashboard on success
- [ ] Login redirects to dashboard on success
- [ ] Unauthenticated users redirected to login
- [ ] Token persists across page refreshes
- [ ] Logout clears token and redirects to login
- [ ] 401 responses trigger automatic logout
- [ ] All API calls include Authorization header

## Quick Commands

### Backend Testing
```bash
# Start backend
cd backend
python main.py

# Test signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test login
curl -X POST http://localhost:8000/api/auth/token \
  -F "username=dev@continuum.im" \
  -F "password=dev123"

# Test authenticated endpoint
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Frontend Testing
```bash
# Start frontend
cd frontend
npm run dev

# Navigate to:
# http://localhost:5173/signup - Create account
# http://localhost:5173/login - Sign in
# http://localhost:5173/dashboard - Protected route
```

## Common Issues & Solutions

### Issue: "401 Unauthorized" on all requests
**Solution:** Check that:
1. Token is in localStorage: `localStorage.getItem('continuum_auth_token')`
2. Auth store initialized: Check `/frontend/src/routes/+layout.ts`
3. API client includes Authorization header

### Issue: "User not found" after login
**Solution:**
1. Check database has users table
2. Run backend to trigger migration
3. Verify dev user was seeded

### Issue: Password hashing error
**Solution:**
1. Install bcrypt: `pip install bcrypt passlib[bcrypt]`
2. Restart backend

### Issue: CORS errors
**Solution:**
1. Check CORS settings in `/backend/config.py`
2. Ensure VITE_API_URL matches backend URL

## Estimated Time to Complete

- High Priority Tasks: **2-3 hours**
- Medium Priority Tasks: **1-2 hours**
- Low Priority Tasks: **1 hour**
- Testing: **1 hour**

**Total:** 5-7 hours for full implementation
