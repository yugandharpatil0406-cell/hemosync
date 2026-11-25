import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, Lock, Mail, ShieldAlert } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('donor1@bloodbank.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else if (user.role === 'donor') navigate('/donor');
      else if (user.role === 'requester') navigate('/requester');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (role) => {
    if (role === 'admin') {
      setEmail('admin@bloodbank.com');
      setPassword('password123');
    } else if (role === 'staff') {
      setEmail('staff@bloodbank.com');
      setPassword('password123');
    } else if (role === 'donor') {
      setEmail('donor1@bloodbank.com');
      setPassword('password123');
    } else if (role === 'requester') {
      setEmail('requester@bloodbank.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Droplet className="w-7 h-7 fill-current" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          HemoSync Blood Bank
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          OS Scheduler • DSA Matcher • DBMS Inventory • Web Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Role Selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Demo Login:
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser('donor')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                  email.includes('donor') ? 'bg-red-50 text-red-700 border-red-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('staff')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                  email.includes('staff') ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('admin')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                  email.includes('admin') ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('requester')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                  email.includes('requester') ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Requester
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="name@bloodbank.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
                Register as a Donor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
