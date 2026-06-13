# PramanaChain Architecture

## System Design
[Client: Next.js] → [Vercel CDN] → [FastAPI Backend]
                                      ↓
                           [MongoDB Atlas] ← [Cloudinary CDN]

## Security
- CORS restricted to pramanachain.vercel.app
- Rate limiting: 10 req/min uploads
- API key gate on POST endpoints
- XSS sanitization on all outputs

## Tech Stack
- Backend: FastAPI + slowapi
- Database: MongoDB Atlas
- Storage: Cloudinary
- AI: HuggingFace Inference API
- Crypto: ECDSA (secp256k1)
