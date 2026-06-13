# 🔐 PramanaChain

> **A cryptographically secured document ledger that detects forged IDs using computer vision forensics and zero-shot AI — deployed live with security hardening.**

[![Frontend](https://img.shields.io/badge/Frontend-Next.js_14-black)](https://pramanachain.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_0.110.0-009688)](https://pramanachain-backend.onrender.com)
[![Crypto](https://img.shields.io/badge/Crypto-ECDSA_secp256k1-blue)](#)
[![Security](https://img.shields.io/badge/Security-Hardened-red)](#)

**Live Demo:**
- **Frontend:** [https://pramanachain.vercel.app](https://pramanachain.vercel.app)
- **Backend:** [https://pramanachain-backend.onrender.com](https://pramanachain-backend.onrender.com) *(API Root)*

---

## 🛑 Problem Statement

Synthetic identity fraud costs US lenders **$6B+ annually**. Manual KYC (Know Your Customer) review is slow, error-prone, and causes **15-20% user drop-off** during onboarding. Current automated solutions often fail to detect sophisticated digital tampering (like spliced text on ID cards) or require massive, biased training datasets.

**PramanaChain** automates document forensics to catch tampering *before* human review. It combines Error Level Analysis (ELA) to detect image manipulation with Zero-Shot AI to extract data, then cryptographically anchors the result to an immutable ledger.

---

## 🏗️ Architecture

```ascii
[Client: Next.js 14] ──(HTTPS)──> [FastAPI Backend]
                                      │
                                      ├── 1. [OpenCV] ELA Forensics Check
                                      ├── 2. [HuggingFace] AI Data Extraction
                                      ├── 3. [SHA-256] Document Hashing
                                      ├── 4. [ECDSA] Cryptographic Signing
                                      │
                                      ▼
                      [MongoDB Atlas] & [Cloudinary CDN]
```

### Tech Stack
| Layer | Technology | Exact Version | Purpose |
|-------|------------|---------------|---------|
| **Frontend** | Next.js (App Router), TS, Tailwind | 14.x | Interactive UI, Framer Motion animations |
| **Backend** | FastAPI, Python, Uvicorn | 0.110.0, 3.11, 0.28.0 | High-performance async API |
| **Database** | MongoDB Atlas (M0 Free Tier) | 4.6.0 | Document metadata and signature ledger |
| **Storage** | Cloudinary | 1.36.0 | CDN-backed secure image storage |
| **AI/ML** | HuggingFace Inference API | N/A | Donut for VQA, YOLO11 for detection |
| **Crypto** | Python `cryptography` | >=41.0.0 | ECDSA (secp256k1) key generation & signing |
| **Forensics**| OpenCV (`opencv-python-headless`) | 4.8.0 | Error Level Analysis (ELA) for tampering |
| **Security** | slowapi, bcrypt, html | 0.1.9, >=4.0.0 | Rate limiting, password hashing, XSS escape |
| **Hosting** | Vercel (UI), Render (API) | N/A | Serverless edge & containerized deployments |

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
- **Password Complexity:** Enforced via Pydantic (`min_length=8`, must contain digit, `max_length=128`).
- **Database Health Checks:** The root endpoint (`/`) pings MongoDB and returns `503 Service Unavailable` if the database connection drops.

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
│   │   │   ├── auth.py         # MongoDB-based authentication
│   │   │   ├── crypto_signer.py# ECDSA key generation + signing
│   │   │   ├── db_client.py    # MongoDB + Cloudinary operations
│   │   │   ├── ela_detector.py # Error Level Analysis + heuristics
│   │   │   ├── hashing.py      # SHA-256 content hashing
│   │   │   └── ml_classifier.py# HuggingFace API wrapper
│   │   └── models/
│   │       └── document.py     # Pydantic document schemas
│   ├── tests/                  # Pytest suite
│   │   └── test_api.py         # Security tests (CORS, rate limits)
│   └── requirements.txt        # Loosely pinned dependencies for Render builds
├── frontend/
│   └── src/app/                # Next.js 14 App Router
│       ├── page.tsx            # Landing page
│       ├── upload/page.tsx     # Document upload + forensics UI
│       ├── verify/page.tsx     # Document verification search
│       └── dashboard/page.tsx  # User dashboard + analytics
├── docs/
│   └── architecture.md         # System design + security decisions
├── .gitignore                  # Covers secrets, IDE, OS, Node, Python
├── .env.example                # Global dummy env vars
└── README.md                   # This file
```

---

## 📡 API Endpoints

| Method | Path | Purpose | Rate Limit | Auth Required |
|--------|------|---------|------------|---------------|
| `GET` | `/` | Health check & DB ping | 60/min | No |
| `POST` | `/api/upload` | Process, scan, and anchor document | 10/min | **API Key** |
| `GET` | `/api/verify/{id}` | Retrieve and cryptographically verify doc | 60/min | No |
| `DELETE`| `/api/documents/delete` | Remove document from ledger | 20/min | **API Key** |
| `GET` | `/api/analytics` | Retrieve dataset metrics & distributions | 60/min | No |

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
| **Dependency Conflicts**| Unpinned / strict local pins | Optimized for cloud wheel building |

---

## 🧪 Tests

Run the security suite locally to verify the API gateway:

```bash
cd backend
pytest tests/test_api.py -v
```

**Coverage:**
- `test_api_key_required_for_upload` — Asserts `403` when missing key.
- `test_api_key_invalid_for_upload` — Asserts `403` on wrong key.
- `test_rate_limiting_active` — Asserts `429 Too Many Requests` after threshold breached.
- `test_malformed_json_returns_500_or_422` — Ensures no internal stack traces leak to the client.

---

## ⚠️ Known Limitations

Honesty builds trust. Here are the current limitations of this architecture:

- **Storage:** Uses MongoDB Atlas M0 free tier — limited to 512MB storage and shared RAM.
- **AI Latency:** Relies on the HuggingFace Inference API, making it subject to their rate limits and uptime. There is currently no local model fallback.
- **Rate Limiting State:** `slowapi` stores limits in-memory. This resets on container restart and won't sync across horizontally scaled instances.
- **Ledger Model:** "Blockchain" terminology refers to cryptographic signing and hashing on MongoDB, not a distributed public ledger.
- **User Auth:** Currently relies on API key gating. Full JWT/OAuth2 user authentication is not yet implemented.
- **DevOps:** No automated CI/CD pipeline or Docker containerization yet.

**Upgrade Path:**
- **v1.6:** Redis-backed rate limiting for horizontal scaling; JWT auth via Clerk.
- **v2.0:** Local ONNX models (removing HF API dependency); drift detection.
- **v2.5:** Dockerization + GitHub Actions CI/CD; PostgreSQL migration.

---

## 🧠 What I Learned

Building PramanaChain taught me that **"deployed" doesn't mean "secure."**

My initial version had wildcard CORS, no rate limiting, and open endpoints that allowed anyone to write to my database. I was also returning raw Python exceptions to the client, which is a massive security risk. 

After a thorough security audit, I fixed all of these. The hardest part wasn't writing the code — it was **admitting the flaws existed**. Diagnosing cross-platform dependency build errors (`Pillow`, `bcrypt`) on Render also taught me the deep value of understanding how Python resolves C-extensions in cloud environments.

**Key insight:** Security is not a feature you add at the end. It's a mindset you build from the first line of code.

---

## 📜 License

[MIT License](LICENSE)
