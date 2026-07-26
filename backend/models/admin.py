from datetime import datetime
from . import db

class Administrator(db.Model):
    __tablename__ = 'administrator'
    
    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
