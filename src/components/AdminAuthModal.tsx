import React, { useState } from 'react';
import { X, Key, Check, ShieldCheck } from 'lucide-react';
import { getAdminKey, setAdminKey, DEFAULT_ADMIN_KEY } from '../api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [keyInput, setKeyInput] = useState(getAdminKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(keyInput.trim() || DEFAULT_ADMIN_KEY);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSuccess();
      onClose();
    }, 800);
  };

  const handleRestoreDefault = () => {
    setKeyInput(DEFAULT_ADMIN_KEY);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Admin Dashboard Authentication</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600">
            Admin endpoints (<code className="text-slate-800">/api/admin/*</code>) require the{' '}
            <code className="text-slate-800">x-admin-key</code> header. The demo environment defaults to{' '}
            <code className="text-indigo-600 font-semibold">{DEFAULT_ADMIN_KEY}</code>.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Active Admin Key / Bearer Token
            </label>
            <input
              type="text"
              required
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRestoreDefault}
              className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
            >
              Restore Demo Default Key
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Admin Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
