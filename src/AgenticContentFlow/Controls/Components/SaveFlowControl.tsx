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
import { useSaveFlow } from '../../hooks/useSaveFlow';

interface SaveFlowControlProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const SaveFlowControl: React.FC<SaveFlowControlProps> = ({
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const { saveCurrentFlow, isSaving, hasCurrentFlow, nodeCount, edgeCount } = useSaveFlow();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {size !== 'icon' && <span className="ml-2">Save Flow</span>}
        </Button>
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