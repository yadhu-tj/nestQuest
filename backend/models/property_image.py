from . import db

class PropertyImage(db.Model):
    __tablename__ = 'property_image'
    
    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.property_id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
