from datetime import datetime
from . import db

class Broker(db.Model):
    __tablename__ = 'broker'
    
    broker_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    broker_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
