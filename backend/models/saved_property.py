from datetime import datetime
from . import db

class SavedProperty(db.Model):
    __tablename__ = 'saved_property'
    
    saved_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.property_id', ondelete='CASCADE'), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate saves
    __table_args__ = (db.UniqueConstraint('user_id', 'property_id', name='unique_user_property_save'),)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('saved_properties', lazy=True, cascade='all, delete-orphan'))
    property = db.relationship('Property', backref=db.backref('saved_by_users', lazy=True, cascade='all, delete-orphan'))