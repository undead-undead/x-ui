-- 添加密码版本号字段
-- 用于在密码修改后自动失效旧的 JWT Token

ALTER TABLE users ADD COLUMN password_version INTEGER NOT NULL DEFAULT 1;

-- 为现有用户设置初始版本号
UPDATE users SET password_version = 1 WHERE password_version IS NULL OR password_version = 0;
