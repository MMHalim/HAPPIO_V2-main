-- Insert navigation items into existing navigation_items table
-- Run this SQL in your Supabase SQL editor

-- First, let's see what's currently in the table
SELECT * FROM navigation_items ORDER BY order_index;

-- Clear existing data (optional - remove this line if you want to keep existing data)
-- DELETE FROM navigation_items;

-- Insert navigation items
INSERT INTO navigation_items (title, icon, route, page_name, order_index, is_active) VALUES
('Dashboard', '📊', '/dashboard.html', 'dashboard', 1, true),
('Scorecard', '📝', '/scorecard.html', 'scorecard', 2, true),
('Manage Users', '👥', '/manage-users.html', 'manage-users', 3, true),
('Analytics', '📈', '/analytics.html', 'analytics', 4, true),
('Settings', '⚙️', '/settings.html', 'settings', 5, true);

-- Check the final result
SELECT * FROM navigation_items ORDER BY order_index;
