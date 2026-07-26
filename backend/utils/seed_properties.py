import sys
import os

# Add root folder to path so models can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_properties():
    """Seed 20 diverse properties with rich broker notes into PostgreSQL & ChromaDB."""
    print("Seeding properties...")
    # Will implement seeding in Phase 1 / Phase 4
    print("Seed complete.")

if __name__ == "__main__":
    seed_properties()
