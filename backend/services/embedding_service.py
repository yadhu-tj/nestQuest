import os
import logging
import chromadb

logger = logging.getLogger(__name__)

class EmbeddingService:
    COLLECTION_NAME = "nestquest_properties"
    _client = None
    _collection = None

    @classmethod
    def init_chroma(cls):
        """Initialize persistent ChromaDB collection."""
        if cls._collection is None:
            persist_path = os.environ.get('CHROMA_PERSIST_PATH', './chroma_store')
            cls._client = chromadb.PersistentClient(path=persist_path)
            cls._collection = cls._client.get_or_create_collection(name=cls.COLLECTION_NAME)
        return cls._collection

    @classmethod
    def reset_collection(cls):
        """Delete and recreate the ChromaDB collection from scratch."""
        cls.init_chroma()
        try:
            cls._client.delete_collection(name=cls.COLLECTION_NAME)
        except Exception as e:
            logger.info(f"Notice during collection reset: {e}")
        cls._collection = cls._client.get_or_create_collection(name=cls.COLLECTION_NAME)
        return cls._collection

    @classmethod
    def get_collection(cls):
        """Get or initialize the ChromaDB collection."""
        if cls._collection is None:
            return cls.init_chroma()
        return cls._collection

    @staticmethod
    def _sanitize_text(title, description, broker_notes):
        """Sanitize text inputs before embedding. Handles None values gracefully."""
        parts = [p.strip() for p in (title, description, broker_notes) if p and isinstance(p, str) and p.strip()]
        return ". ".join(parts)

    @classmethod
    def embed_property(cls, property_id, title, description, broker_notes):
        """Generate embedding and store in ChromaDB with metadata. Skips upsert if text is empty."""
        text = cls._sanitize_text(title, description, broker_notes)
        if not text:
            cls.delete_property_embedding(property_id)
            return

        collection = cls.get_collection()
        prop_id_str = str(property_id)
        collection.upsert(
            documents=[text],
            metadatas=[{"property_id": prop_id_str}],
            ids=[prop_id_str]
        )

    @classmethod
    def update_property_embedding(cls, property_id, title, description, broker_notes):
        """Regenerate embedding by delegating to embed_property (which handles upsert/deletion)."""
        cls.embed_property(property_id, title, description, broker_notes)

    @classmethod
    def delete_property_embedding(cls, property_id):
        """Delete property embedding from ChromaDB using property_id."""
        collection = cls.get_collection()
        prop_id_str = str(property_id)
        try:
            collection.delete(ids=[prop_id_str])
        except Exception as e:
            logger.warning("Could not delete property embedding %s: %s", prop_id_str, e, exc_info=True)

    @classmethod
    def semantic_search(cls, query_text, available_property_ids, top_k=5):
        """Perform semantic similarity search constrained to available_property_ids."""
        if not available_property_ids or not query_text:
            return []
        
        collection = cls.get_collection()
        id_strs = [str(pid) for pid in available_property_ids]
        
        n_results = min(top_k, len(id_strs))
        if n_results <= 0:
            return []

        where_clause = {"property_id": {"$in": id_strs}} if len(id_strs) > 1 else {"property_id": id_strs[0]}

        try:
            results = collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where_clause
            )
            
            matched_ids = []
            if results and 'metadatas' in results and results['metadatas']:
                for item in results['metadatas'][0]:
                    if item and 'property_id' in item:
                        matched_ids.append(int(item['property_id']))
            return matched_ids
        except Exception as e:
            logger.exception("Semantic search failed in ChromaDB")
            raise


