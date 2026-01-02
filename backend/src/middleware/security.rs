// src/middleware/security.rs
// 安全中间件 - 添加安全响应头

use axum::{
    extract::Request,
    http::{header, HeaderValue},
    middleware::Next,
    response::Response,
};

/// 安全响应头中间件
/// 为所有响应添加安全相关的 HTTP 头
pub async fn security_headers_middleware(req: Request, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();

    // Content-Security-Policy (CSP)
    // 防止 XSS 攻击,限制资源加载来源
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static(
            "default-src 'self'; \
             script-src 'self'; \
             style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
             font-src 'self' https://fonts.gstatic.com; \
             img-src 'self' data: blob:; \
             connect-src 'self'; \
             frame-ancestors 'none'; \
             base-uri 'self'; \
             form-action 'self';",
        ),
    );

    // X-Frame-Options
    // 防止点击劫持攻击
    headers.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));

    // X-Content-Type-Options
    // 防止 MIME 类型嗅探
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );

    // X-XSS-Protection
    // 启用浏览器的 XSS 过滤器
    headers.insert(
        "x-xss-protection",
        HeaderValue::from_static("1; mode=block"),
    );

    // Referrer-Policy
    // 控制 Referer 头的发送
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // Permissions-Policy (formerly Feature-Policy)
    // 控制浏览器功能的使用
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static(
            "geolocation=(), \
             microphone=(), \
             camera=(), \
             payment=(), \
             usb=(), \
             magnetometer=(), \
             gyroscope=(), \
             accelerometer=()",
        ),
    );

    // Strict-Transport-Security (HSTS)
    // 强制使用 HTTPS (仅在生产环境启用)
    #[cfg(not(debug_assertions))]
    headers.insert(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
    );

    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        routing::get,
        Router,
    };
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_security_headers() {
        let app = Router::new()
            .route("/", get(|| async { "Hello" }))
            .layer(axum::middleware::from_fn(security_headers_middleware));

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let headers = response.headers();

        // 验证所有安全头都已设置
        assert!(headers.contains_key(header::CONTENT_SECURITY_POLICY));
        assert!(headers.contains_key(header::X_FRAME_OPTIONS));
        assert!(headers.contains_key(header::X_CONTENT_TYPE_OPTIONS));
        assert!(headers.contains_key("X-XSS-Protection"));
        assert!(headers.contains_key(header::REFERRER_POLICY));
    }
}
