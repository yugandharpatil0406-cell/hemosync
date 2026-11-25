import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Database, Package, RefreshCw, ShieldCheck } from 'lucide-react';

export const InventoryExplorer = () => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      if (res.success) setInventory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ENGINE 03: DBMS Inventory & Records Manager</h2>
          <p className="text-xs text-slate-500 mt-1">
            Normalized MySQL/MariaDB database with ACID transactions, row-level locks (SELECT FOR UPDATE), FIFO batch dispatch, and triggers.
          </p>
        </div>
        <button
          onClick={loadInventory}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Batches
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {(inventory?.summary || []).map((item) => (
          <div key={item.group_name} className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <span className="text-lg font-black text-red-600">{item.group_name}</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{item.available_units}</p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Available Units</p>
          </div>
        ))}
      </div>

      {/* Detailed Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4">Physical Blood Unit Batches (FIFO Order)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Units Available</th>
                <th className="py-3 px-4">Units Reserved</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {(inventory?.batches || []).map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">{batch.batch_number}</td>
                  <td className="py-3 px-4 font-black text-red-600 font-sans text-sm">{batch.blood_group}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{batch.units_available}</td>
                  <td className="py-3 px-4 text-slate-500">{batch.units_reserved}</td>
                  <td className="py-3 px-4 text-slate-600">{batch.expiry_date}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${batch.days_to_expiry < 7 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {batch.days_to_expiry} days
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={batch.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
