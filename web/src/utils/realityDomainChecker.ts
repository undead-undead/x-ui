import { inboundApi } from '../api/inbound';

/**
 * Reality 域名适配性检测工具 (V2.0 深度优化版)
 */

export interface DomainCheckResult {
    isValid: boolean;
    message: string;
    details?: string;
    score?: number;
    warning?: string;
}

// 全球通用、极少屏蔽机房 IP 且支持 TLS 1.3 的顶级域名
const PREMIUM_DOMAINS = [
    'microsoft.com',
    'apple.com',
    'cisco.com',
    'icloud.com',
    'azure.microsoft.com',
    'raw.githubusercontent.com',
    'amazon.com',
    'cloudflare.com',
    'steamcommunity.com'
];

/**
 * 校验域名格式
 */
function isValidDomainFormat(domain: string): boolean {
    const pattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}$/i;
    return pattern.test(domain);
}

/**
 * 风险评估 (保持轻量，供同步调用)
 */
function checkDomainRisk(domain: string): { isRisk: boolean; reason?: string; penalty: number } {
    const d = domain.toLowerCase();

    // 1. 中国大陆限制
    if (d.endsWith('.cn') || d.includes('baidu.com') || d.includes('qq.com') || d.includes('gov.cn')) {
        return { isRisk: true, penalty: 40, reason: '⚠️ 地区限制：检测到中国大陆域名。使用境内域名作为 Reality 目标会导致严重的流量回流风险和即时审查。' };
    }

    // 2. 敏感机构
    if (d.includes('.gov') || d.includes('.edu')) {
        return { isRisk: true, penalty: 20, reason: '⚠️ 敏感机构：政府或教育机构域名受严格监控，且访问模式单一，极易被统计学特征识别。' };
    }

    // 3. 高风险区域
    const highRiskRegions = ['.ru', '.ir', '.kp', '.sy'];
    if (highRiskRegions.some(r => d.endsWith(r))) {
        return { isRisk: true, penalty: 25, reason: '⚠️ 区域风险：该后缀对应地区受全球网络防火墙高度关注。' };
    }

    // 4. 内容风险
    const contentRisks = ['pornhub', 'gambling', 'casino', 'bet'];
    if (contentRisks.some(r => d.includes(r))) {
        return { isRisk: true, penalty: 50, reason: '⚠️ 内容风险：由于法律和内容审查，此类网站在很多网络环境下会被强制重置连接。' };
    }

    // 5. 财务/金融类
    const financePatterns = ['bank', 'paypal', 'stripe', 'visa', 'mastercard', 'chase'];
    if (financePatterns.some(p => d.includes(p))) {
        return { isRisk: true, penalty: 30, reason: '⚠️ 行为风险：金融类域名。Reality 伪装成银行极易引起统计学探测异常。' };
    }

    return { isRisk: false, penalty: 0 };
}

/**
 * 异步全量检测
 */
export async function checkRealityDomain(domain: string): Promise<DomainCheckResult> {
    const domainToCheck = domain.includes(':') ? domain : `${domain}:443`;
    const host = domainToCheck.split(':')[0];

    if (!isValidDomainFormat(host)) {
        return { isValid: false, message: '✗ 域名格式错误' };
    }

    const risk = checkDomainRisk(host);
    const isPremium = PREMIUM_DOMAINS.some(w => host.endsWith(w));

    try {
        const url = `https://${host}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 为垃圾 VPS 延长至 12s

        // 前端测速
        const start = Date.now();
        const fetchPromise = fetch(url, { method: 'HEAD', signal: controller.signal }).catch(() => null);

        // 后端深度验证
        const backendPromise = inboundApi.checkReality(host).catch(() => null);

        const [response, backendResult] = await Promise.all([fetchPromise, backendPromise]);
        clearTimeout(timeoutId);

        const clientLatency = Date.now() - start;
        const serverLatency = backendResult?.success ? backendResult.obj?.latency : null;
        const hasTls13 = backendResult?.success && backendResult.obj?.has_tls13;

        let score = 0;
        const info: string[] = [];

        // 1. TLS 1.3 - 核心门槛 (40分)
        if (hasTls13) {
            score += 40;
            const kex = backendResult?.obj?.key_exchange || 'X25519';
            info.push(`✓ TLS 1.3 | ${kex} (已验证)`);
        } else {
            // 如果后端检测结果中 hasTls13 为 false，直接取出后台诊断的具体原因（例如：VPS 网络不通、或仅支持 1.2）
            const detailedError = backendResult?.obj?.message || 'TLS 1.3 探测失败';
            info.push(`✗ ${detailedError}`);
        }

        // 2. 延迟打分 (30分) - 优先使用服务器端延迟
        const targetLatency = serverLatency || clientLatency;
        const latencyType = serverLatency ? '服务器' : '本地';
        if (targetLatency < 300) {
            score += 30;
            info.push(`✓ ${latencyType}秒开 (${targetLatency}ms)`);
        } else if (targetLatency < 1000) {
            score += 20;
            info.push(`✓ 响应正常 (${targetLatency}ms)`);
        } else {
            info.push(`⚠ 延迟较高 (${targetLatency}ms)`);
        }

        // 3. 通讯特性 (20分)
        if (response?.type || isPremium || hasTls13) {
            score += 20;
            info.push('✓ H2/H3 兼容');
        }

        // 4. 设置权重 (10分)
        if (isPremium) {
            score += 10;
            info.push('✓ 顶级节点');
        }

        score = Math.max(0, score - risk.penalty);

        // 最终判定逻辑：严苛模式
        const isValid = !!hasTls13 && !risk.isRisk && score >= 50;

        let message = '';
        if (!hasTls13 && backendResult?.success) message = '✗ 域名不可用：Reality 必须要求目标支持 TLS 1.3';
        else if (score >= 90) message = '🌟 完美！这是顶级的 Reality 伪装目标';
        else if (score >= 70) message = '✅ 良好！推荐作为正式节点使用';
        else if (risk.isRisk) message = '⚠️ 警告：技术上可用但存在业务探测风险';
        else message = '⚠ 检测通过，但建议寻找分值更高的域名';

        return { isValid, score, message, details: info.join(' | '), warning: risk.reason };

    } catch (e) {
        return {
            isValid: false,
            message: '✗ 检测通信异常',
            details: '无法连接后端检测服务或目标域名彻底封死',
            warning: risk.reason
        };
    }
}

/**
 * 实时同步检测 (仅格式和风险)
 */
export function quickCheckRealityDomainSync(domain: string): DomainCheckResult {
    const host = domain.split(':')[0];
    if (!isValidDomainFormat(host)) return { isValid: false, message: '✗ 格式错误' };
    const risk = checkDomainRisk(host);
    return {
        isValid: !risk.isRisk,
        message: risk.isRisk ? '⚠️ 存在风险' : '✓ 格式正确',
        warning: risk.reason
    };
}
