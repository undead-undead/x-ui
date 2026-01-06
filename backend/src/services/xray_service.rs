use crate::errors::ApiResult;
use crate::models::inbound::Inbound;
use crate::models::xray_config::*;
use crate::services::system_service;
use crate::services::system_service::SharedMonitor;
use sqlx::SqlitePool;
use std::env;

pub async fn apply_config(pool: &SqlitePool, monitor: SharedMonitor) -> ApiResult<()> {
    let inbounds = sqlx::query_as::<_, Inbound>("SELECT * FROM inbounds WHERE enable = 1")
        .fetch_all(pool)
        .await?;

    let mut config = XrayConfig::default();

    config.log.loglevel = "error".to_string();
    let cwd = env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let log_dir = cwd.join("logs");
    if !log_dir.exists() {
        let _ = std::fs::create_dir_all(&log_dir);
    }

    config.log.access = Some(log_dir.join("access.log").to_string_lossy().to_string());
    config.log.error = Some(log_dir.join("error.log").to_string_lossy().to_string());

    config.api = ApiConfig {
        tag: "api".to_string(),
        services: vec![
            "HandlerService".to_string(),
            "LoggerService".to_string(),
            "StatsService".to_string(),
        ],
    };

    config.inbounds.push(InboundConfig {
        tag: "api".to_string(),
        port: 10085,
        protocol: "dokodemo-door".to_string(),
        listen: Some("127.0.0.1".to_string()),
        settings: Some(serde_json::json!({
            "address": "127.0.0.1"
        })),
        stream_settings: None,
        sniffing: None,
        allocate: None,
    });

    for inbound in inbounds {
        let tag = inbound
            .tag
            .clone()
            .unwrap_or_else(|| format!("inbound-{}", inbound.id));

        let allocate = inbound
            .allocate
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok());

        let inbound_config = InboundConfig {
            tag,
            port: inbound.port,
            protocol: inbound.protocol.clone(),
            listen: inbound.listen.clone(),
            allocate,
            settings: inbound
                .settings
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok()),
            stream_settings: inbound
                .stream_settings
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok()),
            sniffing: inbound
                .sniffing
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok()),
        };

        config.inbounds.push(inbound_config);
    }

    config.stats = Some(StatsConfig {});

    let mut levels = std::collections::HashMap::new();
    levels.insert(
        "0".to_string(),
        LevelPolicy {
            stats_user_uplink: true,
            stats_user_downlink: true,
            handshake: 4,
            conn_idle: 300,
            uplink_only: 2,
            downlink_only: 5,
            buffer_size: 512,
        },
    );

    config.policy = Some(PolicyConfig {
        levels,
        system: Some(SystemPolicy {
            stats_inbound_uplink: true,
            stats_inbound_downlink: true,
            stats_outbound_uplink: true,
            stats_outbound_downlink: true,
        }),
    });

    config.outbounds.push(OutboundConfig {
        tag: "direct".to_string(),
        protocol: "freedom".to_string(),
        settings: None,
        stream_settings: None,
    });

    config.outbounds.push(OutboundConfig {
        tag: "blocked".to_string(),
        protocol: "blackhole".to_string(),
        settings: None,
        stream_settings: None,
    });

    let mut rules = vec![];

    rules.push(RoutingRule {
        rule_type: "field".to_string(),
        inbound_tag: Some(vec!["api".to_string()]),
        outbound_tag: Some("api".to_string()),
        ..Default::default()
    });

    config.routing = Some(RoutingConfig {
        domain_strategy: "IPIfNonMatch".to_string(),
        rules,
    });

    let config_json = serde_json::to_string_pretty(&config).map_err(|e| {
        crate::errors::ApiError::InternalError(format!("Failed to serialize config: {}", e))
    })?;

    let config_path =
        env::var("XRAY_CONFIG_PATH").unwrap_or_else(|_| "/etc/x-ui/xray.json".to_string());

    if let Some(parent) = std::path::Path::new(&config_path).parent() {
        if !parent.exists() {
            tokio::fs::create_dir_all(parent).await.map_err(|e| {
                crate::errors::ApiError::SystemError(format!(
                    "Failed to create config directory: {}",
                    e
                ))
            })?;
        }
    }

    tokio::fs::write(&config_path, config_json)
        .await
        .map_err(|e| {
            crate::errors::ApiError::SystemError(format!("Failed to write config file: {}", e))
        })?;

    tracing::info!("Xray config generated at: {}", config_path);

    tokio::spawn(async move {
        if let Err(e) = system_service::restart_xray(monitor).await {
            tracing::error!("Background Xray restart failed: {:?}", e);
        } else {
            tracing::info!("Background Xray restart successful");
        }
    });

    Ok(())
}

impl Default for RoutingRule {
    fn default() -> Self {
        Self {
            rule_type: "field".to_string(),
            port: None,
            inbound_tag: None,
            outbound_tag: None,
            ip: None,
            domain: None,
            protocol: None,
        }
    }
}
