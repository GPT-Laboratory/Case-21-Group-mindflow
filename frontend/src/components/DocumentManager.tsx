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
    Clock,
    Download,
    Eye,
    X
} from 'lucide-react';
import { ragApi, DocumentData as DocumentResponse } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { useCourseData } from '@/hooks/CourseDataContext';

const DocumentManager: React.FC = () => {
    const {
        selectedDocumentId,
        setSelectedDocumentId
    } = useCourseData();

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    
    // Preview state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<DocumentResponse | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const loadDocuments = useCallback(async (isAutoRefresh = false) => {
        if (!isAutoRefresh) setIsLoading(true);
        try {
            const data = await ragApi.getDocuments();
            setDocuments(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            if (!isAutoRefresh) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            loadDocuments(true);
        }, 10000);

        return () => {
            clearInterval(interval);
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        };
    }, [loadDocuments, previewUrl]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await ragApi.uploadDocument(file);
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
            if (selectedDocumentId === id) setSelectedDocumentId(null);
            if (previewDoc?.id === id) closePreview();
            loadDocuments();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleDownload = async (doc: DocumentResponse) => {
        try {
            const blob = await ragApi.getDocumentBlob(doc.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handlePreview = async (doc: DocumentResponse) => {
        setIsPreviewLoading(true);
        try {
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
            
            const blob = await ragApi.getDocumentBlob(doc.id);
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewDoc(doc);
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewDoc(null);
    };

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="max-w-[1600px] mx-auto w-full flex flex-row gap-8 h-full overflow-hidden">
                
                {/* Main List Column */}
                <div className={cn(
                    "flex flex-col gap-8 h-full min-w-0 transition-all duration-300",
                    previewUrl ? "w-1/2" : "w-full"
                )}>
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

                        <div className="flex items-center gap-4 p-6 border-2 border-dashed border-border rounded-xl bg-card/50">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Upload new documents to use as context for AI evaluations and RAG.
                                </p>
                            </div>
                            <div className="flex items-end">
                                <label
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-[42px] px-6 rounded-md font-medium transition-all",
                                        isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
                                    )}
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {isUploading ? 'Uploading...' : 'Upload Document'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
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
                                placeholder="Search by filename..."
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
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploaded</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredDocs.map((doc) => (
                                            <tr 
                                                key={doc.id} 
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors group cursor-pointer",
                                                    selectedDocumentId === doc.id && "bg-primary/5 border-l-4 border-l-primary"
                                                )}
                                                onClick={() => setSelectedDocumentId(doc.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "p-2 rounded-md",
                                                            selectedDocumentId === doc.id ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary"
                                                        )}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{doc.filename}</span>
                                                            {selectedDocumentId === doc.id && (
                                                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Active Document</span>
                                                            )}
                                                        </div>
                                                    </div>
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
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handlePreview(doc);
                                                            }}
                                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                                                            title="Preview document"
                                                            disabled={isPreviewLoading}
                                                        >
                                                            {isPreviewLoading && previewDoc?.id === doc.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleDownload(doc);
                                                            }}
                                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                            title="Download document"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleDelete(doc.id);
                                                            }}
                                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                            title="Delete document"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Sidepanel */}
                {previewUrl && (
                    <div className="w-1/2 flex flex-col border border-border rounded-xl bg-card overflow-hidden animate-in slide-in-from-right-4 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h2 className="font-semibold truncate text-sm">{previewDoc?.filename}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(previewDoc!)}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                    title="Close preview"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white relative">
                            {previewDoc?.filename.toLowerCase().endsWith('.pdf') || 
                             previewDoc?.filename.toLowerCase().endsWith('.png') || 
                             previewDoc?.filename.toLowerCase().endsWith('.jpg') || 
                             previewDoc?.filename.toLowerCase().endsWith('.jpeg') ? (
                                <iframe 
                                    src={previewUrl} 
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-4">
                                    <FileText className="w-16 h-16 opacity-10" />
                                    <p className="max-w-xs">
                                        Preview might not be available for this file type. 
                                        You can download it to view locally.
                                    </p>
                                    <button
                                        onClick={() => handleDownload(previewDoc!)}
                                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentManager;
