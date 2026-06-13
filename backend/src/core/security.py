from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
import os

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key_header: str = Security(API_KEY_HEADER)):
    """
    Validates the X-API-Key header.
    In a strict production environment, auto_error would be True.
    Currently set to False to prevent breaking the Next.js frontend until
    it is updated to pass the key.
    """
    expected_api_key = os.environ.get("PRAMANACHAIN_API_KEY", "dev-secret-key-123")
    
    # If the key is provided but incorrect, reject it.
    if api_key_header and api_key_header != expected_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key provided."
        )
    
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key required. Pass X-API-Key header."
        )
        
    return api_key_header
