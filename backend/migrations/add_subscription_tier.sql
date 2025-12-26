-- Add subscription tier to users table
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free' NOT NULL;

-- Update storage quotas based on tier
-- Free: 1GB (1073741824 bytes)
-- Pro: 10GB (10737418240 bytes)
-- Premium: 50GB (53687091200 bytes)

-- Add comment explaining tiers
COMMENT ON COLUMN users.subscription_tier IS 'Subscription tier: free (1GB), pro (10GB), premium (50GB)';
COMMENT ON COLUMN users.storage_quota_bytes IS 'Storage quota in bytes, updated based on subscription tier';
