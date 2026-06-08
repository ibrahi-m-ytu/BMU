import React from 'react';

interface Props {
  toast: { message: string; type?: 'success' | 'error' | 'info' } | null;
  onHide: () => void;
}

export function Toast({ toast, onHide }: Props) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold text-sm ${
        isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
      }`}>
        <span className="material-symbols-outlined shrink-0" style={{fontVariationSettings: "'FILL' 1"}}>
          {isError ? 'error' : 'check_circle'}
        </span>
        {toast.message}
      </div>
    </div>
  );
}
