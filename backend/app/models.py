from .database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='tenant') # 'admin', 'broker', 'tenant'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Property(db.Model):
    __tablename__ = 'properties'
    id = db.Column(db.Integer, primary_key=True)
    broker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    rent_amount = db.Column(db.Float, nullable=False)
    is_vacant = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    visit_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending') # 'pending', 'approved', 'rejected'

