from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from models import db, User, Broker, Administrator
from utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)

# Validation Schemas
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

class RegisterSchema(Schema):
    name = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True)
    phone = fields.String(required=True)
    role = fields.String(validate=lambda r: r in ['user', 'broker'], load_default='user')

@auth_bp.route('/register', methods=['POST'])
def register():
    schema = RegisterSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
        
    # Registration logic placeholder (will implement full registration in Phase 2)
    return success_response(message="Registration successful (stub)")

@auth_bp.route('/login', methods=['POST'])
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
        
    # Login logic placeholder (will implement full check in Phase 2)
    # Dummy successful authentication for boilerplate
    access_token = create_access_token(identity=data['email'], additional_claims={'role': 'user'})
    return success_response(data={'access_token': access_token}, message="Login successful (stub)")

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_email = get_jwt_identity()
    # Profile placeholder
    return success_response(data={'email': current_user_email, 'role': 'user'}, message="Profile fetched successfully (stub)")
