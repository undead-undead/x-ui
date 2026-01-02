// src/db/mod.rs
// 数据库连接池管理

use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::env;

pub async fn init_pool() -> anyhow::Result<SqlitePool> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:data/x-ui.db".to_string());

    tracing::info!("Connecting to database: {}", database_url);

    // 确保数据目录存在
    std::fs::create_dir_all("data")?;

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    tracing::info!("Database connected successfully");

    Ok(pool)
}

pub async fn run_migrations(pool: &SqlitePool) -> anyhow::Result<()> {
    tracing::info!("Running database migrations...");

    // 读取迁移脚本
    let migration_sql = include_str!("../../migrations/001_init.sql");

    // 执行迁移
    sqlx::query(migration_sql).execute(pool).await?;

    tracing::info!("Migrations completed successfully");

    Ok(())
}
