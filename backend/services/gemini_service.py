import os
import re
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

# Regex to extract "Property ID <number>" followed by a separator and explanation text.
# Handles common LLM formatting variations:
#   - "Property ID 5: explanation"
#   - "**Property ID 5:** explanation"
#   - "Property ID [5]: explanation"
#   - "Property ID: 5 - explanation"
#   - "## Property ID 5 — explanation"
#   - Markdown bold/header prefixes, bracket styles, colon/dash/em-dash separators
_PROPERTY_EXPLANATION_RE = re.compile(
    r'[#*]*\s*Property\s*ID\s*[:\s]*\[?\s*(\d+)\s*\]?\s*[:–\-—]\s*(.+)',
    re.IGNORECASE
)


class GeminiService:
    @staticmethod
    def get_llm():
        """Initialize ChatGoogleGenerativeAI model."""
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables.")
            return None
        model_name = None
        try:
            from flask import current_app
            if current_app:
                model_name = current_app.config.get('GEMINI_MODEL')
        except Exception:
            pass

        if not model_name:
            model_name = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')

        try:
            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.3,
                timeout=30.0,
                max_retries=2
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChatGoogleGenerativeAI: {e}")
            return None

    @staticmethod
    def _parse_explanations(content, valid_ids):
        """
        Parse Gemini's free-text response into a {property_id: explanation} dict.

        Uses a regex tolerant of markdown bold, headers, brackets, and varied
        separators (colon, dash, em-dash).  Falls back gracefully — any line
        that doesn't match is silently skipped, and only IDs present in
        `valid_ids` are included in the result.

        Args:
            content:   Raw text response from Gemini.
            valid_ids: Set of int property IDs that were sent in the prompt.

        Returns:
            dict mapping int property_id -> str explanation.
        """
        explanations = {}

        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue

            match = _PROPERTY_EXPLANATION_RE.match(line)
            if match:
                pid = int(match.group(1))
                explanation = match.group(2).strip().rstrip('*')  # strip trailing markdown bold
                if pid in valid_ids and explanation:
                    explanations[pid] = explanation

        return explanations

    @classmethod
    def generate_match_explanations(cls, query_text, properties_data):
        """
        Generate AI match explanations for retrieved properties based on user query.
        Returns a dict mapping property_id (int) -> explanation string, or None if failed.
        Gracefully degrades if API fails.
        """
        if not properties_data:
            return {}

        llm = cls.get_llm()
        if not llm:
            logger.warning("Gemini LLM unavailable. Skipping match explanation generation.")
            return None

        # Collect valid property IDs for post-parse validation
        valid_ids = {prop.get('property_id') for prop in properties_data}

        # Build context string for prompt
        context_items = []
        for prop in properties_data:
            context_items.append(
                f"Property ID: {prop.get('property_id')}\n"
                f"Title: {prop.get('title')}\n"
                f"Type: {prop.get('property_type')}, Price: ${prop.get('price')}\n"
                f"Location: {prop.get('location')}\n"
                f"Bedrooms: {prop.get('bedrooms')}, Bathrooms: {prop.get('bathrooms')}\n"
                f"Description: {prop.get('description')}\n"
                f"Broker Notes: {prop.get('broker_notes')}\n"
            )
        context_str = "\n---\n".join(context_items)

        prompt_template = PromptTemplate.from_template(
            "You are NestQuest's AI Real Estate Matchmaker Assistant.\n"
            "A user searched with the following query:\n"
            "User Query: \"{query}\"\n\n"
            "Below are the properties matched from the database:\n"
            "{context}\n\n"
            "For each property listed, provide a short, compelling 1-2 sentence explanation "
            "of why this property is a good match for the user's specific request.\n\n"
            "IMPORTANT: Use EXACTLY this format for each property, one per line, "
            "with NO markdown, NO bold, NO bullet points:\n"
            "Property ID <number>: <your explanation>\n\n"
            "Begin:"
        )

        try:
            prompt = prompt_template.format(query=query_text, context=context_str)
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, 'content') else str(response)

            explanations = cls._parse_explanations(content, valid_ids)

            # Log a warning if we couldn't extract explanations for some properties
            missing = valid_ids - set(explanations.keys())
            if missing:
                logger.warning(
                    f"Could not parse AI explanations for property IDs: {missing}. "
                    f"Raw response snippet: {content[:300]}"
                )

            return explanations
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}. Degrading gracefully.")
            return None
