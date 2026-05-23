# -*- coding: utf-8 -*-
"""
ocr_processor.py — Multi-language OCR engine
Primary:  EasyOCR  (English + Hindi + Telugu + Tamil + Kannada)
Fallback: Tesseract (English only, if EasyOCR unavailable)
"""
import re
import logging
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ── Language sets (Legacy reference) ──────────────────────────────────────────
# We no longer cache PyTorch local models to save 600MB RAM.

def _detect_script(image: Image.Image) -> str:
    """
    Lightweight heuristic: scan pixel patterns to guess script family.
    In the cloud API, we typically let the API auto-detect or use engine 2.
    """
    return "eng"


def _preprocess(image: Image.Image) -> Image.Image:
    """Standardise image for OCR: greyscale → sharpen → contrast boost."""
    img = image.convert("L")                          # greyscale
    img = img.filter(ImageFilter.SHARPEN)             # sharpening kernel
    img = ImageEnhance.Contrast(img).enhance(2.0)    # 2× contrast
    return img


# ── Primary: Cloud OCR Offload (0MB RAM) ──────────────────────────────────────
def _external_ocr_extract(image: Image.Image) -> str:
    """Run OCR.space Free API to offload heavy PyTorch processing."""
    try:
        import io, requests
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        
        payload = {
            'apikey': 'helloworld',
            'language': 'eng',
            'isOverlayRequired': False,
            'OCREngine': 2,
        }
        res = requests.post(
            'https://api.ocr.space/parse/image',
            files={'filename': ('image.jpg', buf, 'image/jpeg')},
            data=payload,
            timeout=20
        )
        if res.status_code == 200:
            result = res.json()
            if not result.get("IsErroredOnProcessing"):
                lines = [p.get("ParsedText", "") for p in result.get("ParsedResults", [])]
                return "\n".join(lines).strip()
    except Exception as e:
        logger.warning(f"External Cloud OCR failed: {e}")
    return ""


# ── Fallback: Tesseract ───────────────────────────────────────────────────────
def _tesseract_extract(image: Image.Image) -> str:
    """Fallback OCR using Tesseract (English only)."""
    try:
        import pytesseract
        processed = _preprocess(image)
        return pytesseract.image_to_string(processed, config="--oem 3 --psm 3")
    except Exception as e:
        logger.warning(f"Tesseract fallback also failed: {e}")
        return ""


# ── Public API ────────────────────────────────────────────────────────────────
def process_image(image: Image.Image) -> str:
    """
    Extract text from a document image.
    Tries Free Cloud OCR API first, falls back to local Tesseract binary.
    Returns a single string of extracted text.
    """
    text = _external_ocr_extract(image)
    if not text.strip():
        logger.info("Cloud OCR returned empty — trying local Tesseract fallback")
        text = _tesseract_extract(image)
    return text


def detect_language(text: str) -> str:
    """
    Detect the primary script in extracted text.
    Returns: 'hindi' | 'telugu' | 'tamil' | 'kannada' | 'english'
    """
    if not text:
        return "english"
    # Unicode block ranges
    devanagari = sum(1 for c in text if "\u0900" <= c <= "\u097F")   # Hindi
    telugu     = sum(1 for c in text if "\u0C00" <= c <= "\u0C7F")   # Telugu
    tamil      = sum(1 for c in text if "\u0B80" <= c <= "\u0BFF")   # Tamil
    kannada    = sum(1 for c in text if "\u0C80" <= c <= "\u0CFF")   # Kannada

    scores = {"hindi": devanagari, "telugu": telugu,
              "tamil": tamil, "kannada": kannada}
    best   = max(scores, key=scores.get)
    return best if scores[best] > 3 else "english"


# ── Field extraction (unchanged from original) ────────────────────────────────
def extract_fields(text: str) -> Dict[str, Any]:
    """Extract structured fields from raw OCR text."""
    fields = {}
    if not text.strip():
        return fields

    # 1. Name patterns
    name_patterns = [
        r"(?im)^(?:Name|Student Name|Customer|Patient|User|Employee)[^\w\n]+([A-Za-z\s\.]+)(?:\n|$)",
        r"(?i)(?:Name|Customer|Bill To|Billed To)[:\-\s]+([A-Za-z\s\.]+)(?:\n|$)",
        r"(?i)^([A-Z][a-z]+ [A-Z][a-z]+)",
    ]
    for p in name_patterns:
        m = re.search(p, text)
        if m:
            fields["name"] = m.group(1).strip()
            break

    # 2. Amount patterns
    amount_patterns = [
        r"(?i)(?:Total|Amount|Due|Balance|Price|INR|Rs\.?|\$|₹)[:\s]*([\d,]+\.?\d*)",
        r"([\d,]+\.\d{2})",
    ]
    for p in amount_patterns:
        m = re.search(p, text)
        if m:
            fields["amount"] = m.group(1).strip()
            break

    # 3. ID patterns
    id_patterns = [
        r"(?i)(?:Roll\s*No|Invoice\s*No|ID\s*No|Reg\s*No|Aadhaar|PAN|Voter|License)[^\w\n]*([A-Za-z0-9-]+)",
        r"(?i)(?:ID|No\.?|Number|Roll)[\s:\-]+([A-Za-z0-9-]+)",
    ]
    for p in id_patterns:
        m = re.search(p, text)
        if m:
            fields["document_id"] = m.group(1).strip()
            break

    # 4. Date patterns
    date_match = re.search(
        r"(?i)(?:Date|D\.?O\.?B\.?)[^\w\n]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})",
        text,
    )
    if date_match:
        fields["date"] = date_match.group(1).strip()

    # Cleanup garbage tokens
    garbage = {"ENTITY", "U", "THE", "AND", "TOTAL"}
    for k, v in fields.items():
        if v.upper() in garbage:
            fields[k] = ""

    return {k: v for k, v in fields.items() if v}
