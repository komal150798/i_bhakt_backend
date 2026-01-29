-- Migration Script: Add Profile Columns to cst_customer Table
-- Date: 2025-01-XX
-- Description: Adds separate columns for life_role, relationship_status, interests, and current_city

-- Add life_role column
ALTER TABLE cst_customer 
ADD COLUMN IF NOT EXISTS life_role VARCHAR(100) NULL 
COMMENT 'Life role: Working Professional, Student, Homemaker, Entrepreneur, Retired, Other';

-- Add relationship_status column
ALTER TABLE cst_customer 
ADD COLUMN IF NOT EXISTS relationship_status VARCHAR(50) NULL 
COMMENT 'Relationship status: Single, Married, Divorced, Widowed';

-- Add interests column
ALTER TABLE cst_customer 
ADD COLUMN IF NOT EXISTS interests TEXT NULL 
COMMENT 'User interests (free text)';

-- Add current_city column
ALTER TABLE cst_customer 
ADD COLUMN IF NOT EXISTS current_city VARCHAR(255) NULL 
COMMENT 'Current city of residence';

-- Create indexes for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_customer_life_role ON cst_customer(life_role) WHERE life_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_relationship_status ON cst_customer(relationship_status) WHERE relationship_status IS NOT NULL;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cst_customer' 
    AND column_name IN ('life_role', 'relationship_status', 'interests', 'current_city')
ORDER BY column_name;

