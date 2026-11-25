import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Activity, CheckCircle, Clock, Droplet, Heart, Package, RefreshCw, X } from 'lucide-react';

export const StaffDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptForDonation, setSelectedApptForDonation] = useState(null);
  const [vitals, setVitals] = useState({
    hemoglobin_level: 14.5,
    blood_pressure: '120/80',
    temperature: 98.6,
    notes: 'Health screening normal. Smooth whole blood draw.'
  });
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptRes, invRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/inventory')
      ]);

      if (apptRes.success) setAppointments(apptRes.data);
      if (invRes.success) setInventory(invRes.data?.summary || []);
    } catch (err) {
      console.error('Error loading staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      await api.patch(`/appointments/${apptId}/status`, { status: newStatus });
      setMessage(`Appointment status updated to ${newStatus}`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleCompleteDonation = async (e) => {
    e.preventDefault();
    if (!selectedApptForDonation) return;

    setSubmittingDonation(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/inventory/donation', {
        appointment_id: selectedApptForDonation.id,
        hemoglobin_level: parseFloat(vitals.hemoglobin_level),
        blood_pressure: vitals.blood_pressure,
        temperature: parseFloat(vitals.temperature),
        notes: vitals.notes
      });

      setMessage(res.message || 'Donation completed and blood unit added to inventory!');
      setSelectedApptForDonation(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to complete donation');
    } finally {
      setSubmittingDonation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const waitingQueue = appointments.filter(a => ['waiting', 'confirmed'].includes(a.status));

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

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Clinical Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage donor arrivals, perform vitals triage, and commit physical donations to inventory.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Queue
        </button>
      </div>

      {/* Waiting Donor Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Active Waiting Donor Queue</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            {waitingQueue.length} Donors in Clinic Queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Donor Name</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Slot Time</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingQueue.length > 0 ? (
                waitingQueue.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{appt.first_name} {appt.last_name}</div>
                      <div className="text-xs text-slate-500">{appt.email} • {appt.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {appt.blood_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{appt.slot_date}</div>
                      <div className="text-slate-400">{appt.start_time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Level {appt.priority_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {appt.status === 'waiting' && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                          >
                            Confirm Arrival
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => setSelectedApptForDonation(appt)}
                            className="px-3 py-1 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            Record Donation
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                          className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 rounded transition-colors"
                        >
                          No Show
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No donors currently waiting in the clinic queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Overview Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Blood Bank Inventory Summary (All 8 Groups)</h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Total Available: {inventory.reduce((acc, i) => acc + parseInt(i.available_units || 0), 0)} Units
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {inventory.map((item) => (
            <div
              key={item.group_name}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center hover:border-red-300 transition-colors"
            >
              <span className="text-lg font-black text-red-600">{item.group_name}</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1">{item.available_units}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Units in Stock
              </span>
              {item.earliest_expiry && (
                <span className="text-[10px] text-slate-500 mt-2 font-mono">
                  Exp: {item.earliest_expiry}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Record Donation Vitals Modal */}
      {selectedApptForDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600 fill-current" />
                <h3 className="font-bold text-slate-900 text-base">Record Physical Donation (DBMS ACID Transaction)</h3>
              </div>
              <button onClick={() => setSelectedApptForDonation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteDonation} className="space-y-4 mt-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-950">
                    Donor: {selectedApptForDonation.first_name} {selectedApptForDonation.last_name}
                  </span>
                  <span className="font-black text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                    {selectedApptForDonation.blood_group}
                  </span>
                </div>
                <p className="text-red-700 mt-1">
                  Slot Date: {selectedApptForDonation.slot_date} at {selectedApptForDonation.start_time}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hemoglobin (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vitals.hemoglobin_level}
                    onChange={(e) => setVitals({ ...vitals, hemoglobin_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[10px] text-slate-400">Min 12.5 required</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    required
                    value={vitals.blood_pressure}
                    onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                    placeholder="120/80"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 120/80 mmHg</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 98.6°F</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={vitals.notes}
                  onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApptForDonation(null)}
                  className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDonation}
                  className="w-1/2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {submittingDonation ? 'Committing...' : 'Commit Donation (Add to Inventory)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
