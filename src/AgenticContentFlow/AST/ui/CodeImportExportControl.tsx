/** @format */

import React, { useState, useRef } from 'react';
import { Upload, Download, FileCode } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import ControlButton from '../../Controls/Components/ControlButton';
import { flowGenerator } from '../services/FlowGenerator';
import { useNodeContext } from '../../Node/context/useNodeContext';
import { useEdgeContext } from '../../Edge/store/useEdgeContext';
import { useNotifications } from '../../Notifications/hooks/useNotifications';
import { useCodeStore } from '../../../stores/codeStore';
import { applyInitialNodeVisibility } from '../../Node/factory/utils/nodeHierarchyUtils';
import '../services/ASTNodeTypeRegistration'; // Ensure AST node types are registered

interface CodeImportExportControlProps {
  mode: 'import' | 'export';
}

export const CodeImportExportControl: React.FC<CodeImportExportControlProps> = ({
  mode
}) => {
  const { showErrorToast, showSuccessToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  const { setNodes, nodes } = useNodeContext();
  const { setEdges, edges } = useEdgeContext();

  const handleImportClick = () => {
    setIsImportOpen(true);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.js') && !file.name.endsWith('.mjs')) {
      showErrorToast('Invalid File Type', 'Please select a JavaScript file (.js or .mjs)');
      return;
    }

    setIsProcessing(true);
    try {
      const code = await file.text();
      const flow = flowGenerator.generateFlow(code, file.name);

      // Load the generated flow into the current view
      console.log('📥 CodeImportExportControl: Loading flow into view:', {
        totalNodes: flow.nodes.length,
        totalEdges: flow.edges.length,
        containerNode: flow.nodes.find(n => n.type === 'flownode'),
        functionNodes: flow.nodes.filter(n => n.type === 'functionnode').length,
        childNodes: flow.nodes.filter(n => n.type === 'childnode').length
      });
      
      // Debug: Check what data is in the nodes
      console.log('📥 CodeImportExportControl: Node data details:', {
        containerNodeData: flow.nodes.find(n => n.type === 'flownode')?.data,
        firstFunctionNodeData: flow.nodes.find(n => n.type === 'functionnode')?.data,
        codeStoreState: {
          sourceFilesCount: useCodeStore.getState().sourceFiles.size,
          functionLocationsCount: useCodeStore.getState().functionLocations.size
        }
      });
      
      // Apply initial visibility based on parent's expanded state
      const nodesWithVisibility = applyInitialNodeVisibility(flow.nodes);
      
      setNodes(nodesWithVisibility);
      setEdges(flow.edges);

      setIsImportOpen(false);
      showSuccessToast('Import Successful', `Successfully imported ${flow.nodes.length} nodes and ${flow.edges.length} edges from ${file.name}`);
    } catch (error) {
      console.error('Import error:', error);
      showErrorToast('Import Failed', error instanceof Error ? error.message : 'Failed to import JavaScript file');
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportClick = () => {
    setFileName('exported-flow.js');
    setIsExportOpen(true);
  };

  const handleExport = () => {
    if (!fileName.trim()) return;

    try {
      // For now, we'll export a basic JavaScript structure
      // This is a simplified export - in a full implementation, 
      // you might want to reverse-engineer the flow back to JavaScript
      const exportData = {
        nodes: nodes,
        edges: edges,
        metadata: {
          exportedAt: new Date().toISOString(),
          nodeCount: nodes.length,
          edgeCount: edges.length
        }
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportOpen(false);
      showSuccessToast('Export Successful', `Flow exported as ${link.download}`);
    } catch (error) {
      console.error('Export error:', error);
      showErrorToast('Export Failed', 'Failed to export flow');
    }
  };

  if (mode === 'import') {
    return (
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <span>
            <ControlButton
              tooltip="Import JavaScript File"
              onClick={handleImportClick}
              icon={<Upload className="size-4" />}
              disabled={isProcessing}
            />
          </span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import JavaScript File</DialogTitle>
            <DialogDescription>
              Select a JavaScript file to import and convert to a visual flow.
              The file will be parsed using AST analysis to create nodes and edges.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-input">JavaScript File</Label>
              <div className="flex gap-2">
                <Input
                  id="file-display"
                  placeholder="No file selected"
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={isProcessing}
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".js,.mjs"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
      <DialogTrigger asChild>
        <span>
          <ControlButton
            tooltip="Export Current Flow"
            onClick={handleExportClick}
            icon={<Download className="size-4" />}
          />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Current Flow</DialogTitle>
          <DialogDescription>
            Export the current flow as a JSON file containing nodes and edges data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="export-filename">File Name</Label>
            <Input
              id="export-filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter filename..."
              autoFocus
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Current flow: {nodes.length} nodes, {edges.length} edges
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsExportOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!fileName.trim()}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};