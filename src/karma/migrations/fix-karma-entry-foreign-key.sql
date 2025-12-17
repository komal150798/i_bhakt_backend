-- Fix KarmaEntry foreign key constraint to reference cst_customer instead of users
-- Run this SQL script in your PostgreSQL database

-- Step 1: Drop the old foreign key constraint
ALTER TABLE karma_entries 
DROP CONSTRAINT IF EXISTS "FK_f72b5330401b89f5f3986706d22";

-- Step 2: Add new foreign key constraint pointing to cst_customer
ALTER TABLE karma_entries
ADD CONSTRAINT "FK_karma_entries_customer" 
FOREIGN KEY (user_id) 
REFERENCES cst_customer(id) 
ON DELETE CASCADE;


