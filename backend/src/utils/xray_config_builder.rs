// src/utils/xray_config_builder.rs
// Xray 配置构建辅助工具

use crate::models::inbound::Inbound;
use crate::models::protocol_settings::*;
use crate::models::stream_settings::*;
use serde_json::{json, Value};

/// 构建完整的 Xray Inbound 配置
pub fn build_xray_inbound(inbound: &Inbound) -> Value {
    let mut config = json!({
        "tag": inbound.tag.clone().unwrap_or_else(|| format!("inbound-{}", inbound.id)),
        "port": inbound.port,
        "protocol": inbound.protocol,
    });

    // 添加 listen 字段
    if let Some(listen) = &inbound.listen {
        if !listen.is_empty() {
            config["listen"] = json!(listen);
        }
    }

    // 添加 allocate 配置
    if let Some(allocate_str) = &inbound.allocate {
        if let Ok(allocate) = serde_json::from_str::<Value>(allocate_str) {
            config["allocate"] = allocate;
        }
    }

    // 添加 settings 配置
    if let Some(settings_str) = &inbound.settings {
        if let Ok(settings) = serde_json::from_str::<Value>(settings_str) {
            config["settings"] = settings;
        }
    }

    // 添加 streamSettings 配置
    if let Some(stream_settings_str) = &inbound.stream_settings {
        if let Ok(stream_settings) = serde_json::from_str::<Value>(stream_settings_str) {
            config["streamSettings"] = stream_settings;
        }
    }

    // 添加 sniffing 配置
    if let Some(sniffing_str) = &inbound.sniffing {
        if let Ok(sniffing) = serde_json::from_str::<Value>(sniffing_str) {
            // 如果 sniffing 是简单的 boolean,转换为完整配置
            if let Some(enabled) = sniffing.as_bool() {
                config["sniffing"] = json!({
                    "enabled": enabled,
                    "destOverride": ["http", "tls", "quic", "fakedns"]
                });
            } else {
                config["sniffing"] = sniffing;
            }
        }
    }

    config
}

/// 构建 VLESS 协议配置
pub fn build_vless_settings(
    clients: Vec<VlessClient>,
    decryption: Option<String>,
    fallbacks: Option<Vec<Fallback>>,
) -> Value {
    let mut settings = json!({
        "clients": clients,
        "decryption": decryption.unwrap_or_else(|| "none".to_string())
    });

    if let Some(fb) = fallbacks {
        settings["fallbacks"] = json!(fb);
    }

    settings
}

/// 构建 VMess 协议配置
pub fn build_vmess_settings(clients: Vec<VmessClient>) -> Value {
    json!({
        "clients": clients
    })
}

/// 构建 Trojan 协议配置
pub fn build_trojan_settings(
    clients: Vec<TrojanClient>,
    fallbacks: Option<Vec<Fallback>>,
) -> Value {
    let mut settings = json!({
        "clients": clients
    });

    if let Some(fb) = fallbacks {
        settings["fallbacks"] = json!(fb);
    }

    settings
}

/// 构建 Shadowsocks 协议配置
pub fn build_shadowsocks_settings(
    method: String,
    password: Option<String>,
    network: Option<String>,
    clients: Option<Vec<ShadowsocksClient>>,
) -> Value {
    let mut settings = json!({
        "method": method
    });

    if let Some(pwd) = password {
        settings["password"] = json!(pwd);
    }

    if let Some(net) = network {
        settings["network"] = json!(net);
    } else {
        settings["network"] = json!("tcp,udp");
    }

    if let Some(cls) = clients {
        settings["clients"] = json!(cls);
    }

    settings
}

/// 构建 StreamSettings 配置
pub fn build_stream_settings(
    network: Option<String>,
    security: Option<String>,
    tcp_settings: Option<TcpSettings>,
    ws_settings: Option<WsSettings>,
    http_settings: Option<HttpSettings>,
    grpc_settings: Option<GrpcSettings>,
    tls_settings: Option<TlsSettings>,
    reality_settings: Option<RealitySettings>,
    sockopt: Option<Sockopt>,
) -> Value {
    let mut stream = json!({});

    if let Some(net) = network {
        stream["network"] = json!(net);
    }

    if let Some(sec) = security {
        stream["security"] = json!(sec);
    }

    if let Some(tcp) = tcp_settings {
        stream["tcpSettings"] = json!(tcp);
    }

    if let Some(ws) = ws_settings {
        stream["wsSettings"] = json!(ws);
    }

    if let Some(http) = http_settings {
        stream["httpSettings"] = json!(http);
    }

    if let Some(grpc) = grpc_settings {
        stream["grpcSettings"] = json!(grpc);
    }

    if let Some(tls) = tls_settings {
        stream["tlsSettings"] = json!(tls);
    }

    if let Some(reality) = reality_settings {
        stream["realitySettings"] = json!(reality);
    }

    if let Some(sock) = sockopt {
        stream["sockopt"] = json!(sock);
    }

    stream
}

/// 验证协议配置
pub fn validate_protocol_settings(protocol: &str, settings: &Value) -> Result<(), String> {
    match protocol {
        "vless" => {
            // 验证必须有 clients 和 decryption
            if !settings.get("clients").is_some() {
                return Err("VLESS 协议必须包含 clients 配置".to_string());
            }
            Ok(())
        }
        "vmess" => {
            if !settings.get("clients").is_some() {
                return Err("VMess 协议必须包含 clients 配置".to_string());
            }
            Ok(())
        }
        "trojan" => {
            if !settings.get("clients").is_some() {
                return Err("Trojan 协议必须包含 clients 配置".to_string());
            }
            Ok(())
        }
        "shadowsocks" => {
            if !settings.get("method").is_some() {
                return Err("Shadowsocks 协议必须包含 method 配置".to_string());
            }
            if let Some(method) = settings.get("method").and_then(|m| m.as_str()) {
                if !is_valid_shadowsocks_method(method) {
                    return Err(format!("不支持的 Shadowsocks 加密方法: {}", method));
                }
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

/// 验证 StreamSettings 配置
pub fn validate_stream_settings(stream_settings: &Value) -> Result<(), String> {
    // 验证 security 和对应的设置是否匹配
    if let Some(security) = stream_settings.get("security").and_then(|s| s.as_str()) {
        match security {
            "tls" => {
                if !stream_settings.get("tlsSettings").is_some() {
                    return Err("启用 TLS 时必须提供 tlsSettings 配置".to_string());
                }
            }
            "reality" => {
                if !stream_settings.get("realitySettings").is_some() {
                    return Err("启用 Reality 时必须提供 realitySettings 配置".to_string());
                }
                // 验证 Reality 必需字段
                if let Some(reality) = stream_settings.get("realitySettings") {
                    if !reality.get("dest").is_some() {
                        return Err("Reality 配置必须包含 dest 字段".to_string());
                    }
                    if !reality.get("serverNames").is_some() {
                        return Err("Reality 配置必须包含 serverNames 字段".to_string());
                    }
                    if !reality.get("privateKey").is_some() {
                        return Err("Reality 配置必须包含 privateKey 字段".to_string());
                    }
                    if !reality.get("shortIds").is_some() {
                        return Err("Reality 配置必须包含 shortIds 字段".to_string());
                    }
                }
            }
            "none" => {}
            _ => {
                return Err(format!("不支持的 security 类型: {}", security));
            }
        }
    }

    Ok(())
}

/// 合并默认配置和用户配置
pub fn merge_with_defaults(protocol: &str, user_settings: Option<Value>) -> Value {
    let defaults = match protocol {
        "vless" => json!({
            "decryption": "none"
        }),
        "vmess" => json!({}),
        "trojan" => json!({}),
        "shadowsocks" => json!({
            "network": "tcp,udp"
        }),
        _ => json!({}),
    };

    if let Some(mut user) = user_settings {
        // 合并用户配置和默认配置
        if let Some(defaults_obj) = defaults.as_object() {
            if let Some(user_obj) = user.as_object_mut() {
                for (key, value) in defaults_obj {
                    user_obj.entry(key).or_insert(value.clone());
                }
            }
        }
        user
    } else {
        defaults
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_shadowsocks_method() {
        assert!(is_valid_shadowsocks_method("aes-128-gcm"));
        assert!(is_valid_shadowsocks_method("chacha20-ietf-poly1305"));
        assert!(!is_valid_shadowsocks_method("invalid-method"));
    }

    #[test]
    fn test_validate_protocol_settings() {
        let vless_settings = json!({
            "clients": [{"id": "test-uuid"}],
            "decryption": "none"
        });
        assert!(validate_protocol_settings("vless", &vless_settings).is_ok());

        let invalid_vless = json!({});
        assert!(validate_protocol_settings("vless", &invalid_vless).is_err());
    }
}
