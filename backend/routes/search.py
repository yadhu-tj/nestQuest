from flask import Blueprint, request
from utils.responses import success_response, error_response
from utils.decorators import role_required
from flask_jwt_extended import jwt_required
from services.rag_service import RAGService

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('user')
def search():
    """
    POST /api/v1/search/
    Natural language property search powered by RAG pipeline.
    Requires JWT authentication with 'user' role.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("Invalid JSON payload or media type.", 400)
    
    raw_query = data.get('query')
    if not isinstance(raw_query, str):
        return error_response("Search query must be a string.", 400)
        
    query = raw_query.strip()
    if not query:
        return error_response("Search query cannot be empty.", 400)
    
    result = RAGService.run_pipeline(query)
    
    if not result.get("success", False):
        return error_response(result.get("message", "Search failed."), 400)
        
    return success_response(
        data={
            'query': query,
            'results': result.get('results', []),
            'count': result.get('count', 0)
        },
        message=result.get('message', 'Search completed successfully.')
    )

