from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Competition

class CompetitionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.competition_id = self.scope['url_route']['kwargs']['competition_id']
        self.room_group_name = f'competition_{self.competition_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive_json(self, content):
        message_type = content.get('type')
        
        if message_type == 'task_completed':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'task_update',
                    'task_id': content.get('task_id'),
                    'user': content.get('user'),
                    'challenger_score': content.get('challenger_score'),
                    'opponent_score': content.get('opponent_score')
                }
            )
    
    async def task_update(self, event):
        await self.send_json({
            'type': 'task_update',
            'task_id': event['task_id'],
            'user': event['user'],
            'challenger_score': event['challenger_score'],
            'opponent_score': event['opponent_score']
        })
