import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { ConnectorSettings, SystemHealth } from '../types';
import { updateSettings, resetDemoStore } from '../api';

interface SettingsViewProps {
  settings: ConnectorSettings | null;
  health: SystemHealth | null;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  health,
  onRefresh,
}) => {
  const [enabled, setEnabled] = useState(settings?.connector_enabled ?? true);
  const [rateLimit, setRateLimit] = useState(settings?.rate_limit_per_window ?? 120);
  const [rateWindow, setRateWindow] = useState(settings?.rate_window_minutes ?? 10);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings({
        connector_enabled: enabled,
        rate_limit_per_window: Number(rateLimit),
        rate_window_minutes: Number(rateWindow),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onRefresh();
    } catch (err: unknown) {
      alert(`Failed to save settings: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset demo storage back to initial seed state? This will restore the initial demonstration keys and sample board messages.')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDemoStore();
      alert('Demo data has been reset to initial seed state.');
      onRefresh();
    } catch (err: unknown) {
      alert(`Reset failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Gateway Policy & Rate Limiting Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure global access switches, sliding-window rate limit thresholds, and inspect runtime host telemetry.
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Settings className="w-4 h-4" />
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Toggle: Connector Access */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <label className="text-sm font-semibold text-slate-900 block">
              Enable MCP Connector Gateway
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              When disabled, all calls to <code className="text-slate-700">/connect/:scope/:secret/mcp</code> will immediately return HTTP 404.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-sm" />
          </button>
        </div>

        {/* Rate limit inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Max Calls per Window (Rate Limit)
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: 120 calls</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Window Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={rateWindow}
              onChange={(e) => setRateWindow(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: 10 minutes</span>
          </div>
        </div>

        {/* Save button row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <Check className="w-4 h-4" />
                <span>Settings updated successfully</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* System Health */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">System Telemetry & Health</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Runtime Status</span>
            <span className="text-emerald-700 font-bold capitalize">
              {health?.status || 'Operational'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Uptime</span>
            <span className="text-slate-800 font-bold tabular-nums">
              {health?.uptimeSeconds || 0}s
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Memory Heap</span>
            <span className="text-slate-800 font-bold tabular-nums">
              {health?.memoryUsageMb || 0} MB
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Node Version</span>
            <span className="text-slate-800 font-bold">{health?.nodeVersion || 'v22'}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Storage Adapter:{' '}
          <span className="text-slate-800 font-medium">
            {health?.storageAdapter || 'FileStorageAdapter (Atomic Write Queue)'}
          </span>
        </div>
      </div>

      {/* Danger Zone: Reset Demo Store */}
      <div className="p-6 bg-rose-50/50 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Reset Demo Store</span>
          </div>
          <p className="text-xs text-rose-600 mt-1">
            Restores the sample connector links, audit calls, and shared board messages to the clean initial seed state.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isResetting ? 'Resetting...' : 'Reset to Initial Seed'}</span>
        </button>
      </div>
    </div>
  );
};
