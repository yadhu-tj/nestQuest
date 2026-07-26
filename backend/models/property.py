from datetime import datetime
from . import db

class Property(db.Model):
    __tablename__ = 'property'
    
    property_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    broker_id = db.Column(db.Integer, db.ForeignKey('broker.broker_id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    broker_notes = db.Column(db.Text)
    property_type = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Integer)
    area_sqft = db.Column(db.Integer)
    availability_status = db.Column(db.String(20), nullable=False, default='Available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    images = db.relationship('PropertyImage', backref='property', cascade='all, delete-orphan', passive_deletes=True)
    bookings = db.relationship('Booking', backref='property', cascade='all, delete-orphan', passive_deletes=True)
