import { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Reusable control button component
interface ControlButtonProps {
  tooltip: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon: ReactElement;
  disabled?: boolean;
  active?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  tooltip,
  onClick,
  icon,
  disabled = false,
  active = false,
}) => {

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Button
      variant={active ? "default" : "secondary"}
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center justify-center w-6 h-6 p-0
         shadow-none rounded-full text-gray-500 hover:bg-gray-100
         ${active ? "bg-gray-200" : "bg-transparent"}
         ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      title={tooltip}
    >
      {icon}
      <span className="sr-only">{tooltip}</span>
    </Button>
  );
};

export default ControlButton;
