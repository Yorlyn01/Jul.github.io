-- ========================================
-- Yorlyn Portfolio CMS 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ========================================

-- 1. 作品表
CREATE TABLE IF NOT EXISTS works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. 留言表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. 页面浏览统计表
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. 点赞计数触发器
CREATE OR REPLACE FUNCTION increment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE works SET likes_count = likes_count + 1 WHERE id = NEW.work_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_likes ON likes;
CREATE TRIGGER trg_increment_likes
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_likes();

-- 6. 启用 RLS（行级安全）
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 7. 策略：所有人可读作品
CREATE POLICY "Anyone can read published works" ON works
  FOR SELECT USING (status = 'published');

-- 8. 策略：所有人可点赞
CREATE POLICY "Anyone can insert likes" ON likes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read likes" ON likes
  FOR SELECT USING (true);

-- 9. 策略：所有人可提交留言（待审核）
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read approved comments" ON comments
  FOR SELECT USING (status = 'approved');

-- 10. 策略：所有人可记录浏览
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- 11. 策略：认证用户可管理所有数据（管理员）
CREATE POLICY "Admins can manage works" ON works
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage comments" ON comments
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage page views" ON page_views
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage likes" ON likes
  FOR ALL USING (auth.role() = 'authenticated');

-- 12. 插入示例数据
INSERT INTO works (title, description, category, tags, order_index, status)
VALUES 
  ('我来过 | We Were Here', '3D 地球 + 足迹打卡系统，记录人类存在的每一个瞬间', 'Web', ARRAY['Three.js', 'Interactive', 'WebGL'], 0, 'published'),
  ('品牌设计项目', '为多个品牌打造独特的视觉识别系统', 'Branding', ARRAY['Logo', 'VI', 'Identity'], 1, 'published'),
  ('移动端应用', '完整的 UI/UX 设计与原型开发', 'Mobile', ARRAY['UI', 'UX', 'Figma'], 2, 'published'),
  ('数据可视化', '交互式数据仪表盘设计与开发', 'Data', ARRAY['D3.js', 'Dashboard', 'Analytics'], 3, 'published'),
  ('创意实验', '生成艺术与 Shader 实验项目', 'Creative', ARRAY['Generative', 'Shader', 'Art'], 4, 'published'),
  ('开源工具', '开发者工具与效率插件', 'Tool', ARRAY['Open Source', 'Developer', 'Tool'], 5, 'published')
ON CONFLICT DO NOTHING;

-- 13. 创建索引
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_order ON works(order_index);
CREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments(work_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_likes_work_id ON likes(work_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

-- 完成！
-- 接下来在 Supabase Authentication > Users 中创建管理员账号
-- 或在 Supabase SQL Editor 中执行：
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) 
-- VALUES ('admin@yorlyn.com', crypt('yourpassword', gen_salt('bf')), now());
