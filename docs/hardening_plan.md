# Implementation Plan – Nexus Hardening

## Overview
Structural hardening of the Nexus Command Hub to improve robustness, clarity, and maintainability.

## Completed Actions

### 1. Event System (Hardened)
- **File**: `core/event_system.py`
- **Schema**: Implemented strict JSONL schema (timestamp, module, type, name, severity, source, data).
- **Refactor**: Updated all legacy calls in `storage_api.py`, `grow_api.py`, and `sentinel_api.py` to match the new signature.

### 2. Layer Enforcement Rules
- **File**: `rules/layer_enforcement.md`
- **Content**: Defined interaction matrix for DATA, CONTROL, INTELLIGENCE, and EXECUTION layers. Forbidden operations and code-level guidelines established.

### 3. Execution API (Unified)
- **File**: `blueprints/api/system_api.py`
- **Route**: `/api/execute/<action>` (POST)
- **Security**: Centralized action mapping, no direct script execution, timeouts enforced.

### 4. Semantic Watchdog
- **File**: `System-Utilities/devops/watchdog.py`
- **Checks**: API health, DB integrity, Prometheus availability, and disk thresholds.
- **Integration**: Emits critical events directly to the new event system.

### 5. System State Endpoint
- **File**: `blueprints/api/system_api.py`
- **Route**: `/api/system/state` (GET)
- **Content**: Aggregated view of status, issues, service states, and confidence score.

### 6. Stability & Errors
- **Files**: `core/errors.py`, `core/utils.py`
- **Standardization**: Created `BaseError`, `ValidationError`, `ExecutionError`, `SystemError`.
- **Wrapper**: Added `retry_with_backoff` decorator for external calls.

## Next Steps (Developer Manual)
1. **Cronjob**: Add `*/5 * * * * /usr/bin/python3 /home/user/Dokumente/Antigravity/Server-Änderungen/Nexus-Control-Hub/System-Utilities/devops/watchdog.py` to crontab.
2. **Action Mapping**: Extend `ACTION_MAPPING` in `system_api.py` for new system-level tasks.
3. **Frontend**: Update UI to poll `/api/system/state` for the global health status.
