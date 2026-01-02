#!/bin/bash

# X-UI 后端 Rust 项目初始化脚本
# 使用方法: chmod +x init_backend.sh && ./init_backend.sh

set -e

echo "🦀 开始初始化 X-UI Rust 后端项目..."

# 1. 创建项目
echo "📁 创建 Cargo 项目..."
cd /home/biubiuboy/x-ui
cargo new backend --name x-ui-backend
cd backend

# 2. 创建目录结构
echo "📁 创建项目目录结构..."
mkdir -p src/{config,models,db,handlers,services,middleware,utils,routes,errors}
mkdir -p migrations
mkdir -p tests
mkdir -p data

# 3. 创建 Cargo.toml
echo "📝 配置 Cargo.toml..."
cat > Cargo.toml << 'EOF'
[package]
name = "x-ui-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web 框架
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1.42", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "trace", "compression-gzip", "fs"] }

# 序列化
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# 数据库
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite"] }

# 认证
jsonwebtoken = "9.3"
argon2 = "0.5"

# 配置管理
dotenvy = "0.15"

# 日志
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 错误处理
anyhow = "1.0"
thiserror = "2.0"

# 系统监控
sysinfo = "0.33"

# 时间处理
chrono = { version = "0.4", features = ["serde"] }

# UUID 生成
uuid = { version = "1.11", features = ["v4", "serde"] }

# Xray 进程管理
async-process = "2.3"

[dev-dependencies]
axum-test = "16.3"
EOF

# 4. 创建 .env.example
echo "📝 创建 .env.example..."
cat > .env.example << 'EOF'
# 数据库配置
DATABASE_URL=sqlite://data/x-ui.db

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
JWT_EXPIRATION_HOURS=1

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Xray 配置
XRAY_BIN_PATH=/usr/local/bin/xray
XRAY_CONFIG_PATH=/etc/x-ui/xray.json

# 日志配置
RUST_LOG=debug,sqlx=warn
EOF

# 5. 复制到 .env
cp .env.example .env

# 6. 创建初始迁移脚本
echo "📝 创建数据库迁移脚本..."
cat > migrations/001_init.sql << 'EOF'
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 入站节点表
CREATE TABLE IF NOT EXISTS inbounds (
    id TEXT PRIMARY KEY,
    remark TEXT NOT NULL,
    protocol TEXT NOT NULL,
    port INTEGER NOT NULL,
    enable BOOLEAN DEFAULT 1,
    settings TEXT,
    stream_settings TEXT,
    sniffing TEXT,
    up BIGINT DEFAULT 0,
    down BIGINT DEFAULT 0,
    total BIGINT DEFAULT 0,
    expiry BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 面板设置表
CREATE TABLE IF NOT EXISTS panel_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    listen_ip TEXT DEFAULT '',
    port INTEGER DEFAULT 33789,
    web_root TEXT DEFAULT '/',
    ssl_cert_path TEXT DEFAULT '',
    ssl_key_path TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inbounds_enable ON inbounds(enable);
CREATE INDEX IF NOT EXISTS idx_inbounds_protocol ON inbounds(protocol);

-- 默认管理员 (用户名: admin, 密码: admin - 需要后续修改)
-- 这是临时密码，首次运行后会自动使用 Argon2 重新哈希
INSERT OR IGNORE INTO users (id, username, password_hash) 
VALUES (1, 'admin', 'temporary');

-- 默认面板配置
INSERT OR IGNORE INTO panel_settings (id, listen_ip, port, web_root)
VALUES (1, '', 33789, '/');
EOF

# 7. 创建 .gitignore
echo "📝 创建 .gitignore..."
cat > .gitignore << 'EOF'
/target
.env
data/*.db
data/*.db-shm
data/*.db-wal
*.log
.DS_Store
EOF

# 8. 创建基础源文件
echo "📝 创建基础源文件..."

# src/main.rs
cat > src/main.rs << 'EOF'
mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod utils;

use axum::Server;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 加载环境变量
    dotenvy::dotenv().ok();

    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "debug,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 初始化数据库
    let pool = db::init_pool().await?;
    db::run_migrations(&pool).await?;

    // 初始化默认管理员密码
    services::auth_service::init_default_admin(&pool).await?;

    // 构建路由
    let app = routes::create_router(pool).layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    );

    // 启动服务器
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("🚀 X-UI Backend listening on http://{}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
EOF

echo "✅ 项目初始化完成！"
echo ""
echo "📋 下一步操作："
echo "1. cd /home/biubiuboy/x-ui/backend"
echo "2. cargo build  # 首次编译会下载依赖，需要几分钟"
echo "3. cargo run    # 启动后端服务"
echo ""
echo "🔧 开发建议："
echo "- 查看 BACKEND_DEVELOPMENT_PLAN.md 了解详细开发计划"
echo "- 按照阶段顺序开发，先完成认证模块"
echo "- 使用 cargo watch -x run 实现热重载"
echo ""
echo "🦀 Happy Coding!"
