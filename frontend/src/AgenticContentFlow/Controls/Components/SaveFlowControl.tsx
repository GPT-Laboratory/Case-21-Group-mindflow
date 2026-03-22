/** @format */

import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ControlButton from './ControlButton';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { useFlowsStore } from '../../stores/useFlowsStore';

interface SaveFlowControlProps {}

export const SaveFlowControl: React.FC<SaveFlowControlProps> = () => {
  const { saveCurrentFlow, isSaving, hasCurrentFlow, nodeCount, edgeCount } = useSaveFlow();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Pre-fill name/description when opening dialog for existing flow
  const handleOpen = () => {
    if (hasCurrentFlow) {
      const { selectedFlowId, flows } = useFlowsStore.getState();
      if (selectedFlowId && flows[selectedFlowId]) {
        setName(flows[selectedFlowId].name);
        setDescription(flows[selectedFlowId].description || '');
      }
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const success = await saveCurrentFlow(name, description);
    if (success) {
      setIsOpen(false);
      setName('');
      setDescription('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span>
          <ControlButton
            tooltip={isSaving ? "Saving..." : "Save Flow"}
            onClick={handleOpen}
            icon={isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            disabled={isSaving}
          />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {hasCurrentFlow ? 'Update Flow' : 'Save New Flow'}
          </DialogTitle>
          <DialogDescription>
            Save your current flow with {nodeCount} nodes and {edgeCount} edges.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="flow-name">Flow Name *</Label>
            <Input
              id="flow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter flow name..."
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="flow-description">Description</Label>
            <Textarea
              id="flow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Flow'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 