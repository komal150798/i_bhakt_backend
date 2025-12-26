-- =====================================================
-- Kundli Tables Schema for PostgreSQL
-- Execute this script in pgAdmin to create/update tables
-- =====================================================

-- =====================================================
-- 1. KUNDLI TABLE (Main Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS kundli (
    -- BaseEntity columns
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    added_by BIGINT NULL,
    modify_by BIGINT NULL,
    
    -- Kundli specific columns
    user_id BIGINT NOT NULL,
    birth_date DATE NOT NULL,
    birth_time TIME NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    lagna_degrees DECIMAL(12, 8) NULL,
    lagna_name VARCHAR(50) NULL,
    nakshatra VARCHAR(50) NULL,
    pada SMALLINT NULL,
    tithi VARCHAR(50) NULL,
    yoga VARCHAR(50) NULL,
    karana VARCHAR(50) NULL,
    ayanamsa DECIMAL(10, 6) NULL,
    full_data JSONB NULL,
    dasha_timeline JSONB NULL,
    navamsa_data JSONB NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_kundli_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_kundli_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_kundli_modify_by FOREIGN KEY (modify_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for kundli table
CREATE INDEX IF NOT EXISTS idx_kundli_user_id_is_deleted ON kundli(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_kundli_unique_id ON kundli(unique_id);
CREATE INDEX IF NOT EXISTS idx_kundli_is_deleted ON kundli(is_deleted);
CREATE INDEX IF NOT EXISTS idx_kundli_user_id ON kundli(user_id);

-- =====================================================
-- 2. KUNDLI_PLANETS TABLE (Related Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS kundli_planets (
    -- BaseEntity columns
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    added_by BIGINT NULL,
    modify_by BIGINT NULL,
    
    -- KundliPlanet specific columns
    kundli_id BIGINT NOT NULL,
    planet_name VARCHAR(50) NOT NULL,
    longitude_degrees DECIMAL(12, 8) NOT NULL,
    sign_number SMALLINT NOT NULL,
    sign_name VARCHAR(50) NOT NULL,
    house_number SMALLINT NOT NULL,
    nakshatra VARCHAR(50) NULL,
    pada SMALLINT NULL,
    is_retrograde BOOLEAN NOT NULL DEFAULT false,
    speed DECIMAL(12, 8) NULL,
    metadata JSONB NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_kundli_planets_kundli FOREIGN KEY (kundli_id) REFERENCES kundli(id) ON DELETE CASCADE,
    CONSTRAINT fk_kundli_planets_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_kundli_planets_modify_by FOREIGN KEY (modify_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for kundli_planets table
CREATE INDEX IF NOT EXISTS idx_kundli_planets_kundli_id_planet_name ON kundli_planets(kundli_id, planet_name);
CREATE INDEX IF NOT EXISTS idx_kundli_planets_unique_id ON kundli_planets(unique_id);
CREATE INDEX IF NOT EXISTS idx_kundli_planets_is_deleted ON kundli_planets(is_deleted);
CREATE INDEX IF NOT EXISTS idx_kundli_planets_kundli_id ON kundli_planets(kundli_id);

-- =====================================================
-- 3. KUNDLI_HOUSES TABLE (Related Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS kundli_houses (
    -- BaseEntity columns
    id BIGSERIAL PRIMARY KEY,
    unique_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    added_by BIGINT NULL,
    modify_by BIGINT NULL,
    
    -- KundliHouse specific columns
    kundli_id BIGINT NOT NULL,
    house_number SMALLINT NOT NULL,
    cusp_degrees DECIMAL(12, 8) NOT NULL,
    sign_name VARCHAR(50) NOT NULL,
    sign_number SMALLINT NOT NULL,
    metadata JSONB NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_kundli_houses_kundli FOREIGN KEY (kundli_id) REFERENCES kundli(id) ON DELETE CASCADE,
    CONSTRAINT fk_kundli_houses_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_kundli_houses_modify_by FOREIGN KEY (modify_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for kundli_houses table
CREATE INDEX IF NOT EXISTS idx_kundli_houses_kundli_id_house_number ON kundli_houses(kundli_id, house_number);
CREATE INDEX IF NOT EXISTS idx_kundli_houses_unique_id ON kundli_houses(unique_id);
CREATE INDEX IF NOT EXISTS idx_kundli_houses_is_deleted ON kundli_houses(is_deleted);
CREATE INDEX IF NOT EXISTS idx_kundli_houses_kundli_id ON kundli_houses(kundli_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE kundli IS 'Main table storing kundli (birth chart) information for users';
COMMENT ON TABLE kundli_planets IS 'Stores planetary positions and details for each kundli';
COMMENT ON TABLE kundli_houses IS 'Stores house cusp information for each kundli';

COMMENT ON COLUMN kundli.user_id IS 'Reference to the user who owns this kundli';
COMMENT ON COLUMN kundli.birth_date IS 'Date of birth';
COMMENT ON COLUMN kundli.birth_time IS 'Time of birth';
COMMENT ON COLUMN kundli.birth_place IS 'Place of birth name';
COMMENT ON COLUMN kundli.latitude IS 'Latitude of birth place';
COMMENT ON COLUMN kundli.longitude IS 'Longitude of birth place';
COMMENT ON COLUMN kundli.timezone IS 'Timezone of birth place';
COMMENT ON COLUMN kundli.lagna_degrees IS 'Lagna (Ascendant) degrees';
COMMENT ON COLUMN kundli.lagna_name IS 'Lagna (Ascendant) sign name';
COMMENT ON COLUMN kundli.nakshatra IS 'Birth nakshatra';
COMMENT ON COLUMN kundli.pada IS 'Nakshatra pada number';
COMMENT ON COLUMN kundli.tithi IS 'Lunar day (tithi)';
COMMENT ON COLUMN kundli.yoga IS 'Yoga combination';
COMMENT ON COLUMN kundli.karana IS 'Karana';
COMMENT ON COLUMN kundli.ayanamsa IS 'Ayanamsa value used for calculations';
COMMENT ON COLUMN kundli.full_data IS 'Complete kundli calculation data in JSON format';
COMMENT ON COLUMN kundli.dasha_timeline IS 'Dasha timeline data in JSON array format';
COMMENT ON COLUMN kundli.navamsa_data IS 'Navamsa chart data in JSON format';

COMMENT ON COLUMN kundli_planets.kundli_id IS 'Reference to the parent kundli';
COMMENT ON COLUMN kundli_planets.planet_name IS 'Name of the planet (Sun, Moon, Mars, etc.)';
COMMENT ON COLUMN kundli_planets.longitude_degrees IS 'Planetary longitude in degrees';
COMMENT ON COLUMN kundli_planets.sign_number IS 'Zodiac sign number (1-12)';
COMMENT ON COLUMN kundli_planets.sign_name IS 'Zodiac sign name';
COMMENT ON COLUMN kundli_planets.house_number IS 'House number where planet is placed';
COMMENT ON COLUMN kundli_planets.is_retrograde IS 'Whether the planet is in retrograde motion';
COMMENT ON COLUMN kundli_planets.speed IS 'Planetary speed';
COMMENT ON COLUMN kundli_planets.metadata IS 'Additional planetary metadata in JSON format';

COMMENT ON COLUMN kundli_houses.kundli_id IS 'Reference to the parent kundli';
COMMENT ON COLUMN kundli_houses.house_number IS 'House number (1-12)';
COMMENT ON COLUMN kundli_houses.cusp_degrees IS 'House cusp degrees';
COMMENT ON COLUMN kundli_houses.sign_name IS 'Sign name at house cusp';
COMMENT ON COLUMN kundli_houses.sign_number IS 'Sign number at house cusp';
COMMENT ON COLUMN kundli_houses.metadata IS 'Additional house metadata in JSON format';

-- =====================================================
-- END OF SCRIPT
-- =====================================================


