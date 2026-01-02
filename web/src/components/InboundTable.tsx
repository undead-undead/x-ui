import React, { memo, useCallback, useState } from 'react';
import type { Inbound } from '../types/inbound';
import { formatTraffic } from '../utils/format';
import { Switch } from './ui/Switch';
import { useInboundStore } from '../store/useInboundStore';
import { useModalStore } from '../store/useModalStore';
import { useDialogStore } from '../store/useDialogStore';
import { useQRCodeStore } from '../store/useQRCodeStore';
import { Dropdown, DropdownItem } from './ui/Dropdown';
import { QrCode, RefreshCw, Edit3, Trash2, Copy } from 'lucide-react';
import { generateShareLink, copyToClipboard } from '../utils/linkUtils';
import { toast } from 'react-hot-toast';

interface InboundTableProps {
    inbounds: Inbound[];
    isEmbedded?: boolean;
}

// 性能优化：将表格行抽取为独立组件并使用 memo
interface InboundRowProps {
    item: Inbound;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onReset: (id: string) => void;
    onEdit: (item: Inbound) => void;
    onQRCode: (item: Inbound) => void;
    onCopy: (item: Inbound) => void;
}

const InboundRow = memo<InboundRowProps>(({ item, onToggle, onDelete, onReset, onEdit, onQRCode, onCopy }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <tr className={`group hover:bg-gray-50 transition-colors ${isMenuOpen ? 'relative z-50' : ''}`}>
            <td className="px-8 py-6">
                <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-gray-900 tracking-tight">{item.remark}</span>
                </div>
            </td>
            <td className="px-8 py-6">
                <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-tight">
                    {item.protocol}
                </span>
            </td>
            <td className="px-8 py-6 text-[14px] font-bold text-gray-700 tabular-nums">{item.port}</td>
            <td className="px-8 py-6">
                <div className="flex items-center gap-2 text-[13px] font-bold tabular-nums">
                    <div className="flex items-center gap-1.5 text-gray-900">
                        <span className="text-gray-400">↑</span>
                        <span className="text-gray-600">{formatTraffic(item.up || 0)}</span>
                        <span className="text-gray-400 ml-1">↓</span>
                        <span className="text-gray-600">{formatTraffic(item.down || 0)}</span>
                    </div>
                </div>
            </td>
            <td className="px-8 py-6">
                <div className="flex justify-center">
                    <Switch
                        checked={item.enable}
                        onChange={() => onToggle(item.id)}
                    />
                </div>
            </td>
            <td className="px-8 py-6 text-right">
                <div className="flex justify-end pr-2">
                    <Dropdown onOpenChange={setIsMenuOpen}>
                        <DropdownItem
                            onClick={() => onCopy(item)}
                            icon={<Copy size={16} strokeWidth={2.5} />}
                        >
                            复制链接
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => onQRCode(item)}
                            icon={<QrCode size={16} strokeWidth={2.5} />}
                        >
                            二维码
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => onReset(item.id)}
                            icon={<RefreshCw size={16} strokeWidth={2.5} />}
                        >
                            重置
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => onEdit(item)}
                            icon={<Edit3 size={16} strokeWidth={2.5} />}
                        >
                            编辑
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => onDelete(item.id)}
                            variant="danger"
                            icon={<Trash2 size={16} strokeWidth={2.5} />}
                        >
                            删除
                        </DropdownItem>
                    </Dropdown>
                </div>
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // 自定义比较函数：只在关键属性真正改变时才重新渲染
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.enable === nextProps.item.enable &&
        prevProps.item.up === nextProps.item.up &&
        prevProps.item.down === nextProps.item.down &&
        prevProps.item.remark === nextProps.item.remark &&
        prevProps.item.protocol === nextProps.item.protocol &&
        prevProps.item.port === nextProps.item.port
    );
});

InboundRow.displayName = 'InboundRow';

export const InboundTable: React.FC<InboundTableProps> = memo(({ inbounds, isEmbedded }) => {
    const { toggleEnable, deleteInbound, resetTraffic } = useInboundStore();
    const { openModal } = useModalStore();

    // 使用 useCallback 缓存回调函数，避免每次渲染创建新函数
    const handleToggle = useCallback((id: string) => {
        toggleEnable(id);
    }, [toggleEnable]);

    const handleDelete = useCallback((id: string) => {
        useDialogStore.getState().showConfirm(
            '确定要删除该节点吗？此操作不可恢复。',
            async () => {
                await deleteInbound(id);
                toast.success('节点已删除');
            },
            '确认删除'
        );
    }, [deleteInbound]);

    const handleReset = useCallback((id: string) => {
        useDialogStore.getState().showConfirm(
            '确定要重置该节点的流量统计吗？',
            async () => {
                await resetTraffic(id);
                toast.success('流量统计已重置');
            },
            '确认重置'
        );
    }, [resetTraffic]);

    const handleEdit = useCallback((item: Inbound) => {
        openModal(item);
    }, [openModal]);

    const handleQRCode = useCallback((item: Inbound) => {
        useQRCodeStore.getState().open(item);
    }, []);

    const handleCopy = useCallback((item: Inbound) => {
        const link = generateShareLink(item);
        copyToClipboard(link).then(success => {
            if (success) toast.success('链接已复制到剪贴板');
            else toast.error('复制失败');
        });
    }, []);

    const containerStyles = isEmbedded
        ? "w-full"
        : "bg-white border border-gray-200 rounded-5xl shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-1000";

    return (
        <div className={containerStyles}>
            <div className="overflow-x-auto overflow-y-visible min-h-[450px]">
                <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500">备注</th>
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500">类型</th>
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500">端口</th>
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500">流量 ↑|↓</th>
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500 text-center">状态</th>
                            <th className="px-8 py-5 text-[12px] font-bold tracking-tight text-gray-500">
                                <div className="flex justify-end pr-2">
                                    <div className="w-10 flex items-center justify-center">
                                        操作
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {inbounds.map((item) => (
                            <InboundRow
                                key={item.id}
                                item={item}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onReset={handleReset}
                                onEdit={handleEdit}
                                onQRCode={handleQRCode}
                                onCopy={handleCopy}
                            />
                        ))}
                    </tbody>
                </table>
                {inbounds.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-gray-400 font-bold tracking-tight text-[15px]">暂无运行中的节点</p>
                    </div>
                )}
            </div>
        </div>
    );
});

InboundTable.displayName = 'InboundTable';