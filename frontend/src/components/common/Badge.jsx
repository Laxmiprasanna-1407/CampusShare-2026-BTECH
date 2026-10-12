import React from 'react';

export function Badge({ status, type = 'rental' }) {
  if (!status) return null;

  const getStyle = () => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      case 'RETURNED':
      case 'PAID':
      case 'NEW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'LIKE_NEW':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-500/20';
      case 'GOOD':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20';
      case 'FAIR':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'CANCELLED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20';
    }
  };

  const getLabel = () => {
    switch (status.toUpperCase()) {
      case 'LIKE_NEW':
        return 'Like New';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {getLabel()}
    </span>
  );
}
