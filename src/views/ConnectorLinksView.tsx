import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Ban,
  Clock,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import { ConnectorKeySummary } from '../types';
import { revokeKey } from '../api';

interface ConnectorLinksViewProps {
  keys: ConnectorKeySummary[];
  onRefresh: () => void;
  onOpenCreateKey: () => void;
}

export const ConnectorLinksView: React.FC<ConnectorLinksViewProps> = ({
  keys,
  onRefresh,
  onOpenCreateKey,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredKeys = keys.filter((k) => {
    if (filter === 'active') return !k.revoked_at;
    if (filter === 'revoked') return !!k.revoked_at;
    return true;
  });

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this connector link? Once revoked, any client using this secret will receive a 404 and cannot access MCP tools.')) {
      return;
    }

    setRevokingId(id);
    try {
      await revokeKey(id);
      onRefresh();
    } catch (err: unknown) {
      alert(`Failed to revoke key: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyPrefix = (prefix: string, id: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Secure URL-Authenticated Connector Links
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Because some custom MCP clients cannot configure custom HTTP authentication headers, secrets are securely embedded into the URL path. Secrets are hashed using SHA-256 and never logged or exposed.
          </p>
        </div>

        <button
          onClick={onOpenCreateKey}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create Connector Link</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Links ({keys.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({keys.filter((k) => !k.revoked_at).length})
          </button>
          <button
            onClick={() => setFilter('revoked')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              filter === 'revoked'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revoked ({keys.filter((k) => !!k.revoked_at).length})
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Endpoint format: /connect/:scope/:secret/mcp</span>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Label & Scope</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4 text-right">Invocations</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No connector links matching filter.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => {
                  const isRevoked = !!k.revoked_at;
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Label & Scope */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              isRevoked
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{k.label}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Scope: <span className="text-slate-600">{k.scope}</span> · ID: {k.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Prefix */}
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => handleCopyPrefix(k.prefix, k.id)}
                          title="Click to copy prefix"
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <span>{k.prefix}</span>
                          {copiedId === k.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Invocations */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 font-medium">
                        {k.uses}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(k.created_at).toLocaleDateString()}{' '}
                        {new Date(k.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Last Used */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {k.last_used_at ? (
                          <>
                            {new Date(k.last_used_at).toLocaleDateString()}{' '}
                            {new Date(k.last_used_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Status (Unboxed text with bullet separator) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isRevoked ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              isRevoked ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {isRevoked ? 'Revoked' : 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevoke(k.id)}
                            disabled={revokingId === k.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                          >
                            <Ban className="w-3 h-3" />
                            <span>{revokingId === k.id ? 'Revoking...' : 'Revoke'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Revoked {new Date(k.revoked_at!).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Specification Details */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Invariant Rules</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
          <li>
            <strong>Minimum Entropy:</strong> Secrets generated with at least 32 cryptographically random bytes via <code className="text-slate-800">crypto.randomBytes(32)</code>.
          </li>
          <li>
            <strong>Hash-Only Persistence:</strong> Only SHA-256 hashes are stored. Plaintext secrets are never stored in databases or logs.
          </li>
          <li>
            <strong>Immediate Revocation:</strong> Revoked links return an uninformative HTTP 404 to avoid leaking valid secret existence.
          </li>
          <li>
            <strong>Scope Isolation:</strong> The <code className="text-slate-800">code</code> scope strictly restricts tools to predefined sample context files and message board operations.
          </li>
        </ul>
      </div>
    </div>
  );
};
