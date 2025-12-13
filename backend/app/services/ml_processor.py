"""ML Processing Service for Email Analysis"""

import logging
from typing import Dict, Optional, List
from datetime import datetime
import re

from app.core.config import settings
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class EmailMLProcessor:
    """Process emails with AI/ML for insights"""
    
    def __init__(self):
        self.llm_service = llm_service
        # Backwards compatibility
        self.openai_available = bool(llm_service.default_provider)
        self.client = llm_service.providers.get(llm_service.default_provider) if llm_service.default_provider else None
        
        logger.info(f"EmailMLProcessor initialized with LLM provider: {llm_service.default_provider}")
    
    async def process_message(self, message_data: Dict) -> Dict:
        """
        Process a message with AI/ML to extract insights
        
        Args:
            message_data: Dict with subject, body_text, from_email, etc.
            
        Returns:
            Dict with ML analysis results
        """
        try:
            subject = message_data.get('subject', '')
            body = message_data.get('body_text', '')
            from_email = message_data.get('from_email', '')
            
            # Generate summary
            summary = await self._generate_summary(subject, body)
            
            # Calculate priority score
            priority_score, priority_label = self._calculate_priority(subject, body, from_email)
            
            # Detect sentiment/tone
            tone = self._detect_tone(subject, body)
            
            # Classify intent
            intent = self._classify_intent(subject, body)
            
            # Detect phishing indicators
            phishing_score = self._detect_phishing(subject, body, from_email)
            
            # Extract PII
            pii_entities = self._extract_pii(body)
            
            return {
                'summary_short': summary,
                'priority_score': priority_score,
                'priority_label': priority_label,
                'tone_label': tone,
                'intent_label': intent,
                'phishing_score': phishing_score,
                'pii_entities': pii_entities,
                'processed_at': datetime.now().isoformat(),
                'model_version': 'v1.0'
            }
            
        except Exception as e:
            logger.error(f"ML processing failed: {str(e)}")
            return {}
    
    async def _generate_summary(self, subject: str, body: str, max_length: int = 150) -> str:
        """Generate AI summary of email using LLM service"""
        
        try:
            # Use LLM service for high-quality summaries
            summary = await self.llm_service.generate_email_summary(
                subject=subject,
                body=body,
                style="short"
            )
            return summary[:max_length] if summary else subject[:max_length]
        except Exception as e:
            logger.warning(f"LLM summary failed: {e}")
            
            # Fallback: Extract first meaningful sentences
            text = body.strip()
            if not text:
                return subject[:max_length]
            
            # Get first 1-2 sentences
            sentences = re.split(r'[.!?]+', text)
            summary = '. '.join([s.strip() for s in sentences[:2] if s.strip()])[:max_length]
            
            return summary if summary else subject[:max_length]
    
    def _calculate_priority(self, subject: str, body: str, from_email: str) -> tuple:
        """
        Calculate priority score (0-1) and label
        
        Returns:
            (score, label) tuple
        """
        score = 0.5  # Default medium
        
        # Check for urgent keywords
        urgent_keywords = [
            'urgent', 'asap', 'immediately', 'critical', 'important',
            'deadline', 'emergency', 'action required', 'time sensitive'
        ]
        
        text = f"{subject} {body}".lower()
        
        for keyword in urgent_keywords:
            if keyword in text:
                score += 0.15
        
        # Check for question marks (likely needs response)
        if '?' in subject or body.count('?') > 2:
            score += 0.1
        
        # Check for RE: or FWD: (continuation of thread)
        if subject.lower().startswith(('re:', 'fwd:')):
            score += 0.05
        
        # VIP senders (simplified - would use database in production)
        vip_domains = ['ceo', 'founder', 'director', 'manager']
        for vip in vip_domains:
            if vip in from_email.lower():
                score += 0.2
                break
        
        # Cap at 1.0
        score = min(score, 1.0)
        
        # Assign label
        if score >= 0.75:
            label = 'high'
        elif score >= 0.5:
            label = 'medium'
        else:
            label = 'low'
        
        return round(score, 2), label
    
    def _detect_tone(self, subject: str, body: str) -> str:
        """
        Detect email tone/sentiment
        
        Returns:
            Tone label: positive, neutral, negative, urgent
        """
        text = f"{subject} {body}".lower()
        
        # Simple keyword-based detection
        positive_words = ['thank', 'appreciate', 'great', 'excellent', 'wonderful', 'please', 'kindly']
        negative_words = ['issue', 'problem', 'concern', 'complaint', 'unfortunately', 'error', 'failed']
        urgent_words = ['urgent', 'asap', 'immediately', 'critical']
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        urgent_count = sum(1 for word in urgent_words if word in text)
        
        if urgent_count > 0:
            return 'urgent'
        elif negative_count > positive_count:
            return 'negative'
        elif positive_count > negative_count:
            return 'positive'
        else:
            return 'neutral'
    
    def _classify_intent(self, subject: str, body: str) -> str:
        """
        Classify email intent
        
        Returns:
            Intent label: request, information, meeting, feedback, other
        """
        text = f"{subject} {body}".lower()
        
        # Simple pattern matching
        if any(word in text for word in ['could you', 'can you', 'please', 'would you', 'need']):
            return 'request'
        elif any(word in text for word in ['meeting', 'call', 'schedule', 'calendar', 'appointment']):
            return 'meeting'
        elif any(word in text for word in ['feedback', 'review', 'thoughts', 'opinion', 'comment']):
            return 'feedback'
        elif any(word in text for word in ['fyi', 'update', 'inform', 'notice', 'announcement']):
            return 'information'
        else:
            return 'other'
    
    def _detect_phishing(self, subject: str, body: str, from_email: str) -> float:
        """
        Detect phishing indicators
        
        Returns:
            Phishing score (0-1)
        """
        score = 0.0
        
        # Check for suspicious keywords
        phishing_keywords = [
            'verify your account', 'confirm your identity', 'urgent action',
            'suspended account', 'unusual activity', 'click here immediately',
            'account will be closed', 'verify your information', 'update payment'
        ]
        
        text = f"{subject} {body}".lower()
        
        for keyword in phishing_keywords:
            if keyword in text:
                score += 0.2
        
        # Check for suspicious links
        if body.count('http') > 5:
            score += 0.15
        
        # Check for mismatched sender
        if '@' in body:
            # Emails mentioned in body different from sender
            score += 0.1
        
        # Check for sense of urgency
        if any(word in text for word in ['urgent', 'immediately', 'now', 'asap']):
            score += 0.1
        
        # Check for poor grammar indicators (simplified)
        if '!!!' in text or text.count('!') > 5:
            score += 0.1
        
        return min(round(score, 2), 1.0)
    
    def _extract_pii(self, body: str) -> List[Dict]:
        """
        Extract personally identifiable information
        
        Returns:
            List of PII entities found
        """
        pii_entities = []
        
        # Email addresses
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', body)
        for email in emails:
            pii_entities.append({'type': 'email', 'value': email})
        
        # Phone numbers (simple US format)
        phones = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', body)
        for phone in phones:
            pii_entities.append({'type': 'phone', 'value': phone})
        
        # SSN patterns (simplified)
        ssns = re.findall(r'\b\d{3}-\d{2}-\d{4}\b', body)
        for ssn in ssns:
            pii_entities.append({'type': 'ssn', 'value': 'XXX-XX-XXXX'})  # Masked
        
        # Credit card patterns (simplified)
        cards = re.findall(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', body)
        for card in cards:
            pii_entities.append({'type': 'credit_card', 'value': 'XXXX-XXXX-XXXX-XXXX'})  # Masked
        
        return pii_entities
    
    async def generate_smart_replies(
        self, 
        subject: str, 
        body: str,
        tone: str = 'professional',
        num_suggestions: int = 3
    ) -> List[Dict[str, str]]:
        """
        Generate smart reply suggestions
        
        Args:
            subject: Email subject
            body: Email body
            tone: Desired tone (professional, casual, brief)
            num_suggestions: Number of suggestions to generate
            
        Returns:
            List of reply suggestions with labels
        """
        # Try LLM service first if available
        try:
            replies = await self.llm_service.generate_smart_replies(
                subject=subject,
                body=body,
                sender=sender,
                count=num_suggestions
            )
            
            # Convert to expected format with labels
            formatted_replies = []
            for i, reply in enumerate(replies):
                formatted_replies.append({
                    'label': reply.get('tone', 'Reply').capitalize(),
                    'text': reply.get('text', '')
                })
            
            if formatted_replies:
                return formatted_replies[:num_suggestions]
                    
        except Exception as e:
            logger.warning(f"LLM smart reply failed: {e}")
        
        # Fallback: Template-based suggestions
        intent = self._classify_intent(subject, body)
        
        templates = {
            'request': [
                {
                    'label': 'Accept Request',
                    'text': f"Thank you for reaching out. I'd be happy to help with this. I'll get started right away and keep you updated."
                },
                {
                    'label': 'Need More Info',
                    'text': f"Thanks for your message. Could you provide some additional details so I can better assist you with this?"
                },
                {
                    'label': 'Polite Decline',
                    'text': f"Thank you for thinking of me. Unfortunately, I'm not able to accommodate this request at the moment."
                }
            ],
            'meeting': [
                {
                    'label': 'Accept Meeting',
                    'text': f"That time works perfectly for me. I've added it to my calendar and look forward to our meeting."
                },
                {
                    'label': 'Suggest Alternative',
                    'text': f"Thank you for the invitation. I have a conflict at that time. Would [alternative time] work for you?"
                },
                {
                    'label': 'Decline Meeting',
                    'text': f"Thank you for the invitation. Unfortunately, I won't be able to attend this meeting."
                }
            ],
            'feedback': [
                {
                    'label': 'Thank for Feedback',
                    'text': f"Thank you for taking the time to share your feedback. I really appreciate your insights and will take them into consideration."
                },
                {
                    'label': 'Acknowledge & Discuss',
                    'text': f"Thanks for your feedback. I'd like to discuss this further. Could we schedule a brief call?"
                },
                {
                    'label': 'Brief Thanks',
                    'text': f"Thank you for your feedback. It's very helpful."
                }
            ],
            'information': [
                {
                    'label': 'Acknowledge Receipt',
                    'text': f"Thanks for the update. I've noted this information and will follow up if I have any questions."
                },
                {
                    'label': 'Ask Question',
                    'text': f"Thank you for this information. Could you clarify [specific point] for me?"
                },
                {
                    'label': 'Brief Thanks',
                    'text': f"Thanks for letting me know."
                }
            ]
        }
        
        # Get templates for intent or use default
        replies = templates.get(intent, [
            {
                'label': 'Professional Reply',
                'text': f"Thank you for your email. I'll review this and get back to you shortly."
            },
            {
                'label': 'Brief Response',
                'text': f"Thanks for reaching out. I'll look into this."
            },
            {
                'label': 'Detailed Response',
                'text': f"Thank you for your message. I appreciate you taking the time to contact me. I'll give this my full attention and respond in detail soon."
            }
        ])
        
        return replies[:num_suggestions]


# Global instance
_ml_processor: Optional[EmailMLProcessor] = None


def get_ml_processor() -> EmailMLProcessor:
    """Get or create ML processor singleton"""
    global _ml_processor
    if _ml_processor is None:
        _ml_processor = EmailMLProcessor()
    return _ml_processor
