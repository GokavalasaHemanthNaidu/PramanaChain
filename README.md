# 🔐 PramanaChain (Visual Document Trust Chain)

> **A resilient, multi-layer document forensics and cryptographic ledger system designed to prevent identity fraud through cross-validated AI and unforgeable ECDSA signatures.**

[![Frontend: Next.js 14](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](https://nextjs.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Cryptography: SECP256R1](https://img.shields.io/badge/Crypto-SECP256R1-blue)](https://cryptography.io/)
[![Status: Prototype](https://img.shields.io/badge/Status-Prototype-orange)]()

**Live Demo:** [https://pramanachain.vercel.app](https://pramanachain.vercel.app)

---

## 🛑 The Problem

Document forgery represents a massive vulnerability in modern KYC (Know Your Customer) systems. Sophisticated fraudsters use digital manipulation to forge Aadhaar cards, PAN cards, and financial documents to open bank accounts or secure employment fraudulently. 

Traditional solutions are either prohibitively expensive enterprise APIs (like Onfido or Veriff) or basic OCR pipelines that lack semantic understanding and provide zero cryptographic proof of document integrity.

## 🏗️ Architecture & Document Understanding Pipeline

PramanaChain operates on a **graceful degradation / fallback architecture**. Because no single model is perfect, the system cross-validates across multiple layers.

```ascii
[ Upload Document ]
        │
        ▼
[ Layer 1: OpenCV Forensics ] (Detects pixel manipulation & deepfakes)
        │
        ▼
[ Layer 2: Pre-Trained Microsoft DiT via HF API ] (Attempts general classification)
        │ └─▶ If unknown/fails...
        ▼
[ Layer 3: Keyword Regex Classifier ] (Multi-language OCR text matching)
        │ └─▶ If unknown/fails...
        ▼
[ Layer 4: Entity Regex Extractor ] (Searches for strict Aadhaar/PAN numeric patterns)
        │
        ▼
[ Layer 5: Donut VQA ] (Extracts Names, Dates via Generative AI)
        │
        ▼
[ Cryptographic Signer ] (SHA-256 Hash + ECDSA SECP256R1 Signature)
        │
        ▼
[ MongoDB Immutable Ledger ]
```

## 💻 Tech Stack

* **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS (Deployed on Vercel)
* **Backend:** FastAPI 0.110.0, Python 3.11, Uvicorn (Deployed on Render)
* **Database:** MongoDB Atlas (M0 Free Tier)
* **Storage:** Cloudinary (Image CDN)
* **Machine Learning:** 
  * `microsoft/dit-base-finetuned-rvlcdip` (Classification)
  * `naver-clova-ix/donut-base-finetuned-docvqa` (Field Extraction)
* **Cryptography:** Python `cryptography` library (SECP256R1)
* **Computer Vision:** OpenCV 4.8.0

## 🛡️ Security Hardening

This system has been extensively hardened following a rigorous security audit:
* **CORS Policies:** Strictly restricted to production (`pramanachain.vercel.app`) and local (`localhost:3000`). No wildcard `*` origins allowed.
* **Rate Limiting:** Implemented via `slowapi` (10 rpm uploads, 60 rpm reads, 20 rpm deletes) to prevent DDoS and API abuse.
* **Authentication Gate:** Global `X-API-Key` dependency on all `POST` / `DELETE` endpoints.
* **XSS Sanitization:** `html.escape` applied to all text outputs before returning to the frontend.
* **Error Masking:** Global exception handlers return generic 500 errors to the client while logging stack traces securely on the server to prevent information leakage.
* **Cryptography:** Implemented NIST-standard SECP256R1 (P-256) curve instead of older SECP256K1 standards.

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/GokavalasaHemanthNaidu/PramanaChain.git
cd PramanaChain
```

### 2. Run the Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set your .env variables (HF_TOKEN, MONGO_URI, CLOUDINARY_URL)
uvicorn src.main:app --reload --port 8000
```

### 3. Run the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

```text
PramanaChain/
├── backend/
│   ├── src/
│   │   ├── api/          # FastAPI Routers
│   │   ├── utils/        # ML, Crypto, OCR Logic
│   │   └── main.py       # App Entrypoint
│   └── tests/            # Pytest Security & Integration Tests
├── frontend/
│   ├── src/app/          # Next.js Pages
│   └── src/components/   # React UI Components
└── docs/                 # Project documentation
```

## 🌐 API Endpoints

| Method | Path | Rate Limit | Auth Required | Purpose |
|--------|------|------------|---------------|---------|
| `GET`  | `/` | 60/min | No | Health check & MongoDB ping |
| `POST` | `/api/v1/documents/analyze` | 10/min | **Yes** (`X-API-Key`) | Run full ML & Forensic pipeline |
| `POST` | `/api/v1/documents/sign` | 10/min | **Yes** (`X-API-Key`) | Cryptographically sign document hash |
| `GET`  | `/api/v1/documents/verify/{did}` | 60/min | No | Public verification portal |

## 🧠 What I Learned

Building PramanaChain taught me that **production engineering is about resilience, not perfection.** Relying entirely on a single machine learning model is a recipe for failure in production. By building a graceful degradation architecture (falling back from Transformer APIs to local multi-language regex scripts), I ensured the system remains highly available. Furthermore, implementing cryptographic signatures taught me the crucial difference between simple database storage and mathematical non-repudiation.

## ⚠️ Known Limitations & Upgrade Path

Being transparent about system limitations:
* **No Formal Test Set:** The current system is a prototype. While it cross-validates accurately on test samples, it lacks a formal 500+ document test set for rigorous confusion matrix or AUC evaluation.
* **API Dependency:** The primary ML models rely on the HuggingFace Inference API, making latency dependent on HF cold-start times.
* **Rate Limiting Persistence:** Currently uses in-memory `slowapi`. If the Render container restarts, the rate limit window resets.

**Upgrade Path (v2.0):**
* Export the classification model to ONNX for 100% local CPU inference (removing HF dependency).
* Implement Redis-backed rate limiting for stateless container scaling.
* Migrate from API Key authentication to OAuth2/JWT for multi-tenant enterprise usage.

## 📜 License
MIT License. See [LICENSE](LICENSE) for details.
