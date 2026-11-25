import React from 'react';
import { CompatibilityVisualizer } from '../components/CompatibilityVisualizer';

export const CompatibilityExplorer = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">ENGINE 02: DSA Blood Compatibility Engine</h2>
        <p className="text-xs text-slate-500 mt-1">
          Interactive evaluation of the C++ Directed Graph (8 Nodes, ABO/Rh RBC rules), Breadth-First & Depth-First Search traversals, AVL Tree donor indexing, and Hash Map blood group lookups.
        </p>
      </div>
      <CompatibilityVisualizer />
    </div>
  );
};
