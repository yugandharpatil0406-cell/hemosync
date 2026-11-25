import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = (s) => {
    switch (s?.toLowerCase()) {
      case 'confirmed':
      case 'fulfilled':
      case 'active':
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'waiting':
      case 'pending':
      case 'open':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'donated':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'urgent':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical':
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'full':
      case 'closed':
      case 'no_show':
      case 'deferred':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle(status)} capitalize`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  );
};
