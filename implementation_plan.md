# Implementation Plan — Ledger Integration, 5-Layer AI Detection, & Name Matching Chance

The goal of this plan is to integrate the missing trust features from the Streamlit prototype to the Next.js/FastAPI full-stack application. Specifically, we will implement full-ledger cross-referencing, fake document detection, fuzzy name matching (computing a match chance percentage), and a gorgeous 5-Layer Security HUD in the Next.js verification reels.

## User Review Required

> [!IMPORTANT]
> The background uploader verification endpoint (`/api/verify/image`) will be modified to automatically search the database ledger. If a matching record is found, we will calculate field differences and cryptographic signatures, returning a complete comparison breakdown. If no record is found, the system will flag the document as **🚨 UNVERIFIED / LIKELY FAKE**.
>
> All visual components will align with the existing **Deep Navy & Emerald Glow (Glassmorphism)** theme, featuring highly premium micro-animations (Framer Motion) for the 5-Layer AI Hud.

## Proposed Changes

---

### Backend (`/backend`)

#### [MODIFY] [main.py](file:///C:/Users/Hemanth/antigravity/scratch/Veralyt_fullstack/backend/main.py)
- Modify `/api/verify/image` to:
  1. Extract fields from the uploaded document image using the AI processor.
  2. Parse the name (`name_up`) and document ID (`id_up`) from the extraction result.
  3. Query the database ledger (MongoDB or local JSON fallback) using:
     - Exact ID lookup: `db_client.search_by_document_id(id_up)` (if `id_up` is detected).
     - Fuzzy fallback name search: Query all records matching the detected `doc_type` and use `difflib.SequenceMatcher` to find the record with the best name similarity ratio >= 0.55.
  4. If a matching record `doc_record` is found:
     - Perform cryptographic verification on the anchored record: recalculate the SHA-256 hash of the stored fields and verify the ECDSA signature against the stored public key.
     - Compute name similarity ratio (`name_match_ratio`) between the uploaded and stored names.
     - Perform comparisons of the reference ID (`id_match`) and type (`type_match`).
     - Set `ledger_comparison` values: `status = "authentic"` if fields and signatures match, or `"tampered"` if there are discrepancies.
  5. If no matching record is found:
     - Set `ledger_comparison` status to `"not_found"`.
  6. Return `ledger_comparison` detailing:
     - `status`: `"authentic" | "tampered" | "not_found"`
     - `match_chance`: name similarity percentage (`name_match_ratio * 100`)
     - `stored_record`: the anchored original record fields
     - `field_comparison`: showing uploaded vs stored comparisons
     - `crypto_audit`: containing `hash_valid` and `signature_valid` booleans.

---

### Frontend (`/frontend`)

#### [MODIFY] [page.tsx](file:///C:/Users/Hemanth/antigravity/scratch/Veralyt_fullstack/frontend/src/app/verify/page.tsx)
- Re-architect the Forensic Forgery Auditor results dashboard:
  1. **Ledger Verdict Banner**: Add a glowing, premium alert showing a clear security status verdict based on the returned `ledger_comparison`:
     - **Authentic (Green Glow)**: Tells the user the document matches a registered anchor exactly.
     - **Tampered (Amber Glow)**: Renders a side-by-side comparison table of uploaded OCR values vs original anchored values, marking mismatches in red.
     - **Likely Fake (Red Pulse)**: Flags that the document is completely unverified / not registered in the immutable ledger.
  2. **Name Match Chance Gauge**: Render a gorgeous visual dial/radial gauge showing the name matching probability (e.g. "Name Match Chance: 92%"). Add a tooltipped explanation of how fuzzy sequence matching accommodates minor scanner OCR errors while blocking forgery.
  3. **5-Layer Security HUD Reels**: Replace static tabs or add an interactive, animated timeline displaying progress/status across the 5 AI layers:
     - **Layer 1: YOLO11 Classifier** (type detection confidence)
     - **Layer 2: Tesseract OCR** (character recognition & language scan)
     - **Layer 3: Heuristic Layout Check** (structure validation)
     - **Layer 4: Donut VQA Audit** (visual field validation confidence)
     - **Layer 5: Cryptographic Anchoring Proof** (digital signature and ledger hash audit)
     - Standardize each layer with hover interactions and premium glassmorphic details.

## Verification Plan

### Automated Tests
- Run `python test_integration.py` in `/backend` to verify all existing and new API responses return successfully with valid status structures.

### Manual Verification
- Upload `test_invoice.jpg` (after anchoring it) to verify that it matches the anchored record with 100% similarity and prints a **100% Authentic** badge.
- Edit `test_invoice.jpg`'s fields or change a letter in the name of the file upload and check that the uploader catches the tamper discrepancy, showing the exact mismatch comparison table.
- Upload an unanchored document and check that it alerts the user with a **Document Not Verified — Likely Fake** verdict.
