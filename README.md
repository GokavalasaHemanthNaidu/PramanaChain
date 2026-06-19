<div align="center">

<img src="https://img.shields.io/badge/Blockchain-Document%20Verification-8A2BE2?style=for-the-badge&logo=chainlink&logoColor=white" alt="PramanaChain"/>

# 🔐 PramanaChain (Visual Document Trust Chain)

### *A resilient, multi-layer document forensics and cryptographic ledger system*

[![Frontend: Next.js 14](https://img.shields.io/badge/Frontend-Next.js_14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Cryptography: SECP256R1](https://img.shields.io/badge/Crypto-SECP256R1-8A2BE2?style=flat-square)](https://cryptography.io/)
[![Status: Prototype](https://img.shields.io/badge/Status-Completed-9400D3?style=flat-square)]()

**Live Demo:** [https://pramanachain.vercel.app](https://pramanachain.vercel.app)

</div>

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
[ Cryptographic Notary ] (SHA-256 Hash + ECDSA SECP256R1 Signature)
        │
        ▼
[ Cryptographic Vault ] (AES-256 Encryption at Rest)
        │
        ▼
[ MongoDB Immutable Ledger ]
```

## 🔐 The Cryptographic POV (Security-First Design)

PramanaChain goes beyond simple fraud detection by implementing a true enterprise security architecture designed around three core pillars:

1. **Integrity (SHA-256):** Generates an immutable mathematical fingerprint of the document. If a fraudster alters even a single pixel, the hash completely changes, exposing the forgery.
2. **Authenticity (ECDSA):** Every verified transaction is digitally signed using Elliptic Curve Cryptography (SECP256R1), creating an undeniable, mathematically verifiable audit trail of *who* verified the document and *when*.
3. **Confidentiality (AES-256):** To meet strict KYC and PII compliance regulations, verified documents are locked via AES-256 encryption at rest before entering the database. Even in the event of a total database breach, the sensitive identity data remains mathematically secure.

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
| `POST` | `/api/upload` | 10/min | **Yes** (`X-API-Key`) | Run full ML, Forensic pipeline, & Anchoring |
| `POST` | `/api/verify/image` | 10/min | **Yes** (`X-API-Key`) | Verify image forensics & ledger signature |
| `GET`  | `/api/verify?query=` | 60/min | No | Public verification portal |

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
