import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SchedulerQueueVisualizer } from '../components/SchedulerQueueVisualizer';
import { Activity, Clock, Droplet, FileText, Heart, Package, ShieldCheck, Users } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'scheduler' | 'users' | 'audit'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, userRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs?limit=25')
      ]);

      if (dashRes.success) setStats(dashRes.data);
      if (userRes.success) setUsers(userRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const summary = stats?.summary || {};

  return (
    <div className="space-y-8">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Administration & Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Control the 4 integrated engines: OS Scheduler, DSA Matcher, DBMS Inventory, and Web Dashboard.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'overview' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'scheduler' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OS Scheduler
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'users' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'audit' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Donors</span>
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{summary.total_donors || 0}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {summary.active_donors || 0} active eligible donors
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings</span>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{summary.total_appointments || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {summary.confirmed_appointments || 0} confirmed • {summary.waiting_appointments || 0} waiting
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Stock</span>
                <Package className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{summary.total_units_available || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Unexpired RBC Units</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Requests</span>
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{summary.pending_requests || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {summary.fulfilled_requests || 0} fulfilled to hospitals
              </p>
            </div>
          </div>

          {/* Blood Inventory Distribution Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">Inventory Breakdown by Blood Group</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {(stats?.inventory_distribution || []).map((item) => (
                <div key={item.group_name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-base font-extrabold text-red-600">{item.group_name}</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{item.units_available}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Available</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Recent Completed Donations</h3>
              <div className="space-y-3">
                {(stats?.recent_donations || []).map((don) => (
                  <div key={don.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{don.first_name} {don.last_name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{don.donation_date}</p>
                    </div>
                    <span className="font-extrabold text-red-600 bg-white px-2 py-1 rounded border border-slate-200">
                      {don.blood_group} ({don.units_donated} Unit)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Recent Hospital Requests</h3>
              <div className="space-y-3">
                {(stats?.recent_requests || []).map((req) => (
                  <div key={req.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{req.patient_name} • {req.hospital_name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Need: {req.units_requested} Units of {req.blood_group}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scheduler' && (
        <SchedulerQueueVisualizer />
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Registered System Users</h3>
            <span className="text-xs text-slate-500">{users.length} Users Enrolled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Donations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-red-600">{u.blood_group || '-'}</td>
                    <td className="py-3 px-4 text-xs font-mono">{u.total_donations || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                            u.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Immutable Audit Trail Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                    <td className="py-3 px-4 text-slate-600">{log.email || 'System'}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                      {log.new_values ? JSON.stringify(log.new_values) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
