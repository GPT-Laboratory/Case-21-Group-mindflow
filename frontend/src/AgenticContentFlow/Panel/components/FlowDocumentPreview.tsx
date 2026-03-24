/** @format */

import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { DocumentData } from '@/services/apiClient';
import { ragApi } from '@/services/apiClient';

interface FlowDocumentPreviewProps {
  doc: DocumentData | null;
}

export const FlowDocumentPreview: React.FC<FlowDocumentPreviewProps> = ({ doc }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!doc) {
      setBlobUrl(null);
      setTextContent(null);
      return;
    }

    let cancelled = false;
    const lower = doc.filename.toLowerCase();
    const isTextLike = lower.endsWith('.txt') || lower.endsWith('.md');

    setLoading(true);
    setError(null);
    if (blobUrlRef.current) {
      window.URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    setTextContent(null);

    (async () => {
      try {
        const blob = await ragApi.getDocumentBlob(doc.id);
        if (cancelled) return;
        if (isTextLike) {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else {
          const url = window.URL.createObjectURL(blob);
          blobUrlRef.current = url;
          if (!cancelled) setBlobUrl(url);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [doc?.id, doc?.filename]);

  if (!doc) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive px-2">{error}</p>;
  }

  const lower = doc.filename.toLowerCase();
  if (lower.endsWith('.pdf') && blobUrl) {
    return (
      <iframe
        title={doc.filename}
        src={blobUrl}
        className="w-full flex-1 min-h-[280px] border rounded-md bg-muted/30"
      />
    );
  }

  if ((lower.endsWith('.txt') || lower.endsWith('.md')) && textContent !== null) {
    return (
      <pre className="text-xs whitespace-pre-wrap break-words p-3 rounded-md border bg-muted/20 max-h-[min(60vh,480px)] overflow-auto">
        {textContent}
      </pre>
    );
  }

  if (blobUrl) {
    return (
      <iframe
        title={doc.filename}
        src={blobUrl}
        className="w-full flex-1 min-h-[280px] border rounded-md bg-muted/30"
      />
    );
  }

  return (
    <p className="text-xs text-muted-foreground px-2">
      Preview not available for this file type. Use Documents to download.
    </p>
  );
};
