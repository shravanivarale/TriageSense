import redis.asyncio as redis
import os
import json

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
_redis_client = None


async def get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = await redis.from_url(REDIS_URL, decode_responses=True)
        except Exception:
            _redis_client = None
    return _redis_client


async def publish_event(channel: str, data: dict):
    r = await get_redis()
    if r:
        try:
            await r.publish(channel, json.dumps(data))
        except Exception:
            pass  # Redis is optional — graceful degradation
