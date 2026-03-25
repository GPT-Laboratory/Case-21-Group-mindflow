import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  HTMLAttributes,
  ReactNode,
} from "react";
import { useNodeId, useReactFlow } from "@xyflow/react";
import { useNodeContext } from "../../context/useNodeContext";
import { cn } from "@/lib/utils";
import { MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ensureNodeWidth, measureLongestLineWidth } from "../utils/nodeSizing";

/* NODE HEADER -------------------------------------------------------------- */

export interface NodeHeaderProps extends HTMLAttributes<HTMLElement> {
  icon?: ReactNode;
  label?: string;
  labelPlaceholder?: string;
  editableLabel?: boolean;
  isProcessing?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
  isUpdating?: boolean;
  menuItems?: ReactNode[];
  iconClassName?: string;
  labelClassName?: string;
  // Generation state props
  generationMessage?: string;
  isLabelUpdating?: boolean;
  topicTextColor?: string;
}

export const NodeHeader = forwardRef<HTMLElement, NodeHeaderProps>(
  ({ className, icon, label, labelPlaceholder = "Topic", editableLabel = false, isProcessing, isCompleted, hasError, isUpdating, menuItems, iconClassName, labelClassName, generationMessage, isLabelUpdating, topicTextColor, ...props }, ref) => {
    const id = useNodeId();
    const { getNode, setNodes } = useReactFlow();
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Local state for the input value to prevent cursor jumping.
    // The controlled input is driven by this local state, not by the
    // node store directly, so setNodes re-renders won't reset the cursor.
    const [localLabel, setLocalLabel] = useState(label ?? "");

    // Sync incoming prop changes (e.g. from undo, external updates)
    // but only when the input is NOT focused (to avoid fighting with typing).
    useEffect(() => {
      const incoming = label ?? "";
      if (document.activeElement !== inputRef.current && incoming !== localLabel) {
        setLocalLabel(incoming);
      }
    }, [label]); // eslint-disable-line react-hooks/exhaustive-deps

    const defaultWidth = useMemo(
      () => {
        const currentNode = id ? getNode(id) : undefined;
        return Number((currentNode?.data as any)?.config?.defaultDimensions?.width ?? currentNode?.style?.width ?? 200);
      },
      [getNode, id]
    );

    const ensureLabelFits = useCallback(
      (value: string) => {
        if (!id || !inputRef.current) return;

        const measuredTextWidth = measureLongestLineWidth(inputRef.current, value, labelPlaceholder);
        const reservedSpace = 18;
        ensureNodeWidth({
          id,
          setNodes,
          defaultWidth,
          requiredWidth: measuredTextWidth + reservedSpace,
        });
      },
      [defaultWidth, id, inputRef, labelPlaceholder, setNodes]
    );

    const handleLabelChange = useCallback(
      (value: string) => {
        if (!id) return;

        // Update local state immediately (keeps cursor position)
        setLocalLabel(value);

        // Propagate to node store
        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id !== id) {
              return node;
            }

            const instanceData = (node.data?.instanceData ?? {}) as Record<string, unknown>;
            return {
              ...node,
              data: {
                ...node.data,
                label: value,
                instanceData: {
                  ...instanceData,
                  label: value,
                },
              },
            };
          })
        );
        ensureLabelFits(value);
      },
      [ensureLabelFits, id, setNodes]
    );

    useEffect(() => {
      ensureLabelFits(localLabel);
    }, [ensureLabelFits, localLabel]);

    return (
      <header
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-2 p-1 text-slate-700 dark:text-slate-300",
          "bg-white dark:bg-slate-800 rounded-tl-md rounded-tr-md",
          className
        )}
        {...props}
      >
        {icon && (
          <div className={cn("flex items-center justify-center", iconClassName)}>
            {icon}
          </div>
        )}

        {(editableLabel || label) && (
          <div className={cn(
            "flex-1 font-semibold relative",
            isLabelUpdating && "animate-pulse text-yellow-600 dark:text-yellow-400",
            labelClassName
          )}>
            {editableLabel ? (
              <Input
                ref={(element) => {
                  inputRef.current = element;
                }}
                value={localLabel}
                placeholder={labelPlaceholder}
                className={cn(
                  "nodrag nopan h-8 border-none bg-transparent px-1 py-0 text-base font-semibold shadow-none",
                  "focus-visible:ring-0 focus-visible:border-none"
                )}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onChange={(event) => handleLabelChange(event.target.value)}
              />
            ) : (
              <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                {localLabel}
              </div>
            )}
          </div>
        )}

        {/* Status badges */}
        {isUpdating && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700">
            {generationMessage || 'Updating...'}
          </Badge>
        )}
        {isProcessing && !isUpdating && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700">
            Processing...
          </Badge>
        )}
        {isCompleted && !isProcessing && !isUpdating && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700">
            Complete
          </Badge>
        )}
        {hasError && !isProcessing && !isUpdating && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-red-50 text-red-700">
            Error
          </Badge>
        )}

        {menuItems && (
          <NodeHeaderMenuAction label="Options" color={topicTextColor}>
            {menuItems}
            <NodeHeaderDeleteAction />
          </NodeHeaderMenuAction>
        )}

        {props.children}
      </header>
    );
  }
);

NodeHeader.displayName = "NodeHeader";

/* NODE HEADER TITLE -------------------------------------------------------- */

export type NodeHeaderTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  asChild?: boolean;
};

export const NodeHeaderTitle = forwardRef<
  HTMLHeadingElement,
  NodeHeaderTitleProps
>(({ className, asChild, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "select-none flex-1 font-semibold text-base",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

NodeHeaderTitle.displayName = "NodeHeaderTitle";

/* NODE HEADER ICON --------------------------------------------------------- */

export type NodeHeaderIconProps = HTMLAttributes<HTMLSpanElement>;

export const NodeHeaderIcon = forwardRef<HTMLSpanElement, NodeHeaderIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "[&>*]:[width:20px] [&>*]:[height:20px]",
          className
        )}
        {...props}
      />
    );
  }
);

NodeHeaderIcon.displayName = "NodeHeaderIcon";

/* NODE HEADER ACTIONS ------------------------------------------------------ */

export type NodeHeaderActionsProps = HTMLAttributes<HTMLDivElement>;

export const NodeHeaderActions = forwardRef<
  HTMLDivElement,
  NodeHeaderActionsProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "ml-auto flex items-center gap-2 self-end",
        className
      )}
      {...props}
    />
  );
});

NodeHeaderActions.displayName = "NodeHeaderActions";

/* NODE HEADER ACTION ------------------------------------------------------- */

export type NodeHeaderActionProps = {
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
};

export const NodeHeaderAction = forwardRef<
  HTMLButtonElement,
  NodeHeaderActionProps
>(({ className, label, children, style, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "nodrag inline-flex items-center justify-center rounded-full p-2 w-6 h-6 text-sm",
        "hover:bg-black/5 dark:hover:bg-white/10",
        "transition-colors",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
});

NodeHeaderAction.displayName = "NodeHeaderAction";

/* NODE HEADER MENU ACTION -------------------------------------------------- */

export type NodeHeaderMenuActionProps = Omit<
  NodeHeaderActionProps,
  "onClick"
> & {
  trigger?: ReactNode;
  color?: string;
};

export const NodeHeaderMenuAction = forwardRef<
  HTMLButtonElement,
  NodeHeaderMenuActionProps
>(({ trigger, children, label = "More options", color, ...props }, ref) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NodeHeaderAction
          ref={ref}
          label={label}
          style={color ? { color } : undefined}
          {...props}
        >
          {trigger ?? <MoreVertical />}
        </NodeHeaderAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

NodeHeaderMenuAction.displayName = "NodeHeaderMenuAction";

/* NODE HEADER DELETE ACTION ----------------------------------------------- */

export const NodeHeaderDeleteAction = () => {
  const id = useNodeId();
  const { getNode } = useReactFlow();
  const { removeNodes } = useNodeContext();

  const handleClick = useCallback(
    () => {
      if (!id) return;
      const node = getNode(id);
      if (node) removeNodes([node]);
    },
    [id, getNode, removeNodes]
  );

  return (
    <DropdownMenuItem onClick={handleClick} className="text-red-600">
      <div className="flex items-center gap-2">
        <Trash2 className="size-4" />
        <span>Delete</span>
      </div>
    </DropdownMenuItem>
  );
};

NodeHeaderDeleteAction.displayName = "NodeHeaderDeleteAction";
