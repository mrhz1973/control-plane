# R004B — Maildocs PDF supplier detection shadow canary evidence (2026-09-21)

Bounded deterministic supplier detection for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#128` / application issue #15.

PDF text-layer content is authoritative. Gmail shadow `service` is corroboration
only. First supplier: E.ON, using only observed public corporate signatures.
No OCR, Drive, installs, restarts, or raw text/PDF persistence.

WF01 unchanged/ACTIVE. WF02/WF03/WF04 INACTIVE.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
N8N_VERSION=2.33.3
RULES_CONFIG=config/document-supplier-rules.json
RULES_SCHEMA=document-supplier-rules-v1
DETECTOR_VERSION=r004b-v1
RULES_DIGEST=3dc68d607456c277a5d137621e51e2f4288053ef0f36a130cce89db82351c040
SUPPLIERS_CONFIGURED=E.ON
EON_SIGNATURE_GROUPS=2
EON_REAL_SIGNATURE_DISCOVERY=PASS
IMPLEMENTATION_COMMIT=b08f6831441cd11a6a9589d01cd56858ddc24ee9
LOCAL_SUITE=244 passed

SYNTHETIC_EON_POSITIVE=PASS
SYNTHETIC_NEAR_MISS=PASS
SYNTHETIC_PARTIAL_REVIEW=PASS
SYNTHETIC_UNKNOWN=PASS
EXPECTED_SUPPLIER_MISMATCH=PASS

WF04_ID=WF04PdfSupplierDetectionR004B
WF04_ACTIVE=false
REAL_PDFS_SELECTED=2
REAL_EON_HIGH=1
REAL_REVIEW=1
REAL_UNKNOWN=1
REAL_BYTES_DOWNLOADED=2
REAL_BYTES_SHA_MATCH=2
SUPPLIER_DETERMINISM=PASS
DOCUMENT_ROWS_CREATED=2
PARSE_CONFIDENCE_TOUCHED=NO
DUPLICATE_SUPPLIER_EVENTS_REPEAT=0
FINAL_RERUN_DOWNLOAD_COUNT=0
FINAL_RERUN_HELPER_CALLS=0
FINAL_RERUN_DUPLICATE_EVENTS=0
RAW_TEXT_PERSISTED=NO
RAW_PDF_BYTES_PERSISTED=NO
TEMP_RESIDUAL_FILES=0
GMAIL_MUTATION_MISMATCHES=0

WF01_ACTIVE=true
WF02_ACTIVE=false
WF03_ACTIVE=false
ACTIVE_WORKFLOWS_TOTAL=5
N8N_CONTAINER_UNCHANGED=YES
PG_CONTAINER_UNCHANGED=YES
LISTENER_DELTA=NONE
DRIVE_ACCESS=0
SECRETS_EXPOSED=0

APP_ISSUE_15=COMPLETED
CONTROL_PLANE_ISSUE_128=COMPLETED
```

## Notes

- Observed E.ON HIGH requires independent groups `eon.brand` (`e.on energia`) and
  `eon.domain` (`eon-energia.com`). No user-specific invoice fields as signatures.
- Live canary: attachment 21 → `SUPPLIER_DETECTED` / E.ON / HIGH; attachment 22 →
  `SUPPLIER_REVIEW` / UNKNOWN / LOW. Parent Gmail classifications UNCLASSIFIED
  (`expected_supplier` NULL) — HIGH E.ON allowed.
- Temp PDFs under `/home/node/.n8n-files/maildocs-r004b/` with same-run cleanup.
- Helper path: `/files/handoff-runtime/automazione-posta-documenti-gdrive/tools/r004b_supplier_detect.mjs`
- Audit payloads are fingerprint-only (supplier, confidence, matched_rule_ids,
  rules_digest, text_sha256, counts). No raw text/snippets/PDF bytes.
- No OAuth secrets, Gmail IDs, invoice numbers, or account refs in this evidence.
