import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import axios from 'axios';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            token: null,
            login: async (username, password) => {
                try {
                    const response = await axios.post('/api/auth/login', { username, password });
                    if (response.data.success) {
                        const token = response.data.obj.token;
                        set({ isAuthenticated: true, token });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Login failed:', error);
                    return false;
                }
            },
            logout: () => set({ isAuthenticated: false, token: null }),
        }),
        {
            name: 'x-ui-auth-storage',
        }
    )
);
