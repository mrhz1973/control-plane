# R004C — Maildocs E.ON invoice parser shadow canary evidence (2026-09-21)

Bounded deterministic E.ON invoice parsing for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#130` / application issue #16.

PDF text-layer content is authoritative. Filename stem is cross-check only.
Observed public labels only; no raw text/PDF/amounts/numbers in this evidence.
Migration `004_document_invoice_fields` adds `rai_amount` after Canone RAI was
observed as separately parseable.

WF01 ACTIVE. WF02/WF03/WF04/WF05 INACTIVE. Active workflows total=5.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
N8N_VERSION=2.33.3
PARSER_CONFIG=config/eon-invoice-parser-rules.json
PARSER_SCHEMA=eon-invoice-parser-rules-v1
PARSER_VERSION=r004c-v1
RULES_DIGEST=8b5f405693bcc8a278238613c44b32a30757e36cd096cb38f40d2616be50bc72
MIGRATION=004_document_invoice_fields
MIGRATION_DOUBLE_RUN=PASS
RAI_FIELD_DECISION=ADDED
LOCAL_SUITE=258 passed

SYNTHETIC_VALID_HIGH=PASS
SYNTHETIC_PARSE_REVIEW_PATHS=PASS
CONFLICT_FAIL_CLOSED=PASS

WF05_ID=WF05EonInvoiceParserR004C
WF05_ACTIVE=false
REAL_EON_PDFS_SELECTED=1
REAL_EON_PARSED_HIGH=1
REAL_EON_PARSE_REVIEW=0
REAL_BYTES_DOWNLOADED=1
REAL_BYTES_SHA_MATCH=1
REAL_REQUIRED_FIELDS_COMPLETE=1
DOCUMENT_NUMBER_CROSSCHECK=PASS
PERIOD_VALIDATION=PASS
AMOUNT_VALIDATION=PASS
USAGE_VALIDATION=PASS
DUE_DATE_VALIDATION=PASS
RAI_PARSE_PROOF=PASS
CANONICAL_FILENAME_PREVIEW=PASS
PARTIAL_OVERWRITE_COUNT=0
PARSE_CONFIDENCE_PROOF=PASS
PAYMENT_STATUS_TOUCHED=NO
PARSER_DETERMINISM=PASS
DUPLICATE_PARSE_EVENTS_REPEAT=0
FINAL_RERUN_DOWNLOAD_COUNT=0
FINAL_RERUN_PARSER_CALLS=0
FINAL_RERUN_DUPLICATE_EVENTS=0
RAW_TEXT_PERSISTED=NO
RAW_PDF_BYTES_PERSISTED=NO
TEMP_RESIDUAL_FILES=0
GMAIL_MUTATION_MISMATCHES=0

WF01_ACTIVE=true
WF02_ACTIVE=false
WF03_ACTIVE=false
WF04_ACTIVE=false
ACTIVE_WORKFLOWS_TOTAL=5
N8N_CONTAINER_UNCHANGED=YES
PG_CONTAINER_UNCHANGED=YES
LISTENER_DELTA=NONE
DRIVE_ACCESS=0
SHEETS_ACCESS=0
SECRETS_EXPOSED=0

APP_ISSUE_16=COMPLETED
CONTROL_PLANE_ISSUE_130=COMPLETED
```

## Notes

- Field discovery used label/pattern presence and masked windows only (no values).
- Invoice number extraction requires tight pdfjs item-join (`fattura n°` + digits).
- Live canary: one SUPPLIER_DETECTED E.ON document → PARSED/HIGH with RAI present.
- Audit payloads carry field_status / validation_codes / digests / text_sha256 only.
- No OAuth secrets, Gmail IDs, invoice numbers, amounts, or account refs in this file.
