import { useEffect, useState, memo } from 'react';
import { useGlobalStore } from '../store/useGlobalStore';
import { useLogsStore } from '../store/useLogsStore';
import { useDialogStore } from '../store/useDialogStore';
import { VersionSelectModal } from '../components/VersionSelectModal';

// 性能优化：使用 memo 包裹纯展示组件
const StatusCircle = memo<{ percent: number; title: string; value: string }>(({ percent, title, value }) => (
    <div className="bg-white border border-gray-100 rounded-4xl p-8 flex flex-col items-center justify-center shadow-sm animate-in fade-in duration-700">
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-50" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * percent) / 100}
                    className="text-gray-900 transition-all duration-1000 ease-out"
                    strokeLinecap="round" />
            </svg>
            <span className="absolute text-xl font-bold text-gray-900 tracking-tighter tabular-nums">{percent}%</span>
        </div>
        <div className="text-center">
            <p className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-[14px] font-bold text-gray-500 tracking-tight">{value}</p>
        </div>
    </div>
));

StatusCircle.displayName = 'StatusCircle';

const StatusBar = memo<{ children: React.ReactNode }>(({ children }) => (
    <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
        {children}
    </div>
));

StatusBar.displayName = 'StatusBar';


export const Dashboard = () => {
    const { sysStatus, fetchStatus, restartXray, switchVersion } = useGlobalStore();
    const { showAlert, showConfirm } = useDialogStore();
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleRestart = () => {
        showConfirm('确定要重启 Xray 服务吗？这可能会导致短暂的连接中断。', async () => {
            try {
                await restartXray();
                showAlert('重启命令已发送，请稍后刷新查看状态', '操作成功');
                fetchStatus();
            } catch (err: any) {
                showAlert(err.message || '重启失败', '错误');
            }
        }, '重启确认');
    };

    const handleVersionSelect = (version: string) => {
        setIsVersionModalOpen(false);
        if (version === sysStatus.xrayVersion) return;

        showConfirm(`确定要将 Xray 版本切换为 ${version} 吗？`, async () => {
            try {
                await switchVersion(version);
                showAlert(`已发送版本切换请求: ${version}，请关注运行日志`, '操作成功');
            } catch (err: any) {
                showAlert(err.message || '版本切换请求失败', '错误');
            }
        }, '版本切换确认');
    };

    const handleToggleStatus = () => {
        if (sysStatus.xrayStatus === 'running') {
            showConfirm('确定要停止 Xray 服务吗？', async () => {
                try {
                    await useGlobalStore.getState().stopXray();
                    showAlert('停止命令已发送', '操作成功');
                    fetchStatus();
                } catch (err: any) {
                    showAlert(err.message || '停止失败', '错误');
                }
            }, '停止确认');
        } else {
            showConfirm('确定要启动 Xray 服务吗？', async () => {
                try {
                    await useGlobalStore.getState().startXray();
                    showAlert('启动命令已发送', '操作成功');
                    fetchStatus();
                } catch (err: any) {
                    showAlert(err.message || '启动失败', '错误');
                }
            }, '启动确认');
        }
    };

    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-8 lg:p-14 overflow-y-auto font-sans text-gray-900">
            <VersionSelectModal
                isOpen={isVersionModalOpen}
                currentVersion={sysStatus.xrayVersion}
                onClose={() => setIsVersionModalOpen(false)}
                onSelect={handleVersionSelect}
            />
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Top Circular Gauges - No Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatusCircle percent={Math.round(sysStatus.cpu)} title="CPU" value="" />
                    <StatusCircle percent={Math.round(sysStatus.mem.percent)} title="内存" value={`${sysStatus.mem.current} / ${sysStatus.mem.total}`} />
                    <StatusCircle percent={Math.round(sysStatus.swap.percent)} title="SWAP" value={`${sysStatus.swap.current} / ${sysStatus.swap.total}`} />
                    <StatusCircle percent={Math.round(sysStatus.disk.percent)} title="硬盘" value={`${sysStatus.disk.current} / ${sysStatus.disk.total}`} />
                </div >

                {/* 2. Main Info Bars Grid - No Icons */}
                < div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4" >

                    {/* Left Column */}
                    < div className="space-y-4" >
                        <StatusBar>
                            <div className="flex items-center gap-4 text-sm font-bold">
                                <span className="text-gray-900">Xray:</span>
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-[12px] font-mono font-medium tracking-tight">
                                    {sysStatus.xrayVersion}
                                </span>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center gap-4 text-sm font-bold">
                                <span className="text-gray-900">Xray 状态:</span>
                                <span className="px-2 py-1 rounded bg-gray-50 text-gray-400 text-[11px] font-medium flex items-center gap-1.5 border border-gray-100/50">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)] ${sysStatus.xrayStatus === 'running' ? 'bg-green-600' : 'bg-red-500'}`} />
                                    {sysStatus.xrayStatus}
                                </span>
                                <div className="flex gap-4 ml-4">
                                    <button
                                        onClick={() => setIsVersionModalOpen(true)}
                                        className="flex items-center justify-center px-5 py-1.5 bg-white text-black rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                        style={{ padding: '5px 24px 4px 24px' }}
                                    >
                                        <span>切换版本</span>
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`flex items-center justify-center px-5 py-1.5 bg-white ${sysStatus.xrayStatus === 'running' ? 'text-orange-500' : 'text-green-600'} rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none`}
                                        style={{ padding: '5px 24px 4px 24px' }}
                                    >
                                        <span>{sysStatus.xrayStatus === 'running' ? '停止' : '启动'}</span>
                                    </button>
                                    <button
                                        onClick={handleRestart}
                                        className="flex items-center justify-center px-5 py-1.5 bg-white text-red-600 rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                        style={{ padding: '5px 24px 4px 24px' }}
                                    >
                                        <span>重启</span>
                                    </button>
                                </div>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-gray-900">系统负载:</span>
                                <span className="text-gray-400 font-mono font-medium">{sysStatus.load || "0 | 0 | 0"}</span>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span className="text-gray-900">上传速度:</span>
                                    <span className="tabular-nums text-gray-400 font-medium">{sysStatus.netTraffic.up || "0 B / S"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span className="text-gray-900">下载速度:</span>
                                    <span className="tabular-nums text-gray-400 font-medium">{sysStatus.netTraffic.down || "0 B / S"}</span>
                                </div>
                            </div>
                        </StatusBar>
                    </div >

                    {/* Right Column */}
                    < div className="space-y-4" >
                        <StatusBar>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-gray-900">运行时间:</span>
                                <span className="px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-400 text-[12px] tabular-nums font-medium border border-gray-100/50">{sysStatus.uptime.split(' ')[0]} 天</span>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center gap-4 text-sm font-bold">
                                <span className="text-gray-900">其他:</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => useLogsStore.getState().open()}
                                        className="flex items-center justify-center px-5 py-1.5 bg-white text-black rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                        style={{ padding: '5px 24px 4px 24px' }}
                                    >
                                        <span>查看运行日志</span>
                                    </button>
                                </div>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-gray-900">tcp / udp 连接数:</span>
                                <span className="text-gray-400 tabular-nums font-medium">
                                    {sysStatus.tcpCount} / {sysStatus.udpCount}
                                </span>
                            </div>
                        </StatusBar>

                        <StatusBar>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span className="text-gray-900">上传总流量:</span>
                                    <span className="tabular-nums text-gray-400 font-medium">
                                        {sysStatus.netTraffic.totalUp}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span className="text-gray-900">下载总流量:</span>
                                    <span className="tabular-nums text-gray-400 font-medium">
                                        {sysStatus.netTraffic.totalDown}
                                    </span>
                                </div>
                            </div>
                        </StatusBar>
                    </div >
                </div >
            </div >
        </div >
    );
};