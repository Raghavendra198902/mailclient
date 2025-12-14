"""
Multi-Provider LLM Service with intelligent model selection and fallback.
Supports OpenAI, Anthropic, Google Gemini, and Ollama (local).
"""
from typing import Optional, Dict, Any, List, AsyncGenerator
import logging
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)

# Graceful imports for optional LLM providers
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    logger.warning("openai not installed. OpenAI features will be disabled.")
    OPENAI_AVAILABLE = False
    openai = None

try:
    from anthropic import Anthropic, AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    logger.warning("anthropic not installed. Anthropic features will be disabled.")
    ANTHROPIC_AVAILABLE = False
    Anthropic = None
    AsyncAnthropic = None

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    logger.warning("google-generativeai not installed. Google features will be disabled.")
    GOOGLE_AVAILABLE = False
    genai = None

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    logger.warning("httpx not installed. Ollama features will be disabled.")
    HTTPX_AVAILABLE = False
    httpx = None

from app.core.config import settings


class LLMProvider(str, Enum):
    """Available LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"


class LLMModel(str, Enum):
    """Specific model identifiers."""
    # OpenAI
    GPT4_TURBO = "gpt-4-turbo-preview"
    GPT4 = "gpt-4"
    GPT35_TURBO = "gpt-3.5-turbo"
    
    # Anthropic
    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"
    
    # Google
    GEMINI_PRO = "gemini-pro"
    GEMINI_PRO_VISION = "gemini-pro-vision"
    
    # Ollama (local)
    LLAMA3 = "llama3"
    MISTRAL = "mistral"
    CODELLAMA = "codellama"


class TaskComplexity(str, Enum):
    """Task complexity levels for model selection."""
    SIMPLE = "simple"        # Quick classification, yes/no
    MEDIUM = "medium"        # Summarization, simple generation
    COMPLEX = "complex"      # Long-form content, reasoning
    CRITICAL = "critical"    # High-stakes decisions


class LLMService:
    """
    Unified LLM service with multi-provider support.
    Automatically selects best model based on task complexity and cost.
    """
    
    def __init__(self):
        """Initialize all available LLM providers."""
        # OpenAI
        self.openai_enabled = OPENAI_AVAILABLE and bool(getattr(settings, 'OPENAI_API_KEY', None))
        if self.openai_enabled:
            openai.api_key = settings.OPENAI_API_KEY
        
        # Anthropic
        self.anthropic_enabled = ANTHROPIC_AVAILABLE and bool(getattr(settings, 'ANTHROPIC_API_KEY', None))
        if self.anthropic_enabled:
            self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        else:
            self.anthropic_client = None
        
        # Google Gemini
        self.google_enabled = GOOGLE_AVAILABLE and bool(getattr(settings, 'GOOGLE_API_KEY', None))
        if self.google_enabled:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # Ollama (local)
        self.ollama_url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434')
        self.ollama_enabled = HTTPX_AVAILABLE  # Will check connectivity on first use
        
        # Model selection strategy
        self.model_preferences = {
            TaskComplexity.SIMPLE: [
                LLMModel.LLAMA3,  # Free local
                LLMModel.GPT35_TURBO,  # Cheap cloud
                LLMModel.CLAUDE_3_HAIKU
            ],
            TaskComplexity.MEDIUM: [
                LLMModel.GPT35_TURBO,
                LLMModel.CLAUDE_3_HAIKU,
                LLMModel.GEMINI_PRO,
                LLMModel.MISTRAL
            ],
            TaskComplexity.COMPLEX: [
                LLMModel.GPT4_TURBO,
                LLMModel.CLAUDE_3_SONNET,
                LLMModel.GEMINI_PRO
            ],
            TaskComplexity.CRITICAL: [
                LLMModel.CLAUDE_3_OPUS,
                LLMModel.GPT4,
                LLMModel.GPT4_TURBO
            ]
        }
    
    async def _check_ollama_availability(self) -> bool:
        """Check if Ollama server is running."""
        if self.ollama_enabled:
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.ollama_url}/api/tags", timeout=2.0)
                self.ollama_enabled = response.status_code == 200
                if self.ollama_enabled:
                    logger.info("Ollama server is available")
                return self.ollama_enabled
        except Exception:
            return False
    
    def _select_model(self, complexity: TaskComplexity) -> Optional[LLMModel]:
        """
        Select best available model for task complexity.
        Prefers local models for simple tasks, cloud for complex.
        """
        preferred_models = self.model_preferences[complexity]
        
        for model in preferred_models:
            # Check if provider is available
            if model.value.startswith("gpt") and self.openai_enabled:
                return model
            elif model.value.startswith("claude") and self.anthropic_enabled:
                return model
            elif model.value.startswith("gemini") and self.google_enabled:
                return model
            elif model.value in ["llama3", "mistral", "codellama"] and self.ollama_enabled:
                return model
        
        # Fallback: return any available model
        if self.openai_enabled:
            return LLMModel.GPT35_TURBO
        elif self.anthropic_enabled:
            return LLMModel.CLAUDE_3_HAIKU
        elif self.google_enabled:
            return LLMModel.GEMINI_PRO
        
        logger.error("No LLM providers available")
        return None
    
    async def _call_openai(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """Call OpenAI API."""
        try:
            response = await asyncio.to_thread(
                openai.chat.completions.create,
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _call_anthropic(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> str:
        """Call Anthropic Claude API."""
        try:
            # Convert messages format (Anthropic uses different structure)
            system_message = None
            formatted_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    formatted_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            response = await self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message,
                messages=formatted_messages
            )
            
            return response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def _call_google(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> str:
        """Call Google Gemini API."""
        try:
            # Combine messages into a single prompt for Gemini
            prompt = "\n\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
            
            model_instance = genai.GenerativeModel(model)
            response = await asyncio.to_thread(
                model_instance.generate_content,
                prompt,
                generation_config={"temperature": temperature}
            )
            
            return response.text
        except Exception as e:
            logger.error(f"Google Gemini API error: {e}")
            raise
    
    async def _call_ollama(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> str:
        """Call local Ollama API."""
        try:
            # Check availability first
            await self._check_ollama_availability()
            if not self.ollama_enabled:
                raise Exception("Ollama server not available")
            
            # Format prompt for Ollama
            prompt = "\n\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "temperature": temperature,
                        "stream": False
                    }
                )
                response.raise_for_status()
                return response.json()["response"]
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            raise
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        complexity: TaskComplexity = TaskComplexity.MEDIUM,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        model_override: Optional[LLMModel] = None
    ) -> Optional[str]:
        """
        Generate text using best available LLM.
        
        Args:
            prompt: User prompt/question
            system_prompt: Optional system instructions
            complexity: Task complexity for model selection
            temperature: Sampling temperature (0-1)
            max_tokens: Max output tokens
            model_override: Force specific model
        
        Returns:
            Generated text or None on failure
        """
        try:
            # Select model
            model = model_override or self._select_model(complexity)
            if not model:
                logger.error("No suitable model available")
                return None
            
            # Prepare messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Route to appropriate provider with fallback
            providers_tried = []
            
            while model and model not in providers_tried:
                try:
                    providers_tried.append(model)
                    
                    if model.value.startswith("gpt"):
                        result = await self._call_openai(model.value, messages, temperature, max_tokens)
                        logger.info(f"Generated with {model.value}")
                        return result
                    
                    elif model.value.startswith("claude"):
                        result = await self._call_anthropic(
                            model.value, messages, temperature, max_tokens or 1024
                        )
                        logger.info(f"Generated with {model.value}")
                        return result
                    
                    elif model.value.startswith("gemini"):
                        result = await self._call_google(model.value, messages, temperature)
                        logger.info(f"Generated with {model.value}")
                        return result
                    
                    elif model.value in ["llama3", "mistral", "codellama"]:
                        result = await self._call_ollama(model.value, messages, temperature)
                        logger.info(f"Generated with {model.value}")
                        return result
                    
                except Exception as e:
                    logger.warning(f"Model {model.value} failed: {e}")
                    # Try next model in preference list
                    remaining_models = [
                        m for m in self.model_preferences[complexity]
                        if m not in providers_tried
                    ]
                    model = remaining_models[0] if remaining_models else None
            
            logger.error("All LLM providers failed")
            return None
            
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return None
    
    async def generate_with_context(
        self,
        prompt: str,
        context: str,
        system_prompt: Optional[str] = None,
        complexity: TaskComplexity = TaskComplexity.MEDIUM
    ) -> Optional[str]:
        """
        Generate text with additional context (e.g., email content).
        
        Args:
            prompt: User question/instruction
            context: Additional context (email body, etc.)
            system_prompt: System instructions
            complexity: Task complexity
        
        Returns:
            Generated response
        """
        full_prompt = f"Context:\n{context}\n\nQuestion/Task:\n{prompt}"
        return await self.generate(
            prompt=full_prompt,
            system_prompt=system_prompt,
            complexity=complexity
        )
    
    async def batch_generate(
        self,
        prompts: List[str],
        system_prompt: Optional[str] = None,
        complexity: TaskComplexity = TaskComplexity.SIMPLE
    ) -> List[Optional[str]]:
        """
        Generate multiple responses in parallel.
        Useful for batch processing emails.
        """
        tasks = [
            self.generate(prompt, system_prompt, complexity)
            for prompt in prompts
        ]
        return await asyncio.gather(*tasks)


# Prompt templates library
PROMPT_TEMPLATES = {
    "smart_reply": {
        "system": "You are an AI email assistant. Generate concise, professional email replies.",
        "user": "Email content:\n{email_content}\n\nGenerate a {tone} reply addressing the main points."
    },
    "summarize": {
        "system": "You are an AI that creates concise email summaries.",
        "user": "Summarize this email in 2-3 sentences:\n\n{email_content}"
    },
    "classify_intent": {
        "system": "Classify email intent. Options: urgent, action_required, informational, meeting, transactional",
        "user": "Classify this email:\n\nSubject: {subject}\nBody: {body}\n\nReturn only the category."
    },
    "extract_entities": {
        "system": "Extract key entities from emails: names, dates, amounts, locations, action items.",
        "user": "Extract entities from:\n\n{email_content}\n\nReturn JSON format."
    },
    "detect_tone": {
        "system": "Detect email tone. Options: formal, casual, urgent, friendly, angry, neutral",
        "user": "What is the tone of this email?\n\n{email_content}\n\nReturn only the tone."
    }
}


# Global instance
llm_service = LLMService()
