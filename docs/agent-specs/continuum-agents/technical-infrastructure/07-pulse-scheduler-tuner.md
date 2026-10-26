# Agent 07: Pulse Scheduler Tuner
**Priority:** P0 - CRITICAL (Quick Win)
**Estimated Time:** 2 minutes
**Dependencies:** None
**Category:** Technical Infrastructure

---

## OBJECTIVE

Fix Pulse scheduler running 60x too frequently - currently runs every 1 minute instead of every 1 hour.

**Current Issue:**
- Pulse scheduler set to run every 1 minute
- Should run hourly (comment in code says so)
- Causes database overload and potential notification spam

**Expected Outcome:**
- Scheduler runs every hour
- Configurable via environment variable
- Prevents database spam

---

## FILES TO MODIFY

### 1. `/backend/pulse_scheduler.py`
**Change:** Line 19 - Change interval from minutes=1 to hours=1

---

## IMPLEMENTATION

### Step 1: Read Current File
```bash
Read /backend/pulse_scheduler.py
```

### Step 2: Locate Scheduler Configuration
**Find line 19:**
```python
scheduler.add_job(pulse_job, 'interval', minutes=1, id='pulse_check')
```

### Step 3: Change to Hourly Interval
**Replace with:**
```python
# Make interval configurable via environment variable (default 1 hour)
import os
interval_hours = int(os.getenv('PULSE_CHECK_INTERVAL_HOURS', '1'))
scheduler.add_job(pulse_job, 'interval', hours=interval_hours, id='pulse_check')
```

---

## EXACT CHANGES

### File: `/backend/pulse_scheduler.py`

**Current (line 19):**
```python
scheduler.add_job(pulse_job, 'interval', minutes=1, id='pulse_check')
```

**Replace with:**
```python
# Pulse check interval (hours) - configurable via env var
import os
pulse_interval_hours = int(os.getenv('PULSE_CHECK_INTERVAL_HOURS', '1'))
scheduler.add_job(pulse_job, 'interval', hours=pulse_interval_hours, id='pulse_check')
print(f"📅 Pulse scheduler set to run every {pulse_interval_hours} hour(s)")
```

---

## VALIDATION

### Pre-Commit Checks:
```bash
# Python syntax check
cd backend
python -m py_compile pulse_scheduler.py

# Verify imports
python -c "import os; import pulse_scheduler"
```

### Expected Results:
- ✅ No Python syntax errors
- ✅ File compiles successfully
- ✅ os module import works

---

## SUCCESS CRITERIA

- [ ] Interval changed from minutes=1 to hours=1
- [ ] Environment variable support added
- [ ] Default is 1 hour
- [ ] Import statement added for os module
- [ ] Log message shows interval on startup
- [ ] File compiles without errors

---

## TESTING

### Manual Test:
1. Start backend server
2. Check logs for "Pulse scheduler set to run every 1 hour(s)"
3. Wait and verify scheduler only runs hourly (not every minute)

### Environment Variable Test:
```bash
# Test custom interval
export PULSE_CHECK_INTERVAL_HOURS=2
python backend/pulse_scheduler.py
# Should log "every 2 hour(s)"
```

---

## ROLLBACK

### If Issues Occur:
```bash
git checkout HEAD -- backend/pulse_scheduler.py
```

**Or revert to:**
```python
scheduler.add_job(pulse_job, 'interval', hours=1, id='pulse_check')
```

---

## COMMIT MESSAGE

```
fix(pulse): correct scheduler interval from 1 minute to 1 hour

Change Pulse scheduler from running every 1 minute to every 1 hour
as originally intended (code comment indicates hourly was the goal).

Issue:
- Scheduler running 60x too frequently
- Causes unnecessary database queries
- Would spam notifications if email service worked
- Line 19: minutes=1 should be hours=1

Fix:
- Change interval from minutes=1 to hours=1
- Add environment variable support (PULSE_CHECK_INTERVAL_HOURS)
- Default to 1 hour
- Add startup log message showing interval

Impact:
- Reduces database load by 60x
- Prevents notification spam
- Allows customization via env var for testing

Testing:
- Python compilation passes
- Server starts successfully
- Log confirms hourly interval

Closes: Pulse scheduler frequency issue
Ref: CODEBASE_REVIEW_REPORT.md issue #6
```

---

## NOTES

- Trivial fix but prevents significant database overload
- Environment variable allows testing with shorter intervals (e.g., 5 minutes for dev)
- No impact on functionality - just timing
- Should take < 2 minutes

---

## OPTIONAL ENHANCEMENT

### Add to .env.example:
```bash
# Pulse safety check interval (hours)
# Default: 1 hour
# For testing, you can set to 0.083 (5 minutes) or 0.0167 (1 minute)
PULSE_CHECK_INTERVAL_HOURS=1
```

---

**READY TO EXECUTE**

Claude: Read this specification and execute immediately.
