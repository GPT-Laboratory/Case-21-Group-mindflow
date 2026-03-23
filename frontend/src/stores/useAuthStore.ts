import { create } from 'zustand';
import { authApi, ltiApi } from '@/services/apiClient';

interface AuthState {
    authenticated: boolean;
    provider: string | null;
    userName: string | null;
    userEmail: string | null;
    roles: string | null;
    loading: boolean;
    error: string | null;
    fetchSession: () => Promise<void>;
    startGoogleLogin: () => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    authenticated: false,
    provider: null,
    userName: null,
    userEmail: null,
    roles: null,
    loading: true,
    error: null,

    fetchSession: async () => {
        try {
            set({ loading: true, error: null });
            const [authSession, ltiSession] = await Promise.all([
                authApi.getSession(),
                ltiApi.getSession(),
            ]);

            set({
                authenticated: Boolean(authSession.authenticated || ltiSession.authenticated),
                provider: authSession.authenticated ? (authSession.provider ?? 'google') : (ltiSession.authenticated ? 'lti' : null),
                userName: authSession.user_name ?? ltiSession.user_name ?? null,
                userEmail: authSession.user_email ?? ltiSession.user_email ?? null,
                roles: ltiSession.roles ?? null,
                loading: false,
            });
        } catch {
            set({
                authenticated: false,
                provider: null,
                userName: null,
                userEmail: null,
                roles: null,
                loading: false,
                error: 'Failed to check session',
            });
        }
    },

    startGoogleLogin: () => {
        authApi.startGoogleLogin();
    },

    logout: async () => {
        await authApi.logout();
        set({
            authenticated: false,
            provider: null,
            userName: null,
            userEmail: null,
            roles: null,
        });
    },
}));
