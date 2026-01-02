import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api';

/**
 * 客户端（Client）相关 API
 */
export const clientApi = {
    /**
     * 获取所有客户端
     */
    getClients: async (): Promise<ApiResponse> => {
        const response = await apiClient.get('/clients');
        return response.data;
    },

    /**
     * 获取单个客户端
     * @param id - 客户端 ID
     */
    getClient: async (id: string): Promise<ApiResponse> => {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data;
    },

    /**
     * 创建客户端
     * @param data - 客户端数据
     */
    createClient: async (data: any): Promise<ApiResponse> => {
        const response = await apiClient.post('/clients', data);
        return response.data;
    },

    /**
     * 更新客户端
     * @param id - 客户端 ID
     * @param data - 更新的数据
     */
    updateClient: async (id: string, data: any): Promise<ApiResponse> => {
        const response = await apiClient.put(`/clients/${id}`, data);
        return response.data;
    },

    /**
     * 删除客户端
     * @param id - 客户端 ID
     */
    deleteClient: async (id: string): Promise<ApiResponse> => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },
};
