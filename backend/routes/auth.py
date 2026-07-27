from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, ValidationError, validate
from models import db, User, Broker, Administrator
from utils.responses import success_response, error_response
from app import bcrypt

auth_bp = Blueprint('auth', __name__)

# Validation Schemas
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6))
    phone = fields.String(required=True, validate=validate.Length(min=7, max=15))
    role = fields.String(validate=validate.OneOf(['user', 'broker']), load_default='user')
    company_name = fields.String(validate=validate.Length(max=100), required=False, allow_none=True)

@auth_bp.route('/register', methods=['POST'])
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
def login():
    """
    POST /api/v1/auth/login
    Authenticate Administrator, Broker, or User by email.
    Server detects role automatically by querying tables in order: Administrator -> Broker -> User.
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
    
    return success_response(
        data={
            "access_token": access_token,
            "user": {
                "id": user_id,
                "name": user_name,
                "email": email,
                "role": role
            }
        },
        message="Login successful"
    )

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """
    GET /api/v1/auth/me
    Return authenticated user profile based on JWT token claims.
    """
    claims = get_jwt()
    role = claims.get("role")
    email = claims.get("email") or get_jwt_identity()

    if role == 'admin':
        admin = Administrator.query.filter_by(email=email).first()
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
        broker = Broker.query.filter_by(email=email).first()
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
        usr = User.query.filter_by(email=email).first()
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
