import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt

from config import config_by_name
from models import db
from utils.responses import error_response

# Initialize extensions
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()

# Register JWT Error Handlers to maintain standard response envelope across all auth failures
@jwt.unauthorized_loader
def custom_unauthorized_callback(error_string):
    return error_response(message=f"Authorization token missing: {error_string}", status_code=401)

@jwt.invalid_token_loader
def custom_invalid_token_callback(error_string):
    return error_response(message=f"Invalid or malformed token: {error_string}", status_code=401)

@jwt.expired_token_loader
def custom_expired_token_callback(jwt_header, jwt_payload):
    return error_response(message="Token has expired. Please log in again.", status_code=401)

def create_app(config_name=None):
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')
        
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    
    # Load configuration
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))
    
    # Ensure upload directory exists
    if app.config.get('UPLOAD_FOLDER'):
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Configure CORS restricted to frontend dev server
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    # Initialize extensions with app context
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Import blueprints
    from routes.auth import auth_bp
    from routes.property import property_bp
    from routes.booking import booking_bp
    from routes.search import search_bp
    from routes.admin import admin_bp
    
    # Register blueprints under /api/v1/
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(property_bp, url_prefix='/api/v1/properties')
    app.register_blueprint(booking_bp, url_prefix='/api/v1/bookings')
    app.register_blueprint(search_bp, url_prefix='/api/v1/search')
    app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
    
    @app.route('/health')
    def health_check():
        return jsonify({'success': True, 'message': 'NestQuest API is running'}), 200
        
    return app

# Expose app for runners/WSGI servers
app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', True), host='0.0.0.0', port=5000)
