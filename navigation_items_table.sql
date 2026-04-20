-- Create navigation_items table for Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS navigation_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    route VARCHAR(200) NOT NULL,
    page_name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample navigation items
INSERT INTO navigation_items (title, icon, route, page_name, order_index, is_active) VALUES
('Dashboard', '📊', '/dashboard.html', 'dashboard', 1, true),
('Scorecard', '📝', '/scorecard.html', 'scorecard', 2, true),
('Manage Users', '👥', '/manage-users.html', 'manage-users', 3, true),
('Analytics', '📈', '/analytics.html', 'analytics', 4, true),
('Settings', '⚙️', '/settings.html', 'settings', 5, true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON navigation_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow read access for anonymous users (for public navigation)
CREATE POLICY "Allow read access for anonymous users" ON navigation_items
    FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_navigation_items_updated_at 
    BEFORE UPDATE ON navigation_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
