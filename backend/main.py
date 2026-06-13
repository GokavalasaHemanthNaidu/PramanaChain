# -*- coding: utf-8 -*-
"""
main.py — FastAPI entry point & API endpoints for PramanaChain Full-Stack.
Serves as the backend for the Next.js React web application.
"""
import base64
import io
import os
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator, Field
from PIL import Image
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import html

# Import local utilities
from utils import auth, crypto_signer, hashing, db_client, ml_classifier, ela_detector
from models.document import DocumentModel

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PramanaChain_backend")

app = FastAPI(
    title="PramanaChain Secure Backend",
    description="High-performance FastAPI endpoint for PramanaChain Document Trust Chain & Forgery Detection.",
    version="1.5.0"
)

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal Server Error"}
    )

# CORS configurations — Restricted for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pramanachain.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    def password_complexity(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        return html.escape(v)

class VerifyResponse(BaseModel):
    success: bool
    document: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# ── API Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
@limiter.limit("60/minute")
def home(request: Request):
    # Perform a fast health check on essential external services
    try:
        db_ping = db_client.ping()
    except Exception:
        db_ping = False
        
    if not db_ping:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    return {
        "status": "online",
        "app": "PramanaChain Backend",
        "version": "1.5.0",
        "health": "OK",
        "endpoints": ["/api/auth/signup", "/api/auth/login", "/api/upload", "/api/verify", "/api/verify/image", "/api/analytics"]
    }

# ── Authentication ──

@app.post("/api/auth/signup")
@limiter.limit("10/minute")
def signup(request: Request, payload: AuthRequest):
    result, err = auth.sign_up(payload.email, payload.password)
    if err:
        return {"success": False, "error": err}
    return {
        "success": True,
        "user": {
            "id": result.user.id,
            "email": result.user.email
        }
    }

@app.post("/api/auth/login")
@limiter.limit("20/minute")
def login(request: Request, payload: AuthRequest):
    result, err = auth.sign_in(payload.email, payload.password)
    if err:
        return {"success": False, "error": err}
    return {
        "success": True,
        "user": {
            "id": result.user.id,
            "email": result.user.email
        }
    }

from fastapi import Depends
from security import verify_api_key

# ── Secure Upload & Anchoring ──

@app.post("/api/upload")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    api_key: str = Depends(verify_api_key),
    user_id: str = Form(...),
    override_type: Optional[str] = Form(""),
    force_anchor: Optional[bool] = Form(False),
    file: UploadFile = File(...)
):
    try:
        # 1. Read file bytes and convert to PIL Image
        bytes_data = await file.read()
        image = Image.open(io.BytesIO(bytes_data)).convert("RGB")
        
        # 2. Pre-Anchoring Forensic Check (ELA, Visual Heuristics & Metadata Audit)
        _, mean_err, _ = ela_detector.calculate_ela(image)
        visual_metrics = ela_detector.detect_visual_heuristics(image)
        meta = ela_detector.audit_metadata(image)
        forgery = ela_detector.assess_forgery_risk(mean_err, meta, file.filename, visual_metrics)
        
        if forgery["risk_score"] >= 50.0 or forgery["risk_level"] == "HIGH":
            if not force_anchor:
                return {
                    "success": False,
                    "security_blocked": True,
                    "error": "Security Rejection: Forensic indicators suggest this document is fake or tampered.",
                    "forgery": forgery
                }
                
        # 3. Universal AI Extraction
        ai_result = ml_classifier.analyze_document(image, file.filename)
        flat = ml_classifier.flatten_for_db(ai_result, override_type.strip() if override_type else "")
        
        # 4. Create SHA-256 Content Fingerprint
        content_hash = hashing.create_hash(flat)
        
        # 4.5 Prevent Duplicate Anchoring
        if not force_anchor:
            existing_docs = db_client.get_user_documents(user_id)
            if any(doc.get("content_hash") == content_hash for doc in existing_docs):
                return {
                    "success": False,
                    "security_blocked": True,
                    "error": "Duplicate Alert: This exact document is already anchored in your ledger.",
                    "forgery": forgery
                }
        
        # 5. Generate ECDSA Signature and Keypair
        priv, pub = crypto_signer.generate_keypair()
        sig = crypto_signer.sign_hash(content_hash, priv)
        
        # 6. Upload original image to Cloudinary storage
        image_url = db_client.upload_image_to_storage(user_id, bytes_data, file.filename)
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to upload image to storage.")
            
        # 7. Save document record to MongoDB Ledger
        doc_model = DocumentModel(
            user_id=user_id,
            image_url=image_url,
            extracted_fields=flat,
            content_hash=content_hash,
            digital_signature=sig,
            did_public_key=pub,
            forensics={
                "risk_score": forgery["risk_score"],
                "risk_level": forgery["risk_level"],
                "details": forgery["details"],
                "force_anchored": force_anchor and (forgery["risk_score"] >= 50.0 or forgery["risk_level"] == "HIGH")
            }
        )
        saved = db_client.save_document_record(doc_model)
        
        return {
            "success": True,
            "document": {
                "id": doc_model.id or (saved["id"] if saved else ""),
                "image_url": image_url,
                "extracted_fields": flat,
                "content_hash": content_hash,
                "created_at": doc_model.created_at or ""
            }
        }
    except Exception as e:
        logger.error(f"Upload API failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ── Document Management ──

class DeleteRequest(BaseModel):
    user_id: str
    doc_ids: List[str]

class TrainingCorrectionRequest(BaseModel):
    doc_id: str
    corrected_fields: dict

@app.post("/api/training/correction")
@limiter.limit("10/minute")
async def flag_ai_error(request: Request, req: TrainingCorrectionRequest):
    """Log an AI mistake and user correction for continuous learning."""
    try:
        # Retrieve the document from db
        doc = db_client.get_document_by_id(req.doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        success = db_client.log_training_data(
            doc_id=req.doc_id,
            image_url=doc.get("image_url", ""),
            original_fields=doc.get("extracted_fields", {}),
            corrected_fields=req.corrected_fields
        )
        return {"success": success}
    except Exception as e:
        logger.error(f"Failed to log training correction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/documents/delete")
@limiter.limit("20/minute")
def delete_documents(request: Request, req: DeleteRequest):
    try:
        deleted_count = 0
        for doc_id in req.doc_ids:
            doc = db_client.get_document_by_id(doc_id)
            if doc and doc.get("user_id") == req.user_id:
                success = db_client.delete_document_record(doc_id, doc.get("image_url"))
                if success:
                    deleted_count += 1
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Error in delete documents API: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ── Public Verification ──

@app.get("/api/verify")
@limiter.limit("60/minute")
def verify_document(
    request: Request,
    query: str = Query(...),
    doc_type: Optional[str] = Query("all")
):
    query = html.escape(query.strip())
    if not query:
        return {"success": False, "error": "Search query cannot be empty."}
        
    doc_record = None
    
    # 1. Direct ID lookup
    if len(query) >= 32:
        doc_record = db_client.get_document_by_id(query)
        
    # 2. Database search
    if not doc_record:
        results = db_client.search_documents(
            search_term=query.lower(),
            doc_type_filter=doc_type,
            limit=1
        )
        if results:
            doc_record = results[0]
            
    # 3. Fuzzy fallback search across all docs
    if not doc_record:
        import difflib
        all_docs = db_client.get_all_documents(limit=500)
        best_ratio = 0.0
        best_doc = None
        for d in all_docs:
            ex = d.get("extracted_fields") or {}
            for cand in [ex.get("name",""), ex.get("document_id",""), ex.get("doc_type","")]:
                if not cand:
                    continue
                r = difflib.SequenceMatcher(None, query.lower(), cand.lower()).ratio()
                if r > best_ratio:
                    best_ratio = r
                    best_doc = d
        if best_ratio >= 0.6:
            doc_record = best_doc
            
    if not doc_record:
        return {"success": False, "error": "No matching document found in the verified ledger."}
        
    # Standardize result fields for UI rendering
    return {
        "success": True,
        "document": {
            "id": doc_record.get("id") or str(doc_record.get("_id", "")),
            "user_id": doc_record.get("user_id", ""),
            "image_url": doc_record.get("image_url", ""),
            "extracted_fields": doc_record.get("extracted_fields", {}),
            "content_hash": doc_record.get("content_hash", ""),
            "digital_signature": doc_record.get("digital_signature", ""),
            "did_public_key": doc_record.get("did_public_key", ""),
            "created_at": doc_record.get("created_at", "")
        }
    }

# ── Forgery & Image ELA Scan ──

@app.post("/api/verify/image")
@limiter.limit("10/minute")
async def verify_image_forgery(
    request: Request,
    file: UploadFile = File(...)
):
    try:
        bytes_data = await file.read()
        image = Image.open(io.BytesIO(bytes_data)).convert("RGB")
        
        # 1. Run AI Extract to check fields
        ai_result = ml_classifier.analyze_document(image, file.filename)
        
        # 2. Run Forensic Deepfake, ELA and Visual Heuristics check
        _, mean_err, heatmap = ela_detector.calculate_ela(image)
        visual_metrics = ela_detector.detect_visual_heuristics(image)
        meta = ela_detector.audit_metadata(image)
        forgery = ela_detector.assess_forgery_risk(mean_err, meta, file.filename, visual_metrics)
        
        # 3. Convert ELA Hot Heatmap to Base64 so frontend can render it instantly
        buffered = io.BytesIO()
        heatmap.save(buffered, format="JPEG", quality=95)
        heatmap_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # 4. ledger lookup & comparison
        import difflib
        entities = ai_result.get("entities", {})
        doc_type_up = ai_result.get("document_type", "Document")
        
        def _val(field):
            v = entities.get(field, "")
            return v.get("value", "") if isinstance(v, dict) else (v or "")

        name_up = _val("name")
        id_up = _val("document_id")
        
        doc_record = None
        best_ratio = 0.0

        # Strategy 1: exact document_id match
        if id_up:
            doc_record = db_client.search_by_document_id(id_up)
            if doc_record:
                best_ratio = 1.0

        # Strategy 2: fuzzy name match within detected doc type
        if not doc_record and name_up:
            kw = doc_type_up.split()[0] if doc_type_up else ""
            candidates = db_client.search_by_doc_type(kw, limit=200)
            for d in candidates:
                sname = (d.get("extracted_fields") or {}).get("name", "")
                r = difflib.SequenceMatcher(None, name_up.lower(), sname.lower()).ratio()
                if r > best_ratio:
                    best_ratio = r
                    doc_record = d
            if best_ratio < 0.55:
                doc_record = None
                
        ledger_comparison = {}
        if doc_record:
            stored_ex = doc_record.get("extracted_fields") or {}
            stored_name = stored_ex.get("name", "")
            stored_id = stored_ex.get("document_id", "")
            stored_type = stored_ex.get("doc_type", "")

            # Fuzzy name match check
            name_match_ratio = difflib.SequenceMatcher(None, name_up.lower(), stored_name.lower()).ratio()
            name_match = name_match_ratio >= 0.75

            # ID and doc type checks
            id_match = (id_up.replace(" ", "") == stored_id.replace(" ", "")) if (id_up and stored_id) else True
            type_match = doc_type_up.lower().split()[0] in stored_type.lower() if doc_type_up else True

            # Cryptographic checks
            # Recalculate hash and check ECDSA signature
            recalc_hash = hashing.create_hash(stored_ex)
            hash_valid = (recalc_hash == doc_record.get("content_hash", ""))
            
            sig_valid = False
            try:
                sig_valid = crypto_signer.verify_signature(
                    recalc_hash, doc_record.get("digital_signature", ""), doc_record.get("did_public_key", "")
                )
            except Exception as sig_err:
                logger.error(f"Signature verification error in API: {sig_err}")

            fields_ok = name_match and id_match
            crypto_ok = hash_valid and sig_valid
            
            status = "authentic" if (fields_ok and crypto_ok) else "tampered"
            
            ledger_comparison = {
                "status": status,
                "match_chance": round(name_match_ratio * 100, 1),
                "stored_record": {
                    "id": doc_record.get("id") or str(doc_record.get("_id", "")),
                    "user_id": doc_record.get("user_id", ""),
                    "image_url": doc_record.get("image_url", ""),
                    "extracted_fields": stored_ex,
                    "content_hash": doc_record.get("content_hash", ""),
                    "digital_signature": doc_record.get("digital_signature", ""),
                    "did_public_key": doc_record.get("did_public_key", ""),
                    "created_at": doc_record.get("created_at", "")
                },
                "field_comparison": {
                    "name": {
                        "uploaded": name_up,
                        "stored": stored_name,
                        "match": name_match
                    },
                    "document_id": {
                        "uploaded": id_up,
                        "stored": stored_id,
                        "match": id_match
                    },
                    "doc_type": {
                        "uploaded": doc_type_up,
                        "stored": stored_type,
                        "match": type_match
                    }
                },
                "crypto_audit": {
                    "hash_valid": hash_valid,
                    "signature_valid": sig_valid
                }
            }
        else:
            ledger_comparison = {
                "status": "not_found",
                "match_chance": 0.0,
                "stored_record": None,
                "field_comparison": {
                    "name": {"uploaded": name_up, "stored": "", "match": False},
                    "document_id": {"uploaded": id_up, "stored": "", "match": False},
                    "doc_type": {"uploaded": doc_type_up, "stored": "", "match": False}
                },
                "crypto_audit": {
                    "hash_valid": False,
                    "signature_valid": False
                }
            }

        return {
            "success": True,
            "filename": html.escape(file.filename),
            "ai_result": {
                **ai_result,
                "document_type": html.escape(doc_type_up)
            },
            "forgery_result": forgery,
            "metadata_audit": meta,
            "heatmap_image": f"data:image/jpeg;base64,{heatmap_base64}",
            "ledger_comparison": ledger_comparison
        }
    except Exception as e:
        logger.error(f"Image forensic scan failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ── User Dashboard Analytics ──

@app.get("/api/analytics")
@limiter.limit("60/minute")
def get_user_analytics(request: Request, user_id: str = Query(...)):
    try:
        docs = db_client.get_user_documents(user_id)
        total = len(docs)
        
        # Calculate doc type frequencies
        categories = {}
        languages = {}
        for d in docs:
            ex = d.get("extracted_fields") or {}
            dt = ex.get("doc_type", "Unknown")
            categories[dt] = categories.get(dt, 0) + 1
            
            lang = ex.get("language", "english")
            languages[lang] = languages.get(lang, 0) + 1
            
        return {
            "success": True,
            "total_documents": total,
            "categories": categories,
            "languages": languages,
            "documents": [
                {
                    "id": d.get("id") or str(d.get("_id", "")),
                    "image_url": d.get("image_url", ""),
                    "doc_type": (d.get("extracted_fields") or {}).get("doc_type", "Document"),
                    "name": (d.get("extracted_fields") or {}).get("name", ""),
                    "document_id": (d.get("extracted_fields") or {}).get("document_id", ""),
                    "created_at": d.get("created_at", "")[:10] if d.get("created_at") else ""
                }
                for d in docs
            ]
        }
    except Exception as e:
        logger.error(f"Error in analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/training/status")
def get_training_status():
    """Return the current state of the continuous learning queue."""
    try:
        training_data = db_client._load_local_training()
        total = len(training_data)
        recent = []
        for rec in reversed(training_data[-10:]):
            recent.append({
                "doc_id": rec.get("doc_id", ""),
                "timestamp": rec.get("timestamp", ""),
                "original_type": rec.get("original_ai_prediction", {}).get("doc_type", ""),
                "corrected_type": rec.get("user_correction", {}).get("doc_type", ""),
                "original_name": rec.get("original_ai_prediction", {}).get("name", ""),
                "corrected_name": rec.get("user_correction", {}).get("name", ""),
            })
        return {
            "success": True,
            "total_corrections": total,
            "model_improvements": max(0, total - 1),
            "recent_corrections": recent,
            "learning_active": True,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
