"""
LLM client abstraction.

Today only Anthropic's Claude models are supported (LLM_PROVIDER=
"anthropic"), but this module exists precisely so a future provider
(OpenAI, a local model, etc.) can be added by implementing the same
`.complete(system, prompt) -> str` interface and switching on
settings.LLM_PROVIDER in `get_llm_client()` - no call site elsewhere in
the codebase needs to change.

Design note: the `anthropic` SDK client is constructed lazily (inside
`.complete()`, not `__init__`/module import) so that importing this
module never fails or raises just because ANTHROPIC_API_KEY is empty.
This matters because the app must be able to boot (and serve all
non-AI endpoints) with no API key configured at all.
"""

from abc import ABC, abstractmethod

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Default Claude model used for all agent calls. Configurable via the
# `model` constructor argument if a caller ever needs to override it.
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929"


class LLMClient(ABC):
    """Abstract interface every concrete LLM client must implement."""

    @abstractmethod
    def complete(self, system: str, prompt: str) -> str:
        """
        Send a system prompt + user prompt to the LLM and return the raw
        text of the model's response (no post-processing).
        """
        raise NotImplementedError


class AnthropicClient(LLMClient):
    """LLMClient implementation backed by the official `anthropic` Python SDK."""

    def __init__(self, model: str = DEFAULT_ANTHROPIC_MODEL, max_tokens: int = 2048):
        self.model = model
        self.max_tokens = max_tokens

    def complete(self, system: str, prompt: str) -> str:
        """
        Call the Anthropic Messages API and return the text of the first
        content block.

        Raises:
            RuntimeError: if ANTHROPIC_API_KEY is not configured. This is
                raised here (call-time), not at import/construction time,
                so the rest of the application can start up normally
                without a key and only AI-dependent endpoints fail.
        """
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError(
                "ANTHROPIC_API_KEY not set. Add a valid Anthropic API key to "
                "backend/.env (ANTHROPIC_API_KEY=sk-ant-...) to enable "
                "AI-powered review analysis and opportunity generation."
            )

        # Imported lazily so `anthropic` only needs to be importable/usable
        # when a call is actually attempted, keeping module import cheap
        # and side-effect-free.
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        try:
            response = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
        except Exception as exc:  # noqa: BLE001 - surface any SDK/network error clearly
            logger.error("Anthropic API call failed: %s", exc)
            raise RuntimeError(f"Anthropic API call failed: {exc}") from exc

        # Concatenate all text blocks in case the model returns multiple.
        text_parts = [block.text for block in response.content if getattr(block, "type", None) == "text"]
        return "\n".join(text_parts).strip()


def get_llm_client() -> LLMClient:
    """
    Factory returning the configured LLM client, based on
    settings.LLM_PROVIDER. Currently only "anthropic" is implemented;
    an unrecognized provider raises a clear error rather than silently
    falling back.
    """
    provider = settings.LLM_PROVIDER.lower()
    if provider == "anthropic":
        return AnthropicClient()
    raise ValueError(
        f"Unsupported LLM_PROVIDER={settings.LLM_PROVIDER!r}. "
        "Only 'anthropic' is currently implemented."
    )
