-- =============================================================================
-- Twedar Platform - Complete Database Schema
-- =============================================================================
-- Run this SQL on a fresh PostgreSQL database to set up all required tables.
-- This includes Better Auth core tables, plugin tables, and custom app tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- 1. Better Auth Core Tables
-- ---------------------------------------------------------------------------

-- 1.1 User table (core + admin plugin fields + custom fields)
CREATE TABLE IF NOT EXISTS "user" (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    "emailVerified"   BOOLEAN NOT NULL DEFAULT FALSE,
    image             TEXT,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Admin plugin fields
    role              TEXT DEFAULT 'user',
    banned            BOOLEAN DEFAULT FALSE,
    "banReason"       TEXT,
    "banExpires"      TIMESTAMPTZ,
    -- Custom fields (Twedar-specific)
    "accountType"     TEXT DEFAULT 'couple'
);

-- 1.2 Session table (core + organization plugin + admin plugin fields)
CREATE TABLE IF NOT EXISTS "session" (
    id                       TEXT PRIMARY KEY,
    "userId"                 TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token                    TEXT NOT NULL UNIQUE,
    "expiresAt"              TIMESTAMPTZ NOT NULL,
    "ipAddress"              TEXT,
    "userAgent"              TEXT,
    "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Organization plugin fields
    "activeOrganizationId"   TEXT,
    -- Admin plugin fields
    "impersonatedBy"         TEXT
);

-- 1.3 Account table
CREATE TABLE IF NOT EXISTS "account" (
    id                        TEXT PRIMARY KEY,
    "userId"                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accountId"               TEXT NOT NULL,
    "providerId"              TEXT NOT NULL,
    "accessToken"             TEXT,
    "refreshToken"            TEXT,
    "accessTokenExpiresAt"    TIMESTAMPTZ,
    "refreshTokenExpiresAt"   TIMESTAMPTZ,
    scope                     TEXT,
    "idToken"                 TEXT,
    password                  TEXT,
    "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 Verification table
CREATE TABLE IF NOT EXISTS "verification" (
    id              TEXT PRIMARY KEY,
    identifier      TEXT NOT NULL,
    value           TEXT NOT NULL,
    "expiresAt"     TIMESTAMPTZ NOT NULL,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Organization Plugin Tables
-- ---------------------------------------------------------------------------

-- 2.1 Organization table
CREATE TABLE IF NOT EXISTS "organization" (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    logo            TEXT,
    metadata        TEXT,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Member table
CREATE TABLE IF NOT EXISTS "member" (
    id                 TEXT PRIMARY KEY,
    "userId"           TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "organizationId"   TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
    role               TEXT NOT NULL DEFAULT 'member',
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Invitation table
CREATE TABLE IF NOT EXISTS "invitation" (
    id                 TEXT PRIMARY KEY,
    email              TEXT NOT NULL,
    "inviterId"        TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "organizationId"   TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
    role               TEXT,
    status             TEXT NOT NULL DEFAULT 'pending',
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt"        TIMESTAMPTZ NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3. Vendor Feature Tables
-- ---------------------------------------------------------------------------

-- 3.1 Vendor Profiles
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL,
    business_name        TEXT,
    category             JSONB,
    description          TEXT,
    phone_number         TEXT,
    location             TEXT,
    status               TEXT NOT NULL DEFAULT 'registered',
    rejection_reason     TEXT,
    latitude             DECIMAL(10,8),
    longitude            DECIMAL(11,8),
    price_range_min      NUMERIC,
    price_range_max      NUMERIC,
    portfolio            JSONB DEFAULT '[]',
    years_of_experience  INTEGER,
    social_media         JSONB,
    rating               NUMERIC(3,2) DEFAULT 0,
    review_count         INTEGER DEFAULT 0,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Vendor Documents
CREATE TABLE IF NOT EXISTS vendor_documents (
    id                 TEXT PRIMARY KEY,
    vendor_profile_id  TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    document_type      TEXT NOT NULL,
    file_url           TEXT NOT NULL,
    uploaded_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. Realtime Feature Tables (Notifications & Chat)
-- ---------------------------------------------------------------------------

-- 4.1 Notifications
CREATE TABLE IF NOT EXISTS notification (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    type        VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    metadata    JSONB NOT NULL DEFAULT '{}',
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Conversations
CREATE TABLE IF NOT EXISTS conversation (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_one   TEXT NOT NULL,
    participant_two   TEXT NOT NULL,
    last_message_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (participant_one, participant_two)
);

-- 4.3 Chat Messages
CREATE TABLE IF NOT EXISTS chat_message (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id         TEXT NOT NULL,
    content           TEXT NOT NULL,
    read              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------

-- Better Auth indexes
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("userId");
CREATE INDEX IF NOT EXISTS idx_member_user_id ON "member"("userId");
CREATE INDEX IF NOT EXISTS idx_member_org_id ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS idx_invitation_org_id ON "invitation"("organizationId");

-- Vendor indexes
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON vendor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_profile_id ON vendor_documents(vendor_profile_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_geo ON vendor_profiles USING gist (latitude, longitude);

-- Realtime indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants ON conversation(participant_one, participant_two);
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation ON chat_message(conversation_id, created_at DESC);
