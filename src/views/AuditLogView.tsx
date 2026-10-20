import React, { useState } from 'react';
import {
  FileCode2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ConnectorCallRecord } from '../types';

interface AuditLogViewProps {
  calls: ConnectorCallRecord[];
  onRefresh: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ calls, onRefresh: _onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedCall, setSelectedCall] = useState<ConnectorCallRecord | null>(null);

  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      c.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.connector_label && c.connector_label.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'success') return c.ok;
    if (statusFilter === 'failed') return !c.ok;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Tool-Call Audit Log & Compliance Record
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Append-only record of every tool invoked through the MCP endpoint. Tool response bodies and connector secrets are strictly excluded from audit records, and all arguments are redacted.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Response Body Storage Enforced</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tool or connector label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({calls.length})
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'success'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Success ({calls.filter((c) => c.ok).length})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'failed'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Failed ({calls.filter((c) => !c.ok).length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Tool Name</th>
                <th className="py-3 px-4">Connector Link</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Safe Arguments Preview</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No tool call records found.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => {
                  const safeArgsStr = JSON.stringify(c.safe_arguments);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}{' '}
                        {new Date(c.created_at).toLocaleTimeString()}
                      </td>

                      {/* Tool Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileCode2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-mono font-semibold text-slate-900">
                            {c.tool}
                          </span>
                        </div>
                      </td>

                      {/* Connector Link */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium truncate max-w-[180px]">
                        {c.connector_label || c.connector_key_id}
                      </td>

                      {/* Result */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.ok ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700 font-medium">Success</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="text-rose-700 font-medium">
                                Failed ({c.error_message?.slice(0, 30) || 'Error'})
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Safe Arguments Preview */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {safeArgsStr === '{}' ? (
                          <span className="text-slate-400 italic">No arguments</span>
                        ) : (
                          safeArgsStr
                        )}
                      </td>

                      {/* Inspect */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for detail view */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Tool Invocation Audit Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">Call ID</span>
                  <span className="text-slate-800 font-medium">{selectedCall.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tool</span>
                  <span className="text-slate-800 font-medium">{selectedCall.tool}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Connector Link</span>
                  <span className="text-slate-800 truncate block">
                    {selectedCall.connector_label || selectedCall.connector_key_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timestamp</span>
                  <span className="text-slate-800">{new Date(selectedCall.created_at).toISOString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Safe Arguments (Sanitized & Redacted)
                </label>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-56">
                  {JSON.stringify(selectedCall.safe_arguments, null, 2)}
                </pre>
              </div>

              {selectedCall.error_message && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Recorded Error
                  </label>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-mono text-[11px]">
                    {selectedCall.error_message}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Notice: Response payloads are purposefully omitted per security specification.</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
