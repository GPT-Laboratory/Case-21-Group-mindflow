/** @format */

import { cn } from "@/lib/utils";
import { BaseNodeContainer, BaseNodeProps } from "../../shared/components/NodeStyles";

// Define additional props interface for the DataNodeContainer
interface DataNodeProps extends BaseNodeProps {
  isCollapsed?: boolean;
  /** Whether the node is currently processing */
  processing?: boolean;
  /** Processing state for visual feedback */
  processState?: 'idle' | 'processing' | 'completed' | 'error';
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

// Define additional props interface for the PageNodeContainer
interface PageNodeProps extends BaseNodeProps {
  isExpanded?: boolean;
}

// Custom container for PageNode
export function PageNodeContainer({
  color,
  selected,
  isExpanded,
  className,
  children,
  style,
  ...props
}: PageNodeProps) {
  return (
    <BaseNodeContainer
      color={color}
      selected={selected}
      className={cn(
        "relative p-0 overflow-visible z-0 rounded-md",
        isExpanded ? "" : "border-2 border-solid border-black",
        "shadow-[5px_-2px_black]",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </BaseNodeContainer>
  );
}

// Define additional props interface for the InvisibleNodeContainer
interface InvisibleNodeProps extends BaseNodeProps {
  isExpanded?: boolean;
  isHovered?: boolean;
}

export const InvisibleNodeContainer: React.FC<InvisibleNodeProps> = ({
  isExpanded,
  isHovered,
  color,
  selected,
  className,
  children,
  style,
  ...props
}) => {
  // Create custom style to override BaseNodeContainer's default styling
  const customStyle = {
    ...style,
    // Override BaseNodeContainer's border and background when expanded
    ...(isExpanded && {
      border: isHovered ? "4px dashed black" : "none",
      background: "transparent",
      backgroundColor: "transparent",
      boxShadow: "none"
    }),
    // When collapsed, use normal styling but with purple color
    ...(!isExpanded && {
      backgroundColor: "white",
      boxShadow: "5px -2px black"
    })
  };

  return (
    <BaseNodeContainer
      color={color}
      selected={selected}
      className={cn(
        "relative p-0 overflow-visible z-0 rounded-md transition-all duration-200 ease-in-out",
        className
      )}
      style={customStyle}
      {...props}
    >
      {children}
    </BaseNodeContainer>
  );
};

export default {
  DataNodeContainer,
  PageNodeContainer,
  InvisibleNodeContainer
};