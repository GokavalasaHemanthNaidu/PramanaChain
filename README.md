# 🔐 PramanaChain

> **A cryptographically secured document ledger tailored for Indian KYC (Aadhaar, PAN) that detects forged IDs using computer vision forensics and zero-shot AI — deployed live with enterprise security.**

[![Frontend](https://img.shields.io/badge/Frontend-Next.js_14-black)](https://pramanachain.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_0.110.0-009688)](#)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248)](#)

**Live Demo:**
- **Frontend:** [https://pramanachain.vercel.app](https://pramanachain.vercel.app)
- **Backend API:** *[Hosted on Render - Check Your Render Dashboard for the exact URL]*

---

## 🛑 Problem Statement

Identity fraud in India is surging, particularly with the manipulation of national documents like **Aadhaar, PAN Cards, and Voter IDs**. Synthetic identity fraud costs Indian financial institutions and lenders hundreds of crores annually. Furthermore, manual KYC (Know Your Customer) reviews are incredibly slow and lead to massive user drop-off during onboarding. 

Current automated solutions use rigid OCR templates that break when ID formats update, and they completely fail to detect sophisticated digital tampering (like morphed photos or spliced text on an Aadhaar card).

**PramanaChain** automates document forensics to catch tampering *before* human review. It combines Error Level Analysis (ELA) to detect image manipulation with Zero-Shot AI to extract data, then cryptographically anchors the result into an immutable **MongoDB Atlas** ledger.

---

## 🏗️ Architecture & Data Flow

```ascii
[Client: Next.js 14] ──(HTTPS)──> [FastAPI Backend]
                                      │
                                      ├── 1. [OpenCV] ELA Forensics, Blur & Moiré Checks
                                      ├── 2. [HuggingFace] AI Data Extraction & ID Classification
                                      ├── 3. [SHA-256] Document Hashing
                                      ├── 4. [ECDSA] Cryptographic Signing (SECP256R1)
                                      │
                                      ▼
                      [MongoDB Atlas] & [Cloudinary CDN]
```

### The Immutable Ledger (MongoDB Atlas)
PramanaChain uses **MongoDB Atlas** as the core cryptographic ledger. 
Instead of a slow, distributed blockchain, MongoDB provides the high-performance document store. When a document is processed, its digital signature (ECDSA), content hash (SHA-256), extracted fields, and fraud-risk score are permanently anchored into MongoDB. Any subsequent search for that document pulls from MongoDB and mathematically re-verifies the signature against the hash to prove it hasn't been tampered with since the second it was uploaded.

### Tech Stack
| Layer | Technology | Exact Specifications | Purpose |
|-------|------------|----------------------|---------|
| **Frontend** | Next.js (App Router), TS, Tailwind | 14.x | Interactive UI, Framer Motion animations |
| **Backend** | FastAPI, Python, Uvicorn | >=0.110.0, 3.11.8| High-performance async API |
| **Database/Ledger** | MongoDB Atlas (pymongo) | M0 Free Tier | Core Immutable Ledger for document metadata and cryptographic signatures |
| **Storage** | Cloudinary | `cloudinary` SDK | CDN-backed secure image storage |
| **AI/ML Classification** | Custom HF Model | `hemanthnaidug/my-PramanaChain-model` | Classifies Indian IDs (Aadhaar, PAN, Voter ID) |
| **AI/ML Extraction** | HuggingFace Inference API | `donut-base-finetuned-docvqa` | Zero-shot data extraction (No templates needed) |
| **OCR Engine** | OCR.space API + PyTesseract | Multi-language (En/Hi/Te/Ta/Kn) | Text fallback extraction for classification |
| **Crypto** | Python `cryptography` | ECDSA (SECP256R1) | NIST P-256 key generation & document signing |
| **Forensics**| OpenCV (`opencv-python-headless`) | >=4.8.0 | ELA for tampering, Laplacian Blur, FFT Moiré pattern detection |
| **Security** | slowapi, bcrypt, html | 0.1.9, >=4.0.0 | Rate limiting, password hashing, XSS escape |
| **Hosting** | Vercel (UI), Render (API) | Cloud | Serverless edge & containerized deployments |

---

## 🛡️ Security Features

Security is treated as a first-class citizen, implemented directly at the middleware and route levels:

- **Strict CORS:** Restricted exclusively to `https://pramanachain.vercel.app` and `http://localhost:3000`.
- **In-Memory Rate Limiting:** Powered by `slowapi` to prevent DDoS and brute-force attacks:
  - `10 req/min` for document uploads.
  - `60 req/min` for ledger reads.
  - `20 req/min` for deletions.
- **API Key Gate:** All POST/mutation endpoints require a valid `X-API-Key` header.
- **XSS Sanitization:** All text outputs run through `html.escape` to prevent cross-site scripting.
- **Global Exception Handler:** Prevents stack trace leakage by catching unhandled errors and returning a generic `500 Internal Server Error` while logging the true error server-side.
- **Database Health Checks:** The root endpoint (`/`) directly pings the MongoDB Atlas cluster and returns `503 Service Unavailable` if the database connection drops.

---

## 🚀 Quick Start

### 1. Local Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the server locally
python -m src.main
```

### 2. Local Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js dev server
npm run dev
```

---

## 📁 Project Structure

```text
PramanaChain/
├── backend/
│   ├── src/                    # Isolated source code
│   │   ├── main.py             # FastAPI app factory + endpoints
│   │   ├── core/
│   │   │   └── security.py     # API key verification logic
│   │   ├── utils/
│   │   │   ├── db_client.py    # MongoDB Ledger operations
│   │   │   ├── crypto_signer.py# ECDSA (SECP256R1) signing
│   │   │   ├── ela_detector.py # OpenCV Error Level Analysis & Blur/Moiré Checks
│   │   │   ├── hashing.py      # SHA-256 content hashing
│   │   │   ├── ml_classifier.py# HuggingFace & Custom Model pipeline
│   │   │   └── ocr_processor.py# OCR.space API and PyTesseract fallback
│   │   └── models/
│   │       └── document.py     # Pydantic document schemas
│   ├── tests/                  # Pytest suite
│   │   └── test_api.py         # Security tests (CORS, rate limits)
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   └── src/app/                # Next.js 14 App Router
│       ├── page.tsx            # Landing page
│       ├── upload/page.tsx     # Document upload + forensics UI
│       ├── verify/page.tsx     # MongoDB Document Verification Search
│       └── dashboard/page.tsx  # User dashboard + analytics
└── README.md                   # This file
```

---

## 📡 API Endpoints

| Method | Path | Purpose | Rate Limit | Auth Required |
|--------|------|---------|------------|---------------|
| `GET` | `/` | Health check & MongoDB ping | 60/min | No |
| `POST` | `/api/upload` | Process, scan, and anchor document into MongoDB | 10/min | **API Key** |
| `GET` | `/api/verify/{id}` | Fetch from MongoDB and verify signature | 60/min | No |
| `DELETE`| `/api/documents/delete` | Remove document from MongoDB ledger | 20/min | **API Key** |

---

## 🔍 Security Audit History

PramanaChain underwent an internal security audit that identified multiple P0 vulnerabilities. Here is how the system matured:

| Vulnerability | Before Audit | After Fixes |
|---------------|--------------|-------------|
| **CORS** | Wildcard (`allow_origins=["*"]`) | Strictly bound to production & localhost |
| **DDoS/Brute Force** | No rate limits | `slowapi` implemented on all endpoints |
| **Unauthorized Access** | Open POST endpoints | Strict `X-API-Key` validation |
| **Information Leakage** | `return {"error": str(e)}` (leaked stack traces) | Generic 500s via Global Exception Handler |
| **XSS** | Raw string returns | `html.escape` applied to all text |
| **Dependency Conflicts**| Strict local pins crashing Render | Unpinned C-extensions to guarantee cloud wheel builds |

---

## ⚠️ Known Limitations

Honesty builds trust. Here are the current limitations of this architecture:

- **Storage:** Uses MongoDB Atlas M0 free tier — limited to 512MB storage and shared RAM.
- **AI Latency:** Relies on the HuggingFace Inference API, making it subject to their rate limits and uptime. There is currently no local model fallback.
- **Rate Limiting State:** `slowapi` stores limits in-memory. This resets on container restart and won't sync across horizontally scaled instances.
- **Ledger Model:** "Blockchain" terminology refers to cryptographic signing and hashing on MongoDB Atlas, not a distributed public ledger.
- **User Auth:** Currently relies on API key gating. Full JWT/OAuth2 user authentication is not yet implemented.

**Upgrade Path:**
- **v1.6:** Redis-backed rate limiting for horizontal scaling.
- **v2.0:** Local ONNX models (removing HF API dependency); drift detection.
- **v2.5:** Dockerization + GitHub Actions CI/CD; PostgreSQL migration if relation mapping is needed.

---

## 🧠 What I Learned

Building PramanaChain taught me that **"deployed" doesn't mean "secure."**

My initial version had wildcard CORS, no rate limiting, and open endpoints that allowed anyone to write to my MongoDB database. I was also returning raw Python exceptions to the client, which is a massive security risk. 

After a thorough security audit, I fixed all of these. The hardest part wasn't writing the code — it was **admitting the flaws existed**. Diagnosing cross-platform dependency build errors (`Pillow`, `bcrypt`) on Render also taught me the deep value of understanding how Python resolves C-extensions in cloud environments.

**Key insight:** Security is not a feature you add at the end. It's a mindset you build from the first line of code.

---

## 📜 License

[MIT License](LICENSE)
