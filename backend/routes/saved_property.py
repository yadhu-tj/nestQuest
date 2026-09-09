from flask import Blueprint, request
from utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt
from models import db, SavedProperty, Property, PropertyImage, Broker

saved_property_bp = Blueprint('saved_property', __name__)

@saved_property_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def save_property():
    """
    POST /api/v1/saved-properties/
    Save a property for the authenticated user.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response(message="Invalid JSON payload", status_code=400)
    
    property_id = data.get('property_id')
    if not property_id or not isinstance(property_id, int):
        return error_response(message="property_id is required and must be an integer", status_code=400)
    
    # Get user_id from JWT claims
    claims = get_jwt()
    user_id = claims.get("id")
    
    if not user_id:
        return error_response(message="Invalid token: missing user ID", status_code=401)
    
    # Verify property exists and is available
    prop = Property.query.get_or_404(property_id)
    
    try:
        # Check if already saved
        existing = SavedProperty.query.filter_by(user_id=user_id, property_id=property_id).first()
        if existing:
            return error_response(message="Property already saved", status_code=409)
        
        saved_property = SavedProperty(
            user_id=user_id,
            property_id=property_id
        )
        db.session.add(saved_property)
        db.session.commit()
        
        return success_response(
            data={"saved_id": saved_property.saved_id},
            message="Property saved successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to save property: {str(e)}", status_code=500)


@saved_property_bp.route('/<int:property_id>', methods=['DELETE'])
@jwt_required()
def unsave_property(property_id):
    """
    DELETE /api/v1/saved-properties/<property_id>
    Remove a property from user's saved properties.
    """
    claims = get_jwt()
    user_id = claims.get("id")
    
    if not user_id:
        return error_response(message="Invalid token: missing user ID", status_code=401)
    
    try:
        saved_property = SavedProperty.query.filter_by(user_id=user_id, property_id=property_id).first()
        if not saved_property:
            return error_response(message="Property not found in saved properties", status_code=404)
        
        db.session.delete(saved_property)
        db.session.commit()
        
        return success_response(message="Property removed from saved properties")
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to remove saved property: {str(e)}", status_code=500)


@saved_property_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_saved_properties():
    """
    GET /api/v1/saved-properties/
    Get all saved properties for the authenticated user.
    """
    claims = get_jwt()
    user_id = claims.get("id")
    
    if not user_id:
        return error_response(message="Invalid token: missing user ID", status_code=401)
    
    try:
        saved_properties = SavedProperty.query.filter_by(user_id=user_id).order_by(SavedProperty.saved_at.desc()).all()
        
        result = []
        for saved in saved_properties:
            prop = saved.property
            if not prop:
                continue
            
            images = PropertyImage.query.filter_by(property_id=prop.property_id).all()
            image_urls = [img.image_url for img in images]
            
            broker = prop.broker
            broker_name = broker.broker_name if broker else None
            broker_company = broker.company_name if broker else None
            
            result.append({
                "saved_id": saved.saved_id,
                "saved_at": saved.saved_at.isoformat() if saved.saved_at else None,
                "property": {
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
                }
            })
        
        return success_response(data=result, message="Saved properties retrieved successfully")
    except Exception as e:
        return error_response(message=f"Failed to retrieve saved properties: {str(e)}", status_code=500)


@saved_property_bp.route('/check/<int:property_id>', methods=['GET'])
@jwt_required()
def check_saved_status(property_id):
    """
    GET /api/v1/saved-properties/check/<property_id>
    Check if a property is saved by the current user.
    """
    claims = get_jwt()
    user_id = claims.get("id")
    
    if not user_id:
        return error_response(message="Invalid token: missing user ID", status_code=401)
    
    try:
        saved = SavedProperty.query.filter_by(user_id=user_id, property_id=property_id).first()
        return success_response(data={"is_saved": saved is not None, "saved_id": saved.saved_id if saved else None})
    except Exception as e:
        return error_response(message=f"Failed to check saved status: {str(e)}", status_code=500)