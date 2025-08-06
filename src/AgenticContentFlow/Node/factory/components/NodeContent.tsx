/** @format */

import React from 'react';

interface NodeContentProps {
  node: any;
  expanded: boolean;
}

/**
 * Component that displays node content based on expansion state
 */
export const NodeContent: React.FC<NodeContentProps> = ({ node, expanded }) => {
  // Only show description when node is not expanded
  if (expanded) {
    return null;
  }

  const description = node?.data?.description;

  if (!description) {
    return null;
  }

  return (
    <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
      {description}
    </div>
  );
};