"""Intent Classification Service"""

from typing import Dict
import re


class IntentClassifierService:
    def __init__(self):
        # Intent patterns
        self.intent_patterns = {
            "approve": r"\b(approve|approved|yes|accept|agreed|confirm)\b",
            "reject": r"\b(reject|declined|no|deny|refused)\b",
            "escalate": r"\b(escalate|urgent|emergency|asap|immediate)\b",
            "schedule_meeting": r"\b(meeting|schedule|calendar|book|appointment)\b",
            "info_request": r"\b(can you|could you|please|information|details|clarify)\b",
        }
    
    async def classify(self, text: str) -> Dict[str, any]:
        """
        Classify intent from text
        
        Args:
            text: Input text
        
        Returns:
            Dict with intent and confidence
        """
        if not text:
            return {"intent": "info_request", "confidence": 0.3}
        
        text_lower = text.lower()
        
        # Check each pattern
        matches = {}
        for intent, pattern in self.intent_patterns.items():
            if re.search(pattern, text_lower):
                # Count matches
                matches[intent] = len(re.findall(pattern, text_lower))
        
        if matches:
            # Return intent with most matches
            best_intent = max(matches, key=matches.get)
            confidence = min(matches[best_intent] * 0.3, 0.95)
            return {
                "intent": best_intent,
                "confidence": confidence
            }
        
        return {"intent": "info_request", "confidence": 0.5}


# Global instance
intent_classifier_service = IntentClassifierService()
