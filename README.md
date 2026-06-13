# 🔐 PramanaChain

> **One-line hook:** A cryptographically secured document ledger that detects 
> forged IDs using computer vision forensics and zero-shot AI — deployed live.

**Live Demo:** https://pramanachain.vercel.app

---

## 🏗️ Architecture
```
[Next.js Frontend] → [FastAPI Backend] → [MongoDB + Cloudinary]
                           ↓
                    [ECDSA Signing] + [ELA Forensics] + [Zero-Shot AI]
```

## 🔒 Security Features
- ✅ CORS restricted to `pramanachain.vercel.app`
- ✅ Rate limiting: 10 req/min uploads, 60 req/min reads
- ✅ API key gate on all POST endpoints
- ✅ XSS sanitization on all outputs
- ✅ Global exception handler (no stack traces leaked)
- ✅ MongoDB health check on root endpoint

## 🚀 Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m src.main

# Frontend
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
PramanaChain/
├── backend/
│   ├── src/           # Source code
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Security, middleware
│   │   ├── services/  # Business logic
│   │   ├── models/    # Pydantic + DB schemas
│   │   └── utils/     # Helpers
│   ├── tests/         # pytest suite
│   └── requirements.txt
├── frontend/          # Next.js app
├── docs/              # Architecture + ADRs
└── README.md
```

## 🛡️ What I Learned
Building this taught me that "deployed" doesn't mean "secure." I had to 
add rate limiting, API keys, and XSS protection after a security audit — 
real-world backend engineering.

## 📜 License
MIT
