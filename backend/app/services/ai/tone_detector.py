"""Tone Detection Service"""

from transformers import pipeline
from typing import Dict


class ToneDetectorService:
    def __init__(self):
        # Use emotion detection model
        self.classifier = None  # Lazy load
    
    def _load_model(self):
        """Lazy load the model"""
        if self.classifier is None:
            self.classifier = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                top_k=1
            )
    
    async def detect(self, text: str) -> Dict[str, any]:
        """
        Detect tone/emotion in text
        
        Args:
            text: Input text
        
        Returns:
            Dict with tone and confidence
        """
        if not text:
            return {"tone": "neutral", "confidence": 1.0}
        
        try:
            self._load_model()
            results = self.classifier(text[:512])  # Limit text length
            
            if results and len(results[0]) > 0:
                result = results[0][0]
                tone = result['label'].lower()
                confidence = result['score']
                
                # Map to simplified tones
                tone_map = {
                    'anger': 'anger',
                    'joy': 'joy',
                    'sadness': 'neutral',
                    'fear': 'urgency',
                    'surprise': 'neutral',
                    'disgust': 'anger',
                    'neutral': 'neutral'
                }
                
                return {
                    "tone": tone_map.get(tone, 'neutral'),
                    "confidence": confidence
                }
        except Exception as e:
            pass
        
        return {"tone": "neutral", "confidence": 0.5}


# Global instance
tone_detector_service = ToneDetectorService()
