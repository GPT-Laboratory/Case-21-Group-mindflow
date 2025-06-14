/** @format */

/**
 * Shared styling utilities for both cell and container factories
 */

/**
 * Standard color schemes used across different node types
 */
export const colorSchemes = {
  default: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af'],
  purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#c4b5fd'],
  blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd'],
  green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac'],
  orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74'],
  red: ['#fef2f2', '#fecaca', '#fca5a5', '#f87171']
};

/**
 * Get color by depth for consistent depth-based coloring
 */
export const getColorByDepth = (depth: number, scheme: keyof typeof colorSchemes = 'default'): string => {
  const colors = colorSchemes[scheme];
  return colors[Math.min(depth, colors.length - 1)] || colors[colors.length - 1];
};

/**
 * Common badge color classes for different node states
 */
export const badgeColors = {
  default: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800'
};

/**
 * Standard node dimensions used across factories
 */
export const standardDimensions = {
  cell: {
    width: 200,
    height: 200
  },
  container: {
    collapsed: { width: 300, height: 200 },
    expanded: { width: 300, height: 300 }
  }
};