// Helper function to get operation color
export const getOperationColor = (operation: string): string => {
    switch (operation.toLowerCase()) {
        case 'filter':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'transform':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'aggregate':
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'conditional':
            return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'validate':
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};