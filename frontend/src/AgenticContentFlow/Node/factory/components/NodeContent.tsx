/** @format */

import React from 'react';
import { useNodeId, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';

interface NodeContentProps {
  node: any;
  expanded?: boolean;
  hidden?: boolean;
}

/**
 * Component that renders always-on editable node content
 */
export const NodeContent: React.FC<NodeContentProps> = ({ node, expanded, hidden }) => {
  void expanded;
  if (hidden) return null;
  const id = useNodeId();
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isFocusedRef = React.useRef(false);
  const MIN_TEXTAREA_HEIGHT = 48;

  const configDescription = node?.data?.config?.description;

  const normalizeContent = React.useCallback(
    (value: unknown) => {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();

      // Hide legacy starter texts so users see a real placeholder instead of seeded content.
      if (
        trimmed === '' ||
        trimmed === 'Add details about this concept' ||
        trimmed === 'Node description' ||
        trimmed === String(configDescription ?? '').trim()
      ) {
        return '';
      }

      return value;
    },
    [configDescription]
  );

  const content = normalizeContent(
    node?.data?.details ?? node?.data?.description ?? node?.data?.functionDescription ?? ''
  );

  // Keep a local draft to avoid caret jumps caused by node-level rerenders.
  const [draftContent, setDraftContent] = React.useState(content);

  React.useEffect(() => {
    if (!isFocusedRef.current && draftContent !== content) {
      setDraftContent(content);
    }
  }, [content, draftContent]);

  const handleContentChange = React.useCallback(
    (value: string) => {
      if (!id) return;

      setNodes((nodes) =>
        nodes.map((currentNode) => {
          if (currentNode.id !== id) {
            return currentNode;
          }

          const defaultMinHeight = Number(
            (currentNode.data as any)?.config?.defaultDimensions?.height ?? 200
          );

          const nextStyle: Record<string, unknown> = {
            ...(currentNode.style as Record<string, unknown> | undefined),
          };

          // Keep node auto-sizing by removing stale fixed heights from existing nodes.
          delete nextStyle.height;
          if (typeof nextStyle.minHeight !== 'number') {
            nextStyle.minHeight = defaultMinHeight;
          }

          return {
            ...currentNode,
            data: {
              ...currentNode.data,
              details: value,
              description: value,
            },
            style: nextStyle,
          };
        })
      );
    },
    [id, setNodes]
  );

  const resizeTextarea = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.max(textarea.scrollHeight, MIN_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
  }, [MIN_TEXTAREA_HEIGHT]);

  React.useLayoutEffect(() => {
    resizeTextarea();

    if (!id) return;
    const rafId = window.requestAnimationFrame(() => updateNodeInternals(id));
    return () => window.cancelAnimationFrame(rafId);
  }, [draftContent, id, resizeTextarea, updateNodeInternals]);

  return (
    <div className="px-2 pb-2 pt-1">
      <Textarea
        ref={textareaRef}
        value={draftContent}
        placeholder="Add content"
        rows={1}
        className="nodrag nopan min-h-[48px] resize-none overflow-hidden rounded-md border border-slate-300/70 bg-slate-100/80 px-2 py-1.5 text-sm leading-5 text-slate-700 shadow-none placeholder:text-slate-500 focus-visible:border-slate-400 focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:placeholder:text-slate-400"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftContent(nextValue);
          handleContentChange(nextValue);
          resizeTextarea();
        }}
      />
    </div>
  );
};
