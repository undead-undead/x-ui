import { Link, useNavigate } from '@tanstack/react-router';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden font-sans">
            <div className="max-w-2xl w-full text-center relative z-10 animate-in fade-in zoom-in duration-1000">
                {/* 404 大标题 */}
                <div className="mb-8">
                    <h1 className="text-[180px] font-black text-gray-200 leading-none tracking-tighter select-none">
                        404
                    </h1>
                    <div className="h-1 w-32 bg-gray-300 mx-auto rounded-full" />
                </div>

                {/* 描述文字 */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                        页面未找到
                    </h2>
                    <p className="text-gray-500 text-[15px] font-medium leading-relaxed max-w-md mx-auto">
                        抱歉，您访问的页面不存在或已被移除。请检查 URL 是否正确，或返回主页继续浏览。
                    </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/"
                        className="h-12 px-8 bg-gray-900 text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center gap-2.5 hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                    >
                        <Home size={18} strokeWidth={2.5} />
                        返回仪表盘
                    </Link>
                    <button
                        onClick={() => navigate({ to: -1 as any })}
                        className="h-12 px-8 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[14px] tracking-tight flex items-center gap-2.5 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        返回上一页
                    </button>
                </div>

                {/* 底部装饰 */}
                <div className="mt-16 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Error Code: 404 Not Found
                    </span>
                </div>
            </div>
        </div>
    );
};
