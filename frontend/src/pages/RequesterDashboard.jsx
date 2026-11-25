import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { AlertCircle, CheckCircle2, Droplet, Heart, PlusCircle, Search, X } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RequesterDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [checkBg, setCheckBg] = useState('O+');
  const [compatCheckData, setCompatCheckData] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);

  const [formData, setFormData] = useState({
    blood_group: 'O+',
    units_requested: 2,
    urgency: 'normal',
    patient_name: '',
    hospital_name: 'Metropolitan General Hospital',
    reason: 'Elective surgery / transfusion support',
    notes: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      if (res.success) setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkCompatibleStock = async (bg) => {
    setCheckingStock(true);
    try {
      const res = await api.get(`/compatibility/donors?blood_group=${encodeURIComponent(bg)}`);
      setCompatCheckData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingStock(false);
    }
  };

  useEffect(() => {
    loadRequests();
    checkCompatibleStock('O+');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await api.post('/requests', {
        ...formData,
        units_requested: parseInt(formData.units_requested)
      });
      setMessage('Blood request submitted successfully!');
      setShowModal(false);
      setFormData({
        blood_group: 'O+',
        units_requested: 2,
        urgency: 'normal',
        patient_name: '',
        hospital_name: 'Metropolitan General Hospital',
        reason: '',
        notes: ''
      });
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this blood request?')) return;
    try {
      await api.patch(`/requests/${id}/status`, { status: 'cancelled' });
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header and Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Blood Requester Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit demand for packed red blood cells with automated compatibility verification and stock matching.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Blood Request
        </button>
      </div>

      {/* Live Compatible Stock Checker Tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Check Compatible Blood Stock (C++ Engine)</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Patient Blood Group:</span>
            <select
              value={checkBg}
              onChange={(e) => {
                setCheckBg(e.target.value);
                checkCompatibleStock(e.target.value);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-red-600 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        {compatCheckData && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Patient can receive from:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {compatCheckData.compatible_blood_groups?.map((bg) => (
                    <span key={bg} className="px-2 py-0.5 rounded text-xs font-black bg-white border border-slate-300 text-slate-800">
                      {bg}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Compatible Stock:</span>
                <p className="text-xl font-extrabold text-emerald-600">
                  {compatCheckData.total_compatible_units} Units Available
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {compatCheckData.available_inventory?.map((inv) => (
                <div key={inv.group_name} className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700">{inv.group_name} Stock</span>
                  <p className="text-lg font-black text-slate-900">{inv.units_available}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submitted Requests List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4">My Submitted Blood Requests</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient & Hospital</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Units (Req / Fulfilled)</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{req.patient_name}</div>
                      <div className="text-xs text-slate-500">{req.hospital_name}</div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-red-600">{req.blood_group}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{req.units_fulfilled}</span> / {req.units_requested} Units
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.urgency} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{req.request_date}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No blood requests submitted yet. Click "Create Blood Request" above to submit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blood Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Submit Hospital Blood Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.units_requested}
                    onChange={(e) => setFormData({ ...formData, units_requested: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Diagnosis / Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Acute trauma / cardiovascular surgery"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Submit Blood Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
