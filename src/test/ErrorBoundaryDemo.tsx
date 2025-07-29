import React, { useState } from 'react';

// Demo component to test the Error Boundary functionality
export const ErrorBoundaryDemo = () => {
  const [errorType, setErrorType] = useState<string>('none');

  const triggerError = (type: string) => {
    setErrorType(type);
  };

  // Component that throws undefined property error
  const UndefinedPropertyError = () => {
    const undefinedArray: any = undefined;
    return <div>{undefinedArray.length}</div>; // This will throw
  };

  // Component that throws network error
  const NetworkError = () => {
    throw new Error('fetch failed - NetworkError occurred');
  };

  // Component that throws generic error
  const GenericError = () => {
    throw new Error('Something went wrong unexpectedly');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Error Boundary Demo</h2>
      <p className="mb-4 text-gray-600">
        Click the buttons below to test different error scenarios:
      </p>
      
      <div className="space-y-2 mb-6">
        <button
          onClick={() => triggerError('undefined')}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Trigger Undefined Property Error
        </button>
        
        <button
          onClick={() => triggerError('network')}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Network Error
        </button>
        
        <button
          onClick={() => triggerError('generic')}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Trigger Generic Error
        </button>
        
        <button
          onClick={() => triggerError('none')}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Reset (No Error)
        </button>
      </div>

      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Error Test Area:</h3>
        {errorType === 'undefined' && <UndefinedPropertyError />}
        {errorType === 'network' && <NetworkError />}
        {errorType === 'generic' && <GenericError />}
        {errorType === 'none' && (
          <div className="text-green-600">
            ✅ No error - Error Boundary is working correctly!
          </div>
        )}
      </div>
    </div>
  );
};