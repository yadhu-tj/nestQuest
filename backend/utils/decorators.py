from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from .responses import error_response

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                return error_response("Unauthorized access: insufficient privileges", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
