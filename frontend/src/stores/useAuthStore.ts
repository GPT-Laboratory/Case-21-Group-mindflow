import { create } from 'zustand';
import { authApi, ltiApi } from '@/services/apiClient';
import { useFlowsStore } from '@/AgenticContentFlow/stores/useFlowsStore';

interface AuthState {
    authenticated: boolean;
    provider: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    roles: string | null;
    isInstructor: boolean;
    loading: boolean;
    error: string | null;
    fetchSession: () => Promise<void>;
    startGoogleLogin: () => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    authenticated: false,
    provider: null,
    userId: null,
    userName: null,
    userEmail: null,
    roles: null,
    isInstructor: false,
    loading: true,
    error: null,

    fetchSession: async () => {
        try {
            set({ loading: true, error: null });
            const [authSession, ltiSession] = await Promise.all([
                authApi.getSession(),
                ltiApi.getSession(),
            ]);

            const authenticated = Boolean(authSession.authenticated || ltiSession.authenticated);
            const provider = authSession.authenticated
                ? (authSession.provider ?? 'google')
                : (ltiSession.authenticated ? 'lti' : null);

            // Google users are always instructors; LTI users check roles
            const isInstructor = authSession.authenticated
                || (ltiSession.authenticated && (ltiSession.roles?.toLowerCase().includes('instructor') ?? false));

            set({
                authenticated,
                provider,
                userId: authSession.user_id ?? ltiSession.user_id ?? null,
                userName: authSession.user_name ?? ltiSession.user_name ?? null,
                userEmail: authSession.user_email ?? ltiSession.user_email ?? null,
                roles: ltiSession.roles ?? null,
                isInstructor,
                loading: false,
            });
        } catch {
            set({
                authenticated: false,
                provider: null,
                userId: null,
                userName: null,
                userEmail: null,
                roles: null,
                isInstructor: false,
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
        useFlowsStore.getState().clearAllFlows();
        set({
            authenticated: false,
            provider: null,
            userId: null,
            userName: null,
            userEmail: null,
            roles: null,
            isInstructor: false,
        });
    },
}));
