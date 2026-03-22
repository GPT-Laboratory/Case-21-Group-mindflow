import { ReactElement, ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import ControlButton from "./ControlButton";

// Reusable dropdown control component
interface ControlDropdownProps {
  tooltip: string;
  icon: ReactElement;
  items: {
    key: string;
    label: ReactNode;
    onClick: (e: React.MouseEvent) => void;
    active?: boolean;
    className?: string;
  }[];
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  customContent?: ReactNode;
}

const ControlDropdown: React.FC<ControlDropdownProps> = ({
  tooltip,
  icon,
  items,
  disabled = false,
  open,
  onOpenChange,
  customContent
}) => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span className="inline-flex">
          <ControlButton
            tooltip={tooltip}
            onClick={(e) => e.preventDefault()}
            icon={icon}
            disabled={disabled}
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="p-0"
        onKeyDown={(e) => {
          // Let custom content handle its own keyboard events
          if (customContent) {
            e.stopPropagation();
          }
        }}
        onCloseAutoFocus={(e) => {
          // Prevent auto-focus when using custom content
          if (customContent) {
            e.preventDefault();
          }
        }}
      >
        {customContent ? (
          <div className="focus:outline-none">
            {customContent}
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem 
              key={item.key} 
              onClick={item.onClick}
              className={`${item.active ? "bg-accent" : ""} ${item.className || ""}`}
            >
              {item.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ControlDropdown;