/** @format */

import React from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ControlButton from './ControlButton';
import { useFlowsStore } from '../../stores/useFlowsStore';

interface FlowSettingsControlProps {}

export const FlowSettingsControl: React.FC<FlowSettingsControlProps> = () => {
  const navigate = useNavigate();
  const selectedFlowId = useFlowsStore((state) => state.selectedFlowId);

  const handleOpenSettings = () => {
    if (!selectedFlowId) {
      return;
    }

    navigate(`/flows/${selectedFlowId}/settings`);
  };

  return (
    <ControlButton
      tooltip={selectedFlowId ? 'Flow Settings' : 'Select a flow to open settings'}
      onClick={handleOpenSettings}
      icon={<Settings className="size-4" />}
      disabled={!selectedFlowId}
    />
  );
};
