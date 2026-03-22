/** @format */

export type LifecyclePhase = 'black' | 'blue' | 'green';

export interface EdgeColors {
  edgeColor: string;
  packageColor: string;
  strokeWidth: number;
}

export function getEdgeColors(lifecyclePhase: LifecyclePhase, sourceNodeColor?: string): EdgeColors {
  const edgeColor = sourceNodeColor || '#000000';

  switch (lifecyclePhase) {
    case 'black':
      return {
        edgeColor,
        packageColor: edgeColor,
        strokeWidth: 2,
      };
    case 'blue':
      return {
        edgeColor,
        packageColor: edgeColor,
        strokeWidth: 3,
      };
    case 'green':
      return {
        edgeColor,
        packageColor: edgeColor,
        strokeWidth: 3,
      };
    default:
      return {
        edgeColor,
        packageColor: edgeColor,
        strokeWidth: 2,
      };
  }
}