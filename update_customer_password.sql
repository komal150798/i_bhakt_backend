-- =====================================================
-- Update Customer Password
-- Password: Komal@1234
-- Encrypted Hash: $2b$10$bFR.vXhedLbEwtv9uD5I1O0suYDxyycmqBlW5OW1wivh2moIqQRIS
-- =====================================================

-- Option 1: Update by email
UPDATE cst_customer
SET password = '$2b$10$bFR.vXhedLbEwtv9uD5I1O0suYDxyycmqBlW5OW1wivh2moIqQRIS',
    modify_date = CURRENT_TIMESTAMP
WHERE email = 'your_email@example.com'  -- Replace with actual email
  AND is_deleted = false;

-- Option 2: Update by phone_number
UPDATE cst_customer
SET password = '$2b$10$bFR.vXhedLbEwtv9uD5I1O0suYDxyycmqBlW5OW1wivh2moIqQRIS',
    modify_date = CURRENT_TIMESTAMP
WHERE phone_number = 'your_phone_number'  -- Replace with actual phone number
  AND is_deleted = false;

-- Option 3: Update by unique_id (if you know the customer's unique_id)
UPDATE cst_customer
SET password = '$2b$10$bFR.vXhedLbEwtv9uD5I1O0suYDxyycmqBlW5OW1wivh2moIqQRIS',
    modify_date = CURRENT_TIMESTAMP
WHERE unique_id = 'your_unique_id_here'  -- Replace with actual unique_id
  AND is_deleted = false;

-- Option 4: Update by id (if you know the customer's id)
UPDATE cst_customer
SET password = '$2b$10$bFR.vXhedLbEwtv9uD5I1O0suYDxyycmqBlW5OW1wivh2moIqQRIS',
    modify_date = CURRENT_TIMESTAMP
WHERE id = 1  -- Replace with actual customer id
  AND is_deleted = false;

-- =====================================================
-- Verify the update (run this after updating)
-- =====================================================
-- SELECT id, email, phone_number, 
--        CASE WHEN password IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status,
--        modify_date
-- FROM cst_customer
-- WHERE (email = 'your_email@example.com' OR phone_number = 'your_phone_number')
--   AND is_deleted = false;


