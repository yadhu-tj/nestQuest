import sys
import os

# Add backend directory to sys.path so imports work when executed directly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app import create_app, bcrypt
from models import db, Administrator

def seed_admin():
    """
    Seed the first administrator directly into the database.
    Reads email from SEED_ADMIN_EMAIL (default admin@nestquest.com)
    and password from SEED_ADMIN_PASSWORD (default admin123).
    """
    app = create_app()
    with app.app_context():
        print("Checking for existing administrator...")
        admin_email = os.environ.get("SEED_ADMIN_EMAIL", "admin@nestquest.com")
        admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "admin123")
        existing_admin = Administrator.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Administrator with email '{admin_email}' already exists.")
            return
            
        hashed_password = bcrypt.generate_password_hash(admin_password).decode("utf-8")
        new_admin = Administrator(
            admin_name="Super Admin",
            email=admin_email,
            password=hashed_password
        )
        
        db.session.add(new_admin)
        db.session.commit()
        print(f"Successfully seeded administrator '{admin_email}'.")

if __name__ == "__main__":
    seed_admin()
