/** @format */

/**
 * Unified API Client
 *
 * All calls to the Python backend go through this module.
 * The `/api` path is proxied by:
 *   - Vite dev server  → API_PROXY_TARGET (defaults to http://localhost:8000)
 *   - nginx production → proxy_pass http://backend:8000
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

async function apiFetch<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const response = await fetch(`/api${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<ApiResponse<T>>;
}

// ─── Flows ────────────────────────────────────────────────────────────────────

export interface FlowData {
    id: string;
    name: string;
    description: string;
    lastModified: string;
    nodeCount: number;
    edgeCount: number;
    type: 'template' | 'saved' | 'recent';
    nodes: any[];
    edges: any[];
    metadata?: Record<string, any>;
}

export interface FlowPayload {
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    nodeCount?: number;
    edgeCount?: number;
    type?: string;
    metadata?: Record<string, any>;
}

export const flowsApi = {
    getAll: () => apiFetch<FlowData[]>('/flows/'),
    getById: (id: string) => apiFetch<FlowData>(`/flows/${id}`),
    create: (payload: FlowPayload) =>
        apiFetch<FlowData>('/flows/', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                nodeCount: payload.nodeCount ?? payload.nodes.length,
                edgeCount: payload.edgeCount ?? payload.edges.length,
                type: payload.type ?? 'saved',
                metadata: payload.metadata ?? {},
            }),
        }),
    update: (id: string, payload: FlowPayload) =>
        apiFetch<FlowData>(`/flows/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                ...payload,
                nodeCount: payload.nodeCount ?? payload.nodes.length,
                edgeCount: payload.edgeCount ?? payload.edges.length,
                type: payload.type ?? 'saved',
                metadata: payload.metadata ?? {},
            }),
        }),
    delete: (id: string) => apiFetch<boolean>(`/flows/${id}`, { method: 'DELETE' }),
};

// ─── Node Types ───────────────────────────────────────────────────────────────

export interface NodeTypeData {
    nodeType: string;
    defaultLabel: string;
    category: string;
    group: string;
    description?: string;
    visual: any;
    handles: any;
    process: any;
    defaultDimensions?: any;
    createdAt?: string;
    updatedAt?: string;
}

export const nodeTypesApi = {
    getAll: () => apiFetch<NodeTypeData[]>('/nodeTypes/'),
    getById: (nodeType: string) =>
        apiFetch<NodeTypeData>(`/nodeTypes/${encodeURIComponent(nodeType)}`),
    create: (payload: NodeTypeData) =>
        apiFetch<NodeTypeData>('/nodeTypes/', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    update: (nodeType: string, payload: Partial<NodeTypeData>) =>
        apiFetch<NodeTypeData>(`/nodeTypes/${encodeURIComponent(nodeType)}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),
    delete: (nodeType: string) =>
        apiFetch<boolean>(`/nodeTypes/${encodeURIComponent(nodeType)}`, { method: 'DELETE' }),
};

// ─── RAG / Documents ─────────────────────────────────────────────────────────

export interface DocumentData {
    id: number;
    filename: string;
    doc_path: string | null;
    course_id: string | null;
    module_id: string | null;
    module_name: string | null;
    exercise_id: string | null;
    exercise_name: string | null;
    processing_status: 'processing' | 'processed' | 'failed';
    created_dt: string;
}

export const ragApi = {
    getDocuments: async (params?: {
        exercise_id?: string;
        course_id?: string;
        module_id?: string;
    }): Promise<DocumentData[]> => {
        const url = new URL('/api/rag/documents', window.location.origin);
        if (params?.exercise_id) url.searchParams.set('exercise_id', params.exercise_id);
        if (params?.course_id) url.searchParams.set('course_id', params.course_id);
        if (params?.module_id) url.searchParams.set('module_id', params.module_id);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    uploadDocument: async (
        file: File,
        params?: {
            course_id?: string;
            module_id?: string;
            module_name?: string;
            exercise_id?: string;
            exercise_name?: string;
        }
    ): Promise<DocumentData> => {
        const formData = new FormData();
        formData.append('file', file);
        if (params?.exercise_id) formData.append('exercise_id', params.exercise_id);
        if (params?.exercise_name) formData.append('exercise_name', params.exercise_name);
        if (params?.course_id) formData.append('course_id', params.course_id);
        if (params?.module_id) formData.append('module_id', params.module_id);
        if (params?.module_name) formData.append('module_name', params.module_name);

        const response = await fetch('/api/rag/upload', { method: 'POST', body: formData });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).detail || `HTTP ${response.status}`);
        }
        return response.json();
    },

    deleteDocument: async (docId: number): Promise<void> => {
        const response = await fetch(`/api/rag/documents/${docId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    },
};

// ─── Evaluation ───────────────────────────────────────────────────────────────

export const evalApi = {
    evaluate: async (payload: {
        flow_data: any;
        course_id: string;
        module_id: string;
        exercise_id?: string;
    }): Promise<any> => {
        const response = await fetch('/api/eval/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).detail || `HTTP ${response.status}`);
        }
        return response.json();
    },
};

// ─── Flow Config / Settings ──────────────────────────────────────────────────

export interface FlowConfig {
    flow_id: string;
    name: string;
    description: string | null;
    is_published: boolean;
    access_key_required: boolean;
    access_key: string | null;
    owner_id: string | null;
    course_id: string | null;
    module_id: string | null;
    exercise_id: string | null;
    lti_exercise_url: string | null;
    collaborators: { user_id: string; added_by: string | null; created_at: string | null }[];
}

export interface FlowConfigUpdate {
    name?: string;
    description?: string;
    is_published?: boolean;
    access_key_required?: boolean;
    access_key?: string;
    course_id?: string;
    module_id?: string;
    exercise_id?: string;
}

export const flowConfigApi = {
    getConfig: async (flowId: string): Promise<FlowConfig> => {
        const response = await fetch(`/api/flows/${flowId}/config`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    updateConfig: async (flowId: string, updates: FlowConfigUpdate): Promise<FlowConfig> => {
        const response = await fetch(`/api/flows/${flowId}/config`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    regenerateKey: async (flowId: string): Promise<{ access_key: string }> => {
        const response = await fetch(`/api/flows/${flowId}/config/regenerate-key`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    listCollaborators: async (flowId: string): Promise<{ collaborators: FlowConfig['collaborators'] }> => {
        const response = await fetch(`/api/flows/${flowId}/collaborators`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    addCollaborator: async (flowId: string, userId: string): Promise<{ collaborators: FlowConfig['collaborators'] }> => {
        const response = await fetch(`/api/flows/${flowId}/collaborators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).detail || `HTTP ${response.status}`);
        }
        return response.json();
    },

    removeCollaborator: async (flowId: string, userId: string): Promise<{ collaborators: FlowConfig['collaborators'] }> => {
        const response = await fetch(`/api/flows/${flowId}/collaborators/${encodeURIComponent(userId)}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },
};

// ─── LTI ─────────────────────────────────────────────────────────────────────

export interface LTICredential {
    consumerKey: string;
    consumerSecret: string;
}

export interface AuthSession {
    authenticated: boolean;
    provider?: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
}

export const authApi = {
    getSession: async (): Promise<AuthSession> => {
        const response = await fetch('/api/auth/session');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    startGoogleLogin: (): void => {
        window.location.href = '/api/auth/google/login';
    },

    logout: async (): Promise<void> => {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    },
};

export const ltiApi = {
    getCredentials: async (): Promise<LTICredential> => {
        const response = await fetch('/api/lti/credentials');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    regenerateCredential: async (): Promise<LTICredential> => {
        const response = await fetch('/api/lti/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'regenerate' }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    deleteCredential: async (id: string): Promise<void> => {
        const response = await fetch(`/api/lti/credentials/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    },

    getSession: async (): Promise<{ authenticated: boolean; user_name?: string; user_email?: string; roles?: string; exercise_id?: string; has_outcome_service?: boolean }> => {
        const response = await fetch('/api/lti/session');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    submitGrade: async (points: number, max_points: number = 100): Promise<{ success: boolean; message?: string; error?: string; response_body?: string }> => {
        const response = await fetch('/api/lti/submit-grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, max_points }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error((payload as any).detail || (payload as any).error || `HTTP ${response.status}`);
        }
        return payload;
    },
};
