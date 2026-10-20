/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Database, Table, FileJson, Copy, Check, Search } from 'lucide-react';
import { GCPBillingRow } from '../types/billing';

interface RawDataViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: GCPBillingRow[];
}

export const RawDataViewerModal: React.FC<RawDataViewerModalProps> = ({
  isOpen,
  onClose,
  rows,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.service.description.toLowerCase().includes(term) ||
      r.sku.description.toLowerCase().includes(term) ||
      r.project.id.toLowerCase().includes(term) ||
      r.location.region.toLowerCase().includes(term)
    );
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rows.slice(0, 100), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl rounded-xl border border-[#21262D] bg-[#11161F] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#21262D] px-5 py-3.5 bg-[#0E131B]">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-[#60A5FA]" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                BigQuery Billing Export Records
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Dataset: <code className="text-slate-300">gcp_billing_export_v1_0189BF</code> ({rows.length} rows)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[#262C36] bg-[#0E131B] p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-[#1C2331] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="h-3 w-3" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'json' ? 'bg-[#1C2331] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileJson className="h-3 w-3" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search & Export Toolbar */}
        <div className="flex items-center justify-between border-b border-[#21262D] bg-[#11161F] px-5 py-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter service, SKU, region..."
              className="w-full rounded-md border border-[#262C36] bg-[#0E131B] pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Sample'}</span>
          </button>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#21262D] text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">SKU Description</th>
                    <th className="py-2 px-3">Region</th>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3 text-right">Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2230] text-slate-300">
                  {filteredRows.slice(0, 150).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#161D27] transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                        {row.usage_start_time.split('T')[0]}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium text-white">
                        {row.service.description}
                      </td>
                      <td className="py-2 px-3 text-slate-400 max-w-xs truncate">
                        {row.sku.description}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                        {row.location.region}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                        {row.project.id}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-right font-medium text-white">
                        ${row.cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 150 && (
                <div className="text-center py-3 text-slate-500 text-xs font-mono">
                  Showing first 150 of {filteredRows.length} matching rows.
                </div>
              )}
            </div>
          ) : (
            <pre className="rounded-lg border border-[#21262D] bg-[#0A0D13] p-4 text-slate-300 leading-relaxed overflow-x-auto text-[11px]">
              {JSON.stringify(filteredRows.slice(0, 30), null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#21262D] px-5 py-2.5 bg-[#0E131B] text-xs text-slate-500 font-mono">
          <span>BigQuery Export Schema v1.0 standard representation</span>
          <button
            onClick={onClose}
            className="rounded-md border border-[#262C36] bg-[#141A23] px-3 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
