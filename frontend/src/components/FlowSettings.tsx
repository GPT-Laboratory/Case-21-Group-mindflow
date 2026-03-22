import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Copy,
    ExternalLink,
    Globe,
    KeyRound,
    Loader2,
    Lock,
    RefreshCw,
    Save,
    Trash2,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { flowConfigApi, ragApi, type FlowConfig, type DocumentData } from '@/services/apiClient';

type SettingsDraft = {
    name: string;
    description: string;
    is_published: boolean;
    access_key_required: boolean;
    access_key: string;
    course_id: string;
    module_id: string;
    exercise_id: string;
};

function createAccessKey(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function createDraft(config: FlowConfig): SettingsDraft {
    return {
        name: config.name || '',
        description: config.description || '',
        is_published: config.is_published,
        access_key_required: config.access_key_required,
        access_key: config.access_key || '',
        course_id: config.course_id || '',
        module_id: config.module_id || '',
        exercise_id: config.exercise_id || '',
    };
}

export default function FlowSettings() {
    const { flowId } = useParams<{ flowId: string }>();
    const backToFlowPath = flowId ? `/flows/${flowId}` : '/flows';

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const [config, setConfig] = useState<FlowConfig | null>(null);
    const [draft, setDraft] = useState<SettingsDraft | null>(null);
    const [initialDraft, setInitialDraft] = useState<SettingsDraft | null>(null);

    const [copiedLti, setCopiedLti] = useState(false);
    const [copiedAccessKey, setCopiedAccessKey] = useState(false);

    const [collaboratorId, setCollaboratorId] = useState('');
    const [collaborators, setCollaborators] = useState<FlowConfig['collaborators']>([]);
    const [collaboratorError, setCollaboratorError] = useState<string | null>(null);

    // Document/RAG state
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (!flowId) return;

        const loadConfig = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await flowConfigApi.getConfig(flowId);
                setConfig(data);
                setCollaborators(data.collaborators);
                const d = createDraft(data);
                setDraft(d);
                setInitialDraft(d);

                // Load documents for this flow's exercise
                const exerciseId = data.exercise_id || data.flow_id;
                const docs = await ragApi.getDocuments({
                    exercise_id: exerciseId,
                    course_id: data.course_id || undefined,
                    module_id: data.module_id || undefined,
                });
                setDocuments(docs);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load config');
            } finally {
                setIsLoading(false);
            }
        };

        loadConfig();
    }, [flowId]);

    const hasChanges = useMemo(() => {
        if (!draft || !initialDraft) return false;
        return JSON.stringify(draft) !== JSON.stringify(initialDraft);
    }, [draft, initialDraft]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const ltiExerciseUrl = config?.lti_exercise_url ? `${origin}${config.lti_exercise_url}` : null;

    const handleSave = async () => {
        if (!flowId || !draft) return;

        if (draft.access_key_required && !draft.access_key.trim()) {
            setSaveError('Access key is required when access key protection is enabled.');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);
            setSaveSuccess(null);

            const updated = await flowConfigApi.updateConfig(flowId, {
                name: draft.name,
                description: draft.description.trim() || undefined,
                is_published: draft.is_published,
                access_key_required: draft.access_key_required,
                access_key: draft.access_key_required ? draft.access_key.trim() : undefined,
                course_id: draft.course_id.trim() || undefined,
                module_id: draft.module_id.trim() || undefined,
                exercise_id: draft.exercise_id.trim() || undefined,
            });

            setConfig(updated);
            const d = createDraft(updated);
            setDraft(d);
            setInitialDraft(d);
            setSaveSuccess('Settings saved.');
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyLtiUrl = async () => {
        if (!ltiExerciseUrl) return;
        await navigator.clipboard.writeText(ltiExerciseUrl);
        setCopiedLti(true);
        setTimeout(() => setCopiedLti(false), 2000);
    };

    const handleCopyAccessKey = async () => {
        if (!draft?.access_key) return;
        await navigator.clipboard.writeText(draft.access_key);
        setCopiedAccessKey(true);
        setTimeout(() => setCopiedAccessKey(false), 2000);
    };

    const handleRegenerateKey = async () => {
        if (!flowId) return;
        try {
            const result = await flowConfigApi.regenerateKey(flowId);
            setDraft((current) =>
                current ? { ...current, access_key_required: true, access_key: result.access_key } : current
            );
            setSaveSuccess(null);
        } catch {
            setSaveError('Failed to regenerate access key');
        }
    };

    const handleAddCollaborator = async () => {
        if (!flowId || !collaboratorId.trim()) return;
        try {
            setCollaboratorError(null);
            const result = await flowConfigApi.addCollaborator(flowId, collaboratorId.trim());
            setCollaborators(result.collaborators);
            setCollaboratorId('');
        } catch (err) {
            setCollaboratorError(err instanceof Error ? err.message : 'Failed to add collaborator');
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        if (!flowId) return;
        try {
            setCollaboratorError(null);
            const result = await flowConfigApi.removeCollaborator(flowId, userId);
            setCollaborators(result.collaborators);
        } catch (err) {
            setCollaboratorError(err instanceof Error ? err.message : 'Failed to remove collaborator');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !flowId) return;

        try {
            setIsUploading(true);
            setUploadError(null);
            const exerciseId = draft?.exercise_id || config?.exercise_id || flowId;
            const doc = await ragApi.uploadDocument(file, {
                exercise_id: exerciseId,
                course_id: draft?.course_id || config?.course_id || undefined,
                module_id: draft?.module_id || config?.module_id || undefined,
            });
            setDocuments((prev) => [...prev, doc]);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        try {
            await ragApi.deleteDocument(docId);
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch {
            setUploadError('Failed to delete document');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading flow settings...</p>
                </div>
            </div>
        );
    }

    if (error || !config || !draft) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Card className="w-full max-w-xl">
                    <CardHeader>
                        <CardTitle>Flow Settings</CardTitle>
                        <CardDescription>{error ?? 'Unable to load settings.'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link to={backToFlowPath}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Flow Designer
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="shrink-0 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto w-full max-w-4xl px-6 py-4 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Flow Settings</h1>
                        <p className="text-sm text-muted-foreground">{config.name || 'Untitled Flow'}</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to={backToFlowPath}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Flow Designer
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
                    {/* Name */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Flow Name</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                value={draft.name}
                                onChange={(e) => {
                                    setDraft((c) => (c ? { ...c, name: e.target.value } : c));
                                    setSaveSuccess(null);
                                }}
                                placeholder="Flow name"
                            />
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Description</CardTitle>
                            <CardDescription>Describe what this flow exercise is about.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={draft.description}
                                onChange={(e) => {
                                    setDraft((c) => (c ? { ...c, description: e.target.value } : c));
                                    setSaveSuccess(null);
                                }}
                                placeholder="Add a short description..."
                                className="min-h-[100px]"
                            />
                        </CardContent>
                    </Card>

                    {/* Visibility / Published */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Visibility</CardTitle>
                            <CardDescription>Toggle whether this flow exercise is published and accessible to students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setDraft((c) => (c ? { ...c, is_published: !c.is_published } : c));
                                    setSaveSuccess(null);
                                }}
                            >
                                {draft.is_published ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                <span>{draft.is_published ? 'Published' : 'Unpublished'}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {draft.is_published ? 'Students can access this exercise' : 'Only creators can view'}
                                </span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Course / Module / Exercise IDs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Course Context</CardTitle>
                            <CardDescription>Link this flow to a course, module, and exercise for RAG content scoping and LTI integration.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="course-id">Course ID</Label>
                                <Input
                                    id="course-id"
                                    value={draft.course_id}
                                    onChange={(e) => {
                                        setDraft((c) => (c ? { ...c, course_id: e.target.value } : c));
                                        setSaveSuccess(null);
                                    }}
                                    placeholder="e.g. cs-101"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="module-id">Module ID</Label>
                                <Input
                                    id="module-id"
                                    value={draft.module_id}
                                    onChange={(e) => {
                                        setDraft((c) => (c ? { ...c, module_id: e.target.value } : c));
                                        setSaveSuccess(null);
                                    }}
                                    placeholder="e.g. module-3"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="exercise-id">Exercise ID</Label>
                                <Input
                                    id="exercise-id"
                                    value={draft.exercise_id}
                                    onChange={(e) => {
                                        setDraft((c) => (c ? { ...c, exercise_id: e.target.value } : c));
                                        setSaveSuccess(null);
                                    }}
                                    placeholder="Auto-generated from flow ID if empty"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* LTI Exercise URL */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" /> LTI Exercise URL
                            </CardTitle>
                            <CardDescription>
                                Use this as the Launch URL in A+ / Moodle to identify users and post grades for this exercise.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {ltiExerciseUrl ? (
                                <div className="flex gap-2">
                                    <Input readOnly value={ltiExerciseUrl} className="text-xs h-9" />
                                    <Button size="icon" variant="outline" className="shrink-0 h-9 w-9" onClick={handleCopyLtiUrl}>
                                        {copiedLti ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Save settings first to generate the LTI URL.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* RAG Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Upload className="h-4 w-4" /> RAG Content
                            </CardTitle>
                            <CardDescription>
                                Upload documents that define the expected topics for this flow exercise.
                                The AI evaluator uses these to score student mindmaps.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label htmlFor="rag-upload" className="cursor-pointer">
                                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-accent transition-colors">
                                        <Upload className="h-4 w-4" />
                                        <span className="text-sm">
                                            {isUploading ? 'Uploading...' : 'Upload document (PDF, TXT)'}
                                        </span>
                                        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    </div>
                                </Label>
                                <input
                                    id="rag-upload"
                                    type="file"
                                    accept=".pdf,.txt,.md"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </div>

                            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

                            <div className="space-y-1">
                                {documents.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between border rounded px-2 py-1 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs truncate max-w-[250px]">{doc.filename}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                    doc.processing_status === 'processed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : doc.processing_status === 'failed'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {doc.processing_status}
                                                </span>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Access Key */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <KeyRound className="h-4 w-4" /> Access Key
                            </CardTitle>
                            <CardDescription>Require a secret pass key for students to access this exercise.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <span className="text-sm font-medium">Require access key</span>
                                <Switch
                                    checked={draft.access_key_required}
                                    onCheckedChange={(checked) => {
                                        setDraft((c) => (c ? { ...c, access_key_required: checked } : c));
                                        setSaveSuccess(null);
                                    }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={draft.access_key}
                                    onChange={(e) => {
                                        setDraft((c) => (c ? { ...c, access_key: e.target.value } : c));
                                        setSaveSuccess(null);
                                    }}
                                    className="font-mono text-xs"
                                    placeholder="No key generated"
                                />
                                <Button size="icon" variant="outline" onClick={handleCopyAccessKey} disabled={!draft.access_key}>
                                    {copiedAccessKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleRegenerateKey}>
                                    <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Creator Access / Collaborators */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" /> Creator Access
                            </CardTitle>
                            <CardDescription>Add or remove collaborators who can configure this flow exercise.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    value={collaboratorId}
                                    onChange={(e) => setCollaboratorId(e.target.value)}
                                    placeholder="User email or ID"
                                    className="flex-1"
                                />
                                <Button variant="outline" onClick={handleAddCollaborator}>
                                    <UserPlus className="h-4 w-4 mr-1" /> Add
                                </Button>
                            </div>

                            {collaboratorError && <p className="text-xs text-red-600">{collaboratorError}</p>}

                            <div className="space-y-1">
                                {collaborators.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No additional creators yet.</p>
                                ) : (
                                    collaborators.map((c) => (
                                        <div key={c.user_id} className="flex items-center justify-between border rounded px-2 py-1 text-sm">
                                            <span className="font-mono text-xs">{c.user_id}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRemoveCollaborator(c.user_id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer / Save bar */}
            <div className="shrink-0 border-t bg-background/95 backdrop-blur">
                <div className="mx-auto w-full max-w-4xl px-6 py-3 flex items-center justify-between gap-3">
                    <div className="text-sm min-h-5">
                        {saveError && <p className="text-red-600">{saveError}</p>}
                        {saveSuccess && <p className="text-emerald-600">{saveSuccess}</p>}
                    </div>
                    <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
