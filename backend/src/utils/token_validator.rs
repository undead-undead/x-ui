// src/utils/token_validator.rs
// Token 验证工具 - 验证 Token 中的密码版本号是否与数据库一致

use crate::{
    errors::{ApiError, ApiResult},
    utils::jwt::Claims,
};
use sqlx::SqlitePool;

/// 验证 Token 是否有效
/// 检查 Token 中的 password_version 是否与数据库中的一致
/// 如果不一致,说明用户修改了密码,Token 应该失效
pub async fn validate_token_freshness(pool: &SqlitePool, claims: &Claims) -> ApiResult<()> {
    let user_id = claims
        .sub
        .parse::<i64>()
        .map_err(|_| ApiError::Unauthorized("Invalid user ID in token".to_string()))?;

    // 从数据库获取用户的最新 password_version
    // 使用 query_as 而不是 query! 宏,避免编译时数据库检查
    let result: Option<(i64,)> = sqlx::query_as("SELECT password_version FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    let db_password_version = result
        .ok_or_else(|| {
            tracing::warn!("Token validation failed: user {} not found", user_id);
            ApiError::Unauthorized("User not found".to_string())
        })?
        .0;

    // 比较 Token 中的 password_version 和数据库中的
    if claims.password_version != db_password_version {
        tracing::warn!(
            "Token invalidated for user {}: password changed (token version: {}, db version: {})",
            user_id,
            claims.password_version,
            db_password_version
        );
        return Err(ApiError::Unauthorized(
            "Token has been invalidated due to password change".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    // 注意: 这些测试需要数据库连接,实际测试时需要设置测试数据库
    // 这里只是示例结构

    #[tokio::test]
    #[ignore] // 需要数据库才能运行
    async fn test_validate_token_freshness() {
        // 这个测试需要实际的数据库连接
        // 在实际项目中,应该使用测试数据库
    }
}
