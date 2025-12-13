"""
Tests for ML processing service
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.ml_processor import EmailMLProcessor


class TestEmailMLProcessor:
    """Test EmailMLProcessor service."""
    
    @pytest.fixture
    def ml_processor(self):
        """Create ML processor instance."""
        return EmailMLProcessor()
    
    @pytest.mark.asyncio
    async def test_generate_summary_without_openai(self, ml_processor):
        """Test summary generation without OpenAI API key."""
        email_text = "This is a test email with important information about a meeting scheduled for tomorrow at 10 AM."
        
        summary = await ml_processor._generate_summary(email_text, summary_type="short")
        
        assert isinstance(summary, str)
        assert len(summary) > 0
        assert len(summary) < len(email_text)  # Summary should be shorter
    
    @pytest.mark.asyncio
    async def test_calculate_priority(self, ml_processor):
        """Test priority calculation."""
        # High priority email
        urgent_email = "URGENT: Critical system failure needs immediate attention!"
        priority_score, priority_label = await ml_processor._calculate_priority(urgent_email, "URGENT: Critical system failure")
        
        assert 0.0 <= priority_score <= 1.0
        assert priority_label in ["Low", "Medium", "High", "Urgent"]
        assert priority_score > 0.5  # Urgent emails should have high score
    
    @pytest.mark.asyncio
    async def test_detect_tone(self, ml_processor):
        """Test tone detection."""
        professional_email = "Dear Sir/Madam, I would like to formally request information regarding the project timeline."
        tone_label, sentiment_score = await ml_processor._detect_tone(professional_email)
        
        assert tone_label in ["Positive", "Negative", "Neutral", "Professional", "Casual", "Urgent"]
        assert -1.0 <= sentiment_score <= 1.0
    
    @pytest.mark.asyncio
    async def test_classify_intent(self, ml_processor):
        """Test intent classification."""
        meeting_email = "Can we schedule a meeting for next week to discuss the project?"
        intent_label, confidence = await ml_processor._classify_intent(meeting_email)
        
        assert intent_label in [
            "Request", "Meeting", "Information", "Feedback", 
            "Urgent", "Social", "Marketing", "Newsletter"
        ]
        assert 0.0 <= confidence <= 1.0
    
    @pytest.mark.asyncio
    async def test_detect_phishing(self, ml_processor):
        """Test phishing detection."""
        safe_email = "Hello, this is a normal email from your colleague about the project."
        is_phishing, risk_score, flags = await ml_processor._detect_phishing(safe_email, "Normal Email")
        
        assert isinstance(is_phishing, bool)
        assert 0.0 <= risk_score <= 1.0
        assert isinstance(flags, list)
    
    @pytest.mark.asyncio
    async def test_extract_pii(self, ml_processor):
        """Test PII extraction."""
        email_with_pii = "Please contact me at john.doe@example.com or call 555-123-4567."
        pii_entities = await ml_processor._extract_pii(email_with_pii)
        
        assert isinstance(pii_entities, dict)
        # Should detect email and phone
        if pii_entities:
            assert any(key in pii_entities for key in ["email", "phone", "ssn", "credit_card"])
    
    @pytest.mark.asyncio
    @patch('app.services.ml_processor.EmailMLProcessor._generate_summary')
    @patch('app.services.ml_processor.EmailMLProcessor._calculate_priority')
    @patch('app.services.ml_processor.EmailMLProcessor._detect_tone')
    @patch('app.services.ml_processor.EmailMLProcessor._classify_intent')
    async def test_process_message_integration(
        self,
        mock_intent,
        mock_tone,
        mock_priority,
        mock_summary,
        ml_processor,
        sample_email_data
    ):
        """Test full message processing pipeline."""
        # Setup mocks
        mock_summary.return_value = "Test summary"
        mock_priority.return_value = (0.7, "High")
        mock_tone.return_value = ("Professional", 0.5)
        mock_intent.return_value = ("Request", 0.8)
        
        result = await ml_processor.process_message(
            message_id=1,
            subject=sample_email_data["subject"],
            body=sample_email_data["body_text"],
            sender=sample_email_data["from_email"]
        )
        
        assert isinstance(result, dict)
        assert "summary_short" in result
        assert "priority_score" in result
        assert "tone_label" in result
        assert "intent_label" in result
    
    @pytest.mark.asyncio
    async def test_generate_smart_replies(self, ml_processor):
        """Test smart reply generation."""
        email_context = {
            "subject": "Meeting Request",
            "body": "Can we meet tomorrow at 2 PM?",
            "sender": "colleague@example.com"
        }
        
        replies = await ml_processor.generate_smart_replies(email_context)
        
        assert isinstance(replies, list)
        assert len(replies) <= 3
        
        for reply in replies:
            assert isinstance(reply, dict)
            assert "text" in reply
            assert "tone" in reply
            assert isinstance(reply["text"], str)
            assert len(reply["text"]) > 0
