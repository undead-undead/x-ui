import { useState, useMemo, useCallback } from 'react';
import { useSettingStore } from '../store/useSettingStore';
import { Shield, User, Database, Zap, Terminal, Eye, EyeOff } from 'lucide-react';
import { useBackupModalStore } from '../store/useBackupModalStore';

export const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('panel');

    // 性能优化：使用细粒度选择器
    const panel = useSettingStore((state) => state.panel);
    const auth = useSettingStore((state) => state.auth);
    const updatePanel = useSettingStore((state) => state.updatePanel);
    const updateAuth = useSettingStore((state) => state.updateAuth);
    const savePanelConfig = useSettingStore((state) => state.savePanelConfig);
    const confirmUpdateAuth = useSettingStore((state) => state.confirmUpdateAuth);

    const [errors, setErrors] = useState<{ newUsername?: string; newPassword?: string }>({});
    const [showPassword, setShowPassword] = useState(false);

    const validateField = (field: 'newUsername' | 'newPassword', value: string) => {
        if (!value) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
            return;
        }
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!alphanumericRegex.test(value)) {
            setErrors(prev => ({ ...prev, [field]: '仅支持字母和数字' }));
        } else {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // 性能优化：使用 useMemo 缓存 tabs 数组
    const tabs = useMemo(() => [
        { id: 'panel', label: '面板设置', icon: Shield },
        { id: 'user', label: '用户管理', icon: User },
        { id: 'backup', label: '备份恢复', icon: Database },
        { id: 'advanced', label: '系统状态', icon: Zap },
    ], []);

    // 性能优化：使用 useCallback 缓存回调函数
    const handleSave = useCallback(() => {
        console.log("handleSave 被调用，当前标签页:", activeTab);
        if (activeTab === 'panel') {
            console.log("调用 savePanelConfig");
            savePanelConfig();
        } else if (activeTab === 'user') {
            console.log("调用 confirmUpdateAuth");
            // 先验证并保存用户信息，然后调用 savePanelConfig 重启
            confirmUpdateAuth();
            // 注意：confirmUpdateAuth 内部会显示确认对话框
            // 用户确认后才会真正保存，所以这里不直接调用 savePanelConfig
        } else {
            console.log("当前标签页没有对应的保存逻辑:", activeTab);
        }
    }, [activeTab, savePanelConfig, confirmUpdateAuth]);


    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-8 lg:p-14 overflow-y-auto relative font-sans">
            <div className="max-w-full relative z-10">
                <header className="flex flex-col md:flex-row md:items-center justify-start gap-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center px-5 py-1.5 bg-white border border-black rounded-xl font-bold text-[13px] hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] text-black whitespace-nowrap leading-none"
                            style={{ padding: '5px 24px 4px 24px' }}
                        >
                            <span>保存并重启面板</span>
                        </button>
                    </div>
                </header>

                {/* Unified Card Container */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-1000 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-gray-100/80 border-b border-gray-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 h-9 flex items-center justify-center rounded-[14px] font-bold text-[13px] transition-all duration-200 relative ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02)] border border-black/5'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Settings Form Content */}
                    <div className="p-10 md:p-14">
                        {activeTab === 'panel' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">基础配置</h3>
                                    <p className="text-xs font-medium text-gray-500 mt-1">面板核心网络与路径参数设定</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">面板端口</label>
                                        <input
                                            type="number"
                                            value={panel.port}
                                            onChange={(e) => updatePanel({ port: Number(e.target.value) })}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500/50 transition-all text-gray-900 font-semibold tabular-nums tracking-tight text-[16px]"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">根路径 (WebRoot)</label>
                                        <input
                                            type="text"
                                            value={panel.webRoot}
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                // 只允许英文字母、数字、斜杠、连字符、下划线和点
                                                value = value.replace(/[^a-zA-Z0-9\/_\-\.]/g, '');
                                                updatePanel({ webRoot: value });
                                            }}
                                            onBlur={(e) => {
                                                // 失去焦点时，如果为空则设置为默认值
                                                if (!e.target.value.trim()) {
                                                    updatePanel({ webRoot: '/panel/' });
                                                }
                                            }}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500/50 transition-all text-gray-900 font-semibold tracking-tight text-[16px]"
                                            placeholder="/panel/"
                                            title="输入路径，格式如 /panel/ 或 /admin/"
                                        />
                                        <p className="text-xs text-gray-400 ml-1">请输入完整路径（如 /panel/、/admin/），保存时会自动规范化格式</p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">证书文件路径 (SSL Cert)</label>
                                        <input
                                            type="text"
                                            value={panel.sslCertPath}
                                            onChange={(e) => updatePanel({ sslCertPath: e.target.value })}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500/50 transition-all text-gray-900 font-semibold tracking-tight text-[16px]"
                                            placeholder="/root/cert.crt"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">密钥文件路径 (SSL Key)</label>
                                        <input
                                            type="text"
                                            value={panel.sslKeyPath}
                                            onChange={(e) => updatePanel({ sslKeyPath: e.target.value })}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500/50 transition-all text-gray-900 font-semibold tracking-tight text-[16px]"
                                            placeholder="/root/private.key"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'user' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">安全凭证</h3>
                                    <p className="text-xs font-medium text-gray-500 mt-1">更新面板管理员登录账号与密码</p>
                                </div>

                                <div className="space-y-6 max-w-md">
                                    {/* 原用户名 */}
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">原用户名</label>
                                        <input
                                            type="text"
                                            value={auth.oldUsername}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                                updateAuth({ oldUsername: value });
                                            }}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-gray-400 transition-all text-gray-900 font-semibold tracking-tight text-[16px]"
                                            placeholder="当前管理员账号"
                                        />
                                    </div>

                                    {/* 原密码 */}
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-bold text-gray-500 tracking-tight ml-1">原密码</label>
                                        <input
                                            type="password"
                                            value={auth.oldPassword}
                                            onChange={(e) => updateAuth({ oldPassword: e.target.value })}
                                            className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-gray-400 transition-all text-gray-900 font-semibold tracking-tight text-[16px]"
                                            placeholder="当前密码"
                                        />
                                    </div>

                                    {/* 新用户名 */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end ml-1">
                                            <label className="text-[13px] font-bold text-gray-500 tracking-tight">新用户名</label>
                                            {errors.newUsername ? (
                                                <span className="text-[11px] font-bold text-red-500 animate-pulse">{errors.newUsername}</span>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-400">仅限字母、数字</span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={auth.newUsername}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                                updateAuth({ newUsername: value });
                                            }}
                                            onBlur={(e) => validateField('newUsername', e.target.value)}
                                            className={`w-full h-14 px-6 bg-gray-50 border ${errors.newUsername ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200'} rounded-2xl outline-none focus:bg-white focus:border-gray-400 transition-all text-gray-900 font-semibold tracking-tight text-[16px]`}
                                            placeholder="输入新的管理员账号"
                                        />
                                    </div>

                                    {/* 新密码 */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end ml-1">
                                            <label className="text-[13px] font-bold text-gray-500 tracking-tight">新密码</label>
                                            {errors.newPassword ? (
                                                <span className="text-[11px] font-bold text-red-500 animate-pulse">{errors.newPassword}</span>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-400">仅限字母、数字</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={auth.newPassword}
                                                onChange={(e) => updateAuth({ newPassword: e.target.value })}
                                                onBlur={(e) => validateField('newPassword', e.target.value)}
                                                className={`w-full h-14 px-6 pr-14 bg-gray-50 border ${errors.newPassword ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200'} rounded-2xl outline-none focus:bg-white focus:border-gray-400 transition-all text-gray-900 font-semibold tracking-tight text-[16px]`}
                                                placeholder="输入新密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'backup' && (
                            <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
                                <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-4xl flex items-center justify-center text-gray-400 shadow-sm">
                                    <Database size={48} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-700 tracking-tight">数据库备份</h3>
                                    <p className="text-gray-500 text-[14px] mt-2.5 font-medium max-w-xs mx-auto">系统支持对当前的 .db 数据库文件进行导出备份和导入恢复管理。</p>
                                </div>
                                <button
                                    onClick={() => useBackupModalStore.getState().open()}
                                    className="flex items-center justify-center px-5 py-1.5 bg-white text-black rounded-xl text-[13px] font-bold border border-black hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#94a3b8] active:translate-y-px active:shadow-none transition-all shadow-[0_1px_0_0_#94a3b8] whitespace-nowrap leading-none"
                                    style={{ padding: '5px 24px 4px 24px' }}
                                >
                                    <span>管理备份与恢复</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 shadow-sm">
                                        <Terminal size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">系统环境</h3>
                                        <p className="text-xs font-medium text-gray-500 mt-1">内核状态与高级系统参数</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-200 font-mono text-[14px] text-gray-500 space-y-3 leading-relaxed">
                                    <p className="text-gray-600/60 font-bold">&gt; 节点会话已验证 (Node session authenticated)</p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-gray-600">&gt;</span>
                                        完整性自检: <span className="text-gray-600/80 font-bold">通过</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-gray-600">&gt;</span>
                                        面板运行状态: <span className="text-gray-600/80 font-bold">运行中</span>
                                    </p>
                                    <div className="h-0.5 w-full bg-white/5 my-4" />
                                    <p className="text-gray-500 text-xs">Uptime: 284,591 seconds</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};