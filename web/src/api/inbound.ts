import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { Inbound } from '../types/inbound';

// 我们直接使用 '../types/inbound' 中的完整定义
export type { Inbound };

export interface CreateInboundRequest {
    port: number;
    protocol: string;
    remark: string;
    settings?: any;
    streamSettings?: any;
    sniffing?: any;
}

export interface UpdateInboundRequest {
    port?: number;
    protocol?: string;
    remark?: string;
    enable?: boolean;
    settings?: any;
    streamSettings?: any;
    sniffing?: any;
}

/**
 * Inbound 相关 API
 */
export const inboundApi = {
    /**
     * 获取所有 Inbound
     */
    getInbounds: async (): Promise<ApiResponse<Inbound[]>> => {
        const response = await apiClient.get<ApiResponse<Inbound[]>>('/inbound/list');
        return response.data;
    },

    /**
     * 获取单个 Inbound
     */
    getInbound: async (id: string): Promise<ApiResponse<Inbound>> => {
        const response = await apiClient.get<ApiResponse<Inbound>>(`/inbound/get?id=${id}`);
        return response.data;
    },

    /**
     * 创建 Inbound
     */
    createInbound: async (data: CreateInboundRequest): Promise<ApiResponse<Inbound>> => {
        const response = await apiClient.post<ApiResponse<Inbound>>('/inbound/add', data);
        return response.data;
    },

    /**
     * 更新 Inbound
     */
    updateInbound: async (id: string, data: UpdateInboundRequest): Promise<ApiResponse<Inbound>> => {
        // 后端 update 接口支持全量更新，包含 id
        const response = await apiClient.post<ApiResponse<Inbound>>('/inbound/update', { ...data, id });
        return response.data;
    },

    /**
     * 删除 Inbound
     */
    deleteInbound: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post<ApiResponse<void>>('/inbound/del', { id });
        return response.data;
    },

    /**
     * 切换 Inbound 启用状态 (模拟，因为后端通常集成在 update 中)
     */
    toggleInbound: async (id: string, enable: boolean): Promise<ApiResponse<Inbound>> => {
        const response = await apiClient.post<ApiResponse<Inbound>>('/inbound/update', { id, enable });
        return response.data;
    },

    /**
     * 后端验证 Reality 域名 TLS 1.3 支持
     * @param domain - 待检测域名
     */
    checkReality: async (domain: string): Promise<ApiResponse<{ is_valid: boolean, has_tls13: boolean, key_exchange: string, latency: number, message: string }>> => {
        const response = await apiClient.post<ApiResponse<{ is_valid: boolean, has_tls13: boolean, key_exchange: string, latency: number, message: string }>>('/inbound/check-reality', { domain });
        return response.data;
    },

    resetTraffic: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post<ApiResponse<void>>('/inbound/reset-traffic', { id });
        return response.data;
    },
};


