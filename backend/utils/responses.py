from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(message="Error", status_code=400, data=None):
    return jsonify({
        "success": False,
        "data": data,
        "message": message
    }), status_code
