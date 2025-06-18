import { GenerationResult, GenerationType } from "../../generatortypes";
import GenerationPanel from "./GenerationPanel";

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
  const handleGenerated = (result: GenerationResult) => {
    onGenerated(result);
  };

  return (

    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl">
      <GenerationPanel
        type={type}
        onGenerated={handleGenerated}
      />
    </div>
  );
};

export default GenerationControl;