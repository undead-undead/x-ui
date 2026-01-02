// Xray 完整类型定义

export interface Client {
    id?: string;                    // VLESS/VMess UUID
    flow?: string;                  // VLESS 流控
    level?: number;                 // 用户等级
    email?: string;                 // 用户标识
    password?: string;              // Trojan/Shadowsocks 密码
    alterId?: number;               // VMess 额外 ID
    method?: string;                // Shadowsocks 加密方法
}

export interface InboundSettings {
    clients?: Client[];
    decryption?: string;            // VLESS 解密
    encryption?: string;            // 加密
    method?: string;                // Shadowsocks 加密方法
    password?: string;              // Shadowsocks 密码
    network?: string;               // Shadowsocks 网络类型
    [key: string]: any;
}

export interface RealitySettings {
    show?: boolean;
    dest?: string;
    xver?: number;
    serverNames?: string[];
    privateKey?: string;
    publicKey?: string;
    shortIds?: string[];
    fingerprint?: string;
    minClientVer?: string;
    maxClientVer?: string;
    maxTimeDiff?: number;
    [key: string]: any;
}

export interface TlsSettings {
    serverName?: string;
    alpn?: string[];
    allowInsecure?: boolean;
    certificates?: any[];
    [key: string]: any;
}

export interface WsSettings {
    path?: string;
    headers?: {
        Host?: string;
        [key: string]: string | undefined;
    };
    [key: string]: any;
}

export interface GrpcSettings {
    serviceName?: string;
    multiMode?: boolean;
    [key: string]: any;
}

export interface HttpSettings {
    host?: string[];
    path?: string;
    [key: string]: any;
}

export interface Sockopt {
    tcpFastOpen?: boolean;
    tcpNoDelay?: boolean;
    acceptProxyProtocol?: boolean;
    [key: string]: any;
}

export interface StreamSettings {
    network?: string;
    security?: string;
    acceptProxyProtocol?: boolean;

    // 传输协议配置
    wsSettings?: WsSettings;
    grpcSettings?: GrpcSettings;
    httpSettings?: HttpSettings;
    tcpSettings?: any;
    kcpSettings?: any;
    quicSettings?: any;
    xhttpSettings?: any;

    // 安全层配置
    tlsSettings?: TlsSettings;
    realitySettings?: RealitySettings;

    // Socket 选项
    sockopt?: Sockopt;

    [key: string]: any;
}

export interface SniffingSettings {
    enabled: boolean;
    destOverride?: string[];
    metadataOnly?: boolean;
    routeOnly?: boolean;
}

export interface Inbound {
    id: string;
    remark: string;
    enable: boolean;
    port: number;
    protocol: string;

    // 新增字段
    tag?: string;
    listen?: string;
    allocate?: any;

    // 配置
    settings?: InboundSettings;
    streamSettings?: StreamSettings;
    sniffing?: SniffingSettings;

    // 流量统计
    up: number;
    down: number;
    total: number;
    expiry: number;

    // 时间戳
    createdAt?: string;
    updatedAt?: string;
}