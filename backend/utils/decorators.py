from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from .responses import error_response

def role_required(*roles):
    """
    Decorator to restrict route access to users with specified roles.
    
    Usage:
        @role_required('admin')
        @role_required('broker', 'admin')
    
    - Missing/expired/invalid tokens: Intercepted by Flask-JWT-Extended callbacks in app.py (HTTP 401).
    - Insufficient role privileges: Intercepted by this decorator (HTTP 403 Forbidden).
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT token is valid and present in request
            verify_jwt_in_request()
            
            # Extract claims from the decoded JWT
            claims = get_jwt()
            if not claims:
                return error_response("Unauthorized access: missing token claims", 401)
                
            user_role = claims.get("role")
            if not user_role or user_role not in roles:
                return error_response("Unauthorized access: insufficient privileges", 403)
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator
