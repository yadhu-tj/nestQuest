from flask import Blueprint
from utils.responses import success_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/brokers', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_brokers():
    return success_response(data=[], message="List of brokers (stub)")

@admin_bp.route('/brokers/<int:broker_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_broker(broker_id):
    return success_response(message=f"Broker {broker_id} removed (stub)")

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    return success_response(data=[], message="List of users (stub)")

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    return success_response(message=f"User {user_id} removed (stub)")

@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_properties():
    return success_response(data=[], message="List of all properties (stub)")

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_reports():
    stats = {
        'properties': 0,
        'bookings': 0,
        'users': 0,
        'brokers': 0
    }
    return success_response(data=stats, message="Admin reports fetched (stub)")
