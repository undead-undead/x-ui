-- 003_extend_inbound_fields.sql
-- 扩展 inbound 表字段以支持完整的 Xray 配置

-- 添加 tag 字段(用于路由)
ALTER TABLE inbounds ADD COLUMN tag TEXT;

-- 添加 listen 字段(监听地址)
ALTER TABLE inbounds ADD COLUMN listen TEXT;

-- 添加 allocate 字段(端口分配策略,JSON 格式)
ALTER TABLE inbounds ADD COLUMN allocate TEXT;

-- 为 tag 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_inbounds_tag ON inbounds(tag);

-- 为现有记录设置默认 tag(使用 id 作为 tag)
UPDATE inbounds SET tag = 'inbound-' || id WHERE tag IS NULL;
