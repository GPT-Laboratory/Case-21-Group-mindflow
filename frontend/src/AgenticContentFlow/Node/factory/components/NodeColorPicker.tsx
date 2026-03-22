import React from 'react';
import { Palette } from 'lucide-react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface NodeColorPickerProps {
  nodeId: string;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#fef3c7', '#fde68a', '#fbbf24', // amber
  '#dbeafe', '#93c5fd', '#3b82f6', // blue
  '#dcfce7', '#86efac', '#22c55e', // green
  '#f3e8ff', '#c4b5fd', '#8b5cf6', // purple
  '#fecaca', '#fca5a5', '#ef4444', // red
  '#ffedd5', '#fdba74', '#f97316', // orange
  '#fce7f3', '#f9a8d4', '#ec4899', // pink
  '#e0f2fe', '#7dd3fc', '#0ea5e9', // sky
  '#f5f5f5', '#d4d4d4', '#737373', // gray
];

export const NodeColorPicker: React.FC<NodeColorPickerProps> = ({
  nodeId,
  currentColor,
  onColorChange,
}) => {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex items-center gap-2">
          <Palette className="size-4" />
          <span>Change Color</span>
          <div
            className="ml-auto w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-3 w-auto min-w-0">
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                color === currentColor ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Custom:</label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-8 h-6 cursor-pointer border-0 p-0"
          />
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
