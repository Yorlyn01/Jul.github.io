-- Likes for log entries
CREATE TABLE IF NOT EXISTS log_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id text NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE log_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert log_likes" ON log_likes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select log_likes" ON log_likes
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated delete log_likes" ON log_likes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comments for log entries
CREATE TABLE IF NOT EXISTS log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id text NOT NULL,
  name text NOT NULL,
  email text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert log_comments" ON log_comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select approved log_comments" ON log_comments
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow authenticated all log_comments" ON log_comments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Trigger to count log_likes per entry (optional helper view)
-- CREATE OR REPLACE VIEW log_like_counts AS
--   SELECT entry_id, COUNT(*) as likes_count FROM log_likes GROUP BY entry_id;
