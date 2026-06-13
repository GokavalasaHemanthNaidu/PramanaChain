## PROJECT BLUEPRINT: PramanaChain

### 1. EXECUTIVE SUMMARY
- **One-Line Hook:** A cryptographically secured, zero-shot AI document ledger that instantly detects deepfakes, blocks forged IDs, and anchors digital truth immutably.
- **Problem Domain:** FinTech / LegalTech / Identity Verification (KYC/AML) in India.
- **Business Value Proposition:** Protects institutions from millions in fraud losses by algorithmically rejecting deepfakes and synthetically tampered documents at the point of ingestion, before manual human review.
- **Unique Differentiator:** Combines cryptographic anchoring (ECDSA + SHA-256) with computer vision forensics (Error Level Analysis) and zero-shot VQA (Donut), proving not just *what* a document says, but mathematically proving its *genesis and authenticity*.
- **Status:** Cloud-deployed (Vercel frontend, Render backend) with strict security hardening (API keys, CORS, rate limits).

### 2. REAL-LIFE PROBLEM & MARKET CONTEXT
- **Which real company has this exact problem?** Stripe (Identity API), Persona, Onfido, Chainalysis, Indian Banks.
- **Cost of the Problem:** Synthetic identity fraud (Aadhaar, PAN) costs institutions massive sums annually. Manual KYC review latency causes a 15-20% user drop-off during onboarding.
- **Current Industry Solutions:** Incumbents rely heavily on expensive manual human-in-the-loop verification or basic OCR templates that break when ID formats change. Most lack robust pixel-level deepfake detection (ELA).
- **Why this solution wins:** Zero-shot AI means zero templates are needed (infinite scalability across global ID types). ELA detects tampering that human reviewers miss. ECDSA anchoring guarantees the document is never secretly altered post-upload.

### 3. SYSTEM DESIGN & ARCHITECTURE
**Text-Based Architecture Diagram:**
```text
[Client: Next.js App] ──(HTTPS)──> [FastAPI Gateway on Render] 
                                                        ↓
                                    [slowapi Rate Limits & API Key Auth]
                                                        ↓
[Image Blob] → [Cloudinary CDN]             [Core Inference Engine]
                                            ↙           ↓           ↘
                          [OCR API Fallback]  [OpenCV: ELA]  [Donut: Zero-Shot VQA]
                                                        ↓
                                         [ECDSA Cryptographic Signer]
                                                        ↓
                                          [MongoDB Atlas (Primary)]
```

- **Data Flow (Write Path):** 
  1. User uploads document via Next.js frontend (with X-API-Key).
  2. Image is passed to FastAPI backend via multipart/form-data.
  3. Image is asynchronously uploaded to Cloudinary for blob storage.
  4. Core Inference Engine runs OpenCV ELA (tamper check) and HuggingFace APIs (classification & Donut metadata extraction).
  5. If valid, the image hash (SHA-256) and extracted metadata are signed via ECDSA.
  6. Ledger entry is anchored in MongoDB Atlas.
- **Scaling Strategy:** Frontend is globally distributed via Vercel Edge. Backend scales horizontally via containerized Python 3.11 FastAPI instances on Render. MongoDB scales via replica sets.
- **Bottleneck Analysis:** The GPU/CPU-bound ML Inference Service (Donut VQA) will bottleneck first at 10x load. Mitigated by decoupling inference into a Celery/RabbitMQ async worker queue in v2.0.

### 4. TECH STACK (EXACT SPECIFICATIONS)
| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Language | TypeScript / Python | 5.0 / 3.11.8 | Type safety on client; ML ecosystem on backend. |
| Backend Framework | FastAPI / Uvicorn | >=0.110.0 / >=0.28.0 | High performance ASGI, native Pydantic validation. |
| Database (Primary) | MongoDB Atlas (M0) | pymongo | Flexible JSON schema for diverse zero-shot document structures. |
| Blob Storage | Cloudinary | `cloudinary` SDK | Managed CDN for optimized image delivery. |
| Cryptography | Python `cryptography` | >=41.0.0 | ECDSA (SECP256R1) NIST P-256 signatures matching enterprise standards. |
| ML Framework | OpenCV | >=4.8.0 | Industry standard for Vision Language Models and pixel matrices. |
| Vision Models | Microsoft DiT Pre-trained / Donut | latest | Custom model for classification; Donut for template-free VQA extraction. |
| OCR Engine | OCR.space + PyTesseract | v2 | English, Hindi, Telugu, Tamil, Kannada fallback extraction. |
| Frontend | Next.js (App Router) | 14.x | Server React Components, superior SEO, edge caching. |
| Styling | Tailwind CSS / Framer | 3.4 / 11 | Rapid UI prototyping with complex forensic HUD animations. |
| Cloud Provider | Vercel (Front) / Render (Back) | - | Serverless execution optimized for Next.js and Python clouds. |
| Security | slowapi, bcrypt | 0.1.9, >=4.0.0 | Robust rate limiting and memory-hard password hashing. |

### 5. DATABASE SCHEMA DESIGN
**Entity Relationship Summary:**
- **Collection: `ledger_anchors`**
  - **Primary Key:** `_id` (ObjectId)
  - **Indexes:** `content_hash` (Unique, ascending) for fast public ledger lookups; `did_public_key` for identity querying.
  - **Data Retention:** Immutable. No TTL. Append-only logic enforced at the application layer.

**Schema JSON (Pydantic / MongoDB):**
```json
{
  "_id": "ObjectId('...')",
  "document_id": "string",
  "user_id": "string",
  "image_url": "https://res.cloudinary.com/...",
  "extracted_fields": {
    "name": "string",
    "doc_type": "string",
    "dynamic_field_n": "any"
  },
  "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae...",
  "digital_signature": "3045022100a9b8...",
  "did_public_key": "04a1b2c3...",
  "risk_score": 12.5,
  "created_at": "ISODate('2026-06-13T10:00:00Z')"
}
```

### 6. API DESIGN
**Base URL:** `https://api.pramanachain.com/v1`
**Authentication:** API Keys (`X-API-Key`) for mutations; Rate-limited by IP.

| Method | Endpoint | Purpose | Request Body | Response Body | Rate Limit | Auth |
|--------|----------|---------|--------------|---------------|------------|------|
| POST | `/api/upload` | Run ELA, VQA, and anchor document | `multipart/form-data` | `{ success: bool, id: string, signature: string }` | 10/min | Key |
| GET | `/api/verify/{id}` | Publicly verify a document hash | None | `{ status: "authentic", match_chance: 99.9, record: {} }` | 60/min | None |
| GET | `/api/analytics` | Fetch document analytics distribution | None | `{ categories: {}, languages: {} }` | 60/min | None |

### 7. AI / ML / QUANT PIPELINE
**Problem Formulation:**
- **Task type:** Multi-modal (Image Classification for forgery + Generative VQA for extraction).
- **Mathematical Formulation (ELA):** Detect local maxima in compression error matrices: $E(x,y) = |I_{orig}(x,y) - I_{recompressed}(x,y)|$. High variance in $\Delta E$ signifies tampering.

**Model Architecture:**
- **Model Name:** Donut (Document Understanding Transformer), Custom Classification Model (`microsoft/dit-base-finetuned-rvlcdip`).
- **Why this architecture?** Donut requires *zero* OCR bounding boxes, mapping raw pixels directly to JSON. The custom model specifically targets Indian KYC documents. OpenCV provides deterministic heuristic checks (Laplacian variance for blur, FFT for Moiré).

### 8. BACKEND ENGINEERING & SDE IMPRESSIONS
**Code Organization (FAANG Structure):**
```text
backend/
├── src/
│   ├── main.py       (FastAPI Entrypoint & Global Exception Handler)
│   ├── core/         (Security, Rate Limiting Middleware)
│   ├── api/          (Route handlers)
│   ├── models/       (Pydantic DB schemas)
│   ├── services/     (Business Logic)
│   └── utils/        (Auth, Crypto Signers, Cloudinary Clients, ML Pipeline)
├── tests/            (Pytest Security Suite)
├── requirements.txt  (Loosely Pinned for CI/CD)
└── .python-version   (Forces 3.11.8 on Render)
```

**Key Engineering Decisions:**
- **Security Hardening:** Wildcard CORS eliminated, slowapi limits implemented, exception tracebacks obfuscated, XSS sanitization deployed via `html.escape`.
- **Concurrency model:** Python `asyncio` with FastAPI. ML inference is run in threadpools (`run_in_executor`) to prevent blocking the async event loop during heavy matrix operations.
- **Dependency Reliability:** Dropped strict `==` locks for C-extensions (`Pillow`, `bcrypt`) to guarantee clean wheel resolution on diverse Linux environments (Render).

### 9. GAPS & ROADMAP
- **What is missing right now?** A dedicated async message queue (RabbitMQ) for the ML pipeline. Synchronous inference is currently vulnerable to timeout under heavy concurrent load.
- **Next 3 milestones:**
  1. **v1.6:** Decouple ML inference into a Celery worker queue.
  2. **v2.0:** Implement WebSockets for real-time progress bars during the Donut VQA extraction.
  3. **v2.5:** Dockerize application environment for local development parity.

### 10. RESUME BULLETS (Copy-Pasteable)
**SDE / Full-Stack Resume:**
- Architected a secure, API-gated cryptographic document ledger using Next.js and FastAPI, successfully deploying to Vercel and Render while mitigating CORS, XSS, and DDoS vulnerabilities.
- Structured a production-grade Python backend separating CPU-bound (ML) tasks from I/O-bound (MongoDB/Cloudinary) tasks, improving concurrency via threadpools.
- Hardened server infrastructure by instituting in-memory rate limits (slowapi), SECP256R1 ECDSA content anchoring, and strict Pydantic payload validation.

**DS / MLE Resume:**
- Deployed a zero-shot Vision-Language Model (Donut) pipeline to extract unstructured KYC data, eliminating the need for hardcoded OCR templates.
- Engineered a computer vision deepfake detection module using Error Level Analysis (ELA), Laplacian blur variance, and FFT Moiré pattern detection to isolate pixel-compression anomalies to catch synthetic identity fraud.
- Integrated heavy PyTorch transformer inference within a low-latency FastAPI microservice environment on cloud platforms.
