-- ==========================================
-- 日志系统完整建表 SQL (一次性执行)
-- ==========================================
-- 请按顺序执行以下所有 SQL 语句
-- 执行位置：Supabase Dashboard → SQL Editor → New query

-- 1. 创建 logs 表
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

-- 2. 启用 RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 3. 创建访问策略
CREATE POLICY "Allow public read published logs" ON logs
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow authenticated full access" ON logs
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 4. 创建 log_likes 表
CREATE TABLE IF NOT EXISTS log_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE log_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert log_likes" ON log_likes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select log_likes" ON log_likes
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated delete log_likes" ON log_likes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. 创建 log_comments 表
CREATE TABLE IF NOT EXISTS log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
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
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 6. 验证表是否创建成功（可选，执行后会返回表列表）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('logs', 'log_likes', 'log_comments')
ORDER BY table_name;
