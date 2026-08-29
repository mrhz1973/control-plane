# execution-route-request-v1

Sidecar input for the V4 **EXECUTION_ROUTER**.

Selects implementation **harness** and implementation **model** together.

Does **not** replace `execution-packet-v1` (planner-authored task description).

## Shape

```json
{
  "schema_version": "execution-route-request-v1",
  "request_id": "<non-empty string>",
  "technical_requirements": ["filesystem", "code_edit"],
  "risk_level": "low"
}
```

| Field | Rule |
|---|---|
| `request_id` | required non-empty string |
| `technical_requirements` | non-empty unique array from RESOURCE_REGISTRY capability vocabulary |
| `risk_level` | `low` \| `medium` \| `high` |

Capability vocabulary is owned by `resource-registry-v1` (filesystem, terminal, code_edit, planning, classification, routing_arbitration, code_generation, review, persistent_agent, browser).

No task-complexity scoring in this contract.
No model ranking fields.
Machine schema: `docs/contracts/execution-route-request-v1.schema.json`.
