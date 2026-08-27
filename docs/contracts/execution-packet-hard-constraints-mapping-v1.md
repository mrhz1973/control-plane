# Execution Packet hard-constraints mapping v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`  
**Version:** `execution-packet-hard-constraints-mapping-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — CANONICAL CONTRACT DELTA`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Resolve the D-0018-W contract gap for `consumer_input.hard_constraints` without inventing semantics at validation time.

This file is the authoritative GPT-Web mapping delta to be incorporated into `execution-packet-v1` and the OpenClaw planner-consumer contract.

---

## 1. Canonical packet field

`execution-packet-v1` gains one required top-level field:

```yaml
hard_constraints: []
```

Machine shape:

```json
{
  "hard_constraints": {
    "type": "array",
    "items": { "type": "string" }
  }
}
```

The field is required even when there are no constraints; the empty value is `[]`.

No other existing Execution Packet field is the canonical carrier for these constraints.

---

## 2. Exact mapping rule

The unique mapping is:

```text
consumer_input.hard_constraints
        ↓ exact element-for-element copy
execution_packet.hard_constraints
```

Validation requires deep array equality:

- same array length;
- same element order;
- each string byte-for-byte equal after JSON parsing;
- no trimming;
- no case folding;
- no normalization;
- no deduplication;
- no paraphrase;
- no prefix/suffix decoration;
- no migration into `acceptance`, `validation`, `preflight`, `forbidden_paths`, `risk_assessment.reasons`, or any other field.

If input is `[]`, packet must contain `hard_constraints: []`.

If any supplied constraint is missing, changed, reordered, duplicated, merged, or supplemented, the response gate must fail closed.

Stable failure classification for this condition:

```text
HARD_CONSTRAINT_MISMATCH
```

---

## 3. Required contract incorporations

Cursor implementing this delta must update all of the following consistently:

1. `docs/contracts/execution-packet-v1.md`
   - add required top-level `hard_constraints: []` to the minimum contract and example;
   - add planner obligation to preserve the array exactly when supplied by the consumer.

2. `docs/contracts/execution-packet-v1.schema.json`
   - add `hard_constraints` to top-level `required`;
   - add property schema `array<string>`.

3. `docs/contracts/openclaw-execution-packet-consumer-v1.md`
   - add `hard_constraints` to the required `emit_execution_packet` function-tool schema;
   - add the property schema `array<string>`;
   - replace the ambiguous “project hard constraints are preserved” check with exact deep equality against `consumer_input.hard_constraints` and the stable `HARD_CONSTRAINT_MISMATCH` classification.

4. D-0017 deterministic packet validator fixtures/tests
   - update the valid fixture to include `hard_constraints`;
   - keep schema-driven validation; do not hand-code the field contract.

5. D-0018 OpenClaw planner-response gate
   - enforce exact deep-array equality as defined above;
   - add PASS and mismatch fixtures;
   - remove `HARD_CONSTRAINT_MAPPING_UNDEFINED` as the normal blocker after this mapping is incorporated.

---

## 4. Compatibility boundary

This contract delta applies to newly generated `execution-packet-v1` packets from the D-0016-W concrete planner consumer and subsequent consumers.

Historical examples/artifacts in Git history are evidence, not runtime packets, and do not need rewriting unless they are active test fixtures used by the validators.

The schema identifier remains:

```text
execution-packet-v1
```

because this is a pre-runtime completion of the v1 contract, not a deployed incompatible runtime migration.

---

## 5. Hard boundaries

This mapping does not authorize:

- OpenClaw start/restart/config mutation;
- provider/model inference;
- n8n mutation;
- credential handling;
- Cursor execution of a generated packet;
- PM-34/L5/endurance/permanent scheduling.

It is a repo-only contract clarification.

---

**End of contract delta.**
