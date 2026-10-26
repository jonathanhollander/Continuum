# Agent 27: API Contract Validator
**Priority:** P1 - HIGH
**Estimated Time:** 2 days
**Dependencies:** 26-fastapi-development
**Category:** Interoperability

---

## OBJECTIVE

Validate API contracts between frontend TypeScript and backend Python to prevent breaking changes.

**Expected Outcome:**
- TypeScript types generated from Python models
- Contract validation tests
- Breaking change detection
- Type safety across stack

---

## IMPLEMENTATION

### Generate TypeScript from Python:

**File:** `/scripts/generate-types.py`

```python
"""Generate TypeScript types from Python Pydantic models"""

from pydantic import BaseModel
from typing import get_type_hints
import inspect

def python_type_to_typescript(py_type: str) -> str:
    type_map = {
        'str': 'string',
        'int': 'number',
        'float': 'number',
        'bool': 'boolean',
        'datetime': 'string',  # ISO string
        'Optional': '| null',
    }
    return type_map.get(py_type, 'any')

def generate_typescript_interface(model: BaseModel, name: str) -> str:
    fields = []
    for field_name, field in model.__fields__.items():
        ts_type = python_type_to_typescript(str(field.type_))
        optional = '?' if not field.required else ''
        fields.append(f'  {field_name}{optional}: {ts_type};')

    return f"export interface {name} {{\n" + '\n'.join(fields) + "\n}"

# Generate types for all models
# Write to /frontend/src/lib/types/api.ts
```

### Contract Validation Tests:

```typescript
// Ensure frontend types match backend
describe('API Contract Validation', () => {
  it('Document type matches backend', async () => {
    const response = await fetch('/api/documents/1');
    const document = await response.json();

    expect(document).toHaveProperty('id');
    expect(document).toHaveProperty('title');
    expect(typeof document.id).toBe('number');
    expect(typeof document.title).toBe('string');
  });
});
```

---

## SUCCESS CRITERIA

- [ ] Type generation script created
- [ ] TypeScript types generated
- [ ] Contract validation tests
- [ ] CI/CD integration
- [ ] Breaking changes detected

---

## COMMIT MESSAGE

```
feat(types): add API contract validation

Generate TypeScript types from Python models and validate contracts.

Implementation:
- Type generation from Pydantic models
- Contract validation tests
- Breaking change detection
- Automated type generation

Impact:
- Type safety across stack
- Catch breaking changes early
- Frontend/backend coordination

Closes: API contract validation
```

---

**READY TO EXECUTE**
