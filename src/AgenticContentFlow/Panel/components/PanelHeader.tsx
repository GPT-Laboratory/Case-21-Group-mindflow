import React from 'react';
import { IconResolver } from '../../Node/factory';
import { getNodeType } from '../../Node/store/NodeTypeStoreInitializer';
import { NodeConfig } from '../types';


interface PanelHeaderProps {
  activeNode: any;
  nodeConfig: NodeConfig;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ 
  activeNode, 
  nodeConfig, 
}) => {
  const iconResolver = new IconResolver();
  
  // Get icon from the actual node configuration
  const getIconForNodeType = (nodeType: string) => {
    const nodeConfig = getNodeType(nodeType);
    
    if (nodeConfig?.visual?.icon) {
      return iconResolver.resolveIcon(nodeConfig.visual.icon, { className: 'w-4 h-4' });
    }
    
    // Fallback to default icon if no configuration found
    return iconResolver.resolveIcon({
      type: 'builtin',
      value: 'Settings',
      className: 'w-4 h-4'
    });
  };

  return (
    <div className="flex flex-col">
      {/* Top row: Node info and menu */}
      <div className="flex items-center justify-between py-1 px-2">
        <div
          title={`Type: ${activeNode.type} | Category: ${nodeConfig.metadata.category} | ID: ${activeNode.id}`}
          className="flex items-center gap-2"
        >
          {getIconForNodeType(activeNode.type)}
        </div>
      </div>
    </div>
  );
};