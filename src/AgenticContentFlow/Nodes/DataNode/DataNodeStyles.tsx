import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { BaseNodeContainer } from "../common/NodeStyles";

// Define additional props interface for the DataNodeContainer
interface DataNodeProps {
  color?: string;
  selected?: boolean;
  isCollapsed?: boolean;
  /** Whether the node is currently processing */
  processing?: boolean;
  /** Processing state for visual feedback */
  processState?: 'idle' | 'processing' | 'completed' | 'error';
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  onTransitionEnd?: () => void;
}

// Custom container for DataNode with file/folder appearance
export function DataNodeContainer({
  color,
  selected,
  isCollapsed = true,
  processing,
  processState,
  className,
  children,
  style,
  ...props
}: DataNodeProps) {
  return (
    <BaseNodeContainer
      color={color}
      selected={selected}
      processing={processing}
      processState={processState}
      className={cn(
        "relative p-0 overflow-visible z-0 rounded-md border-2 border-solid border-black shadow-[5px_-2px_black] mt-5",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </BaseNodeContainer>
  );
}

export default DataNodeContainer;