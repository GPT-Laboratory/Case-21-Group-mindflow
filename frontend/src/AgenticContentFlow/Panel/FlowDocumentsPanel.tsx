/** @format */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Link2, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelContainer } from './components/PanelContainer';
import { PanelToggleDragHandle } from './components/PanelHandle';
import { useResizePanel } from './hooks/useResizePanel';
import { useFlowsStore } from '../stores/useFlowsStore';
import { useNodeContext } from '../Node/context/useNodeContext';
import { useEdgeContext } from '../Edge/store/useEdgeContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCourseData } from '@/hooks/CourseDataContext';
import { ragApi, type DocumentData } from '@/services/apiClient';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import {
  appendDocumentIdToMetadata,
  getDocumentIdsFromFlow,
} from './utils/flowDocumentMetadata';
import { FlowDocumentPreview } from './components/FlowDocumentPreview';
import { FlowDocumentLinkPicker } from './components/FlowDocumentLinkPicker';

type PanelPosition = 'right';

const DEFAULT_SIZES = {
  top: { width: 0, height: 350 },
  bottom: { width: 0, height: 350 },
  left: { width: 400, height: 0 },
  right: { width: 400, height: 0 },
};

function isFlowOwner(
  ownerId: string | null | undefined,
  userId: string | null
): boolean {
  if (!ownerId || !userId) return false;
  return (
    ownerId === `google:${userId}` ||
    ownerId === `lti:${userId}` ||
    ownerId === userId
  );
}

export const FlowDocumentsPanel: React.FC = () => {
  const { flowId } = useParams<{ flowId?: string }>();
  const { nodes } = useNodeContext();
  const { edges } = useEdgeContext();
  const { userId } = useAuthStore();
  const { setSelectedDocumentId } = useCourseData();
  const { showErrorToast, showSuccessToast } = useNotifications();

  const saveFlow = useFlowsStore((s) => s.saveFlow);
  const fetchFlows = useFlowsStore((s) => s.fetchFlows);

  const [isExpanded, setIsExpanded] = useState(false);
  const [position] = useState<PanelPosition>('right');
  const [activeIndex, setActiveIndex] = useState(0);
  const [allDocuments, setAllDocuments] = useState<DocumentData[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkingDocumentId, setLinkingDocumentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { size, isResizing, handleResizeStart } = useResizePanel({
    position,
    defaultSizes: DEFAULT_SIZES,
  });

  const flow = useFlowsStore((state) =>
    flowId && flowId !== 'new' ? state.flows[flowId] : undefined
  );

  const documentIds = useMemo(() => getDocumentIdsFromFlow(flow), [flow]);

  const loadRagList = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const list = await ragApi.getDocuments();
      setAllDocuments(list);
    } catch (e) {
      console.warn(e);
      showErrorToast('Documents', 'Could not load document list');
    } finally {
      setLoadingDocs(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    loadRagList();
  }, [loadRagList]);

  useEffect(() => {
    if (!flow && flowId && flowId !== 'new') {
      fetchFlows().catch(() => {});
    }
  }, [flow, flowId, fetchFlows]);

  useEffect(() => {
    if (activeIndex >= documentIds.length && documentIds.length > 0) {
      setActiveIndex(documentIds.length - 1);
    }
    if (documentIds.length === 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, documentIds.length]);

  const docMap = useMemo(() => {
    const m = new Map<number, DocumentData>();
    for (const d of allDocuments) m.set(d.id, d);
    return m;
  }, [allDocuments]);

  const activeId =
    documentIds.length > 0 ? documentIds[Math.min(activeIndex, documentIds.length - 1)] : null;
  const activeDoc = activeId != null ? docMap.get(activeId) ?? null : null;

  useEffect(() => {
    if (activeId != null) {
      setSelectedDocumentId(activeId);
    } else {
      setSelectedDocumentId(null);
    }
  }, [activeId, setSelectedDocumentId]);

  const canAttach = flow ? isFlowOwner(flow.owner_id, userId) : false;

  const openLinkPicker = useCallback(() => {
    setPickerOpen(true);
    void loadRagList();
  }, [loadRagList]);

  const linkExistingDocument = async (docId: number) => {
    if (!flow || !flowId || flowId === 'new') return;
    if (documentIds.includes(docId)) {
      setPickerOpen(false);
      return;
    }
    setLinkingDocumentId(docId);
    try {
      const payload = appendDocumentIdToMetadata(flow, docId, { nodes, edges });
      const updated = await saveFlow(flowId, payload);
      if (updated) {
        const doc = allDocuments.find((d) => d.id === docId);
        showSuccessToast(
          'Document linked',
          doc?.filename ?? `Document #${docId}`
        );
        const ids = getDocumentIdsFromFlow(updated);
        const idx = ids.indexOf(docId);
        if (idx >= 0) setActiveIndex(idx);
        setPickerOpen(false);
      } else {
        showErrorToast('Save failed', 'Could not attach document to this flow');
      }
    } catch (e) {
      showErrorToast(
        'Link failed',
        e instanceof Error ? e.message : 'Unknown error'
      );
    } finally {
      setLinkingDocumentId(null);
    }
  };

  const persistNewDocument = async (file: File) => {
    if (!flow || !flowId || flowId === 'new') return;
    setUploading(true);
    try {
      const doc = await ragApi.uploadDocument(file);
      setAllDocuments((prev) => {
        const next = [...prev];
        if (!next.some((d) => d.id === doc.id)) next.push(doc);
        return next;
      });
      const payload = appendDocumentIdToMetadata(flow, doc.id, { nodes, edges });
      const updated = await saveFlow(flowId, payload);
      if (updated) {
        showSuccessToast('Document linked', doc.filename);
        const ids = getDocumentIdsFromFlow(updated);
        const idx = ids.indexOf(doc.id);
        if (idx >= 0) setActiveIndex(idx);
        setPickerOpen(false);
      } else {
        showErrorToast('Save failed', 'Could not attach document to this flow');
      }
    } catch (e) {
      showErrorToast('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const onConnectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void persistNewDocument(file);
    e.target.value = '';
  };

  const showEmpty =
    !flowId ||
    flowId === 'new' ||
    !flow ||
    documentIds.length === 0;

  const headerNav =
    documentIds.length > 1 ? (
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={activeIndex <= 0}
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous document"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums min-w-[2.5rem] text-center">
          {activeIndex + 1}/{documentIds.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={activeIndex >= documentIds.length - 1}
          onClick={() =>
            setActiveIndex((i) => Math.min(documentIds.length - 1, i + 1))
          }
          aria-label="Next document"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    ) : null;

  const fileInputDisabled =
    uploading ||
    !flow ||
    flowId === 'new' ||
    !canAttach ||
    linkingDocumentId != null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,.log,.json,.xml,.html,.py,.js,.ts,.rst"
        className="hidden"
        aria-hidden
        onChange={onConnectFile}
        disabled={fileInputDisabled}
      />
      <PanelContainer
        isExpanded={isExpanded}
        position={position}
        size={size}
        isResizing={isResizing}
      >
        <PanelToggleDragHandle
          isExpanded={isExpanded}
          position={position}
          size={size}
          hasChanges={false}
          onToggle={() => setIsExpanded(!isExpanded)}
          onResizeStart={handleResizeStart}
          collapsedIcon={
            <FileText className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
          }
          collapsedTitle="Flow documents — files linked to this flow"
        />

        <div
          className={`h-full transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            overflow: isExpanded ? 'auto' : 'hidden',
            width: isExpanded ? '100%' : '0px',
            pointerEvents: isExpanded ? 'auto' : 'none',
          }}
        >
          <div className="flex flex-col h-full min-h-0 p-2 gap-2">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {showEmpty
                    ? 'Documents'
                    : activeDoc?.filename ?? `Document #${activeId}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {headerNav}
                {canAttach && !showEmpty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Link another document"
                    disabled={uploading || linkingDocumentId != null}
                    onClick={() => openLinkPicker()}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
              {loadingDocs && allDocuments.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading…
                </div>
              ) : showEmpty ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 px-2 text-center">
                  <p className="text-sm text-muted-foreground">No document</p>
                  {canAttach && (
                    <Button
                      type="button"
                      className="gap-2"
                      disabled={fileInputDisabled}
                      onClick={() => openLinkPicker()}
                    >
                      {uploading || linkingDocumentId != null ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      Connect a document
                    </Button>
                  )}
                  {flowId === 'new' && (
                    <p className="text-xs text-muted-foreground">
                      Save the flow first, then you can attach documents.
                    </p>
                  )}
                  {flow && !canAttach && flowId !== 'new' && (
                    <p className="text-xs text-muted-foreground">
                      Only the flow owner can attach documents.
                    </p>
                  )}
                </div>
              ) : activeDoc ? (
                <div className="flex flex-col flex-1 min-h-0 gap-1">
                  <p className="text-xs text-muted-foreground truncate px-1">
                    {activeDoc.processing_status === 'processed'
                      ? 'Ready'
                      : `Status: ${activeDoc.processing_status}`}
                  </p>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <FlowDocumentPreview doc={activeDoc} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-1">
                  Document metadata is linked but the file was not found in the
                  repository. Re-upload or check Documents.
                </p>
              )}
            </div>
          </div>
        </div>
      </PanelContainer>

      <FlowDocumentLinkPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        documents={allDocuments}
        linkedDocumentIds={documentIds}
        loading={loadingDocs}
        linkingDocumentId={linkingDocumentId}
        uploading={uploading}
        onLink={(id) => void linkExistingDocument(id)}
        onUploadNew={() => fileInputRef.current?.click()}
      />
    </>
  );
};

export default FlowDocumentsPanel;
