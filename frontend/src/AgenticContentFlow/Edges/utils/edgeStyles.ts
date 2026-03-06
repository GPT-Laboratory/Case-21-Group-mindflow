/** @format */

export type LifecyclePhase = 'black' | 'blue' | 'green';

export interface EdgeColors {
  edgeColor: string;
  packageColor: string;
  strokeWidth: number;
}

export function getEdgeColors(lifecyclePhase: LifecyclePhase): EdgeColors {
  switch (lifecyclePhase) {
    case 'black':
      return {
        edgeColor: '#000000',
        packageColor: '#000000',
        strokeWidth: 2,
      };
    case 'blue':
      return {
        edgeColor: '#3b82f6',
        packageColor: '#3b82f6',
        strokeWidth: 3,
      };
    case 'green':
      return {
        edgeColor: '#10b981',
        packageColor: '#10b981',
        strokeWidth: 3,
      };
    default:
      return {
        edgeColor: '#000000',
        packageColor: '#000000',
        strokeWidth: 2,
      };
  }
}