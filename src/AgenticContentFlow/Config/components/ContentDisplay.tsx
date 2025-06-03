import React from 'react';
import { ListConfig, replaceTemplateVariables } from './utils/contentPreviewUtils';

interface ContentDisplayProps {
  data: any[];
  displayType: 'list' | 'table' | 'cards' | 'custom';
  listConfig?: ListConfig;
  maxItems?: number;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  data, 
  displayType, 
  listConfig = {}, 
  maxItems = 10 
}) => {
  if (!Array.isArray(data)) return null;

  const limitedData = data.slice(0, maxItems);

  switch (displayType) {
    case 'list':
      return <ListView data={limitedData} listConfig={listConfig} />;
    case 'table':
      return <TableView data={limitedData} />;
    case 'cards':
      return <CardsView data={limitedData} />;
    case 'custom':
      return <CustomView />;
    default:
      return null;
  }
};

const ListView: React.FC<{ data: any[]; listConfig: ListConfig }> = ({ data, listConfig }) => {
  const template = listConfig.itemTemplate || {
    title: '{{title}}',
    subtitle: '{{body}}',
    metadata: 'ID: {{id}}'
  };

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="border rounded p-3 mb-2 bg-white">
          <div className="font-medium text-sm">
            {template.title ? replaceTemplateVariables(template.title, item) : item.title || 'No title'}
          </div>
          {template.subtitle && (
            <div className="text-sm text-gray-600 mt-1">
              {replaceTemplateVariables(template.subtitle, item)}
            </div>
          )}
          {template.metadata && (
            <div className="text-xs text-gray-500 mt-2">
              {replaceTemplateVariables(template.metadata, item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TableView: React.FC<{ data: any[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-2 py-1 text-left font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map(col => (
                <td key={col} className="px-2 py-1">{String(row[col] || '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CardsView: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {data.map((item, index) => (
        <div key={index} className="border rounded p-2 bg-white">
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(item).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value || '')}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const CustomView: React.FC = () => {
  return (
    <div className="text-center text-gray-500 py-8">
      <div className="text-sm">Custom Display Type</div>
      <div className="text-xs mt-1">Custom rendering configuration required</div>
    </div>
  );
};