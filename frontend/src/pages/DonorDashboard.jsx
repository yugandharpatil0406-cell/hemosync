import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar, CheckCircle2, Clock, Droplet, History, MapPin, Plus, ShieldCheck, X } from 'lucide-react';

export const DonorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [priorityLevel, setPriorityLevel] = useState(5);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, slotRes, apptRes, histRes] = await Promise.all([
        api.get('/donors/me'),
        api.get('/slots?status=open'),
        api.get('/appointments'),
        api.get('/donors/history')
      ]);

      if (profRes.success) setProfile(profRes.data);
      if (slotRes.success) setSlots(slotRes.data);
      if (apptRes.success) setAppointments(apptRes.data);
      if (histRes.success) setHistory(histRes.data);
    } catch (err) {
      console.error('Error loading donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.post('/appointments/book', {
        slot_id: selectedSlot.id,
        priority_level: parseInt(priorityLevel),
        notes: bookingNotes
      });

      setSuccessMessage(res.message || 'Donation slot booked successfully!');
      setSelectedSlot(null);
      setBookingNotes('');
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Booking failed. Slot may be full.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await api.delete(`/appointments/${appointmentId}`);
      setSuccessMessage('Appointment cancelled successfully.');
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Donor Welcome & Stats Section */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-red-100 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Donor Portal
            </div>
            <h2 className="text-2xl font-extrabold mt-1">
              Welcome, {profile?.first_name} {profile?.last_name}!
            </h2>
            <p className="text-xs text-red-100 mt-1">
              Thank you for being part of our voluntary blood donation network.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20">
            <div className="text-center border-r border-white/20 pr-4">
              <p className="text-[11px] font-semibold text-red-200 uppercase">Blood Group</p>
              <p className="text-2xl font-extrabold">{profile?.blood_group || 'O+'}</p>
            </div>
            <div className="text-center pl-2">
              <p className="text-[11px] font-semibold text-red-200 uppercase">Total Donations</p>
              <p className="text-2xl font-extrabold">{profile?.total_donations || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Slots Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Available Donation Slots</h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {slots.length} Open Slots Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-red-300 transition-colors flex flex-col justify-between bg-slate-50/50"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {slot.slot_date}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {slot.available_capacity} / {slot.capacity} spots left
                  </span>
                </div>

                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {slot.start_time} - {slot.end_time}
                </p>

                <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{slot.location}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedSlot(slot)}
                disabled={slot.available_capacity <= 0}
                className="w-full mt-4 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Reserve Slot
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Appointments Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">My Scheduled Appointments</h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {appointments.length} Total Bookings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Algorithm Policy</th>
                <th className="py-3 px-4">Booking Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{appt.slot_date}</div>
                      <div className="text-xs text-slate-500 font-normal">{appt.start_time} - {appt.end_time}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{appt.location}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {appt.scheduling_algorithm}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(appt.booking_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {['waiting', 'confirmed'].includes(appt.status) && (
                        <button
                          onClick={() => handleCancelBooking(appt.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    You have no active appointments scheduled. Select an open slot above to book.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation History Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">Completed Donation History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Donation Date</th>
                <th className="py-3 px-4">Units Donated</th>
                <th className="py-3 px-4">Vitals (Hemoglobin / BP / Temp)</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{record.donation_date}</td>
                    <td className="py-3 px-4 font-bold text-red-600">{record.units_donated} Unit (RBC)</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Hb: {record.hemoglobin_level || '14.2'} g/dL • BP: {record.blood_pressure || '120/80'} • Temp: {record.temperature || '98.6'}°F
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{record.location}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    No past donation records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Confirm Donation Slot Booking</h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSlot} className="space-y-4 mt-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-950">
                <p className="font-bold">{selectedSlot.location}</p>
                <p className="mt-1 text-red-700">
                  {selectedSlot.slot_date} at {selectedSlot.start_time} - {selectedSlot.end_time}
                </p>
                <p className="mt-1 text-red-600">
                  Remaining Capacity: {selectedSlot.available_capacity}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Priority Level (1 = Emergency/Highest, 10 = Standard)
                </label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={1}>Level 1 - Critical / Emergency</option>
                  <option value={3}>Level 3 - High Priority</option>
                  <option value={5}>Level 5 - Regular Donor (Default)</option>
                  <option value={7}>Level 7 - Flexible Schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Medical Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Any dietary preferences, latex allergies..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-1/2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center"
                >
                  {bookingLoading ? 'Reserving...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
