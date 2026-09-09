from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError
from utils.responses import success_response, error_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required
from models import db, Property, Booking, User, Broker, PropertyImage
from services.embedding_service import EmbeddingService

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

@admin_bp.route('/properties/<int:property_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_property(property_id):
    # Admin only: remove any property (cascades to images and bookings)
    prop = Property.query.get_or_404(property_id)
    
    try:
        # Cancel all pending bookings for this property before deletion
        pending_bookings = Booking.query.filter_by(property_id=property_id, status='Pending').all()
        for booking in pending_bookings:
            booking.status = 'Cancelled'
        
        db.session.commit()
        
        # Delete property (cascades to property_images and bookings via DB constraints)
        db.session.delete(prop)
        db.session.commit()
        
        # Remove from ChromaDB after successful deletion
        EmbeddingService.delete_property_embedding(property_id)
        
        return success_response(message="Property deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to delete property: {str(e)}", status_code=500)

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


# Admin Update Endpoints
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_user(user_id):
    """
    PUT /api/v1/admin/users/<user_id>
    Admin only: update a user's profile.
    """
    from marshmallow import Schema, fields, ValidationError, validate
    
    class AdminUserUpdateSchema(Schema):
        name = fields.String(required=False, validate=validate.Length(min=2, max=100))
        email = fields.Email(required=False)
        phone = fields.String(required=False, validate=validate.Length(min=7, max=15))
    
    schema = AdminUserUpdateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    if not data:
        return error_response(message="No data provided for update", status_code=400)
    
    user = User.query.get_or_404(user_id)
    
    try:
        if 'email' in data and data['email'] != user.email:
            existing = User.query.filter_by(email=data['email'].lower()).first()
            if existing:
                return error_response(message="Email is already registered", status_code=400)
            user.email = data['email'].lower()
        
        if 'name' in data:
            user.user_name = data['name'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip()
        
        db.session.commit()
        
        return success_response(
            data={
                "id": user.user_id,
                "name": user.user_name,
                "email": user.email,
                "phone": user.phone,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            message="User updated successfully"
        )
    except IntegrityError:
        db.session.rollback()
        return error_response(message="Email is already registered", status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update user: {str(e)}", status_code=500)


@admin_bp.route('/brokers/<int:broker_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_broker(broker_id):
    """
    PUT /api/v1/admin/brokers/<broker_id>
    Admin only: update a broker's profile.
    """
    from marshmallow import Schema, fields, ValidationError, validate
    
    class AdminBrokerUpdateSchema(Schema):
        broker_name = fields.String(required=False, validate=validate.Length(min=2, max=100))
        email = fields.Email(required=False)
        phone = fields.String(required=False, validate=validate.Length(min=7, max=15))
        company_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    
    schema = AdminBrokerUpdateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    if not data:
        return error_response(message="No data provided for update", status_code=400)
    
    broker = Broker.query.get_or_404(broker_id)
    
    try:
        if 'email' in data and data['email'] != broker.email:
            existing = Broker.query.filter_by(email=data['email'].lower()).first()
            if existing:
                return error_response(message="Email is already registered", status_code=400)
            broker.email = data['email'].lower()
        
        if 'broker_name' in data:
            broker.broker_name = data['broker_name'].strip()
        if 'phone' in data:
            broker.phone = data['phone'].strip()
        if 'company_name' in data:
            broker.company_name = data['company_name'].strip() if data['company_name'] else None
        
        db.session.commit()
        
        return success_response(
            data={
                "id": broker.broker_id,
                "name": broker.broker_name,
                "email": broker.email,
                "phone": broker.phone,
                "company_name": broker.company_name,
                "created_at": broker.created_at.isoformat() if broker.created_at else None
            },
            message="Broker updated successfully"
        )
    except IntegrityError:
        db.session.rollback()
        return error_response(message="Email is already registered", status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update broker: {str(e)}", status_code=500)