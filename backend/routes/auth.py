from flask import Blueprint, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, ValidationError, validate
from sqlalchemy.exc import IntegrityError
from models import db, User, Broker, Administrator
from utils.responses import success_response, error_response
from app import bcrypt, limiter
import re

auth_bp = Blueprint('auth', __name__)

# Password complexity validator
def validate_password_complexity(password):
    """Validate password meets complexity requirements."""
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
    return password

# Validation Schemas
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate_password_complexity)
    phone = fields.String(required=True, validate=validate.Length(min=7, max=15))
    role = fields.String(validate=validate.OneOf(['user', 'broker']), load_default='user')
    company_name = fields.String(validate=validate.Length(max=100), required=False, allow_none=True)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """
    POST /api/v1/auth/register
    Register a new User or Broker.
    Admin registration via API is strictly prohibited.
    """
    schema = RegisterSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
        
    email = data['email'].strip().lower()
    role = data.get('role', 'user')
    
    # Check if email is already registered in any user table
    if Administrator.query.filter_by(email=email).first() or \
       Broker.query.filter_by(email=email).first() or \
       User.query.filter_by(email=email).first():
        return error_response(message="Email is already registered", status_code=400)
        
    # Hash password with bcrypt
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    try:
        if role == 'user':
            new_user = User(
                user_name=data['name'],
                email=email,
                phone=data['phone'],
                password=hashed_password
            )
            db.session.add(new_user)
            db.session.commit()
            assigned_id = new_user.user_id
        elif role == 'broker':
            new_broker = Broker(
                broker_name=data['name'],
                email=email,
                phone=data['phone'],
                password=hashed_password,
                company_name=data.get('company_name')
            )
            db.session.add(new_broker)
            db.session.commit()
            assigned_id = new_broker.broker_id
        else:
            return error_response(message="Invalid role specified", status_code=400)
    except IntegrityError:
        db.session.rollback()
        return error_response(message="Email is already registered", status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(message="Registration failed due to a server error", status_code=500)
        
    return success_response(
        data={
            "id": assigned_id,
            "name": data['name'],
            "email": email,
            "role": role
        },
        message=f"Registration successful as {role}",
        status_code=201
    )

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    POST /api/v1/auth/login
    Authenticate Administrator, Broker, or User by email.
    Server detects role automatically by querying tables in order: Administrator -> Broker -> User.
    Returns both access token (short-lived) and refresh token (long-lived).
    """
    schema = LoginSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
        
    email = data['email'].strip().lower()
    password = data['password']
    
    user_account = None
    role = None
    user_id = None
    user_name = None
    hashed_password = None
    
    # Priority 1: Query Administrator
    admin = Administrator.query.filter_by(email=email).first()
    if admin:
        user_account = admin
        role = 'admin'
        user_id = admin.admin_id
        user_name = admin.admin_name
        hashed_password = admin.password
    else:
        # Priority 2: Query Broker
        broker = Broker.query.filter_by(email=email).first()
        if broker:
            user_account = broker
            role = 'broker'
            user_id = broker.broker_id
            user_name = broker.broker_name
            hashed_password = broker.password
        else:
            # Priority 3: Query User
            usr = User.query.filter_by(email=email).first()
            if usr:
                user_account = usr
                role = 'user'
                user_id = usr.user_id
                user_name = usr.user_name
                hashed_password = usr.password
                
    if not user_account or not bcrypt.check_password_hash(hashed_password, password):
        return error_response(message="Invalid email or password", status_code=401)
        
    additional_claims = {
        "role": role,
        "id": user_id,
        "email": email,
        "name": user_name
    }
    
    access_token = create_access_token(identity=email, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=email, additional_claims=additional_claims)
    
    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user_id,
                "name": user_name,
                "email": email,
                "role": role
            }
        },
        message="Login successful"
    )

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
@limiter.limit("30 per minute")
def refresh():
    """
    POST /api/v1/auth/refresh
    Generate a new access token using a valid refresh token.
    """
    current_user = get_jwt_identity()
    claims = get_jwt()
    
    additional_claims = {
        "role": claims.get("role"),
        "id": claims.get("id"),
        "email": claims.get("email"),
        "name": claims.get("name")
    }
    
    new_access_token = create_access_token(identity=current_user, additional_claims=additional_claims)
    
    return success_response(
        data={"access_token": new_access_token},
        message="Token refreshed successfully"
    )

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """
    GET /api/v1/auth/me
    Return authenticated user profile based on JWT token claims (resolves by immutable account ID).
    """
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("id")

    if not user_id or not role:
        return error_response(message="Invalid or malformed token claims", status_code=401)

    if role == 'admin':
        admin = db.session.get(Administrator, user_id)
        if not admin:
            return error_response(message="Admin profile not found", status_code=404)
        return success_response(data={
            "id": admin.admin_id,
            "name": admin.admin_name,
            "email": admin.email,
            "role": "admin",
            "created_at": admin.created_at.isoformat() if admin.created_at else None
        }, message="Profile fetched successfully")

    elif role == 'broker':
        broker = db.session.get(Broker, user_id)
        if not broker:
            return error_response(message="Broker profile not found", status_code=404)
        return success_response(data={
            "id": broker.broker_id,
            "name": broker.broker_name,
            "email": broker.email,
            "phone": broker.phone,
            "company_name": broker.company_name,
            "role": "broker",
            "created_at": broker.created_at.isoformat() if broker.created_at else None
        }, message="Profile fetched successfully")

    elif role == 'user':
        usr = db.session.get(User, user_id)
        if not usr:
            return error_response(message="User profile not found", status_code=404)
        return success_response(data={
            "id": usr.user_id,
            "name": usr.user_name,
            "email": usr.email,
            "phone": usr.phone,
            "role": "user",
            "created_at": usr.created_at.isoformat() if usr.created_at else None
        }, message="Profile fetched successfully")

    else:
        return error_response(message="Invalid token role", status_code=400)

# Validation Schemas for Profile Update
class UserProfileUpdateSchema(Schema):
    name = fields.String(required=False, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=False)
    phone = fields.String(required=False, validate=validate.Length(min=7, max=15))

class BrokerProfileUpdateSchema(Schema):
    broker_name = fields.String(required=False, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=False)
    phone = fields.String(required=False, validate=validate.Length(min=7, max=15))
    company_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))

# Forgot Password / Reset Password Schemas
class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)

class ResetPasswordSchema(Schema):
    token = fields.String(required=True)
    password = fields.String(required=True, validate=validate_password_complexity)

# Profile Update Endpoints
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    PUT /api/v1/auth/profile
    Update authenticated user's profile (User or Broker).
    """
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("id")
    
    if not user_id or not role:
        return error_response(message="Invalid or malformed token claims", status_code=401)
    
    if role not in ('user', 'broker'):
        return error_response(message="Only users and brokers can update their profile", status_code=403)
    
    schema = UserProfileUpdateSchema() if role == 'user' else BrokerProfileUpdateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    if not data:
        return error_response(message="No data provided for update", status_code=400)
    
    try:
        if role == 'user':
            user = db.session.get(User, user_id)
            if not user:
                return error_response(message="User not found", status_code=404)
            
            # Check email uniqueness if email is being changed
            if 'email' in data and data['email'] != user.email:
                existing = User.query.filter_by(email=data['email'].lower()).first()
                if existing:
                    return error_response(message="Email is already registered", status_code=400)
                user.email = data['email'].lower()
            
            if 'name' in data:
                user.user_name = data['name'].strip()
            if 'phone' in data:
                user.phone = data['phone'].strip()
                
        else:  # broker
            broker = db.session.get(Broker, user_id)
            if not broker:
                return error_response(message="Broker not found", status_code=404)
            
            if 'email' in data and data['email'] != broker.email:
                existing = Broker.query.filter_by(email=data['email'].lower()).first()
                if existing:
                    return error_response(message="Email is already registered", status_code=400)
                broker.email = data['email'].lower()
            
            if 'broker_name' in data:
                broker.broker_name = data['broker_name'].strip()
            if 'phone' in data:
                broker.phone = data['phone'].strip()
            if 'company_name' in data:
                broker.company_name = data['company_name'].strip() if data['company_name'] else None
        
        db.session.commit()
        
        return success_response(
            data={
                "id": user_id,
                "name": user.user_name if role == 'user' else broker.broker_name,
                "email": user.email if role == 'user' else broker.email,
                "phone": user.phone if role == 'user' else broker.phone,
                "company_name": broker.company_name if role == 'broker' else None,
                "role": role
            },
            message="Profile updated successfully"
        )
    except IntegrityError:
        db.session.rollback()
        return error_response(message="Email is already registered", status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update profile: {str(e)}", status_code=500)


# Forgot Password / Reset Password Endpoints
@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    """
    POST /api/v1/auth/forgot-password
    Request a password reset token for the given email.
    """
    schema = ForgotPasswordSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    email = data['email'].strip().lower()
    
    # Check if email exists in any user table (don't reveal which one for security)
    user = User.query.filter_by(email=email).first()
    broker = Broker.query.filter_by(email=email).first()
    admin = Administrator.query.filter_by(email=email).first()
    
    if not user and not broker and not admin:
        # For security, always return success even if email not found
        return success_response(
            data=None,
            message="If the email exists, a password reset link has been sent."
        )
    
    # Generate a secure reset token (valid for 1 hour)
    import secrets
    from datetime import datetime, timedelta
    
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # For development/demo, we'll return the token directly
    # In production, this would be sent via email
    
    return success_response(
        data={
            "reset_token": reset_token,
            "expires_at": expires_at.isoformat(),
            "email": email
        },
        message="Password reset token generated. In production, this would be sent via email."
    )


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password():
    """
    POST /api/v1/auth/reset-password
    Reset password using a valid reset token.
    """
    schema = ResetPasswordSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    token = data['token']
    new_password = data['password']
    
    # In a real implementation, you would validate the token from your token store
    # For this implementation, we'll check against a simple in-memory store
    # In production, validate against your token storage (DB, Redis, etc.)
    
    # For demo purposes, we'll require the token to be passed but we can't validate it
    # without a proper token store. In a real app, you'd have a PasswordResetToken model.
    
    # Hash the new password
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    # In a real implementation, you would:
    # 1. Validate the token
    # 2. Find the user by the token's associated email
    # 3. Update their password
    # 4. Invalidate the token
    
    # For now, we'll return success but note that actual password update requires token validation
    return success_response(
        message="Password reset successful. In a full implementation, the password would be updated after token validation.",
        data={"note": "Token validation and password update logic needs a proper token store"}
    )
