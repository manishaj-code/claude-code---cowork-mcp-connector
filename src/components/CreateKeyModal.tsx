import React, { useState } from 'react';
import { X, Copy, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { createKey } from '../api';
import { CreatedKeyResult } from '../types';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyCreated: () => void;
}

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyCreated,
}) => {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState('code');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedKeyResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createKey(label.trim(), scope);
      setResult(res);
      onKeyCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create connector key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!result?.connector_url) return;
    navigator.clipboard.writeText(result.connector_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setLabel('');
    setScope('code');
    setResult(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {result ? 'Connector Link Created' : 'Create New Connector Link'}
              </h2>
              <p className="text-xs text-slate-500">
                {result
                  ? 'Copy and save the full URL. It will not be shown again.'
                  : 'Generate a cryptographically secured MCP connector endpoint.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {!result ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Connector Label / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claude Code Developer Link (Terminal)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value="code">code (Sample context read-only + Shared Board)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Restricts access to sample repository inspection, demo reports, and message board.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !label.trim()}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Secure Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Security Warning */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-medium">Secret Stored as Cryptographic Hash</p>
                  <p>
                    For zero-knowledge security, the server stores only a SHA-256 hash. This complete URL is shown exactly once and cannot be retrieved again.
                  </p>
                </div>
              </div>

              {/* URL Box */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Connector URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.connector_url}
                    className="flex-1 px-3 py-2 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Details table */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID:</span>
                  <span className="text-slate-800">{result.key.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prefix:</span>
                  <span className="text-slate-800">{result.key.prefix}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scope:</span>
                  <span className="text-slate-800">{result.key.scope}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Done (I Have Saved the URL)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
