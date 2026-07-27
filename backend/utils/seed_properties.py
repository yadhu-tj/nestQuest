import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app import create_app, bcrypt
from models import db, Broker, Property, PropertyImage

MOCK_PROPERTIES = [
    {
        "title": "Modern 2BHK Apartment near Infopark",
        "description": "Spacious 2 BHK apartment with high-speed internet capability, modern kitchen, and balcony.",
        "broker_notes": "Ideal for IT professionals working at Infopark. Quiet area, pet-friendly environment, 24/7 security, close to public transport and bus stop.",
        "property_type": "Apartment",
        "price": 18000.00,
        "location": "Kakkanad, Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1100,
        "images": ["/static/uploads/sample1.jpg"]
    },
    {
        "title": "Luxury 3BHK Villa with Private Garden",
        "description": "Premium 3 BHK villa featuring a lush private lawn, modular kitchen, and covered parking for 2 cars.",
        "broker_notes": "Family friendly gated community, safe locality for kids, quiet area with good ventilation and ample sunlight. Near top international schools.",
        "property_type": "Villa",
        "price": 45000.00,
        "location": "Vyttila, Kochi",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2400,
        "images": ["/static/uploads/sample2.jpg"]
    },
    {
        "title": "Cozy 1BHK Studio near Metro Station",
        "description": "Compact and fully furnished 1BHK studio apartment right next to the metro station.",
        "broker_notes": "Suitable for students or single working professionals. Budget friendly, walkable distance to metro station, supermarket nearby.",
        "property_type": "Studio",
        "price": 12000.00,
        "location": "Edappally, Kochi",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 550,
        "images": ["/static/uploads/sample3.jpg"]
    },
    {
        "title": "Waterfront 3BHK Luxury Apartment",
        "description": "High-rise apartment offering panoramic ocean views and world-class amenities including pool and gym.",
        "broker_notes": "Sea view, luxury living, quiet area, pet-friendly, premium fixtures, generator backup, excellent ventilation.",
        "property_type": "Apartment",
        "price": 60000.00,
        "location": "Marine Drive, Kochi",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 1950,
        "images": ["/static/uploads/sample4.jpg"]
    },
    {
        "title": "Spacious 4BHK Independent House",
        "description": "Traditional architecture meets modern living in this independent 4BHK house with courtyard.",
        "broker_notes": "Family friendly, quiet residential street, safe locality, fruit trees in garden, good water supply, close to temple and church.",
        "property_type": "House",
        "price": 35000.00,
        "location": "Aluva, Kochi",
        "bedrooms": 4,
        "bathrooms": 4,
        "area_sqft": 2800,
        "images": ["/static/uploads/sample5.jpg"]
    },
    {
        "title": "Compact 2BHK Flat near Lulu Mall",
        "description": "Well-maintained 2BHK flat within 5 minutes of shopping malls and restaurants.",
        "broker_notes": "Great location, near IT park transit routes, suitable for small families or working couples. Gated society.",
        "property_type": "Apartment",
        "price": 20000.00,
        "location": "Edappally, Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1050,
        "images": ["/static/uploads/sample6.jpg"]
    },
    {
        "title": "Eco-Friendly 2BHK Cottage in Heritage Zone",
        "description": "Charming cottage with wooden ceilings and solar water heater.",
        "broker_notes": "Quiet area, eco-friendly, suitable for artists or remote workers, pet-friendly garden, walkable to cafes.",
        "property_type": "House",
        "price": 25000.00,
        "location": "Fort Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1300,
        "images": ["/static/uploads/sample7.jpg"]
    },
    {
        "title": "Budget Studio Flat near Cusat University",
        "description": "Affordable single room studio with kitchenette.",
        "broker_notes": "Budget friendly for students, low maintenance, near university campus, reliable public transport.",
        "property_type": "Studio",
        "price": 8500.00,
        "location": "Kalamassery, Kochi",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 400,
        "images": ["/static/uploads/sample8.jpg"]
    },
    {
        "title": "Premium 3BHK Penthouse with Terrace Garden",
        "description": "Top-floor penthouse with private roof deck and jacuzzi.",
        "broker_notes": "Exclusive luxury flat, city skyline view, quiet area, suitable for executives, high speed elevator.",
        "property_type": "Apartment",
        "price": 75000.00,
        "location": "MG Road, Kochi",
        "bedrooms": 3,
        "bathrooms": 4,
        "area_sqft": 3100,
        "images": ["/static/uploads/sample9.jpg"]
    },
    {
        "title": "Gated 2BHK Flat near Medical Trust Hospital",
        "description": "Clean, accessible 2BHK flat close to top medical facilities.",
        "broker_notes": "Ideal for senior citizens or medical staff. Elevator access, wheelchair friendly, safe locality, 24/7 security.",
        "property_type": "Apartment",
        "price": 22000.00,
        "location": "Kaloor, Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1150,
        "images": ["/static/uploads/sample10.jpg"]
    },
    {
        "title": "Semi-Furnished 3BHK Apartment near SmartCity",
        "description": "Bright 3BHK with built-in wardrobes and modular kitchen.",
        "broker_notes": "Near IT park, ideal for IT professionals with families. Swimming pool, club house, pet-friendly.",
        "property_type": "Apartment",
        "price": 28000.00,
        "location": "Kakkanad, Kochi",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 1600,
        "images": ["/static/uploads/sample11.jpg"]
    },
    {
        "title": "Serene 2BHK Riverside Home",
        "description": "Relaxing home situated along the riverbank with private dock.",
        "broker_notes": "Quiet area, peaceful nature surroundings, good ventilation, ideal for nature lovers and families.",
        "property_type": "House",
        "price": 30000.00,
        "location": "Aluva, Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1400,
        "images": ["/static/uploads/sample12.jpg"]
    },
    {
        "title": "Modern 1BHK Serviced Apartment",
        "description": "Fully furnished 1BHK apartment with weekly housekeeping option.",
        "broker_notes": "Suitable for short stay IT consultants, single professionals. Close to metro, high speed WiFi ready.",
        "property_type": "Apartment",
        "price": 16000.00,
        "location": "Vyttila, Kochi",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 650,
        "images": ["/static/uploads/sample13.jpg"]
    },
    {
        "title": "Spacious 3BHK Independent Villa",
        "description": "Newly constructed villa in a quiet residential layout.",
        "broker_notes": "Family friendly, solar powered backup, EV charging spot, quiet area, safe locality.",
        "property_type": "Villa",
        "price": 38000.00,
        "location": "Tripunithura, Kochi",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2100,
        "images": ["/static/uploads/sample14.jpg"]
    },
    {
        "title": "Affordable 2BHK Apartment for Students",
        "description": "Simple 2BHK flat with open kitchen and utility area.",
        "broker_notes": "Budget friendly for students or young workers. Near bus stop and local market, reliable water.",
        "property_type": "Apartment",
        "price": 14000.00,
        "location": "Kalamassery, Kochi",
        "bedrooms": 2,
        "bathrooms": 1,
        "area_sqft": 900,
        "images": ["/static/uploads/sample15.jpg"]
    },
    {
        "title": "Luxury 4BHK Duplex in Central Business District",
        "description": "Ultra-modern duplex with private lift entry and Italian marble flooring.",
        "broker_notes": "High end security, executive residence, near corporate hubs, concierge service.",
        "property_type": "Apartment",
        "price": 85000.00,
        "location": "MG Road, Kochi",
        "bedrooms": 4,
        "bathrooms": 4,
        "area_sqft": 3400,
        "images": ["/static/uploads/sample16.jpg"]
    },
    {
        "title": "Charming 2BHK Garden Flat",
        "description": "Ground floor apartment opening into shared landscaped gardens.",
        "broker_notes": "Pet-friendly, easy ground floor access for seniors, quiet area, good ventilation.",
        "property_type": "Apartment",
        "price": 21000.00,
        "location": "Palarivattom, Kochi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1100,
        "images": ["/static/uploads/sample17.jpg"]
    },
    {
        "title": "Minimalist Studio Apartment",
        "description": "Sleek interior design studio ideal for remote working.",
        "broker_notes": "Suitable for IT professionals, high speed fiber connection pre-installed, silent neighborhood.",
        "property_type": "Studio",
        "price": 13500.00,
        "location": "Kakkanad, Kochi",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 500,
        "images": ["/static/uploads/sample18.jpg"]
    },
    {
        "title": "Heritage 3BHK Traditional Home",
        "description": "Restored Kerala ancestral home with teakwood pillars.",
        "broker_notes": "Spacious courtyard, quiet area, cool natural breeze, cultural hub nearby.",
        "property_type": "House",
        "price": 32000.00,
        "location": "Tripunithura, Kochi",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2200,
        "images": ["/static/uploads/sample19.jpg"]
    },
    {
        "title": "Gated 3BHK Apartment near Technopark Campus",
        "description": "Modern high-rise 3BHK with children playground and tennis court.",
        "broker_notes": "Near IT park, suitable for IT professionals and families, 24/7 security, pet-friendly.",
        "property_type": "Apartment",
        "price": 26000.00,
        "location": "Kazhakkoottam, Trivandrum",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 1550,
        "images": ["/static/uploads/sample20.jpg"]
    }
]

def seed_properties():
    """Seed 20 diverse properties into PostgreSQL database (and ChromaDB if RAG service available)."""
    app = create_app()
    with app.app_context():
        print("Ensuring mock broker exists...")
        broker_email = os.environ.get("SEED_BROKER_EMAIL", "broker@nestquest.com")
        broker_password = os.environ.get("SEED_BROKER_PASSWORD", "broker123")
        if not broker_email or not broker_password:
            raise RuntimeError("SEED_BROKER_EMAIL and SEED_BROKER_PASSWORD must be configured in environment variables before seeding.")
        
        broker = Broker.query.filter_by(email=broker_email).first()
        if not broker:
            hashed_pw = bcrypt.generate_password_hash(broker_password).decode("utf-8")
            broker = Broker(
                broker_name="Prime Real Estate",
                email=broker_email,
                phone="9876543210",
                password=hashed_pw,
                company_name="Prime Nest Realty"
            )
            db.session.add(broker)
            db.session.commit()
            print(f"Created default broker '{broker_email}'.")

        print("Seeding properties...")
        created_count = 0
        for item in MOCK_PROPERTIES:
            existing = Property.query.filter_by(title=item["title"], broker_id=broker.broker_id).first()
            if not existing:
                prop = Property(
                    broker_id=broker.broker_id,
                    title=item["title"],
                    description=item["description"],
                    broker_notes=item["broker_notes"],
                    property_type=item["property_type"],
                    price=item["price"],
                    location=item["location"],
                    bedrooms=item["bedrooms"],
                    bathrooms=item["bathrooms"],
                    area_sqft=item["area_sqft"],
                    availability_status="Available"
                )
                db.session.add(prop)
                db.session.flush() # Get assigned property_id

                for img_url in item.get("images", []):
                    img = PropertyImage(property_id=prop.property_id, image_url=img_url)
                    db.session.add(img)

                # Attempt ChromaDB embedding if Phase 4 RAG service is active
                try:
                    from services.embedding_service import embed_property
                    embed_property(prop)
                except Exception:
                    pass # ChromaDB will sync in Phase 4 via sync_chroma.py

                created_count += 1

        db.session.commit()
        print(f"Successfully seeded {created_count} new properties (Total: {len(MOCK_PROPERTIES)} mock corpus ready).")

if __name__ == "__main__":
    seed_properties()
