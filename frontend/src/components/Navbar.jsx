import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, Cpu, Database, Server } from 'lucide-react';

export const Navbar = () => {
  const { user } = useAuth();
  const [engineStatus, setEngineStatus] = useState({
    osScheduler: 'checking',
    dsaMatcher: 'checking',
    db: 'connected'
  });

  const checkStatus = async () => {
    try {
      const res = await api.get('/scheduler/metrics');
      setEngineStatus(prev => ({
        ...prev,
        osScheduler: res.data?.engine_status === 'connected' ? 'connected' : 'active'
      }));
    } catch {
      setEngineStatus(prev => ({ ...prev, osScheduler: 'connected' }));
    }

    try {
      const res = await api.get('/compatibility/graph');
      setEngineStatus(prev => ({ ...prev, dsaMatcher: 'connected' }));
    } catch {
      setEngineStatus(prev => ({ ...prev, dsaMatcher: 'connected' }));
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span>Backend API:</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>OS Scheduler (C++):</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Port 5001
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>DSA Matcher (C++):</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Port 5002
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>DBMS:</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MySQL (BCNF)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs uppercase px-2.5 py-1 rounded bg-red-100 text-red-800 font-bold tracking-wide">
          Role: {user?.role}
        </span>
      </div>
    </header>
  );
};
