# -*- coding: utf-8 -*-
"""
test_integration.py — Integration test suite for PramanaChain FastAPI backend.
ASCII version for Windows CP1252 console safety.
"""
import requests
import os
import sys

BACKEND_URL = "http://127.0.0.1:8000"

def test_root():
    print("[...] Testing ROOT endpoint...")
    try:
        res = requests.get(f"{BACKEND_URL}/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        print("[PASS] ROOT endpoint passed!")
        return True
    except Exception as e:
        print(f"[FAIL] ROOT endpoint failed: {e}")
        return False

def test_auth():
    print("\n[...] Testing AUTH (Signup & Login) endpoints...")
    test_user = {
        "email": "test_audit@PramanaChain.org",
        "password": "SecurePassword123!"
    }
    try:
        # Signup
        res_signup = requests.post(f"{BACKEND_URL}/api/auth/signup", json=test_user)
        assert res_signup.status_code == 200
        signup_data = res_signup.json()
        print(f"   Signup API response: {signup_data}")
        
        # Login
        res_login = requests.post(f"{BACKEND_URL}/api/auth/login", json=test_user)
        assert res_login.status_code == 200
        login_data = res_login.json()
        assert login_data["success"] is True
        assert "user" in login_data
        print("[PASS] AUTH endpoints passed!")
        return login_data["user"]["id"]
    except Exception as e:
        print(f"[FAIL] AUTH endpoints failed: {e}")
        return None

def test_upload(user_id):
    print("\n[...] Testing SECURE UPLOAD & ANCHORING endpoint...")
    test_img_path = "test_invoice.jpg"
    if not os.path.exists(test_img_path):
        print(f"[WARN] Test image '{test_img_path}' not found, creating a dummy image...")
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (300, 100), color=(12, 20, 38))
        d = ImageDraw.Draw(img)
        d.text((10, 10), "PramanaChain TEST INVOICE #12345", fill=(255, 255, 255))
        d.text((10, 40), "Total Amount: $500.00", fill=(255, 255, 255))
        d.text((10, 70), "Date: 2026-05-21", fill=(255, 255, 255))
        img.save(test_img_path)

    try:
        with open(test_img_path, "rb") as f:
            files = {"file": (test_img_path, f, "image/jpeg")}
            data = {"user_id": user_id, "override_type": "Invoice"}
            res = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        
        assert res.status_code == 200
        upload_data = res.json()
        assert upload_data["success"] is True
        assert "document" in upload_data
        doc = upload_data["document"]
        print(f"   Anchored Document ID: {doc['id']}")
        print(f"   Content Hash: {doc['content_hash']}")
        print("[PASS] UPLOAD & ANCHORING endpoint passed!")
        return doc["id"], doc["content_hash"]
    except Exception as e:
        print(f"[FAIL] UPLOAD endpoint failed: {e}")
        return None, None

def test_verify_doc(doc_id, content_hash):
    print("\n[...] Testing PUBLIC DOCUMENT VERIFICATION endpoint...")
    try:
        # Test by ID
        res = requests.get(f"{BACKEND_URL}/api/verify?query={doc_id}")
        assert res.status_code == 200
        verify_data = res.json()
        assert verify_data["success"] is True
        assert verify_data["document"]["id"] == doc_id
        print("   Direct ID lookup verified!")
        
        # Test by doc type search fallback
        res_hash = requests.get(f"{BACKEND_URL}/api/verify?query=Invoice")
        assert res_hash.status_code == 200
        verify_hash_data = res_hash.json()
        assert verify_hash_data["success"] is True
        print("   Doc type fuzzy fallback search verified!")
        
        print("[PASS] PUBLIC VERIFICATION endpoint passed!")
        return True
    except Exception as e:
        print(f"[FAIL] PUBLIC VERIFICATION failed: {e}")
        return False

def test_image_forensics():
    print("\n[...] Testing FORGERY & IMAGE ELA SCAN endpoint...")
    test_img_path = "test_invoice.jpg"
    try:
        with open(test_img_path, "rb") as f:
            files = {"file": (test_img_path, f, "image/jpeg")}
            res = requests.post(f"{BACKEND_URL}/api/verify/image", files=files)
            
        assert res.status_code == 200
        forensic_data = res.json()
        assert forensic_data["success"] is True
        assert "forgery_result" in forensic_data
        assert "heatmap_image" in forensic_data
        print(f"   Risk level identified: {forensic_data['forgery_result']['risk_level']}")
        print(f"   Risk score: {forensic_data['forgery_result']['risk_score']}/100")
        print("[PASS] IMAGE FORENSIC SCAN endpoint passed!")
        return True
    except Exception as e:
        print(f"[FAIL] IMAGE FORENSIC SCAN failed: {e}")
        return False

def test_analytics(user_id):
    print("\n[...] Testing USER DASHBOARD ANALYTICS endpoint...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/analytics?user_id={user_id}")
        assert res.status_code == 200
        analytics_data = res.json()
        assert analytics_data["success"] is True
        assert "total_documents" in analytics_data
        print(f"   Total anchored documents: {analytics_data['total_documents']}")
        print(f"   Doc categories: {analytics_data['categories']}")
        print("[PASS] USER DASHBOARD ANALYTICS endpoint passed!")
        return True
    except Exception as e:
        print(f"[FAIL] USER DASHBOARD ANALYTICS failed: {e}")
        return False

if __name__ == "__main__":
    print("====================================================")
    print("    PramanaChain FASTAPI INTEGRATION TEST SUITE        ")
    print("====================================================")
    
    success = True
    success &= test_root()
    
    user_id = test_auth()
    if user_id:
        doc_id, content_hash = test_upload(user_id)
        if doc_id:
            success &= test_verify_doc(doc_id, content_hash)
            success &= test_analytics(user_id)
        else:
            success = False
    else:
        success = False
        
    success &= test_image_forensics()
    
    print("\n====================================================")
    if success:
        print("[SUCCESS] INTEGRATION TEST SUITE STATUS: ALL ENDPOINTS PASSED!")
        sys.exit(0)
    else:
        print("[FAIL] INTEGRATION TEST SUITE STATUS: FAILURES DETECTED")
        sys.exit(1)
