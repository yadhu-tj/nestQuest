from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from .database import db
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    
    # Initialize JWT
    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']  # Use the secret key for JWT
    jwt = JWTManager(app)
    
    # Register Blueprints
    from .modules.auth.routes import auth_bp
    from .modules.properties.routes import properties_bp
    from .modules.search.routes import search_bp
    from .modules.bookings.routes import bookings_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(properties_bp, url_prefix='/api/properties')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    
    @app.route('/health')
    def health_check():
        return {'status': 'NestQuest API is running'}
        
    return app
