import os
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    symbol: Optional[str] = Field(default=None, max_length=10)


class ChatResponse(BaseModel):
    answer: str


def _load_langchain_mistral():
    """
    Lazy import so the backend can still start without LangChain/Mistral deps.
    Returns (ChatMistralAI, SystemMessage, HumanMessage).
    """
    try:
        from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore
        from langchain_mistralai.chat_models import ChatMistralAI  # type: ignore

        return ChatMistralAI, SystemMessage, HumanMessage
    except Exception:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore
            from langchain_mistralai import ChatMistralAI  # type: ignore

            return ChatMistralAI, SystemMessage, HumanMessage
        except Exception as e:
            raise ImportError(
                "Missing LangChain/Mistral dependencies. Install: langchain-core langchain-mistralai"
            ) from e


@lru_cache(maxsize=1)
def _llm():
    ChatMistralAI, _, _ = _load_langchain_mistral()

    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is not set")

    model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    temperature = float(os.getenv("MISTRAL_TEMPERATURE", "0.2"))

    return ChatMistralAI(
        mistral_api_key=api_key,
        model=model,
        temperature=temperature,
    )


def _system_prompt(symbol: Optional[str]) -> str:
    sym = (symbol or "").strip().upper()
    sym_part = f" The user is asking about ticker {sym}." if sym else ""
    return (
        "You are TradeTrack's assistant inside a stock prediction dashboard."
        " Be concise, practical, and explain concepts in plain language."
        " If the user asks for investment advice, give general educational info and encourage doing their own research."
        " Do not claim you have real-time prices; you only know what the user provides."
        + sym_part
    )


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        llm = _llm()
        _, SystemMessage, HumanMessage = _load_langchain_mistral()

        messages = [
            SystemMessage(content=_system_prompt(req.symbol)),
            HumanMessage(content=req.message.strip()),
        ]
        out = llm.invoke(messages)
        answer = getattr(out, "content", None) or str(out)
        return ChatResponse(answer=answer.strip())
    except ImportError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chat provider error: {e}")

