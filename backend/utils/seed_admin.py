import sys
import os

# Add root folder to path so models can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_admin():
    """Seed the first administrator directly into the database."""
    print("Seeding first administrator...")
    # Will implement seeding in Phase 1
    print("Seed complete.")

if __name__ == "__main__":
    seed_admin()
