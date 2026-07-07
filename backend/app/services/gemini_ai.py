import google.generativeai as genai
from flask import current_app

class GeminiService:
    @staticmethod
    def initialize():
        api_key = current_app.config['GEMINI_API_KEY']
        if api_key and api_key != 'your_gemini_api_key_here':
            genai.configure(api_key=api_key)
        
    @staticmethod
    def generate_match_justification(user_query, property_details):
        # Generate an AI explanation of why the property matches the user query
        # using Gemini API
        prompt = f""
        User is looking for: {user_query}
        Property Details: {property_details}
        Explain concisely why this property is a good match for the user.
        
