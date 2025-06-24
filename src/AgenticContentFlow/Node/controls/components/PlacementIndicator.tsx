import React from 'react';

interface PlacementIndicatorProps {
  isVisible: boolean;
  nodeTypeName: string;
  onCancel: () => void;
}

const PlacementIndicator: React.FC<PlacementIndicatorProps> = ({
  isVisible,
  nodeTypeName,
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">
        Click anywhere on the flow to place "{nodeTypeName}"
      </span>
      <button
        onClick={onCancel}
        className="ml-2 text-white/80 hover:text-white text-sm"
      >
        Cancel
      </button>
    </div>
  );
};

export default PlacementIndicator; 