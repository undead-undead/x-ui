import { create } from 'zustand';
import { sysApi } from '../api/system';

interface LogsState {
    isOpen: boolean;
    logs: string[];
    isLoading: boolean;
    open: () => void;
    close: () => void;
    fetchLogs: () => Promise<void>;
}

export const useLogsStore = create<LogsState>((set) => ({
    isOpen: false,
    logs: [],
    isLoading: false,
    open: () => {
        set({ isOpen: true });
        useLogsStore.getState().fetchLogs();
    },
    close: () => set({ isOpen: false }),
    fetchLogs: async () => {
        set({ isLoading: true });
        try {
            const res = await sysApi.getLogs();
            if (res.success) {
                set({ logs: res.obj });
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            set({ logs: ['获取日志失败，请检查后端连接。'] });
        } finally {
            set({ isLoading: false });
        }
    }
}));
