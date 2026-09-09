import sys
import os
import random

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app import create_app, bcrypt
from models import db, User, Broker, Property, PropertyImage
from PIL import Image, ImageDraw, ImageFont

# Test data constants
TEST_USER_EMAIL = "testuser@nestquest.com"
TEST_USER_PASSWORD = "password123"
TEST_USER_NAME = "Test User"

TEST_BROKER_EMAIL = "broker@nestquest.com"
TEST_BROKER_PASSWORD = "password123"
TEST_BROKER_NAME = "Test Broker"
TEST_BROKER_PHONE = "9876543210"
TEST_BROKER_COMPANY = "NestQuest Test Realty"

# Property type options (matching backend schema)
PROPERTY_TYPES = ["Apartment", "House", "Villa", "Flat", "Studio"]

# Kerala locations
KERALA_LOCATIONS = [
    "Perumbavoor, Ernakulam",
    "Kochi, Ernakulam",
    "Aluva, Ernakulam",
    "Kakkanad, Ernakulam",
    "Edappally, Ernakulam",
    "Thrissur, Kerala",
    "Kottayam, Kerala",
    "Angamaly, Ernakulam",
    "Muvattupuzha, Ernakulam",
    "Kalamassery, Ernakulam",
    "Tripunithura, Ernakulam",
    "Vyttila, Ernakulam",
    "Palarivattom, Ernakulam",
    "North Paravur, Ernakulam",
]

# Property titles - unique markers for idempotency
PROPERTY_TEMPLATES = [
    ("Modern 2 BHK Apartment Near Kakkanad", "Apartment", 2, 2, 1100, 18000),
    ("Spacious 3 BHK Family Home in Perumbavoor", "House", 3, 2, 1500, 22000),
    ("Furnished 1 BHK Flat Near Aluva Metro", "Flat", 1, 1, 600, 12000),
    ("Peaceful 3 BHK Villa in Tripunithura", "Villa", 3, 3, 2200, 38000),
    ("Cozy 2 BHK Near Edappally Junction", "Apartment", 2, 2, 1050, 16000),
    ("Modern 3 BHK Apartment Near SmartCity Kakkanad", "Apartment", 3, 3, 1600, 28000),
    ("Luxury 4 BHK Villa Near Vyttila", "Villa", 4, 4, 3000, 55000),
    ("Affordable 1 BHK Studio Near Kalamassery", "Studio", 1, 1, 450, 9500),
    ("Well-Maintained 2 BHK House in Thrissur", "House", 2, 2, 1300, 18000),
    ("Premium 3 BHK Flat Near Palarivattom", "Flat", 3, 2, 1400, 25000),
    ("Gated Community 2 BHK in Kottayam", "Apartment", 2, 2, 1150, 15000),
    ("Independent 4 BHK House in Angamaly", "House", 4, 3, 2500, 35000),
    ("Modern 1 BHK Near Muvattupuzha", "Apartment", 1, 1, 550, 10000),
    ("Family 3 BHK Villa Near North Paravur", "Villa", 3, 3, 2000, 30000),
    ("Compact 2 BHK Flat in Edappally", "Flat", 2, 1, 900, 14000),
    ("Spacious 3 BHK Apartment in Kakkanad", "Apartment", 3, 2, 1550, 26000),
    ("Luxury 2 BHK Villa in Tripunithura", "Villa", 2, 2, 1800, 32000),
    ("Budget 1 BHK Near Aluva", "Apartment", 1, 1, 500, 8500),
    ("Premium 4 BHK Duplex in Kochi", "Apartment", 4, 4, 3200, 60000),
    ("Modern 2 BHK Near Kalamassery Metro", "Flat", 2, 2, 1000, 17000),
    ("Traditional 3 BHK House in Kottayam", "House", 3, 2, 1600, 24000),
    ("Furnished 1 BHK Studio in Vyttila", "Studio", 1, 1, 480, 11000),
    ("Gated 3 BHK Apartment Near Palarivattom", "Apartment", 3, 3, 1450, 27000),
    ("Peaceful 2 BHK Villa in Angamaly", "Villa", 2, 2, 1700, 28000),
    ("Compact 2 BHK Near Muvattupuzha", "Flat", 2, 1, 950, 13500),
    ("Spacious 4 BHK Villa in Perumbavoor", "Villa", 4, 3, 2800, 45000),
    ("Modern 3 BHK Flat in Edappally", "Flat", 3, 2, 1350, 23000),
    ("Luxury 2 BHK Apartment in Kochi", "Apartment", 2, 2, 1200, 24000),
    ("Budget 1 BHK Near Thrissur", "Apartment", 1, 1, 450, 8000),
    ("Premium 3 BHK Villa in Tripunithura", "Villa", 3, 3, 2100, 36000),
    ("Furnished 2 BHK Near Kakkanad", "Apartment", 2, 2, 1150, 20000),
    ("Gated 3 BHK House in Aluva", "House", 3, 2, 1700, 26000),
    ("Modern 1 BHK Studio Near Vyttila", "Studio", 1, 1, 500, 10500),
    ("Peaceful 3 BHK Villa in North Paravur", "Villa", 3, 3, 1900, 34000),
    ("Affordable 2 BHK in Kalamassery", "Flat", 2, 1, 900, 12500),
    ("Spacious 4 BHK Apartment in Kochi", "Apartment", 4, 3, 2500, 48000),
    ("Traditional 3 BHK House in Thrissur", "House", 3, 2, 1800, 22000),
    ("Furnished 2 BHK Near Aluva Metro", "Apartment", 2, 2, 1050, 18500),
    ("Luxury 3 BHK Villa in Vyttila", "Villa", 3, 3, 2300, 42000),
    ("Compact 1 BHK Near Edappally", "Flat", 1, 1, 550, 9000),
    ("Modern 2 BHK Near SmartCity", "Apartment", 2, 2, 1100, 19000),
    ("Peaceful 3 BHK House in Muvattupuzha", "House", 3, 2, 1650, 23500),
]

# Description templates
DESCRIPTIONS = {
    "Apartment": [
        "Modern apartment with high-speed internet capability, modern kitchen, and balcony. Well-ventilated rooms with ample natural light.",
        "Well-maintained apartment in a gated community with 24/7 security. Close to public transport, supermarkets, and IT parks.",
        "Spacious apartment with modular kitchen, built-in wardrobes, and balcony overlooking green scenery. Pet-friendly building.",
        "Modern flat with premium fixtures, generator backup, and elevator access. Ideal for working professionals and small families.",
    ],
    "House": [
        "Independent house with courtyard, good ventilation, and dedicated parking. Quiet residential area with fruit trees in garden.",
        "Traditional Kerala architecture meets modern living. Spacious rooms, well-maintained kitchen, close to temple and church.",
        "Newly constructed villa in quiet residential layout. Solar backup, EV charging spot, family-friendly neighborhood.",
        "Restored Kerala ancestral home with teakwood pillars. Spacious courtyard, cool natural breeze, cultural hub nearby.",
    ],
    "Villa": [
        "Premium villa with private lawn, modular kitchen, and covered parking. Family-friendly gated community with clubhouse and pool.",
        "Luxury villa featuring private garden, premium fixtures, and generator backup. Safe locality, near international schools.",
        "Spacious villa with terrace garden and jacuzzi. City skyline view, exclusive luxury, high-speed elevator, premium amenities.",
        "Eco-friendly villa with solar water heater, pet-friendly garden. Quiet area, walkable to cafes, sustainable living.",
    ],
    "Flat": [
        "Compact flat with open kitchen and utility area. Budget-friendly for students/young workers, near bus stop and market.",
        "Well-maintained flat within minutes of shopping malls and restaurants. Gated society, near IT park transit routes.",
        "Ground floor flat opening into shared landscaped gardens. Pet-friendly, easy access for seniors, good ventilation.",
        "Bright flat with built-in wardrobes and modular kitchen. Near IT park, swimming pool, club house, pet-friendly.",
    ],
    "Studio": [
        "Compact fully furnished studio apartment with kitchenette. Budget-friendly, walkable to metro/station, supermarket nearby.",
        "Sleek minimalist studio ideal for remote work. High-speed fiber pre-installed, silent neighborhood, suitable for professionals.",
        "Affordable single room studio with kitchenette. Low maintenance, near university campus, reliable public transport.",
        "Modern serviced studio with weekly housekeeping option. Close to metro, high-speed WiFi ready, short-stay friendly.",
    ],
}

BROKER_NOTES_TEMPLATES = {
    "Apartment": [
        "Ideal for IT professionals working nearby. Quiet area, pet-friendly environment, 24/7 security, close to public transport and bus stop.",
        "Great location, near IT park transit routes, suitable for small families or working couples. Gated society with amenities.",
        "Well-maintained, suitable for small families or working couples. Gated society with swimming pool, club house, pet-friendly.",
        "Suitable for short stay IT consultants, single professionals. Close to metro, high speed WiFi ready, generator backup.",
    ],
    "House": [
        "Well-maintained house in peaceful residential area. Good ventilation, natural lighting, dedicated parking. Suitable for family.",
        "Family friendly, quiet residential street, safe locality, fruit trees in garden, good water supply, close to temple and church.",
        "Family friendly, solar powered backup, EV charging spot, quiet area, safe locality, near schools and hospitals.",
        "Spacious courtyard, quiet area, cool natural breeze, cultural hub nearby. Suitable for large family gatherings.",
    ],
    "Villa": [
        "Family friendly gated community, safe locality for kids, quiet area with good ventilation. Near top international schools.",
        "Sea view, luxury living, quiet area, pet-friendly, premium fixtures, generator backup, excellent ventilation.",
        "Eco-friendly, suitable for artists or remote workers, pet-friendly garden, walkable to cafes, sustainable living.",
        "Exclusive luxury flat, city skyline view, quiet area, suitable for executives, high speed elevator, premium amenities.",
    ],
    "Flat": [
        "Great location, near IT park transit routes, suitable for small families or working couples. Gated society with amenities.",
        "Ideal for senior citizens or medical staff. Elevator access, wheelchair friendly, safe locality, 24/7 security.",
        "Pet-friendly, easy ground floor access for seniors, quiet area, good ventilation, walkable to nearby amenities.",
        "Near IT park, ideal for IT professionals with families. Swimming pool, club house, pet-friendly, modern amenities.",
    ],
    "Studio": [
        "Suitable for students or single working professionals. Budget friendly, walkable distance to metro station, supermarket nearby.",
        "Suitable for IT professionals, high speed fiber connection pre-installed, silent neighborhood, minimalist design.",
        "Budget friendly for students, low maintenance, near university campus, reliable public transport, compact living.",
        "Suitable for short stay IT consultants, single professionals. Close to metro, high speed WiFi ready, weekly housekeeping.",
    ],
}

def generate_test_image(property_id, image_type="exterior"):
    """Generate a simple test JPEG image using Pillow."""
    # Create a 800x600 image
    width, height = 800, 600
    
    # Color schemes for different image types
    colors = {
        "exterior": [(100, 150, 200), (70, 130, 180), (200, 220, 240)],
        "living": [(220, 200, 180), (200, 180, 160), (240, 230, 220)],
        "bedroom": [(180, 200, 220), (160, 180, 200), (230, 240, 250)],
        "kitchen": [(200, 220, 180), (180, 200, 160), (240, 250, 230)],
        "bathroom": [(180, 220, 240), (160, 200, 220), (220, 240, 255)],
    }
    
    color_scheme = colors.get(image_type, colors["exterior"])
    
    # Create gradient background
    img = Image.new('RGB', (width, height), color_scheme[0])
    draw = ImageDraw.Draw(img)
    
    # Draw gradient rectangles
    for i in range(height):
        ratio = i / height
        if ratio < 0.33:
            color = color_scheme[0]
        elif ratio < 0.66:
            color = color_scheme[1]
        else:
            color = color_scheme[2]
        draw.line([(0, i), (width, i)], fill=color)
    
    # Add text label
    try:
        font = ImageFont.load_default()
    except:
        font = None
    
    text = f"Property {property_id} - {image_type.title()}"
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        draw.text((x, y), text, fill=(50, 50, 50), font=font)
    
    # Add some decorative elements
    for i in range(5):
        x = random.randint(50, width - 50)
        y = random.randint(50, height - 50)
        size = random.randint(20, 80)
        color = (random.randint(100, 200), random.randint(100, 200), random.randint(100, 200))
        draw.ellipse([x - size, y - size, x + size, y + size], outline=color, width=3)
    
    return img

def create_test_images(property_id, upload_dir):
    """Create test images for a property and return list of image paths."""
    image_types = ["exterior", "living", "bedroom", "kitchen"]
    selected_types = random.sample(image_types, random.randint(2, 3))
    
    saved_images = []
    for idx, img_type in enumerate(selected_types):
        img = generate_test_image(property_id, img_type)
        filename = f"{img_type}_{property_id}_{random.randint(1000, 9999)}.jpg"
        filepath = os.path.join(upload_dir, filename)
        img.save(filepath, 'JPEG', quality=85)
        
        # Store relative path as used by the application
        relative_path = os.path.join('uploads', 'properties', str(property_id), filename).replace('\\', '/')
        saved_images.append(relative_path)
    
    return saved_images

def seed_test_data():
    """Seed test user, broker, and 40 properties with images."""
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("NestQuest Test Data Seeding")
        print("=" * 60)
        
        # 1. Find or create test user
        print("\n[1/3] Setting up test user...")
        user = User.query.filter_by(email=TEST_USER_EMAIL).first()
        if not user:
            hashed_pw = bcrypt.generate_password_hash(TEST_USER_PASSWORD).decode("utf-8")
            user = User(
                user_name=TEST_USER_NAME,
                email=TEST_USER_EMAIL,
                phone="9876543211",
                password=hashed_pw
            )
            db.session.add(user)
            db.session.commit()
            print(f"  Created test user: {TEST_USER_EMAIL} (ID: {user.user_id})")
        else:
            print(f"  Reusing existing test user: {TEST_USER_EMAIL} (ID: {user.user_id})")
        
        # 2. Find or create test broker
        print("\n[2/3] Setting up test broker...")
        broker = Broker.query.filter_by(email=TEST_BROKER_EMAIL).first()
        if not broker:
            hashed_pw = bcrypt.generate_password_hash(TEST_BROKER_PASSWORD).decode("utf-8")
            broker = Broker(
                broker_name=TEST_BROKER_NAME,
                email=TEST_BROKER_EMAIL,
                phone=TEST_BROKER_PHONE,
                password=hashed_pw,
                company_name=TEST_BROKER_COMPANY
            )
            db.session.add(broker)
            db.session.commit()
            print(f"  Created test broker: {TEST_BROKER_EMAIL} (ID: {broker.broker_id})")
        else:
            print(f"  Reusing existing test broker: {TEST_BROKER_EMAIL} (ID: {broker.broker_id})")
        
        # 3. Create properties
        print("\n[3/3] Seeding 40 test properties...")
        
        # Check existing seeded properties
        existing_titles = set()
        existing_props = Property.query.filter(
            Property.broker_id == broker.broker_id,
            Property.title.like('[E2E-SEED]%')
        ).all()
        for prop in existing_props:
            existing_titles.add(prop.title)
        
        print(f"  Found {len(existing_props)} existing seeded properties")
        
        created_count = 0
        for i, template in enumerate(PROPERTY_TEMPLATES):
            title, prop_type, bedrooms, bathrooms, area_sqft, base_price = template
            
            # Add test marker to title for idempotency
            marked_title = f"[E2E-SEED] {title}"
            
            if marked_title in existing_titles:
                print(f"  Skipping existing: {marked_title}")
                continue
            
            # Vary price slightly for realism
            price = base_price + random.randint(-2000, 2000)
            price = max(price, 5000)  # minimum price
            
            location = random.choice(KERALA_LOCATIONS)
            
            # Pick descriptions and broker notes
            desc = random.choice(DESCRIPTIONS.get(prop_type, DESCRIPTIONS["Apartment"]))
            notes = random.choice(BROKER_NOTES_TEMPLATES.get(prop_type, BROKER_NOTES_TEMPLATES["Apartment"]))
            
            # Create property
            prop = Property(
                broker_id=broker.broker_id,
                title=marked_title,
                description=desc,
                broker_notes=notes,
                property_type=prop_type,
                price=price,
                location=location,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                area_sqft=area_sqft,
                availability_status="Available"
            )
            db.session.add(prop)
            db.session.flush()  # Get assigned property_id
            
            # Create images
            upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(prop.property_id))
            os.makedirs(upload_dir, exist_ok=True)
            
            image_paths = create_test_images(prop.property_id, upload_dir)
            for img_path in image_paths:
                img = PropertyImage(property_id=prop.property_id, image_url=img_path)
                db.session.add(img)
            
            # Sync to ChromaDB
            try:
                from services.embedding_service import EmbeddingService
                EmbeddingService.embed_property(
                    property_id=prop.property_id,
                    title=prop.title,
                    description=prop.description,
                    broker_notes=prop.broker_notes
                )
            except Exception as e:
                print(f"  Warning embedding property {prop.property_id}: {e}")
            
            created_count += 1
            print(f"  Created ({created_count}/40): {marked_title} - Rs.{price:,}/mo - {bedrooms}BHK {bathrooms}Bath")
        
        db.session.commit()
        
        print("\n" + "=" * 60)
        print(f"Successfully seeded {created_count} new test properties")
        print(f"Total seeded properties for test broker: {len(existing_props) + created_count}")
        print("=" * 60)

if __name__ == "__main__":
    seed_test_data()