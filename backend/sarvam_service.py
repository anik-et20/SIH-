import os
import re
import httpx
import logging
from typing import Optional, Dict, Tuple, List

logger = logging.getLogger("disasterguard.sarvam_service")

SARVAM_API_URL = "https://api.sarvam.ai"

# Standard Sarvam AI Language Codes
SARVAM_LANG_MAP = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "or": "or-IN",
    "pa": "pa-IN",
    "en": "en-IN"
}

def get_sarvam_headers() -> Optional[Dict[str, str]]:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        return None
    return {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

def _chunk_text(text: str, max_chars: int = 800) -> List[str]:
    """Splits long text into manageable chunks respecting sentence and line boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    current_chunk = ""
    # Split by paragraphs or sentences
    paragraphs = text.split("\n")
    for para in paragraphs:
        if len(current_chunk) + len(para) + 1 <= max_chars:
            current_chunk += ("\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
            if len(para) <= max_chars:
                current_chunk = para
            else:
                # Split large paragraph by sentences
                sentences = re.split(r'([।\.!?]+)', para)
                for i in range(0, len(sentences), 2):
                    sentence = sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")
                    if len(current_chunk) + len(sentence) <= max_chars:
                        current_chunk += sentence
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = sentence[:max_chars]

    if current_chunk:
        chunks.append(current_chunk)
    return chunks or [text[:max_chars]]

async def translate_text(
    input_text: str,
    source_language_code: str = "en-IN",
    target_language_code: str = "hi-IN"
) -> Tuple[str, str]:
    """
    Translates input text using Sarvam AI Mayura Translation API with smart chunking (<= 800 chars).
    Returns Tuple of (translated_text, detected_source_language_code).
    """
    headers = get_sarvam_headers()
    if not headers or not input_text.strip():
        return input_text, source_language_code

    # Normalize language codes
    src_code = SARVAM_LANG_MAP.get(source_language_code, source_language_code)
    tgt_code = SARVAM_LANG_MAP.get(target_language_code, target_language_code)

    if src_code == "auto":
        src_code = "en-IN"

    if src_code == tgt_code:
        return input_text, src_code

    chunks = _chunk_text(input_text, max_chars=800)
    translated_chunks = []
    detected = src_code

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            for chunk in chunks:
                if not chunk.strip():
                    continue
                payload = {
                    "input": chunk.strip(),
                    "source_language_code": src_code,
                    "target_language_code": tgt_code,
                    "speaker_gender": "Female",
                    "mode": "formal",
                    "model": "mayura:v1"
                }
                resp = await client.post(
                    f"{SARVAM_API_URL}/translate",
                    json=payload,
                    headers=headers
                )
                if resp.status_code == 200:
                    data = resp.json()
                    translated_chunks.append(data.get("translated_text", chunk))
                    detected = data.get("source_language_code", detected)
                else:
                    logger.warning(f"Sarvam Translation API status {resp.status_code}: {resp.text}")
                    translated_chunks.append(chunk)

            if translated_chunks:
                logger.info(f"Sarvam AI Translation Success ({src_code} -> {tgt_code})")
                return "\n".join(translated_chunks), detected
    except Exception as e:
        logger.error(f"Error calling Sarvam Translation API: {e}")

    return input_text, source_language_code

async def generate_sarvam_tts(text: str, language_code: str = "hi-IN") -> Optional[str]:
    """
    Generates audio for given text using Sarvam AI Bulbul Text-to-Speech API.
    Returns Base64 encoded audio string (WAV format) or None.
    """
    headers = get_sarvam_headers()
    if not headers or not text.strip():
        return None

    lang_code = SARVAM_LANG_MAP.get(language_code, language_code)
    if lang_code == "auto":
        lang_code = "hi-IN"

    # Truncate text if too long for single TTS call
    clean_text = text[:450].replace("*", "").replace("#", "").strip()

    payload = {
        "inputs": [clean_text],
        "target_language_code": lang_code,
        "speaker": "ritu",
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{SARVAM_API_URL}/text-to-speech",
                json=payload,
                headers=headers
            )
            if resp.status_code == 200:
                data = resp.json()
                audios = data.get("audios", [])
                if audios:
                    logger.info(f"Sarvam AI TTS generated audio successfully for {lang_code}")
                    return audios[0] # Base64 audio string
            else:
                logger.warning(f"Sarvam TTS API status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Error calling Sarvam TTS API: {e}")

    return None
