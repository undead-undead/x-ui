export interface PanelConfig {
    listenIp: string;
    port: number;
    webRoot: string;
    sslCertPath: string;
    sslKeyPath: string;
}

export interface AuthConfig {
    oldUsername: string;
    oldPassword: string;
    newUsername: string;
    newPassword: string;
}

export interface AllSettings {
    panel: PanelConfig;
    auth: AuthConfig;
}

export interface SettingStore extends AllSettings {
    isRestarting: boolean;
    savedPanel: PanelConfig | null;  // 已保存的面板配置（用于重启）
    // 允许接收 string | number 兼容 input，内部转换
    updatePanel: (data: Partial<Record<keyof PanelConfig, string | number>>) => void;
    updateAuth: (data: Partial<AuthConfig>) => void;
    savePanelConfig: () => void;      // 顶部按钮逻辑
    confirmUpdateAuth: () => void;    // 黑色修改按钮逻辑
    restartPanel: () => void;         // 重启面板逻辑
    exportDb: () => Promise<void>;
    importDb: (file: File) => Promise<void>;
}