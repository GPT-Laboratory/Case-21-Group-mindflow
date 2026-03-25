import React, { useEffect, useMemo, useState } from 'react';
import { Send, Loader2, History } from 'lucide-react';
import { useNodeContext } from '../Node/context/useNodeContext';
import { useEdgeContext } from '../Edge/store/useEdgeContext';
import { useCourseData } from '@/hooks/CourseDataContext';
import { toast } from 'sonner';
import { evalApi, ltiApi } from '@/services/apiClient';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFlowsStore } from '../stores/useFlowsStore';

type EvaluationResult = { is_valid: boolean; feedback: string; points?: number; model?: string };
type StoredEvaluationResult = {
    evaluationResult: EvaluationResult;
    gradePassbackStatus: string | null;
};

const SubmitDiagramControl: React.FC = () => {
    const {
        selectedDocumentId
    } = useCourseData();
    const selectedFlowId = useFlowsStore((state) => state.selectedFlowId);
    const selectedFlow = useFlowsStore((state) =>
        state.selectedFlowId ? state.flows[state.selectedFlowId] : null
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
    const [gradePassbackStatus, setGradePassbackStatus] = useState<string | null>(null);

    const { nodes } = useNodeContext();
    const { edges } = useEdgeContext();
    const storageKey = useMemo(
        () => (selectedFlowId ? `latest-evaluation-result:${selectedFlowId}` : null),
        [selectedFlowId]
    );

    useEffect(() => {
        if (!storageKey) {
            setEvaluationResult(null);
            setGradePassbackStatus(null);
            return;
        }

        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) {
            setEvaluationResult(null);
            setGradePassbackStatus(null);
            return;
        }

        try {
            const parsed = JSON.parse(rawValue) as StoredEvaluationResult;
            setEvaluationResult(parsed.evaluationResult ?? null);
            setGradePassbackStatus(parsed.gradePassbackStatus ?? null);
        } catch {
            window.localStorage.removeItem(storageKey);
            setEvaluationResult(null);
            setGradePassbackStatus(null);
        }
    }, [storageKey]);

    const persistLatestResult = (nextEvaluationResult: EvaluationResult, nextGradePassbackStatus: string | null) => {
        if (!storageKey) return;

        const payload: StoredEvaluationResult = {
            evaluationResult: nextEvaluationResult,
            gradePassbackStatus: nextGradePassbackStatus,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
    };

    const handleSubmit = async () => {
        if (!selectedDocumentId) {
            toast.error('Please select a document context first');
            return;
        }

        setIsSubmitting(true);
        try {
            const flowData = { nodes, edges };
            const result = await evalApi.evaluate({
                flow_data: flowData,
                document_id: selectedDocumentId,
                model: selectedFlow?.ollama_model || undefined,
            });

            toast.success('Diagram submitted successfully!');
            setEvaluationResult(result);
            setGradePassbackStatus(null);
            persistLatestResult(result, null);

            const numericPoints = typeof result.points === 'number' ? result.points : null;
            if (numericPoints !== null) {
                try {
                    const session = await ltiApi.getSession();
                    if (session.authenticated && session.has_outcome_service) {
                        const passback = await ltiApi.submitGrade(numericPoints, 100);
                        if (passback.success) {
                            const msg = passback.message || 'Grade submitted to LMS.';
                            setGradePassbackStatus(msg);
                            persistLatestResult(result, msg);
                            toast.success(msg);
                        } else {
                            const msg = passback.error || 'Grade passback failed.';
                            setGradePassbackStatus(msg);
                            persistLatestResult(result, msg);
                            toast.error(msg);
                        }
                    }
                } catch (passbackError) {
                    const msg = passbackError instanceof Error ? passbackError.message : 'Grade passback failed.';
                    setGradePassbackStatus(msg);
                    persistLatestResult(result, msg);
                    toast.error(msg);
                }
            }

            setShowResultModal(true);
            setShowPrompt(false);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Evaluation failed. Please try again.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                onClick={() => setShowResultModal(true)}
                disabled={!evaluationResult}
                className="h-9 px-3"
            >
                <History className="w-4 h-4" />
                Latest Result
            </Button>
            {showPrompt ? (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-200 bg-background border border-border p-2 rounded-lg shadow-lg">

                    <div className="flex items-end self-end pb-0.5 gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedDocumentId}
                            className="h-8 px-4 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            {isSubmitting ? '...' : 'Confirm'}
                        </button>
                        <button
                            onClick={() => setShowPrompt(false)}
                            disabled={isSubmitting}
                            className="h-8 px-3 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowPrompt(true)}
                    className="h-9 px-4 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Submit
                </button>
            )}

            <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Evaluation Result</DialogTitle>
                        <DialogDescription>
                            Here is the AI feedback on your content flow.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {evaluationResult ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">Valid Flow:</span>
                                    <span className={evaluationResult.is_valid ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                        {evaluationResult.is_valid ? "Yes" : "No"}
                                    </span>
                                </div>
                                {evaluationResult.points !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">Score:</span>
                                        <span className="font-medium">{evaluationResult.points} / 100</span>
                                    </div>
                                )}
                                {evaluationResult.model && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">Model:</span>
                                        <span className="font-mono text-sm text-muted-foreground">{evaluationResult.model}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <span className="font-semibold text-sm">Feedback:</span>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {evaluationResult.feedback || "No feedback provided."}
                                    </p>
                                </div>
                                {gradePassbackStatus && (
                                    <div className="space-y-2">
                                        <span className="font-semibold text-sm">LTI Grade Passback:</span>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {gradePassbackStatus}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-center flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Evaluating...</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResultModal(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SubmitDiagramControl;
