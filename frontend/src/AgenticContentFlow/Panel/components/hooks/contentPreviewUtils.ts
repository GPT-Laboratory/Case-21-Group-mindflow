export const isValidRealTimeData = (dataFlow: any): boolean => {
  // Handle EdgeDataFlow objects from the process context
  if (dataFlow && typeof dataFlow === 'object' && 'data' in dataFlow) {
    const actualData = dataFlow.data;
    
    // Check if the actual data is valid
    if (Array.isArray(actualData) && actualData.length > 0) {
      const firstItem = actualData[0];
      if (firstItem && typeof firstItem === 'object') {
        // Accept data that has meaningful properties (not just test data)
        const hasRealContent = 
          (firstItem.title && firstItem.title !== "Sample text") ||
          (firstItem.body && typeof firstItem.body === 'string') ||
          (firstItem.name && typeof firstItem.name === 'string') ||
          (firstItem.email && typeof firstItem.email === 'string') ||
          // Accept LogicalNode processed data with aggregated content
          (firstItem.aggregated === true) ||
          // Accept data with meaningful IDs (not just 42)
          (firstItem.id && firstItem.id !== 42);
        
        return hasRealContent;
      }
    }
    
    // Handle single object case
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      return (
        (actualData.title && actualData.title !== "Sample text") ||
        (actualData.body && typeof actualData.body === 'string') ||
        (actualData.aggregated === true) ||
        (actualData.id && actualData.id !== 42)
      );
    }
  }
  
  // Handle direct array data (fallback for other cases)
  if (Array.isArray(dataFlow) && dataFlow.length > 0) {
    const firstItem = dataFlow[0];
    if (firstItem && typeof firstItem === 'object') {
      return (
        (firstItem.title && firstItem.title !== "Sample text") ||
        (firstItem.body && typeof firstItem.body === 'string') ||
        (firstItem.aggregated === true) ||
        (firstItem.id && firstItem.id !== 42)
      );
    }
  }
  
  return false;
};