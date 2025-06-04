import { BaseNodeContainer, BaseNodeProps } from "../common/NodeStyles";
import { cn } from "@/lib/utils";

interface InvisibleNodeProps extends BaseNodeProps {
  isExpanded?: boolean;
  isHovered?: boolean;
  onTransitionEnd?: () => void;
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
        // Remove the problematic dynamic Tailwind classes and handle styling via style prop instead
        className
      )}
      style={customStyle}
      {...props}
    >
      {children}
    </BaseNodeContainer>
  );
};