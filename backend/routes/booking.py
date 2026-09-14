from flask import Blueprint, request
from utils.responses import success_response, error_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Booking, Property, User, Broker
from datetime import datetime, date

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('user')
def create_booking():
    # User-only route: book a visit, validate property availability
    from marshmallow import Schema, fields, ValidationError, validate
    
    class BookingCreateSchema(Schema):
        property_id = fields.Integer(required=True)
        visit_date = fields.Date(required=True)
    
    schema = BookingCreateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    # Get user_id from JWT claims
    claims = get_jwt()
    user_id = claims.get("id")
    
    if not user_id:
        return error_response(message="Invalid token: missing user ID", status_code=401)
    
    prop = Property.query.get_or_404(data['property_id'])
    
    # Validate property is available
    if prop.availability_status != 'Available':
        return error_response(message="Property is not available for booking", status_code=400)
    
    # Validate visit_date is not in the past
    visit_date = data['visit_date']
    if isinstance(visit_date, str):
        try:
            visit_date = datetime.strptime(visit_date, '%Y-%m-%d').date()
        except ValueError:
            return error_response(message="Invalid visit_date format. Use YYYY-MM-DD", status_code=400)
    
    if visit_date < date.today():
        return error_response(message="Visit date cannot be in the past", status_code=400)
    
    try:
        new_booking = Booking(
            user_id=user_id,
            property_id=data['property_id'],
            visit_date=visit_date,
            status='Pending'
        )
        db.session.add(new_booking)
        db.session.commit()
        
        return success_response(
            data={
                "booking_id": new_booking.booking_id,
                "user_id": new_booking.user_id,
                "property_id": new_booking.property_id,
                "booking_date": new_booking.booking_date.isoformat() if new_booking.booking_date else None,
                "visit_date": new_booking.visit_date.isoformat() if new_booking.visit_date else None,
                "status": new_booking.status
            },
            message="Booking created successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to create booking: {str(e)}", status_code=500)

@booking_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_bookings():
    # Role-aware: User sees own, Broker sees bookings for own properties, Admin sees all
    
    claims = get_jwt()
    user_id = claims.get("id")
    role = claims.get("role")
    
    if not user_id or not role:
        return error_response(message="Invalid token claims", status_code=401)
    
    query = Booking.query
    
    if role == 'user':
        # User sees only their own bookings
        query = query.filter_by(user_id=user_id)
    elif role == 'broker':
        # Broker sees bookings for their own properties
        broker_property_ids = db.session.query(Property.property_id).filter_by(broker_id=user_id).subquery()
        query = query.filter(Booking.property_id.in_(broker_property_ids))
    elif role == 'admin':
        # Admin sees all bookings - no additional filter
        pass
    else:
        return error_response(message="Unauthorized: invalid role for this endpoint", status_code=403)
    
    query = query.order_by(Booking.booking_date.desc())
    bookings = query.all()
    
    result = []
    for booking in bookings:
        prop = Property.query.get(booking.property_id)
        user = User.query.get(booking.user_id) if role in ('broker', 'admin') else None
        
        result.append({
            "booking_id": booking.booking_id,
            "user_id": booking.user_id,
            "user_name": user.user_name if user else None,
            "property_id": booking.property_id,
            "property_title": prop.title if prop else None,
            "property_location": prop.location if prop else None,
            "booking_date": booking.booking_date.isoformat() if booking.booking_date else None,
            "visit_date": booking.visit_date.isoformat() if booking.visit_date else None,
            "status": booking.status
        })
    
    return success_response(data=result, message="Bookings retrieved successfully")

@booking_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    # Role-aware get booking details: User sees own, Broker sees for own properties, Admin sees all
    
    claims = get_jwt()
    user_id = claims.get("id")
    role = claims.get("role")
    
    if not user_id or not role:
        return error_response(message="Invalid token claims", status_code=401)
    
    booking = Booking.query.get_or_404(booking_id)
    
    # Check access based on role
    if role == 'user':
        if booking.user_id != user_id:
            return error_response(message="Unauthorized: you can only view your own bookings", status_code=403)
    elif role == 'broker':
        prop = Property.query.get(booking.property_id)
        if not prop or prop.broker_id != user_id:
            return error_response(message="Unauthorized: you can only view bookings for your own properties", status_code=403)
    elif role == 'admin':
        # Admin can view all - no additional check
        pass
    else:
        return error_response(message="Unauthorized: invalid role", status_code=403)
    
    prop = Property.query.get(booking.property_id)
    user = User.query.get(booking.user_id)
    broker = Broker.query.get(prop.broker_id) if prop else None
    
    result = {
        "booking_id": booking.booking_id,
        "user_id": booking.user_id,
        "user_name": user.user_name if user else None,
        "user_email": user.email if user else None,
        "user_phone": user.phone if user else None,
        "property_id": booking.property_id,
        "property_title": prop.title if prop else None,
        "property_location": prop.location if prop else None,
        "property_price": float(prop.price) if prop else None,
        "broker_id": broker.broker_id if broker else None,
        "broker_name": broker.broker_name if broker else None,
        "broker_company": broker.company_name if broker else None,
        "broker_phone": broker.phone if broker else None,
        "booking_date": booking.booking_date.isoformat() if booking.booking_date else None,
        "visit_date": booking.visit_date.isoformat() if booking.visit_date else None,
        "status": booking.status
    }
    
    return success_response(data=result, message="Booking details retrieved successfully")

@booking_bp.route('/<int:booking_id>/status', methods=['PATCH'])
@jwt_required()
def update_booking_status(booking_id):
    # Role-aware route: Broker manages bookings for own properties, User can cancel own pending/confirmed booking, Admin can update any
    from marshmallow import Schema, fields, ValidationError, validate
    
    class BookingStatusSchema(Schema):
        status = fields.String(required=True, validate=validate.OneOf(['Confirmed', 'Cancelled', 'Completed']))
    
    schema = BookingStatusSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    claims = get_jwt()
    user_id = claims.get("id")
    role = claims.get("role")
    
    if not user_id or not role:
        return error_response(message="Invalid token claims", status_code=401)
    
    booking = Booking.query.get_or_404(booking_id)
    prop = Property.query.get(booking.property_id)

    if role == 'user':
        if booking.user_id != user_id:
            return error_response(message="Unauthorized: you can only update your own bookings", status_code=403)
        if data['status'] != 'Cancelled':
            return error_response(message="Unauthorized: users can only cancel bookings", status_code=403)
    elif role == 'broker':
        if not prop or prop.broker_id != user_id:
            return error_response(message="Unauthorized: you can only manage bookings for your own properties", status_code=403)
    elif role == 'admin':
        pass
    else:
        return error_response(message="Unauthorized: invalid role", status_code=403)
    
    # Valid status transitions
    valid_transitions = {
        'Pending': ['Confirmed', 'Cancelled'],
        'Confirmed': ['Completed', 'Cancelled'],
        'Completed': [],  # Terminal state
        'Cancelled': []   # Terminal state
    }
    
    current_status = booking.status
    new_status = data['status']
    
    if new_status not in valid_transitions.get(current_status, []):
        return error_response(
            message=f"Invalid status transition: {current_status} → {new_status}. "
                    f"Valid transitions: {', '.join(valid_transitions.get(current_status, [])) or 'None'}",
            status_code=400
        )
    
    try:
        booking.status = new_status
        db.session.commit()
        
        return success_response(
            data={
                "booking_id": booking.booking_id,
                "status": booking.status
            },
            message=f"Booking status updated to {new_status}"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update booking status: {str(e)}", status_code=500)