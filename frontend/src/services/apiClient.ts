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
