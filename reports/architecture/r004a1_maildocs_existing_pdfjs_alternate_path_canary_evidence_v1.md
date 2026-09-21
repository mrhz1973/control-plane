# R004A.1 — Maildocs existing-pdfjs alternate path canary evidence (2026-09-21)

Bounded alternate PDF text-layer extraction for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#127` / application issue #14
(parent `#126` / app `#13`).

Unblocks R004A without repairing `@napi-rs/canvas` and without apt/npm/pip,
Internet downloads, n8n/node_modules patches, restarts, new services, or global
n8n env changes.

WF01 unchanged/ACTIVE. WF02 INACTIVE. WF03 imported INACTIVE only.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
N8N_VERSION=2.33.3
EXECUTE_COMMAND_AVAILABLE=YES
PDFJS_EXISTING_RUNTIME=PASS
HELPER_PATH=/files/handoff-runtime/automazione-posta-documenti-gdrive/tools/r004a_pdfjs_extract.mjs
HELPER_EXTRACTOR_IDENTITY=project_pdfjs_helper:pdfjs-dist@5.4.296:r004a1
TEMP_ROOT=/home/node/.n8n-files/maildocs-r004a
IMPLEMENTATION_COMMIT=ae513b589b596db657a40c56b4e0fa7a1538830e
LOCAL_SUITE=219 passed

SYNTHETIC_RETENTION_PROOF=PASS
SYNTHETIC_TEXT_VECTOR=PASS
NO_TEXT_LAYER_PROOF=PASS
TEMP_CLEANUP_PROOF=PASS
TEMP_RESIDUAL_FILES=0

WF03_ID=WF03PdfTextExtractionR004A
WF03_ACTIVE=false
REAL_PDFS_SELECTED=2
REAL_PDFS_TEXT_LAYER=2
REAL_BYTES_DOWNLOADED=2
REAL_BYTES_SHA_MATCH=2
TEXT_SHA_DETERMINISM=PASS
DUPLICATE_EXTRACTION_EVENTS_REPEAT=0
FINAL_RERUN_DOWNLOAD_COUNT=0
FINAL_RERUN_HELPER_CALLS=0
FINAL_RERUN_DUPLICATE_EVENTS=0
RAW_TEXT_PERSISTED=NO
RAW_PDF_BYTES_PERSISTED=NO
GMAIL_MUTATION_MISMATCHES=0

WF01_ACTIVE=true
WF02_ACTIVE=false
ACTIVE_WORKFLOWS_TOTAL=5
N8N_CONTAINER_UNCHANGED=YES
PG_CONTAINER_UNCHANGED=YES
LISTENER_DELTA=NONE
DRIVE_ACCESS=0
SECRETS_EXPOSED=0

APP_ISSUE_14=COMPLETED
APP_ISSUE_13=COMPLETED
CONTROL_PLANE_ISSUE_127=COMPLETED
CONTROL_PLANE_ISSUE_126=COMPLETED
```

## Notes

- Stock `extractFromFile`/`pdf` remains broken on this host due to `@napi-rs/canvas`;
  R004A.1 does **not** reuse `extractFromFile:pdf:pdfjs` as extractor identity.
- WriteBinaryFile blocks `/tmp`; opaque temp PDFs use `/home/node/.n8n-files/maildocs-r004a/`
  with same-run cleanup. Helper allowlist accepts that root and legacy `/tmp/maildocs-r004a/`.
- Crypto SHA node drops binary; WF03 reattaches bytes from `Process Download` before temp write.
- Durable payload is fingerprint-only (`text_sha256`, counts, extractor identity); no raw text/PDF.
- Synthetic retention: known-text marker absent from `execution_data`; `binary_data` residual 0.
- Live attachments 21 and 22 both yielded `TEXT_LAYER`; skip rerun downloaded/helper counts 0.
- No raw bytes/base64/OAuth secrets in this evidence.
