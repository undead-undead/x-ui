import { formatTraffic } from '../utils/format';

export const StatsHeader = ({ totalUp, totalDown, count }: { totalUp: number, totalDown: number, count: number }) => {
    const totalUsage = totalUp + totalDown;

    return (
        <div className="bg-white border border-gray-200 p-8 rounded-4xl mb-6 flex gap-12 text-xs shadow-lg">
            <div className="group transition-all">
                <p className="font-bold text-gray-500 mb-1.5 group-hover:text-gray-700 transition-colors tracking-tight uppercase text-[11px]">总上传 / 下载流量</p>
                <p className="font-mono font-bold text-gray-900 text-sm tabular-nums">
                    {formatTraffic(totalUp)} <span className="text-gray-400 font-normal mx-2">|</span> {formatTraffic(totalDown)}
                </p>
            </div>

            <div className="w-px h-10 bg-gray-200" />

            <div className="group transition-all">
                <p className="font-bold text-gray-500 mb-1.5 group-hover:text-gray-700 transition-colors tracking-tight uppercase text-[11px]">总用量</p>
                <p className="font-mono font-bold text-gray-900 text-sm tabular-nums">{formatTraffic(totalUsage)}</p>
            </div>

            <div className="w-px h-10 bg-gray-200" />

            <div className="group transition-all">
                <p className="font-bold text-gray-500 mb-1.5 group-hover:text-gray-700 transition-colors tracking-tight uppercase text-[11px]">节点总数</p>
                <p className="font-mono font-bold text-gray-900 text-sm tabular-nums">{count} 个</p>
            </div>
        </div>
    );
};