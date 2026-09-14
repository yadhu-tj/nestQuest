from flask import Blueprint, request, current_app
from utils.responses import success_response, error_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Property, PropertyImage, Broker, Booking

property_bp = Blueprint('property', __name__)

@property_bp.route('/', methods=['GET'], strict_slashes=False)
def get_properties():
    # Public route to get all properties with optional query filters
    query = Property.query
    
    # Filter by property_type
    property_type = request.args.get('property_type')
    if property_type:
        query = query.filter(Property.property_type.ilike(f'%{property_type}%'))
    
    # Filter by location
    location = request.args.get('location')
    if location:
        query = query.filter(Property.location.ilike(f'%{location}%'))
    
    # Filter by min_price
    min_price = request.args.get('min_price', type=float)
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    
    # Filter by max_price
    max_price = request.args.get('max_price', type=float)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
    
    # Filter by bedrooms
    bedrooms = request.args.get('bedrooms', type=int)
    if bedrooms is not None:
        query = query.filter(Property.bedrooms == bedrooms)
    
    # Filter by bathrooms
    bathrooms = request.args.get('bathrooms', type=int)
    if bathrooms is not None:
        query = query.filter(Property.bathrooms == bathrooms)
    
    # Filter by availability_status
    availability_status = request.args.get('availability_status')
    if availability_status:
        query = query.filter(Property.availability_status == availability_status)
    
    # Order by created_at desc (newest first)
    query = query.order_by(Property.created_at.desc())
    
    properties = query.all()
    
    # Build response with images and broker info
    result = []
    for prop in properties:
        images = PropertyImage.query.filter_by(property_id=prop.property_id).all()
        image_urls = [img.image_url for img in images]
        
        broker = Broker.query.get(prop.broker_id)
        broker_name = broker.broker_name if broker else None
        broker_company = broker.company_name if broker else None
        
        result.append({
            "property_id": prop.property_id,
            "broker_id": prop.broker_id,
            "broker_name": broker_name,
            "broker_company": broker_company,
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
    
    return success_response(data=result, message="Properties retrieved successfully")

@property_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    # Public route to get a single property details with all images
    prop = Property.query.get_or_404(property_id)
    
    images = PropertyImage.query.filter_by(property_id=prop.property_id).all()
    image_urls = [img.image_url for img in images]
    
    broker = Broker.query.get(prop.broker_id)
    broker_name = broker.broker_name if broker else None
    broker_company = broker.company_name if broker else None
    broker_phone = broker.phone if broker else None
    
    result = {
        "property_id": prop.property_id,
        "broker_id": prop.broker_id,
        "broker_name": broker_name,
        "broker_company": broker_company,
        "broker_phone": broker_phone,
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
    
    return success_response(data=result, message="Property retrieved successfully")

@property_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('broker')
def create_property():
    # Broker-only route: create property and sync to ChromaDB
    from marshmallow import Schema, fields, ValidationError, validate
    from services.embedding_service import EmbeddingService
    
    class PropertyCreateSchema(Schema):
        title = fields.String(required=True, validate=validate.Length(min=1, max=150))
        description = fields.String(required=False, allow_none=True)
        broker_notes = fields.String(required=False, allow_none=True)
        property_type = fields.String(required=True, validate=validate.Length(min=1, max=50))
        price = fields.Decimal(required=True, as_string=True)
        location = fields.String(required=True, validate=validate.Length(min=1, max=150))
        bedrooms = fields.Integer(required=False, allow_none=True)
        bathrooms = fields.Integer(required=False, allow_none=True)
        area_sqft = fields.Integer(required=False, allow_none=True)
    
    schema = PropertyCreateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    # Get broker_id from JWT claims
    claims = get_jwt()
    broker_id = claims.get("id")
    
    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)
    
    try:
        new_property = Property(
            broker_id=broker_id,
            title=data['title'],
            description=data.get('description'),
            broker_notes=data.get('broker_notes'),
            property_type=data['property_type'],
            price=data['price'],
            location=data['location'],
            bedrooms=data.get('bedrooms'),
            bathrooms=data.get('bathrooms'),
            area_sqft=data.get('area_sqft'),
            availability_status='Available'
        )
        db.session.add(new_property)
        db.session.commit()
        
        # Sync to ChromaDB after successful commit
        EmbeddingService.embed_property(
            property_id=new_property.property_id,
            title=new_property.title,
            description=new_property.description,
            broker_notes=new_property.broker_notes
        )
        
        return success_response(
            data={"property_id": new_property.property_id},
            message="Property created successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to create property: {str(e)}", status_code=500)

@property_bp.route('/<int:property_id>', methods=['PUT'])
@jwt_required()
@role_required('broker')
def update_property(property_id):
    # Broker-only route: update own property, re-embed if description or broker_notes changed
    from marshmallow import Schema, fields, ValidationError, validate
    from services.embedding_service import EmbeddingService
    
    class PropertyUpdateSchema(Schema):
        title = fields.String(required=False, validate=validate.Length(min=1, max=150))
        description = fields.String(required=False, allow_none=True)
        broker_notes = fields.String(required=False, allow_none=True)
        property_type = fields.String(required=False, validate=validate.Length(min=1, max=50))
        price = fields.Decimal(required=False, as_string=True)
        location = fields.String(required=False, validate=validate.Length(min=1, max=150))
        bedrooms = fields.Integer(required=False, allow_none=True)
        bathrooms = fields.Integer(required=False, allow_none=True)
        area_sqft = fields.Integer(required=False, allow_none=True)
        availability_status = fields.String(required=False, validate=validate.OneOf(['Available', 'Unavailable', 'Rented']))
    
    schema = PropertyUpdateSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    # Get broker_id from JWT claims
    claims = get_jwt()
    broker_id = claims.get("id")
    
    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)
    
    prop = Property.query.get_or_404(property_id)
    
    # Verify ownership
    if prop.broker_id != broker_id:
        return error_response(message="Unauthorized: you can only update your own properties", status_code=403)
    
    # Track if text fields changed for re-embedding
    description_changed = data.get('description') is not None and data['description'] != prop.description
    notes_changed = data.get('broker_notes') is not None and data['broker_notes'] != prop.broker_notes
    
    try:
        # Update fields if provided
        if 'title' in data:
            prop.title = data['title']
        if 'description' in data:
            prop.description = data['description']
        if 'broker_notes' in data:
            prop.broker_notes = data['broker_notes']
        if 'property_type' in data:
            prop.property_type = data['property_type']
        if 'price' in data:
            prop.price = data['price']
        if 'location' in data:
            prop.location = data['location']
        if 'bedrooms' in data:
            prop.bedrooms = data['bedrooms']
        if 'bathrooms' in data:
            prop.bathrooms = data['bathrooms']
        if 'area_sqft' in data:
            prop.area_sqft = data['area_sqft']
        if 'availability_status' in data:
            prop.availability_status = data['availability_status']
        
        db.session.commit()
        
        # Re-embed to ChromaDB if description or broker_notes changed
        if description_changed or notes_changed:
            EmbeddingService.update_property_embedding(
                property_id=prop.property_id,
                title=prop.title,
                description=prop.description,
                broker_notes=prop.broker_notes
            )
        
        return success_response(
            data={"property_id": prop.property_id},
            message="Property updated successfully"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update property: {str(e)}", status_code=500)

@property_bp.route('/<int:property_id>', methods=['DELETE'])
@jwt_required()
@role_required('broker')
def delete_property(property_id):
    # Broker-only route: delete own property, cancel pending bookings, remove from ChromaDB
    from services.embedding_service import EmbeddingService
    
    # Get broker_id from JWT claims
    claims = get_jwt()
    broker_id = claims.get("id")
    
    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)
    
    prop = Property.query.get_or_404(property_id)
    
    # Verify ownership
    if prop.broker_id != broker_id:
        return error_response(message="Unauthorized: you can only delete your own properties", status_code=403)
    
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

@property_bp.route('/<int:property_id>/images', methods=['POST'])
@jwt_required()
@role_required('broker')
def upload_property_images(property_id):
    # Broker-only route: upload images with validation
    import os
    from werkzeug.utils import secure_filename
    
    # Get broker_id from JWT claims
    claims = get_jwt()
    broker_id = claims.get("id")
    
    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)
    
    prop = Property.query.get_or_404(property_id)
    
    # Verify ownership
    if prop.broker_id != broker_id:
        return error_response(message="Unauthorized: you can only upload images to your own properties", status_code=403)
    
    # Check if files were uploaded
    if 'images' not in request.files:
        return error_response(message="No images provided", status_code=400)
    
    files = request.files.getlist('images')
    if not files or all(f.filename == '' for f in files):
        return error_response(message="No images selected", status_code=400)
    
    # Allowed extensions
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    # Validate all files first
    for file in files:
        if file.filename == '':
            continue
        if not allowed_file(file.filename):
            return error_response(message=f"Invalid file type: {file.filename}. Allowed: jpg, jpeg, png, webp", status_code=400)
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return error_response(message=f"File too large: {file.filename}. Max size: 5MB", status_code=400)
    
    # Create upload directory
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(property_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_images = []
    try:
        for file in files:
            if file.filename == '':
                continue
            
            filename = secure_filename(file.filename)
            # Add timestamp to avoid collisions
            import time
            name, ext = os.path.splitext(filename)
            filename = f"{name}_{int(time.time())}{ext}"
            
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)
            
            # Store relative path in database
            relative_path = os.path.join('uploads', 'properties', str(property_id), filename).replace('\\', '/')
            
            new_image = PropertyImage(
                property_id=property_id,
                image_url=relative_path
            )
            db.session.add(new_image)
            saved_images.append(relative_path)
        
        db.session.commit()
        
        return success_response(
            data={"images": saved_images},
            message=f"{len(saved_images)} image(s) uploaded successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to upload images: {str(e)}", status_code=500)

@property_bp.route('/<int:property_id>/availability', methods=['PATCH'])
@jwt_required()
@role_required('broker')
def toggle_availability(property_id):
    # Broker-only route: toggle availability status (no ChromaDB update needed)
    from marshmallow import Schema, fields, ValidationError, validate
    
    class AvailabilitySchema(Schema):
        availability_status = fields.String(required=True, validate=validate.OneOf(['Available', 'Unavailable', 'Rented']))
    
    schema = AvailabilitySchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(message="Validation error", status_code=400, data=err.messages)
    
    # Get broker_id from JWT claims
    claims = get_jwt()
    broker_id = claims.get("id")
    
    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)
    
    prop = Property.query.get_or_404(property_id)
    
    # Verify ownership
    if prop.broker_id != broker_id:
        return error_response(message="Unauthorized: you can only update your own properties", status_code=403)
    
    try:
        prop.availability_status = data['availability_status']
        db.session.commit()
        
        # No ChromaDB update needed - availability is filtered at PostgreSQL layer only
        
        return success_response(
            data={"property_id": prop.property_id, "availability_status": prop.availability_status},
            message="Availability status updated successfully"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to update availability: {str(e)}", status_code=500)

@property_bp.route('/<int:property_id>/images/<path:image_url>', methods=['DELETE'])
@jwt_required()
@role_required('broker')
def delete_property_image(property_id, image_url):
    # Broker-only route: delete a specific image from own property
    import os
    from urllib.parse import unquote

    claims = get_jwt()
    broker_id = claims.get("id")

    if not broker_id:
        return error_response(message="Invalid token: missing broker ID", status_code=401)

    prop = Property.query.get_or_404(property_id)

    if prop.broker_id != broker_id:
        return error_response(message="Unauthorized: you can only delete images of your own properties", status_code=403)

    decoded_url = unquote(image_url)

    # Search for matching PropertyImage record
    image_record = PropertyImage.query.filter(
        PropertyImage.property_id == property_id,
        (PropertyImage.image_url == decoded_url) | (PropertyImage.image_url.endswith(decoded_url))
    ).first()

    if not image_record:
        return error_response(message="Image record not found", status_code=404)

    try:
        # Remove physical file if it exists
        full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], '..', image_record.image_url)
        full_path = os.path.abspath(full_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass

        db.session.delete(image_record)
        db.session.commit()

        return success_response(message="Image deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=f"Failed to delete image: {str(e)}", status_code=500)