"""Gmail API service"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from app.core.config import settings


class GmailService:
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        self.client_config = {
            "installed": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
    
    def get_auth_url(self) -> str:
        """Get Gmail OAuth authorization URL"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            redirect_uri=settings.GMAIL_REDIRECT_URI
        )
        auth_url, _ = flow.authorization_url(prompt='consent')
        return auth_url
    
    def exchange_code(self, code: str) -> Credentials:
        """Exchange authorization code for credentials"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            redirect_uri=settings.GMAIL_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        return flow.credentials
    
    def get_user_info(self, credentials: Credentials) -> dict:
        """Get user email address"""
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        return profile
    
    def list_messages(self, credentials: Credentials, max_results: int = 100) -> list:
        """List user messages"""
        service = build('gmail', 'v1', credentials=credentials)
        results = service.users().messages().list(
            userId='me',
            maxResults=max_results
        ).execute()
        return results.get('messages', [])
    
    def get_message(self, credentials: Credentials, message_id: str) -> dict:
        """Get specific message"""
        service = build('gmail', 'v1', credentials=credentials)
        message = service.users().messages().get(
            userId='me',
            id=message_id,
            format='full'
        ).execute()
        return message
