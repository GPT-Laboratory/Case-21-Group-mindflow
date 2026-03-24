/** @format */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Flow } from '../../stores/useFlowsStore';

interface RenameFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: Flow | null;
  onRename: (flowId: string, name: string) => Promise<boolean>;
}

export const RenameFlowDialog: React.FC<RenameFlowDialogProps> = ({
  open,
  onOpenChange,
  flow,
  onRename,
}) => {
  const [name, setName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (open && flow) {
      setName(flow.name);
    }
  }, [open, flow]);

  const handleRename = async () => {
    if (!flow || !name.trim()) return;
    setIsRenaming(true);
    try {
      const ok = await onRename(flow.id, name.trim());
      if (ok) {
        onOpenChange(false);
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename flow</DialogTitle>
          <DialogDescription>
            Choose a new name for this mindmap. This updates the flow everywhere it appears.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rename-flow-name">Flow name</Label>
            <Input
              id="rename-flow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Flow name"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleRename()}
            disabled={!name.trim() || isRenaming}
          >
            {isRenaming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
