import { GenerationResult, GenerationType } from "../../generatortypes";
import { GenerationPanel } from "./GenerationPanel";
import { useSelect } from "../../../Select/contexts/SelectContext";

export interface GenerationControlProps {
  type?: GenerationType;
  onGenerated: (result: GenerationResult) => void;
}

/**
 * Generation Control Button
 * 
 * Unified control for all generation types - replaces the separate Flow generation control
 * and can handle process, flow, and hybrid generation.
 */
const GenerationControl: React.FC<GenerationControlProps> = ({
  type = 'flow',
  onGenerated
}) => {
  const { selectedNodes } = useSelect();

  const handleGenerated = (result: GenerationResult) => {
    onGenerated(result);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-2xl px-0">
      <GenerationPanel
        type={type}
        selectedNodes={selectedNodes}
        onGenerated={handleGenerated}
      />
    </div>
  );
};

export default GenerationControl;