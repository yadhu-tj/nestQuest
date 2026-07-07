from flask import Blueprint, request, jsonify

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/', methods=['POST'])
def book_visit():
    # Logic to book a property visit
    return jsonify({'message': 'Visit booked successfully'})

