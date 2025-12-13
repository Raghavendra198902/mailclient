"""WebSocket manager for real-time updates"""

from fastapi import WebSocket
from typing import List
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Connect new WebSocket client"""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect WebSocket client"""
        self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific client"""
        await websocket.send_text(message)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            await connection.send_json(message)
    
    async def notify_animation(self, event_type: str, data: dict):
        """Trigger animation event on frontend"""
        await self.broadcast({
            "type": "animation_event",
            "event": event_type,
            "data": data
        })


# Global instance
websocket_manager = WebSocketManager()
