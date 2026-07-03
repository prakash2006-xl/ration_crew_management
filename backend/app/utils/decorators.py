from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user = get_jwt_identity()
            if current_user.get('role') not in roles:
                return jsonify(msg="Missing permissions"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
