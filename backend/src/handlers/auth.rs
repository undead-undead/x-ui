// src/handlers/auth.rs
// 认证相关 HTTP 处理器

use axum::{extract::State, Json};
use sqlx::SqlitePool;

use crate::{
    errors::ApiResult,
    middleware::auth::AuthUser,
    models::user::{ChangePasswordRequest, LoginRequest, LoginResponse},
    services::auth_service,
    utils::response::ApiResponse,
};

/// POST /api/auth/login
pub async fn login(
    State(pool): State<SqlitePool>,
    Json(req): Json<LoginRequest>,
) -> ApiResult<ApiResponse<LoginResponse>> {
    let response = auth_service::login(&pool, req).await?;
    Ok(ApiResponse::success_with_msg(response, "Login successful"))
}

/// POST /api/auth/logout
pub async fn logout(_user: AuthUser) -> ApiResult<ApiResponse<()>> {
    // JWT 是无状态的，logout 主要在前端清除 token
    // 后端可以选择记录日志
    Ok(ApiResponse::success_no_data("Logout successful"))
}

/// POST /api/auth/change-password
pub async fn change_password(
    State(pool): State<SqlitePool>,
    user: AuthUser,
    Json(req): Json<ChangePasswordRequest>,
) -> ApiResult<ApiResponse<()>> {
    auth_service::change_password(&pool, user.user_id, req).await?;
    Ok(ApiResponse::success_no_data(
        "Password changed successfully",
    ))
}

/// GET /api/auth/verify
pub async fn verify(user: AuthUser) -> ApiResult<ApiResponse<AuthUser>> {
    Ok(ApiResponse::success(user))
}

/// POST /api/auth/update
pub async fn update_credentials(
    State(pool): State<SqlitePool>,
    Json(req): Json<crate::models::user::UpdateCredentialsRequest>,
) -> ApiResult<ApiResponse<()>> {
    auth_service::update_credentials(&pool, req).await?;
    Ok(ApiResponse::success_no_data(
        "Credentials updated successfully",
    ))
}
