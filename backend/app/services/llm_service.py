"""
LLM Integration Service
Supports multiple LLM providers: OpenAI, Anthropic, Google Gemini, and local models
"""

import logging
from typing import Dict, List, Optional, Any, Literal
from enum import Enum
import asyncio

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    LOCAL = "local"


class LLMService:
    """Unified LLM service supporting multiple providers"""
    
    def __init__(self):
        self.providers = {}
        self.default_provider = None
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available LLM providers"""
        
        # Initialize OpenAI
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self.providers[LLMProvider.OPENAI] = AsyncOpenAI(
                    api_key=settings.OPENAI_API_KEY
                )
                if not self.default_provider:
                    self.default_provider = LLMProvider.OPENAI
                logger.info("OpenAI provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
        
        # Initialize Anthropic (Claude)
        if settings.ANTHROPIC_API_KEY:
            try:
                from anthropic import AsyncAnthropic
                self.providers[LLMProvider.ANTHROPIC] = AsyncAnthropic(
                    api_key=settings.ANTHROPIC_API_KEY
                )
                if not self.default_provider:
                    self.default_provider = LLMProvider.ANTHROPIC
                logger.info("Anthropic provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic: {e}")
        
        # Initialize Google Gemini
        if settings.GOOGLE_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.providers[LLMProvider.GOOGLE] = genai
                if not self.default_provider:
                    self.default_provider = LLMProvider.GOOGLE
                logger.info("Google Gemini provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Gemini: {e}")
        
        # Initialize local LLM (Ollama)
        if settings.OLLAMA_BASE_URL:
            try:
                from openai import AsyncOpenAI
                self.providers[LLMProvider.LOCAL] = AsyncOpenAI(
                    base_url=settings.OLLAMA_BASE_URL,
                    api_key="ollama"  # Ollama doesn't require API key
                )
                if not self.default_provider:
                    self.default_provider = LLMProvider.LOCAL
                logger.info("Local LLM (Ollama) provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize local LLM: {e}")
        
        if not self.providers:
            logger.warning("No LLM providers available. Using fallback methods.")
    
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        provider: Optional[LLMProvider] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> str:
        """
        Generate text completion using specified LLM provider
        
        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            provider: LLM provider to use (defaults to first available)
            model: Specific model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        provider = provider or self.default_provider
        
        if not provider or provider not in self.providers:
            logger.warning(f"Provider {provider} not available, using fallback")
            return self._fallback_completion(prompt)
        
        try:
            if provider == LLMProvider.OPENAI:
                return await self._openai_completion(
                    prompt, system_prompt, model or settings.OPENAI_MODEL,
                    temperature, max_tokens, **kwargs
                )
            elif provider == LLMProvider.ANTHROPIC:
                return await self._anthropic_completion(
                    prompt, system_prompt, model or settings.ANTHROPIC_MODEL,
                    temperature, max_tokens, **kwargs
                )
            elif provider == LLMProvider.GOOGLE:
                return await self._google_completion(
                    prompt, system_prompt, model or settings.GOOGLE_MODEL,
                    temperature, max_tokens, **kwargs
                )
            elif provider == LLMProvider.LOCAL:
                return await self._local_completion(
                    prompt, system_prompt, model or settings.LOCAL_MODEL,
                    temperature, max_tokens, **kwargs
                )
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            return self._fallback_completion(prompt)
    
    async def _openai_completion(
        self, prompt: str, system_prompt: Optional[str],
        model: str, temperature: float, max_tokens: int, **kwargs
    ) -> str:
        """Generate completion using OpenAI"""
        client = self.providers[LLMProvider.OPENAI]
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        return response.choices[0].message.content
    
    async def _anthropic_completion(
        self, prompt: str, system_prompt: Optional[str],
        model: str, temperature: float, max_tokens: int, **kwargs
    ) -> str:
        """Generate completion using Anthropic Claude"""
        client = self.providers[LLMProvider.ANTHROPIC]
        
        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        )
        
        return response.content[0].text
    
    async def _google_completion(
        self, prompt: str, system_prompt: Optional[str],
        model: str, temperature: float, max_tokens: int, **kwargs
    ) -> str:
        """Generate completion using Google Gemini"""
        genai = self.providers[LLMProvider.GOOGLE]
        
        model_instance = genai.GenerativeModel(model)
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        response = await asyncio.to_thread(
            model_instance.generate_content,
            full_prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            }
        )
        
        return response.text
    
    async def _local_completion(
        self, prompt: str, system_prompt: Optional[str],
        model: str, temperature: float, max_tokens: int, **kwargs
    ) -> str:
        """Generate completion using local LLM (Ollama)"""
        client = self.providers[LLMProvider.LOCAL]
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        return response.choices[0].message.content
    
    def _fallback_completion(self, prompt: str) -> str:
        """Fallback method when no LLM is available"""
        # Simple extractive summary
        sentences = prompt.split('.')[:3]
        return '. '.join(s.strip() for s in sentences if s.strip()) + '.'
    
    async def generate_email_summary(
        self, subject: str, body: str, style: Literal["short", "long", "actionable"] = "short"
    ) -> str:
        """Generate email summary using LLM"""
        
        if style == "short":
            system_prompt = "You are an expert at summarizing emails concisely. Create a one-sentence summary."
            max_tokens = 100
        elif style == "long":
            system_prompt = "You are an expert at summarizing emails. Create a detailed summary in 2-3 sentences."
            max_tokens = 200
        else:  # actionable
            system_prompt = "You are an expert at identifying action items. List the key actions required from this email."
            max_tokens = 150
        
        prompt = f"Subject: {subject}\n\nBody: {body[:1000]}\n\nSummary:"
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=max_tokens
        )
    
    async def generate_smart_replies(
        self, subject: str, body: str, sender: str, count: int = 3
    ) -> List[Dict[str, str]]:
        """Generate smart reply suggestions using LLM"""
        
        system_prompt = """You are an expert email assistant. Generate smart, contextually appropriate email replies.
        Provide diverse response styles (professional, casual, brief).
        Format: Return exactly 3 replies, each on a new line starting with "REPLY:"."""
        
        prompt = f"""Generate {count} smart reply suggestions for this email:

From: {sender}
Subject: {subject}
Body: {body[:800]}

Generate appropriate responses with different tones."""
        
        response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=400
        )
        
        # Parse responses
        replies = []
        for line in response.split('\n'):
            if line.strip().startswith('REPLY:'):
                text = line.replace('REPLY:', '').strip()
                if text:
                    tone = "professional" if len(replies) == 0 else "casual" if len(replies) == 1 else "brief"
                    replies.append({"text": text, "tone": tone})
        
        # Ensure we have exactly count replies
        if len(replies) < count:
            replies.extend([
                {"text": "Thank you for your email. I'll review and get back to you soon.", "tone": "professional"},
                {"text": "Got it, thanks!", "tone": "casual"},
                {"text": "Acknowledged.", "tone": "brief"}
            ][:count - len(replies)])
        
        return replies[:count]
    
    async def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities using LLM"""
        
        system_prompt = """You are an expert at extracting entities from text.
        Extract: people, organizations, dates, locations, emails, phone numbers.
        Format: Return as JSON with keys: people, organizations, dates, locations, emails, phones."""
        
        prompt = f"Extract entities from this text:\n\n{text[:1000]}"
        
        response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            max_tokens=300
        )
        
        # Try to parse JSON response
        try:
            import json
            entities = json.loads(response)
            return entities
        except:
            # Fallback to empty dict
            return {
                "people": [],
                "organizations": [],
                "dates": [],
                "locations": [],
                "emails": [],
                "phones": []
            }
    
    async def classify_intent(self, subject: str, body: str) -> tuple[str, float]:
        """Classify email intent using LLM"""
        
        system_prompt = """You are an expert at classifying email intents.
        Classify into one of: Request, Meeting, Information, Feedback, Urgent, Social, Marketing, Newsletter.
        Respond with: INTENT: <category> | CONFIDENCE: <0-1>"""
        
        prompt = f"Subject: {subject}\nBody: {body[:500]}\n\nClassify the intent:"
        
        response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=50
        )
        
        # Parse response
        intent = "Information"
        confidence = 0.5
        
        if "INTENT:" in response:
            parts = response.split("|")
            intent = parts[0].replace("INTENT:", "").strip()
            if len(parts) > 1 and "CONFIDENCE:" in parts[1]:
                try:
                    confidence = float(parts[1].replace("CONFIDENCE:", "").strip())
                except:
                    pass
        
        return intent, confidence
    
    async def detect_tone(self, text: str) -> tuple[str, float]:
        """Detect tone/sentiment using LLM"""
        
        system_prompt = """You are an expert at analyzing tone and sentiment.
        Classify tone as: Positive, Negative, Neutral, Professional, Casual, Urgent.
        Respond with: TONE: <category> | SENTIMENT: <-1 to 1>"""
        
        prompt = f"Analyze the tone of this text:\n\n{text[:600]}"
        
        response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=50
        )
        
        # Parse response
        tone = "Neutral"
        sentiment = 0.0
        
        if "TONE:" in response:
            parts = response.split("|")
            tone = parts[0].replace("TONE:", "").strip()
            if len(parts) > 1 and "SENTIMENT:" in parts[1]:
                try:
                    sentiment = float(parts[1].replace("SENTIMENT:", "").strip())
                except:
                    pass
        
        return tone, sentiment
    
    async def generate_email_draft(
        self, context: str, purpose: str, tone: str = "professional"
    ) -> str:
        """Generate complete email draft using LLM"""
        
        system_prompt = f"""You are an expert email writer. Write a {tone} email based on the context and purpose.
        Include subject line and body. Be clear, concise, and appropriate."""
        
        prompt = f"""Context: {context}
        
Purpose: {purpose}

Generate email:"""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=500
        )
    
    async def analyze_conversation(
        self, messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Analyze email conversation thread using LLM"""
        
        conversation = "\n\n".join([
            f"From: {msg.get('from_email', 'Unknown')}\n"
            f"Date: {msg.get('date', 'Unknown')}\n"
            f"Subject: {msg.get('subject', '')}\n"
            f"Body: {msg.get('body', '')[:300]}..."
            for msg in messages[:5]  # Last 5 messages
        ])
        
        system_prompt = """You are an expert at analyzing email conversations.
        Provide: 1) Conversation summary 2) Key topics 3) Action items 4) Sentiment trend.
        Format as JSON."""
        
        prompt = f"Analyze this conversation:\n\n{conversation}"
        
        response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=400
        )
        
        try:
            import json
            return json.loads(response)
        except:
            return {
                "summary": response[:200],
                "topics": [],
                "action_items": [],
                "sentiment": "neutral"
            }


# Global LLM service instance
llm_service = LLMService()
