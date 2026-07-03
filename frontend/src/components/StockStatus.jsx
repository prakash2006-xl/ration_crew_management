import React from 'react';
import { Package, AlertTriangle, XCircle } from 'lucide-react';

const StockStatus = ({ item_name, status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let Icon = Package;

  if (status === 'Available') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (status === 'Low Stock') {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    Icon = AlertTriangle;
  } else if (status === 'Out Of Stock') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    Icon = XCircle;
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg shadow-sm border border-gray-200 ${bgColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white bg-opacity-50 ${textColor}`}>
          <Icon size={20} />
        </div>
        <span className="font-semibold text-gray-800">{item_name}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white bg-opacity-75 ${textColor}`}>
        {status}
      </span>
    </div>
  );
};

export default StockStatus;
