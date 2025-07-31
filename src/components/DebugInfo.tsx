import React from 'react';

interface DebugInfoProps {
  data: any;
  title: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ data, title }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-4 mt-4">
      <h4 className="font-bold text-sm text-gray-700 mb-2">🐛 Debug: {title}</h4>
      <pre className="text-xs text-gray-600 overflow-auto max-h-40">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};