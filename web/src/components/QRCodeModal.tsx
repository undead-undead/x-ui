import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2 } from 'lucide-react';
import { useQRCodeStore } from '../store/useQRCodeStore';

export const QRCodeModal: React.FC = () => {
    const { isOpen, inbound, close } = useQRCodeStore();
    const [copied, setCopied] = useState(false);

    const nodeLink = useMemo(() => {
        if (!inbound) return '';
        // 这里根据协议生成标准的节点链接
        return `${inbound.protocol}://${inbound.id}@127.0.0.1:${inbound.port}?remark=${encodeURIComponent(inbound.remark)}`;
    }, [inbound]);

    if (!isOpen || !inbound) return null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(nodeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={close}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white border border-gray-100 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">扫描二维码</h2>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* QR Code Section */}
                <div className="p-8 flex flex-col items-center">
                    <div className="p-4 bg-white border-2 border-gray-50 rounded-3xl shadow-sm mb-6">
                        <QRCodeSVG
                            value={nodeLink}
                            size={200}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                                src: "/logo.svg", // 如果有 logo 的话
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleCopyLink}
                            className={`
                                w-full flex items-center justify-center rounded-xl text-[13px] font-bold border border-black transition-all leading-none
                                hover:-translate-y-[2px] active:translate-y-px active:shadow-none
                                ${copied
                                    ? 'bg-green-500 text-white shadow-[0_1px_0_0_#15803d] hover:shadow-[0_4px_0_0_#15803d]'
                                    : 'bg-black text-white shadow-[0_1px_0_0_#94a3b8] hover:shadow-[0_4px_0_0_#94a3b8]'
                                }
                            `}
                            style={{ padding: '14px 24px 12px 24px' }}
                        >
                            <span>
                                {copied ? '链接已复制' : '复制节点链接'}
                            </span>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">协议</span>
                                <span className="text-[12px] font-bold text-gray-900 uppercase">{inbound.protocol}</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">端口</span>
                                <span className="text-[12px] font-bold text-gray-900">{inbound.port}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-gray-50/50 text-center">
                    <p className="text-[12px] font-medium text-gray-400 leading-relaxed">
                        使用支持 V2Ray 协议的客户端<br />扫描上方二维码即可导入节点
                    </p>
                </div>
            </div>
        </div>
    );
};
