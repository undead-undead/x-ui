// src/middleware/auth.rs
// JWT 认证中间件

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use sqlx::SqlitePool;

use crate::utils::{jwt, token_validator};

/// 提取 JWT Token 并验证
/// 安全改进: 验证 Token 是否在密码修改后失效
pub async fn auth_middleware(
    State(pool): State<SqlitePool>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 从 Authorization header 提取 token
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // 验证 token 签名和过期时间
    let claims = jwt::verify_token(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // 验证 Token 是否在密码修改后失效
    token_validator::validate_token_freshness(&pool, &claims)
        .await
        .map_err(|e| {
            tracing::warn!("Token validation failed: {:?}", e);
            StatusCode::UNAUTHORIZED
        })?;

    // 将用户信息存入请求扩展中，供后续 handler 使用
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

// 可选的：用于handler中提取用户信息的Extractor
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use serde::Serialize;

#[derive(Serialize)]
pub struct AuthUser {
    pub user_id: i64,
    pub username: String,
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let claims = parts
            .extensions
            .get::<crate::utils::jwt::Claims>()
            .ok_or(StatusCode::UNAUTHORIZED)?;

        let user_id = claims
            .sub
            .parse::<i64>()
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(AuthUser {
            user_id,
            username: claims.username.clone(),
        })
    }
}
