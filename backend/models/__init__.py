from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models here so that they are registered and available
from .administrator import Administrator
from .broker import Broker
from .user import User
from .property import Property
from .property_image import PropertyImage
from .booking import Booking
