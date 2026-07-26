from flask import Blueprint, request
from utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt

property_bp = Blueprint('property', __name__)

@property_bp.route('/', methods=['GET'])
def get_properties():
    # Public route to get all properties
    return success_response(data=[], message="List of properties (stub)")

@property_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    # Public route to get a single property details
    return success_response(data={}, message=f"Property details for id {property_id} (stub)")

@property_bp.route('/', methods=['POST'])
@jwt_required()
def create_property():
    # Broker-only route
    return success_response(data={}, message="Property created successfully (stub)")

@property_bp.route('/<int:property_id>', methods=['PUT'])
@jwt_required()
def update_property(property_id):
    # Broker-only route
    return success_response(data={}, message=f"Property {property_id} updated successfully (stub)")

@property_bp.route('/<int:property_id>', methods=['DELETE'])
@jwt_required()
def delete_property(property_id):
    # Broker-only route
    return success_response(message=f"Property {property_id} deleted successfully (stub)")

@property_bp.route('/<int:property_id>/images', methods=['POST'])
@jwt_required()
def upload_property_images(property_id):
    # Broker-only route
    return success_response(message=f"Images uploaded successfully for property {property_id} (stub)")

@property_bp.route('/<int:property_id>/availability', methods=['PATCH'])
@jwt_required()
def toggle_availability(property_id):
    # Broker-only route
    return success_response(message=f"Availability status toggled for property {property_id} (stub)")
