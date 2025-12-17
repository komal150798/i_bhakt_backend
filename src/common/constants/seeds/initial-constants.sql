-- Initial Constants for I-Bhakt Application
-- All keywords, words, and sentences used across APIs
-- NO hardcoded words - everything comes from here

-- Manifestation Positive Words (for basic scoring)
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.positive_words',
  'manifestation',
  'Positive Manifestation Words',
  ARRAY['want', 'will', 'achieve', 'create', 'manifest', 'attract', 'deserve', 'receive', 'become', 'transform'],
  'Words that indicate positive manifestation intent',
  true
);

-- Manifestation Negative Words (for basic scoring)
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.negative_words',
  'manifestation',
  'Negative Manifestation Words',
  ARRAY['can''t', 'won''t', 'impossible', 'never', 'hate', 'fear', 'cannot', 'unable', 'fail', 'lose'],
  'Words that indicate negative or limiting beliefs',
  true
);

-- Manifestation Positive Keywords (for resonance scoring)
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.positive_keywords',
  'manifestation',
  'Positive Keywords for Resonance',
  ARRAY['grateful', 'abundant', 'blessed', 'joyful', 'peaceful', 'confident', 'successful', 'fulfilled', 'loved', 'healthy', 'prosperous', 'aligned', 'flowing', 'manifesting', 'attracting', 'receiving', 'creating', 'empowered', 'radiant', 'vibrant'],
  'Keywords that boost resonance score in manifestation analysis',
  true
);

-- Manifestation Negative Keywords (for blockage detection)
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.negative_keywords',
  'manifestation',
  'Negative Keywords for Blockage Detection',
  ARRAY['doubt', 'fear', 'worry', 'anxiety', 'stress', 'struggle', 'lack', 'cannot', 'impossible', 'never', 'always fail', 'too hard', 'blocked', 'stuck', 'limited', 'poor', 'sick', 'broken', 'hate', 'anger', 'resentment', 'jealousy', 'envy'],
  'Keywords that indicate blockages or limiting beliefs',
  true
);

-- Category Planets Mapping
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.category_planets',
  'manifestation',
  'Category Planetary Mappings',
  '{
    "relationship": {"primary": "venus", "secondary": "jupiter", "negative": "saturn"},
    "career": {"primary": "mercury", "secondary": "jupiter", "negative": "saturn"},
    "money": {"primary": "jupiter", "secondary": "venus", "negative": "rahu"},
    "health": {"primary": "mars", "secondary": "sun", "negative": "ketu"},
    "spiritual": {"primary": "jupiter", "secondary": "ketu", "negative": "rahu"},
    "love": {"primary": "venus", "secondary": "jupiter", "negative": "saturn"},
    "wealth": {"primary": "jupiter", "secondary": "venus", "negative": "rahu"},
    "family": {"primary": "moon", "secondary": "venus", "negative": "saturn"},
    "friendship": {"primary": "mercury", "secondary": "venus", "negative": "saturn"},
    "self_growth": {"primary": "sun", "secondary": "jupiter", "negative": "saturn"},
    "spirituality": {"primary": "jupiter", "secondary": "ketu", "negative": "rahu"},
    "creativity": {"primary": "venus", "secondary": "mercury", "negative": "saturn"}
  }'::jsonb,
  'Planetary mappings for each manifestation category',
  true
);

-- Energy State Patterns
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.energy_state_patterns',
  'manifestation',
  'Energy State Detection Patterns',
  '{
    "aligned": ["confident", "clear", "focused", "determined", "positive", "grateful", "ready", "excited", "motivated", "certain", "sure", "definite"],
    "scattered": ["many", "multiple", "various", "different", "several", "too many", "confused", "unclear", "mixed", "chaotic"],
    "blocked": ["cannot", "impossible", "never", "always fail", "too hard", "afraid", "scared", "worried", "fear", "doubt", "worry", "resistance", "stuck"],
    "doubtful": ["maybe", "hopefully", "if only", "wish", "try", "attempt", "perhaps", "might", "uncertain", "unsure", "maybe", "possibly"],
    "burned_out": ["tired", "exhausted", "drained", "giving up", "too much effort", "overwhelmed", "stressed", "frustrated", "weary"]
  }'::jsonb,
  'Pattern keywords for detecting energy states in manifestations',
  true
);

-- Common Phrases and Sentences
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.common_phrases',
  'manifestation',
  'Common Manifestation Phrases',
  ARRAY['I am', 'I will', 'I deserve', 'I attract', 'I create', 'I manifest', 'I receive', 'I become', 'I am grateful for', 'I am blessed with'],
  'Common phrases used in positive manifestations',
  true
);

-- Scoring Base Values
INSERT INTO app_constants (key, category, name, value, description, is_active) VALUES
(
  'manifestation.scoring_base',
  'manifestation',
  'Scoring Base Values',
  '{
    "resonance_base": 40,
    "alignment_base": 40,
    "antrashaakti_base": 40,
    "mahaadha_base": 0,
    "word_count_bonus_per_10_words": 1,
    "positive_keyword_bonus": 6,
    "negative_keyword_penalty": 5,
    "clarity_bonus": 10,
    "specificity_bonus": 10
  }'::jsonb,
  'Base values and multipliers for manifestation scoring',
  true
);

-- Note: You can add more constants as needed:
-- - Karma action words
-- - Astrological terms
-- - Ritual phrases
-- - Any other words/sentences used in APIs

