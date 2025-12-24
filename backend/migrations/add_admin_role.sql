-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Make your account an admin (update with your actual user ID)
-- UPDATE users SET is_admin = TRUE WHERE id = 1;
