# Agent 36: Performance Monitoring
**Priority:** P2 - MEDIUM
**Estimated Time:** 1 day
**Dependencies:** 35-error-tracking
**Category:** Monitoring

---

## OBJECTIVE

Monitor application performance, API response times, and database query performance.

---

## IMPLEMENTATION

### API Performance Middleware:

```python
# backend/middleware/performance.py
import time
from fastapi import Request

@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(f"{request.method} {request.url.path} - {process_time:.3f}s")

    response.headers["X-Process-Time"] = str(process_time)
    return response
```

---

## SUCCESS CRITERIA

- [ ] Performance middleware added
- [ ] Slow queries logged
- [ ] Response time monitoring
- [ ] Performance dashboard

---

## COMMIT MESSAGE

```
feat(monitoring): add performance monitoring

Track API response times and database performance.

Implementation:
- Performance middleware
- Slow query logging
- Response time tracking
- Metrics dashboard

Impact:
- Identify performance bottlenecks
- Optimize slow endpoints
- Better user experience

Closes: Performance monitoring
```

---

**READY TO EXECUTE**
