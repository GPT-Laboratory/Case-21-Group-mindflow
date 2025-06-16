import React, { useState } from "react";
import { Wand2 } from "lucide-react";
import ControlButton from "../../Controls/Components/ControlButton";
import FlowGenerationPanel from "./FlowGenerationPanel";

/**
 * Flow Generation Control Button
 * 
 * A control button that toggles the Flow Generation Panel.
 * Allows users to generate complete flows from natural language descriptions.
 */
const FlowGenerationControl: React.FC<{ onFlowGenerated: (nodes: any[], edges: any[]) => void }> = ({ onFlowGenerated }) => {
  const [showPanel, setShowPanel] = useState(false);

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <>
      <ControlButton
        tooltip="Generate Flow with AI"
        onClick={handleTogglePanel}
        icon={<Wand2 className="size-4" />}
        active={showPanel}
      />
      
      {showPanel && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl p-4">
          <div className="relative">
            <FlowGenerationPanel 
              onFlowGenerated={(nodes, edges) => {
                onFlowGenerated(nodes, edges);
                setShowPanel(false); // Close panel after generation
              }}
            />
            
            {/* Close button */}
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FlowGenerationControl;