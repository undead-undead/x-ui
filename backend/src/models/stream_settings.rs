// src/models/stream_settings.rs
// Xray StreamSettings 完整数据模型

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// StreamSettings 主配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StreamSettings {
    /// 传输协议: tcp, ws, grpc, h2, xhttp, kcp, quic, httpupgrade
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network: Option<String>,

    /// 传输层安全: none, tls, reality
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security: Option<String>,

    /// TCP 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_settings: Option<TcpSettings>,

    /// WebSocket 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ws_settings: Option<WsSettings>,

    /// HTTP/2 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub http_settings: Option<HttpSettings>,

    /// gRPC 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grpc_settings: Option<GrpcSettings>,

    /// XHTTP 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xhttp_settings: Option<XhttpSettings>,

    /// mKCP 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kcp_settings: Option<KcpSettings>,

    /// QUIC 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quic_settings: Option<QuicSettings>,

    /// HTTP Upgrade 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub httpupgrade_settings: Option<HttpUpgradeSettings>,

    /// TLS 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tls_settings: Option<TlsSettings>,

    /// Reality 配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reality_settings: Option<RealitySettings>,

    /// Socket 选项
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sockopt: Option<Sockopt>,
}

// ==================== TCP Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TcpSettings {
    /// 是否接受 PROXY protocol
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accept_proxy_protocol: Option<bool>,

    /// 数据包头部伪装设置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<TcpHeader>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TcpHeader {
    /// 伪装类型: none, http
    #[serde(rename = "type")]
    pub header_type: String,

    /// HTTP 请求伪装
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request: Option<HttpRequest>,

    /// HTTP 响应伪装
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response: Option<HttpResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequest {
    pub version: String,
    pub method: String,
    pub path: Vec<String>,
    pub headers: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    pub version: String,
    pub status: String,
    pub reason: String,
    pub headers: HashMap<String, Vec<String>>,
}

// ==================== WebSocket Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WsSettings {
    /// 是否接受 PROXY protocol
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accept_proxy_protocol: Option<bool>,

    /// WebSocket 路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 自定义 HTTP 头
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<HashMap<String, String>>,

    /// 最大早期数据长度
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_early_data: Option<u32>,

    /// 早期数据头名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub early_data_header_name: Option<String>,
}

// ==================== HTTP/2 Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HttpSettings {
    /// 主机列表
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<Vec<String>>,

    /// HTTP 路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 读取空闲超时(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub read_idle_timeout: Option<u32>,

    /// 健康检查超时(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health_check_timeout: Option<u32>,
}

// ==================== gRPC Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GrpcSettings {
    /// gRPC 服务名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_name: Option<String>,

    /// 是否启用多路复用模式
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multi_mode: Option<bool>,

    /// 空闲超时(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idle_timeout: Option<u32>,

    /// 健康检查超时(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health_check_timeout: Option<u32>,

    /// 允许无流
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permit_without_stream: Option<bool>,

    /// 初始窗口大小
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_windows_size: Option<u32>,
}

// ==================== XHTTP Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct XhttpSettings {
    /// 模式
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,

    /// 路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 主机
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,

    /// 额外配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<HashMap<String, serde_json::Value>>,
}

// ==================== mKCP Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KcpSettings {
    /// 最大传输单元
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mtu: Option<u32>,

    /// 传输时间间隔(毫秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tti: Option<u32>,

    /// 上行链路容量(MB/s)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uplink_capacity: Option<u32>,

    /// 下行链路容量(MB/s)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub downlink_capacity: Option<u32>,

    /// 是否启用拥塞控制
    #[serde(skip_serializing_if = "Option::is_none")]
    pub congestion: Option<bool>,

    /// 读缓冲大小(MB)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub read_buffer_size: Option<u32>,

    /// 写缓冲大小(MB)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub write_buffer_size: Option<u32>,

    /// 数据包头部伪装
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<KcpHeader>,

    /// 种子(可选)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KcpHeader {
    /// 伪装类型: none, srtp, utp, wechat-video, dtls, wireguard
    #[serde(rename = "type")]
    pub header_type: String,
}

// ==================== QUIC Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QuicSettings {
    /// 加密方式: none, aes-128-gcm, chacha20-poly1305
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security: Option<String>,

    /// 加密密钥
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,

    /// 数据包头部伪装
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<QuicHeader>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuicHeader {
    /// 伪装类型: none, srtp, utp, wechat-video, dtls, wireguard
    #[serde(rename = "type")]
    pub header_type: String,
}

// ==================== HTTP Upgrade Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HttpUpgradeSettings {
    /// 是否接受 PROXY protocol
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accept_proxy_protocol: Option<bool>,

    /// 路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 主机
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,

    /// 自定义头
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<HashMap<String, String>>,
}

// ==================== TLS Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TlsSettings {
    /// 服务器名称指示(SNI)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_name: Option<String>,

    /// 应用层协议协商
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alpn: Option<Vec<String>>,

    /// 证书配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificates: Option<Vec<Certificate>>,

    /// 禁用系统根证书
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disable_system_root: Option<bool>,

    /// 启用会话恢复
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_session_resumption: Option<bool>,

    /// TLS 指纹
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fingerprint: Option<String>,

    /// 允许不安全连接
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allow_insecure: Option<bool>,

    /// 固定证书链 SHA256
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pinned_peer_certificate_chain_sha256: Option<Vec<String>>,

    /// 最小 TLS 版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_version: Option<String>,

    /// 最大 TLS 版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_version: Option<String>,

    /// 密码套件
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cipher_suites: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Certificate {
    /// 证书用途: encipherment, verify, issue
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<String>,

    /// 证书文件路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificate_file: Option<String>,

    /// 密钥文件路径
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_file: Option<String>,

    /// 证书内容(PEM 格式)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificate: Option<Vec<String>>,

    /// 密钥内容(PEM 格式)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<Vec<String>>,

    /// OCSP Stapling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ocsp_stapling: Option<u32>,

    /// 单证书模式
    #[serde(skip_serializing_if = "Option::is_none")]
    pub one_time_loading: Option<bool>,
}

// ==================== Reality Settings ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RealitySettings {
    /// 是否显示调试信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show: Option<bool>,

    /// 目标地址(必填)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dest: Option<String>,

    /// PROXY protocol 版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xver: Option<u8>,

    /// 服务器名称列表(必填)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_names: Option<Vec<String>>,

    /// 私钥(必填)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_key: Option<String>,

    /// 最小客户端版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_client_ver: Option<String>,

    /// 最大客户端版本
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_client_ver: Option<String>,

    /// 最大时间差(毫秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_time_diff: Option<u64>,

    /// 短 ID 列表(必填)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub short_ids: Option<Vec<String>>,

    /// 指纹
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fingerprint: Option<String>,

    /// 服务器端口
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_port: Option<u16>,

    /// 公钥(客户端使用)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_key: Option<String>,

    /// Spider X
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spider_x: Option<String>,
}

// ==================== Socket Options ====================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Sockopt {
    /// SO_MARK 标记
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mark: Option<u32>,

    /// TCP 快速打开
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_fast_open: Option<bool>,

    /// 透明代理模式: redirect, tproxy, off
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tproxy: Option<String>,

    /// 域名解析策略: AsIs, UseIP, UseIPv4, UseIPv6
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain_strategy: Option<String>,

    /// 代理拨号器
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dialer_proxy: Option<String>,

    /// 是否接受 PROXY protocol
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accept_proxy_protocol: Option<bool>,

    /// TCP Keep-Alive 间隔(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_keep_alive_interval: Option<u32>,

    /// TCP Keep-Alive 空闲时间(秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_keep_alive_idle: Option<u32>,

    /// TCP 用户超时(毫秒)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_user_timeout: Option<u32>,

    /// TCP 拥塞控制算法
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_congestion: Option<String>,

    /// 绑定网络接口
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface: Option<String>,

    /// 仅 IPv6
    #[serde(skip_serializing_if = "Option::is_none")]
    pub v6only: Option<bool>,

    /// TCP 窗口限制
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_window_clamp: Option<u32>,

    /// 多路径 TCP
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_mptcp: Option<bool>,

    /// TCP 无延迟
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_no_delay: Option<bool>,

    /// TCP 最大段大小
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tcp_max_seg: Option<u32>,
}
