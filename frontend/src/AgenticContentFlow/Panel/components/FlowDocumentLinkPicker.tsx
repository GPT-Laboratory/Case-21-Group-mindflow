/** @format */

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Search, Upload } from 'lucide-react';
import type { DocumentData } from '@/services/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type FlowDocumentLinkPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentData[];
  linkedDocumentIds: number[];
  loading: boolean;
  /** When set, that row shows a spinner while the link request runs. */
  linkingDocumentId: number | null;
  uploading: boolean;
  onLink: (docId: number) => void;
  onUploadNew: () => void;
};

export const FlowDocumentLinkPicker: React.FC<FlowDocumentLinkPickerProps> = ({
  open,
  onOpenChange,
  documents,
  linkedDocumentIds,
  loading,
  linkingDocumentId,
  uploading,
  onLink,
  onUploadNew,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const linkedSet = useMemo(
    () => new Set(linkedDocumentIds),
    [linkedDocumentIds]
  );

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter((d) => !linkedSet.has(d.id))
      .filter((d) =>
        q ? d.filename.toLowerCase().includes(q) : true
      )
      .sort((a, b) => a.filename.localeCompare(b.filename));
  }, [documents, linkedSet, query]);

  const busy = linkingDocumentId != null || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden flex flex-col max-h-[min(85vh,560px)]">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0 text-left">
          <DialogTitle>Link a document</DialogTitle>
          <DialogDescription>
            Choose an existing file from the library, or upload a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2 shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              disabled={busy}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={busy}
            onClick={() => {
              onUploadNew();
            }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload new file instead
          </Button>
        </div>

        <div className="border-t flex-1 min-h-[200px] flex flex-col overflow-hidden">
          {loading && documents.length === 0 ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading documents…
            </div>
          ) : available.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {documents.length === 0
                ? 'No documents in the library yet. Use upload above.'
                : query.trim()
                  ? 'No matching documents that are not already linked.'
                  : 'All library documents are already linked to this flow.'}
            </div>
          ) : (
            <ul
              className="overflow-y-auto flex-1 px-2 py-2 space-y-0.5"
              role="listbox"
              aria-label="Documents"
            >
              {available.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onLink(d.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                      'hover:bg-accent transition-colors',
                      'disabled:opacity-50 disabled:pointer-events-none'
                    )}
                  >
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 min-w-0">{d.filename}</span>
                    {linkingDocumentId === d.id ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        #{d.id}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
