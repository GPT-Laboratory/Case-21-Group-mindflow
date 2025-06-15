import React, { useState } from "react";
import { Settings, Key } from "lucide-react";
import ControlButton from "../../../Controls/Components/ControlButton";
import { APISetupDialog } from "../components/APISetupDialog";
import { apiKeyManager } from "../APIKeyManager";

/**
 * API Setup Control Button
 * 
 * A control button that opens the LLM API configuration dialog.
 * Allows users to configure or reconfigure LLM providers for code generation.
 */
const APISetupControl: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleDialogComplete = () => {
    setShowDialog(false);
    // Optional: Show a success notification or perform other actions
    console.log('✅ API configuration updated, configured providers:', apiKeyManager.getConfiguredProviders());
  };

  // Check if any providers are configured to show different icon
  const hasConfiguredProviders = apiKeyManager.getConfiguredProviders().length > 0;
  const tooltip = hasConfiguredProviders 
    ? "Reconfigure LLM API Settings" 
    : "Configure LLM API for Code Generation";

  return (
    <>
      <ControlButton
        tooltip={tooltip}
        onClick={handleOpenDialog}
        icon={hasConfiguredProviders ? <Settings className="size-4" /> : <Key className="size-4" />}
        active={showDialog}
      />
      
      <APISetupDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onComplete={handleDialogComplete}
      />
    </>
  );
};

export default APISetupControl;