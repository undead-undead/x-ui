import { useState, useMemo, useEffect } from 'react';
import { useInboundStore } from '../store/useInboundStore';
import { InboundTable } from '../components/InboundTable';
import { InboundTableVirtual } from '../components/InboundTableVirtual';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModalStore } from '../store/useModalStore';
import { formatTraffic } from '../utils/format';
import { useDebouncedValue } from '@mantine/hooks';
import { checkRealityDomain, quickCheckRealityDomainSync, type DomainCheckResult } from '../utils/realityDomainChecker';

// 性能优化：节点数阈值，超过此值使用虚拟滚动
const VIRTUAL_SCROLL_THRESHOLD = 50;

export const InboundPage = () => {
    const { t } = useTranslation();

    // 性能优化：使用细粒度选择器，只订阅需要的数据
    const inbounds = useInboundStore((state) => state.inbounds);
    const fetchInbounds = useInboundStore((state) => state.fetchInbounds);
    const openModal = useModalStore((state) => state.openModal);

    const [searchQuery, setSearchQuery] = useState('');
    const [realityDomain, setRealityDomain] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<DomainCheckResult | null>(null);

    // 流量统计基准点（存储在 localStorage）
    const [trafficBaseline, setTrafficBaseline] = useState<{ upload: number; download: number }>(() => {
        const saved = localStorage.getItem('traffic_baseline');
        return saved ? JSON.parse(saved) : { upload: 0, download: 0 };
    });

    // 计算当前总流量（所有节点的实际流量）
    const currentTotals = useMemo(() => {
        return inbounds.reduce(
            (acc, inbound) => ({
                upload: acc.upload + (inbound.up || 0),
                download: acc.download + (inbound.down || 0),
            }),
            { upload: 0, download: 0 }
        );
    }, [inbounds]);

    // 计算显示的流量（当前总流量 - 基准点）
    const { totalUpload, totalDownload } = useMemo(() => {
        const upload = Math.max(0, currentTotals.upload - trafficBaseline.upload);
        const download = Math.max(0, currentTotals.download - trafficBaseline.download);
        return {
            totalUpload: formatTraffic(upload),
            totalDownload: formatTraffic(download),
        };
    }, [currentTotals, trafficBaseline]);

    // 重置流量统计（将当前流量设为新的基准点）
    const handleResetTrafficStats = () => {
        const newBaseline = {
            upload: currentTotals.upload,
            download: currentTotals.download,
        };
        setTrafficBaseline(newBaseline);
        localStorage.setItem('traffic_baseline', JSON.stringify(newBaseline));
    };

    // 页面加载时获取最新数据
    useEffect(() => {
        fetchInbounds();

        // 开启 5s 自动刷新以更新流量
        const timer = setInterval(() => {
            fetchInbounds();
        }, 5000);

        return () => clearInterval(timer);
    }, [fetchInbounds]);

    // 性能优化：使用防抖，减少 90% 的过滤计算
    const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

    const filteredInbounds = useMemo(() => {
        if (!debouncedQuery) return inbounds;

        const query = debouncedQuery.toLowerCase();
        return inbounds.filter(inbound =>
            inbound.remark.toLowerCase().includes(query) ||
            inbound.protocol.toLowerCase().includes(query) ||
            inbound.port.toString().includes(query)
        );
    }, [inbounds, debouncedQuery]);

    // 计算总流量（所有节点的上传+下载之和）
    const totalTraffic = useMemo(() => {
        const total = inbounds.reduce((sum, inbound) => {
            return sum + (inbound.up || 0) + (inbound.down || 0);
        }, 0);
        return formatTraffic(total);
    }, [inbounds]);

    // 同步快速检测（用于实时反馈）
    const quickResult = useMemo(() => {
        if (!realityDomain.trim()) {
            return null;
        }
        return quickCheckRealityDomainSync(realityDomain);
    }, [realityDomain]);

    // 异步完整检测
    const handleCheckDomain = async () => {
        if (!realityDomain.trim()) return;

        setIsChecking(true);
        try {
            const result = await checkRealityDomain(realityDomain);
            setCheckResult(result);
        } catch (error) {
            setCheckResult({
                isValid: false,
                message: t('inbound.check_failed'),
                details: t('inbound.check_network_error'),
            });
        } finally {
            setIsChecking(false);
        }
    };

    // 当域名改变时，清除之前的完整检测结果
    useMemo(() => {
        setCheckResult(null);
    }, [realityDomain]);

    // 决定显示哪个结果
    const displayResult = checkResult || quickResult;

    // 性能优化：智能选择表格组件
    // 节点数 > 50 时使用虚拟滚动，否则使用普通表格
    const useVirtualScroll = filteredInbounds.length > VIRTUAL_SCROLL_THRESHOLD;
    const TableComponent = useVirtualScroll ? InboundTableVirtual : InboundTable;


    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-8 lg:p-14 overflow-y-auto relative font-sans">
            <div className="max-w-full relative z-10">
                {/* Unified Card Container */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {/* Toolbar Section */}
                    <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            {/* Add Node Button */}
                            <button
                                onClick={() => openModal()}
                                className="flex items-center justify-center px-5 py-1.5 bg-white text-black rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                style={{ padding: '5px 24px 4px 24px' }}
                            >
                                <Plus size={16} strokeWidth={3} className="mr-2" />
                                <span>{t('inbound.modal.title_add')}</span>
                            </button>

                            {/* Search Input */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('inbound.search_placeholder')}
                                className="w-64 h-11 px-5 bg-white border border-black rounded-xl outline-none focus:ring-0 transition-all text-black placeholder:text-gray-300 font-bold text-[13px] shadow-[0_1px_0_0_#94a3b8]"
                            />
                        </div>

                        {/* Center Section: Traffic Statistics */}
                        <div className="flex-1 flex justify-center">
                            {/* Traffic Statistics */}
                            <div className="flex items-center gap-3 w-64 h-11 px-5 bg-white border border-black rounded-xl shadow-[0_1px_0_0_#94a3b8]">
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] text-gray-500 font-medium leading-tight">上传总流量</span>
                                    <span className="text-[13px] font-bold text-gray-700 tabular-nums">{totalUpload}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300"></div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] text-gray-500 font-medium leading-tight">下载总流量</span>
                                    <span className="text-[13px] font-bold text-gray-700 tabular-nums">{totalDownload}</span>
                                </div>
                                <button
                                    onClick={handleResetTrafficStats}
                                    className="px-5 py-1.5 bg-white text-black rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                    style={{ padding: '5px 24px 4px 24px' }}
                                    title="重置流量统计"
                                >
                                    重置
                                </button>
                            </div>
                        </div>

                        {/* Right Section: Reality Domain Checker */}
                        <div className="flex items-center gap-2">
                            {/* Reality Domain Checker */}
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={realityDomain}
                                    onChange={(e) => setRealityDomain(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckDomain()}
                                    placeholder={t('inbound.reality_check_placeholder')}
                                    className="w-72 h-11 px-5 pr-[120px] bg-white border border-black rounded-xl outline-none focus:ring-0 transition-all text-black placeholder:text-gray-300 font-bold text-[13px] shadow-[0_1px_0_0_#94a3b8]"
                                />

                                {/* 检测按钮 */}
                                <button
                                    onClick={handleCheckDomain}
                                    disabled={!realityDomain.trim() || isChecking}
                                    className="absolute right-3 top-[10px] bg-white text-black border border-black rounded-xl text-[13px] font-bold hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_1px_0_0_#94a3b8] transition-all shadow-[0_1px_0_0_#94a3b8] flex items-center leading-none"
                                    style={{ padding: '5px 24px 4px 24px' }}
                                >
                                    {isChecking ? t('inbound.checking') : t('inbound.check')}
                                </button>

                                {/* 状态图标 */}
                                {displayResult && !isChecking && (
                                    <div className="absolute right-[100px] top-1/2 -translate-y-1/2">
                                        {displayResult.isValid ? (
                                            <CheckCircle2 size={18} className="text-black" />
                                        ) : (
                                            <XCircle size={18} className="text-gray-500" />
                                        )}
                                    </div>
                                )}

                                {/* 结果提示 */}
                                {displayResult && !isChecking && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 p-3 rounded-lg text-xs font-medium shadow-lg z-50 ${displayResult.warning
                                        ? 'bg-gray-100 border border-gray-400 text-gray-800'
                                        : displayResult.isValid
                                            ? 'bg-white border border-black text-black'
                                            : 'bg-gray-100 border border-gray-400 text-gray-700'
                                        }`}>
                                        <div className="font-bold mb-1">{displayResult.message}</div>
                                        {displayResult.details && (
                                            <div className="text-xs opacity-80 mb-2">{displayResult.details}</div>
                                        )}
                                        {displayResult.score !== undefined && (
                                            <div className="text-xs font-bold mb-2">{t('inbound.score')}: {displayResult.score}/100</div>
                                        )}
                                        {displayResult.warning && (
                                            <div className="mt-2 pt-2 border-t border-current/20 whitespace-pre-line text-xs leading-relaxed">
                                                {displayResult.warning}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-[13px] font-bold text-gray-500">
                                <span className="tabular-nums">{t('inbound.total_count')}: {inbounds.length}</span>
                                <span className="tabular-nums">{t('inbound.total_traffic')}: {totalTraffic}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Content - 智能切换 */}
                    <TableComponent inbounds={filteredInbounds} isEmbedded={true} />
                </div>
            </div>
        </div>
    );
};