"""Smart Reply Generation Service"""

from typing import List, Optional
import openai
from app.core.config import settings

openai.api_key = settings.OPENAI_API_KEY


class SmartReplyService:
    async def generate_replies(
        self,
        text: str,
        context: Optional[str] = None,
        tone: str = "professional"
    ) -> List[str]:
        """
        Generate smart reply suggestions
        
        Args:
            text: Email text to reply to
            context: Additional context
            tone: Desired tone (professional, casual, friendly)
        
        Returns:
            List of suggested replies
        """
        prompt = self._build_prompt(text, context, tone)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an email reply assistant. Generate 3 different reply options."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7,
                n=1
            )
            
            content = response.choices[0].message.content
            # Parse replies (assuming separated by newlines)
            replies = [r.strip() for r in content.split('\n') if r.strip()]
            return replies[:3]  # Return max 3 replies
            
        except Exception as e:
            # Fallback replies
            return [
                "Thank you for your email. I'll review this and get back to you soon.",
                "Thanks for reaching out. I appreciate the update.",
                "Received, thanks! I'll take a look at this."
            ]
    
    def _build_prompt(self, text: str, context: Optional[str], tone: str) -> str:
        """Build prompt for reply generation"""
        base = f"Generate 3 {tone} email replies to:\n\n{text}"
        if context:
            base += f"\n\nContext: {context}"
        base += "\n\nProvide 3 different reply options, each on a new line."
        return base


# Global instance
smart_reply_service = SmartReplyService()
