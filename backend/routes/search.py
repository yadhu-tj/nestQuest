from flask import Blueprint, request
from utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['POST'])
@jwt_required()
def search():
    data = request.json or {}
    query = data.get('query', '').strip()
    if not query:
        return error_response("Search query cannot be empty.", 400)
    
    # RAG pipeline implementation (to be done in Phase 4)
    return success_response(data={'query': query, 'results': []}, message="Search results fetched (stub)")
