import { forwardRef, useMemo, useState, useRef, useEffect } from "react";
import { ExcalidrawHandle } from "@/components/excalidraw-handle";
import { HandleTypeDefinition } from "../../types/handleTypes";
import { handleRegistry } from "../registry/handleTypeRegistry";
import { Position, HandleType } from "@xyflow/react";

// Import icon components
import { PackageIcon } from "@/components/icons/package";
import ChartIcon from "@/components/icons/chart";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, LinkIcon } from "lucide-react";
import HandleSpeedDial from "./HandleSpeedDial";

export interface ExcalidrawTypedHandleProps {
  nodeType: string;
  handleDefinition: HandleTypeDefinition;
  nodeBackgroundColor?: string;
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

export const ExcalidrawTypedHandle: React.FC<ExcalidrawTypedHandleProps> = ({
  nodeType,
  handleDefinition,
  nodeBackgroundColor,
  onConnectionAttempt,
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

  // Debug logging
  console.log('ExcalidrawTypedHandle render:', {
    nodeType,
    handleDefinition,
    nodeBackgroundColor,
    position: positionMap[handleDefinition.position]
  });

  return (
    <>
      <ExcalidrawHandle
        ref={handleRef}
        type={getReactFlowHandleType(handleDefinition.type)}
        position={positionMap[handleDefinition.position]}
        id={handleDefinition.position}
        nodeColor={nodeBackgroundColor}
        variant="default"
        size="md"
        showIcon={!!IconComponent}
        title={`${handleDefinition.dataFlow} flow - connects to: ${compatibleTargets.join(', ')}`}
      >
        {IconComponent && (
          <div className="w-3 h-3 flex items-center justify-center text-black">
            <IconComponent size={12} />
          </div>
        )}
      </ExcalidrawHandle>

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