// src/models/protocol_settings.rs
// Xray 协议设置完整数据模型

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ==================== VLESS Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VlessSettings {
    /// 客户端列表
    pub clients: Vec<VlessClient>,

    /// 解密方式(通常为 "none")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decryption: Option<String>,

    /// 回落配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fallbacks: Option<Vec<Fallback>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VlessClient {
    /// 客户端 UUID
    pub id: String,

    /// 流控: "", "xtls-rprx-vision"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flow: Option<String>,

    /// 用户等级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<u8>,

    /// 用户邮箱(标识)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
}

// ==================== VMess Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VmessSettings {
    /// 客户端列表
    pub clients: Vec<VmessClient>,

    /// 默认配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<VmessDefault>,

    /// 绕行配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detour: Option<VmessDetour>,

    /// 禁用不安全加密
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disable_insecure_encryption: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VmessClient {
    /// 客户端 UUID
    pub id: String,

    /// 额外 ID(旧版,已弃用)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alter_id: Option<u16>,

    /// 用户等级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<u8>,

    /// 用户邮箱(标识)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VmessDefault {
    /// 默认用户等级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<u8>,

    /// 默认额外 ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alter_id: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VmessDetour {
    /// 绕行到的出站标签
    pub to: String,
}

// ==================== Trojan Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TrojanSettings {
    /// 客户端列表
    pub clients: Vec<TrojanClient>,

    /// 回落配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fallbacks: Option<Vec<Fallback>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrojanClient {
    /// 客户端密码
    pub password: String,

    /// 用户等级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<u8>,

    /// 用户邮箱(标识)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// 流控
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flow: Option<String>,
}

// ==================== Shadowsocks Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShadowsocksSettings {
    /// 加密方法
    pub method: String,

    /// 密码(单用户模式)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,

    /// 网络类型: "tcp", "udp", "tcp,udp"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network: Option<String>,

    /// 客户端列表(多用户模式)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clients: Option<Vec<ShadowsocksClient>>,

    /// 是否启用 UDP over TCP
    #[serde(skip_serializing_if = "Option::is_none")]
    pub udp_over_tcp: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShadowsocksClient {
    /// 客户端密码
    pub password: String,

    /// 加密方法(可选,覆盖全局设置)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,

    /// 用户邮箱(标识)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// 用户等级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<u8>,
}

// ==================== Fallback Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Fallback {
    /// 名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// ALPN 协议
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alpn: Option<String>,

    /// 路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 目标地址
    pub dest: String,

    /// PROXY protocol 版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xver: Option<u8>,
}

// ==================== Sniffing Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SniffingSettings {
    /// 是否启用嗅探
    pub enabled: bool,

    /// 目标覆盖列表: ["http", "tls", "quic", "fakedns"]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dest_override: Option<Vec<String>>,

    /// 仅使用元数据
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata_only: Option<bool>,

    /// 仅用于路由
    #[serde(skip_serializing_if = "Option::is_none")]
    pub route_only: Option<bool>,
}

// ==================== Allocate Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AllocateSettings {
    /// 分配策略: "always", "random"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strategy: Option<String>,

    /// 刷新间隔(分钟)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh: Option<u32>,

    /// 并发数
    #[serde(skip_serializing_if = "Option::is_none")]
    pub concurrency: Option<u32>,
}

// ==================== 辅助函数 ====================

/// Shadowsocks 支持的加密方法
pub const SHADOWSOCKS_METHODS: &[&str] = &[
    "aes-128-gcm",
    "aes-256-gcm",
    "chacha20-ietf-poly1305",
    "xchacha20-ietf-poly1305",
    "2022-blake3-aes-128-gcm",
    "2022-blake3-aes-256-gcm",
    "2022-blake3-chacha20-poly1305",
];

/// 验证 Shadowsocks 加密方法
pub fn is_valid_shadowsocks_method(method: &str) -> bool {
    SHADOWSOCKS_METHODS.contains(&method)
}

// ==================== 统一协议设置枚举 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "protocol", rename_all = "lowercase")]
pub enum ProtocolSettings {
    Vless(VlessSettings),
    Vmess(VmessSettings),
    Trojan(TrojanSettings),
    Shadowsocks(ShadowsocksSettings),
}

impl ProtocolSettings {
    /// 获取协议名称
    pub fn protocol_name(&self) -> &str {
        match self {
            ProtocolSettings::Vless(_) => "vless",
            ProtocolSettings::Vmess(_) => "vmess",
            ProtocolSettings::Trojan(_) => "trojan",
            ProtocolSettings::Shadowsocks(_) => "shadowsocks",
        }
    }

    /// 转换为 JSON Value
    pub fn to_json_value(&self) -> serde_json::Value {
        match self {
            ProtocolSettings::Vless(s) => serde_json::to_value(s).unwrap_or_default(),
            ProtocolSettings::Vmess(s) => serde_json::to_value(s).unwrap_or_default(),
            ProtocolSettings::Trojan(s) => serde_json::to_value(s).unwrap_or_default(),
            ProtocolSettings::Shadowsocks(s) => serde_json::to_value(s).unwrap_or_default(),
        }
    }
}
