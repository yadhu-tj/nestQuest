import logging
from models.property import Property
from services.embedding_service import EmbeddingService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

class RAGService:
    @classmethod
    def run_pipeline(cls, query, top_k=5):
        """
        Executes the full 10-step RAG pipeline:
        1. Receive query string from search route.
        2. Validate query is not empty.
        3. Query PostgreSQL for only property_ids where availability_status = 'Available'.
        4. If empty available list, return early with message.
        5. Call embedding_service.semantic_search(query, available_ids, top_k=5).
        6. If zero matches, return early with message.
        7. Hydrate full property details from PostgreSQL in ranked order.
        8. Assemble prompt with user query + retrieved context.
        9. Call Gemini via LangChain for AI match explanations (graceful degradation if fails).
        10. Return ranked list of properties with ai_explanation field.
        """
        # Step 1 & 2: Validate query
        if not query or not query.strip():
            return {
                "success": False,
                "message": "Search query cannot be empty.",
                "results": [],
                "count": 0
            }
        
        query_text = query.strip()

        try:
            # Step 3: PostgreSQL query for available property IDs only
            available_id_tuples = Property.query.with_entities(Property.property_id).filter_by(availability_status='Available').all()
            available_ids = [pid for (pid,) in available_id_tuples]

            # Step 4: Early return if no properties are available
            if not available_ids:
                return {
                    "success": True,
                    "message": "No properties are currently available.",
                    "results": [],
                    "count": 0
                }

            # Step 5: Semantic similarity search in ChromaDB (constrained to available_ids)
            matched_ids = EmbeddingService.semantic_search(
                query_text=query_text,
                available_property_ids=available_ids,
                top_k=top_k
            )

            # Step 6: Early return if zero matches
            if not matched_ids:
                return {
                    "success": True,
                    "message": "No properties matched your search. Try different keywords.",
                    "results": [],
                    "count": 0
                }

            # Step 7: Hydrate full property details from PostgreSQL in ranked order
            hydrated_raw = Property.query.filter(Property.property_id.in_(matched_ids)).all()
            prop_map = {p.property_id: p for p in hydrated_raw}

            hydrated_properties = []
            for pid in matched_ids:
                if pid in prop_map:
                    prop = prop_map[pid]
                    hydrated_properties.append({
                        "property_id": prop.property_id,
                        "broker_id": prop.broker_id,
                        "title": prop.title,
                        "description": prop.description,
                        "broker_notes": prop.broker_notes,
                        "property_type": prop.property_type,
                        "price": float(prop.price) if prop.price is not None else 0.0,
                        "location": prop.location,
                        "bedrooms": prop.bedrooms,
                        "bathrooms": prop.bathrooms,
                        "area_sqft": prop.area_sqft,
                        "availability_status": prop.availability_status,
                        "images": [img.image_url for img in prop.images],
                        "created_at": prop.created_at.isoformat() if prop.created_at else None,
                        "ai_explanation": None  # Will be populated in step 9
                    })

            # Steps 8 & 9: Generate AI match explanations via Gemini (graceful degradation)
            explanations = GeminiService.generate_match_explanations(
                query_text=query_text,
                properties_data=hydrated_properties
            )

            if explanations and isinstance(explanations, dict):
                for item in hydrated_properties:
                    pid = item["property_id"]
                    if pid in explanations:
                        item["ai_explanation"] = explanations[pid]

            # Step 10: Return ranked properties + AI explanations
            return {
                "success": True,
                "message": f"Successfully retrieved {len(hydrated_properties)} matching properties.",
                "results": hydrated_properties,
                "count": len(hydrated_properties)
            }

        except Exception as e:
            logger.error("Error executing RAG pipeline", exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while executing search.",
                "results": [],
                "count": 0
            }

