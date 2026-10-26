# Agent 40: Breaking Change Detector
**Priority:** P1 - HIGH
**Estimated Time:** 4-6 hours (1 day)
**Dependencies:** None (standalone)
**Category:** GitHub Review

---

## OBJECTIVE

Automatically detect breaking changes in pull requests before they reach production.

**Breaking Changes to Detect:**
- API endpoints removed or renamed
- Database schema changes (columns removed/renamed, type changes)
- Component prop changes (removed/renamed props)
- Function signature changes in shared libraries
- Configuration variable changes

**Expected Outcome:**
- Python script that analyzes git diffs
- Detects breaking changes automatically
- Provides clear descriptions of what broke
- Suggests migration paths
- Blocks PR merge if breaking changes found

---

## FILES TO CREATE

### Detection Scripts:
1. `/scripts/pr-review/breaking_change_detector.py` - Main detector
2. `/scripts/pr-review/detectors/api_endpoint_detector.py` - API changes
3. `/scripts/pr-review/detectors/schema_detector.py` - Database schema changes
4. `/scripts/pr-review/detectors/component_detector.py` - Component prop changes
5. `/scripts/pr-review/detectors/config_detector.py` - Configuration changes

### Configuration:
6. `/scripts/pr-review/breaking_change_rules.json` - Detection rules

---

## IMPLEMENTATION

### Step 1: Create Main Breaking Change Detector

**File:** `/scripts/pr-review/breaking_change_detector.py`

```python
#!/usr/bin/env python3
"""
Breaking change detector for Continuum

Analyzes git diffs to detect changes that would break existing functionality.
"""

import re
import subprocess
import json
from typing import List, Dict, Any
from pathlib import Path

from detectors.api_endpoint_detector import APIEndpointDetector
from detectors.schema_detector import SchemaDetector
from detectors.component_detector import ComponentDetector
from detectors.config_detector import ConfigDetector


class BreakingChangeDetector:
    """
    Detect breaking changes across codebase

    Breaking changes include:
    - API endpoints removed/renamed
    - Database columns removed/renamed
    - Component props removed/renamed
    - Configuration variables removed/renamed
    """

    def __init__(self, base_ref: str, head_ref: str):
        self.base_ref = base_ref
        self.head_ref = head_ref
        self.breaking_changes = []

        # Initialize specialized detectors
        self.api_detector = APIEndpointDetector()
        self.schema_detector = SchemaDetector()
        self.component_detector = ComponentDetector()
        self.config_detector = ConfigDetector()

    def detect_breaking_changes(self) -> List[Dict[str, Any]]:
        """
        Run all breaking change detections

        Returns list of breaking changes with descriptions and severity.
        """

        print("🔍 Detecting breaking changes...")

        # Get changed files
        changed_files = self._get_changed_files()

        # 1. Check API endpoints
        api_files = [f for f in changed_files if 'routers/' in f or 'api/' in f]
        if api_files:
            print(f"   Checking {len(api_files)} API files...")
            api_changes = self.api_detector.detect_changes(
                api_files, self.base_ref, self.head_ref
            )
            self.breaking_changes.extend(api_changes)

        # 2. Check database schema
        schema_files = [f for f in changed_files if 'models/' in f or 'migrations/' in f]
        if schema_files:
            print(f"   Checking {len(schema_files)} schema files...")
            schema_changes = self.schema_detector.detect_changes(
                schema_files, self.base_ref, self.head_ref
            )
            self.breaking_changes.extend(schema_changes)

        # 3. Check component props
        component_files = [f for f in changed_files if f.endswith('.svelte') or f.endswith('.tsx')]
        if component_files:
            print(f"   Checking {len(component_files)} component files...")
            component_changes = self.component_detector.detect_changes(
                component_files, self.base_ref, self.head_ref
            )
            self.breaking_changes.extend(component_changes)

        # 4. Check configuration
        config_files = [f for f in changed_files if 'config' in f or '.env' in f]
        if config_files:
            print(f"   Checking {len(config_files)} config files...")
            config_changes = self.config_detector.detect_changes(
                config_files, self.base_ref, self.head_ref
            )
            self.breaking_changes.extend(config_changes)

        print(f"   Found {len(self.breaking_changes)} breaking changes")

        return self.breaking_changes

    def _get_changed_files(self) -> List[str]:
        """Get list of changed files in PR"""
        result = subprocess.run(
            ['git', 'diff', '--name-only', self.base_ref, self.head_ref],
            capture_output=True,
            text=True
        )
        return [f for f in result.stdout.strip().split('\n') if f]

    def _get_file_diff(self, file: str) -> str:
        """Get diff for specific file"""
        result = subprocess.run(
            ['git', 'diff', self.base_ref, self.head_ref, '--', file],
            capture_output=True,
            text=True
        )
        return result.stdout
```

---

### Step 2: Create API Endpoint Detector

**File:** `/scripts/pr-review/detectors/api_endpoint_detector.py`

```python
"""
Detect breaking changes in API endpoints
"""

import re
from typing import List, Dict, Any
import subprocess


class APIEndpointDetector:
    """
    Detect breaking API changes:
    - Endpoints removed (DELETE without replacement)
    - Endpoints renamed (URL changed)
    - Request/response schema changed
    - Required parameters added
    """

    # Regex patterns for FastAPI endpoints
    ENDPOINT_PATTERN = re.compile(
        r'@router\.(get|post|put|delete|patch)\("([^"]+)"'
    )

    def detect_changes(
        self,
        files: List[str],
        base_ref: str,
        head_ref: str
    ) -> List[Dict[str, Any]]:
        """Detect API endpoint changes"""

        breaking_changes = []

        for file in files:
            # Get before and after versions
            old_content = self._get_file_content(file, base_ref)
            new_content = self._get_file_content(file, head_ref)

            # Extract endpoints from both versions
            old_endpoints = self._extract_endpoints(old_content)
            new_endpoints = self._extract_endpoints(new_content)

            # Find removed endpoints
            removed = old_endpoints - new_endpoints
            for endpoint in removed:
                breaking_changes.append({
                    "type": "api_endpoint_removed",
                    "severity": "critical",
                    "file": file,
                    "description": f"API endpoint removed: {endpoint}",
                    "impact": "Frontend requests to this endpoint will fail with 404",
                    "migration": f"Update all frontend code calling {endpoint}",
                    "endpoint": endpoint
                })

            # Find renamed endpoints (same method, different path)
            renamed = self._find_renamed_endpoints(old_endpoints, new_endpoints)
            for old, new in renamed:
                breaking_changes.append({
                    "type": "api_endpoint_renamed",
                    "severity": "critical",
                    "file": file,
                    "description": f"API endpoint renamed: {old} → {new}",
                    "impact": "Frontend requests to old endpoint will fail",
                    "migration": f"Update all frontend code from {old} to {new}",
                    "old_endpoint": old,
                    "new_endpoint": new
                })

        return breaking_changes

    def _get_file_content(self, file: str, ref: str) -> str:
        """Get file content at specific git ref"""
        try:
            result = subprocess.run(
                ['git', 'show', f'{ref}:{file}'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError:
            # File doesn't exist at this ref (newly added or deleted)
            return ""

    def _extract_endpoints(self, content: str) -> set:
        """Extract all API endpoints from file content"""
        endpoints = set()

        for match in self.ENDPOINT_PATTERN.finditer(content):
            method = match.group(1).upper()
            path = match.group(2)
            endpoint = f"{method} {path}"
            endpoints.add(endpoint)

        return endpoints

    def _find_renamed_endpoints(
        self,
        old_endpoints: set,
        new_endpoints: set
    ) -> List[tuple]:
        """
        Find endpoints that were likely renamed

        Heuristic: Same method, similar function name
        """
        renamed = []

        # Extract methods
        old_by_method = {}
        new_by_method = {}

        for endpoint in old_endpoints:
            method, path = endpoint.split(' ', 1)
            old_by_method.setdefault(method, []).append(path)

        for endpoint in new_endpoints:
            method, path = endpoint.split(' ', 1)
            new_by_method.setdefault(method, []).append(path)

        # Find similar paths
        for method in old_by_method:
            if method not in new_by_method:
                continue

            old_paths = old_by_method[method]
            new_paths = new_by_method[method]

            for old_path in old_paths:
                for new_path in new_paths:
                    # Check if paths are similar (Levenshtein distance or common prefix)
                    if self._are_similar(old_path, new_path):
                        renamed.append((
                            f"{method} {old_path}",
                            f"{method} {new_path}"
                        ))

        return renamed

    def _are_similar(self, path1: str, path2: str) -> bool:
        """Check if two paths are similar (likely a rename)"""

        # Strip parameters
        path1_base = path1.split('?')[0].split('{')[0]
        path2_base = path2.split('?')[0].split('{')[0]

        # Common prefix length
        common = 0
        for c1, c2 in zip(path1_base, path2_base):
            if c1 == c2:
                common += 1
            else:
                break

        # Similar if 70% of characters match
        min_len = min(len(path1_base), len(path2_base))
        return min_len > 0 and (common / min_len) > 0.7
```

---

### Step 3: Create Database Schema Detector

**File:** `/scripts/pr-review/detectors/schema_detector.py`

```python
"""
Detect breaking changes in database schema
"""

import re
from typing import List, Dict, Any
import subprocess


class SchemaDetector:
    """
    Detect breaking database schema changes:
    - Columns removed
    - Columns renamed
    - Column type changed
    - NOT NULL constraints added
    - Foreign keys changed
    """

    # Regex for SQLModel fields
    FIELD_PATTERN = re.compile(
        r'(\w+):\s*(Optional\[)?(\w+)(\])?\s*=\s*Field'
    )

    def detect_changes(
        self,
        files: List[str],
        base_ref: str,
        head_ref: str
    ) -> List[Dict[str, Any]]:
        """Detect schema changes"""

        breaking_changes = []

        for file in files:
            # Only check model files
            if 'models/' not in file:
                continue

            old_content = self._get_file_content(file, base_ref)
            new_content = self._get_file_content(file, head_ref)

            # Extract fields
            old_fields = self._extract_fields(old_content)
            new_fields = self._extract_fields(new_content)

            # Find removed fields
            removed = set(old_fields.keys()) - set(new_fields.keys())
            for field in removed:
                breaking_changes.append({
                    "type": "schema_column_removed",
                    "severity": "critical",
                    "file": file,
                    "description": f"Database column removed: {field}",
                    "impact": "Queries selecting this column will fail",
                    "migration": (
                        f"Create migration to remove column. "
                        f"Update all queries using {field}."
                    ),
                    "field": field,
                    "model": self._extract_model_name(file)
                })

            # Find type changes
            for field in old_fields:
                if field in new_fields:
                    old_type = old_fields[field]
                    new_type = new_fields[field]

                    if old_type != new_type:
                        breaking_changes.append({
                            "type": "schema_type_changed",
                            "severity": "high",
                            "file": file,
                            "description": (
                                f"Column type changed: {field} "
                                f"({old_type} → {new_type})"
                            ),
                            "impact": "Data may be incompatible with new type",
                            "migration": (
                                f"Create migration to convert data. "
                                f"Test data conversion carefully."
                            ),
                            "field": field,
                            "old_type": old_type,
                            "new_type": new_type
                        })

        return breaking_changes

    def _get_file_content(self, file: str, ref: str) -> str:
        """Get file content at specific git ref"""
        try:
            result = subprocess.run(
                ['git', 'show', f'{ref}:{file}'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError:
            return ""

    def _extract_fields(self, content: str) -> Dict[str, str]:
        """Extract all fields and their types from SQLModel"""
        fields = {}

        for match in self.FIELD_PATTERN.finditer(content):
            field_name = match.group(1)
            is_optional = match.group(2) is not None
            field_type = match.group(3)

            if is_optional:
                field_type = f"Optional[{field_type}]"

            fields[field_name] = field_type

        return fields

    def _extract_model_name(self, file: str) -> str:
        """Extract model name from file path"""
        return file.split('/')[-1].replace('.py', '').title()
```

---

### Step 4: Create Component Prop Detector

**File:** `/scripts/pr-review/detectors/component_detector.py`

```python
"""
Detect breaking changes in Svelte component props
"""

import re
from typing import List, Dict, Any
import subprocess


class ComponentDetector:
    """
    Detect breaking component changes:
    - Props removed
    - Props renamed
    - Required props added
    - Prop types changed
    """

    # Regex for Svelte props
    PROP_PATTERN = re.compile(
        r'export\s+let\s+(\w+)(?::\s*(\w+))?(?:\s*=\s*(.+?))?;'
    )

    def detect_changes(
        self,
        files: List[str],
        base_ref: str,
        head_ref: str
    ) -> List[Dict[str, Any]]:
        """Detect component prop changes"""

        breaking_changes = []

        for file in files:
            # Only check component files in lib/components
            if 'lib/components' not in file:
                continue

            old_content = self._get_file_content(file, base_ref)
            new_content = self._get_file_content(file, head_ref)

            # Extract props
            old_props = self._extract_props(old_content)
            new_props = self._extract_props(new_content)

            # Find removed props
            removed = set(old_props.keys()) - set(new_props.keys())
            for prop in removed:
                breaking_changes.append({
                    "type": "component_prop_removed",
                    "severity": "high",
                    "file": file,
                    "description": f"Component prop removed: {prop}",
                    "impact": "Components using this prop will have errors",
                    "migration": (
                        f"Remove {prop} from all usages of this component"
                    ),
                    "prop": prop,
                    "component": self._extract_component_name(file)
                })

            # Find required props added
            added = set(new_props.keys()) - set(old_props.keys())
            for prop in added:
                if not new_props[prop].get('has_default'):
                    breaking_changes.append({
                        "type": "component_required_prop_added",
                        "severity": "high",
                        "file": file,
                        "description": f"Required prop added: {prop}",
                        "impact": "Existing component usages will have errors",
                        "migration": (
                            f"Add {prop} to all usages of this component"
                        ),
                        "prop": prop,
                        "component": self._extract_component_name(file)
                    })

        return breaking_changes

    def _get_file_content(self, file: str, ref: str) -> str:
        """Get file content at specific git ref"""
        try:
            result = subprocess.run(
                ['git', 'show', f'{ref}:{file}'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError:
            return ""

    def _extract_props(self, content: str) -> Dict[str, Dict]:
        """Extract props from Svelte component"""
        props = {}

        for match in self.PROP_PATTERN.finditer(content):
            prop_name = match.group(1)
            prop_type = match.group(2)
            default_value = match.group(3)

            props[prop_name] = {
                "type": prop_type,
                "has_default": default_value is not None
            }

        return props

    def _extract_component_name(self, file: str) -> str:
        """Extract component name from file path"""
        return file.split('/')[-1].replace('.svelte', '')
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Test breaking change detector
cd scripts/pr-review
python breaking_change_detector.py

# Test with sample PR
python -c "
from breaking_change_detector import BreakingChangeDetector
detector = BreakingChangeDetector('HEAD~1', 'HEAD')
changes = detector.detect_breaking_changes()
print(f'Found {len(changes)} breaking changes')
"
```

---

## SUCCESS CRITERIA

- [ ] API endpoint removal detected
- [ ] API endpoint rename detected
- [ ] Database column removal detected
- [ ] Database type change detected
- [ ] Component prop removal detected
- [ ] Required prop addition detected
- [ ] Configuration variable removal detected
- [ ] Clear descriptions provided
- [ ] Migration suggestions provided
- [ ] Severity levels assigned

---

## TESTING

### Manual Testing:

1. **Test API endpoint removal:**
   ```python
   # Remove endpoint in test branch
   # @router.delete("/api/test")

   # Run detector
   # Should detect: "API endpoint removed: DELETE /api/test"
   ```

2. **Test schema change:**
   ```python
   # Change field type in model
   # age: int → age: str

   # Run detector
   # Should detect: "Column type changed: age (int → str)"
   ```

3. **Test component prop removal:**
   ```svelte
   <!-- Remove prop -->
   <!-- export let title: string; -->

   <!-- Run detector -->
   <!-- Should detect: "Component prop removed: title" -->
   ```

### Automated Testing:

```python
# tests/test_breaking_change_detector.py
def test_detects_removed_endpoint():
    # Create temporary files with endpoint
    # Remove endpoint in new version
    # Run detector
    # Assert endpoint removal detected

def test_detects_schema_change():
    # Create temporary model file
    # Change field type
    # Run detector
    # Assert type change detected
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Remove breaking change detector
rm -rf scripts/pr-review/detectors/
git checkout HEAD -- scripts/pr-review/breaking_change_detector.py
```

---

## COMMIT MESSAGE

```
feat(ci): implement breaking change detection for PR reviews

Automatically detect breaking changes before they reach production.

Implementation:

Breaking Change Detector:
- scripts/pr-review/breaking_change_detector.py: Main detector
  - Orchestrates specialized detectors
  - Analyzes git diffs
  - Returns breaking changes with severity

Specialized Detectors:
- api_endpoint_detector.py: API endpoint changes
  - Detects removed endpoints
  - Detects renamed endpoints
  - Suggests migration paths

- schema_detector.py: Database schema changes
  - Detects removed columns
  - Detects type changes
  - Warns about data compatibility

- component_detector.py: Component prop changes
  - Detects removed props
  - Detects required props added
  - Lists affected usages

- config_detector.py: Configuration changes
  - Detects removed variables
  - Detects renamed variables
  - Environment variable tracking

Detection Capabilities:
1. API Endpoints:
   - Removed: DELETE, GET, POST endpoints
   - Renamed: URL path changes
   - Method changes: GET → POST
   - Parameter changes

2. Database Schema:
   - Columns removed
   - Columns renamed
   - Type changes (int → str)
   - NOT NULL added
   - Foreign key changes

3. Component Props:
   - Props removed
   - Required props added
   - Type changes
   - Default value changes

4. Configuration:
   - Environment variables removed
   - Variables renamed
   - Type changes

Output Format:
{
  "type": "api_endpoint_removed",
  "severity": "critical",
  "file": "backend/routers/family.py",
  "description": "API endpoint removed: DELETE /api/family/members/{id}",
  "impact": "Frontend requests will fail with 404",
  "migration": "Update all frontend code calling this endpoint",
  "endpoint": "DELETE /api/family/members/{id}"
}

Severity Levels:
- critical: Blocks merge, immediate action required
- high: Should be reviewed carefully
- medium: Warning, may cause issues
- low: Informational

Integration:
- Called by PR Review GitHub Action
- Blocks merge for critical changes
- Posts detailed comments on PR
- Suggests migration paths

Testing:
- Unit tests for each detector
- Integration tests with git repos
- Manual testing with sample PRs

Impact:
- P1-HIGH: Prevents breaking production
- Catches issues before merge
- Automated migration suggestions
- Reduces debugging time

Future Enhancements:
- Automatic migration generation
- Frontend/backend contract validation
- API versioning suggestions
- Rollback plan generation

Closes: Breaking change detection
```

---

## NOTES

- Critical for preventing production outages
- Automated detection saves hours of debugging
- Clear migration paths help developers
- Severity levels guide prioritization

### Detection Heuristics:
- API rename detection uses path similarity
- Schema changes checked in migrations too
- Component prop detection limited to lib/components
- Config detection checks .env.example

---

**READY TO EXECUTE**

Claude: Read this specification and execute to implement breaking change detection.
