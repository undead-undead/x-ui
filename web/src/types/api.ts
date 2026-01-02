// API 通用响应类型
export interface ApiResponse<T = any> {
    success: boolean;
    msg: string;
    obj: T;
}

// 系统状态相关类型
export interface SystemMemory {
    current: number;
    total: number;
}

export interface SystemDisk {
    current: number;
    total: number;
}

export interface XrayStatus {
    state: 'running' | 'stop' | 'error';
    version: string;
}

export interface NetworkTraffic {
    sent: number;
    recv: number;
}

export interface NetworkIO {
    up: number;
    down: number;
}

export interface SystemStatusData {
    cpu: number;
    mem: SystemMemory;
    swap: SystemMemory;
    disk: SystemDisk;
    uptime: number; // 秒
    load: number[]; // [1, 5, 15]
    xray: XrayStatus;
    tcpCount: number;
    udpCount: number;
    netTraffic: NetworkTraffic;
    netIo: NetworkIO;
}

export type ApiSysStatus = ApiResponse<SystemStatusData>;

// 认证相关类型
export interface UpdateCredentialsRequest {
    oldUsername: string;
    oldPassword: string;
    newUsername: string;
    newPassword: string;
}

// 日志响应类型
export type ApiLogsResponse = ApiResponse<string[]>;

// Xray 版本更新请求
export interface UpdateXrayVersionRequest {
    version: string;
}
