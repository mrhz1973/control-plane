# execution-route-result-v1

Machine-readable output of the V4 **EXECUTION_ROUTER**.

## Shape (ROUTED)

```json
{
  "schema_version": "execution-route-result-v1",
  "request_id": "...",
  "status": "ROUTED",
  "execution_route": {
    "route_id": "opencode+qwen_local",
    "implementer": "opencode",
    "model": "qwen_local",
    "confidence": "high",
    "reason_codes": ["TECHNICAL_REQUIREMENTS_MATCH", "AVAILABLE_COMPATIBLE_ROUTE", "LOWER_COST"]
  },
  "arbitration": {
    "required": false,
    "used": false,
    "arbiter": null
  },
  "reason_codes": ["TECHNICAL_REQUIREMENTS_MATCH", "AVAILABLE_COMPATIBLE_ROUTE", "LOWER_COST"],
  "arbiter_call_count": 0
}
```

## Shape (NO_ROUTE)

`execution_route` MUST be `null`. Include deterministic `reason_codes`.

## Closed reason-code vocabulary

| Code | Meaning |
|---|---|
| `TECHNICAL_REQUIREMENTS_MATCH` | Harness satisfies required capabilities |
| `AVAILABLE_COMPATIBLE_ROUTE` | Registry-compatible pair currently available |
| `RESERVE_PROTECTED` | Route survived reserve/quota floor check |
| `LOWER_COST` | Selected due to lower marginal `cost_mode` |
| `LOCAL_ZERO_COST_SUFFICIENT` | Prefer free local when uniquely cheaper/equivalent after cost |
| `SEMANTIC_ARBITRATION` | Selected among equivalent survivors by routing arbiter |
| `NO_TECHNICAL_ROUTE` | No harness satisfies technical requirements |
| `NO_AVAILABLE_ROUTE` | No otherwise-valid pair currently available |
| `NO_COMPATIBLE_ROUTE` | No registry-compatible harness/model pair |
| `RESERVE_BLOCKED` | Finite/unknown quota fails reserve protection |
| `ARBITER_UNAVAILABLE` | Ambiguity remains but `qwen_local` arbiter unavailable |
| `ARBITRATION_INVALID` | Arbiter returned invalid/unknown route |
| `INVALID_INPUT` | Request failed schema/policy input checks |

No free-form hidden reasoning field.

Machine schema: `docs/contracts/execution-route-result-v1.schema.json`.
