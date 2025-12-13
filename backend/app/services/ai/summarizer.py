"""AI Summarization Service"""

from typing import Optional
import openai
from app.core.config import settings

openai.api_key = settings.OPENAI_API_KEY


class SummarizerService:
    def __init__(self):
        self.model = settings.SUMMARIZATION_MODEL
    
    async def summarize(self, text: str, summary_type: str = "short") -> str:
        """
        Generate summary of text
        
        Args:
            text: Input text to summarize
            summary_type: Type of summary (short, long, actionable)
        
        Returns:
            Generated summary
        """
        if not text:
            return ""
        
        max_length = {
            "short": 50,
            "long": 150,
            "actionable": 100
        }.get(summary_type, 50)
        
        prompt = self._get_prompt(text, summary_type)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful email summarization assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_length,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # Fallback to simple truncation
            return text[:max_length] + "..." if len(text) > max_length else text
    
    def _get_prompt(self, text: str, summary_type: str) -> str:
        """Generate prompt based on summary type"""
        if summary_type == "short":
            return f"Summarize this email in one sentence:\n\n{text}"
        elif summary_type == "long":
            return f"Provide a detailed summary of this email:\n\n{text}"
        elif summary_type == "actionable":
            return f"Extract key action items from this email:\n\n{text}"
        return f"Summarize:\n\n{text}"


# Global instance
summarizer_service = SummarizerService()
