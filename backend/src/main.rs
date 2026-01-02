mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod utils;

use axum::http::Method;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// 自动初始化环境：如果没有 .env 文件，自动创建一个并生成随机密钥
fn auto_init_env() {
    let env_path = std::path::Path::new(".env");
    if !env_path.exists() {
        let secret = uuid::Uuid::new_v4().to_string();
        let content = format!(
            r#"# 自动生成的配置文件 - 首次启动创建
DATABASE_URL=sqlite://data/x-ui.db

# JWT 认证密钥 - 已自动生成强加密随机字符串
JWT_SECRET={}
JWT_EXPIRATION_HOURS=24

# 面板监听配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Xray 核心路径
XRAY_BIN_PATH=./bin/xray
XRAY_CONFIG_PATH=./data/xray.json

# 日志输出详细程度
RUST_LOG=debug,sqlx=warn
"#,
            secret
        );
        if let Err(e) = std::fs::write(env_path, content) {
            eprintln!("无法自动创建 .env 文件: {}", e);
        } else {
            println!("首次运行: 已自动生成 .env 配置文件和随机加密密钥");
        }
    }

    // 确保必要目录存在
    let _ = std::fs::create_dir_all("data");
    let _ = std::fs::create_dir_all("logs");
    let _ = std::fs::create_dir_all("bin");
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 0. 自动初始化环境 (实现傻瓜式一键运行)
    auto_init_env();

    // 1. 优先处理命令行参数
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--reset" || arg == "-r") {
        // 加载环境变量（数据库路径可能在里面）
        dotenvy::dotenv().ok();
        // 初始化数据库连接
        let pool = db::init_pool().await?;
        // 执行重置逻辑
        services::auth_service::reset_admin(&pool).await?;
        println!("管理员账号已重置为: admin / admin");
        // 显式退出，不启动 Web 服务
        return Ok(());
    }

    // 2. 加载环境变量并继续正常启动
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

    // 初始化系统监控
    let monitor = std::sync::Arc::new(std::sync::Mutex::new(
        services::system_service::SystemMonitor::new(),
    ));

    // 默认环境变量优化
    if std::env::var("XRAY_BIN_PATH").is_err() {
        std::env::set_var("XRAY_BIN_PATH", "./bin/xray");
    }
    if std::env::var("XRAY_CONFIG_PATH").is_err() {
        std::env::set_var("XRAY_CONFIG_PATH", "./data/xray.json");
    }

    // 启动时自动应用一次配置并尝试启动 Xray
    if let Err(e) = services::xray_service::apply_config(&pool, monitor.clone()).await {
        tracing::error!("启动时应用配置失败: {}", e);
    } else {
        tracing::info!("初始 Xray 核心已成功启动或更新");
    }

    // 安全改进: 配置 CORS - 区分开发和生产环境
    #[cfg(debug_assertions)]
    let cors_layer = {
        tracing::info!("开发环境: 允许 localhost:5173 访问");
        CorsLayer::new()
            .allow_origin(
                "http://localhost:5173"
                    .parse::<axum::http::HeaderValue>()
                    .unwrap(),
            )
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::DELETE,
                Method::PATCH,
            ])
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
            ])
            .allow_credentials(true)
    };

    #[cfg(not(debug_assertions))]
    let cors_layer = {
        let allowed_origin = std::env::var("ALLOWED_ORIGIN").unwrap_or_else(|_| {
            tracing::warn!("ALLOWED_ORIGIN 未设置，使用默认值");
            "https://your-domain.com".to_string()
        });

        tracing::info!("生产环境: 只允许 {} 访问", allowed_origin);

        CorsLayer::new()
            .allow_origin(allowed_origin.parse::<axum::http::HeaderValue>().unwrap())
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::DELETE,
                Method::PATCH,
            ])
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
            ])
            .allow_credentials(true)
    };

    // 安全改进: 构建路由并添加安全中间件
    let app = routes::create_router(pool, monitor)
        // 添加安全响应头中间件 (CSP, X-Frame-Options 等)
        .layer(axum::middleware::from_fn(
            middleware::security::security_headers_middleware,
        ))
        // 添加改进的 CORS 配置
        .layer(cors_layer);

    tracing::info!("安全中间件已启用: CSP, X-Frame-Options, X-XSS-Protection");

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!(
        "X-UI Backend listening on http://{}",
        listener.local_addr()?
    );

    axum::serve(listener, app).await?;

    Ok(())
}
