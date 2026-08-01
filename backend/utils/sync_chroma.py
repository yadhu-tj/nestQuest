import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db
from models.property import Property
from services.embedding_service import EmbeddingService

def sync_chroma():
    """
    Standalone recovery script:
    Fetches all properties from PostgreSQL and rebuilds ChromaDB collection from scratch.
    """
    app = create_app()
    with app.app_context():
        print("Starting ChromaDB synchronization from PostgreSQL...")
        
        print(f"Clearing existing '{EmbeddingService.COLLECTION_NAME}' ChromaDB collection...")
        EmbeddingService.reset_collection()

        # Fetch all properties from PostgreSQL
        properties = Property.query.all()
        print(f"Found {len(properties)} properties in PostgreSQL.")

        count = 0
        failures = []
        for prop in properties:
            try:
                EmbeddingService.embed_property(
                    property_id=prop.property_id,
                    title=prop.title,
                    description=prop.description,
                    broker_notes=prop.broker_notes
                )
                count += 1
            except Exception as e:
                print(f"Failed to embed property {prop.property_id}: {e}")
                failures.append(prop.property_id)

        print(f"Successfully synchronized {count}/{len(properties)} properties into ChromaDB!")
        if failures:
            print(f"Failed to synchronize {len(failures)} properties: {failures}")

if __name__ == "__main__":
    sync_chroma()
