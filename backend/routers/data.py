from fastapi import APIRouter, Request, Depends
from typing import List, Any
import datetime

router = APIRouter()

# In-memory storage for simplicity, matching Node.js implementation
received_data = []

@router.post("/data")
async def receive_generic_data(request: Request):
    body = await request.json()
    timestamp = datetime.datetime.utcnow().isoformat()
    entry = {
        "id": int(datetime.datetime.utcnow().timestamp() * 1000),
        "timestamp": timestamp,
        "endpoint": "/api/data",
        "method": "POST",
        "headers": dict(request.headers),
        "body": body,
        "query": dict(request.query_params)
    }
    received_data.append(entry)
    print(f"📦 Received data at /api/data: {timestamp}")
    return {"success": True, "message": "Data received successfully", "timestamp": timestamp, "dataId": entry["id"]}

@router.post("/posts")
async def receive_posts(request: Request):
    body = await request.json()
    timestamp = datetime.datetime.utcnow().isoformat()
    entry = {
        "id": int(datetime.datetime.utcnow().timestamp() * 1000),
        "timestamp": timestamp,
        "endpoint": "/api/posts",
        "method": "POST",
        "headers": dict(request.headers),
        "body": body,
        "query": dict(request.query_params)
    }
    received_data.append(entry)
    print(f"📬 Received posts data at /api/posts: {timestamp}")
    return {"success": True, "message": "Posts data received successfully", "timestamp": timestamp, "dataId": entry["id"]}

@router.post("/users")
async def receive_users(request: Request):
    body = await request.json()
    timestamp = datetime.datetime.utcnow().isoformat()
    entry = {
        "id": int(datetime.datetime.utcnow().timestamp() * 1000),
        "timestamp": timestamp,
        "endpoint": "/api/users",
        "method": "POST",
        "headers": dict(request.headers),
        "body": body,
        "query": dict(request.query_params)
    }
    received_data.append(entry)
    print(f"👤 Received users data at /api/users: {timestamp}")
    return {"success": True, "message": "Users data received successfully", "timestamp": timestamp, "dataId": entry["id"]}

@router.post("/comments")
async def receive_comments(request: Request):
    body = await request.json()
    timestamp = datetime.datetime.utcnow().isoformat()
    entry = {
        "id": int(datetime.datetime.utcnow().timestamp() * 1000),
        "timestamp": timestamp,
        "endpoint": "/api/comments",
        "method": "POST",
        "headers": dict(request.headers),
        "body": body,
        "query": dict(request.query_params)
    }
    received_data.append(entry)
    print(f"💬 Received comments data at /api/comments: {timestamp}")
    return {"success": True, "message": "Comments data received successfully", "timestamp": timestamp, "dataId": entry["id"]}

@router.get("/received")
def get_received_data():
    return {
        "success": True,
        "totalReceived": len(received_data),
        "data": received_data
    }

@router.delete("/received")
def clear_received_data():
    cleared_count = len(received_data)
    received_data.clear()
    print("🧹 Cleared all received data")
    return {"success": True, "message": f"Cleared {cleared_count} data entries", "clearedCount": cleared_count}
