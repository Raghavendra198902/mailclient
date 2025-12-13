-- Initial schema for Universal Email AI Manager
-- Run this directly with psql

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    imap_username VARCHAR(255),
    imap_password VARCHAR(255),
    imap_server VARCHAR(255),
    smtp_server VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_accounts_email ON accounts(email);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    gmail_id VARCHAR(255) NOT NULL UNIQUE,
    thread_id VARCHAR(255),
    subject TEXT,
    sender VARCHAR(255),
    recipient VARCHAR(255),
    body_text TEXT,
    body_html TEXT,
    received_at TIMESTAMP,
    labels TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_messages_gmail_id ON messages(gmail_id);
CREATE INDEX IF NOT EXISTS ix_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS ix_messages_account_id ON messages(account_id);

-- Create message_ml_v2 table
CREATE TABLE IF NOT EXISTS message_ml_v2 (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
    summary_short TEXT,
    summary_long TEXT,
    summary_actionable TEXT,
    suggested_reply TEXT,
    priority_score FLOAT,
    phishing_score FLOAT,
    anomaly_score FLOAT,
    tone_label VARCHAR(50),
    intent_label VARCHAR(50),
    topic_cluster_id INTEGER,
    pii_entities JSONB,
    embedding_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_message_ml_v2_message_id ON message_ml_v2(message_id);

-- Create contact_intelligence table
CREATE TABLE IF NOT EXISTS contact_intelligence (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    rank_score FLOAT,
    interaction_count INTEGER DEFAULT 0,
    graph_node_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_contact_intelligence_email ON contact_intelligence(email);
CREATE INDEX IF NOT EXISTS ix_contact_intelligence_account_id ON contact_intelligence(account_id);

-- Create inbox_health table
CREATE TABLE IF NOT EXISTS inbox_health (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    score FLOAT,
    breakdown JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_inbox_health_account_id ON inbox_health(account_id);

-- Create alembic version table for migration tracking
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);

-- Insert initial migration version
INSERT INTO alembic_version (version_num) VALUES ('001') ON CONFLICT DO NOTHING;
