import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowRight, CheckCircle2, GitBranch, RefreshCw, XCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CompatibilityVisualizer = () => {
  const [selectedDonor, setSelectedDonor] = useState('O-');
  const [selectedRecipient, setSelectedRecipient] = useState('AB+');
  const [checkResult, setCheckResult] = useState(null);
  const [traversalType, setTraversalType] = useState('bfs');
  const [traversalStart, setTraversalStart] = useState('O-');
  const [traversalResult, setTraversalResult] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    try {
      const res = await api.get('/compatibility/graph');
      setGraphData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await api.post('/compatibility/check', {
        donor_blood_group: selectedDonor,
        recipient_blood_group: selectedRecipient
      });
      setCheckResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTraversal = async () => {
    try {
      const res = await api.get(`/compatibility/traversal?type=${traversalType}&start=${encodeURIComponent(traversalStart)}`);
      setTraversalResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGraph();
    handleCheck();
    handleTraversal();
  }, []);

  return (
    <div className="space-y-6">
      {/* Compatibility Matrix & Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Pair Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Red Blood Cell Compatibility Matcher</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Evaluates directed graph compatibility according to ABO and Rh antigens for packed red blood cells (RBC).
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Donor Blood Group
              </label>
              <select
                value={selectedDonor}
                onChange={(e) => setSelectedDonor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Recipient Blood Group
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Evaluate Compatibility (C++ DSA)'}
          </button>

          {checkResult && (
            <div className={`mt-6 p-4 rounded-xl border ${checkResult.compatible ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-3">
                {checkResult.compatible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`text-sm font-bold ${checkResult.compatible ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {checkResult.compatible ? 'COMPATIBLE TRANSFUSION' : 'INCOMPATIBLE - RISK OF HEMOLYSIS'}
                  </h4>
                  <p className={`text-xs mt-0.5 ${checkResult.compatible ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Donor <span className="font-bold">{selectedDonor}</span> {checkResult.compatible ? 'can safely donate to' : 'CANNOT donate to'} Recipient <span className="font-bold">{selectedRecipient}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Traversal Explorer (BFS / DFS) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Graph Traversal (BFS & DFS)</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              C++ Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Demonstrates Breadth-First Search (BFS) and Depth-First Search (DFS) order from any root node on the directed compatibility graph.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Algorithm
              </label>
              <select
                value={traversalType}
                onChange={(e) => setTraversalType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bfs">BFS (Breadth First)</option>
                <option value="dfs">DFS (Depth First)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Root Node
              </label>
              <select
                value={traversalStart}
                onChange={(e) => setTraversalStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleTraversal}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Run Traversal
          </button>

          {traversalResult?.traversal_order && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {traversalType.toUpperCase()} Node Visit Sequence ({traversalResult.traversal_order.length} Reachable Groups):
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {traversalResult.traversal_order.map((node, idx) => (
                  <React.Fragment key={node}>
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-slate-800 border border-slate-300 shadow-xs">
                      {node}
                    </span>
                    {idx < traversalResult.traversal_order.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Red Blood Cell Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-1">Standard Red Blood Cell Compatibility Matrix</h3>
        <p className="text-xs text-slate-500 mb-6">Row represents Donor group; Column represents Recipient group.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2.5 px-3 text-left font-bold text-slate-700">Donor \ Recipient</th>
                {BLOOD_GROUPS.map((recipient) => (
                  <th key={recipient} className="py-2.5 px-3 font-bold text-slate-800">{recipient}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BLOOD_GROUPS.map((donor) => {
                const canDonateTo = {
                  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                  'O+': ['A+', 'B+', 'AB+', 'O+'],
                  'A-': ['A+', 'A-', 'AB+', 'AB-'],
                  'A+': ['A+', 'AB+'],
                  'B-': ['B+', 'B-', 'AB+', 'AB-'],
                  'B+': ['B+', 'AB+'],
                  'AB-': ['AB+', 'AB-'],
                  'AB+': ['AB+']
                }[donor] || [];

                return (
                  <tr key={donor} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900 bg-slate-50/50">{donor}</td>
                    {BLOOD_GROUPS.map((recipient) => {
                      const isCompatible = canDonateTo.includes(recipient);
                      return (
                        <td key={recipient} className="py-2.5 px-3">
                          {isCompatible ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              YES
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium text-slate-300">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
