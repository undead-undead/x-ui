import { create } from 'zustand';

interface DialogState {
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
}

interface DialogStore extends DialogState {
    showAlert: (message: string, title?: string, onConfirm?: () => void) => void;
    showConfirm: (message: string, onConfirm: () => void, title?: string) => Promise<boolean>;
    close: () => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: null,
    onCancel: null,

    showAlert: (message: string, title: string = '提示', onConfirm?: () => void) => {
        set({
            isOpen: true,
            type: 'alert',
            title,
            message,
            confirmText: '确定',
            onConfirm: () => {
                get().close();
                if (onConfirm) onConfirm();
            },
            onCancel: null,
        });
    },

    showConfirm: (message: string, onConfirm: () => void, title: string = '确认操作') => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                confirmText: '确定',
                cancelText: '取消',
                onConfirm: () => {
                    // 先关闭对话框
                    get().close();
                    // 使用 setTimeout 确保对话框关闭动画开始后再执行回调
                    setTimeout(() => {
                        onConfirm();
                        resolve(true);
                    }, 0);
                },
                onCancel: () => {
                    get().close();
                    resolve(false);
                },
            });
        });
    },

    close: () => {
        set({
            isOpen: false,
            onConfirm: null,
            onCancel: null,
        });
    },
}));
