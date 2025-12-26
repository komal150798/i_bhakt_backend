-- ===================================================================
-- KARMA & MANIFESTATION UNIFIED SCHEMA
-- ===================================================================
-- Architecture: 3 Core Tables (replaces 24+ tables)
-- Domain-Driven Design: Master Data, User Actions, Analytics
-- ===================================================================
-- Run this SQL file to create the unified karma schema
-- Usage: npm run karma:schema:create
-- ===================================================================

-- ===================================================================
-- TABLE 1: karma_manifest_master_data
-- ===================================================================
-- Purpose: ALL reference/master data for karma patterns, habits, 
--          categories, templates, rules, keywords
-- Type discriminator: GOOD_KARMA | BAD_KARMA | HABIT | CATEGORY | 
--                     TEMPLATE | RULE | KEYWORD
-- ===================================================================

CREATE TABLE IF NOT EXISTS karma_manifest_master_data (
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- Discriminator: What type of master data this is
    data_type VARCHAR(30) NOT NULL CHECK (data_type IN (
        'GOOD_KARMA', 'BAD_KARMA', 'HABIT',
        'KARMA_CATEGORY', 'MANIFEST_CATEGORY', 'MANIFEST_SUBCATEGORY',
        'TEMPLATE_RITUAL', 'TEMPLATE_TO_MANIFEST', 'TEMPLATE_NOT_TO_MANIFEST',
        'TEMPLATE_ALIGNMENT', 'TEMPLATE_INSIGHT', 'TEMPLATE_SUMMARY',
        'ENERGY_RULE', 'KARMA_WEIGHT_RULE', 'KEYWORD'
    )),
    
    -- Common audit fields
    added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    added_by BIGINT NULL,
    modify_by BIGINT NULL,
    
    -- Core content fields (nullable, type-specific)
    title TEXT NULL,                    -- For templates, habits, categories
    text TEXT NULL,                     -- For karma actions, templates
    slug VARCHAR(200) NULL,             -- For categories, keywords
    description TEXT NULL,              -- For all types
    
    -- Category/subcategory relationships
    category_slug VARCHAR(200) NULL,    -- For karma categorization
    subcategory_slug VARCHAR(200) NULL, -- For manifestation subcategories
    parent_category_id BIGINT NULL,     -- FK to same table for hierarchy
    
    -- Karma/Habit specific
    pattern_key VARCHAR(100) NULL,      -- Pattern identifier
    weight DECIMAL(10,2) NULL,          -- Scoring weight
    match_count INTEGER NULL DEFAULT 0, -- Usage count
    priority INTEGER NULL DEFAULT 1,    -- For habits, templates
    duration_days INTEGER NULL,         -- For habits
    
    -- Template/rule specific
    template_text TEXT NULL,            -- Template content with {{vars}}
    pattern TEXT NULL,                  -- Regex/pattern for rules
    energy_state VARCHAR(50) NULL,      -- For energy rules
    karma_type VARCHAR(20) NULL CHECK (karma_type IN ('good', 'bad', 'neutral')),
    
    -- Extensibility: ALL type-specific fields go here
    metadata JSONB NULL,
    
    -- Constraints for data integrity
    CONSTRAINT chk_karma_action CHECK (
        data_type NOT IN ('GOOD_KARMA', 'BAD_KARMA') OR (
            text IS NOT NULL AND weight IS NOT NULL
        )
    ),
    CONSTRAINT chk_habit CHECK (
        data_type != 'HABIT' OR (
            title IS NOT NULL AND description IS NOT NULL AND 
            pattern_key IS NOT NULL AND duration_days IS NOT NULL
        )
    ),
    CONSTRAINT chk_category CHECK (
        data_type NOT IN ('KARMA_CATEGORY', 'MANIFEST_CATEGORY', 'MANIFEST_SUBCATEGORY') OR (
            slug IS NOT NULL AND title IS NOT NULL
        )
    ),
    CONSTRAINT chk_template CHECK (
        data_type NOT LIKE 'TEMPLATE_%' OR template_text IS NOT NULL
    ),
    CONSTRAINT chk_rule CHECK (
        data_type NOT IN ('ENERGY_RULE', 'KARMA_WEIGHT_RULE') OR pattern IS NOT NULL
    )
);

-- Self-referencing FK for category hierarchy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_parent_category'
    ) THEN
        ALTER TABLE karma_manifest_master_data
            ADD CONSTRAINT fk_parent_category 
            FOREIGN KEY (parent_category_id) 
            REFERENCES karma_manifest_master_data(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_type ON karma_manifest_master_data(data_type);
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_status ON karma_manifest_master_data(is_enabled, is_deleted);
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_slug ON karma_manifest_master_data(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_unique_id ON karma_manifest_master_data(unique_id);
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_pattern_key ON karma_manifest_master_data(pattern_key) WHERE pattern_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_category_slug ON karma_manifest_master_data(category_slug) WHERE category_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karma_manifest_master_metadata ON karma_manifest_master_data USING GIN(metadata) WHERE metadata IS NOT NULL;

-- ===================================================================
-- TABLE 2: user_life_actions
-- ===================================================================
-- Purpose: ALL user-generated content and tracking
-- Action types: KARMA_ENTRY | MANIFESTATION | MANIFEST_LOG | 
--               KARMA_PATTERN | SCORE_SUMMARY
-- ===================================================================

CREATE TABLE IF NOT EXISTS user_life_actions (
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- User reference (supports both BIGINT and UUID)
    user_id BIGINT NOT NULL,
    user_uuid UUID NULL,
    
    -- Discriminator: What type of action this is
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
        'KARMA_ENTRY', 'MANIFESTATION', 'MANIFEST_LOG', 
        'KARMA_PATTERN', 'SCORE_SUMMARY'
    )),
    
    -- Common audit fields
    added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    added_by BIGINT NULL,
    modify_by BIGINT NULL,
    
    -- Common content fields
    title TEXT NULL,                    -- For manifestations
    text TEXT NULL,                     -- For karma entries, logs
    entry_date TIMESTAMPTZ NULL,        -- Entry/action date
    
    -- Karma entry specific
    karma_type VARCHAR(20) NULL CHECK (karma_type IN ('good', 'bad', 'neutral')),
    score DECIMAL(10,2) NULL,           -- Karma score
    category_slug VARCHAR(200) NULL,    -- Category
    category_name VARCHAR(200) NULL,    -- Category display name
    self_assessment VARCHAR(20) NULL CHECK (self_assessment IN ('good', 'bad', 'neutral')),
    
    -- Manifestation specific
    emotional_state VARCHAR(50) NULL,
    target_date DATE NULL,
    resonance_score DECIMAL(5,2) NULL,
    alignment_score DECIMAL(5,2) NULL,
    antrashaakti_score DECIMAL(5,2) NULL,
    mahaadha_score DECIMAL(5,2) NULL,
    coherence_score DECIMAL(5,2) NULL,
    mfp_score DECIMAL(5,2) NULL,
    astro_support_index DECIMAL(5,2) NULL,
    is_archived BOOLEAN NULL DEFAULT FALSE,
    is_locked BOOLEAN NULL DEFAULT FALSE,
    
    -- Pattern specific
    pattern_key VARCHAR(100) NULL,
    pattern_name VARCHAR(200) NULL,
    frequency_count INTEGER NULL DEFAULT 0,
    total_score_impact DECIMAL(10,2) NULL,
    detected_date TIMESTAMPTZ NULL,
    first_detected_date TIMESTAMPTZ NULL,
    last_detected_date TIMESTAMPTZ NULL,
    
    -- Score summary specific
    period_type VARCHAR(20) NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start TIMESTAMPTZ NULL,
    period_end TIMESTAMPTZ NULL,
    karma_score DECIMAL(10,2) NULL,     -- Aggregated karma score (0-100)
    total_good_actions INTEGER NULL DEFAULT 0,
    total_bad_actions INTEGER NULL DEFAULT 0,
    total_neutral_actions INTEGER NULL DEFAULT 0,
    total_positive_points DECIMAL(10,2) NULL,
    total_negative_points DECIMAL(10,2) NULL,
    
    -- Complex structures stored in JSONB
    ai_analysis JSONB NULL,             -- AI analysis results
    action_windows JSONB NULL,          -- Manifestation action windows
    progress_tracking JSONB NULL,       -- Progress tracking data
    tips JSONB NULL,                    -- Tips array
    insights JSONB NULL,                -- Insights array
    sample_actions JSONB NULL,          -- Sample actions for patterns
    top_patterns JSONB NULL,            -- Top patterns for summaries
    
    -- Observations/notes
    observations TEXT NULL,
    
    -- Extensibility
    metadata JSONB NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_life_actions_user ON user_life_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_life_actions_type ON user_life_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_life_actions_status ON user_life_actions(is_enabled, is_deleted);
CREATE INDEX IF NOT EXISTS idx_user_life_actions_entry_date ON user_life_actions(entry_date) WHERE entry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_life_actions_user_type ON user_life_actions(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_user_life_actions_karma_type ON user_life_actions(karma_type) WHERE karma_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_life_actions_pattern_key ON user_life_actions(pattern_key) WHERE pattern_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_life_actions_period ON user_life_actions(user_id, period_type, period_start) WHERE period_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_life_actions_metadata ON user_life_actions USING GIN(metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_life_actions_ai_analysis ON user_life_actions USING GIN(ai_analysis) WHERE ai_analysis IS NOT NULL;

-- ===================================================================
-- TABLE 3: user_scores_cache
-- ===================================================================
-- Purpose: Denormalized cache for fast score lookups
--          Replaces user_karma_scores, provides current snapshot
-- ===================================================================

CREATE TABLE IF NOT EXISTS user_scores_cache (
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    user_id BIGINT UNIQUE NOT NULL,
    user_uuid UUID NULL,
    
    -- Karma scores
    karma_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    karma_positive_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    karma_negative_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Manifestation scores (optional, for future)
    manifestation_score DECIMAL(10,2) NULL,
    
    -- Cache metadata
    last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Observations/notes
    observations TEXT NULL,
    
    -- Extensibility
    metadata JSONB NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_scores_cache_user ON user_scores_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_cache_recalculated ON user_scores_cache(last_recalculated_at);
CREATE INDEX IF NOT EXISTS idx_user_scores_cache_metadata ON user_scores_cache USING GIN(metadata) WHERE metadata IS NOT NULL;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE karma_manifest_master_data IS 'Unified master data: karma patterns, habits, categories, templates, rules, keywords';
COMMENT ON TABLE user_life_actions IS 'Unified user actions: karma entries, manifestations, patterns, score summaries';
COMMENT ON TABLE user_scores_cache IS 'Denormalized user score cache for fast lookups';




