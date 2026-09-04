import os
import asyncpg
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("weathergpt.database")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/weathergpt")

async def get_db_pool():
    """Create asyncpg connection pool. Returns None if connection fails."""
    try:
        pool = await asyncpg.create_pool(DATABASE_URL, timeout=5.0)
        logger.info("Successfully connected to PostgreSQL database pool.")
        return pool
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Operating in memory/no-cache mode.")
        return None

async def init_db(pool):
    """Execute schema.sql to ensure weather_cache table exists."""
    if not pool:
        return
    
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    try:
        async with pool.acquire() as conn:
            if os.path.exists(schema_path):
                with open(schema_path, "r", encoding="utf-8") as f:
                    schema_sql = f.read()
                    await conn.execute(schema_sql)
            else:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS weather_cache (
                        location_name VARCHAR(255) PRIMARY KEY,
                        latitude DOUBLE PRECISION,
                        longitude DOUBLE PRECISION,
                        weather_data JSONB NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")

async def get_cached_weather(pool, location_name: str):
    """Retrieve cached weather data if updated within the last 60 minutes."""
    if not pool:
        return None
    
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT weather_data, updated_at 
                FROM weather_cache 
                WHERE location_name = $1
            """, location_name.lower().strip())
            
            if row:
                now = datetime.now(timezone.utc)
                updated_at = row['updated_at']
                if updated_at.tzinfo is None:
                    updated_at = updated_at.replace(tzinfo=timezone.utc)
                    
                time_diff = now - updated_at
                # Check 60 minutes cache TTL (3600 seconds)
                if time_diff.total_seconds() < 3600:
                    raw_data = row['weather_data']
                    if isinstance(raw_data, str):
                        return json.loads(raw_data)
                    return raw_data
    except Exception as e:
        logger.error(f"Error reading from weather_cache: {e}")
    return None

async def set_cached_weather(pool, location_name: str, lat: float, lon: float, data: dict):
    """Upsert weather data into weather_cache table."""
    if not pool:
        return
    
    try:
        async with pool.acquire() as conn:
            json_str = json.dumps(data)
            await conn.execute("""
                INSERT INTO weather_cache (location_name, latitude, longitude, weather_data, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (location_name) 
                DO UPDATE SET 
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    weather_data = EXCLUDED.weather_data,
                    updated_at = CURRENT_TIMESTAMP
            """, location_name.lower().strip(), lat, lon, json_str)
    except Exception as e:
        logger.error(f"Error saving to weather_cache: {e}")
