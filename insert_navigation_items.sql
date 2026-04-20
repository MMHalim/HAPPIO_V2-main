-- Insert navigation items into existing navigation_items table
-- Run this SQL in your Supabase SQL editor

-- Insert sample navigation items (only if they don't already exist)
INSERT INTO navigation_items (title, icon, route, page_name, order_index, is_active, level) VALUES
('Dashboard', '📊', '/dashboard/', 'dashboard', 1, true, ''),
('Scorecard', '📝', '/scorecard.html', 'scorecard', 2, true, 'coach,leader,admin'),
('Manage Users', '👥', '/manage-users.html', 'manage-users', 3, true, 'admin'),
('Analytics', '📈', '/analytics.html', 'analytics', 4, true, 'coach,admin'),
('Settings', '⚙️', '/settings.html', 'settings', 5, true, 'admin')
ON CONFLICT (title) DO NOTHING;

-- Check what items are currently in the table
SELECT * FROM navigation_items ORDER BY order_index;
