from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from ...database import db
from ...models import User

auth_bp = Blueprint('auth', __name__)

# Validation Schemas
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

class RegisterSchema(Schema):
    name = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True)
    role = fields.String(validate=lambda r: r in ['tenant', 'broker'], missing='tenant')

@auth_bp.route('/register', methods=['POST'])
def register():
    schema = RegisterSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
        
    # Registration logic (placeholder for db operations)
    return jsonify({'message': 'User registered successfully'})

@auth_bp.route('/login', methods=['POST'])
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
        
    # Dummy successful authentication for boilerplate
    access_token = create_access_token(identity=data['email'], additional_claims={'role': 'tenant'})
    return jsonify({
        'message': 'Login successful', 
        'access_token': access_token
    })
    
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({'message': f'Hello {current_user}, you accessed a protected route!'})
