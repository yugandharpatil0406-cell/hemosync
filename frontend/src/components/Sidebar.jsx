import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Droplet,
  GitBranch,
  History,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-red-50 text-red-700 font-semibold border-r-4 border-red-600'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-200">
          <Droplet className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">HemoSync</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Blood & Slot OS Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Role Specific Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role} Portal
          </div>
          <nav className="space-y-1">
            {role === 'donor' && (
              <>
                <NavLink to="/donor" end className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/donor/slots" className={linkClass}>
                  <Calendar className="w-4 h-4" />
                  Book Donation Slot
                </NavLink>
                <NavLink to="/donor/history" className={linkClass}>
                  <History className="w-4 h-4" />
                  Donation History
                </NavLink>
              </>
            )}

            {role === 'staff' && (
              <>
                <NavLink to="/staff" end className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Staff Dashboard
                </NavLink>
                <NavLink to="/staff/queue" className={linkClass}>
                  <ListOrdered className="w-4 h-4" />
                  Donor Queue
                </NavLink>
                <NavLink to="/staff/inventory" className={linkClass}>
                  <Package className="w-4 h-4" />
                  Blood Inventory
                </NavLink>
              </>
            )}

            {role === 'admin' && (
              <>
                <NavLink to="/admin" end className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  System Overview
                </NavLink>
                <NavLink to="/admin/scheduler" className={linkClass}>
                  <Clock className="w-4 h-4" />
                  OS Scheduler Config
                </NavLink>
                <NavLink to="/admin/users" className={linkClass}>
                  <Users className="w-4 h-4" />
                  User Management
                </NavLink>
                <NavLink to="/admin/audit" className={linkClass}>
                  <ShieldCheck className="w-4 h-4" />
                  Audit Logs
                </NavLink>
              </>
            )}

            {role === 'requester' && (
              <>
                <NavLink to="/requester" end className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Requests Dashboard
                </NavLink>
                <NavLink to="/requester/new" className={linkClass}>
                  <PlusCircle className="w-4 h-4" />
                  Request Blood
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Core Engines Section (Common tools for review & verification) */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Integrated Engines
          </div>
          <nav className="space-y-1">
            <NavLink to="/engines/compatibility" className={linkClass}>
              <GitBranch className="w-4 h-4 text-rose-500" />
              DSA Compatibility
            </NavLink>
            <NavLink to="/engines/scheduler" className={linkClass}>
              <Clock className="w-4 h-4 text-blue-500" />
              OS Slot Scheduler
            </NavLink>
            <NavLink to="/engines/inventory" className={linkClass}>
              <Package className="w-4 h-4 text-emerald-500" />
              DBMS Inventory
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
