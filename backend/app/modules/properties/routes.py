from flask import Blueprint, request, jsonify

properties_bp = Blueprint('properties', __name__)

@properties_bp.route('/', methods=['GET'])
def get_properties():
    # Get all properties (possibly filtered by vacancy)
    return jsonify({'message': 'List of properties'})

@properties_bp.route('/', methods=['POST'])
def add_property():
    # Add new property (Broker only)
    return jsonify({'message': 'Property added successfully'})

