import React from 'react';
import { FrameJSON } from '../../factory/types/FrameJSON';
import { IconResolver } from '../../factory/IconResolver';

interface NodePlacementOverlayProps {
  isVisible: boolean;
  mousePosition: { x: number; y: number };
  nodeType: FrameJSON;
}

const NodePlacementOverlay: React.FC<NodePlacementOverlayProps> = ({
  isVisible,
  mousePosition,
  nodeType
}) => {
  if (!isVisible) return null;

  const iconResolver = new IconResolver();
  const iconElement = iconResolver.resolveIcon(nodeType.visual.icon, {
    className: "w-4 h-4",
    size: nodeType.visual.icon.size || 16
  });

  return (
    <div
      className="fixed pointer-events-none z-50 opacity-60"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="bg-white border-2 border-blue-500 rounded-lg p-2 shadow-lg flex items-center gap-2 min-w-32 max-w-48">
        <div className="flex-shrink-0">
          {iconElement}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate text-gray-900">
            {nodeType.defaultLabel}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {nodeType.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePlacementOverlay; 