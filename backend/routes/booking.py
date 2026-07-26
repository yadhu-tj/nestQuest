from flask import Blueprint, request
from utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    # User-only route
    return success_response(message="Booking created successfully (stub)")

@booking_bp.route('/', methods=['GET'])
@jwt_required()
def get_bookings():
    # Role-aware: User sees own, Broker sees bookings for own properties
    return success_response(data=[], message="List of bookings (stub)")

@booking_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    # Role-aware get booking details
    return success_response(data={}, message=f"Booking details for id {booking_id} (stub)")

@booking_bp.route('/<int:booking_id>/status', methods=['PATCH'])
@jwt_required()
def update_booking_status(booking_id):
    # Broker-only route
    return success_response(message=f"Booking status updated for id {booking_id} (stub)")
