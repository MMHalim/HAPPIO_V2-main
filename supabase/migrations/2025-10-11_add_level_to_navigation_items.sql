-- Add 'level' column to navigation_items to control role-based visibility
-- Run this in Supabase SQL editor

ALTER TABLE navigation_items
ADD COLUMN IF NOT EXISTS level text;

-- Optional: store multiple roles in a comma-separated string, e.g., 'admin,coach,leader'
-- Example updates:
-- UPDATE navigation_items SET level = 'admin,coach' WHERE page_name = 'analytics';
-- UPDATE navigation_items SET level = '' WHERE page_name = 'dashboard'; -- visible to all

-- Verify
SELECT title, page_name, level FROM navigation_items ORDER BY order_index;