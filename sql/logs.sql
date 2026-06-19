-- Create logs table for daily log entries
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  media_urls text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft'))
);

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published logs
CREATE POLICY "Allow public read published logs" ON logs
  FOR SELECT USING (status = 'published');

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" ON logs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
