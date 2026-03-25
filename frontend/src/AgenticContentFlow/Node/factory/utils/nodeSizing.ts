/** @format */

const measurementCanvas =
  typeof document !== 'undefined' ? document.createElement('canvas') : null;

function getTextFont(element: HTMLElement): string {
  const style = window.getComputedStyle(element);
  return [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ]
    .filter(Boolean)
    .join(' ');
}

export function measureLongestLineWidth(element: HTMLElement, value: string, fallback = ''): number {
  if (!measurementCanvas) return 0;

  const context = measurementCanvas.getContext('2d');
  if (!context) return 0;

  context.font = getTextFont(element);

  const text = value.trim().length > 0 ? value : fallback;
  if (!text) return 0;

  return text
    .split(/\r?\n/)
    .reduce((maxWidth, line) => Math.max(maxWidth, context.measureText(line || ' ').width), 0);
}

export function ensureNodeWidth(params: {
  id: string;
  setNodes: (updater: (nodes: any[]) => any[]) => void;
  requiredWidth: number;
  defaultWidth?: number;
}): void {
  const { id, setNodes, requiredWidth, defaultWidth = 200 } = params;
  const nextWidth = Math.max(Math.ceil(requiredWidth), defaultWidth);

  setNodes((nodes) =>
    nodes.map((node) => {
      if (node.id !== id) {
        return node;
      }

      const currentWidth =
        typeof node.width === 'number'
          ? node.width
          : typeof node.style?.width === 'number'
            ? node.style.width
            : defaultWidth;

      if (Math.abs(nextWidth - currentWidth) < 1) {
        return node;
      }

      return {
        ...node,
        style: {
          ...node.style,
          width: nextWidth,
        },
      };
    })
  );
}
