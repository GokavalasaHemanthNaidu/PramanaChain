# -*- coding: utf-8 -*-
"""
db_client.py  ─  MongoDB Atlas backend (replaces Supabase)
Collections:
  documents  ─ document records + trust chain
  users      ─ registered accounts (email + bcrypt hash)

Image storage: Cloudinary free tier (25 GB, never pauses)
"""
import os
import re
import uuid
import logging
import datetime
from typing import Dict, Any, Optional, List

try:
    import streamlit as st
except ImportError:
    st = None
from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection
import cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)

# ── Secrets helper ─────────────────────────────────────────────────────────────
def _secret(key, default=None):
    try:
        return st.secrets[key]
    except Exception:
        return os.getenv(key, default)

from functools import lru_cache

# ── MongoDB connection (cached per session) ────────────────────────────────────
@lru_cache(maxsize=1)
def _get_mongo():
    uri = _secret("MONGO_URI", "")
    if not uri:
        logger.error("MONGO_URI not set in secrets.")
        return None
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")          # verify connection
        return client
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return None

def _db():
    client = _get_mongo()
    if client is None:
        return None
    db_name = _secret("MONGO_DB", "PramanaChain")
    return client[db_name]

def _docs() -> Optional[Collection]:
    db = _db()
    return db["documents"] if db is not None else None

def _users() -> Optional[Collection]:
    db = _db()
    return db["users"] if db is not None else None

def _training() -> Optional[Collection]:
    db = _db()
    return db["ai_training_data"] if db is not None else None

# ── Cloudinary setup ───────────────────────────────────────────────────────────
def _init_cloudinary():
    cloudinary.config(
        cloud_name = _secret("CLOUDINARY_CLOUD_NAME", ""),
        api_key    = _secret("CLOUDINARY_API_KEY",    ""),
        api_secret = _secret("CLOUDINARY_API_SECRET", ""),
        secure     = True,
    )

# ── Local File DB Fallback Setup ───────────────────────────────────────────────
import json

LOCAL_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "local_db")
os.makedirs(LOCAL_DB_DIR, exist_ok=True)
USERS_FILE = os.path.join(LOCAL_DB_DIR, "users.json")
DOCS_FILE = os.path.join(LOCAL_DB_DIR, "documents.json")
TRAINING_FILE = os.path.join(LOCAL_DB_DIR, "ai_training_data.json")

def _load_local_users() -> dict:
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading local users: {e}")
        return {}

def _save_local_users(users: dict):
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving local users: {e}")

def _load_local_docs() -> list:
    if not os.path.exists(DOCS_FILE):
        return []
    try:
        with open(DOCS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading local docs: {e}")
        return []

def _save_local_docs(docs: list):
    try:
        with open(DOCS_FILE, "w", encoding="utf-8") as f:
            json.dump(docs, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving local docs: {e}")

def _load_local_training() -> list:
    if not os.path.exists(TRAINING_FILE):
        return []
    try:
        with open(TRAINING_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading local training data: {e}")
        return []

def _save_local_training(data: list):
    try:
        with open(TRAINING_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving local training data: {e}")

# ── DOCUMENT: upload image ─────────────────────────────────────────────────────
def upload_image_to_storage(user_id: str, file_bytes: bytes, file_name: str) -> Optional[str]:
    """Upload image to Cloudinary and return the secure public URL, with base64 fallback."""
    try:
        cloud_name = _secret("CLOUDINARY_CLOUD_NAME", "")
        if cloud_name:
            _init_cloudinary()
            public_id = f"PramanaChain/{user_id}/{uuid.uuid4().hex}"
            result = cloudinary.uploader.upload(
                file_bytes,
                public_id   = public_id,
                resource_type = "image",
                overwrite   = True,
            )
            return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed, using local fallback: {e}")
        
    # Fallback to local Data URI if Cloudinary is not configured or fails
    import base64
    ext = file_name.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        ext = "jpeg"
    mime = f"image/{ext}"
    if ext == "jpg":
        mime = "image/jpeg"
    b64_data = base64.b64encode(file_bytes).decode("utf-8")
    logger.info("Using local Base64 URL fallback for image storage.")
    return f"data:{mime};base64,{b64_data}"

# ── DOCUMENT: save record ──────────────────────────────────────────────────────
def save_document_record(document_model) -> Optional[Dict[str, Any]]:
    """Insert a document record into MongoDB or local JSON fallback."""
    data = document_model.to_dict()
    if "id" not in data or not data["id"]:
        data["id"] = str(uuid.uuid4())
    data["created_at"] = data.get("created_at") or \
        datetime.datetime.now(datetime.timezone.utc).isoformat()
        
    col = _docs()
    if col is not None:
        try:
            col.insert_one(data)
            res = dict(data)
            res.pop("_id", None)
            return res
        except Exception as e:
            logger.error(f"Error saving document to MongoDB, using local fallback: {e}")
            
    # Local fallback
    docs = _load_local_docs()
    docs.append(data)
    _save_local_docs(docs)
    logger.info(f"Saved document record locally: {data['id']}")
    return data

# ── DOCUMENT: get all for user ─────────────────────────────────────────────────
def get_user_documents(user_id: str) -> List[Dict[str, Any]]:
    """Return all documents belonging to user_id, newest first."""
    col = _docs()
    if col is not None:
        try:
            docs = list(col.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("created_at", DESCENDING))
            return docs
        except Exception as e:
            logger.error(f"Error fetching user documents from Mongo, using local fallback: {e}")
            
    # Local fallback
    docs = _load_local_docs()
    user_docs = [d for d in docs if d.get("user_id") == user_id]
    user_docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return user_docs

# ── DOCUMENT: get by id ────────────────────────────────────────────────────────
def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single document by its UUID string id."""
    col = _docs()
    if col is not None:
        try:
            doc = col.find_one({"id": doc_id}, {"_id": 0})
            return doc
        except Exception as e:
            logger.error(f"Error fetching document {doc_id} from Mongo, using local fallback: {e}")
            
    # Local fallback
    docs = _load_local_docs()
    for d in docs:
        if d.get("id") == doc_id:
            return d
    return None

# ── DOCUMENT: delete ───────────────────────────────────────────────────────────
def delete_document_record(doc_id: str, image_url: Optional[str] = None) -> bool:
    """Delete document from MongoDB/Local and optionally remove Cloudinary image."""
    deleted = False
    col = _docs()
    if col is not None:
        try:
            col.delete_one({"id": doc_id})
            deleted = True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id} from Mongo: {e}")

    # Local fallback delete
    docs = _load_local_docs()
    new_docs = [d for d in docs if d.get("id") != doc_id]
    if len(new_docs) < len(docs):
        _save_local_docs(new_docs)
        deleted = True

    # Delete from Cloudinary if URL present and valid
    if image_url and "cloudinary" in image_url:
        try:
            _init_cloudinary()
            match = re.search(r"/upload/(?:v\d+/)?(PramanaChain/.+?)(?:\.\w+)?$", image_url)
            if match:
                cloudinary.uploader.destroy(match.group(1))
        except Exception:
            pass

    return deleted

# ── AI TRAINING: Log corrections ────────────────────────────────────────────────
def log_training_data(doc_id: str, image_url: str, original_fields: dict, corrected_fields: dict) -> bool:
    """Save an AI mistake and user correction to the training queue."""
    import datetime
    
    record = {
        "doc_id": doc_id,
        "image_url": image_url,
        "original_ai_prediction": original_fields,
        "user_correction": corrected_fields,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    # Try Mongo
    col = _training()
    if col is not None:
        try:
            col.insert_one(record.copy())
            return True
        except Exception as e:
            logger.error(f"Error saving training data to Mongo: {e}")
            
    # Local fallback
    train_data = _load_local_training()
    train_data.append(record)
    _save_local_training(train_data)
    return True

# ── SEARCH: unified search for verify page ─────────────────────────────────────
def search_documents(
    search_term: str = "",
    doc_type_filter: str = "all",
    limit: int = 1
) -> List[Dict[str, Any]]:
    """
    Search documents across name, document_id, doc_type, address.
    Returns list of matching raw dicts (MongoDB documents, _id excluded).
    """
    col = _docs()
    if col is not None:
        try:
            query: Dict[str, Any] = {}
            if doc_type_filter and doc_type_filter != "all":
                TYPE_KEYWORDS = {
                    "id card": "id", "Invoice / Receipt": "invoice",
                    "Marksheet / Result": "marksheet", "10th Marksheet": "10th",
                    "12th Marksheet": "12th", "Semester Grade Card": "semester",
                    "Bank Statement": "bank", "Resume / CV": "resume",
                    "Legal Document": "legal", "Document": "",
                }
                kw = TYPE_KEYWORDS.get(doc_type_filter, doc_type_filter)
                if kw:
                    query["extracted_fields.doc_type"] = {"$regex": kw, "$options": "i"}

            if search_term:
                s = re.escape(search_term)
                text_query = {"$or": [
                    {"extracted_fields.name":        {"$regex": s, "$options": "i"}},
                    {"extracted_fields.document_id": {"$regex": s, "$options": "i"}},
                    {"extracted_fields.doc_type":    {"$regex": s, "$options": "i"}},
                    {"extracted_fields.address":     {"$regex": s, "$options": "i"}},
                    {"image_url":                    {"$regex": s, "$options": "i"}},
                ]}
                if query:
                    query = {"$and": [query, text_query]}
                else:
                    query = text_query

            results = list(col.find(query, {"_id": 0}).limit(limit))
            return results
        except Exception as e:
            logger.error(f"Search Mongo error, using local fallback: {e}")

    # Local fallback
    docs = _load_local_docs()
    results = []
    
    # Normalize filtering
    kw_filter = None
    if doc_type_filter and doc_type_filter != "all":
        TYPE_KEYWORDS = {
            "id card": "id", "Invoice / Receipt": "invoice",
            "Marksheet / Result": "marksheet", "10th Marksheet": "10th",
            "12th Marksheet": "12th", "Semester Grade Card": "semester",
            "Bank Statement": "bank", "Resume / CV": "resume",
            "Legal Document": "legal", "Document": "",
        }
        kw_filter = TYPE_KEYWORDS.get(doc_type_filter, doc_type_filter).lower()

    for d in docs:
        ex = d.get("extracted_fields") or {}
        
        # 1. Type match
        if kw_filter:
            dt = ex.get("doc_type", "").lower()
            if kw_filter not in dt:
                continue
                
        # 2. Text match
        if search_term:
            s_term = search_term.lower()
            name_match = s_term in ex.get("name", "").lower()
            id_match = s_term in ex.get("document_id", "").lower()
            type_match = s_term in ex.get("doc_type", "").lower()
            addr_match = s_term in ex.get("address", "").lower()
            url_match = s_term in d.get("image_url", "").lower()
            if not (name_match or id_match or type_match or addr_match or url_match):
                continue
                
        results.append(d)
        if len(results) >= limit:
            break
            
    return results

def search_by_document_id(doc_id_value: str) -> Optional[Dict[str, Any]]:
    """Exact search by document_id field (for fake detection)."""
    col = _docs()
    if col is not None:
        try:
            doc = col.find_one(
                {"extracted_fields.document_id": {"$regex": f"^{re.escape(doc_id_value)}$", "$options": "i"}},
                {"_id": 0}
            )
            return doc
        except Exception as e:
            logger.error(f"search_by_document_id Mongo error, using local fallback: {e}")

    # Local fallback
    docs = _load_local_docs()
    for d in docs:
        ex = d.get("extracted_fields") or {}
        if ex.get("document_id", "").strip().lower() == doc_id_value.strip().lower():
            return d
    return None

def search_by_doc_type(doc_type_kw: str, limit: int = 200) -> List[Dict[str, Any]]:
    """Return all documents of a given type (keyword search)."""
    col = _docs()
    if col is not None:
        try:
            query = {}
            if doc_type_kw:
                query["extracted_fields.doc_type"] = {"$regex": re.escape(doc_type_kw), "$options": "i"}
            return list(col.find(query, {"_id": 0}).limit(limit))
        except Exception as e:
            logger.error(f"search_by_doc_type Mongo error, using local fallback: {e}")

    # Local fallback
    docs = _load_local_docs()
    results = []
    for d in docs:
        ex = d.get("extracted_fields") or {}
        if doc_type_kw.lower() in ex.get("doc_type", "").lower():
            results.append(d)
            if len(results) >= limit:
                break
    return results

def get_all_documents(limit: int = 500) -> List[Dict[str, Any]]:
    """Return all documents (for fuzzy fallback search)."""
    col = _docs()
    if col is not None:
        try:
            return list(col.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit))
        except Exception as e:
            logger.error(f"get_all_documents Mongo error, using local fallback: {e}")

    # Local fallback
    docs = _load_local_docs()
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return docs[:limit]

# ── USER AUTH helpers (used by auth.py) ────────────────────────────────────────
def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    col = _users()
    if col is not None:
        try:
            return col.find_one({"email": email.lower()}, {"_id": 0})
        except Exception as e:
            logger.error(f"find_user_by_email Mongo error, using local fallback: {e}")

    # Local fallback
    users = _load_local_users()
    return users.get(email.lower())

def create_user(email: str, password_hash: str) -> Optional[Dict[str, Any]]:
    user = {
        "id":            str(uuid.uuid4()),
        "email":         email.lower(),
        "password_hash": password_hash,
        "created_at":    datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    
    col = _users()
    if col is not None:
        try:
            col.insert_one(user)
            col.create_index("email", unique=True)
            res = dict(user)
            res.pop("_id", None)
            return res
        except Exception as e:
            logger.error(f"create_user Mongo error, using local fallback: {e}")

    # Local fallback
    users = _load_local_users()
    if email.lower() in users:
        return None
    users[email.lower()] = user
    _save_local_users(users)
    return user
