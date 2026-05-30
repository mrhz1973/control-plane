# DECISION_PACKET_FORMAT — canonical extended human gate format

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/foundation/DECISION_PACKET_FORMAT.md`  
**Status:** **Wb-docs** — format definition only (documentation). Not a send. Not runtime.  
**Parent rule:** [`PROJECT_VISION.md` §7.7](PROJECT_VISION.md) — Decision Packet canonical human gate format.

---

## 1. Purpose and parent rule

This document is the **canonical extension** of [`PROJECT_VISION.md` §7.7](PROJECT_VISION.md).  
**§7.7 remains the parent rule**; this file elaborates the **full extended format** promised in §7.7 without contradicting it.

| Statement | Value |
|-----------|--------|
| Parent | `PROJECT_VISION.md` §7.7 — 10 minimum fields, structured gate, Telegram channel |
| This document | **Superset** of §7.7 — adds classifier bridge and evidence fields |
| Contradiction | **Forbidden** — if conflict, §7.7 wins |
| Duplication | This file **extends**, does not replace or restate §7.7 as an independent spec |

**Bridge role:** this format connects **classifier output** (`classifier-wrapper-v1` / `classifier-server-v1`) to the **human Telegram gate**. Classifier fields populate routing evidence; orchestrator fields populate the decision frame; the user responds with a number or short word.

**Related:** [`docs/contracts/classifier-wrapper-v1.md`](../contracts/classifier-wrapper-v1.md) · [`PROJECT_VISION.md` §6.3](PROJECT_VISION.md) · [`PROJECT_VISION.md` §7.7](PROJECT_VISION.md)

---

## 2. Relationship to §7.7 (preserved rules)

The following §7.7 rules apply unchanged:

- **Structured, not free-form** — no open-ended prose questions as the primary gate.
- **2–5 numbered options** — never more than five; never fewer than two when a real choice exists.
- **Explicit orchestrator recommendation** — which option and why.
- **User reply format** — number or short word (e.g. `1`, `2`, `A`), **never** required free prose.
- **Channel** — Telegram notification and reply.
- **ID format** — `D-NNNN-X` (e.g. `D-0002-C`).
- **Kind** — `automation` | `meta` | `runtime`.

This document adds classifier/evidence fields and redaction rules; it does **not** relax any §7.7 constraint.

---

## 3. Extended format — full field table

The table below is a **documented superset** of the 10 §7.7 minimum fields (rows 1–10) plus classifier/evidence bridge fields (rows 11–16).

| # | Campo | Contenuto | Source / populated by |
|---|--------|-----------|------------------------|
| 1 | **ID** | Identificatore univoco (`D-NNNN-X`) | orchestrator |
| 2 | **Kind** | `automation` \| `meta` \| `runtime` | orchestrator |
| 3 | **Contesto** | 1–2 frasi: cosa è successo | orchestrator (+ n8n/event provenance for facts) |
| 4 | **Perché serve decisione** | Perché il sistema non può procedere da solo | orchestrator |
| 5 | **Opzioni** | 2–5 alternative numerate | orchestrator |
| 6 | **Raccomandazione** | Opzione suggerita e perché | orchestrator |
| 7 | **Rischio principale** | Cosa può andare male con l'opzione raccomandata | orchestrator |
| 8 | **Micro-interazioni eliminate** | Cosa risparmia all'utente | orchestrator |
| 9 | **Scelta richiesta** | `"Scrivi: 1 / 2 / 3"` (o parola corta equivalente) | user-facing gate |
| 10 | **Cosa NON viene fatto** | Senza decisione, cosa resta fermo | orchestrator |
| 11 | **Riferimento evento / provenienza** | `event_id`, commit SHA, source repo, workflow/runtime source when available | n8n / event provenance |
| 12 | **Risk** | `low` \| `medium` \| `high` — classifier risk, coherent with §6.3 | classifier |
| 13 | **Route** | `auto_allowed` \| `human_gate` \| `blocked` | classifier |
| 14 | **requires_human** | `true` \| `false` — boolean from classifier | classifier |
| 15 | **Confidence** | `low` \| `medium` \| `high` — classifier confidence | classifier |
| 16 | **Classifier reason** | Sanitized short justification from classifier (no secrets, no CoT) | classifier (sanitized before Telegram) |

**Population notes:**

- **Classifier fields** (12–16) come from `classifier-wrapper-v1` output: `risk`, `route`, `reason`, `confidence`, `requires_human`.
- **Event provenance** (11) comes from the event-shaped input (`event_id`, commit, repo, workflow source) assembled by n8n or orchestrator — not from the model's internal reasoning.
- **Orchestrator fields** (1–10) frame the human decision; they must remain consistent with classifier routing but may add strategic context §7.7 requires.
- **User response** (9) is the reply contract; the actual user choice is captured separately as a **human response** record (number or short word).

---

## 4. Risk → routing mapping

Coherent with [`PROJECT_VISION.md` §6.3](PROJECT_VISION.md) and [`classifier-wrapper-v1` route semantics](../contracts/classifier-wrapper-v1.md).

| Classifier `risk` | Operational meaning (§6.3) | Target routing |
|-------------------|------------------------------|----------------|
| **low** | Docs-only, metadata, confined reversible tasks | May proceed automatically **only** when policy allows, `route=auto_allowed`, `requires_human=false`, and no other guard requires human |
| **medium** | Significant non-destructive code/config/workflow change | **Decision Packet** / human gate (`human_gate`) |
| **high** | Deploy, rollback, secrets, destructive ops, sensitive data | **Explicit human gate** via Decision Packet (`human_gate`) |

| Classifier `route` | Meaning | Action |
|--------------------|---------|--------|
| **auto_allowed** | May proceed without human gate only if policy + guards agree and `requires_human=false` | Auto path allowed by policy; still subject to §7.7 gates for strategic decisions |
| **human_gate** | Stop for human via Telegram Decision Packet | Send structured packet; wait for number/short word |
| **blocked** | Do not proceed automatically | Requires explicit override or redesign; default safe = no auto proceed |

**Override rules (default safe = human_gate):**

- **`low` + `requires_human=true`** → still goes to **human gate** (Decision Packet), never silent auto.
- **`confidence=low`** → default safe to **`human_gate`** + `requires_human=true` (wrapper post-model rule).
- **`route=blocked`** → do not proceed automatically; packet explains what is blocked and what override would mean.
- Ambiguity, guard/model mismatch, or invalid classifier output → **`human_gate`** (never silent `auto_allowed`).

---

## 5. Option rules (§7.7 preserved)

- **2–5 numbered options** — each option is one line, actionable, mutually distinguishable.
- **Recommendation explicit** — state which option (e.g. "Raccomandazione: **2**") and why.
- **Risk of recommended option explicit** — row 7 (**Rischio principale**) must address the recommended path.
- **Scelta richiesta** — always include `"Scrivi: 1 / 2 / 3"` (or equivalent short-word map).
- **Cosa NON viene fatto** — without a decision, state what remains frozen.
- **No free-prose reply required** — user answers with **number or short word only**.

---

## 6. Telegram redaction / safety (mandatory)

Decision Packets are intended for **Telegram**. They must **never** include:

- secrets, tokens, `chat_id`
- credential id or credential content
- webhook URL, auth URL
- API key, provider key
- chain-of-thought (CoT), raw private prompt
- unredacted environment variables

**Classifier reason sanitization:**

- **Classifier reason** (field 16) must be **sanitized before Telegram**.
- If `reason` contains sensitive material (paths to credentials, token-like strings, URLs with auth), replace with a **safe summary** (e.g. `guard:secrets_touched — details omitted for Telegram`).
- **Never** store or send chain-of-thought; only the final **reason** / short justification from classifier output.
- No secrets in **Contesto**, **Opzioni**, or **Raccomandazione** either — redact at compose time.

**Git rule:** no secrets, token, `chat_id`, webhook, or credential content in repository artifacts.

---

## 7. Worked illustrative example

> **Esempio illustrativo** — valori fittizi, nessun segreto.  
> **Non** è l'esecuzione reale D-0002-C; solo forma strutturale coerente con un gate classifier-driven.

```
ID: D-0099-X
Kind: runtime

Riferimento evento / provenienza:
  event_id: evt-illustrative-0099
  commit: abc1234fittizio (mrhz1973/control-plane)
  source: wf42 diff-summary → classifier-server (mock path)

Risk: high          Route: human_gate       requires_human: true
Confidence: high    Classifier reason: guard:secrets_touched — structured flag set; prose sanitized

Contesto:
  Nuovo commit tocca flag secrets nel payload evento inviato al classifier.

Perché serve decisione:
  Il classifier ha forzato human_gate (high). Nessun auto-proceed consentito.

Opzioni:
  1 — Ignora evento; nessuna azione automatica
  2 — Apri review manuale del diff su GitHub (raccomandato)
  3 — Autorizza procedura supervisionata con scope ristretto (override esplicito)

Raccomandazione: 2 — review manuale prima di qualsiasi wiring o runtime change.

Rischio principale (opzione 2):
  Ritardo operativo; nessun deploy o modifica secrets finché review non chiude.

Micro-interazioni eliminate:
  Evita copia manuale del classifier output e ricostruzione opzioni da chat libera.

Scelta richiesta:
  Scrivi: 1 / 2 / 3

Cosa NON viene fatto senza decisione:
  Nessun cablaggio n8n, nessun auto-send Telegram, nessun unlock PM-34, nessun deploy.

Risposta utente (formato): 2
```

---

## 8. Scope — Wb-docs (non-runtime)

| Boundary | Status |
|----------|--------|
| **Wb-docs** | Documentation only — this file defines format, **not** a send |
| Telegram send | **NOT RUN** in this task |
| n8n wiring | **NOT RUN** in this task |
| Automatic/cablato Decision Packet | **NOT RUN** |
| PM-34 | **BLOCCATO** — unchanged |
| **Wb-live (next gate)** | Live n8n → classifier-server **manual single execution** via Tailscale — separate task, user-operated |

This document does **not** modify `PROJECT_VISION.md` or §7.7. It fulfills the §7.7 promise of a separate extended format file now that the classifier bridge exists (Step Wa PASS).

---

**Fine documento.**
