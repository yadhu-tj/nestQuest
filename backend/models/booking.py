from datetime import date
from . import db

class Booking(db.Model):
    __tablename__ = 'booking'
    
    booking_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.property_id', ondelete='CASCADE'), nullable=False)
    booking_date = db.Column(db.Date, nullable=False, default=date.today)
    visit_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    # status values: 'Pending', 'Confirmed', 'Completed', 'Cancelled'
