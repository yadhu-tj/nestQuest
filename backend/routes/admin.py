from flask import Blueprint
from utils.responses import success_response, error_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required
from models import db, Property, Booking, User, Broker, PropertyImage

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/brokers', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_brokers():
    # Admin only: list all brokers
    brokers = Broker.query.order_by(Broker.created_at.desc()).all()
    
    result = []
    for broker in brokers:
        # Count properties for each broker
        property_count = Property.query.filter_by(broker_id=broker.broker_id).count()
        
        result.append({
            "broker_id": broker.broker_id,
            "broker_name": broker.broker_name,
            "email": broker.email,
            "phone": broker.phone,
            "company_name": broker.company_name,
            "created_at": broker.created_at.isoformat() if broker.created_at else None,
            "property_count": property_count
        })
    
    return success_response(data=result, message="Brokers retrieved successfully")

@admin_bp.route('/brokers/<int:broker_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_broker(broker_id):
    # Admin only: remove broker (cascades to their properties and bookings)
    broker = Broker.query.get_or_404(broker_id)
    
    try:
        # Delete broker - cascades to properties (via DB foreign key ON DELETE CASCADE)
        # Property deletion cascades to property_images and bookings
        db.session.delete(broker)
        db.session.commit()
        
        return success_response(message="Broker and all associated properties/bookings removed successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to delete broker: {str(e)}", status_code=500)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    # Admin only: list all users
    users = User.query.order_by(User.created_at.desc()).all()
    
    result = []
    for user in users:
        # Count bookings for each user
        booking_count = Booking.query.filter_by(user_id=user.user_id).count()
        
        result.append({
            "user_id": user.user_id,
            "user_name": user.user_name,
            "email": user.email,
            "phone": user.phone,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "booking_count": booking_count
        })
    
    return success_response(data=result, message="Users retrieved successfully")

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    # Admin only: remove user (cascades to their bookings)
    user = User.query.get_or_404(user_id)
    
    try:
        # Delete user - cascades to bookings (via DB foreign key ON DELETE CASCADE)
        db.session.delete(user)
        db.session.commit()
        
        return success_response(message="User and all associated bookings removed successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to delete user: {str(e)}", status_code=500)

@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_properties():
    # Admin only: list all properties across all brokers
    properties = Property.query.order_by(Property.created_at.desc()).all()
    
    result = []
    for prop in properties:
        broker = Broker.query.get(prop.broker_id)
        images = PropertyImage.query.filter_by(property_id=prop.property_id).all()
        image_urls = [img.image_url for img in images]
        
        result.append({
            "property_id": prop.property_id,
            "broker_id": prop.broker_id,
            "broker_name": broker.broker_name if broker else None,
            "broker_company": broker.company_name if broker else None,
            "title": prop.title,
            "description": prop.description,
            "broker_notes": prop.broker_notes,
            "property_type": prop.property_type,
            "price": float(prop.price),
            "location": prop.location,
            "bedrooms": prop.bedrooms,
            "bathrooms": prop.bathrooms,
            "area_sqft": prop.area_sqft,
            "availability_status": prop.availability_status,
            "created_at": prop.created_at.isoformat() if prop.created_at else None,
            "images": image_urls
        })
    
    return success_response(data=result, message="All properties retrieved successfully")

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_reports():
    # Admin only: dashboard stats
    
    total_properties = Property.query.count()
    available_properties = Property.query.filter_by(availability_status='Available').count()
    total_bookings = Booking.query.count()
    pending_bookings = Booking.query.filter_by(status='Pending').count()
    total_users = User.query.count()
    total_brokers = Broker.query.count()
    
    stats = {
        'total_properties': total_properties,
        'available_properties': available_properties,
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'total_users': total_users,
        'total_brokers': total_brokers
    }
    
    return success_response(data=stats, message="Admin reports fetched successfully")