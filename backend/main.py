import os
import asyncio
import random
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from database import get_db_pool, init_db
from weather_service import get_weather, get_weather_by_coords
from llm_service import generate_weather_response, LANGUAGE_NAMES
from rag_service import search_weather_knowledge
from sarvam_service import generate_sarvam_tts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("weathergpt.main")

class WeatherQueryRequest(BaseModel):
    query: str = Field(..., json_schema_extra={"example": "क्या मुंबई में आज बारिश होगी?"})
    location: str = Field(..., json_schema_extra={"example": "Mumbai"})
    lat: Optional[float] = None
    lon: Optional[float] = None
    persona: str = Field("citizen", json_schema_extra={"example": "responder"}) # 'responder', 'citizen', 'farmer', 'admin'
    language: str = Field("auto", json_schema_extra={"example": "hi"}) # 'auto', 'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa'
    generate_audio: bool = Field(True, description="Whether to generate Sarvam AI audio TTS")

class TTSRequest(BaseModel):
    text: str = Field(..., json_schema_extra={"example": "मुंबई में वर्तमान तापमान ३० अंश सेल्सियस है।"})
    language: str = Field("hi-IN", json_schema_extra={"example": "hi-IN"})

class RAGQueryRequest(BaseModel):
    concept: str = Field(..., json_schema_extra={"example": "What does 70% chance of rain mean?"})
    topic: Optional[str] = Field(None, json_schema_extra={"example": "precipitation"})

connected_clients = set()
alert_task = None
db_pool = None

async def alert_simulator():
    """Background task to simulate real-time severe disaster warnings pushed via WebSockets."""
    alerts = [
        "🌀 CYCLONE RED WARNING: Severe cyclonic storm landfall predicted near coast in 12 hours. NDRF Teams deployed!",
        "🌊 FLASH FLOOD ALERT: Incessant rain causing rapid river level rise above danger mark. Move to high ground!",
        "⚡ SEVERE THUNDERSTORM & LIGHTNING WATCH: High winds up to 80 km/h and intense lightning expected.",
        "🔥 EXTREME HEATWAVE ADVISORY: Heat index exceeding 44°C (111°F). High heatstroke risk!",
        "⛰️ LANDSLIDE EMERGENCY: Slope movement & cloudburst risk reported in hilly districts.",
        "🌧️ URBAN INUNDATION WARNING: Severe waterlogging reported in low-lying city streets."
    ]
    logger.info("Disaster alert simulator started.")
    try:
        while True:
            await asyncio.sleep(45)
            if connected_clients:
                alert_msg = random.choice(alerts)
                logger.info(f"Broadcasting disaster alert to {len(connected_clients)} client(s): {alert_msg}")
                disconnected = set()
                for ws in list(connected_clients):
                    try:
                        await ws.send_json({"type": "alert", "message": alert_msg, "timestamp": asyncio.get_event_loop().time()})
                    except Exception:
                        disconnected.add(ws)
                for ws in disconnected:
                    connected_clients.discard(ws)
    except asyncio.CancelledError:
        logger.info("Disaster alert simulator stopped.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool, alert_task
    logger.info("Starting WeatherGPT / DisasterGuard AI Backend Engine (Deterministic RAG + Tool Calling)...")
    db_pool = await get_db_pool()
    if db_pool:
        await init_db(db_pool)
    
    alert_task = asyncio.create_task(alert_simulator())
    yield
    logger.info("Shutting down WeatherGPT Engine...")
    if alert_task:
        alert_task.cancel()
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="WeatherGPT API (Deterministic RAG & Tool Calling)",
    description="Deterministic Weather Advisory Platform with Strict Tool Calling, Pydantic Schemas, Meteorological RAG & Sarvam AI Multilingual Audio.",
    version="4.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    sarvam_configured = bool(os.getenv("SARVAM_API_KEY"))
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "online",
        "service": "WeatherGPT Deterministic RAG + Tool Calling Platform",
        "groq_configured": groq_configured,
        "sarvam_ai_enabled": sarvam_configured,
        "database_connected": db_pool is not None,
        "active_websocket_clients": len(connected_clients)
    }

@app.post("/api/chat")
async def chat_weather(req: WeatherQueryRequest):
    """
    Deterministic RAG & Strict Tool Calling Chat Endpoint.
    1. Tool Selection -> 2. Validation -> 3. Location/Date Resolution -> 4. Open-Meteo API
    -> 5. Normalization -> 6. Calculations -> 7. Meteorological RAG -> 8. Strict Formatter.
    """
    try:
        location = req.location.strip() or "Delhi"
        query = req.query.strip() or f"What is the weather in {location}?"
        persona = req.persona.lower()
        language = req.language.lower()

        # Execute full deterministic pipeline
        ai_response, detected_lang, context = await generate_weather_response(
            user_query=query,
            location_str=location,
            lat=req.lat,
            lon=req.lon,
            persona=persona,
            language=language
        )

        # Optional Sarvam AI Audio Generation (TTS)
        audio_base64 = None
        if req.generate_audio:
            audio_base64 = await generate_sarvam_tts(ai_response, language_code=detected_lang)

        lang_display_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())

        # Construct raw weather card representation for frontend
        raw_weather = {}
        if context.current_weather:
            raw_weather = {
                "temperature": context.current_weather.temperature_c,
                "condition": context.current_weather.condition,
                "humidity": context.current_weather.humidity_percent,
                "wind": context.current_weather.wind_speed_kmh,
                "apparent_temperature": context.current_weather.apparent_temperature_c,
                "precipitation": context.current_weather.precipitation_mm
            }

        return {
            "response": ai_response,
            "cached": False,
            "persona": persona,
            "language": detected_lang,
            "language_name": lang_display_name,
            "location_info": context.location.display_name if context.location else location,
            "audio_base64": audio_base64,
            "raw_weather": raw_weather,
            "deterministic_metadata": {
                "tool_used": context.tool_used,
                "target_date": context.target_date.date_str if context.target_date else "today",
                "is_unavailable": context.is_unavailable,
                "clarification_needed": context.clarification_needed,
                "clarification_options": context.clarification_options
            }
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error handling chat query: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/rag")
async def query_rag(req: RAGQueryRequest):
    """Direct query endpoint for the Meteorological Knowledge Base (RAG)."""
    try:
        result = search_weather_knowledge(req.concept, topic_filter=req.topic, top_k=3)
        return {
            "concept": req.concept,
            "topic": req.topic,
            "matched_items": [item.model_dump() for item in result.matched_items],
            "context_text": result.context_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts")
async def generate_tts(req: TTSRequest):
    """Direct Sarvam AI Text-to-Speech audio generation endpoint."""
    try:
        audio_base64 = await generate_sarvam_tts(req.text, language_code=req.language)
        if not audio_base64:
            raise HTTPException(status_code=500, detail="Sarvam TTS generation failed or SARVAM_API_KEY not configured.")
        return {"audio_base64": audio_base64, "language": req.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather")
async def raw_weather(
    location: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    """Direct weather & environmental metrics endpoint."""
    try:
        if lat is not None and lon is not None:
            data = await get_weather_by_coords(lat, lon)
            return {"data": data, "cached": False}
        else:
            loc = location or "Delhi"
            data, is_cached = await get_weather(db_pool, loc)
            return {"data": data, "cached": is_cached}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/helplines")
async def get_helplines():
    """Emergency helpline directory API."""
    return {
        "national": [
            {"name": "NDRF Disaster Helpline", "number": "1078"},
            {"name": "National Emergency Number", "number": "112"},
            {"name": "State Disaster Control Room", "number": "1070"},
            {"name": "Ambulance Emergency", "number": "108"},
            {"name": "Police Control Room", "number": "100"},
            {"name": "Fire Services", "number": "101"}
        ]
    }

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for severe disaster alert push notifications."""
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info("Client connected to severe disaster alert WebSocket stream.")
    try:
        await websocket.send_json({
            "type": "info",
            "message": "Connected to DisasterGuard AI Early Warning Alert Stream."
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket stream.")
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
    finally:
        connected_clients.discard(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
