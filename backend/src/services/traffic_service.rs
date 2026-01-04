use crate::errors::ApiResult;
use crate::models::inbound::Inbound;
use crate::services::system_service::SharedMonitor;
use crate::services::xray_service;
use sqlx::SqlitePool;
use tokio::process::Command;
use tokio::time::{interval, Duration};

/// 启动流量统计定时任务周期性查询 Xray API
pub fn start_traffic_stats_task(pool: SqlitePool, monitor: SharedMonitor) {
    tokio::spawn(async move {
        // 5s 轮询
        let mut ticker = interval(Duration::from_secs(5));
        loop {
            ticker.tick().await;
            if let Err(e) = update_traffic_stats(&pool, monitor.clone()).await {
                tracing::warn!("Failed to update traffic stats: {:?}", e);
            }
        }
    });
    tracing::info!("Traffic stats task started (polling Xray every 5s)");
}

/// 执行流量统计更新
async fn update_traffic_stats(pool: &SqlitePool, monitor: SharedMonitor) -> ApiResult<()> {
    // 1. 获取所有启用的节点
    let inbounds = sqlx::query_as::<_, Inbound>("SELECT * FROM inbounds WHERE enable = 1")
        .fetch_all(pool)
        .await?;

    if inbounds.is_empty() {
        return Ok(());
    }

    // 2. 获取进程路径 (Xray bin path)
    let xray_bin = std::env::var("XRAY_BIN_PATH").unwrap_or_else(|_| "./bin/xray".to_string());
    let mut needs_reapply = false;

    for inbound in inbounds {
        // 关键逻辑：获取节点标签
        let tag = inbound
            .tag
            .clone()
            .unwrap_or_else(|| format!("inbound-{}", inbound.id));

        // 分别查询上行和下行流量 (reset=true 获取增量)
        let uplink = query_xray_stats(&xray_bin, &tag, "uplink")
            .await
            .unwrap_or(0);
        let downlink = query_xray_stats(&xray_bin, &tag, "downlink")
            .await
            .unwrap_or(0);

        if uplink > 0 || downlink > 0 {
            let new_up = inbound.up + uplink;
            let new_down = inbound.down + downlink;
            let mut enable = 1; // 1 = true (enabled)

            // 检查自动限额
            // if total > 0 (quota set) AND current traffic >= quota
            if inbound.total > 0 && (new_up + new_down) >= inbound.total {
                enable = 0; // Disable node
                needs_reapply = true;
                tracing::info!("Node {} reached traffic quota, disabling.", inbound.remark);
            }

            // 更新数据库
            sqlx::query("UPDATE inbounds SET up = ?, down = ?, enable = ? WHERE id = ?")
                .bind(new_up)
                .bind(new_down)
                .bind(enable)
                .bind(&inbound.id)
                .execute(pool)
                .await?;

            tracing::debug!(
                "Node {} ({}): up={}, down={}, total={}",
                inbound.remark,
                tag,
                new_up,
                new_down,
                inbound.total
            );

            // 稍微停顿，防止突发大量数据库写入锁定
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    }

    // 如果因为超限额禁用了节点，重新应用 Xray 配置
    if needs_reapply {
        if let Err(e) = xray_service::apply_config(pool, monitor).await {
            tracing::error!("Failed to reapply config after quota reached: {}", e);
        }
    }

    Ok(())
}

/// 通过 Xray API 查询流量，支持重置增量
async fn query_xray_stats(xray_bin: &str, tag: &str, direction: &str) -> ApiResult<i64> {
    let stat_name = format!("inbound>>>{}>>>traffic>>>{}", tag, direction);

    let output = Command::new(xray_bin)
        .arg("api")
        .arg("statsquery")
        .arg("--server=127.0.0.1:10085")
        .arg(format!("pattern={}", stat_name))
        .arg("reset=true")
        .output()
        .await
        .map_err(|e| {
            crate::errors::ApiError::SystemError(format!("Xray API call failed: {}", e))
        })?;

    if !output.status.success() {
        return Ok(0);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // 解析输出格式: stat: <name: "..." value: 12345>
    for line in stdout.lines() {
        if line.contains("value:") {
            if let Some(value_str) = line.split("value:").nth(1) {
                let clean_val = value_str.trim().trim_end_matches('>').trim();
                if let Ok(value) = clean_val.parse::<i64>() {
                    return Ok(value);
                }
            }
        }
    }

    Ok(0)
}
