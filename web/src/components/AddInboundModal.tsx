import { useState, useEffect } from 'react';
import { useModalStore } from '../store/useModalStore';
import { useInboundStore } from '../store/useInboundStore';
import { useDialogStore } from '../store/useDialogStore';
import { X } from 'lucide-react';
import { Switch } from './ui/Switch';

export const AddInboundModal = () => {
    const { isOpen, closeModal, editingNode } = useModalStore();
    const { addInbound, updateInbound } = useInboundStore();

    // === 基础配置 ===
    const [remark, setRemark] = useState('');
    const [isEnable, setIsEnable] = useState(true);
    const [protocol, setProtocol] = useState('vless');
    const [tag, setTag] = useState('');
    const [listen, setListen] = useState('');
    const [port, setPort] = useState('40754');
    const [totalTraffic, setTotalTraffic] = useState('0');
    const [expiryTime, setExpiryTime] = useState('');

    // === 协议配置 ===
    // VLESS/VMess
    const [uuid, setUuid] = useState<string>(crypto.randomUUID());
    const [flow, setFlow] = useState('');
    const [level, setLevel] = useState('0');
    const [email, setEmail] = useState('');

    // VMess 特有
    const [alterId, setAlterId] = useState('0');

    // Trojan 特有
    const [password, setPassword] = useState('');

    // Shadowsocks 特有
    const [ssMethod, setSsMethod] = useState('chacha20-ietf-poly1305');
    const [ssPassword, setSsPassword] = useState('');
    const [ssNetwork, setSsNetwork] = useState('tcp,udp');

    // 通用
    const [decryption, setDecryption] = useState('none');

    // === 传输层配置 ===
    const [network, setNetwork] = useState('tcp');

    // WebSocket
    const [wsPath, setWsPath] = useState('/');
    const [wsHost, setWsHost] = useState('');

    // gRPC
    const [grpcServiceName, setGrpcServiceName] = useState('');
    const [grpcMultiMode, setGrpcMultiMode] = useState(false);

    // HTTP/2
    const [h2Host, setH2Host] = useState('');
    const [h2Path, setH2Path] = useState('/');

    // XHTTP
    const [xhttpMode, setXhttpMode] = useState('auto');
    const [xhttpPath, setXhttpPath] = useState('/');
    const [xhttpHost, setXhttpHost] = useState('');

    // === 安全层配置 ===
    const [security, setSecurity] = useState('none');

    // TLS
    const [tlsServerName, setTlsServerName] = useState('');
    const [tlsAlpn, setTlsAlpn] = useState('h2,http/1.1');
    const [tlsAllowInsecure, setTlsAllowInsecure] = useState(false);

    // Reality
    const [realityShow, setRealityShow] = useState(false);
    const [realityDest, setRealityDest] = useState('www.microsoft.com:443');
    const [realityXver, setRealityXver] = useState('0');
    const [realityFingerprint, setRealityFingerprint] = useState('chrome');
    const [realityServerNames, setRealityServerNames] = useState('www.microsoft.com');
    const [realityPrivateKey, setRealityPrivateKey] = useState('');
    const [realityPublicKey, setRealityPublicKey] = useState('');
    const [realityShortIds, setRealityShortIds] = useState('');
    const [realityMinClientVer, setRealityMinClientVer] = useState('');
    const [realityMaxClientVer, setRealityMaxClientVer] = useState('');
    const [realityMaxTimeDiff, setRealityMaxTimeDiff] = useState('');

    // === Socket 选项 ===
    const [acceptProxyProtocol, setAcceptProxyProtocol] = useState(false);
    const [tcpFastOpen, setTcpFastOpen] = useState(true);
    const [tcpNoDelay, setTcpNoDelay] = useState(true);




    useEffect(() => {
        if (isOpen && editingNode) {
            // 加载编辑数据
            setRemark(editingNode.remark || '');
            setIsEnable(editingNode.enable ?? true);
            setProtocol(editingNode.protocol || 'vless');
            setTag(editingNode.tag || '');
            setListen(editingNode.listen || '');
            setPort(String(editingNode.port || ''));
            setTotalTraffic(String((editingNode.total || 0) / (1024 * 1024 * 1024)));
            setExpiryTime(editingNode.expiry ? new Date(editingNode.expiry).toISOString().split('T')[0] : '');

            // 加载协议设置
            if (editingNode.settings) {
                const settings = editingNode.settings;
                if (settings.clients && settings.clients[0]) {
                    const client = settings.clients[0];
                    setUuid(client.id || crypto.randomUUID());
                    setFlow(client.flow || '');
                    setLevel(String(client.level || 0));
                    setEmail(client.email || '');
                    setPassword(client.password || '');
                    setAlterId(String(client.alterId || 0));
                }
                setDecryption(settings.decryption || 'none');

                // Shadowsocks
                if (editingNode.protocol === 'shadowsocks') {
                    setSsMethod(settings.method || 'chacha20-ietf-poly1305');
                    setSsPassword(settings.password || '');
                    setSsNetwork(settings.network || 'tcp,udp');
                }
            }

            // 加载传输层设置
            if (editingNode.streamSettings) {
                const stream = editingNode.streamSettings;
                setNetwork(stream.network || 'tcp');
                setSecurity(stream.security || 'none');

                // WebSocket
                if (stream.wsSettings) {
                    setWsPath(stream.wsSettings.path || '/');
                    setWsHost(stream.wsSettings.headers?.Host || '');
                }

                // gRPC
                if (stream.grpcSettings) {
                    setGrpcServiceName(stream.grpcSettings.serviceName || '');
                    setGrpcMultiMode(stream.grpcSettings.multiMode || false);
                }

                // HTTP/2
                if (stream.httpSettings) {
                    setH2Host(stream.httpSettings.host?.join(',') || '');
                    setH2Path(stream.httpSettings.path || '/');
                }

                // XHTTP
                if (stream.xhttpSettings) {
                    setXhttpMode(stream.xhttpSettings.mode || 'auto');
                    setXhttpPath(stream.xhttpSettings.path || '/');
                    setXhttpHost(stream.xhttpSettings.host || '');
                }

                // TLS
                if (stream.tlsSettings) {
                    setTlsServerName(stream.tlsSettings.serverName || '');
                    setTlsAlpn(stream.tlsSettings.alpn?.join(',') || 'h2,http/1.1');
                    setTlsAllowInsecure(stream.tlsSettings.allowInsecure || false);
                }

                // Reality
                if (stream.realitySettings) {
                    const rs = stream.realitySettings;
                    setRealityShow(rs.show || false);
                    setRealityDest(rs.dest || 'www.microsoft.com:443');
                    setRealityXver(String(rs.xver || 0));
                    setRealityFingerprint(rs.fingerprint || 'chrome');
                    setRealityServerNames(rs.serverNames?.join('\n') || 'www.microsoft.com');
                    setRealityPrivateKey(rs.privateKey || '');
                    setRealityPublicKey(rs.publicKey || '');
                    setRealityShortIds(rs.shortIds?.join('\n') || '');
                    setRealityMinClientVer(rs.minClientVer || '');
                    setRealityMaxClientVer(rs.maxClientVer || '');
                    setRealityMaxTimeDiff(String(rs.maxTimeDiff || ''));
                }

                // Socket 选项
                if (stream.sockopt) {
                    setTcpFastOpen(stream.sockopt.tcpFastOpen ?? true);
                    setTcpNoDelay(stream.sockopt.tcpNoDelay ?? true);
                }

                setAcceptProxyProtocol(stream.acceptProxyProtocol || false);
            }

        } else if (isOpen) {
            // 重置为默认值
            resetForm();
        }
    }, [isOpen, editingNode]);

    const resetForm = () => {
        setRemark('');
        setIsEnable(true);
        setProtocol('vless');
        setTag('');
        setListen('');
        setPort(String(Math.floor(Math.random() * 50000) + 10000));
        setTotalTraffic('0');
        setExpiryTime('');
        setUuid(crypto.randomUUID());
        setFlow('');
        setLevel('0');
        setEmail('');
        setAlterId('0');
        setPassword('');
        setSsMethod('chacha20-ietf-poly1305');
        setSsPassword('');
        setSsNetwork('tcp,udp');
        setDecryption('none');
        setNetwork('tcp');
        setWsPath('/');
        setWsHost('');
        setGrpcServiceName('');
        setGrpcMultiMode(false);
        setH2Host('');
        setH2Path('/');
        setXhttpMode('auto');
        setXhttpPath('/');
        setXhttpHost('');
        setSecurity('none');
        setTlsServerName('');
        setTlsAlpn('h2,http/1.1');
        setTlsAllowInsecure(false);
        setRealityShow(false);
        setRealityDest('www.microsoft.com:443');
        setRealityXver('0');
        setRealityFingerprint('chrome');
        setRealityServerNames('www.microsoft.com');
        setRealityPrivateKey('');
        setRealityPublicKey('');
        setRealityShortIds('');
        setRealityMinClientVer('');
        setRealityMaxClientVer('');
        setRealityMaxTimeDiff('');
        setAcceptProxyProtocol(false);
        setTcpFastOpen(true);
        setTcpNoDelay(true);

        // 自动生成 Reality 密钥对
        const mockPriv = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const mockPub = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        setRealityPrivateKey(mockPriv);
        setRealityPublicKey(mockPub);
    };

    const generateRealityKeys = () => {
        const mockPriv = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const mockPub = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        setRealityPrivateKey(mockPriv);
        setRealityPublicKey(mockPub);
    };

    const generateShortIds = () => {
        // 生成一个 8 位随机十六进制字符串
        const shortId = Array.from(crypto.getRandomValues(new Uint8Array(4)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        setRealityShortIds(shortId);
    };


    const handleConfirm = () => {
        // 验证必填项
        if (!remark.trim()) {
            useDialogStore.getState().showAlert('请输入备注名称', '验证失败');
            return;
        }
        if (!port || isNaN(Number(port))) {
            useDialogStore.getState().showAlert('请输入有效的端口号', '验证失败');
            return;
        }

        // 构建协议设置
        let settings: any = {};

        if (protocol === 'vless' || protocol === 'vmess') {
            if (!uuid) {
                useDialogStore.getState().showAlert('UUID 不能为空', '验证失败');
                return;
            }
            settings.clients = [{
                id: uuid,
                ...(flow && protocol === 'vless' && { flow }),
                ...(level && { level: Number(level) }),
                ...(email && { email }),
                ...(protocol === 'vmess' && { alterId: Number(alterId) }),
            }];
            if (protocol === 'vless') {
                settings.decryption = decryption;
            }
        } else if (protocol === 'trojan') {
            if (!password) {
                useDialogStore.getState().showAlert('Trojan 密码不能为空', '验证失败');
                return;
            }
            settings.clients = [{
                password,
                ...(level && { level: Number(level) }),
                ...(email && { email }),
            }];
        } else if (protocol === 'shadowsocks') {
            if (!ssPassword) {
                useDialogStore.getState().showAlert('Shadowsocks 密码不能为空', '验证失败');
                return;
            }
            settings = {
                method: ssMethod,
                password: ssPassword,
                network: ssNetwork,
            };
        }

        // 构建传输层设置
        let streamSettings: any = {
            network,
            security,
        };

        // 添加传输协议特定配置
        if (network === 'ws') {
            streamSettings.wsSettings = {
                path: wsPath,
                ...(wsHost && { headers: { Host: wsHost } }),
            };
        } else if (network === 'grpc') {
            streamSettings.grpcSettings = {
                serviceName: grpcServiceName,
                multiMode: grpcMultiMode,
            };
        } else if (network === 'h2') {
            streamSettings.httpSettings = {
                ...(h2Host && { host: h2Host.split(',').map(h => h.trim()) }),
                path: h2Path,
            };
        } else if (network === 'xhttp') {
            streamSettings.xhttpSettings = {
                mode: xhttpMode,
                path: xhttpPath,
                ...(xhttpHost && { host: xhttpHost }),
            };
        }

        // 添加安全层配置
        if (security === 'tls') {
            streamSettings.tlsSettings = {
                ...(tlsServerName && { serverName: tlsServerName }),
                ...(tlsAlpn && { alpn: tlsAlpn.split(',').map(a => a.trim()) }),
                allowInsecure: tlsAllowInsecure,
            };
        } else if (security === 'reality') {
            if (!realityPrivateKey) {
                useDialogStore.getState().showAlert('Reality 私钥不能为空', '验证失败');
                return;
            }
            streamSettings.realitySettings = {
                show: realityShow,
                dest: realityDest,
                xver: Number(realityXver),
                serverNames: realityServerNames.split('\n').filter(s => s.trim()),
                privateKey: realityPrivateKey,
                publicKey: realityPublicKey, // 必须保存公钥，否则无法生成分享链接
                shortIds: realityShortIds.split('\n').filter(s => s.trim()),
                fingerprint: realityFingerprint,
                ...(realityMinClientVer && { minClientVer: realityMinClientVer }),
                ...(realityMaxClientVer && { maxClientVer: realityMaxClientVer }),
                ...(realityMaxTimeDiff && { maxTimeDiff: Number(realityMaxTimeDiff) }),
            };
        }

        // Socket 选项
        if (tcpFastOpen || tcpNoDelay || acceptProxyProtocol) {
            streamSettings.sockopt = {
                ...(tcpFastOpen && { tcpFastOpen: true }),
                ...(tcpNoDelay && { tcpNoDelay: true }),
            };
        }

        if (acceptProxyProtocol) {
            streamSettings.acceptProxyProtocol = true;
        }

        const data: any = {
            id: editingNode?.id || crypto.randomUUID(),
            remark,
            enable: isEnable,
            port: Number(port),
            protocol,
            ...(tag && { tag }),
            ...(listen && { listen }),
            settings,
            streamSettings,
            total: Number(totalTraffic) * 1024 * 1024 * 1024,
            expiry: expiryTime ? new Date(expiryTime).getTime() : 0,
            up: editingNode?.up || 0,
            down: editingNode?.down || 0,
        };

        if (editingNode) {
            updateInbound(data);
        } else {
            addInbound(data);
        }
        closeModal();
    };

    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editingNode ? '编辑节点' : '添加节点'}
                    </h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-black transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 滚动区域 */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar text-black">
                    {/* 基础配置 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 text-sm border-b pb-2">基础配置</h3>

                        <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-8 flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                    <span className="text-red-500 mr-1">*</span>备注:
                                </label>
                                <input
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                    placeholder="节点备注名称"
                                />
                            </div>
                            <div className="col-span-4 flex items-center gap-3 justify-end">
                                <label className="text-sm font-bold text-gray-600">启用:</label>
                                <Switch checked={isEnable} onChange={setIsEnable} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                    <span className="text-red-500 mr-1">*</span>协议:
                                </label>
                                <select
                                    value={protocol}
                                    onChange={(e) => setProtocol(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none cursor-pointer bg-white"
                                    disabled
                                >
                                    <option value="vless">VLESS</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                    <span className="text-red-500 mr-1">*</span>端口:
                                </label>
                                <input
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    placeholder="1-65535"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">标签:</label>
                                <input
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    placeholder="自动生成"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">监听IP:</label>
                                <input
                                    value={listen}
                                    onChange={(e) => setListen(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    placeholder="0.0.0.0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">总流量(GB):</label>
                                <input
                                    value={totalTraffic}
                                    onChange={(e) => setTotalTraffic(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    placeholder="0 = 无限制"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">到期时间:</label>
                                <input
                                    type="date"
                                    value={expiryTime}
                                    onChange={(e) => setExpiryTime(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none cursor-pointer bg-white"
                                />
                            </div>
                        </div>
                    </div>


                    {/* UUID 和流控 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 text-sm border-b pb-2">协议配置</h3>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                <span className="text-red-500 mr-1">*</span>UUID:
                            </label>
                            <input
                                value={uuid}
                                onChange={(e) => setUuid(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono outline-none bg-white"
                            />
                            <button
                                onClick={() => setUuid(crypto.randomUUID())}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                            >
                                生成
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">流控:</label>
                            <select
                                value={flow}
                                onChange={(e) => setFlow(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                            >
                                <option value="">无</option>
                                <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                            </select>
                            <span className="text-xs text-red-500 font-medium shrink-0">XHTTP 保持无流控</span>
                        </div>
                    </div>

                    {/* 传输层配置 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 text-sm border-b pb-2">传输层配置</h3>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">传输协议:</label>
                            <select
                                value={network}
                                onChange={(e) => setNetwork(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                            >
                                <option value="tcp">TCP</option>
                                <option value="xhttp">XHTTP</option>
                            </select>
                        </div>

                        {network === 'xhttp' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">模式:</label>
                                    <select
                                        value={xhttpMode}
                                        onChange={(e) => setXhttpMode(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    >
                                        <option value="auto">自动 (推荐)</option>
                                        <option value="packet-up">Packet Up (兼容性最强)</option>
                                        <option value="stream-up">Stream Up (性能更好)</option>
                                        <option value="stream-one">Stream One</option>
                                    </select>
                                    <span className="text-xs text-gray-500 shrink-0">默认: auto</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">路径:</label>
                                    <input
                                        value={xhttpPath}
                                        onChange={(e) => setXhttpPath(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                        placeholder="/xhttp (推荐) 或 /"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">Host:</label>
                                    <input
                                        value={xhttpHost}
                                        onChange={(e) => setXhttpHost(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                        placeholder="留空使用默认值 (可选)"
                                    />
                                    <span className="text-xs text-gray-500 shrink-0">可选</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 安全层配置 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 text-sm border-b pb-2">安全层配置</h3>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">安全类型:</label>
                            <select
                                value={security}
                                onChange={(e) => {
                                    setSecurity(e.target.value);
                                    // 当选择 Reality 时自动生成短 ID
                                    if (e.target.value === 'reality' && !realityShortIds) {
                                        generateShortIds();
                                    }
                                }}
                                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                            >
                                <option value="none">无</option>
                                <option value="tls">TLS</option>
                                <option value="reality">Reality</option>
                            </select>
                        </div>

                        {security === 'tls' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">服务器名称:</label>
                                    <input
                                        value={tlsServerName}
                                        onChange={(e) => setTlsServerName(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                        placeholder="example.com"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">ALPN:</label>
                                    <input
                                        value={tlsAlpn}
                                        onChange={(e) => setTlsAlpn(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                        placeholder="h2,http/1.1"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">允许不安全:</label>
                                    <Switch checked={tlsAllowInsecure} onChange={setTlsAllowInsecure} />
                                </div>
                            </>
                        )}

                        {security === 'reality' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                        <span className="text-red-500 mr-1">*</span>目标地址:
                                    </label>
                                    <input
                                        value={realityDest}
                                        onChange={(e) => setRealityDest(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                        placeholder="www.microsoft.com:443"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">服务器名称:</label>
                                    <textarea
                                        value={realityServerNames}
                                        onChange={(e) => setRealityServerNames(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white resize-none"
                                        rows={2}
                                        placeholder="每行一个"
                                    />
                                </div>


                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">指纹:</label>
                                    <select
                                        value={realityFingerprint}
                                        onChange={(e) => setRealityFingerprint(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none bg-white"
                                    >
                                        <option value="chrome">Chrome</option>
                                        <option value="firefox">Firefox</option>
                                        <option value="safari">Safari</option>
                                        <option value="edge">Edge</option>
                                    </select>
                                </div>


                                <div className="flex gap-2">
                                    <button
                                        onClick={generateRealityKeys}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                                    >
                                        生成 Reality 密钥
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">
                                        <span className="text-red-500 mr-1">*</span>私钥:
                                    </label>
                                    <input
                                        value={realityPrivateKey}
                                        onChange={(e) => setRealityPrivateKey(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono outline-none bg-white"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">公钥:</label>
                                    <input
                                        value={realityPublicKey}
                                        onChange={(e) => setRealityPublicKey(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono outline-none bg-white"
                                        readOnly
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 w-24 text-right shrink-0">短ID:</label>
                                    <textarea
                                        value={realityShortIds}
                                        onChange={(e) => setRealityShortIds(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono outline-none bg-white resize-none"
                                        rows={2}
                                        placeholder="每行一个,可留空"
                                    />
                                    <button
                                        onClick={generateShortIds}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors shrink-0"
                                    >
                                        生成
                                    </button>
                                </div>
                            </>
                        )}
                    </div>




                    {/* Socket 选项 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Socket 选项</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-40 text-right shrink-0">Accept Proxy Protocol:</label>
                                <Switch checked={acceptProxyProtocol} onChange={setAcceptProxyProtocol} />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-40 text-right shrink-0">TCP Fast Open:</label>
                                <Switch checked={tcpFastOpen} onChange={setTcpFastOpen} />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-600 w-40 text-right shrink-0">TCP No Delay:</label>
                                <Switch checked={tcpNoDelay} onChange={setTcpNoDelay} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={closeModal}
                        className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold border border-black hover:bg-gray-50 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                        {editingNode ? '保存' : '添加'}
                    </button>
                </div>
            </div>
        </div>
    );
};
