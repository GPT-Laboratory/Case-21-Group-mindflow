import React, { useState, useEffect, useCallback } from 'react';
import {
    Trash2,
    FileText,
    RefreshCw,
    Search,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock
} from 'lucide-react';
import { ragApi, DocumentData as DocumentResponse } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { useCourseData } from '@/hooks/CourseDataContext';

const DocumentManager: React.FC = () => {
    const {
        courseId,
        modules,
        exercises,
        selectedModuleId,
        selectedExerciseId,
        currentModule,
        currentExercise,
        selectModule,
        selectExercise
    } = useCourseData();

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const loadDocuments = useCallback(async (isAutoRefresh = false) => {
        if (!isAutoRefresh) setIsLoading(true);
        try {
            // Fetch all documents for this course/module if selected, otherwise all
            const data = await ragApi.getDocuments({
                exercise_id: currentExercise?.id.toString(),
                course_id: courseId.toString(),
                module_id: currentModule?.id.toString()
            });
            setDocuments(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            if (!isAutoRefresh) setIsLoading(false);
        }
    }, [courseId, currentModule, currentExercise]);

    useEffect(() => {
        loadDocuments();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            loadDocuments(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [loadDocuments]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedModuleId || !selectedExerciseId) {
            alert('Please select a Module and Exercise before uploading.');
            return;
        }

        setIsUploading(true);
        try {
            await ragApi.uploadDocument(file, {
                course_id: courseId.toString(),
                module_id: currentModule?.id.toString(),
                module_name: currentModule?.name,
                exercise_id: currentExercise?.id.toString(),
                exercise_name: currentExercise?.name
            });
            loadDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            await ragApi.deleteDocument(id);
            loadDocuments();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.module_name && doc.module_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.exercise_name && doc.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusIcon = (status: DocumentResponse['processing_status']) => {
        switch (status) {
            case 'processed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'processing': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-destructive" />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-background p-8 overflow-hidden">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 h-full">

                {/* Header and Upload Section */}
                <div className="flex flex-col gap-6 shrink-0">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Document Repository</h1>
                            <p className="text-muted-foreground mt-1">
                                Upload and manage documents for AI analysis
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-2 border-dashed border-border rounded-xl bg-card/50">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Course</label>
                            <select
                                className="w-full bg-background border border-input rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all opacity-50 cursor-not-allowed"
                                disabled
                                value={courseId}
                            >
                                <option value={courseId}>Course {courseId}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Module</label>
                            <select
                                className="w-full bg-background border border-input rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={selectedModuleId || ''}
                                onChange={(e) => selectModule(Number(e.target.value))}
                            >
                                <option value="">Select Module</option>
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Exercise</label>
                            <select
                                className="w-full bg-background border border-input rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={selectedExerciseId || ''}
                                onChange={(e) => selectExercise(Number(e.target.value))}
                                disabled={!selectedModuleId}
                            >
                                <option value="">Select Exercise</option>
                                {exercises.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-[42px] px-6 rounded-md font-medium transition-all",
                                    (isUploading || !selectedExerciseId) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
                                )}
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {isUploading ? 'Uploading...' : 'Upload Document'}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading || !selectedExerciseId}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Search and List Section */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <div className="relative shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by filename or exercise..."
                            className="w-full bg-card border border-input rounded-md pl-10 pr-4 py-2 outline-none focus:border-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 border border-border rounded-lg bg-card shadow-sm">
                        {isLoading && documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p>Loading documents...</p>
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
                                <FileText className="w-12 h-12 opacity-20" />
                                <p>{searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Module</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exercise</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploaded</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/5 rounded-md text-primary">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-medium">{doc.filename}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium",
                                                    doc.module_id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground italic"
                                                )}>
                                                    {doc.module_id ? `${doc.module_id}-${doc.module_name}` : 'None'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium",
                                                    doc.exercise_id ? "bg-accent text-accent-foreground" : "text-muted-foreground italic"
                                                )}>
                                                    {doc.exercise_id ? `${doc.exercise_id}-${doc.exercise_name}` : 'None'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm capitalize">
                                                    {getStatusIcon(doc.processing_status)}
                                                    {doc.processing_status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(doc.created_dt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete document"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentManager;
