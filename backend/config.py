import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_REFRESH_SECRET_KEY = os.environ.get('JWT_REFRESH_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 900))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 604800))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')
    CHROMA_PERSIST_PATH = os.environ.get('CHROMA_PERSIST_PATH', './chroma_store')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './static/uploads/properties')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    RATE_LIMIT_STORAGE_URL = os.environ.get('RATE_LIMIT_STORAGE_URL', 'memory://')
    
    # Validate required secrets
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in environment variables")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY must be set in environment variables")
    if not JWT_REFRESH_SECRET_KEY:
        raise ValueError("JWT_REFRESH_SECRET_KEY must be set in environment variables")
    
    # Enforce PostgreSQL only - raise exception if not set or not postgresql
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI or not SQLALCHEMY_DATABASE_URI.startswith('postgresql'):
        raise ValueError("DATABASE_URL must be set in environment variables and must be a valid PostgreSQL connection string (postgresql://...). SQLite is strictly prohibited.")

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

# Mapping for convenience
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
