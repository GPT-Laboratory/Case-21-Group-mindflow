// Utility functions for handling node data separation
export const separateNodeData = (
  formData: Record<string, any>,
  templateDefaults: Record<string, any> = {},
  systemFields: string[] = ['label', 'details', 'subject', 'nodeLevel', 'nodeType', 'category', 'group', 'description', 'expanded', 'depth', 'isParent']
) => {
  const instanceData: Record<string, any> = {};
  const systemData: Record<string, any> = {};
  const templateKeys = Object.keys(templateDefaults);

  Object.entries(formData).forEach(([key, value]) => {
    if (systemFields.includes(key)) {
      systemData[key] = value;
    } else if (!templateKeys.includes(key) || value !== templateDefaults[key]) {
      // Only include in instance data if it's different from template default
      instanceData[key] = value;
    }
  });

  return { instanceData, systemData };
};

export const createInstanceSpecificData = (
  instanceData: Record<string, any>,
  templateDefaults: Record<string, any>
) => {
  const result: Record<string, any> = {};
  
  Object.entries(instanceData).forEach(([key, value]) => {
    // Only include if it's actually different from the template
    if (templateDefaults[key] === undefined || value !== templateDefaults[key]) {
      result[key] = value;
    }
  });
  
  return result;
};