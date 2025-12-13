"""Universal Email Service - Supports Gmail, Outlook, Yahoo, IMAP/SMTP"""

import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)
import imaplib
import email
from email.header import decode_header
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.core.config import settings


class EmailProvider(ABC):
    """Abstract base class for email providers"""
    
    @abstractmethod
    async def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with provider"""
        pass
    
    @abstractmethod
    async def list_messages(self, max_results: int = 100) -> List[Dict]:
        """List messages"""
        pass
    
    @abstractmethod
    async def get_message(self, message_id: str) -> Dict:
        """Get specific message"""
        pass
    
    @abstractmethod
    async def send_message(self, to: str, subject: str, body: str) -> bool:
        """Send message"""
        pass


class GmailProvider(EmailProvider):
    """Gmail OAuth provider"""
    
    def __init__(self):
        self.service = None
        self.credentials = None
    
    def get_auth_url(self) -> str:
        """Get Gmail OAuth authorization URL"""
        client_config = {
            "installed": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/gmail.readonly',
                   'https://www.googleapis.com/auth/gmail.send'],
            redirect_uri=settings.GMAIL_REDIRECT_URI
        )
        auth_url, _ = flow.authorization_url(prompt='consent')
        return auth_url
    
    def exchange_code(self, code: str) -> Credentials:
        """Exchange authorization code for credentials"""
        client_config = {
            "installed": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/gmail.readonly',
                   'https://www.googleapis.com/auth/gmail.send'],
            redirect_uri=settings.GMAIL_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        return flow.credentials
    
    async def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with Gmail"""
        try:
            creds = Credentials(**credentials)
            self.service = build('gmail', 'v1', credentials=creds)
            self.credentials = creds
            return True
        except Exception:
            return False
    
    async def list_messages(self, max_results: int = 500) -> List[Dict]:
        """List Gmail messages with full details including labels from all folders - FULL SYNC"""
        import base64
        import logging
        logger = logging.getLogger(__name__)
        
        # Fetch messages from ALL Gmail labels for complete sync
        # Including system labels, categories, and special folders
        all_message_ids = set()
        labels_to_fetch = [
            'INBOX', 'SENT', 'STARRED', 'DRAFT', 'TRASH', 'SPAM',
            'IMPORTANT', 'UNREAD',
            'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS',
            'CATEGORY_UPDATES', 'CATEGORY_FORUMS'
        ]
        
        for label in labels_to_fetch:
            try:
                # Fetch ALL messages from this label (no maxResults limit for full sync)
                page_token = None
                label_messages = []
                
                while True:
                    if page_token:
                        results = self.service.users().messages().list(
                            userId='me',
                            labelIds=[label],
                            pageToken=page_token
                        ).execute()
                    else:
                        results = self.service.users().messages().list(
                            userId='me',
                            labelIds=[label],
                            maxResults=500  # Max per request, will paginate for more
                        ).execute()
                    
                    label_messages.extend(results.get('messages', []))
                    page_token = results.get('nextPageToken')
                    
                    # Break if no more pages or we've fetched enough for this label
                    if not page_token or len(label_messages) >= max_results:
                        break
                
                for msg in label_messages[:max_results]:  # Limit per label to max_results
                    all_message_ids.add(msg['id'])
                    
                logger.info(f"Fetched {len(label_messages)} messages from {label} (added {min(len(label_messages), max_results)} unique IDs)")
            except Exception as e:
                logger.warning(f"Failed to fetch from {label}: {e}")
                continue
        
        logger.info(f"Total unique message IDs across all labels: {len(all_message_ids)}")
        message_ids = [{'id': msg_id} for msg_id in all_message_ids]
        
        # Fetch full message data for each
        full_messages = []
        for msg_ref in message_ids:
            try:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=msg_ref['id'],
                    format='full'
                ).execute()
                
                # Parse message headers
                headers = msg.get('payload', {}).get('headers', [])
                subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
                from_email = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
                to_email = next((h['value'] for h in headers if h['name'].lower() == 'to'), '')
                date = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
                
                # Extract body
                body_text = ''
                body_html = ''
                
                def get_body(payload):
                    nonlocal body_text, body_html
                    if 'parts' in payload:
                        for part in payload['parts']:
                            get_body(part)
                    else:
                        mime_type = payload.get('mimeType', '')
                        body_data = payload.get('body', {}).get('data', '')
                        if body_data:
                            decoded = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
                            if mime_type == 'text/plain' and not body_text:
                                body_text = decoded
                            elif mime_type == 'text/html' and not body_html:
                                body_html = decoded
                
                get_body(msg.get('payload', {}))
                
                # Get labels - THIS IS THE KEY FIX
                labels = msg.get('labelIds', ['INBOX'])
                logger.info(f"Message {msg['id'][:10]}... has labels: {labels}")
                
                # Check if message is read
                is_read = 'UNREAD' not in labels
                
                full_messages.append({
                    'id': msg['id'],
                    'subject': subject,
                    'from': from_email,
                    'to': to_email,
                    'date': date,
                    'body_text': body_text,
                    'body_html': body_html,
                    'is_read': is_read,
                    'labels': labels  # NOW INCLUDES ACTUAL GMAIL LABELS
                })
                
            except Exception as e:
                logger.error(f"Failed to fetch message {msg_ref['id']}: {e}")
                continue
        
        return full_messages
    
    async def get_message(self, message_id: str) -> Dict:
        """Get specific Gmail message"""
        message = self.service.users().messages().get(
            userId='me',
            id=message_id,
            format='full'
        ).execute()
        return message
    
    async def send_message(self, to: str, subject: str, body: str) -> bool:
        """Send Gmail message"""
        try:
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            raw = {'raw': message.as_string()}
            self.service.users().messages().send(userId='me', body=raw).execute()
            return True
        except Exception:
            return False


class IMAPProvider(EmailProvider):
    """IMAP/SMTP provider for Yahoo, custom servers, etc."""
    
    def __init__(self):
        self.imap = None
        self.smtp_server = None
        self.username = None
        self.password = None
    
    async def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with IMAP server"""
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Attempting IMAP authentication for {credentials.get('username')}")
            self.username = credentials.get('username')
            self.password = credentials.get('password')
            imap_server = credentials.get('imap_server', settings.IMAP_SERVER)
            imap_port = credentials.get('imap_port', settings.IMAP_PORT)
            
            self.imap = imaplib.IMAP4_SSL(imap_server, imap_port)
            self.imap.login(self.username, self.password)
            
            self.smtp_server = credentials.get('smtp_server', settings.SMTP_SERVER)
            return True
        except Exception as e:
            logger.error(f"IMAP authentication failed: {str(e)}")
            return False
    
    async def list_messages(self, max_results: int = 100) -> List[Dict]:
        """List IMAP messages from multiple folders"""
        import logging
        logger = logging.getLogger(__name__)
        messages = []
        
        try:
            # First, list all available folders to log them
            status, folders = self.imap.list()
            if status == 'OK':
                logger.info(f"Available IMAP folders: {folders}")
        except Exception as e:
            logger.warning(f"Could not list IMAP folders: {e}")
        
        # Gmail IMAP folder mappings - try multiple naming conventions
        # Most common Gmail folder names in different languages
        # Note: Some Gmail accounts use [Google Mail] instead of [Gmail]
        folders_to_check = [
            ('INBOX', ['INBOX']),
            ('[Gmail]/Sent', ['SENT']),
            ('[Gmail]/Sent Mail', ['SENT']),
            ('[Google Mail]/Sent Mail', ['SENT']),  # UK/some accounts
            ('[Gmail]/Enviados', ['SENT']),  # Spanish
            ('[Google Mail]/Enviados', ['SENT']),  # Spanish UK
            ('[Gmail]/Gesendet', ['SENT']),  # German
            ('[Google Mail]/Gesendet', ['SENT']),  # German UK
            ('[Gmail]/Starred', ['STARRED']),
            ('[Google Mail]/Starred', ['STARRED']),  # UK
            ('[Gmail]/Destacados', ['STARRED']),  # Spanish
            ('[Google Mail]/Destacados', ['STARRED']),  # Spanish UK
            ('[Gmail]/Mit Stern', ['STARRED']),  # German
            ('[Google Mail]/Mit Stern', ['STARRED']),  # German UK
            ('[Gmail]/Trash', ['TRASH']),
            ('[Google Mail]/Bin', ['TRASH']),  # UK uses "Bin"
            ('[Gmail]/Papelera', ['TRASH']),  # Spanish
            ('[Google Mail]/Papelera', ['TRASH']),  # Spanish UK
            ('[Gmail]/Papierkorb', ['TRASH']),  # German
            ('[Google Mail]/Papierkorb', ['TRASH']),  # German UK
            ('Sent', ['SENT']),
            ('Starred', ['STARRED']),
            ('Trash', ['TRASH']),
        ]
        
        # Track message IDs to avoid duplicates
        seen_msg_ids = set()
        
        try:
            # Try fetching from Gmail-specific folders first
            for folder_name, labels_to_apply in folders_to_check:
                try:
                    # Quote folder names with special characters for IMAP
                    # Gmail folder names need to be quoted if they contain brackets
                    if '[' in folder_name or ']' in folder_name:
                        quoted_folder = f'"{folder_name}"'
                    else:
                        quoted_folder = folder_name
                    
                    status, _ = self.imap.select(quoted_folder, readonly=True)
                    if status != 'OK':
                        continue
                    
                    logger.info(f"Successfully accessed folder: {folder_name}")
                    
                    _, message_numbers = self.imap.search(None, 'ALL')
                    if not message_numbers[0]:
                        logger.info(f"No messages in {folder_name}")
                        continue
                    
                    # Get latest messages from this folder - fetch more per folder for complete sync
                    # Take up to 20 messages per folder to get good coverage across folders
                    folder_msg_ids = message_numbers[0].split()[-20:]
                    logger.info(f"Found {len(message_numbers[0].split())} total messages in {folder_name}, fetching latest {len(folder_msg_ids)}")
                    
                    for msg_id in folder_msg_ids:
                        msg_id_str = msg_id.decode()
                        if msg_id_str in seen_msg_ids:
                            continue
                        seen_msg_ids.add(msg_id_str)
                        
                        try:
                            _, msg_data = self.imap.fetch(msg_id, '(RFC822)')
                            email_body = msg_data[0][1]
                            email_message = email.message_from_bytes(email_body)
                            
                            # Extract body content
                            body_text = ""
                            body_html = ""
                            
                            if email_message.is_multipart():
                                for part in email_message.walk():
                                    content_type = part.get_content_type()
                                    content_disposition = str(part.get("Content-Disposition"))
                                    
                                    if "attachment" in content_disposition:
                                        continue
                                    
                                    try:
                                        if content_type == "text/plain" and not body_text:
                                            body_text = part.get_payload(decode=True).decode(errors='ignore')
                                        elif content_type == "text/html" and not body_html:
                                            body_html = part.get_payload(decode=True).decode(errors='ignore')
                                    except:
                                        pass
                            else:
                                try:
                                    payload = email_message.get_payload(decode=True)
                                    if payload:
                                        body_text = payload.decode(errors='ignore')
                                except:
                                    body_text = str(email_message.get_payload())
                            
                            # Determine labels based on folder
                            labels = labels_to_apply if labels_to_apply else ['INBOX']
                            
                            logger.info(f"IMAP message from {folder_name} assigned labels: {labels}")
                            
                            messages.append({
                                'id': msg_id_str,
                                'subject': email_message.get('Subject', ''),
                                'from': email_message.get('From', ''),
                                'to': email_message.get('To', ''),
                                'date': email_message.get('Date', ''),
                                'body_text': body_text,
                                'body_html': body_html,
                                'is_read': True,  # IMAP doesn't easily provide unread status
                                'labels': labels
                            })
                        except Exception as e:
                            logger.error(f"Failed to fetch IMAP message {msg_id_str}: {e}")
                            continue
                    
                except Exception as e:
                    logger.warning(f"Could not access folder {folder_name}: {e}")
                    continue
            
            # Return all messages from all folders (already limited per folder above)
            logger.info(f"Total messages fetched across all folders: {len(messages)}")
            return messages
            
        except Exception as e:
            logger.error(f"IMAP list_messages failed: {e}")
            return []
    
    async def get_message(self, message_id: str) -> Dict:
        """Get specific IMAP message"""
        try:
            self.imap.select('INBOX')
            _, msg_data = self.imap.fetch(message_id.encode(), '(RFC822)')
            email_body = msg_data[0][1]
            email_message = email.message_from_bytes(email_body)
            
            # Get body
            body = ""
            if email_message.is_multipart():
                for part in email_message.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode()
                        break
            else:
                body = email_message.get_payload(decode=True).decode()
            
            return {
                'id': message_id,
                'subject': email_message.get('Subject', ''),
                'from': email_message.get('From', ''),
                'to': email_message.get('To', ''),
                'date': email_message.get('Date', ''),
                'body': body
            }
        except Exception:
            return {}
    
    async def send_message(self, to: str, subject: str, body: str) -> bool:
        """Send SMTP message"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = to
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, settings.SMTP_PORT)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception:
            return False


class OutlookProvider(EmailProvider):
    """Microsoft Outlook/Office 365 OAuth provider"""
    
    def __init__(self):
        self.access_token = None
        self.graph_endpoint = "https://graph.microsoft.com/v1.0"
    
    def get_auth_url(self) -> str:
        """Get Outlook OAuth authorization URL"""
        base_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        params = {
            "client_id": settings.OUTLOOK_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": settings.OUTLOOK_REDIRECT_URI,
            "scope": "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access",
            "state": "outlook_auth"
        }
        from urllib.parse import urlencode
        return f"{base_url}?{urlencode(params)}"
    
    async def exchange_code(self, code: str) -> dict:
        """Exchange authorization code for access token"""
        import httpx
        
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        data = {
            'client_id': settings.OUTLOOK_CLIENT_ID,
            'client_secret': settings.OUTLOOK_CLIENT_SECRET,
            'code': code,
            'redirect_uri': settings.OUTLOOK_REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            tokens = response.json()
            
        return {
            'access_token': tokens['access_token'],
            'refresh_token': tokens.get('refresh_token'),
            'expires_in': tokens.get('expires_in', 3600)
        }
    
    async def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with Outlook"""
        try:
            self.access_token = credentials.get('access_token')
            
            # Test connection
            import httpx
            headers = {'Authorization': f'Bearer {self.access_token}'}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.graph_endpoint}/me",
                    headers=headers
                )
                response.raise_for_status()
                
            return True
        except Exception as e:
            logger.error(f"Outlook auth failed: {e}")
            return False
    
    async def list_messages(self, max_results: int = 100) -> List[Dict]:
        """List Outlook messages using Microsoft Graph API"""
        import httpx
        
        try:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            url = f"{self.graph_endpoint}/me/mailFolders/inbox/messages"
            params = {'$top': max_results, '$orderby': 'receivedDateTime desc'}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
            
            messages = []
            for msg in data.get('value', []):
                messages.append({
                    'id': msg['id'],
                    'thread_id': msg.get('conversationId'),
                    'subject': msg.get('subject', ''),
                    'sender': msg['from']['emailAddress']['address'] if msg.get('from') else '',
                    'recipient': msg['toRecipients'][0]['emailAddress']['address'] if msg.get('toRecipients') else '',
                    'body_text': msg.get('bodyPreview', ''),
                    'body_html': msg['body']['content'] if msg.get('body') else '',
                    'received_at': msg.get('receivedDateTime'),
                    'labels': [msg.get('parentFolderId', 'inbox')],
                })
            
            return messages
        except Exception as e:
            logger.error(f"Failed to list Outlook messages: {e}")
            return []
    
    async def get_message(self, message_id: str) -> Dict:
        """Get specific Outlook message"""
        import httpx
        
        try:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            url = f"{self.graph_endpoint}/me/messages/{message_id}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                msg = response.json()
            
            return {
                'id': msg['id'],
                'thread_id': msg.get('conversationId'),
                'subject': msg.get('subject', ''),
                'sender': msg['from']['emailAddress']['address'] if msg.get('from') else '',
                'recipient': msg['toRecipients'][0]['emailAddress']['address'] if msg.get('toRecipients') else '',
                'body_text': msg.get('bodyPreview', ''),
                'body_html': msg['body']['content'] if msg.get('body') else '',
                'received_at': msg.get('receivedDateTime'),
                'labels': [msg.get('parentFolderId', 'inbox')],
            }
        except Exception as e:
            logger.error(f"Failed to get Outlook message: {e}")
            return {}
    
    async def send_message(self, to: str, subject: str, body: str) -> bool:
        """Send Outlook message"""
        import httpx
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            message = {
                'message': {
                    'subject': subject,
                    'body': {
                        'contentType': 'HTML',
                        'content': body
                    },
                    'toRecipients': [{'emailAddress': {'address': to}}]
                },
                'saveToSentItems': 'true'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.graph_endpoint}/me/sendMail",
                    headers=headers,
                    json=message
                )
                response.raise_for_status()
            
            logger.info(f"Email sent to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False


class UniversalEmailService:
    """Unified service for all email providers"""
    
    def __init__(self):
        self.providers = {
            'gmail': GmailProvider(),
            'outlook': OutlookProvider(),
            'imap': IMAPProvider(),
            'yahoo': IMAPProvider(),  # Yahoo uses IMAP
        }
    
    def get_provider(self, provider_name: str) -> EmailProvider:
        """Get email provider instance"""
        return self.providers.get(provider_name.lower())
    
    async def connect(self, provider_name: str, credentials: Dict) -> bool:
        """Connect to email provider"""
        provider = self.get_provider(provider_name)
        if provider:
            return await provider.authenticate(credentials)
        return False


# Global instance
_universal_email_service = None


def get_email_service() -> UniversalEmailService:
    """Get or create the global email service instance"""
    global _universal_email_service
    if _universal_email_service is None:
        _universal_email_service = UniversalEmailService()
    return _universal_email_service
