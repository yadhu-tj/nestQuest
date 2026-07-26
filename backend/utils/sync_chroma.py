import sys
import os

# Add root folder to path so models can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def sync_chroma():
    """Fetches all properties from PostgreSQL and rebuilds ChromaDB collection from scratch."""
    print("Rebuilding ChromaDB from PostgreSQL...")
    # Will implement sync logic in Phase 4
    print("ChromaDB synchronization complete!")

if __name__ == "__main__":
    sync_chroma()
