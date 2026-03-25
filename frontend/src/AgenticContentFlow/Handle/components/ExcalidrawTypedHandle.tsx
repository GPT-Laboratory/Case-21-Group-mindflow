import { useMemo, useState, useRef } from "react";
import { ExcalidrawHandle } from "@/components/excalidraw-handle";
import { HandleTypeDefinition } from "../../types/handleTypes";
import { handleRegistry } from "../registry/handleTypeRegistry";
import { Position, HandleType } from "@xyflow/react";

// Import icon components
import { PackageIcon } from "@/components/icons/package";
import ChartIcon from "@/components/icons/chart";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, LinkIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import HandleSpeedDial from "./HandleSpeedDial";

export interface ExcalidrawTypedHandleProps {
  nodeType: string;
  handleDefinition: HandleTypeDefinition;
  originalHandleId?: string; // Stable handle ID that doesn't change with layout direction
  nodeBackgroundColor?: string;
  invisible?: boolean; // Handle is transparent but still interactive, shows bracket on node hover
  onConnectionAttempt?: (isValid: boolean, targetType?: string) => void;
  speedDialRadius?: number;
  speedDialButtonSize?: number;
  speedDialIconSize?: number;
  speedDialArcSpan?: number;
}

// Icon mapping
const iconMap = {
  'package': PackageIcon,
  'arrow-down': ChevronDownIcon,
  "arrow-up": ChevronUpIcon,
  'link': LinkIcon,
  'chart': ChartIcon,
  'arrow-right': ChevronRightIcon,
  'arrow-left': ChevronLeftIcon,
};

// Position mapping for react flow
const positionMap = {
  'top': Position.Top,
  'bottom': Position.Bottom,
  'left': Position.Left,
  'right': Position.Right,
};

// Handle type mapping
const getReactFlowHandleType = (handleType: 'source' | 'target' | 'both'): HandleType => {
  if (handleType === 'both') {
    return 'source';
  }
  return handleType as HandleType;
};

/**
 * Get bracket icon positioning styles.
 */
function getBracketIconStyle(position: HandleTypeDefinition['position']): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 50,
  };

  switch (position) {
    case 'top':
      return { ...base, top: '-14px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { ...base, bottom: '-14px', left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { ...base, left: '-14px', top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { ...base, right: '-14px', top: '50%', transform: 'translateY(-50%)' };
    default:
      return base;
  }
}

/**
 * Get the chevron icon for the given position.
 */
function getBracketIcon(position: HandleTypeDefinition['position'], color?: string) {
  const iconProps = { size: 18, strokeWidth: 3, color: color, className: "opacity-70" };
  switch (position) {
    case 'top': return <ChevronUp {...iconProps} />;
    case 'bottom': return <ChevronDown {...iconProps} />;
    case 'left': return <ChevronLeft {...iconProps} />;
    case 'right': return <ChevronRight {...iconProps} />;
    default: return null;
  }
}

export const ExcalidrawTypedHandle: React.FC<ExcalidrawTypedHandleProps> = ({
  nodeType,
  handleDefinition,
  originalHandleId,
  nodeBackgroundColor,
  invisible = false,
  speedDialRadius,
  speedDialButtonSize,
  speedDialIconSize,
  speedDialArcSpan,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  // Get the icon component
  const IconComponent = handleDefinition.icon ? iconMap[handleDefinition.icon as keyof typeof iconMap] : null;

  // Get compatible target categories for this handle
  const compatibleTargets = useMemo(() => {
    return handleRegistry.getCompatibleTargets(nodeType, handleDefinition.position);
  }, [nodeType, handleDefinition.position]);

  // Only show speed dial for source handles that can connect to multiple types
  const showSpeedDial = handleDefinition.type === 'source' && compatibleTargets.length > 1;

  // Invisible handle styles — fully transparent but still interactive
  const invisibleStyles: React.CSSProperties | undefined = invisible
    ? {
        opacity: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }
    : undefined;

  return (
    <>
      <ExcalidrawHandle
        ref={handleRef}
        type={getReactFlowHandleType(handleDefinition.type)}
        position={positionMap[handleDefinition.position]}
        id={originalHandleId || handleDefinition.position}
        nodeColor={invisible ? undefined : nodeBackgroundColor}
        variant="default"
        size="md"
        showIcon={!invisible && !!IconComponent}
        title={`${handleDefinition.dataFlow} flow - connects to: ${compatibleTargets.join(', ')}`}
        style={invisibleStyles}
      >
        {!invisible && IconComponent && (
          <div className="w-3 h-3 flex items-center justify-center text-black">
            <IconComponent size={12} />
          </div>
        )}
      </ExcalidrawHandle>

      {/* Bracket indicator for invisible handles — visible on node hover via CSS and group-hover */}
      {invisible && (
        <div
          className="bracket-indicator absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-50 pointer-events-none"
          style={getBracketIconStyle(handleDefinition.position)}
        >
          {getBracketIcon(handleDefinition.position)}
        </div>
      )}

      {/* Speed Dial for compatible node types */}
      {showSpeedDial && isHovered && (
        <HandleSpeedDial
          nodeType={nodeType}
          handleDefinition={handleDefinition}
          radius={speedDialRadius}
          buttonSize={speedDialButtonSize}
          iconSize={speedDialIconSize}
          arcSpan={speedDialArcSpan}
          onNodeTypeSelect={(nodeType) => {
            console.log(`Selected to connect to: ${nodeType}`);
          }}
        />
      )}
    </>
  );
}; 